export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
]);

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
]);

/**
 * Validates an uploaded image file's extension, MIME type, and size.
 */
export function validateImageFile(
  file: { name: string; type: string; size: number },
  maxSizeMB = 10
): ImageValidationResult {
  if (!file || !file.name) {
    return { valid: false, error: 'Please select a valid image file.' };
  }

  const lowerName = file.name.trim().toLowerCase();
  const dotIdx = lowerName.lastIndexOf('.');
  const ext = dotIdx >= 0 ? lowerName.slice(dotIdx) : '';

  if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: 'Unsupported file format. Please upload a PNG, JPG, WEBP, or GIF image.',
    };
  }

  if (file.type && !ALLOWED_IMAGE_MIME_TYPES.has(file.type.toLowerCase())) {
    return {
      valid: false,
      error: 'Invalid image MIME type. Please upload a PNG, JPG, WEBP, or GIF image.',
    };
  }

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size <= 0) {
    return { valid: false, error: 'Selected image file is empty.' };
  }
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `Image exceeds the ${maxSizeMB} MB upload limit.`,
    };
  }

  return { valid: true };
}

export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Reads a user-selected File from disk and optimizes/resizes it client-side
 * so it can be stored directly in Firestore user/community profiles and rendered immediately.
 */
export async function readAndCompressImageFile(
  file: File,
  options: CompressImageOptions = {}
): Promise<string> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid image file.');
  }

  const maxWidth = options.maxWidth ?? 512;
  const maxHeight = options.maxHeight ?? 512;
  const quality = options.quality ?? 0.86;

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read image file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });

  // Preserve animated GIFs directly if they are already compact (< 350 KB)
  if (file.type === 'image/gif' && file.size <= 350 * 1024) {
    return rawDataUrl;
  }

  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        let targetWidth = img.naturalWidth || img.width || maxWidth;
        let targetHeight = img.naturalHeight || img.height || maxHeight;

        if (targetWidth > maxWidth || targetHeight > maxHeight) {
          const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
          targetWidth = Math.max(1, Math.round(targetWidth * ratio));
          targetHeight = Math.max(1, Math.round(targetHeight * ratio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Prefer WebP for transparency + compact size, fallback to PNG/JPEG
        let compressed = canvas.toDataURL('image/webp', quality);
        if (!compressed.startsWith('data:image/webp')) {
          compressed =
            file.type === 'image/png'
              ? canvas.toDataURL('image/png')
              : canvas.toDataURL('image/jpeg', quality);
        }
        resolve(compressed);
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Failed to process image.'));
      }
    };
    img.onerror = () => reject(new Error('Could not decode the selected image file.'));
    img.src = rawDataUrl;
  });
}
