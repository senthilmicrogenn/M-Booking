import { pgTable, text, integer, timestamp, boolean, decimal, pgEnum, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Media type enum for universal photos (temporarily disabled)
// export const mediaTypeEnum = pgEnum('media_type', ['photo', 'pano360', 'video']);

// Universal photos table for all photo uploads across the platform
export const universalPhotos = pgTable("universal_photos", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  entityType: text("entity_type").notNull(), // "property", "user_profile", "room_type", "promotion", "facility", "general"
  entityId: integer("entity_id"), // Related entity ID (nullable for general uploads)
  photoCategory: text("photo_category").notNull(), // Category specific to entity type
  photoName: text("photo_name").notNull(),
  photoUrl: text("photo_url").notNull(), // Storage URL
  photoPath: text("photo_path").notNull(), // Internal storage path
  compressedUrlData: text("compressed_url_data"), // Compressed URL and path data for storage efficiency
  originalResolution: text("original_resolution"), // "1920x1080"
  compressedResolution: text("compressed_resolution"), // "1200x800"
  resolutionPercentage: integer("resolution_percentage").notNull(), // 85 (minimum 80% required)
  originalFileSize: integer("original_file_size"), // Original file size in bytes
  compressedFileSize: integer("compressed_file_size"), // Compressed file size in bytes
  compressionRatio: decimal("compression_ratio", { precision: 5, scale: 3 }), // Compression ratio
  compressionQuality: integer("compression_quality").default(85), // JPEG quality 1-100
  mimeType: text("mime_type"), // "image/jpeg", "image/png", "image/webp"
  thumbnailUrl: text("thumbnail_url"), // Small thumbnail URL for previews
  mediaType: text("media_type").default('photo').notNull(), // Type of media: photo, 360° panorama, or video
  duration: integer("duration"), // Duration in seconds for videos
  isCompressed: boolean("is_compressed").default(true), // Whether photo was compressed
  isMainPhoto: boolean("is_main_photo").default(false), // Primary photo for the entity
  displayOrder: integer("display_order").default(1), // Sort order for display
  altText: text("alt_text"), // Accessibility text
  tags: text("tags"), // Comma-separated tags for searching
  compressedTags: text("compressed_tags"), // Compressed tags for storage efficiency
  uploadedBy: text("uploaded_by"), // User ID or "Admin"
  isActive: boolean("is_active").default(true),
  metadata: text("metadata"), // Text object for additional metadata (hotspots, projection, etc.)
  compressedMetadata: text("compressed_metadata"), // Compressed metadata for storage efficiency
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Enhanced insert schema for universal photos with 360° support
export const insertUniversalPhotoSchema = createInsertSchema(universalPhotos).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  mediaType: z.enum(['photo', 'pano360', 'video']).default('photo'),
  metadata: z.object({
    // 360° specific metadata
    projection: z.enum(['equirectangular', 'cubemap']).optional(), // 360° projection type
    hotspots: z.array(z.object({
      x: z.number(), // X coordinate percentage (0-100)
      y: z.number(), // Y coordinate percentage (0-100)
      title: z.string(),
      description: z.string().optional(),
      link: z.string().optional()
    })).optional(), // Interactive hotspots for 360° photos
    
    // General metadata
    width: z.number().optional(),
    height: z.number().optional(),
    fov: z.number().optional(), // Field of view for 360° photos
    author: z.string().optional(),
    location: z.string().optional(),
    equipment: z.string().optional() // Camera/equipment used
  }).optional()
});

// Photo category enums for better type safety
export const propertyPhotoCategoryEnum = z.enum([
  'room', 'swimming_pool', 'outdoors', 'facade', 'entrance', 
  'washroom', 'restaurant', 'play_area', 'reception', 'common_area', 
  'gym', 'conference_room', 'dining', 'facade_360', 'lobby_360', 
  'room_360', 'pool_360', 'outdoor_360'
]);

export type UniversalPhoto = typeof universalPhotos.$inferSelect;
export type InsertUniversalPhoto = z.infer<typeof insertUniversalPhotoSchema>;
export type MediaType = 'photo' | 'pano360' | 'video';
export type PropertyPhotoCategory = z.infer<typeof propertyPhotoCategoryEnum>;