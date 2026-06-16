/**
 * VPS-Safe Object Storage Wrapper
 * Detects environment and handles photo storage gracefully on non-Replit servers
 */

import { Response } from "express";

// Check if running on Replit (Replit has the sidecar endpoint available)
const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
let isReplitEnvironment: boolean | null = null;

export async function isRunningOnReplit(): Promise<boolean> {
  if (isReplitEnvironment !== null) {
    return isReplitEnvironment;
  }

  try {
    const response = await fetch(`${REPLIT_SIDECAR_ENDPOINT}/credential`, {
      method: 'GET',
      signal: AbortSignal.timeout(500), // 500ms timeout
    });
    isReplitEnvironment = response.ok;
  } catch (error) {
    isReplitEnvironment = false;
  }

  console.log(`🔍 Environment detection: ${isReplitEnvironment ? 'Replit' : 'VPS/Standard Server'}`);
  return isReplitEnvironment;
}

// VPS-Safe Object Storage Service
export class VpsSafeObjectStorageService {
  private actualService: any = null;

  async initialize() {
    const onReplit = await isRunningOnReplit();
    
    if (onReplit) {
      // Load the actual object storage service
      const { ObjectStorageService } = await import('./objectStorage');
      this.actualService = new ObjectStorageService();
      console.log('✅ Using Replit Object Storage');
    } else {
      console.log('⚠️  VPS Environment: Photo storage disabled (photos stored in database URLs only)');
    }
  }

  async getRoomPhotoUploadURL(): Promise<string> {
    if (!this.actualService) {
      throw new Error('Photo uploads not available on VPS. Please configure Google Cloud Storage or use Replit deployment.');
    }
    return this.actualService.getRoomPhotoUploadURL();
  }

  async getRoomMediaUploadURL(): Promise<string> {
    if (!this.actualService) {
      throw new Error('Media uploads not available on VPS. Please configure Google Cloud Storage or use Replit deployment.');
    }
    return this.actualService.getRoomMediaUploadURL();
  }

  async getAmenityMediaUploadURL(): Promise<string> {
    if (!this.actualService) {
      throw new Error('Media uploads not available on VPS. Please configure Google Cloud Storage or use Replit deployment.');
    }
    return this.actualService.getAmenityMediaUploadURL();
  }

  async getObjectEntityUploadURL(): Promise<string> {
    if (!this.actualService) {
      throw new Error('Photo uploads not available on VPS. Please configure Google Cloud Storage or use Replit deployment.');
    }
    return this.actualService.getObjectEntityUploadURL();
  }

  async getRoomPhotoFile(objectPath: string): Promise<any> {
    if (!this.actualService) {
      throw new ObjectNotFoundError();
    }
    return this.actualService.getRoomPhotoFile(objectPath);
  }

  normalizeRoomPhotoPath(rawPath: string): string {
    if (!this.actualService) {
      return rawPath; // Return as-is on VPS
    }
    return this.actualService.normalizeRoomPhotoPath(rawPath);
  }

  normalizeAmenityMediaPath(rawPath: string): string {
    if (!this.actualService) {
      return rawPath; // Return as-is on VPS
    }
    return this.actualService.normalizeAmenityMediaPath(rawPath);
  }

  async canAccessRoomPhoto(params: any): Promise<boolean> {
    if (!this.actualService) {
      return false; // No access on VPS
    }
    return this.actualService.canAccessRoomPhoto(params);
  }

  async downloadObject(file: any, res: Response, cacheTtlSec: number = 3600): Promise<void> {
    if (!this.actualService) {
      // On VPS, return a placeholder or 404
      res.status(503).json({ 
        error: 'Photo storage not configured on this server',
        message: 'Photos are only available on Replit deployment or with proper Google Cloud Storage setup'
      });
      return;
    }
    return this.actualService.downloadObject(file, res, cacheTtlSec);
  }
}

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

// Export singleton instance
export const vpsSafeObjectStorage = new VpsSafeObjectStorageService();
