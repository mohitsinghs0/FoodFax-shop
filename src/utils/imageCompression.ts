/**
 * FoodFax Client-Side Image & Document Compression Utility
 * 
 * Automatically compresses high-resolution camera photos (KYC documents, dish photos, shop logos/banners)
 * directly in the merchant's browser before network upload:
 * - Reduces 5MB-15MB smartphone photos down to ~200KB-600KB
 * - Preserves fine text legibility on Aadhaar, PAN, FSSAI, and GST certificates
 * - Prevents upload timeouts on slow stall/outdoor 3G/4G connections
 * - Saves merchant bandwidth and storage egress
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default 0.82)
  maxSizeBytes?: number; // Target size threshold (default 1.5MB)
  mimeType?: 'image/jpeg' | 'image/webp' | 'image/png';
}

export interface CompressionResult {
  file: File;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  compressionRatio: number; // Percentage saved (e.g. 78%)
  wasCompressed: boolean;
}

/**
 * Formats bytes to readable string (e.g. "1.2 MB" or "450 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Compresses an image File using HTML5 Canvas with adaptive dimension scaling.
 * If the file is a PDF or already small, it returns the original file untouched.
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.82,
    maxSizeBytes = 1.5 * 1024 * 1024, // 1.5MB threshold
    mimeType = 'image/jpeg',
  } = options;

  const originalSizeBytes = file.size;

  // If not an image (e.g. PDF document), return original file without modification
  if (!file.type.startsWith('image/')) {
    return {
      file,
      originalSizeBytes,
      compressedSizeBytes: originalSizeBytes,
      compressionRatio: 0,
      wasCompressed: false,
    };
  }

  // If already under threshold and dimensions are likely small, skip compression
  if (file.size <= 200 * 1024 && file.type === 'image/jpeg') {
    return {
      file,
      originalSizeBytes,
      compressedSizeBytes: originalSizeBytes,
      compressionRatio: 0,
      wasCompressed: false,
    };
  }

  return new Promise((resolve) => {
    // Check if FileReader and Image are available (Browser environment)
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return resolve({
        file,
        originalSizeBytes,
        compressedSizeBytes: originalSizeBytes,
        compressionRatio: 0,
        wasCompressed: false,
      });
    }

    const reader = new FileReader();
    reader.onerror = () => {
      resolve({
        file,
        originalSizeBytes,
        compressedSizeBytes: originalSizeBytes,
        compressionRatio: 0,
        wasCompressed: false,
      });
    };

    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => {
        resolve({
          file,
          originalSizeBytes,
          compressedSizeBytes: originalSizeBytes,
          compressionRatio: 0,
          wasCompressed: false,
        });
      };

      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect ratio preserving downscale
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({
            file,
            originalSizeBytes,
            compressedSizeBytes: originalSizeBytes,
            compressionRatio: 0,
            wasCompressed: false,
          });
        }

        // Fill white background for transparent PNGs converted to JPEG
        if (mimeType === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        // Smooth bicubic resampling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve({
                file,
                originalSizeBytes,
                compressedSizeBytes: originalSizeBytes,
                compressionRatio: 0,
                wasCompressed: false,
              });
            }

            // Only use compressed blob if it actually reduced the file size
            if (blob.size < originalSizeBytes || originalSizeBytes > maxSizeBytes) {
              const ext = mimeType === 'image/webp' ? 'webp' : 'jpg';
              const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
              const compressedFileName = `${baseName}.${ext}`;

              const compressedFile = new File([blob], compressedFileName, {
                type: mimeType,
                lastModified: Date.now(),
              });

              const savedBytes = Math.max(0, originalSizeBytes - blob.size);
              const ratio = Math.round((savedBytes / originalSizeBytes) * 100);

              resolve({
                file: compressedFile,
                originalSizeBytes,
                compressedSizeBytes: blob.size,
                compressionRatio: ratio,
                wasCompressed: true,
              });
            } else {
              resolve({
                file,
                originalSizeBytes,
                compressedSizeBytes: originalSizeBytes,
                compressionRatio: 0,
                wasCompressed: false,
              });
            }
          },
          mimeType,
          quality
        );
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

