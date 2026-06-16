import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Camera, X, CheckCircle, AlertTriangle, Image as ImageIcon, Zap, FileImage } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { smartCompress, validateImageQuality, type CompressionResult } from "@/utils/imageCompression";

interface UniversalPhotoUploaderProps {
  entityType: 'property' | 'user_profile' | 'room_type' | 'promotion' | 'facility' | 'general';
  entityId?: number;
  photoCategory?: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (uploadedPhotos: PhotoUploadResult[]) => void;
  maxPhotos?: number;
  allowedCategories?: PhotoCategory[];
  title?: string;
}

interface PhotoCategory {
  value: string;
  label: string;
  description: string;
  maxSize?: number;
  recommendedDimensions?: string;
}

interface PhotoUploadResult {
  id: string;
  photoUrl: string;
  photoPath: string;
  category: string;
  compressionInfo: {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    spaceSaved: number;
  };
}

interface PhotoUpload {
  id: string;
  originalFile: File;
  compressedFile?: File;
  thumbnailFile?: File;
  preview: string;
  photoCategory: string;
  photoName: string;
  originalResolution: string;
  compressedResolution: string;
  resolutionPercentage: number;
  originalFileSize: number;
  compressedFileSize?: number;
  compressionRatio?: number;
  compressionQuality: number;
  status: 'pending' | 'compressing' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
  uploadProgress: number;
  compressionResult?: CompressionResult;
}

// Universal photo categories for different entity types
const PHOTO_CATEGORIES: Record<string, PhotoCategory[]> = {
  property: [
    { value: "exterior", label: "Exterior", description: "Building exterior and facade views" },
    { value: "lobby", label: "Lobby", description: "Reception and lobby areas" },
    { value: "amenities", label: "Amenities", description: "Pool, gym, spa, and other facilities" },
    { value: "dining", label: "Dining", description: "Restaurant and dining areas" },
    { value: "general", label: "General", description: "Other property photos" }
  ],
  room_type: [
    { value: "bedroom", label: "Bedroom", description: "Main sleeping area with bed and furniture" },
    { value: "washroom", label: "Washroom", description: "Bathroom with shower, toilet, and amenities" },
    { value: "restroom", label: "Restroom", description: "Additional toilet facilities" },
    { value: "living_area", label: "Living Area", description: "Seating and entertainment space" },
    { value: "balcony", label: "Balcony", description: "Outdoor terrace or balcony area" },
    { value: "kitchen", label: "Kitchen", description: "Cooking and dining facilities" },
    { value: "view", label: "Room View", description: "Outside view from windows" }
  ],
  user_profile: [
    { value: "avatar", label: "Profile Photo", description: "Main profile picture", maxSize: 2 * 1024 * 1024 },
    { value: "cover", label: "Cover Photo", description: "Profile cover image" },
    { value: "verification", label: "ID Verification", description: "Identity verification documents" }
  ],
  promotion: [
    { value: "banner", label: "Banner", description: "Promotional banner image" },
    { value: "thumbnail", label: "Thumbnail", description: "Small promotional preview" },
    { value: "gallery", label: "Gallery", description: "Additional promotional images" }
  ],
  facility: [
    { value: "main", label: "Main Photo", description: "Primary facility image" },
    { value: "interior", label: "Interior", description: "Inside facility views" },
    { value: "equipment", label: "Equipment", description: "Equipment and amenities" }
  ],
  general: [
    { value: "upload", label: "Photo Upload", description: "General photo upload" }
  ]
};

