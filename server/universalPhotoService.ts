/**
 * Universal Photo Service for handling all photo uploads across the platform
 * Provides consistent compression, storage optimization, and photo management
 */

import { storage } from "./storage";
import type { UniversalPhoto, InsertUniversalPhoto } from "@shared/schema";

export interface PhotoCompressionStats {
  totalPhotos: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
  averageCompressionRatio: number;
  storageSpaceSaved: number;
  compressionEfficiency: 'excellent' | 'good' | 'fair' | 'poor';
  photosByCategory: { [category: string]: number };
  entityTypeBreakdown: { [entityType: string]: number };
}

export interface PhotoGallery {
  photos: UniversalPhoto[];
  mainPhoto?: UniversalPhoto;
  photosByCategory: { [category: string]: UniversalPhoto[] };
  totalCount: number;
  compressionStats: PhotoCompressionStats;
}

export class UniversalPhotoService {
  
  /**
   * Get photos for a specific entity with compression analytics
   */
  async getEntityPhotos(entityType: string, entityId?: number): Promise<PhotoGallery> {
    const photos = await storage.getUniversalPhotosByEntity(entityType, entityId);
    
    // Organize photos by category
    const photosByCategory: { [category: string]: UniversalPhoto[] } = {};
    photos.forEach(photo => {
      if (!photosByCategory[photo.photoCategory]) {
        photosByCategory[photo.photoCategory] = [];
      }
      photosByCategory[photo.photoCategory].push(photo);
    });

    // Sort photos by display order within each category
    Object.keys(photosByCategory).forEach(category => {
      photosByCategory[category].sort((a, b) => a.displayOrder - b.displayOrder);
    });

    // Find main photo
    const mainPhoto = photos.find(photo => photo.isMainPhoto);

    // Calculate compression stats
    const compressionStats = this.calculateCompressionStats(photos);

    return {
      photos,
      mainPhoto,
      photosByCategory,
      totalCount: photos.length,
      compressionStats
    };
  }

  /**
   * Get photos by category across all entities
   */
  async getPhotosByCategory(photoCategory: string): Promise<UniversalPhoto[]> {
    return await storage.getUniversalPhotosByCategory(photoCategory);
  }

  /**
   * Get platform-wide photo compression statistics
   */
  async getPlatformCompressionStats(): Promise<PhotoCompressionStats> {
    const result = await storage.getAllUniversalPhotos();
    // getAllUniversalPhotos returns {photos, photosByCategory, totalPhotos}
    const photos = result.photos || [];
    console.log('Photos for compression stats:', photos.length, 'photos');
    console.log('First photo type:', typeof photos[0]);
    return this.calculateCompressionStats(photos);
  }

  /**
   * Get compression statistics for specific entity type
   */
  async getEntityTypeStats(entityType: string): Promise<PhotoCompressionStats> {
    const photos = await storage.getUniversalPhotosByEntityType(entityType);
    return this.calculateCompressionStats(photos);
  }

