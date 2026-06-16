/**
 * Advanced image compression utility with quality preservation
 * Handles client-side compression before upload to minimize storage impact
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  format?: 'jpeg' | 'webp' | 'png';
  preserveAspectRatio?: boolean;
}

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  originalDimensions: { width: number; height: number };
  compressedDimensions: { width: number; height: number };
  thumbnail: File;
}

/**
 * Compress an image file with intelligent quality preservation
 */
export async function compressImage(
  file: File, 
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.85,
    format = 'jpeg',
    preserveAspectRatio = true
  } = options;

  return new Promise((resolve, reject) => {
    const img = new (globalThis.Image || window.Image)();
    
    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Calculate optimal dimensions
        const { width: newWidth, height: newHeight } = calculateOptimalDimensions(
          img.naturalWidth, 
          img.naturalHeight, 
          maxWidth, 
          maxHeight, 
          preserveAspectRatio
        );

        // Set canvas dimensions
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Apply image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw and compress the image
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Get the optimal MIME type
        const mimeType = format === 'png' ? 'image/png' : 
                        format === 'webp' ? 'image/webp' : 'image/jpeg';

        // Convert to blob with quality
        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          // Create compressed file
          const compressedFile = new File([blob], file.name, { type: mimeType });
          
          // Generate thumbnail
          const thumbnail = await generateThumbnail(canvas, file.name);
          
          // Calculate compression metrics
          const originalSize = file.size;
          const compressedSize = compressedFile.size;
          const compressionRatio = compressedSize / originalSize;

          resolve({
            compressedFile,
            originalSize,
            compressedSize,
            compressionRatio,
            originalDimensions: { width: img.naturalWidth, height: img.naturalHeight },
            compressedDimensions: { width: newWidth, height: newHeight },
            thumbnail
          });
        }, mimeType, quality);
        
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate a small thumbnail for preview
 */
async function generateThumbnail(sourceCanvas: HTMLCanvasElement, fileName: string): Promise<File> {
  const thumbnailCanvas = document.createElement('canvas');
  const ctx = thumbnailCanvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Thumbnail canvas context not available');
  }

  // Thumbnail dimensions (150x150 max)
  const thumbSize = 150;
  const { width: thumbWidth, height: thumbHeight } = calculateOptimalDimensions(
    sourceCanvas.width, 
    sourceCanvas.height, 
    thumbSize, 
    thumbSize, 
    true
  );

  thumbnailCanvas.width = thumbWidth;
  thumbnailCanvas.height = thumbHeight;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, 0, 0, thumbWidth, thumbHeight);

  return new Promise((resolve, reject) => {
    thumbnailCanvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to generate thumbnail'));
        return;
      }
      
      const thumbnailFile = new File([blob], `thumb_${fileName}`, { type: 'image/jpeg' });
      resolve(thumbnailFile);
    }, 'image/jpeg', 0.8);
  });
}

/**
 * Calculate optimal dimensions while preserving aspect ratio
 */
function calculateOptimalDimensions(
  originalWidth: number, 
  originalHeight: number, 
  maxWidth: number, 
  maxHeight: number, 
  preserveAspectRatio: boolean = true
): { width: number; height: number } {
  if (!preserveAspectRatio) {
    return { width: maxWidth, height: maxHeight };
  }

  const aspectRatio = originalWidth / originalHeight;
  
  let newWidth = originalWidth;
  let newHeight = originalHeight;

  // Scale down if larger than maximum dimensions
  if (originalWidth > maxWidth) {
    newWidth = maxWidth;
    newHeight = newWidth / aspectRatio;
  }
  
  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = newHeight * aspectRatio;
  }

  return { 
    width: Math.round(newWidth), 
    height: Math.round(newHeight) 
  };
}

/**
 * Calculate image resolution percentage based on common standards
 */
export function calculateResolutionPercentage(width: number, height: number): number {
  const totalPixels = width * height;
  const fullHDPixels = 1920 * 1080; // 2,073,600 pixels
  
  // Calculate percentage with a more sophisticated algorithm
  const basePercentage = (totalPixels / fullHDPixels) * 100;
  
  // Apply quality modifiers based on resolution tiers
  let qualityMultiplier = 1;
  
  if (totalPixels >= 3840 * 2160) { // 4K+
    qualityMultiplier = 1.2;
  } else if (totalPixels >= 2560 * 1440) { // 2K
    qualityMultiplier = 1.1;
  } else if (totalPixels >= 1920 * 1080) { // Full HD
    qualityMultiplier = 1.0;
  } else if (totalPixels >= 1280 * 720) { // HD
    qualityMultiplier = 0.9;
  }
  
  return Math.min(100, Math.round(basePercentage * qualityMultiplier));
}

/**
 * Validate image quality and provide recommendations
 */
export function validateImageQuality(width: number, height: number, fileSize: number): {
  isValid: boolean;
  resolutionPercentage: number;
  recommendations: string[];
} {
  const resolutionPercentage = calculateResolutionPercentage(width, height);
  const recommendations: string[] = [];
  
  if (resolutionPercentage < 80) {
    recommendations.push('Image resolution is below 80% minimum requirement');
    recommendations.push('Consider using a higher resolution image (1280x720 or better)');
  }
  
  if (fileSize > 10 * 1024 * 1024) { // 10MB
    recommendations.push('File size is too large (over 10MB)');
    recommendations.push('Image will be automatically compressed');
  }
  
  if (width < 800 || height < 600) {
    recommendations.push('Image dimensions are quite small');
    recommendations.push('Consider using a larger image for better quality');
  }
  
  return {
    isValid: resolutionPercentage >= 80 && fileSize <= 10 * 1024 * 1024,
    resolutionPercentage,
    recommendations
  };
}

/**
 * Smart compression based on image characteristics
 */
export async function smartCompress(file: File): Promise<CompressionResult> {
  const img = new (globalThis.Image || window.Image)();
  const objectUrl = URL.createObjectURL(file);
  img.src = objectUrl;
  
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(new Error('Failed to load image'));
    setTimeout(() => reject(new Error('Image load timeout')), 10000);
  });
  
  const width = img.naturalWidth;
  const height = img.naturalHeight;
  const fileSize = file.size;
  
  // Determine optimal compression settings
  let compressionOptions: CompressionOptions = {
    quality: 0.85,
    preserveAspectRatio: true
  };
  
  // Adjust based on image size and quality
  if (fileSize > 5 * 1024 * 1024) { // 5MB+
    compressionOptions.quality = 0.75;
    compressionOptions.maxWidth = 1600;
    compressionOptions.maxHeight = 1200;
  } else if (fileSize > 2 * 1024 * 1024) { // 2MB+
    compressionOptions.quality = 0.80;
    compressionOptions.maxWidth = 1800;
    compressionOptions.maxHeight = 1350;
  }
  
  // Adjust for very high resolution images
  if (width > 3000 || height > 3000) {
    compressionOptions.maxWidth = 1920;
    compressionOptions.maxHeight = 1440;
  }
  
  URL.revokeObjectURL(objectUrl);
  return compressImage(file, compressionOptions);
}