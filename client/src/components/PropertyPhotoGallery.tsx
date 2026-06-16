import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Star, Eye, Download, RefreshCw, Image as ImageIcon, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PropertyPhotoGalleryProps {
  propertyId: number;
  propertyName: string;
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

const CATEGORY_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  elevation: { label: "Building Elevation", icon: "🏢", color: "bg-blue-100 text-blue-800" },
  entrance: { label: "Main Entrance", icon: "🚪", color: "bg-green-100 text-green-800" },
  lobby: { label: "Lobby & Reception", icon: "🏨", color: "bg-purple-100 text-purple-800" },
  amenities: { label: "Key Amenities", icon: "🏊", color: "bg-cyan-100 text-cyan-800" },
  overview: { label: "Property Overview", icon: "📸", color: "bg-yellow-100 text-yellow-800" },
  exterior_views: { label: "Exterior Views", icon: "🌄", color: "bg-orange-100 text-orange-800" }
};

export function PropertyPhotoGallery({ propertyId, propertyName }: PropertyPhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<UniversalPhoto | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch property photos
  const { data: photos = [], isLoading, refetch } = useQuery<UniversalPhoto[]>({
    queryKey: ["/api/universal-photos", "property", propertyId],
    queryFn: async () => {
      const response = await fetch(`/api/universal-photos?entityType=property&entityId=${propertyId}`);
      if (!response.ok) throw new Error('Failed to fetch property photos');
      const data = await response.json();
      console.log(`📸 Fetched photos for property ${propertyId}:`, data.photos?.length || 0, 'photos');
      // API returns a gallery object with photos array, extract just the photos
      return data.photos || [];
    },
    refetchOnWindowFocus: true,
    refetchInterval: 5000 // Auto-refresh every 5 seconds
  });

  // Delete photo mutation
  const deleteMutation = useMutation({
    mutationFn: async (photoId: number) => {
      const response = await fetch(`/api/universal-photos/${photoId}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error('Failed to delete photo');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/universal-photos"] });
      toast({ title: "Photo deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete photo", variant: "destructive" });
    }
  });

  // Set main photo mutation
  const setMainPhotoMutation = useMutation({
    mutationFn: async (photoId: number) => {
      const response = await fetch(`/api/universal-photos/${photoId}/set-main`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType: "property", entityId: propertyId })
      });
      if (!response.ok) throw new Error('Failed to set main photo');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/universal-photos"] });
      toast({ title: "Main photo updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to set main photo", variant: "destructive" });
    }
  });

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

  const getQualityBadgeColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-100 text-green-800";
    if (percentage >= 80) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  // Filter and group photos by category (only show active photos)
  const activePhotos = photos.filter(photo => photo.isActive !== false);
  const photosByCategory = activePhotos.reduce((acc, photo) => {
    if (!acc[photo.photoCategory]) {
      acc[photo.photoCategory] = [];
    }
    acc[photo.photoCategory].push(photo);
    return acc;
  }, {} as Record<string, UniversalPhoto[]>);

  // Sort photos within each category by display order
  Object.keys(photosByCategory).forEach(category => {
    photosByCategory[category].sort((a, b) => a.displayOrder - b.displayOrder);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading property photos...</span>
      </div>
    );
  }

  if (activePhotos.length === 0) {
    return (
      <Alert>
        <ImageIcon className="h-4 w-4" />
        <AlertDescription>
          No photos found for Property {propertyId} ({propertyName}). Use the "Upload Property Media" button above to add photos for the booking portal.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span className="font-medium">{activePhotos.length}</span> active photos across{" "}
          <span className="font-medium">{Object.keys(photosByCategory).length}</span> categories
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </Button>
      </div>

      {/* Photos by Category */}
      {Object.entries(photosByCategory).map(([categoryKey, categoryPhotos]) => {
        const categoryInfo = CATEGORY_LABELS[categoryKey] || { 
          label: categoryKey, 
          icon: "📷", 
          color: "bg-gray-100 text-gray-800" 
        };

        return (
          <div key={categoryKey} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className={categoryInfo.color}>
                {categoryInfo.icon} {categoryInfo.label}
              </Badge>
              <span className="text-sm text-gray-500">({categoryPhotos.length} photos)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categoryPhotos.map((photo) => (
                <Card key={photo.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative">
                    <img
                      src={getImageUrl(photo.thumbnailUrl || photo.photoUrl)}
                      alt={photo.altText || photo.photoName}
                      className="w-full h-32 object-cover cursor-pointer"
                      onClick={() => setSelectedPhoto(photo)}
                      onError={(e) => {
                        console.error(`❌ Failed to load photo: ${photo.photoName} - URL: ${photo.photoUrl}`);
                        e.currentTarget.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300";
                      }}
                      onLoad={() => {
                        console.log(`✅ Loaded photo: ${photo.photoName}`);
                      }}
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-2 left-2 space-y-1">
                      {photo.isMainPhoto && (
                        <Badge className="bg-yellow-500 text-white text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Main
                        </Badge>
                      )}
                      <Badge className={getQualityBadgeColor(photo.resolutionPercentage)}>
                        {photo.resolutionPercentage}%
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPhoto(photo);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        {!photo.isMainPhoto && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMainPhotoMutation.mutate(photo.id);
                            }}
                            disabled={setMainPhotoMutation.isPending}
                          >
                            <Star className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this photo?')) {
                              deleteMutation.mutate(photo.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm truncate">{photo.photoName}</h4>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Resolution:</span>
                          <span>{photo.originalResolution}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Size:</span>
                          <span>{formatFileSize(photo.originalFileSize)}</span>
                        </div>
                        {photo.compressionRatio && (
                          <div className="flex justify-between">
                            <span>Compression:</span>
                            <span>{(photo.compressionRatio * 100).toFixed(0)}%</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Uploaded:</span>
                          <span>{formatDate(photo.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                {selectedPhoto.photoName}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Full Image */}
              <div className="flex justify-center">
                <img
                  src={getImageUrl(selectedPhoto.photoUrl)}
                  alt={selectedPhoto.altText || selectedPhoto.photoName}
                  className="max-w-full max-h-96 object-contain rounded-lg"
                  onError={(e) => {
                    console.error(`❌ Failed to load full-size photo: ${selectedPhoto.photoName}`);
                    e.currentTarget.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
                  }}
                />
              </div>

              {/* Photo Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Photo Information</h4>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <Badge className={CATEGORY_LABELS[selectedPhoto.photoCategory]?.color}>
                        {CATEGORY_LABELS[selectedPhoto.photoCategory]?.label || selectedPhoto.photoCategory}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Resolution:</span>
                      <span>{selectedPhoto.originalResolution}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quality Score:</span>
                      <Badge className={getQualityBadgeColor(selectedPhoto.resolutionPercentage)}>
                        {selectedPhoto.resolutionPercentage}%
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">File Size:</span>
                      <span>{formatFileSize(selectedPhoto.originalFileSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">File Type:</span>
                      <span>{selectedPhoto.mimeType}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Upload Details</h4>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Uploaded by:</span>
                      <span>{selectedPhoto.uploadedBy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Upload Date:</span>
                      <span>{formatDate(selectedPhoto.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Display Order:</span>
                      <span>{selectedPhoto.displayOrder}</span>
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

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                {!selectedPhoto.isMainPhoto && (
                  <Button
                    onClick={() => setMainPhotoMutation.mutate(selectedPhoto.id)}
                    disabled={setMainPhotoMutation.isPending}
                    className="bg-yellow-500 hover:bg-yellow-600"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Set as Main Photo
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this photo?')) {
                      deleteMutation.mutate(selectedPhoto.id);
                      setSelectedPhoto(null);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Photo
                </Button>
                <Button variant="outline" onClick={() => setSelectedPhoto(null)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}