  /**
   * Calculate comprehensive compression statistics
   */
  private calculateCompressionStats(photos: UniversalPhoto[]): PhotoCompressionStats {
    if (photos.length === 0) {
      return {
        totalPhotos: 0,
        totalOriginalSize: 0,
        totalCompressedSize: 0,
        averageCompressionRatio: 1.0,
        storageSpaceSaved: 0,
        compressionEfficiency: 'poor',
        photosByCategory: {},
        entityTypeBreakdown: {}
      };
    }

    const stats = photos.reduce((acc, photo) => {
      const originalSize = photo.originalFileSize || 0;
      const compressedSize = photo.compressedFileSize || originalSize;
      const compressionRatio = parseFloat(photo.compressionRatio?.toString() || '1.0');
      
      acc.totalOriginalSize += originalSize;
      acc.totalCompressedSize += compressedSize;
      acc.compressionRatios.push(compressionRatio);
      
      // Count by category
      acc.photosByCategory[photo.photoCategory] = (acc.photosByCategory[photo.photoCategory] || 0) + 1;
      
      // Count by entity type
      acc.entityTypeBreakdown[photo.entityType] = (acc.entityTypeBreakdown[photo.entityType] || 0) + 1;
      
      return acc;
    }, {
      totalOriginalSize: 0,
      totalCompressedSize: 0,
      compressionRatios: [] as number[],
      photosByCategory: {} as { [category: string]: number },
      entityTypeBreakdown: {} as { [entityType: string]: number }
    });

    const averageCompressionRatio = stats.compressionRatios.length > 0 
      ? stats.compressionRatios.reduce((a, b) => a + b, 0) / stats.compressionRatios.length 
      : 1.0;

    const storageSpaceSaved = Math.max(0, stats.totalOriginalSize - stats.totalCompressedSize);
    const compressionPercentage = stats.totalOriginalSize > 0 
      ? Math.round((storageSpaceSaved / stats.totalOriginalSize) * 100) 
      : 0;

    let compressionEfficiency: 'excellent' | 'good' | 'fair' | 'poor';
    if (compressionPercentage >= 60) compressionEfficiency = 'excellent';
    else if (compressionPercentage >= 40) compressionEfficiency = 'good';
    else if (compressionPercentage >= 20) compressionEfficiency = 'fair';
    else compressionEfficiency = 'poor';

    return {
      totalPhotos: photos.length,
      totalOriginalSize: stats.totalOriginalSize,
      totalCompressedSize: stats.totalCompressedSize,
      averageCompressionRatio,
      storageSpaceSaved,
      compressionEfficiency,
      photosByCategory: stats.photosByCategory,
      entityTypeBreakdown: stats.entityTypeBreakdown
    };
  }

  /**
   * Get optimal photo URL based on context
   */
  getOptimalPhotoUrl(photo: UniversalPhoto, context: 'thumbnail' | 'preview' | 'gallery' | 'hero' = 'preview'): string {
    switch (context) {
      case 'thumbnail':
        return photo.thumbnailUrl || photo.photoUrl;
      case 'hero':
        // For hero images, use original if compression ratio is too aggressive
        const compressionRatio = parseFloat(photo.compressionRatio?.toString() || '1.0');
        return compressionRatio < 0.7 ? photo.photoUrl + '?quality=original' : photo.photoUrl;
      case 'preview':
      case 'gallery':
      default:
        return photo.photoUrl;
    }
  }

  /**
   * Set main photo for an entity
   */
  async setMainPhoto(entityType: string, entityId: number | undefined, photoId: number): Promise<boolean> {
    return await storage.setMainUniversalPhoto(entityType, entityId, photoId);
  }

  /**
   * Update photo display order
   */
  async updatePhotoOrder(photoId: number, newOrder: number): Promise<boolean> {
    return await storage.updateUniversalPhotoOrder(photoId, newOrder);
  }

  /**
   * Bulk update photo categories
   */
  async updatePhotoCategories(photoIds: number[], newCategory: string): Promise<boolean> {
    return await storage.bulkUpdateUniversalPhotoCategory(photoIds, newCategory);
  }

