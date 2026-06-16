/**
 * Compression utilities for efficient photo and video data storage
 * Provides compression/decompression for URLs, metadata, and other text data
 */

import { gzipSync, gunzipSync } from 'zlib';

export interface CompressionResult {
  compressed: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  spaceSaved: number;
}

export interface DecompressionResult {
  decompressed: string;
  originalSize: number;
}

/**
 * Compress text data for database storage
 */
export function compressTextData(text: string): CompressionResult {
  if (!text || text.length === 0) {
    return {
      compressed: '',
      originalSize: 0,
      compressedSize: 0,
      compressionRatio: 100,
      spaceSaved: 0
    };
  }

  const originalBuffer = Buffer.from(text, 'utf8');
  const compressedBuffer = gzipSync(originalBuffer);
  
  const originalSize = originalBuffer.length;
  const compressedSize = compressedBuffer.length;
  const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;
  const spaceSaved = originalSize - compressedSize;

  return {
    compressed: compressedBuffer.toString('base64'),
    originalSize,
    compressedSize,
    compressionRatio: Math.round(compressionRatio * 100) / 100,
    spaceSaved
  };
}

/**
 * Decompress text data from database storage
 */
export function decompressTextData(compressedData: string): DecompressionResult {
  if (!compressedData || compressedData.length === 0) {
    return {
      decompressed: '',
      originalSize: 0
    };
  }

  try {
    const compressedBuffer = Buffer.from(compressedData, 'base64');
    const decompressedBuffer = gunzipSync(compressedBuffer);
    const decompressed = decompressedBuffer.toString('utf8');

    return {
      decompressed,
      originalSize: decompressedBuffer.length
    };
  } catch (error) {
    console.error('Decompression error:', error);
    // Fallback: assume data is not compressed
    return {
      decompressed: compressedData,
      originalSize: compressedData.length
    };
  }
}

/**
 * Compress photo/video URLs and paths
 */
export function compressMediaUrls(photoUrl: string, photoPath: string, thumbnailUrl?: string): {
  compressedPhotoUrl: string;
  compressedPhotoPath: string;
  compressedThumbnailUrl: string;
  urlCompressionStats: CompressionResult;
} {
  const combinedUrls = JSON.stringify({
    photoUrl,
    photoPath,
    thumbnailUrl: thumbnailUrl || ''
  });

  const compressionResult = compressTextData(combinedUrls);

  return {
    compressedPhotoUrl: compressionResult.compressed,
    compressedPhotoPath: '', // Will be stored in compressed format
    compressedThumbnailUrl: '', // Will be stored in compressed format
    urlCompressionStats: compressionResult
  };
}

/**
 * Decompress photo/video URLs and paths
 */
export function decompressMediaUrls(compressedData: string): {
  photoUrl: string;
  photoPath: string;
  thumbnailUrl: string;
} {
  const decompressed = decompressTextData(compressedData);
  
  try {
    const urlData = JSON.parse(decompressed.decompressed);
    return {
      photoUrl: urlData.photoUrl || '',
      photoPath: urlData.photoPath || '',
      thumbnailUrl: urlData.thumbnailUrl || ''
    };
  } catch (error) {
    console.error('URL decompression error:', error);
    return {
      photoUrl: '',
      photoPath: '',
      thumbnailUrl: ''
    };
  }
}

/**
 * Compress metadata for storage
 */
export function compressMetadata(metadata: any): string {
  if (!metadata) return '';
  
  const metadataString = typeof metadata === 'string' ? metadata : JSON.stringify(metadata);
  const compressionResult = compressTextData(metadataString);
  
  return compressionResult.compressed;
}

/**
 * Decompress metadata from storage
 */
export function decompressMetadata(compressedMetadata: string): any {
  if (!compressedMetadata) return null;
  
  const decompressed = decompressTextData(compressedMetadata);
  
  try {
    return JSON.parse(decompressed.decompressed);
  } catch (error) {
    console.error('Metadata decompression error:', error);
    return decompressed.decompressed;
  }
}

/**
 * Compress tags for efficient storage
 */
export function compressTags(tags: string): string {
  if (!tags) return '';
  
  const compressionResult = compressTextData(tags);
  return compressionResult.compressed;
}

/**
 * Decompress tags from storage
 */
export function decompressTags(compressedTags: string): string {
  if (!compressedTags) return '';
  
  const decompressed = decompressTextData(compressedTags);
  return decompressed.decompressed;
}

/**
 * Get compression statistics for a collection of photos
 */
export function getCompressionStats(photos: any[]): {
  totalPhotos: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
  averageCompressionRatio: number;
  totalSpaceSaved: number;
} {
  let totalOriginalSize = 0;
  let totalCompressedSize = 0;
  
  photos.forEach(photo => {
    // Add URL compression savings
    if (photo.photoUrl) {
      const urlTest = compressTextData(photo.photoUrl + photo.photoPath + (photo.thumbnailUrl || ''));
      totalOriginalSize += urlTest.originalSize;
      totalCompressedSize += urlTest.compressedSize;
    }
    
    // Add metadata compression savings
    if (photo.metadata) {
      const metaTest = compressTextData(photo.metadata);
      totalOriginalSize += metaTest.originalSize;
      totalCompressedSize += metaTest.compressedSize;
    }
    
    // Add tags compression savings
    if (photo.tags) {
      const tagsTest = compressTextData(photo.tags);
      totalOriginalSize += tagsTest.originalSize;
      totalCompressedSize += tagsTest.compressedSize;
    }
  });

  const averageCompressionRatio = totalOriginalSize > 0 
    ? ((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100 
    : 0;

  return {
    totalPhotos: photos.length,
    totalOriginalSize,
    totalCompressedSize,
    averageCompressionRatio: Math.round(averageCompressionRatio * 100) / 100,
    totalSpaceSaved: totalOriginalSize - totalCompressedSize
  };
}