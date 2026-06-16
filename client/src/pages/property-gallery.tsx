import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Building, ImageIcon, Camera, Users, Globe, ChevronLeft, ChevronRight, Home, Eye } from "lucide-react";
import { useState, useRef } from "react";

interface UniversalPhoto {
  id: number;
  entityType: string;
  entityId: number;
  photoCategory: string;
  photoName: string;
  photoUrl: string;
  thumbnailUrl?: string;
  altText?: string;
  isMainPhoto: boolean;
  displayOrder: number;
  isActive: boolean;
}

interface Property {
  id: number;
  name: string;
  type: string;
}

// Property Photo Categories - Exact match with database
const PROPERTY_CATEGORIES = [
  { value: "elevation", label: "Elevation", icon: "🏢", description: "Building exterior views" },
  { value: "entrance", label: "Entrance", icon: "🚪", description: "Main entrance and approach" },
  { value: "lobby", label: "Lobby", icon: "🏨", description: "Reception and lobby area" },
  { value: "amenities", label: "Amenities", icon: "🏊", description: "Pool and facility areas" },
  { value: "overview", label: "Overview", icon: "🏛️", description: "General property views" },
  { value: "exterior_views", label: "Exterior Views", icon: "🌳", description: "Outdoor areas and surroundings" }
];

