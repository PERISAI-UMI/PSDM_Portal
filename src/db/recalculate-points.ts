import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

async function recalculatePoints() {
  console.log('=== MEMULAI REKALKULASI POIN PRESENSI BERDASARKAN KATEGORI KEGIATAN ===');
  console.log(`Database: ${url}`);

  const client = createClient({ url, authToken });

  // 1. Cek daftar kegiatan dan kategorinya saat ini
  const activitiesQuery = await client.execute(`
    SELECT 
      a.id AS activity_id, 
      a.nama AS activity_name, 
      a.category_id,
      ac.nama AS category_name,
      ac.hadir_points,
      ac.izin_points,
      ac.sakit_points,
      ac.alpha_points,
      ac.telat_points,
      COUNT(att.id) AS attendance_count
    FROM activities a
    LEFT JOIN activity_categories ac ON a.category_id = ac.id
    LEFT JOIN attendances att ON a.id = att.activity_id
    GROUP BY a.id;
  `);

  console.log('\n--- DAFTAR KEGIATAN & KATEGORI SAAT INI ---');
  console.table(activitiesQuery.rows.map((r: any) => ({
    'Nama Kegiatan': r.activity_name,
    'Kategori': r.category_name || '(BELUM DISALURKAN)',
    'Hadir': r.hadir_points,
    'Alpha': r.alpha_points,
    'Telat': r.telat_points,
    'Jml Absensi': r.attendance_count,
  })));

  // 2. Ambil total rekaman absensi sebelum update
  const totalAtt = await client.execute('SELECT COUNT(*) as count FROM attendances;');
  console.log(`\nTotal rekaman absensi yang akan disesuaikan: ${totalAtt.rows[0]?.count}`);

  // 3. Jalankan pembaruan poin secara presisi
  // Update awarded_points berdasarkan status dan bobot kategori kegiatan
  const updateResult = await client.execute(`
    UPDATE attendances
    SET awarded_points = (
      SELECT CASE attendances.status
        WHEN 'HADIR' THEN COALESCE(ac.hadir_points, 3)
        WHEN 'IZIN' THEN COALESCE(ac.izin_points, 0)
        WHEN 'SAKIT' THEN COALESCE(ac.sakit_points, 0)
        WHEN 'ALPHA' THEN COALESCE(ac.alpha_points, -5)
        WHEN 'TELAT' THEN COALESCE(ac.telat_points, -1)
        ELSE 0
      END
      FROM activities a
      LEFT JOIN activity_categories ac ON a.category_id = ac.id
      WHERE a.id = attendances.activity_id
    )
    WHERE EXISTS (
      SELECT 1 FROM activities a WHERE a.id = attendances.activity_id
    );
  `);

  console.log(`\n✓ Rekalkulasi selesai! Baris terpengaruh: ${updateResult.rowsAffected}`);

  // 4. Verifikasi ringkasan poin baru per status absensi
  const summaryQuery = await client.execute(`
    SELECT 
      ac.nama AS category_name,
      att.status,
      att.awarded_points,
      COUNT(att.id) AS count,
      SUM(att.awarded_points) AS total_points
    FROM attendances att
    JOIN activities a ON att.activity_id = a.id
    LEFT JOIN activity_categories ac ON a.category_id = ac.id
    GROUP BY ac.nama, att.status, att.awarded_points
    ORDER BY ac.nama, att.status;
  `);

  console.log('\n--- RINGKASAN DISTRIBUSI POIN TERBARU ---');
  console.table(summaryQuery.rows);

  // 5. Cek Top 5 Leaderboard setelah rekalkulasi
  const topUsers = await client.execute(`
    SELECT 
      u.nama_lengkap,
      u.prn,
      d.nama AS departemen,
      COALESCE(SUM(att.awarded_points), 0) AS total_poin,
      COUNT(att.id) AS total_kehadiran
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN attendances att ON u.id = att.user_id
    WHERE u.role = 'PENGURUS'
    GROUP BY u.id
    ORDER BY total_poin DESC
    LIMIT 5;
  `);

  console.log('\n--- TOP 5 LEADERBOARD PENGURUS SETELAH PENYESUAIAN ---');
  console.table(topUsers.rows);

  console.log('\n✓ Rekalkulasi poin berhasil 100%!');
}

recalculatePoints().catch((err) => {
  console.error('Error saat rekalkulasi poin:', err);
  process.exit(1);
});
