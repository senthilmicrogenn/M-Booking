import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, Wifi, Car, Dumbbell, Coffee, Plus, Check } from "lucide-react";
import type { Property } from "@shared/schema";

interface PropertyCardProps {
  property: Property;
  onViewDetails: (property: Property) => void;
  photos?: any[]; // Photos from universal_photos for this property
  isSelected?: boolean;
  onCompareToggle?: (property: Property, isSelected: boolean) => void;
  compareLimit?: number;
  selectedCount?: number;
}

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

// Get property image with gallery integration and smart fallback
const getPropertyImage = (photos: any[]) => {
  const mainPhoto = photos.find(p => p.isMainPhoto) || photos[0];
  
  if (mainPhoto) {
    console.log('📷 Using gallery photo:', mainPhoto.photoUrl);
    return getImageUrl(mainPhoto.photoUrl);
  }
  
  console.log('🖼️ No gallery photos, using placeholder');
  return "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300";
};

export default function PropertyCard({ 
  property, 
  onViewDetails, 
  photos = [], 
  isSelected = false, 
  onCompareToggle,
  compareLimit = 3,
  selectedCount = 0 
}: PropertyCardProps) {
  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    
    return (
      <div className="flex text-yellow-400 mr-2">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < rating ? "fill-current" : ""}`}
          />
        ))}
      </div>
    );
  };

  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wifi')) return <Wifi className="w-3 h-3 mr-1" />;
    if (amenityLower.includes('pool') || amenityLower.includes('swimming')) return <Car className="w-3 h-3 mr-1" />;
    if (amenityLower.includes('gym') || amenityLower.includes('fitness')) return <Dumbbell className="w-3 h-3 mr-1" />;
    if (amenityLower.includes('breakfast') || amenityLower.includes('coffee')) return <Coffee className="w-3 h-3 mr-1" />;
    return null;
  };

  const getBadgeColor = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wifi')) return "bg-green-100 text-green-800";
    if (amenityLower.includes('pool') || amenityLower.includes('swimming')) return "bg-blue-100 text-blue-800";
    if (amenityLower.includes('gym') || amenityLower.includes('fitness')) return "bg-purple-100 text-purple-800";
    if (amenityLower.includes('breakfast') || amenityLower.includes('coffee')) return "bg-orange-100 text-orange-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <Card className="hover:shadow-md transition duration-300" data-testid={`card-property-${property.id}`}>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <img
              src={getPropertyImage(photos)}
              alt={property.name}
              className="w-full h-48 object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
              data-testid={`img-property-${property.id}`}
              onError={(e) => {
                console.log('Property card image failed to load for property:', property.id, ', switching to placeholder');
                e.currentTarget.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300';
              }}
            />
          </div>
          <div className="md:col-span-2 p-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-semibold text-gray-900" data-testid={`text-property-name-${property.id}`}>
                {property.name}
              </h3>
              <div className="flex items-center">
                {renderStars(property.rating ? parseFloat(property.rating) : null)}
                <span className="text-sm text-gray-600" data-testid={`text-rating-${property.id}`}>
                  {property.rating ? `${parseFloat(property.rating).toFixed(1)} star` : "Unrated"}
                </span>
              </div>
            </div>
            <p className="text-gray-600 mb-3" data-testid={`text-description-${property.id}`}>
              {property.description}
            </p>
            <p className="text-sm text-gray-500 mb-3" data-testid={`text-location-${property.id}`}>
              {property.city}, {property.area || 'N/A'}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {property.amenities?.slice(0, 3).map((amenity, index) => (
                <Badge
                  key={index}
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(amenity)}`}
                  data-testid={`badge-amenity-${property.id}-${index}`}
                >
                  {getAmenityIcon(amenity)}
                  {amenity}
                </Badge>
              ))}
            </div>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-2xl font-bold text-secondary-600" data-testid={`text-price-${property.id}`}>
                  ₹{property.hourlyRate ? parseFloat(property.hourlyRate).toLocaleString() : '2500'}
                </span>
                <span className="text-gray-600">/night</span>
              </div>
              <div className="flex gap-2 items-center">
                {/* Compare checkbox/button */}
                {onCompareToggle && (
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className={`flex items-center gap-1 ${
                        isSelected 
                          ? 'bg-[#006699] text-white border-primary-600 hover:bg-[#002a66]' 
                          : 'border-gray-300 text-primary-600 hover:bg-gray-50'
                      }`}
                      onClick={() => onCompareToggle(property, !isSelected)}
                      disabled={!isSelected && selectedCount >= compareLimit}
                      data-testid={`button-compare-${property.id}`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3 h-3" />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          Compare
                        </>
                      )}
                    </Button>
                  </div>
                )}
                <Button
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2"
                  onClick={() => onViewDetails(property)}
                  data-testid={`button-view-details-${property.id}`}
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
