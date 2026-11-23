/**
 * Client-side high-performance image compression and thumbnail generation
 * Resizes images to max 1200px, converts to WebP, and keeps file size under ~200KB.
 * Also generates a small WebP thumbnail (max 400px, ~30KB) for fast product card rendering.
 * Does NOT rely on paid CDN or cloud transformation features.
 */

export interface CompressedImageResult {
  file: File;
  previewUrl: string;
  thumbnailFile?: File;
  thumbnailPreviewUrl?: string;
}

export async function compressImageClient(
  file: File,
  options: {
    maxDimension?: number;
    quality?: number;
    generateThumbnail?: boolean;
    thumbMaxDimension?: number;
  } = {}
): Promise<CompressedImageResult> {
  const maxDimension = options.maxDimension || 1200;
  const quality = options.quality ?? 0.82;
  const generateThumbnail = options.generateThumbnail ?? true;
  const thumbMaxDimension = options.thumbMaxDimension || 400;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = async () => {
        try {
          // 1. Calculate main dimensions (max 1200px)
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          // 2. Draw on canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ file, previewUrl: e.target?.result as string });
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // 3. Convert to WebP blob
          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const mainBlob = await new Promise<Blob | null>((res) =>
            canvas.toBlob((b) => res(b), 'image/webp', quality)
          );

          const finalBlob = mainBlob || file;
          const compressedFile = new File([finalBlob], `${baseName}.webp`, {
            type: 'image/webp',
          });
          const previewUrl = URL.createObjectURL(finalBlob);

          // 4. Generate thumbnail if requested (max 400px)
          let thumbnailFile: File | undefined;
          let thumbnailPreviewUrl: string | undefined;

          if (generateThumbnail) {
            let tWidth = img.width;
            let tHeight = img.height;
            if (tWidth > thumbMaxDimension || tHeight > thumbMaxDimension) {
              if (tWidth > tHeight) {
                tHeight = Math.round((tHeight * thumbMaxDimension) / tWidth);
                tWidth = thumbMaxDimension;
              } else {
                tWidth = Math.round((tWidth * thumbMaxDimension) / tHeight);
                tHeight = thumbMaxDimension;
              }
            }

            const tCanvas = document.createElement('canvas');
            tCanvas.width = tWidth;
            tCanvas.height = tHeight;
            const tCtx = tCanvas.getContext('2d');
            if (tCtx) {
              tCtx.imageSmoothingEnabled = true;
              tCtx.imageSmoothingQuality = 'medium';
              tCtx.drawImage(img, 0, 0, tWidth, tHeight);

              const thumbBlob = await new Promise<Blob | null>((res) =>
                tCanvas.toBlob((b) => res(b), 'image/webp', 0.75)
              );

              if (thumbBlob) {
                thumbnailFile = new File([thumbBlob], `${baseName}-thumb.webp`, {
                  type: 'image/webp',
                });
                thumbnailPreviewUrl = URL.createObjectURL(thumbBlob);
              }
            }
          }

          resolve({
            file: compressedFile,
            previewUrl,
            thumbnailFile,
            thumbnailPreviewUrl,
          });
        } catch (canvasErr) {
          console.warn('Canvas compression error, using original file:', canvasErr);
          resolve({ file, previewUrl: e.target?.result as string });
        }
      };

      img.onerror = () => {
        resolve({ file, previewUrl: e.target?.result as string });
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