export default function PropertyGallery() {
  const [match, params] = useRoute("/property-gallery/:propertyId");
  const propertyId = params?.propertyId ? parseInt(params.propertyId) : null;
  const [selectedPhoto, setSelectedPhoto] = useState<UniversalPhoto | null>(null);
  const [activeTab, setActiveTab] = useState("property");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: 'left' | 'right') => {
    const container = categoryScrollRef.current;
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Get image URL - Route through backend API for private storage
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
    
    // For relative paths, construct the API URL
    const baseUrl = optimize ? '/api/object-storage/optimized/' : '/api/object-storage/';
    const finalUrl = baseUrl + url.replace(/^\/+/, '');
    console.log('🔄 Constructed URL:', finalUrl, 'from original:', url);
    return finalUrl;
  };

  // Fetch property details
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const property = properties.find(p => p.id === propertyId);

  // Fetch property photos
  const { data: propertyPhotosResponse } = useQuery({
    queryKey: ["/api/universal-photos", "property", propertyId],
    queryFn: async () => {
      if (!propertyId) return { photos: [] };
      const response = await fetch(`/api/universal-photos?entityType=property&entityId=${propertyId}`);
      if (!response.ok) throw new Error('Failed to fetch property photos');
      const data = await response.json();
      return data;
    },
    enabled: !!propertyId
  });
  
  const propertyPhotos = (propertyPhotosResponse?.photos || []) as UniversalPhoto[];

  // Group photos by category
  const photosByCategory = propertyPhotos.reduce((acc, photo) => {
    if (!acc[photo.photoCategory]) acc[photo.photoCategory] = [];
    acc[photo.photoCategory].push(photo);
    return acc;
  }, {} as Record<string, UniversalPhoto[]>);

  if (!propertyId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h1>
          <p className="text-gray-600">Please select a valid property to view the gallery.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              {/* Navigation Buttons */}
              <div className="flex items-center gap-2">
                <Link href={`/hotel-details/${propertyId}`}>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-primary-600 hover:text-gray-800 hover:bg-gray-100"
                    data-testid="button-back-to-details"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Hotel Details
                  </Button>
                </Link>
                
                <Separator orientation="vertical" className="h-6" />
                
                <Link href="/booking-portal">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-primary-600 hover:text-gray-800 hover:bg-gray-100"
                    data-testid="button-back-to-search"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Back to Search
                  </Button>
                </Link>
                
                <Separator orientation="vertical" className="h-6" />
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.close()}
                  className="text-primary-600 hover:text-gray-800 hover:bg-gray-100"
                  data-testid="button-close-gallery"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Close
                </Button>
              </div>
              
              <div>
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  {property?.name || 'Property Gallery'}
                </h1>
                <p className="text-sm text-primary-600">
                  {propertyPhotos.length} photos in {Object.keys(photosByCategory).length} categories
                </p>
              </div>
            </div>
            
            {/* Additional Actions */}
            <div className="flex items-center gap-2">
              <Badge className="bg-gray-100 text-[#006699] border-gray-300">
                <Camera className="w-3 h-3 mr-1" />
                Gallery View
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Content with MakeMyTrip-style Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Main Tabs - Property Photos, Traveller Photos, View 360 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-transparent p-0 flex gap-3">
            <TabsTrigger 
              value="property" 
              className="flex items-center gap-2 px-4 py-2 rounded-full border-2 bg-white data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-primary-50 data-[state=inactive]:border-gray-300 data-[state=inactive]:text-gray-700"
            >
              Property Photos
            </TabsTrigger>
            <TabsTrigger 
              value="traveller" 
              className="flex items-center gap-2 px-4 py-2 rounded-full border-2 bg-white data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-primary-50 data-[state=inactive]:border-gray-300 data-[state=inactive]:text-gray-700"
            >
              Traveller Photos
            </TabsTrigger>
            <TabsTrigger 
              value="view360" 
              className="flex items-center gap-2 px-4 py-2 rounded-full border-2 bg-white data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-primary-50 data-[state=inactive]:border-gray-300 data-[state=inactive]:text-gray-700"
            >
              <Globe className="w-4 h-4" />
              View <Badge variant="outline" className="ml-1 text-xs bg-pink-100 text-pink-600 border-pink-300">new</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Property Photos Tab */}
          <TabsContent value="property" className="space-y-6">
            {/* Category Navigation - Arrow Navigation */}
            <div className="bg-white border border-gray-200 rounded p-4">
              <div className="relative flex items-center">
                {/* Left Arrow */}
                <button
                  onClick={() => scrollCategories('left')}
                  className="absolute left-0 z-10 bg-white shadow-md rounded-full p-2 hover:bg-gray-50 transition-colors border border-gray-200"
                  data-testid="category-scroll-left"
                >
                  <ChevronLeft className="w-4 h-4 text-primary" />
                </button>
                
                {/* Categories Container */}
                <div 
                  ref={categoryScrollRef}
                  className="flex gap-2 overflow-x-auto scrollbar-hide mx-8"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {/* All Categories Button */}
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`flex-shrink-0 px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                      selectedCategory === null
                        ? 'bg-primary text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                    data-testid="category-all"
                  >
                    All
                  </button>
                  
                  {PROPERTY_CATEGORIES.map((category) => {
                    const categoryPhotos = photosByCategory[category.value] || [];
                    
                    return (
                      <button
                        key={category.value}
                        onClick={() => setSelectedCategory(category.value)}
                        className={`flex-shrink-0 px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                          selectedCategory === category.value
                            ? 'bg-primary text-white'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                        data-testid={`category-${category.value}`}
                      >
                        <span className="mr-1">{category.icon}</span>
                        {category.label}
                        <Badge variant="outline" className="ml-2 text-xs bg-white/20">
                          {categoryPhotos.length}
                        </Badge>
                      </button>
                    );
                  })}
                </div>

                {/* Right Arrow */}
                <button
                  onClick={() => scrollCategories('right')}
                  className="absolute right-0 z-10 bg-white shadow-md rounded-full p-2 hover:bg-gray-50 transition-colors border border-gray-200"
                  data-testid="category-scroll-right"
                >
                  <ChevronRight className="w-4 h-4 text-primary" />
                </button>
              </div>
            </div>

            {/* Photos Grid */}
            <div className="space-y-8">
              {(selectedCategory ? [selectedCategory] : Object.keys(photosByCategory)).map((categoryKey) => {
                const category = PROPERTY_CATEGORIES.find(c => c.value === categoryKey);
                const categoryPhotos = photosByCategory[categoryKey] || [];
                
                if (categoryPhotos.length === 0) return null;

                return (
                  <Card key={categoryKey} className="overflow-hidden">
                    <CardHeader className="bg-gray-50">
                      <CardTitle className="flex items-center gap-3">
                        <span className="text-2xl">{category?.icon || '📸'}</span>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">{category?.label || categoryKey}</h2>
                          <p className="text-sm text-gray-600 font-normal">{category?.description || 'Property photos'}</p>
                          <p className="text-sm text-blue-600 font-medium mt-1">
                            {categoryPhotos.length} photo{categoryPhotos.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {categoryPhotos
                          .sort((a, b) => a.displayOrder - b.displayOrder)
                          .map((photo) => (
                            <div
                              key={photo.id}
                              className="group relative bg-gray-100 rounded overflow-hidden aspect-square cursor-pointer hover:shadow-lg transition-all duration-200"
                              onClick={() => setSelectedPhoto(photo)}
                              data-testid={`image-${photo.id}`}
                            >
                              <img
                                src={getImageUrl(photo.thumbnailUrl || photo.photoUrl, true)}
                                alt={photo.altText || photo.photoName}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                onError={(e) => {
                                  console.log('❌ Image failed to load:', photo.photoUrl);
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.classList.remove('hidden');
                                }}
                              />
                              <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-200">
                                <div className="text-gray-500 text-center">
                                  <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                                  <p className="text-sm">Image not available</p>
                                  <p className="text-xs text-gray-400">{photo.photoName}</p>
                                </div>
                              </div>
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <p className="text-white text-sm font-medium truncate">
                                  {photo.photoName}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Traveller Photos Tab */}
          <TabsContent value="traveller" className="space-y-6">
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Traveller Photos</h3>
                  <p className="text-gray-600">
                    Traveller photos will be displayed here when available.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* View 360 Tab */}
          <TabsContent value="view360" className="space-y-6">
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Globe className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">360° View Coming Soon</h3>
                  <p className="text-gray-600">
                    Virtual tour and 360° views will be available here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* No Photos State */}
        {propertyPhotos.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Photos Available</h3>
                <p className="text-gray-600">
                  This property doesn't have any photos uploaded yet.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
          data-testid="modal-photo-viewer"
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2 z-10"
              data-testid="button-close-modal"
            >
              <ArrowLeft className="w-6 h-6 transform rotate-45" />
            </button>
            <img
              src={getImageUrl(selectedPhoto.photoUrl)}
              alt={selectedPhoto.altText || selectedPhoto.photoName}
              className="max-w-full max-h-full object-contain rounded"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 text-white p-4 rounded">
              <h3 className="font-medium text-lg">{selectedPhoto.photoName}</h3>
              {selectedPhoto.altText && (
                <p className="text-sm text-gray-300 mt-1">{selectedPhoto.altText}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}