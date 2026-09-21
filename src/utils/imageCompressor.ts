/**
 * Utilitas kompresi gambar di sisi klien sebelum diunggah ke Backblaze B2.
 * Mengurangi ukuran file hingga 90-95% (e.g. 5-10 MB foto HP menjadi ~150-250 KB)
 * tanpa mengurangi keterbacaan teks surat keterangan/bukti izin.
 */

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  ratio: number; // Persentase penghematan (misal: 95%)
}

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.85 = 85%
  format?: 'image/webp' | 'image/jpeg';
}

export async function compressImageFile(
  file: File,
  options: CompressOptions = {}
): Promise<CompressionResult> {
  const originalSize = file.size;

  // Jika bukan berkas gambar (misal dokumen PDF), jangan dikompres
  if (!file.type.startsWith('image/')) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      ratio: 0,
    };
  }

  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.85,
    format = 'image/webp',
  } = options;

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // 1. Skala dimensi proporsional agar foto resolusi raksasa (e.g. 4000x3000)
      //    di-resize ke resolusi ideal yang tetap sangat tajam dibaca
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback jika canvas gagal diinisialisasi
        return resolve({
          file,
          originalSize,
          compressedSize: originalSize,
          ratio: 0,
        });
      }

      // Kualitas rendering canvas tingkat tinggi
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // 2. Konversi ke format WebP (atau JPEG) dengan kualitas 85%
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return resolve({
              file,
              originalSize,
              compressedSize: originalSize,
              ratio: 0,
            });
          }

          // Gunakan ekstensi yang sesuai
          const ext = format === 'image/webp' ? 'webp' : 'jpg';
          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const compressedFile = new File([blob], `${baseName}.${ext}`, {
            type: format,
            lastModified: Date.now(),
          });

          // Jika ukuran kompresi lebih besar daripada file asli (kasus gambar kecil/ikon), pakai file asli
          if (compressedFile.size >= originalSize) {
            return resolve({
              file,
              originalSize,
              compressedSize: originalSize,
              ratio: 0,
            });
          }

          const ratio = Math.round(((originalSize - compressedFile.size) / originalSize) * 100);

          resolve({
            file: compressedFile,
            originalSize,
            compressedSize: compressedFile.size,
            ratio,
          });
        },
        format,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        file,
        originalSize,
        compressedSize: originalSize,
        ratio: 0,
      });
    };

    img.src = objectUrl;
  });
}

/**
 * Format bytes ke string yang mudah dibaca (KB / MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