  /**
   * Get photo analytics for admin dashboard
   */
  async getPhotoAnalytics(): Promise<{
    totalPhotos: number;
    storageUsed: string;
    storageSaved: string;
    compressionEfficiency: string;
    topEntityTypes: { entityType: string; count: number; avgCompression: number }[];
    topCategories: { category: string; count: number; avgSize: number }[];
    recentUploads: UniversalPhoto[];
  }> {
    const allPhotos = await storage.getAllUniversalPhotos();
    const stats = this.calculateCompressionStats(allPhotos);
    
    // Calculate top entity types
    const entityStats = Object.entries(stats.entityTypeBreakdown).map(([entityType, count]) => {
      const entityPhotos = allPhotos.filter(p => p.entityType === entityType);
      const avgCompression = entityPhotos.length > 0 
        ? entityPhotos.reduce((sum, p) => sum + parseFloat(p.compressionRatio?.toString() || '1.0'), 0) / entityPhotos.length
        : 1.0;
      
      return { entityType, count, avgCompression };
    }).sort((a, b) => b.count - a.count).slice(0, 5);

    // Calculate top categories
    const categoryStats = Object.entries(stats.photosByCategory).map(([category, count]) => {
      const categoryPhotos = allPhotos.filter(p => p.photoCategory === category);
      const avgSize = categoryPhotos.length > 0 
        ? categoryPhotos.reduce((sum, p) => sum + (p.compressedFileSize || p.originalFileSize || 0), 0) / categoryPhotos.length
        : 0;
      
      return { category, count, avgSize };
    }).sort((a, b) => b.count - a.count).slice(0, 5);

    // Get recent uploads (last 10)
    const recentUploads = allPhotos
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return {
      totalPhotos: stats.totalPhotos,
      storageUsed: this.formatFileSize(stats.totalCompressedSize),
      storageSaved: this.formatFileSize(stats.storageSpaceSaved),
      compressionEfficiency: `${Math.round((1 - stats.averageCompressionRatio) * 100)}%`,
      topEntityTypes: entityStats,
      topCategories: categoryStats,
      recentUploads
    };
  }

  /**
   * Search photos across the platform
   */
  async searchPhotos(query: string, filters?: {
    entityType?: string;
    photoCategory?: string;
    isCompressed?: boolean;
    uploadedBy?: string;
  }): Promise<UniversalPhoto[]> {
    return await storage.searchUniversalPhotos(query, filters);
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
   * Generate photo recommendations
   */
  async getPhotoRecommendations(entityType: string, entityId?: number): Promise<{
    missingCategories: string[];
    qualityIssues: UniversalPhoto[];
    compressionOpportunities: UniversalPhoto[];
    organizationSuggestions: string[];
  }> {
    const photos = await storage.getUniversalPhotosByEntity(entityType, entityId);
    const availableCategories = this.getAvailableCategoriesForEntity(entityType);
    
    // Find missing categories
    const existingCategories = [...new Set(photos.map(p => p.photoCategory))];
    const missingCategories = availableCategories.filter(cat => !existingCategories.includes(cat));
    
    // Find quality issues (low resolution percentage)
    const qualityIssues = photos.filter(p => p.resolutionPercentage < 80);
    
    // Find compression opportunities (large uncompressed files)
    const compressionOpportunities = photos.filter(p => 
      !p.isCompressed && (p.originalFileSize || 0) > 1024 * 1024 // > 1MB
    );
    
    // Generate organization suggestions
    const organizationSuggestions: string[] = [];
    if (photos.length > 0 && !photos.some(p => p.isMainPhoto)) {
      organizationSuggestions.push("Set a main photo to improve visibility");
    }
    if (photos.length > 5 && photos.some(p => p.displayOrder === 1)) {
      organizationSuggestions.push("Organize photos with proper display order");
    }
    if (missingCategories.length > 0) {
      organizationSuggestions.push(`Add photos for: ${missingCategories.join(', ')}`);
    }

    return {
      missingCategories,
      qualityIssues,
      compressionOpportunities,
      organizationSuggestions
    };
  }

  /**
   * Get available photo categories for an entity type
   */
  private getAvailableCategoriesForEntity(entityType: string): string[] {
    const categoryMap: { [key: string]: string[] } = {
      property: ['exterior', 'lobby', 'amenities', 'dining', 'general'],
      room_type: ['bedroom', 'washroom', 'restroom', 'living_area', 'balcony', 'kitchen', 'view'],
      user_profile: ['avatar', 'cover', 'verification'],
      promotion: ['banner', 'thumbnail', 'gallery'],
      facility: ['main', 'interior', 'equipment'],
      general: ['upload']
    };
    
    return categoryMap[entityType] || categoryMap.general;
  }
}

export const universalPhotoService = new UniversalPhotoService();