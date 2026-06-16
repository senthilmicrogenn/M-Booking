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

interface PropertyPhotoUploaderProps {
  propertyId: number;
  propertyName: string;
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
  photoCategory: string;
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

const PHOTO_CATEGORIES = [
  // Exterior Views
  { value: "exterior_front", label: "Front Exterior", description: "Main building facade and entrance", category: "exterior", icon: "🏢" },
  { value: "exterior_side", label: "Side View", description: "Side view of the building", category: "exterior", icon: "🏬" },
  { value: "exterior_rear", label: "Rear View", description: "Back view of the property", category: "exterior", icon: "🏘️" },
  { value: "entrance", label: "Main Entrance", description: "Property entrance and entrance area", category: "exterior", icon: "🚪" },
  
  // Interior Common Areas
  { value: "lobby", label: "Lobby", description: "Reception and main lobby area", category: "interior", icon: "🏨" },
  { value: "reception", label: "Reception", description: "Front desk and check-in area", category: "interior", icon: "🎯" },
  { value: "corridors", label: "Corridors", description: "Hallways and passage areas", category: "interior", icon: "🛤️" },
  { value: "elevators", label: "Elevators", description: "Elevator areas and lobbies", category: "interior", icon: "⬆️" },
  { value: "stairs", label: "Stairways", description: "Staircase and stair areas", category: "interior", icon: "🪜" },
  
  // Amenities & Facilities
  { value: "restaurant", label: "Restaurant", description: "Dining areas and restaurants", category: "amenities", icon: "🍽️" },
  { value: "bar", label: "Bar & Lounge", description: "Bar area and lounge spaces", category: "amenities", icon: "🍹" },
  { value: "gym", label: "Fitness Center", description: "Gym and fitness facilities", category: "amenities", icon: "💪" },
  { value: "pool", label: "Swimming Pool", description: "Pool area and aquatic facilities", category: "amenities", icon: "🏊" },
  { value: "spa", label: "Spa & Wellness", description: "Spa, massage and wellness centers", category: "amenities", icon: "🧘" },
  { value: "conference", label: "Conference Rooms", description: "Meeting and conference facilities", category: "amenities", icon: "👥" },
  { value: "business_center", label: "Business Center", description: "Business facilities and services", category: "amenities", icon: "💼" },
  
  // Outdoor Areas
  { value: "gardens", label: "Gardens", description: "Landscaping and garden areas", category: "outdoor", icon: "🌳" },
  { value: "parking", label: "Parking", description: "Parking areas and facilities", category: "outdoor", icon: "🚗" },
  { value: "terrace", label: "Terrace", description: "Outdoor terrace and patio areas", category: "outdoor", icon: "🌿" },
  { value: "rooftop", label: "Rooftop", description: "Rooftop areas and sky lounges", category: "outdoor", icon: "🏙️" },
  
  // Other
  { value: "overview", label: "Property Overview", description: "General property showcasing photos", category: "general", icon: "📸" },
  { value: "special_features", label: "Special Features", description: "Unique property features and highlights", category: "general", icon: "⭐" }
];

const CATEGORY_GROUPS = {
  exterior: { label: "Exterior Views", color: "bg-blue-50 border-blue-200", textColor: "text-blue-800" },
  interior: { label: "Interior Areas", color: "bg-green-50 border-green-200", textColor: "text-green-800" },
  amenities: { label: "Amenities & Facilities", color: "bg-purple-50 border-purple-200", textColor: "text-purple-800" },
  outdoor: { label: "Outdoor Areas", color: "bg-orange-50 border-orange-200", textColor: "text-orange-800" },
  general: { label: "General", color: "bg-gray-50 border-gray-200", textColor: "text-gray-800" }
};

const CATEGORY_INFO = {
  exterior: { label: "Exterior Views", color: "bg-blue-50 border-blue-200", textColor: "text-blue-800" },
  interior: { label: "Interior Areas", color: "bg-green-50 border-green-200", textColor: "text-green-800" },
  amenities: { label: "Amenities & Facilities", color: "bg-purple-50 border-purple-200", textColor: "text-purple-800" },
  outdoor: { label: "Outdoor Areas", color: "bg-orange-50 border-orange-200", textColor: "text-orange-800" },
  general: { label: "General", color: "bg-gray-50 border-gray-200", textColor: "text-gray-800" }
};

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/avi', 'video/quicktime'];
const MAX_FILE_SIZE = 52428800; // 50MB

export function PropertyPhotoUploader({ propertyId, propertyName, isOpen, onClose, onUploadComplete }: PropertyPhotoUploaderProps) {
  const [uploads, setUploads] = useState<MediaUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<any[]>([]);
  const [showVerification, setShowVerification] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("exterior");
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
      photoCategory: 'exterior_front',
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

  // File selection handler  
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      // Validate file type
      const isImage = SUPPORTED_IMAGE_TYPES.includes(file.type);
      const isVideo = SUPPORTED_VIDEO_TYPES.includes(file.type);
      
      if (!isImage && !isVideo) {
        toast({
          title: "Unsupported File Type",
          description: `${file.name} is not a supported format. Please use JPG, PNG, GIF, WebP, MP4, WebM, AVI, or QuickTime files.`,
          variant: "destructive",
        });
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File Too Large",
          description: `${file.name} is larger than 50MB. Please compress the file or choose a smaller one.`,
          variant: "destructive",
        });
        continue;
      }

      try {
        const processedUpload = await processImage(file);
        setUploads(prev => [...prev, processedUpload]);
      } catch (error) {
        toast({
          title: "Processing Failed",
          description: `Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      }
    }

    // Reset input
    if (event.target) {
      event.target.value = '';
    }
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
    const uploadedItems: any[] = [];

    try {
      for (const upload of validUploads) {
        // Get upload URL from backend
        const uploadUrlResponse = await apiRequest("POST", "/api/property-photos/upload");
        const { uploadURL } = uploadUrlResponse;

        // Update progress
        setUploads(prev => prev.map(u => 
          u.id === upload.id 
            ? { ...u, status: 'uploading' as const, uploadProgress: 10 }
            : u
        ));

        // Upload the file (compressed or original)
        const fileToUpload = upload.compressedFile || upload.originalFile;
        
        const uploadResponse = await fetch(uploadURL, {
          method: 'PUT',
          body: fileToUpload,
          headers: {
            'Content-Type': fileToUpload.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed for ${upload.photoName}`);
        }

        // Update progress
        setUploads(prev => prev.map(u => 
          u.id === upload.id 
            ? { ...u, uploadProgress: 50 }
            : u
        ));

        // Save photo metadata to database using universal photos
        const photoData = {
          entityType: "property",
          entityId: propertyId,
          photoCategory: upload.photoCategory,
          photoName: upload.photoName,
          photoUrl: uploadURL.split('?')[0], // Remove query parameters
          photoPath: uploadURL.split('?')[0],
          originalResolution: upload.originalResolution,
          compressedResolution: upload.compressedResolution,
          resolutionPercentage: upload.resolutionPercentage,
          originalFileSize: upload.originalFileSize,
          compressedFileSize: upload.compressedFileSize || upload.originalFileSize,
          compressionRatio: upload.compressionRatio || 1.0,
          compressionQuality: upload.compressionQuality,
          mimeType: fileToUpload.type,
          thumbnailUrl: upload.thumbnailFile ? uploadURL.split('?')[0] : null, // You'd need separate thumbnail upload
          isCompressed: upload.compressedFile ? true : false,
          isMainPhoto: uploadedItems.length === 0, // First photo is main photo
          displayOrder: uploadedItems.length + 1,
          altText: `${propertyName} - ${upload.photoName}`,
          uploadedBy: "Admin", // You might want to get this from current user
          metadata: JSON.stringify({
            category: upload.photoCategory,
            mediaType: upload.mediaType,
            duration: upload.duration
          })
        };

        const saveResponse = await apiRequest("POST", "/api/universal-photos", photoData);
        uploadedItems.push(saveResponse);

        // Update to success
        setUploads(prev => prev.map(u => 
          u.id === upload.id 
            ? { ...u, status: 'success' as const, uploadProgress: 100 }
            : u
        ));
      }

      setUploadedPhotos(uploadedItems);
      setShowVerification(true);
      
      toast({
        title: "Upload Successful",
        description: `${uploadedItems.length} media files uploaded successfully for ${propertyName}`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload media files",
        variant: "destructive",
      });
      
      // Reset failed uploads
      setUploads(prev => prev.map(u => 
        u.status === 'uploading' 
          ? { ...u, status: 'error' as const, errorMessage: 'Upload failed' }
          : u
      ));
    } finally {
      setIsUploading(false);
    }
  };

  const removeUpload = (id: string) => {
    setUploads(prev => {
      const upload = prev.find(u => u.id === id);
      if (upload?.preview) {
        URL.revokeObjectURL(upload.preview);
      }
      return prev.filter(u => u.id !== id);
    });
  };

  const handleClose = () => {
    if (isUploading) return;
    
    // Clean up blob URLs
    uploads.forEach(upload => {
      if (upload.preview) {
        URL.revokeObjectURL(upload.preview);
      }
    });
    
    setUploads([]);
    setUploadedPhotos([]);
    setShowVerification(false);
    onClose();
  };

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
    if (files.length > 0) {
      // Create a synthetic event to reuse handleFileSelect logic
      const syntheticEvent = {
        target: { files: files, value: '' }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(syntheticEvent);
    }
  };

  const handleVerificationComplete = () => {
    setShowVerification(false);
    onUploadComplete();
    handleClose();
  };

  if (showVerification) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[hsl(213_94%_25%)]">
              ✅ Upload Verification - {propertyName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Upload Complete!</strong> {uploadedPhotos.length} media files have been successfully uploaded and processed for {propertyName}.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedPhotos.map((photo, index) => {
                const upload = uploads.find(u => u.photoName === photo.photoName);
                const category = PHOTO_CATEGORIES.find(c => c.value === photo.photoCategory);
                
                return (
                  <Card key={photo.id || index} className="overflow-hidden">
                    <div className="relative">
                      {upload?.preview && (
                        <img 
                          src={upload.preview} 
                          alt={photo.photoName}
                          className="w-full h-32 object-cover"
                        />
                      )}
                      {photo.isMainPhoto && (
                        <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
                          Main Photo
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{category?.icon}</span>
                          <span className="font-medium text-sm">{category?.label}</span>
                        </div>
                        <p className="text-xs text-gray-600">{photo.photoName}</p>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>Quality: {photo.resolutionPercentage}%</span>
                          <span>{photo.originalResolution}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                onClick={handleVerificationComplete}
                className="bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)]"
              >
                Complete Upload
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[hsl(213_94%_25%)]">
            📸 Property Media Upload - {propertyName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Category Selection */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {Object.entries(CATEGORY_GROUPS).map(([key, info]) => (
              <Button
                key={key}
                variant={selectedCategory === key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(key)}
                className={selectedCategory === key ? "bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)]" : ""}
              >
                {info.label}
              </Button>
            ))}
          </div>

          {/* File Upload Area */}
          <div 
            className={`border-2 border-dashed rounded p-8 text-center transition-colors ${
              dragActive ? 'border-[hsl(213_94%_25%)] bg-[hsl(213_94%_25%)]/5' : 'border-gray-300'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-[hsl(213_94%_25%)]/10 rounded-full">
                  <Upload className="w-8 h-8 text-[hsl(213_94%_25%)]" />
                </div>
              </div>
              
              <div>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)]"
                  disabled={isUploading}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Choose Photos & Videos
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
              📸 {CATEGORY_INFO[selectedCategory as keyof typeof CATEGORY_INFO].label} - Photo Guide
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {PHOTO_CATEGORIES
                .filter(cat => cat.category === selectedCategory)
                .map(category => (
                  <div 
                    key={category.value} 
                    className="flex items-center gap-3 p-2 bg-white/60 rounded-md"
                  >
                    <span className="text-lg">{category.icon}</span>
                    <div>
                      <div className="font-medium text-sm">{category.label}</div>
                      <div className="text-xs text-gray-600">{category.description}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Upload Preview */}
          {uploads.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Media Upload Queue ({uploads.length} files)</h3>
              
              <div className="max-h-80 overflow-y-auto space-y-3">
                {uploads.map((upload) => (
                  <Card key={upload.id} className={`p-4 ${upload.status === 'error' ? 'border-red-200 bg-red-50' : ''}`}>
                    <div className="flex gap-4">
                      {/* Preview */}
                      <div className="flex-shrink-0">
                        {upload.mediaType === 'video' ? (
                          <video 
                            src={upload.preview} 
                            className="w-16 h-16 object-cover rounded"
                            muted
                          />
                        ) : (
                          <img 
                            src={upload.preview} 
                            alt={upload.photoName}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{upload.photoName}</span>
                          <div className="flex items-center gap-2">
                            {upload.status === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                            {upload.status === 'error' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                            {upload.status === 'compressing' && <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
                            {upload.status === 'uploading' && <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeUpload(upload.id)}
                              disabled={isUploading}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

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
                              <span className="text-sm text-gray-600">Compressed:</span>
                              <Badge variant="outline">{upload.compressedResolution}</Badge>
                              <Badge variant="outline">
                                -{Math.round((1 - (upload.compressedFileSize! / upload.originalFileSize)) * 100)}%
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Category Selection for Individual Upload */}
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`category-${upload.id}`} className="text-sm">Category:</Label>
                          <Select
                            value={upload.photoCategory}
                            onValueChange={(value) => {
                              setUploads(prev => prev.map(u => 
                                u.id === upload.id ? { ...u, photoCategory: value } : u
                              ));
                            }}
                          >
                            <SelectTrigger className="w-48" id={`category-${upload.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PHOTO_CATEGORIES.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.icon} {category.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Progress Bar */}
                        {(upload.status === 'uploading' || upload.status === 'compressing') && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>{upload.status === 'compressing' ? 'Compressing...' : 'Uploading...'}</span>
                              <span>{upload.uploadProgress}%</span>
                            </div>
                            <Progress value={upload.uploadProgress} className="h-2" />
                          </div>
                        )}

                        {/* Error Message */}
                        {upload.status === 'error' && upload.errorMessage && (
                          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            ⚠️ {upload.errorMessage}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
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