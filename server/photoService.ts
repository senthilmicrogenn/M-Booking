/**
 * Photo Service for handling compressed room photos
 * Provides quality-preserving decompression and optimized serving
 */

import { storage } from "./storage";
import type { RoomPhoto } from "@shared/schema";

export interface PhotoServeOptions {
  quality?: 'thumbnail' | 'compressed' | 'original';
  format?: 'webp' | 'jpeg' | 'png';
  maxWidth?: number;
  maxHeight?: number;
}

export interface PhotoMetadata {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  dimensions: {
    original: { width: number; height: number };
    compressed: { width: number; height: number };
  };
  format: string;
  quality: number;
}

export class PhotoService {
  
  /**
   * Get room photos by room type with compression information
   */
  async getRoomPhotosWithMetadata(roomTypeId: number): Promise<RoomPhoto[]> {
    const photos = await storage.getRoomPhotosByRoomType(roomTypeId);
    return photos.map(photo => ({
      ...photo,
      // Calculate storage savings
      compressionSavings: photo.compressionRatio ? 
        Math.round((1 - parseFloat(photo.compressionRatio.toString())) * 100) : 0
    }));
  }

  /**
   * Get photos by group with compression analytics
   */
  async getPhotosByGroup(roomTypeId: number, photoGroup: string): Promise<RoomPhoto[]> {
    const photos = await storage.getRoomPhotosByGroup(roomTypeId, photoGroup);
    return photos.map(photo => ({
      ...photo,
      compressionSavings: photo.compressionRatio ? 
        Math.round((1 - parseFloat(photo.compressionRatio.toString())) * 100) : 0
    }));
  }

  /**
   * Get photo metadata for compression analytics
   */
  getPhotoMetadata(photo: RoomPhoto): PhotoMetadata {
    const originalDimensions = this.parseDimensions(photo.originalResolution);
    const compressedDimensions = this.parseDimensions(photo.compressedResolution);
    
    return {
      originalSize: photo.originalFileSize || 0,
      compressedSize: photo.compressedFileSize || photo.originalFileSize || 0,
      compressionRatio: parseFloat(photo.compressionRatio?.toString() || '1.0'),
      dimensions: {
        original: originalDimensions,
        compressed: compressedDimensions
      },
      format: photo.mimeType || 'image/jpeg',
      quality: photo.compressionQuality || 85
    };
  }

  /**
   * Get compression statistics for a room type
   */
  async getCompressionStats(roomTypeId: number): Promise<{
    totalPhotos: number;
    totalOriginalSize: number;
    totalCompressedSize: number;
    averageCompressionRatio: number;
    storageSpace: number;
    photoGroups: { [key: string]: number };
  }> {
    const photos = await storage.getRoomPhotosByRoomType(roomTypeId);
    
    const stats = photos.reduce((acc, photo) => {
      const originalSize = photo.originalFileSize || 0;
      const compressedSize = photo.compressedFileSize || originalSize;
      const compressionRatio = parseFloat(photo.compressionRatio?.toString() || '1.0');
      
      acc.totalOriginalSize += originalSize;
      acc.totalCompressedSize += compressedSize;
      acc.compressionRatios.push(compressionRatio);
      
      // Count photos by group
      acc.photoGroups[photo.photoGroup] = (acc.photoGroups[photo.photoGroup] || 0) + 1;
      
      return acc;
    }, {
      totalOriginalSize: 0,
      totalCompressedSize: 0,
      compressionRatios: [] as number[],
      photoGroups: {} as { [key: string]: number }
    });

    const averageCompressionRatio = stats.compressionRatios.length > 0 
      ? stats.compressionRatios.reduce((a, b) => a + b, 0) / stats.compressionRatios.length 
      : 1.0;

    const storageSpace = Math.max(0, stats.totalOriginalSize - stats.totalCompressedSize);

    return {
      totalPhotos: photos.length,
      totalOriginalSize: stats.totalOriginalSize,
      totalCompressedSize: stats.totalCompressedSize,
      averageCompressionRatio,
      storageSpace,
      photoGroups: stats.photoGroups
    };
  }

  /**
   * Get optimal photo URL based on viewing context
   */
  getOptimalPhotoUrl(photo: RoomPhoto, options: PhotoServeOptions = {}): string {
    const { quality = 'compressed' } = options;
    
    switch (quality) {
      case 'thumbnail':
        return photo.thumbnailUrl || photo.photoUrl;
      case 'original':
        // In a real implementation, this would serve the original uncompressed file
        return photo.photoUrl + '?quality=original';
      case 'compressed':
      default:
        return photo.photoUrl;
    }
  }

  /**
   * Get photo serving recommendations based on context
   */
  getServingRecommendations(photo: RoomPhoto, context: 'gallery' | 'thumbnail' | 'hero' | 'preview'): {
    recommendedQuality: PhotoServeOptions['quality'];
    cacheStrategy: 'aggressive' | 'normal' | 'minimal';
    lazyLoad: boolean;
  } {
    const metadata = this.getPhotoMetadata(photo);
    
    switch (context) {
      case 'thumbnail':
        return {
          recommendedQuality: 'thumbnail',
          cacheStrategy: 'aggressive',
          lazyLoad: true
        };
      
      case 'preview':
        return {
          recommendedQuality: 'compressed',
          cacheStrategy: 'normal',
          lazyLoad: true
        };
      
      case 'hero':
        return {
          recommendedQuality: metadata.compressionRatio < 0.7 ? 'compressed' : 'original',
          cacheStrategy: 'aggressive',
          lazyLoad: false
        };
      
      case 'gallery':
      default:
        return {
          recommendedQuality: 'compressed',
          cacheStrategy: 'normal',
          lazyLoad: true
        };
    }
  }

  /**
   * Parse resolution string into width/height object
   */
  private parseDimensions(resolution?: string | null): { width: number; height: number } {
    if (!resolution) return { width: 0, height: 0 };
    
    const parts = resolution.split('x');
    return {
      width: parseInt(parts[0]) || 0,
      height: parseInt(parts[1]) || 0
    };
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Calculate storage efficiency metrics
   */
  calculateStorageEfficiency(originalSize: number, compressedSize: number): {
    spaceSaved: number;
    spaceSavedFormatted: string;
    compressionPercentage: number;
    efficiency: 'excellent' | 'good' | 'fair' | 'poor';
  } {
    const spaceSaved = Math.max(0, originalSize - compressedSize);
    const compressionPercentage = originalSize > 0 ? Math.round((spaceSaved / originalSize) * 100) : 0;
    
    let efficiency: 'excellent' | 'good' | 'fair' | 'poor';
    if (compressionPercentage >= 60) efficiency = 'excellent';
    else if (compressionPercentage >= 40) efficiency = 'good';
    else if (compressionPercentage >= 20) efficiency = 'fair';
    else efficiency = 'poor';

    return {
      spaceSaved,
      spaceSavedFormatted: this.formatFileSize(spaceSaved),
      compressionPercentage,
      efficiency
    };
  }
}

export const photoService = new PhotoService();