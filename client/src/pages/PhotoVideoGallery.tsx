import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, Trash2, Star, Eye, RefreshCw, Image as ImageIcon, Building, Hotel, Bed, Bath, Sofa, Mountain, Coffee, Car, Plus, X, Link2, Check, Images, Video, Globe, RotateCcw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Image Preview Component
interface ImagePreviewProps {
  file: File;
  onLoad?: () => void;
  onError?: () => void;
}

function ImagePreview({ file, onLoad, onError }: ImagePreviewProps) {
  const [imgSrc, setImgSrc] = useState<string>("");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    console.log(`🔄 Creating preview for: ${file.name}`);
    
    if (!file || !file.type.startsWith('image/')) {
      console.error(`❌ Invalid file type: ${file.type}`);
      setHasError(true);
      onError?.();
      return;
    }

    try {
      const objectUrl = URL.createObjectURL(file);
      console.log(`📸 Created object URL: ${objectUrl}`);
      setImgSrc(objectUrl);
      
      return () => {
        console.log(`🧹 Cleaning up URL for: ${file.name}`);
        URL.revokeObjectURL(objectUrl);
      };
    } catch (error) {
      console.error(`❌ Failed to create object URL for ${file.name}:`, error);
      setHasError(true);
      onError?.();
    }
  }, [file, onError]);

  if (hasError || !imgSrc) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-red-100 text-red-600">
        <ImageIcon className="h-8 w-8 mb-2" />
        <span className="text-xs">Preview Error</span>
        <span className="text-xs">{file.name}</span>
      </div>
    );
  }

  return (
    <>
      <img
        src={imgSrc}
        alt={file.name}
        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
        style={{ 
          border: '3px solid orange',
          minHeight: '100px',
          backgroundColor: '#f0f0f0'
        }}
        onLoad={(e) => {
          console.log(`✅ Preview loaded: ${file.name}`);
          (e.currentTarget as HTMLImageElement).style.border = '3px solid green';
          (e.currentTarget as HTMLImageElement).style.backgroundColor = 'transparent';
          onLoad?.();
        }}
        onError={(e) => {
          console.error(`❌ Preview failed: ${file.name}`);
          (e.currentTarget as HTMLImageElement).style.border = '3px solid red';
          setHasError(true);
          onError?.();
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
        <div className="absolute bottom-1 left-1 text-white text-xs truncate max-w-full px-1">
          {file.name}
        </div>
      </div>
    </>
  );
}

interface Property {
  id: number;
  name: string;
  propertyType: string;
  roomTypeIds: number[];
}

interface RoomType {
  id: number;
  roomTypeName: string;
}

interface UniversalPhoto {
  id: number;
  entityType: string;
  entityId: number;
  photoCategory: string;
  photoName: string;
  photoUrl: string;
  photoPath: string;
  originalResolution: string;
  compressedResolution: string;
  resolutionPercentage: number;
  originalFileSize: number;
  compressedFileSize?: number;
  compressionRatio?: number;
  thumbnailUrl?: string;
  mediaType: string;
  mimeType: string;
  isMainPhoto: boolean;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  altText?: string;
  tags?: string[];
  uploadedBy: string;
}

interface RoomPhoto {
  id: number;
  roomTypeId: number;
  photoGroup: string;
  photoName: string;
  photoUrl: string;
  mediaType: string;
  originalResolution: string;
  originalFileSize: number;
  isMainPhoto: boolean;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

// Property Photo Categories with 360° support
const PROPERTY_CATEGORIES = [
  { value: "elevation", label: "Building Elevation", icon: "🏢", description: "Main building exterior and facade", supports360: true },
  { value: "entrance", label: "Main Entrance", icon: "🚪", description: "Property entrance and approach", supports360: false },
  { value: "lobby", label: "Lobby & Reception", icon: "🏨", description: "Reception area and main lobby", supports360: true },
  { value: "amenities", label: "Key Amenities", icon: "🏊", description: "Pool, gym, restaurant facilities", supports360: true },
  { value: "overview", label: "Property Overview", icon: "📸", description: "General property showcase", supports360: true },
  { value: "exterior_views", label: "Exterior Views", icon: "🌄", description: "Additional building views", supports360: true },
  { value: "room", label: "Room Interiors", icon: "🛏️", description: "Guest room interiors and layouts", supports360: true },
  { value: "restaurant", label: "Restaurant", icon: "🍽️", description: "Dining areas and restaurant views", supports360: true },
  { value: "swimming_pool", label: "Swimming Pool", icon: "🏊", description: "Pool area and aquatic facilities", supports360: true }
];

// Room Photo Categories
const ROOM_CATEGORIES = [
  { value: "bedroom", label: "Bedroom", icon: "🛏️", description: "Main sleeping area with bed and furniture" },
  { value: "washroom", label: "Washroom", icon: "🚿", description: "Bathroom with shower, toilet, and amenities" },
  { value: "restroom", label: "Restroom", icon: "🚽", description: "Additional toilet facilities" },
  { value: "living_area", label: "Living Area", icon: "🛋️", description: "Seating and entertainment space" },
  { value: "balcony", label: "Balcony", icon: "🌅", description: "Outdoor terrace or balcony area" },
  { value: "kitchen", label: "Kitchen", icon: "🍳", description: "Cooking and dining facilities" },
  { value: "view", label: "Room View", icon: "🪟", description: "Outside view from windows" }
];

export default function PhotoVideoGallery() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<number | null>(null);
  const [uploadType, setUploadType] = useState<"property" | "room">("property");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [mediaType, setMediaType] = useState<"photo" | "pano360" | "video">("photo");
  const [selectedPhoto, setSelectedPhoto] = useState<UniversalPhoto | RoomPhoto | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState<Record<string, string>>({});
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get image URL with optimization - Route through backend API for private storage
  const getImageUrl = (url: string, optimize: boolean = false) => {
    if (!url) {
      console.log('❌ Empty URL provided');
      return '';
    }
    
    // For Google Cloud Storage URLs, extract the object path and serve through API
    if (url.startsWith('https://storage.googleapis.com/')) {
      // Extract everything after the bucket name including .private
      const urlParts = url.split('/');
      const bucketIndex = urlParts.findIndex(part => part.includes('replit-objstore'));
      if (bucketIndex >= 0 && bucketIndex < urlParts.length - 1) {
        const objectPath = urlParts.slice(bucketIndex + 1).join('/');
        const finalUrl = `/objects/${objectPath}`;
        console.log('🔄 Serving GCS through API:', finalUrl, 'from original:', url);
        return finalUrl;
      }
    }
    
    // For relative paths, serve through object storage API
    if (!url.startsWith('http')) {
      const finalUrl = `/objects/${url.replace(/^\/+/, '')}`;
      console.log('🔄 Serving relative path through API:', finalUrl);
      return finalUrl;
    }
    
    // For external URLs, use as-is
    console.log('✅ Using external URL:', url);
    return url;
  };

  // Handle multiple file selection - simplified approach
  const handleFileSelection = (files: FileList) => {
    const filesArray = Array.from(files);
    console.log(`📁 Selected ${filesArray.length} files:`, filesArray.map(f => f.name));
    
    setSelectedFiles(prev => {
      const newFiles = [...prev, ...filesArray];
      console.log(`📋 Total files: ${newFiles.length}`);
      return newFiles;
    });
    
    setIsReviewMode(true);
  };

  // Remove file from selection
  const removeFile = (fileName: string) => {
    console.log(`🗑️ Removing file: ${fileName}`);
    setSelectedFiles(prev => prev.filter(file => file.name !== fileName));
  };

  // Clear all selections
  const clearSelection = () => {
    console.log('🧹 Clearing all selections');
    setSelectedFiles([]);
    setFilePreviewUrls({});
    setIsReviewMode(false);
    setUploadProgress({});
    
    // Reset file inputs
    const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
    fileInputs.forEach(input => {
      input.value = '';
    });
  };

  // Fetch properties
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  // Fetch room types
  const { data: roomTypes = [] } = useQuery<RoomType[]>({
    queryKey: ["/api/room-types"],
  });

  // Fetch property photos
  const { data: propertyPhotosResponse, refetch: refetchPropertyPhotos } = useQuery({
    queryKey: ["/api/universal-photos", "property", selectedPropertyId],
    queryFn: async () => {
      if (!selectedPropertyId) return { photos: [] };
      const response = await fetch(`/api/universal-photos?entityType=property&entityId=${selectedPropertyId}`);
      if (!response.ok) throw new Error('Failed to fetch property photos');
      const data = await response.json();
      return data;
    },
    enabled: !!selectedPropertyId
  });
  
  const propertyPhotos = (propertyPhotosResponse?.photos || []) as UniversalPhoto[];
  


  // Fetch room photos by property
  const { data: roomPhotos = [], refetch: refetchRoomPhotos } = useQuery<RoomPhoto[]>({
    queryKey: ["/api/room-photos", selectedPropertyId],
    queryFn: async () => {
      if (!selectedPropertyId) return [];
      
      // Get room types that belong to this property (including null propertyId for backward compatibility)
      const propertyRoomTypes = roomTypes.filter(rt => rt.propertyId === selectedPropertyId || rt.propertyId === null);
      if (propertyRoomTypes.length === 0) return [];
      
      const allRoomPhotos: RoomPhoto[] = [];
      for (const roomType of propertyRoomTypes) {
        const response = await fetch(`/api/room-photos?roomTypeId=${roomType.id}`);
        if (response.ok) {
          const photos = await response.json();
          allRoomPhotos.push(...photos);
        }
      }
      console.log(`🏠 Loaded ${allRoomPhotos.length} room photos for property ${selectedPropertyId}`);
      return allRoomPhotos;
    },
    enabled: !!selectedPropertyId && roomTypes.length > 0
  });

  const selectedProperty = selectedPropertyId ? properties.find(p => p.id === selectedPropertyId) : null;
  const availableRoomTypes = roomTypes.filter(rt => rt.propertyId === selectedPropertyId || rt.propertyId === null) || [];

  // Handle batch upload with 360° support
  const handleBatchUpload = async (uploadType: "property" | "room", category: string, roomTypeId?: number, mediaTypeOverride?: "photo" | "pano360" | "video") => {
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);
    let successCount = 0;
    let failedCount = 0;
    
    try {
      for (const file of selectedFiles) {
        try {
          setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
          
          let uploadURL: string;
          
          if (uploadType === "property") {
            const response = await apiRequest("POST", "/api/universal-photos/upload", {
              entityType: "property",
              entityId: selectedPropertyId,
              photoCategory: category
            });
            const data = await response.json();
            uploadURL = data.uploadURL;
          } else {
            const response = await apiRequest("POST", "/api/room-photos/upload");
            const data = await response.json();
            uploadURL = data.uploadURL;
          }

          setUploadProgress(prev => ({ ...prev, [file.name]: 25 }));

          // Upload file to cloud storage
          const uploadResponse = await fetch(uploadURL, {
            method: "PUT",
            body: file,
            headers: { 'Content-Type': file.type },
          });

          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload ${file.name}`);
          }

          setUploadProgress(prev => ({ ...prev, [file.name]: 50 }));

          // Get file info with 360° support
          const finalMediaType = mediaTypeOverride || mediaType || (file.type.startsWith('image/') ? 'photo' : 'video');
          let resolution = "1920x1080";
          
          if (finalMediaType === 'photo' || finalMediaType === 'pano360') {
            const ImageConstructor = globalThis.Image || window.Image;
            const img = new ImageConstructor();
            img.src = URL.createObjectURL(file);
            await new Promise((resolve) => {
              img.onload = () => {
                resolution = `${img.naturalWidth}x${img.naturalHeight}`;
                URL.revokeObjectURL(img.src);
                resolve(null);
              };
            });
          }

          setUploadProgress(prev => ({ ...prev, [file.name]: 75 }));

          if (uploadType === "property") {
            await apiRequest("POST", "/api/universal-photos", {
              entityType: "property",
              entityId: selectedPropertyId,
              photoCategory: category,
              photoName: file.name.replace(/\.[^/.]+$/, ""),
              photoUrl: uploadURL.split('?')[0],
              photoPath: `/universal-photos/${uploadURL.split('/').pop()?.split('?')[0]}`,
              originalResolution: resolution,
              compressedResolution: resolution,
              resolutionPercentage: 95,
              originalFileSize: file.size,
              mediaType: finalMediaType,
              mimeType: file.type,
              isMainPhoto: false,
              displayOrder: 1,
              isActive: true,
              uploadedBy: "admin"
            });
          } else {
            await apiRequest("POST", "/api/room-photos", {
              roomTypeId,
              photoGroup: category,
              photoName: file.name.replace(/\.[^/.]+$/, ""),
              photoUrl: uploadURL.split('?')[0],
              photoPath: `/room-photos/${uploadURL.split('/').pop()?.split('?')[0]}`,
              originalResolution: resolution,
              compressedResolution: resolution,
              resolutionPercentage: 95,
              originalFileSize: file.size,
              mediaType: finalMediaType,
              mimeType: file.type,
              isMainPhoto: false,
              displayOrder: 1,
              isActive: true,
              uploadedBy: "admin"
            });
          }

          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
          successCount++;
          
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          failedCount++;
          setUploadProgress(prev => ({ ...prev, [file.name]: -1 })); // -1 indicates error
        }
      }

      // Force refresh gallery data with cache invalidation
      if (uploadType === "property") {
        // Invalidate with the correct query key structure
        queryClient.invalidateQueries({ 
          queryKey: ["/api/universal-photos", "property", selectedPropertyId] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ["/api/universal-photos"] 
        });
        await refetchPropertyPhotos();
      } else {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/room-photos", selectedPropertyId] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ["/api/room-photos"] 
        });
        await refetchRoomPhotos();
      }

      // Show summary toast
      if (successCount > 0) {
        toast({
          title: `Batch Upload Complete! 🎉`,
          description: `${successCount} photos uploaded successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}. Photos are now visible in ${category} gallery.`,
        });
      }

      if (failedCount === selectedFiles.length) {
        toast({
          title: "Upload Failed",
          description: `All ${failedCount} photos failed to upload. Please check your connection and try again.`,
          variant: "destructive",
        });
      }

      // Add small delay to ensure backend processing completes
      if (successCount > 0) {
        setTimeout(() => {
          clearSelection();
          setIsUploadDialogOpen(false);
        }, 500);
      } else {
        clearSelection();
        setIsUploadDialogOpen(false);
      }
      
    } catch (error) {
      toast({
        title: "Batch Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload photos",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getQualityBadgeColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-100 text-green-800";
    if (percentage >= 80) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  // Group photos by category
  const propertyPhotosByCategory = (propertyPhotos || []).reduce((acc, photo) => {
    if (!acc[photo.photoCategory]) acc[photo.photoCategory] = [];
    acc[photo.photoCategory].push(photo);
    return acc;
  }, {} as Record<string, UniversalPhoto[]>);
  
  

  const roomPhotosByCategory = (roomPhotos || []).reduce((acc, photo) => {
    if (!acc[photo.photoGroup]) acc[photo.photoGroup] = [];
    acc[photo.photoGroup].push(photo);
    return acc;
  }, {} as Record<string, RoomPhoto[]>);

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[hsl(213_94%_25%)]">Photo & Video Gallery</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage property and room photos for the booking portal</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => {
              if (selectedPropertyId) {
                refetchPropertyPhotos();
                refetchRoomPhotos();
              }
            }}
            disabled={!selectedPropertyId}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Property Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Select Property
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <Label htmlFor="property-select" className="text-sm font-medium">Property Name</Label>
              <Select 
                value={selectedPropertyId?.toString() || ""} 
                onValueChange={(value) => {
                  setSelectedPropertyId(parseInt(value));
                  setSelectedRoomTypeId(null);
                }}
              >
                <SelectTrigger id="property-select" className="mt-1">
                  <SelectValue placeholder="Select a property to manage photos" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Hotel className="h-4 w-4" />
                        <span className="truncate">{property.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedProperty && (
              <div className="text-sm text-gray-600 space-y-1 bg-gray-50 p-3 rounded">
                <p><strong>Property Type:</strong> {selectedProperty.propertyType}</p>
                <p><strong>Room Types:</strong> {availableRoomTypes.length} types available</p>
                <p><strong>Photos:</strong> {propertyPhotos.length} property + {roomPhotos.length} room photos</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedPropertyId && (
        <>
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Photos & Videos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Property Photos */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Property Photos
                  </h3>
                  <p className="text-sm text-gray-600">Photos displayed on booking portal property listings</p>
                  <div className="space-y-2">
                    {PROPERTY_CATEGORIES.map((category) => (
                      <div key={category.value} className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full justify-start h-auto p-4"
                          onClick={() => {
                            setUploadType("property");
                            setSelectedCategory(category.value);
                            setMediaType("photo");
                            setIsUploadDialogOpen(true);
                          }}
                        >
                          <div className="flex items-start gap-3 text-left">
                            <span className="text-lg">{category.icon}</span>
                            <div className="flex-1">
                              <div className="font-medium">{category.label}</div>
                              <div className="text-xs text-gray-500">{category.description}</div>
                              <div className="text-xs text-blue-600 mt-1">
                                {propertyPhotosByCategory[category.value]?.filter(p => p.mediaType !== 'pano360').length || 0} regular photos
                                {category.supports360 && ` • ${propertyPhotosByCategory[category.value]?.filter(p => p.mediaType === 'pano360').length || 0} 360° photos`}
                              </div>
                            </div>
                            <Camera className="h-4 w-4 text-gray-400" />
                          </div>
                        </Button>
                        
                        {/* 360° Upload Button for supported categories */}
                        {category.supports360 && (
                          <Button
                            variant="outline"
                            className="w-full justify-start h-auto p-3 bg-blue-50 border-blue-200 hover:bg-blue-100"
                            onClick={() => {
                              setUploadType("property");
                              setSelectedCategory(category.value);
                              setMediaType("pano360");
                              setIsUploadDialogOpen(true);
                            }}
                          >
                            <div className="flex items-center gap-3 text-left">
                              <Globe className="h-4 w-4 text-blue-600" />
                              <div className="flex-1">
                                <div className="font-medium text-blue-700">Upload 360° Photos</div>
                                <div className="text-xs text-blue-600">Panoramic photos for {category.label.toLowerCase()}</div>
                              </div>
                              <RotateCcw className="h-3 w-3 text-blue-500" />
                            </div>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Room Photos */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg flex items-center gap-2">
                    <Bed className="h-5 w-5" />
                    Room Photos
                  </h3>
                  <p className="text-sm text-gray-600">Photos for room type selection during booking</p>
                  
                  {availableRoomTypes.length > 0 ? (
                    <div className="space-y-4">
                      {/* Enhanced Room Type Selector */}
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <Label className="text-sm font-medium text-blue-700 mb-3 block">
                          📱 Touch to Select Room Type
                        </Label>
                        <div className="grid grid-cols-1 gap-2">
                          {availableRoomTypes.map((roomType) => (
                            <Button
                              key={roomType!.id}
                              variant={selectedRoomTypeId === roomType!.id ? "default" : "outline"}
                              className={`w-full justify-start h-auto p-4 text-left ${
                                selectedRoomTypeId === roomType!.id 
                                  ? "bg-blue-600 text-white border-blue-600" 
                                  : "hover:bg-blue-100 border-blue-300"
                              }`}
                              onClick={() => setSelectedRoomTypeId(roomType!.id)}
                            >
                              <div className="flex items-center gap-3 w-full">
                                <div className="w-10 h-10 bg-white/20 rounded flex items-center justify-center">
                                  <Bed className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium">{roomType!.roomTypeName}</div>
                                  <div className="text-xs opacity-75">
                                    {roomType!.roomSizeSquareMeters} sq m • {roomType!.maxOccupancy} guests
                                  </div>
                                </div>
                                {selectedRoomTypeId === roomType!.id && (
                                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                                  </div>
                                )}
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>

                      {selectedRoomTypeId && (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <div className="mb-3 flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium text-green-700">
                              Room Type Selected: {availableRoomTypes.find(rt => rt!.id === selectedRoomTypeId)?.roomTypeName}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mb-3">
                            <Label className="text-sm font-medium text-green-700">
                              📸 Touch to Select Photo Category
                            </Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                console.log('🔄 Manual refresh triggered');
                                await refetchRoomPhotos();
                                toast({
                                  title: "Photos Refreshed",
                                  description: "Room photos have been reloaded",
                                });
                              }}
                              className="text-xs h-7"
                            >
                              🔄 Refresh Photos
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {ROOM_CATEGORIES.map((category) => (
                              <Button
                                key={category.value}
                                variant="outline"
                                className="h-auto p-3 bg-white hover:bg-green-100 border-green-300 text-left"
                                onClick={() => {
                                  setUploadType("room");
                                  setSelectedCategory(category.value);
                                  setIsUploadDialogOpen(true);
                                }}
                              >
                                <div className="flex flex-col items-center gap-2 w-full">
                                  <span className="text-2xl">{category.icon}</span>
                                  <div className="text-center">
                                    <div className="font-medium text-xs">{category.label}</div>
                                    <div className="text-xs text-green-600">
                                      {roomPhotosByCategory[category.value]?.filter(p => 
                                        'roomTypeId' in p && p.roomTypeId === selectedRoomTypeId
                                      ).length || 0} photos
                                    </div>
                                  </div>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Alert>
                      <AlertDescription>
                        No room types found for this property. Please add room types in Property Master first.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gallery View */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Photo Gallery - {selectedProperty?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Property Photos */}
                {Object.keys(propertyPhotosByCategory).length > 0 && (
                  <div>
                    <h3 className="font-medium text-lg mb-4 flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Property Photos ({propertyPhotos.length})
                    </h3>
                    <div className="space-y-6">
                      {Object.entries(propertyPhotosByCategory).map(([categoryKey, categoryPhotos]) => {
                        const categoryInfo = PROPERTY_CATEGORIES.find(c => c.value === categoryKey);
                        return (
                          <div key={categoryKey}>
                            <div className="flex items-center gap-2 mb-3">
                              <Badge className="bg-blue-100 text-blue-800">
                                {categoryInfo?.icon} {categoryInfo?.label || categoryKey} ({categoryPhotos.length})
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
                              {categoryPhotos.map((photo) => (
                                <div
                                  key={photo.id}
                                  className="relative group cursor-pointer"
                                  onClick={() => setSelectedPhoto(photo)}
                                >
                                  <img
                                    src={getImageUrl(photo.thumbnailUrl || photo.photoUrl)}
                                    alt={photo.altText || photo.photoName}
                                    className="w-full h-24 object-cover rounded"
                                    onError={(e) => {
                                      console.error(`❌ Failed to load photo: ${photo.photoName} - URL: ${photo.photoUrl}`);
                                      (e.currentTarget as HTMLImageElement).style.border = '2px solid red';
                                      e.currentTarget.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300";
                                    }}
                                    onLoad={() => {
                                      console.log(`✅ Loaded photo: ${photo.photoName} - URL: ${photo.photoUrl}`);
                                    }}
                                  />
                                  {photo.isMainPhoto && (
                                    <Badge className="absolute top-1 left-1 bg-yellow-500 text-white text-xs">
                                      <Star className="h-2 w-2 mr-1" />
                                      Main
                                    </Badge>
                                  )}
                                  <Badge className={`absolute top-1 right-1 text-xs ${getQualityBadgeColor(photo.resolutionPercentage)}`}>
                                    {photo.resolutionPercentage}%
                                  </Badge>
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-center justify-center">
                                    <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selected Room Type Photos */}
                {selectedRoomTypeId && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Bed className="h-4 w-4 text-purple-600" />
                      </div>
                      <h3 className="font-medium text-lg text-purple-800">
                        {availableRoomTypes.find(rt => rt!.id === selectedRoomTypeId)?.roomTypeName} Photos
                      </h3>
                      <Badge className="bg-purple-100 text-purple-700">
                        {roomPhotos.filter(p => p.roomTypeId === selectedRoomTypeId).length} photos
                      </Badge>
                    </div>
                    
                    {(() => {
                      const selectedRoomPhotos = roomPhotos.filter(p => p.roomTypeId === selectedRoomTypeId);
                      console.log(`🔍 Debug - Total room photos: ${roomPhotos.length}`);
                      console.log(`🔍 Debug - Selected room type ID: ${selectedRoomTypeId}`);
                      console.log(`🔍 Debug - Filtered photos for room type: ${selectedRoomPhotos.length}`);
                      console.log(`🔍 Debug - All room photos:`, roomPhotos.map(p => ({ id: p.id, roomTypeId: p.roomTypeId, group: p.photoGroup })));
                      
                      const photosByCategory = selectedRoomPhotos.reduce((acc, photo) => {
                        const group = photo.photoGroup || 'other';
                        if (!acc[group]) acc[group] = [];
                        acc[group].push(photo);
                        return acc;
                      }, {} as Record<string, RoomPhoto[]>);
                      
                      if (Object.keys(photosByCategory).length === 0) {
                        return (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Camera className="h-8 w-8 text-purple-400" />
                            </div>
                            <p className="text-purple-600 font-medium">No photos uploaded yet</p>
                            <p className="text-purple-500 text-sm">Upload photos using the buttons above</p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="space-y-6">
                          {Object.entries(photosByCategory).map(([categoryKey, categoryPhotos]) => {
                            const categoryInfo = ROOM_CATEGORIES.find(c => c.value === categoryKey);
                            return (
                              <div key={categoryKey}>
                                <div className="flex items-center gap-2 mb-3">
                                  <Badge className="bg-purple-100 text-purple-800 text-sm">
                                    {categoryInfo?.icon} {categoryInfo?.label || categoryKey} ({categoryPhotos.length})
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                  {categoryPhotos.map((photo) => (
                                    <div
                                      key={photo.id}
                                      className="relative group cursor-pointer bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                      onClick={() => setSelectedPhoto(photo)}
                                    >
                                      <img
                                        src={getImageUrl(photo.photoUrl)}
                                        alt={photo.photoName}
                                        className="w-full h-28 object-cover"
                                        onError={(e) => {
                                          console.error(`❌ Upload failed for: ${photo.photoName} - URL: ${photo.photoUrl}`);
                                          e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzVMMTIwIDk1SDgwTDEwMCA3NVoiIGZpbGw9IiM2QjcyODAiLz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwIDJBOCA4IDAgMSAwIDEwIDE4QTggOCAwIDAgMCAxMCAyWiIgc3Ryb2tlPSIjRUM0ODk5IiBzdHJva2Utd2lkdGg9IjIiLz4KPHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTUgNUw3IDdIM0w1IDVaIiBmaWxsPSIjNkI3MjgwIi8+Cjwvc3ZnPgo8L3N2Zz4K";
                                          e.currentTarget.style.border = "2px dashed #EF4444";
                                          e.currentTarget.style.backgroundColor = "#FEF2F2";
                                        }}
                                      />
                                      {photo.isMainPhoto && (
                                        <Badge className="absolute top-2 left-2 bg-yellow-500 text-white text-xs">
                                          <Star className="h-3 w-3 mr-1" />
                                          Main
                                        </Badge>
                                      )}
                                      <Badge className={`absolute top-2 right-2 text-xs ${getQualityBadgeColor(photo.resolutionPercentage)}`}>
                                        {photo.resolutionPercentage}%
                                      </Badge>
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                                        <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                      <div className="p-2 bg-white">
                                        <p className="text-xs font-medium text-gray-700 truncate">{photo.photoName}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* All Room Photos (when no specific room type selected) */}
                {!selectedRoomTypeId && Object.keys(roomPhotosByCategory).length > 0 && (
                  <div>
                    <h3 className="font-medium text-lg mb-4 flex items-center gap-2">
                      <Bed className="h-5 w-5" />
                      All Room Photos ({roomPhotos.length})
                    </h3>
                    <div className="space-y-6">
                      {Object.entries(roomPhotosByCategory).map(([categoryKey, categoryPhotos]) => {
                        const categoryInfo = ROOM_CATEGORIES.find(c => c.value === categoryKey);
                        return (
                          <div key={categoryKey}>
                            <div className="flex items-center gap-2 mb-3">
                              <Badge className="bg-green-100 text-green-800">
                                {categoryInfo?.icon} {categoryInfo?.label || categoryKey} ({categoryPhotos.length})
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
                              {categoryPhotos.map((photo) => {
                                const roomType = roomTypes.find(rt => rt.id === (photo as RoomPhoto).roomTypeId);
                                return (
                                  <div
                                    key={photo.id}
                                    className="relative group cursor-pointer"
                                    onClick={() => setSelectedPhoto(photo)}
                                  >
                                    <img
                                      src={getImageUrl((photo as RoomPhoto).photoUrl)}
                                      alt={photo.photoName}
                                      className="w-full h-24 object-cover rounded"
                                      onError={(e) => {
                                        console.error(`❌ Failed to load room photo: ${photo.photoName}`);
                                        e.currentTarget.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300";
                                      }}
                                    />
                                    {photo.isMainPhoto && (
                                      <Badge className="absolute top-1 left-1 bg-yellow-500 text-white text-xs">
                                        <Star className="h-2 w-2 mr-1" />
                                        Main
                                      </Badge>
                                    )}
                                    <div className="absolute bottom-1 left-1 right-1">
                                      <Badge className="bg-white text-black text-xs truncate w-full">
                                        {roomType?.roomTypeName}
                                      </Badge>
                                    </div>
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-center justify-center">
                                      <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {propertyPhotos.length === 0 && roomPhotos.length === 0 && (
                  <Alert>
                    <ImageIcon className="h-4 w-4" />
                    <AlertDescription>
                      No photos uploaded yet. Use the upload buttons above to add photos to your property gallery.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload {uploadType === "property" ? "Property" : "Room"} Photo/Video
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category: {PROPERTY_CATEGORIES.find(c => c.value === selectedCategory)?.label || ROOM_CATEGORIES.find(c => c.value === selectedCategory)?.label}</Label>
              {selectedRoomTypeId && uploadType === "room" && (
                <p className="text-sm text-gray-600">
                  Room Type: {roomTypes.find(rt => rt.id === selectedRoomTypeId)?.roomTypeName}
                </p>
              )}
            </div>
            {/* Enhanced Multi-Photo Upload Interface */}
            {!isReviewMode ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="multi-file-upload" className="flex items-center gap-2">
                    <Images className="h-4 w-4 text-[hsl(213_94%_25%)]" />
                    Select Multiple Photos
                  </Label>
                  <Input
                    id="multi-file-upload"
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileSelection(e.target.files);
                      }
                    }}
                    disabled={isUploading}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    📸 <strong>Multi-select supported!</strong> Hold Ctrl/Cmd to select multiple photos at once.
                    <br />
                    🎯 Supports: Images (JPG, PNG, GIF, WebP) and Videos (MP4, WebM, AVI, MOV). Max size: 50MB each
                  </p>
                </div>
                
                {/* Quick Upload Button */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 font-medium">💡 Pro Tip:</p>
                  <p className="text-xs text-blue-700">Select multiple photos to upload them all at once! Preview and verify before uploading.</p>
                </div>
              </div>
            ) : (
              /* Photo Preview & Verification Interface */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-lg flex items-center gap-2">
                    📋 Review Selected Photos ({selectedFiles.length})
                  </h4>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.getElementById('add-more-files') as HTMLInputElement;
                        input.click();
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add More
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSelection}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear All
                    </Button>
                  </div>
                </div>


                {/* Photo Preview Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-80 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                  {selectedFiles.length === 0 ? (
                    <div className="col-span-full text-center text-gray-500 py-8">
                      <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No files selected yet</p>
                    </div>
                  ) : (
                    selectedFiles.map((file, index) => (
                    <div key={file.name} className="relative group">
                      <div className="aspect-square bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <div className="w-full h-full relative">
                          {file.type.startsWith('image/') ? (
                            <ImagePreview 
                              file={file} 
                              onLoad={() => console.log(`✅ Preview loaded: ${file.name}`)}
                              onError={() => console.error(`❌ Preview failed: ${file.name}`)}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                              <Video className="h-8 w-8 text-blue-600 mb-2" />
                              <span className="text-xs text-blue-800 font-medium">Video File</span>
                              <span className="text-xs text-blue-600 truncate max-w-full px-1">{file.name}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Fallback error display */}
                        <div className="hidden w-full h-full flex flex-col items-center justify-center bg-red-100 text-red-500">
                          <ImageIcon className="h-6 w-6 mb-1" />
                          <span className="text-xs">Preview Error</span>
                        </div>
                        
                        {/* Remove Button */}
                        <button
                          onClick={() => removeFile(file.name)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>

                        {/* Upload Progress Indicator */}
                        {uploadProgress[file.name] !== undefined && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            {uploadProgress[file.name] === -1 ? (
                              <div className="text-red-400 text-xs">❌ Error</div>
                            ) : uploadProgress[file.name] === 100 ? (
                              <div className="text-green-400 text-xs">✅ Uploaded</div>
                            ) : (
                              <div className="text-white text-xs">{uploadProgress[file.name]}%</div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* File Info */}
                      <div className="mt-1 text-xs">
                        <p className="text-gray-600 truncate" title={file.name}>
                          {file.name.length > 15 ? `${file.name.substring(0, 12)}...` : file.name}
                        </p>
                        <p className="text-gray-500">{(file.size / 1024 / 1024).toFixed(1)}MB</p>
                      </div>
                    </div>
                    ))
                  )}
                </div>

                {/* Hidden input for adding more files */}
                <input
                  id="add-more-files"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileSelection(e.target.files);
                    }
                  }}
                  className="hidden"
                />

                {/* Upload Actions */}
                <div className="flex flex-col gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleBatchUpload(uploadType, selectedCategory, selectedRoomTypeId || undefined)}
                    disabled={isUploading || selectedFiles.length === 0}
                    className="bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)] text-white"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Uploading {selectedFiles.length} Photos...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload All {selectedFiles.length} Photos to {selectedCategory}
                      </>
                    )}
                  </Button>
                  
                  <p className="text-xs text-center text-gray-500">
                    ✨ All photos will be uploaded to <strong>{selectedCategory}</strong> category
                    {uploadType === "room" && selectedRoomTypeId && (
                      <> for <strong>{roomTypes.find(rt => rt.id === selectedRoomTypeId)?.roomTypeName}</strong></>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-[hsl(213_94%_25%)]" />
                {selectedPhoto.photoName}
                <Badge className="ml-2 bg-[hsl(213_94%_25%)] text-white">
                  {'photoCategory' in selectedPhoto ? selectedPhoto.photoCategory : (selectedPhoto as RoomPhoto).photoGroup}
                </Badge>
                <Badge variant="outline" className="ml-1 text-green-600 border-green-600">
                  ✨ Recently Added
                </Badge>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 min-h-96 flex justify-center items-center">
                <div className="absolute top-4 right-4">
                  <Badge className="bg-black/50 text-white">
                    📸 {'entityType' in selectedPhoto ? 'Property Photo' : 'Room Photo'}
                  </Badge>
                </div>
                <img
                  src={getImageUrl('photoUrl' in selectedPhoto ? selectedPhoto.photoUrl : (selectedPhoto as RoomPhoto).photoUrl)}
                  alt={selectedPhoto.photoName}
                  className="max-w-full max-h-96 object-contain rounded-lg shadow-lg hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    console.error('❌ Failed to load image:', selectedPhoto.photoName);
                    e.currentTarget.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
                  }}
                  onLoad={() => {
                    console.log('✅ Loaded modal photo:', selectedPhoto.photoName);
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium">Photo Details</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span>{'entityType' in selectedPhoto ? 'Property Photo' : 'Room Photo'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span>{'photoCategory' in selectedPhoto ? selectedPhoto.photoCategory : (selectedPhoto as RoomPhoto).photoGroup}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Resolution:</span>
                      <span>{selectedPhoto.originalResolution}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">File Size:</span>
                      <span>{formatFileSize(selectedPhoto.originalFileSize)}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Upload Info</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Uploaded:</span>
                      <span>{formatDate(selectedPhoto.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge variant={selectedPhoto.isActive ? "default" : "secondary"}>
                        {selectedPhoto.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {selectedPhoto.isMainPhoto && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Main Photo:</span>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Star className="h-3 w-3 mr-1" />
                          Yes
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 min-w-32"
                  onClick={() => {
                    const photoUrl = 'photoUrl' in selectedPhoto ? selectedPhoto.photoUrl : (selectedPhoto as RoomPhoto).photoUrl;
                    window.open(getImageUrl(photoUrl), '_blank');
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Size
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 min-w-32"
                  onClick={() => {
                    const photoUrl = 'photoUrl' in selectedPhoto ? selectedPhoto.photoUrl : (selectedPhoto as RoomPhoto).photoUrl;
                    const imageUrl = getImageUrl(photoUrl);
                    navigator.clipboard.writeText(window.location.origin + imageUrl);
                    toast({
                      title: "Link Copied! 📋",
                      description: "Photo URL copied to clipboard",
                    });
                  }}
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  Copy URL
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 min-w-32 bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)]"
                  onClick={() => setSelectedPhoto(null)}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Done Viewing
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}