/**
 * Mengonversi URL lampiran (baik URL Backblaze B2 langsung, path internal, atau URL relatif)
 * menjadi URL endpoint proxy internal yang terotorisasi agar gambar dapat ditampilkan langsung
 * tanpa mengalami error 401 Unauthorized.
 */
export function getEvidenceViewUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Jika sudah merupakan endpoint proxy internal
  if (trimmed.startsWith('/api/storage/file/')) {
    return trimmed;
  }

  // Jika merupakan URL Backblaze B2 langsung (misal: https://f004.backblazeb2.com/file/PSDM-B2/evidence/xxx.jpg)
  const b2Match = trimmed.match(/\/file\/[^/]+\/(evidence\/.+)$/);
  if (b2Match) {
    return `/api/storage/file/${b2Match[1]}`;
  }

  // Jika hanya berupa key relative (misal: evidence/xxx.jpg)
  if (trimmed.startsWith('evidence/')) {
    return `/api/storage/file/${trimmed}`;
  }

  // URL eksternal lainnya
  return trimmed;
}
