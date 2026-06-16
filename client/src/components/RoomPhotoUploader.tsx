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

interface RoomPhotoUploaderProps {
  roomTypeId: number;
  roomTypeName: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

interface MediaUpload {
  id: string;
  originalFile: File;
  compressedFile?: File;
  thumbnailFile?: File;
  preview: string;
  photoGroup: string;
  photoName: string;
  mediaType: 'photo' | 'video';
  originalResolution: string;
  compressedResolution: string;
  resolutionPercentage: number;
  originalFileSize: number;
  compressedFileSize?: number;
  compressionRatio?: number;
  compressionQuality: number;
  duration?: number; // For videos
  status: 'pending' | 'compressing' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
  uploadProgress: number;
  compressionResult?: CompressionResult;
}

const PHOTO_GROUPS = [
  // Room Areas
  { value: "bedroom", label: "Bedroom", description: "Main sleeping area with bed and furniture", category: "room", icon: "🛏️" },
  { value: "washroom", label: "Washroom", description: "Bathroom with shower, toilet, and amenities", category: "room", icon: "🚿" },
  { value: "restroom", label: "Restroom", description: "Additional toilet facilities", category: "room", icon: "🚽" },
  { value: "living_area", label: "Living Area", description: "Seating and entertainment space", category: "room", icon: "🛋️" },
  { value: "balcony", label: "Balcony", description: "Outdoor terrace or balcony area", category: "room", icon: "🌿" },
  { value: "kitchen", label: "Kitchen", description: "Cooking and dining facilities", category: "room", icon: "🍳" },
  { value: "view", label: "Room View", description: "Outside view from windows", category: "room", icon: "🪟" },
  
  // Hotel Common Areas
  { value: "reception", label: "Reception", description: "Front desk and check-in area", category: "common", icon: "🏨" },
  { value: "lobby", label: "Lobby", description: "Main entrance and waiting area", category: "common", icon: "🏛️" },
  { value: "corridor", label: "Corridor", description: "Hallways and passages", category: "common", icon: "🚪" },
  { value: "elevation", label: "Elevation", description: "Building exterior and facade", category: "exterior", icon: "🏢" },
  { value: "entrance", label: "Entrance", description: "Main building entrance", category: "exterior", icon: "🚪" },
  { value: "parking", label: "Parking", description: "Vehicle parking areas", category: "exterior", icon: "🚗" },
  
  // Hotel Facilities
  { value: "restaurant", label: "Restaurant", description: "Dining areas and restaurants", category: "facilities", icon: "🍽️" },
  { value: "gym", label: "Gym/Fitness", description: "Exercise and fitness facilities", category: "facilities", icon: "💪" },
  { value: "pool", label: "Swimming Pool", description: "Pool and aquatic areas", category: "facilities", icon: "🏊" },
  { value: "spa", label: "Spa/Wellness", description: "Spa and wellness centers", category: "facilities", icon: "💆" },
  { value: "conference", label: "Conference Room", description: "Meeting and conference facilities", category: "facilities", icon: "📊" },
  { value: "rooftop", label: "Rooftop", description: "Rooftop areas and terraces", category: "facilities", icon: "🌆" }
];

const CATEGORY_INFO = {
  room: { label: "Room Areas", color: "bg-blue-50 border-blue-200", textColor: "text-blue-800" },
  common: { label: "Common Areas", color: "bg-green-50 border-green-200", textColor: "text-green-800" },
  exterior: { label: "Exterior", color: "bg-orange-50 border-orange-200", textColor: "text-orange-800" },
  facilities: { label: "Facilities", color: "bg-purple-50 border-purple-200", textColor: "text-purple-800" }
};

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/avi', 'video/quicktime'];
const MAX_FILE_SIZE = 52428800; // 50MB

export function RoomPhotoUploader({ roomTypeId, roomTypeName, isOpen, onClose, onUploadComplete }: RoomPhotoUploaderProps) {
  const [uploads, setUploads] = useState<MediaUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<any[]>([]);
  const [showVerification, setShowVerification] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("room");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Function to process media file (image or video)
  const processImage = async (file: File): Promise<MediaUpload> => {
    const id = `${Date.now()}_${Math.random()}`;
    const isVideo = file.type.startsWith('video/');
    
    let width: number = 0, height: number = 0, validation: any;
    
    try {
      if (isVideo) {
        // Handle video files
        const video = document.createElement('video');
        const objectUrl = URL.createObjectURL(file);
        video.src = objectUrl;
        video.preload = 'metadata';
        
        await new Promise((resolve, reject) => {
          video.onloadedmetadata = () => {
            width = video.videoWidth;
            height = video.videoHeight;
            resolve(video);
          };
          video.onerror = () => reject(new Error('Failed to load video'));
          setTimeout(() => reject(new Error('Video load timeout')), 10000);
        });
        
        // Videos typically have good quality, assume 100% for now
        validation = { isValid: true, resolutionPercentage: 100, recommendations: [] };
        URL.revokeObjectURL(objectUrl);
      } else {
        // Handle image files - ensure we use the global Image constructor
        const img = new (globalThis.Image || window.Image)();
        const objectUrl = URL.createObjectURL(file);
        img.src = objectUrl;
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error('Failed to load image'));
          // Add timeout to prevent hanging
          setTimeout(() => reject(new Error('Image load timeout')), 10000);
        });
        
        width = img.naturalWidth;
        height = img.naturalHeight;
        validation = validateImageQuality(width, height, file.size);
        
        URL.revokeObjectURL(objectUrl);
      }
    } catch (error) {
      console.error('Media processing error:', error);
      throw new Error(`Failed to process ${isVideo ? 'video' : 'image'}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Create initial upload object
    const newUpload: MediaUpload = {
      id,
      originalFile: file,
      preview: URL.createObjectURL(file),
      photoGroup: 'bedroom',
      photoName: file.name.replace(/\.[^/.]+$/, ""),
      mediaType: isVideo ? 'video' : 'photo',
      originalResolution: `${width}x${height}`,
      compressedResolution: `${width}x${height}`,
      resolutionPercentage: validation.resolutionPercentage,
      originalFileSize: file.size,
      compressionQuality: 85,
      duration: isVideo ? undefined : undefined, // Will be set later for videos if needed
      status: validation.isValid && validation.resolutionPercentage >= 90 ? 'pending' : 'error',
      errorMessage: validation.isValid && validation.resolutionPercentage >= 90 ? undefined : 
        validation.resolutionPercentage < 90 ? `Resolution too low: ${validation.resolutionPercentage}%. Minimum 90% required for quality standards.` :
        validation.recommendations.join('; '),
      uploadProgress: 0,
    };

    // If file is valid and needs compression (only for images)
    if (!isVideo && validation.isValid && file.size > 500 * 1024) { // Compress images over 500KB
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

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    processFiles(files);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Process multiple files
  const processFiles = async (files: File[]) => {
    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast({
          title: "Invalid File",
          description: `${file.name} is not a supported media file`,
          variant: "destructive",
        });
        continue;
      }

      // Validate file size (max 50MB)
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds 50MB limit`,
          variant: "destructive",
        });
        continue;
      }

      try {
        const newUpload = await processImage(file);
        // Auto-assign category based on current selection
        const categoryGroups = PHOTO_GROUPS.filter(g => g.category === selectedCategory);
        newUpload.photoGroup = categoryGroups[0]?.value || "bedroom";
        setUploads(prev => [...prev, newUpload]);
        
        if (newUpload.compressionResult) {
          toast({
            title: "Media Processed",
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
  const updatePhoto = (uploadId: string, updates: Partial<MediaUpload>) => {
    setUploads(prev => prev.map(upload => 
      upload.id === uploadId ? { ...upload, ...updates } : upload
    ));
  };

  // Upload photos to object storage
  const uploadPhotos = async () => {
    const validUploads = uploads.filter(u => u.status === 'pending' && u.resolutionPercentage >= 90);
    if (validUploads.length === 0) {
      toast({
        title: "No Valid Media Files",
        description: "Please add photos/videos with at least 90% resolution for professional quality",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    for (const upload of validUploads) {
      try {
        setUploads(prev => prev.map(u => 
          u.id === upload.id ? { ...u, status: 'uploading', uploadProgress: 0 } : u
        ));

        // Get upload URL from backend
        const uploadResponse = await apiRequest("POST", "/api/room-photos/upload");
        const { uploadURL } = await uploadResponse.json();

        // Upload file to object storage
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

        // Save photo metadata to database with compression info
        const photoData = {
          roomTypeId: Number(roomTypeId),
          photoGroup: upload.photoGroup,
          photoName: upload.photoName,
          photoUrl: uploadURL.split('?')[0], // Remove query parameters
          photoPath: `/room-photos/${uploadURL.split('/').pop()?.split('?')[0]}`,
          mediaType: "photo",
          originalResolution: upload.originalResolution,
          compressedResolution: upload.compressedResolution,
          resolutionPercentage: Math.round(upload.resolutionPercentage || 100),
          originalFileSize: upload.originalFileSize,
          compressedFileSize: upload.compressedFileSize || upload.originalFileSize,
          compressionRatio: upload.compressionRatio ? String(upload.compressionRatio.toFixed(3)) : "1.000",
          compressionQuality: upload.compressionQuality || 85,
          mimeType: upload.compressedFile?.type || upload.originalFile.type,
          thumbnailUrl: upload.thumbnailFile ? `/room-photos/thumbnails/${uploadURL.split('/').pop()?.split('?')[0]}` : null,
          isCompressed: !!upload.compressedFile,
          isMainPhoto: false,
          displayOrder: 1,
          altText: `${upload.photoName} - ${upload.photoGroup}`,
          uploadedBy: "Admin",
          isActive: true,
        };

        console.log('Saving photo metadata:', photoData);
        const saveResponse = await apiRequest("POST", "/api/room-photos", photoData);
        const savedPhoto = await saveResponse.json();
        console.log('Photo metadata saved successfully:', savedPhoto);

        // Add to uploaded photos for verification
        setUploadedPhotos(prev => [...prev, {
          ...savedPhoto,
          originalFile: upload.originalFile,
          preview: upload.preview
        }]);

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
    const successCount = uploads.filter(u => u.status === 'success').length;
    if (successCount > 0) {
      toast({
        title: "Upload Complete",
        description: `Successfully uploaded ${successCount} photo(s)`,
      });
      setShowVerification(true); // Show verification instead of closing
      onUploadComplete();
    }
  };

  const handleClose = () => {
    // Clean up preview URLs
    uploads.forEach(upload => {
      URL.revokeObjectURL(upload.preview);
    });
    uploadedPhotos.forEach(photo => {
      if (photo.preview) {
        URL.revokeObjectURL(photo.preview);
      }
    });
    setUploads([]);
    setUploadedPhotos([]);
    setShowVerification(false);
    setIsUploading(false);
    onClose();
  };

  const handleBackToUpload = () => {
    setShowVerification(false);
    setUploadedPhotos([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {showVerification ? 'Verify Uploaded Photos' : 'Upload Room Photos'} - {roomTypeName}
          </DialogTitle>
        </DialogHeader>

        {showVerification ? (
          // Verification Screen
          <div className="space-y-6">
            <div className="text-center text-green-600 mb-4">
              <CheckCircle className="h-8 w-8 mx-auto mb-2" />
              <p className="font-medium">Upload Successful!</p>
              <p className="text-sm text-gray-600">Please verify your uploaded images below</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
              {uploadedPhotos.map((photo, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="aspect-video relative">
                    <img 
                      src={photo.preview || photo.photoUrl} 
                      alt={photo.altText || photo.photoName}
                      className="w-full h-full object-cover"
                      onLoad={() => {
                        // Optional: Add any specific handling when image loads
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-sm">{photo.photoName}</h4>
                          <p className="text-xs text-gray-500">{photo.photoGroup}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {photo.originalResolution}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>Size: {Math.round(photo.originalFileSize / 1024)} KB</div>
                        <div>Quality: {photo.resolutionPercentage}%</div>
                        {photo.isCompressed && (
                          <>
                            <div>Compressed: {Math.round(photo.compressedFileSize / 1024)} KB</div>
                            <div>Ratio: {photo.compressionRatio}</div>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={handleBackToUpload}>
                <Upload className="h-4 w-4 mr-2" />
                Upload More
              </Button>
              <Button onClick={handleClose} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Done
              </Button>
            </div>
          </div>
        ) : (
          // Upload Screen
          <div className="space-y-6">
          {/* Category Selection */}
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(CATEGORY_INFO).map(([key, info]) => (
              <Button
                key={key}
                variant={selectedCategory === key ? "default" : "outline"}
                className={`p-3 h-auto flex-col ${selectedCategory === key ? info.color + ' ' + info.textColor : ''}`}
                onClick={() => setSelectedCategory(key)}
              >
                <span className="text-lg mb-1">
                  {PHOTO_GROUPS.find(g => g.category === key)?.icon || "📸"}
                </span>
                <span className="text-xs font-medium">{info.label}</span>
              </Button>
            ))}
          </div>

          {/* Drag and Drop Upload Area */}
          <div 
            className={`border-2 border-dashed rounded p-8 text-center transition-all ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-gray-100 rounded-full">
                  <Upload className="h-8 w-8 text-gray-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Drop files here or click to browse
                </h3>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="mb-2"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Select Photos & Videos
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="text-sm text-gray-500">
                  Upload for <strong>{CATEGORY_INFO[selectedCategory as keyof typeof CATEGORY_INFO].label}</strong>. 
                  Supports JPG, PNG, GIF, WebP, MP4, WebM (Max 50MB)
                </p>
                <div className="flex items-center justify-center gap-2 mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                  <span className="text-amber-600 font-medium text-sm">📐 Quality Check:</span>
                  <span className="text-amber-700 text-sm">Minimum 90% resolution required for professional quality</span>
                </div>
              </div>
            </div>
          </div>

          {/* Smart Compression Info */}
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              <strong>Quality & Compression:</strong> Photos/videos are automatically analyzed for quality. 
              <strong>Minimum 90% resolution required</strong> for professional standards. Smart compression reduces file size up to 70% without visible quality loss.
            </AlertDescription>
          </Alert>

          {/* Category Guide for Selected Category */}
          <div className={`rounded p-4 ${CATEGORY_INFO[selectedCategory as keyof typeof CATEGORY_INFO].color}`}>
            <h3 className={`font-medium mb-3 ${CATEGORY_INFO[selectedCategory as keyof typeof CATEGORY_INFO].textColor}`}>
              📍 {CATEGORY_INFO[selectedCategory as keyof typeof CATEGORY_INFO].label} - Upload Options
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PHOTO_GROUPS.filter(group => group.category === selectedCategory).map(group => (
                <div key={group.value} className="bg-white rounded p-3 shadow-sm border">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{group.icon}</span>
                    <Badge variant="outline" className="text-xs">{group.label}</Badge>
                  </div>
                  <p className="text-xs text-gray-600">{group.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Uploaded Photos List */}
          {uploads.length > 0 && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <h3 className="font-medium">Selected Photos ({uploads.length})</h3>
              
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
                          <div>
                            <Label htmlFor={`group-${upload.id}`}>Photo Group</Label>
                            <Select
                              value={upload.photoGroup}
                              onValueChange={(value) => updatePhoto(upload.id, { photoGroup: value })}
                              disabled={isUploading}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(CATEGORY_INFO).map(([category, info]) => (
                                  <div key={category}>
                                    <div className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-50">
                                      {info.label}
                                    </div>
                                    {PHOTO_GROUPS.filter(g => g.category === category).map(group => (
                                      <SelectItem key={group.value} value={group.value}>
                                        <div className="flex items-center gap-2">
                                          <span>{group.icon}</span>
                                          <span>{group.label}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </div>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Resolution and Compression Status */}
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Original:</span>
                            <Badge variant="outline">{upload.originalResolution}</Badge>
                            <Badge 
                              variant={upload.resolutionPercentage >= 90 ? "default" : upload.resolutionPercentage >= 80 ? "secondary" : "destructive"}
                              className={
                                upload.resolutionPercentage >= 90 ? "bg-green-100 text-green-800" : 
                                upload.resolutionPercentage >= 80 ? "bg-yellow-100 text-yellow-800" : 
                                "bg-red-100 text-red-800"
                              }
                            >
                              {upload.resolutionPercentage}% Quality
                            </Badge>
                            {upload.resolutionPercentage < 90 && (
                              <span className="text-xs text-red-600 ml-2">
                                {upload.resolutionPercentage < 80 ? "❌ Too Low" : "⚠️ Below Standard"}
                              </span>
                            )}
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
              disabled={uploads.length === 0 || isUploading || uploads.every(u => u.status === 'error') || uploads.filter(u => u.status === 'pending' && u.resolutionPercentage >= 90).length === 0}
              className="bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)]"
            >
              {isUploading ? 'Uploading...' : `Upload ${uploads.filter(u => u.status === 'pending' && u.resolutionPercentage >= 90).length} Valid Files`}
            </Button>
          </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}