export function UniversalPhotoUploader({
  entityType,
  entityId,
  photoCategory,
  isOpen,
  onClose,
  onUploadComplete,
  maxPhotos = 10,
  allowedCategories,
  title
}: UniversalPhotoUploaderProps) {
  const [uploads, setUploads] = useState<PhotoUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const categories = allowedCategories || PHOTO_CATEGORIES[entityType] || PHOTO_CATEGORIES.general;
  const defaultCategory = photoCategory || categories[0]?.value || 'upload';
  const uploaderTitle = title || `Upload ${entityType.replace('_', ' ')} Photos`;

  // Function to process and compress image
  const processImage = async (file: File): Promise<PhotoUpload> => {
    const id = `${Date.now()}_${Math.random()}`;
    
    // Initial validation
    const ImageConstructor = globalThis.Image || window.Image;
    const img = new ImageConstructor();
    img.src = URL.createObjectURL(file);
    
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    const validation = validateImageQuality(width, height, file.size);
    
    URL.revokeObjectURL(img.src);
    
    // Create initial upload object
    const newUpload: PhotoUpload = {
      id,
      originalFile: file,
      preview: URL.createObjectURL(file),
      photoCategory: defaultCategory,
      photoName: file.name.replace(/\.[^/.]+$/, ""),
      originalResolution: `${width}x${height}`,
      compressedResolution: `${width}x${height}`,
      resolutionPercentage: validation.resolutionPercentage,
      originalFileSize: file.size,
      compressionQuality: 85,
      status: validation.isValid ? 'pending' : 'error',
      errorMessage: validation.isValid ? undefined : validation.recommendations.join('; '),
      uploadProgress: 0,
    };

    // If file is valid and needs compression, start compression
    if (validation.isValid && file.size > 500 * 1024) { // Compress files over 500KB
      try {
        newUpload.status = 'compressing';
        const compressionResult = await smartCompress(file);
        
        newUpload.compressedFile = compressionResult.compressedFile;
        newUpload.thumbnailFile = compressionResult.thumbnail;
        newUpload.compressedResolution = `${compressionResult.compressedDimensions.width}x${compressionResult.compressedDimensions.height}`;
        newUpload.compressedFileSize = compressionResult.compressedSize;
        newUpload.compressionRatio = compressionResult.compressionRatio;
        newUpload.compressionResult = compressionResult;
        newUpload.status = 'pending';
      } catch (error) {
        newUpload.status = 'error';
        newUpload.errorMessage = 'Compression failed';
      }
    }
    
    return newUpload;
  };

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Check maximum photos limit
    if (uploads.length + files.length > maxPhotos) {
      toast({
        title: "Too Many Photos",
        description: `Maximum ${maxPhotos} photos allowed`,
        variant: "destructive",
      });
      return;
    }
    
    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: `${file.name} is not an image file`,
          variant: "destructive",
        });
        continue;
      }

      // Check category-specific size limits
      const selectedCategory = categories.find(cat => cat.value === defaultCategory);
      const maxSize = selectedCategory?.maxSize || 10 * 1024 * 1024; // Default 10MB
      
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds ${(maxSize / 1024 / 1024).toFixed(1)}MB limit`,
          variant: "destructive",
        });
        continue;
      }

      try {
        const newUpload = await processImage(file);
        setUploads(prev => [...prev, newUpload]);
        
        if (newUpload.compressionResult) {
          toast({
            title: "Image Compressed",
            description: `${file.name} compressed by ${Math.round((1 - newUpload.compressionRatio!) * 100)}%`,
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to process ${file.name}`,
          variant: "destructive",
        });
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove photo from upload list
  const removePhoto = (uploadId: string) => {
    setUploads(prev => {
      const upload = prev.find(u => u.id === uploadId);
      if (upload) {
        URL.revokeObjectURL(upload.preview);
      }
      return prev.filter(u => u.id !== uploadId);
    });
  };

  // Update photo details
  const updatePhoto = (uploadId: string, updates: Partial<PhotoUpload>) => {
    setUploads(prev => prev.map(upload => 
      upload.id === uploadId ? { ...upload, ...updates } : upload
    ));
  };

  // Upload photos to storage
  const uploadPhotos = async () => {
    const validUploads = uploads.filter(u => u.status === 'pending');
    if (validUploads.length === 0) {
      toast({
        title: "No Valid Photos",
        description: "Please add photos with at least 80% resolution",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const uploadResults: PhotoUploadResult[] = [];

    for (const upload of validUploads) {
      try {
        setUploads(prev => prev.map(u => 
          u.id === upload.id ? { ...u, status: 'uploading', uploadProgress: 0 } : u
        ));

        // Get upload URL from backend
        const uploadResponse = await apiRequest("POST", "/api/universal-photos/upload", {
          entityType,
          entityId,
          photoCategory: upload.photoCategory
        });
        const { uploadURL } = await uploadResponse.json();

        // Upload file to storage
        const uploadRequest = new XMLHttpRequest();
        uploadRequest.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploads(prev => prev.map(u => 
              u.id === upload.id ? { ...u, uploadProgress: progress } : u
            ));
          }
        });

        await new Promise<void>((resolve, reject) => {
          uploadRequest.onload = () => {
            if (uploadRequest.status === 200) {
              resolve();
            } else {
              reject(new Error(`Upload failed: ${uploadRequest.status}`));
            }
          };
          uploadRequest.onerror = () => reject(new Error('Upload failed'));
          
          uploadRequest.open('PUT', uploadURL);
          const fileToUpload = upload.compressedFile || upload.originalFile;
          uploadRequest.setRequestHeader('Content-Type', fileToUpload.type);
          uploadRequest.send(fileToUpload);
        });

        // Save photo metadata to database
        const photoData = {
          entityType,
          entityId,
          photoCategory: upload.photoCategory,
          photoName: upload.photoName,
          photoUrl: uploadURL.split('?')[0],
          photoPath: `/photos/${entityType}/${uploadURL.split('/').pop()?.split('?')[0]}`,
          originalResolution: upload.originalResolution,
          compressedResolution: upload.compressedResolution,
          resolutionPercentage: upload.resolutionPercentage,
          originalFileSize: upload.originalFileSize,
          compressedFileSize: upload.compressedFileSize || upload.originalFileSize,
          compressionRatio: upload.compressionRatio || 1.0,
          compressionQuality: upload.compressionQuality,
          mimeType: upload.compressedFile?.type || upload.originalFile.type,
          thumbnailUrl: upload.thumbnailFile ? `/photos/thumbnails/${uploadURL.split('/').pop()?.split('?')[0]}` : null,
          isCompressed: !!upload.compressedFile,
          altText: `${upload.photoName} - ${upload.photoCategory}`,
          isActive: true,
        };

        await apiRequest("POST", "/api/universal-photos", photoData);

        // Add to results
        uploadResults.push({
          id: upload.id,
          photoUrl: photoData.photoUrl,
          photoPath: photoData.photoPath,
          category: upload.photoCategory,
          compressionInfo: {
            originalSize: upload.originalFileSize,
            compressedSize: upload.compressedFileSize || upload.originalFileSize,
            compressionRatio: upload.compressionRatio || 1.0,
            spaceSaved: Math.max(0, upload.originalFileSize - (upload.compressedFileSize || upload.originalFileSize))
          }
        });

        setUploads(prev => prev.map(u => 
          u.id === upload.id ? { ...u, status: 'success', uploadProgress: 100 } : u
        ));

      } catch (error) {
        console.error('Upload error:', error);
        setUploads(prev => prev.map(u => 
          u.id === upload.id ? { 
            ...u, 
            status: 'error', 
            errorMessage: 'Upload failed'
          } : u
        ));
      }
    }

    setIsUploading(false);
    
    // Check if all uploads were successful
    const successCount = uploadResults.length;
    if (successCount > 0) {
      toast({
        title: "Upload Complete",
        description: `Successfully uploaded ${successCount} photo(s) with compression optimization`,
      });
      onUploadComplete(uploadResults);
      handleClose();
    }
  };

  const handleClose = () => {
    // Clean up preview URLs
    uploads.forEach(upload => {
      URL.revokeObjectURL(upload.preview);
    });
    setUploads([]);
    setIsUploading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {uploaderTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded p-6 text-center">
            <div className="space-y-2">
              <Upload className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Select Photos
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-gray-500">
                Upload up to {maxPhotos} photos. Automatic compression applied. Minimum 80% resolution required.
              </p>
            </div>
          </div>

          {/* Smart Compression Info */}
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              <strong>Universal Photo Optimization:</strong> All photos are automatically compressed using intelligent algorithms 
              to reduce storage impact by up to 70% while preserving quality. System memory is not affected during uploads.
            </AlertDescription>
          </Alert>

          {/* Photo Categories Guide */}
          {categories.length > 1 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {categories.map(category => (
                <div key={category.value} className="text-center p-2 bg-gray-50 rounded">
                  <Badge variant="outline" className="mb-1">{category.label}</Badge>
                  <p className="text-xs text-gray-600">{category.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Uploaded Photos List */}
          {uploads.length > 0 && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <h3 className="font-medium">Selected Photos ({uploads.length}/{maxPhotos})</h3>
              
              {uploads.map(upload => (
                <Card key={upload.id} className="p-4">
                  <CardContent className="p-0">
                    <div className="flex gap-4">
                      {/* Photo Preview */}
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <img
                          src={upload.preview}
                          alt={upload.photoName}
                          className="w-full h-full object-cover rounded"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0"
                          onClick={() => removePhoto(upload.id)}
                          disabled={isUploading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Photo Details */}
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`name-${upload.id}`}>Photo Name</Label>
                            <Input
                              id={`name-${upload.id}`}
                              value={upload.photoName}
                              onChange={(e) => updatePhoto(upload.id, { photoName: e.target.value })}
                              disabled={isUploading}
                            />
                          </div>
                          {categories.length > 1 && (
                            <div>
                              <Label htmlFor={`category-${upload.id}`}>Photo Category</Label>
                              <Select
                                value={upload.photoCategory}
                                onValueChange={(value) => updatePhoto(upload.id, { photoCategory: value })}
                                disabled={isUploading}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map(category => (
                                    <SelectItem key={category.value} value={category.value}>
                                      {category.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>

                        {/* Compression Status */}
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Original:</span>
                            <Badge variant="outline">{upload.originalResolution}</Badge>
                            <Badge 
                              variant={upload.resolutionPercentage >= 80 ? "default" : "destructive"}
                              className={upload.resolutionPercentage >= 80 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                            >
                              {upload.resolutionPercentage}%
                            </Badge>
                          </div>
                          
                          {upload.compressedFile && (
                            <div className="flex items-center gap-2">
                              <Zap className="h-3 w-3 text-blue-600" />
                              <span className="text-sm text-gray-600">Compressed:</span>
                              <Badge variant="secondary">{upload.compressedResolution}</Badge>
                              <Badge className="bg-blue-100 text-blue-800">
                                -{Math.round((1 - upload.compressionRatio!) * 100)}%
                              </Badge>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <FileImage className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-500">
                              {upload.compressedFileSize ? 
                                `${(upload.compressedFileSize / 1024 / 1024).toFixed(1)}MB` : 
                                `${(upload.originalFileSize / 1024 / 1024).toFixed(1)}MB`
                              }
                            </span>
                          </div>
                          
                          {upload.status === 'compressing' && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              <Zap className="h-3 w-3 mr-1" />
                              Compressing...
                            </Badge>
                          )}
                          {upload.status === 'success' && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                          {upload.status === 'error' && (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                        </div>

                        {/* Upload Progress */}
                        {upload.status === 'uploading' && (
                          <Progress value={upload.uploadProgress} className="w-full" />
                        )}

                        {/* Error Message */}
                        {upload.errorMessage && (
                          <p className="text-sm text-red-600">{upload.errorMessage}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button 
              onClick={uploadPhotos} 
              disabled={uploads.length === 0 || isUploading || uploads.every(u => u.status === 'error')}
              className="bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)]"
            >
              {isUploading ? 'Uploading...' : `Upload ${uploads.filter(u => u.status === 'pending').length} Photos`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}