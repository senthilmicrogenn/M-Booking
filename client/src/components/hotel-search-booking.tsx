import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, MapPin, Users, Bed, Star, Wifi, Car, Coffee, Utensils, ChevronRight, ChevronLeft, Filter, SlidersHorizontal, Heart, ArrowUpDown, MapPinIcon, ImageIcon, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertBookingSchema, type Property, type RoomType } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

interface SearchParams {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
}

interface FilterState {
  priceRange: string[];
  starRating: number[];
  amenities: string[];
  propertyCategories: string[];
  propertyAreas: string[];
  guestRatings: string[];
  roomViews: string[];
  policies: string[];
  sortBy: string;
}

interface ComparisonState {
  selectedProperties: number[];
  showComparison: boolean;
}

const searchSchema = z.object({
  location: z.string().min(1, "Location is required"),
  checkIn: z.string().min(1, "Check-in date is required"),
  checkOut: z.string().min(1, "Check-out date is required"),
  guests: z.number().min(1, "At least 1 guest required"),
  rooms: z.number().min(1, "At least 1 room required")
});

// Currency mapping based on country codes
const CURRENCY_MAP: Record<string, { symbol: string; code: string }> = {
  US: { symbol: '$', code: 'USD' },
  IN: { symbol: '₹', code: 'INR' },
  GB: { symbol: '£', code: 'GBP' },
  CA: { symbol: 'C$', code: 'CAD' },
  AU: { symbol: 'A$', code: 'AUD' },
  EU: { symbol: '€', code: 'EUR' },
  // Default fallback
  default: { symbol: '₹', code: 'INR' }
};

// Custom hook for currency detection
const useCurrency = () => {
  const [currency, setCurrency] = useState(CURRENCY_MAP.default);

  useEffect(() => {
    const detectCurrency = async () => {
      try {
        // Try to get user's timezone first
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        let countryCode = 'IN'; // default

        if (timezone.includes('America/')) {
          countryCode = 'US';
        } else if (timezone.includes('Europe/')) {
          countryCode = 'EU';
        } else if (timezone.includes('Asia/Kolkata') || timezone.includes('Asia/Calcutta')) {
          countryCode = 'IN';
        } else if (timezone.includes('Europe/London')) {
          countryCode = 'GB';
        }

        // Try to get more accurate location using IP geolocation API
        try {
          const response = await fetch('https://ipapi.co/country_code/', {
            method: 'GET',
            headers: { 'Accept': 'text/plain' }
          });
          if (response.ok) {
            const detectedCountry = await response.text();
            countryCode = detectedCountry.trim().toUpperCase();
          }
        } catch (error) {
          console.log('IP geolocation failed, using timezone-based detection');
        }

        const detectedCurrency = CURRENCY_MAP[countryCode] || CURRENCY_MAP.default;
        setCurrency(detectedCurrency);
      } catch (error) {
        console.log('Currency detection failed, using default');
        setCurrency(CURRENCY_MAP.default);
      }
    };

    detectCurrency();
  }, []);

  return currency;
};

const bookingFormSchema = insertBookingSchema.extend({
  guestName: z.string().min(2, "Guest name is required"),
  guestEmail: z.string().email("Valid email is required"),
  guestPhone: z.string().min(10, "Valid phone number is required"),
  totalAmount: z.string().optional(),
  propertyId: z.number().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  adults: z.number().optional(),
  rooms: z.number().optional()
});

export function HotelSearchBooking() {
  const [searchResults, setSearchResults] = useState<Property[]>([]);
  const [filteredResults, setFilteredResults] = useState<Property[]>([]);
  const [initialLoad, setInitialLoad] = useState(false);
  const [propertyPhotos, setPropertyPhotos] = useState<{[key: number]: any[]}>({});
  const [selectedMainPhoto, setSelectedMainPhoto] = useState<{[key: number]: number}>({});
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [priceBreakdown, setPriceBreakdown] = useState<any>(null);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const currency = useCurrency();
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [],
    starRating: [],
    amenities: [],
    propertyCategories: [],
    propertyAreas: [],
    guestRatings: [],
    roomViews: [],
    policies: [],
    sortBy: 'popularity'
  });
  const [comparison, setComparison] = useState<ComparisonState>({
    selectedProperties: [],
    showComparison: false
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search form
  const searchForm = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      location: "",
      checkIn: "",
      checkOut: "",
      guests: 2,
      rooms: 1
    }
  });

  // Booking form
  const bookingForm = useForm<z.infer<typeof bookingFormSchema>>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      adults: 2,
      rooms: 1
    }
  });

  // Queries
  const { data: roomTypes = [] } = useQuery({
    queryKey: ["/api/room-types"],
    enabled: !!selectedProperty
  });

  const { data: planMasters = [] } = useQuery({
    queryKey: ["/api/plan-masters"]
  });

  const { data: currencies = [] } = useQuery({
    queryKey: ["/api/currencies"]
  });

  // Master data queries for advanced filtering
  const { data: propertyCategories = [] } = useQuery({
    queryKey: ["/api/property-categories"]
  });

  const { data: propertyAreas = [] } = useQuery({
    queryKey: ["/api/property-areas"]
  });

  const { data: propertyAmenities = [] } = useQuery({
    queryKey: ["/api/property-amenities"]
  });

  const { data: customerReviewRatings = [] } = useQuery({
    queryKey: ["/api/customer-review-ratings"]
  });

  const { data: roomViews = [] } = useQuery({
    queryKey: ["/api/room-views"]
  });

  // Load all properties initially for browsing
  const { data: allProperties = [], isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"]
  });

  // Search properties mutation
  const searchMutation = useMutation({
    mutationFn: async (searchData: SearchParams) => {
      const params = new URLSearchParams({
        type: "hotel",
        location: searchData.location,
        portalMode: "true",
        checkIn: searchData.checkIn,
        checkOut: searchData.checkOut,
        guests: searchData.guests.toString(),
        rooms: searchData.rooms.toString()
      });
      
      const response = await fetch(`/api/properties?${params}`);
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    },
    onSuccess: (data) => {
      setSearchResults(data);
      setFilteredResults(data);
      // Fetch photos for each property
      fetchPropertyPhotos(data);
      toast({
        title: "Search completed",
        description: `Found ${data.length} approved hotels with room availability`
      });
    },
    onError: () => {
      toast({
        title: "Search failed",
        description: "Unable to search properties. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Price calculation mutation
  const priceMutation = useMutation({
    mutationFn: async (priceData: any) => {
      const response = await fetch("/api/calculate-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(priceData)
      });
      if (!response.ok) throw new Error('Failed to calculate price');
      return response.json();
    },
    onSuccess: (data) => {
      setPriceBreakdown(data);
      bookingForm.setValue("totalAmount", data.totalAmount.toString());
    }
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData)
      });
      if (!response.ok) throw new Error('Failed to create booking');
      return response.json();
    },
    onSuccess: (booking) => {
      toast({
        title: "Booking confirmed!",
        description: `Your booking has been created successfully`
      });
      setIsBookingDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      
      // Reset forms
      searchForm.reset();
      bookingForm.reset();
      setSearchResults([]);
      setSelectedProperty(null);
      setSelectedRoomType(null);
      setPriceBreakdown(null);
    },
    onError: () => {
      toast({
        title: "Booking failed",
        description: "Unable to create booking. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onSearch = (data: z.infer<typeof searchSchema>) => {
    setSearchParams(data);
    searchMutation.mutate(data);
  };

  const onSelectRoom = (property: Property, roomType: RoomType) => {
    if (!searchParams) return;
    
    setSelectedProperty(property);
    setSelectedRoomType(roomType);
    
    // Calculate pricing
    const nights = Math.ceil((new Date(searchParams.checkOut).getTime() - new Date(searchParams.checkIn).getTime()) / (1000 * 60 * 60 * 24));
    
    bookingForm.setValue("propertyId", property.id);
    bookingForm.setValue("checkIn", searchParams.checkIn);
    bookingForm.setValue("checkOut", searchParams.checkOut);
    bookingForm.setValue("adults", searchParams.guests);
    bookingForm.setValue("rooms", searchParams.rooms);
    
    priceMutation.mutate({
      propertyId: property.id,
      roomTypeId: roomType.id,
      checkIn: searchParams.checkIn,
      checkOut: searchParams.checkOut,
      adults: searchParams.guests,
      children: 0,
      infants: 0,
      rooms: searchParams.rooms
    });
  };

  const onCreateBooking = (data: z.infer<typeof bookingFormSchema>) => {
    if (!selectedProperty || !selectedRoomType) return;
    createBookingMutation.mutate(data);
  };

  // Filter and sort functions
  const applyFilters = () => {
    let filtered = [...searchResults];

    // Apply price range filter
    if (filters.priceRange.length > 0) {
      filtered = filtered.filter(property => {
        const price = parseFloat((property as any).hourlyRate || (property as any).pricePerNight || "0");
        // If no price is available, don't filter out the property
        if (price === 0) return true;
        
        // Check if price falls within any selected range
        return filters.priceRange.some(range => {
          if (range === 'Above 25000') {
            return price >= 25000;
          }
          const [min, max] = range.split('-').map(Number);
          return price >= min && price <= max;
        });
      });
    }

    // Apply star rating filter
    if (filters.starRating.length > 0) {
      filtered = filtered.filter(property => 
        filters.starRating.includes(Math.floor(parseFloat(property.rating || "0")))
      );
    }

    // Apply amenities filter
    if (filters.amenities.length > 0) {
      filtered = filtered.filter(property => 
        filters.amenities.some(amenity => 
          property.amenities?.includes(amenity)
        )
      );
    }

    // Apply property categories filter
    if (filters.propertyCategories.length > 0) {
      filtered = filtered.filter(property => 
        filters.propertyCategories.includes(property.type || "")
      );
    }

    // Apply property areas filter
    if (filters.propertyAreas.length > 0) {
      filtered = filtered.filter(property => 
        filters.propertyAreas.includes(property.area || "")
      );
    }

    // Apply guest ratings filter
    if (filters.guestRatings.length > 0) {
      filtered = filtered.filter(property => {
        const rating = parseFloat(property.rating || "0");
        return filters.guestRatings.some(range => {
          if (range === "4.5-5.0") return rating >= 4.5 && rating <= 5.0;
          if (range === "4.0-4.4") return rating >= 4.0 && rating < 4.5;
          if (range === "3.5-3.9") return rating >= 3.5 && rating < 4.0;
          if (range === "3.0-3.4") return rating >= 3.0 && rating < 3.5;
          return rating < 3.0;
        });
      });
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'price-low':
        filtered.sort((a, b) => parseFloat((a as any).hourlyRate || (a as any).pricePerNight || "0") - parseFloat((b as any).hourlyRate || (b as any).pricePerNight || "0"));
        break;
      case 'price-high':
        filtered.sort((a, b) => parseFloat((b as any).hourlyRate || (b as any).pricePerNight || "0") - parseFloat((a as any).hourlyRate || (a as any).pricePerNight || "0"));
        break;
      case 'rating':
        filtered.sort((a, b) => parseFloat(b.rating || "0") - parseFloat(a.rating || "0"));
        break;
      case 'popularity':
      default:
        filtered.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
        break;
    }

    setFilteredResults(filtered);
  };

  const togglePropertyComparison = (propertyId: number) => {
    const isSelected = comparison.selectedProperties.includes(propertyId);
    if (isSelected) {
      setComparison(prev => ({
        ...prev,
        selectedProperties: prev.selectedProperties.filter(id => id !== propertyId)
      }));
    } else if (comparison.selectedProperties.length < 3) {
      setComparison(prev => ({
        ...prev,
        selectedProperties: [...prev.selectedProperties, propertyId]
      }));
    } else {
      toast({
        title: "Maximum comparison limit",
        description: "You can compare up to 3 properties at once",
        variant: "destructive"
      });
    }
  };

  const getPropertyAmenities = (amenities: string[] | null) => {
    if (!amenities) return [];
    const amenityIcons: { [key: string]: any } = {
      'WiFi': Wifi,
      'Parking': Car,
      'Breakfast': Coffee,
      'Restaurant': Utensils
    };
    return amenities.slice(0, 4).map(amenity => ({
      name: amenity,
      icon: amenityIcons[amenity] || Coffee
    }));
  };

  // Fetch ALL photos for property - both property photos AND room photos combined
  const fetchPropertyPhotos = async (properties: Property[]) => {
    const photoPromises = properties.map(async (property) => {
      try {
        let allPhotos: any[] = [];
        
        // STEP 1: Get property photos from universal_photos
        console.log(`🔍 [Property ${property.id}] Step 1: Fetching property photos...`);
        const propertyResponse = await fetch(`/api/universal-photos?entityType=property&entityId=${property.id}&_t=${Date.now()}`, {
          cache: 'no-cache'
        });
        if (propertyResponse.ok) {
          const data = await propertyResponse.json();
          const propertyPhotos = data.photos || [];
          allPhotos = [...propertyPhotos];
          console.log(`✅ [Property ${property.id}] Found ${propertyPhotos.length} property photo(s)`);
        }
        
        // STEP 2: Get room photos for room types that BELONG to this property only
        console.log(`🔍 [Property ${property.id}] Step 2: Fetching room photos from old room_photos table...`);
        try {
          // Fetch room types filtered by property ID from the backend
          const roomTypesResponse = await fetch(`/api/room-types?propertyId=${property.id}`);
          if (roomTypesResponse.ok) {
            const roomTypesData = await roomTypesResponse.json();
            // Filter to only room types that explicitly belong to this property (not NULL)
            const propertyRoomTypes = roomTypesData.filter((rt: any) => rt.propertyId === property.id);
            
            if (propertyRoomTypes.length > 0) {
              console.log(`🔍 [Property ${property.id}] Found ${propertyRoomTypes.length} room type(s) belonging to this property`);
              
              // Fetch old room_photos for each room type
              const oldRoomPhotoPromises = propertyRoomTypes.map(async (roomType: any) => {
                const response = await fetch(`/api/room-photos?roomTypeId=${roomType.id}`);
                if (response.ok) {
                  return await response.json();
                }
                return [];
              });
              
              const oldRoomPhotoArrays = await Promise.all(oldRoomPhotoPromises);
              const oldRoomPhotosFlat = oldRoomPhotoArrays.flat();
              
              if (oldRoomPhotosFlat.length > 0) {
                // Convert old room photos to universal photo format
                const oldPhotos = oldRoomPhotosFlat.map((roomPhoto: any) => ({
                  id: `old-${roomPhoto.id}`,
                  photoUrl: roomPhoto.photo_url,
                  photoPath: roomPhoto.photo_url,
                  photoName: roomPhoto.photo_name || `Room Photo ${roomPhoto.id}`,
                  isMainPhoto: false,
                  isActive: true,
                  entityType: 'room',
                  entityId: roomPhoto.roomTypeId
                }));
                allPhotos = [...allPhotos, ...oldPhotos];
                console.log(`✅ [Property ${property.id}] Added ${oldPhotos.length} photo(s) from old room_photos table`);
              }
            } else {
              console.log(`ℹ️ [Property ${property.id}] No room types belong to this property`);
            }
          }
        } catch (roomError) {
          console.warn(`⚠️ [Property ${property.id}] Error fetching room photos:`, roomError);
        }
        
        console.log(`📊 [Property ${property.id}] TOTAL: ${allPhotos.length} photo(s) combined`);
        return { propertyId: property.id, photos: allPhotos };
      } catch (error) {
        console.error(`❌ [Property ${property.id}] Unexpected error:`, error);
        return { propertyId: property.id, photos: [] };
      }
    });

    const results = await Promise.all(photoPromises);
    const photosMap: {[key: number]: any[]} = {};
    results.forEach(({ propertyId, photos }) => {
      photosMap[propertyId] = photos;
    });
    setPropertyPhotos(photosMap);
  };

  // Convert storage URL to backend API URL with optimization - EXACT MATCH with photo gallery
  const getImageUrl = (photoUrl: string, optimize = false) => {
    if (!photoUrl) {
      console.log('❌ Empty URL provided');
      return '';
    }
    
    // For Google Cloud Storage URLs, extract the object path and serve through API
    if (photoUrl.startsWith('https://storage.googleapis.com/')) {
      // Extract everything after the bucket name including .private
      const urlParts = photoUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part.includes('replit-objstore'));
      if (bucketIndex >= 0 && bucketIndex < urlParts.length - 1) {
        const objectPath = urlParts.slice(bucketIndex + 1).join('/');
        const finalUrl = `/objects/${objectPath}`;
        console.log('🔄 Serving GCS through API:', finalUrl, 'from original:', photoUrl);
        return finalUrl;
      }
    }
    
    // For external URLs (like Unsplash), use as-is
    if (photoUrl.startsWith('http')) {
      console.log('✅ Using external URL:', photoUrl);
      return photoUrl;
    }
    
    // For relative paths, construct the API URL (EXACT MATCH with photo gallery)
    const baseUrl = optimize ? '/api/object-storage/optimized/' : '/api/object-storage/';
    const finalUrl = baseUrl + photoUrl.replace(/^\/+/, '');
    console.log('🔄 Constructed URL:', finalUrl, 'from original:', photoUrl);
    return finalUrl;
  };

  // Get main photo for property with proper URL
  const getPropertyMainPhoto = (propertyId: number) => {
    const photos = propertyPhotos[propertyId] || [];
    const selectedIndex = selectedMainPhoto[propertyId] || 0;
    let photo = photos[selectedIndex];
    if (!photo) {
      photo = photos.find(p => p.isMainPhoto) || photos[0];
    }
    if (photo) {
      console.log(`📸 Property ${propertyId} main photo:`, photo);
      // Handle both photoUrl and photoPath fields
      const url = photo.photoUrl || photo.photoPath || photo.photo_url;
      if (!url) {
        console.warn(`⚠️ Property ${propertyId} photo has no URL:`, photo);
        return null;
      }
      return {
        ...photo,
        photoUrl: getImageUrl(url),
        thumbnailUrl: getImageUrl(photo.thumbnailUrl || photo.thumbnail_url || url)
      };
    }
    return null;
  };

  // Get all photos for property thumbnail strip with optimized URLs
  const getPropertyPhotos = (propertyId: number) => {
    const photos = propertyPhotos[propertyId] || [];
    return photos.map(photo => {
      // Handle both photoUrl and photoPath fields
      const url = photo.photoUrl || photo.photoPath || photo.photo_url;
      return {
        ...photo,
        photoUrl: getImageUrl(url),
        thumbnailUrl: getImageUrl(photo.thumbnailUrl || photo.thumbnail_url || url, true) // Always optimize thumbnails
      };
    });
  };

  // Handle thumbnail click
  const handleThumbnailClick = (propertyId: number, photoIndex: number) => {
    setSelectedMainPhoto(prev => ({
      ...prev,
      [propertyId]: photoIndex
    }));
  };

  // Force refresh key to break cache
  const [refreshKey] = useState(() => Date.now());
  
  // Load initial properties for browsing
  useEffect(() => {
    if (Array.isArray(allProperties) && allProperties.length > 0 && !propertiesLoading && !initialLoad) {
      setSearchResults(allProperties);
      setFilteredResults(allProperties);
      setInitialLoad(true);
      // Fetch photos for each property - forced refresh
      console.log(`🔄 FORCE REFRESH ${refreshKey}: Fetching photos for all properties`);
      fetchPropertyPhotos(allProperties);
    }
  }, [allProperties, propertiesLoading, initialLoad, refreshKey]);

  // Apply filters whenever filters change
  useEffect(() => {
    if (searchResults.length > 0) {
      applyFilters();
    }
  }, [filters, searchResults]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enhanced Search Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Card className="bg-gradient-to-r from-[#006699] to-[#002a66] border-0 text-white">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-xl">
                <MapPin className="w-6 h-6" />
                Find Your Perfect Stay
              </CardTitle>
              <p className="text-gray-100">Discover the best hotels with unbeatable prices</p>
            </CardHeader>
            <CardContent>
              <Form {...searchForm}>
                <form onSubmit={searchForm.handleSubmit(onSearch)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <FormField
                      control={searchForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Location</FormLabel>
                          <FormControl>
                            <Input placeholder="City or hotel name" {...field} data-testid="input-search-location" className="bg-white text-gray-900" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={searchForm.control}
                      name="checkIn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Check-in</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-check-in" className="bg-white text-gray-900" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={searchForm.control}
                      name="checkOut"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Check-out</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-check-out" className="bg-white text-gray-900" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={searchForm.control}
                      name="guests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Guests</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-guests"
                              className="bg-white text-gray-900"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={searchForm.control}
                      name="rooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Rooms</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-rooms"
                              className="bg-white text-gray-900"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-white text-[#006699] hover:bg-primary-50 font-semibold"
                    disabled={searchMutation.isPending}
                    data-testid="button-search-hotels"
                  >
                    {searchMutation.isPending ? "Searching..." : "Search Hotels"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Area */}
      {(searchResults.length > 0 || filteredResults.length > 0) && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex gap-8">
            {/* Filters Sidebar */}
            <div className="w-80 space-y-6">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <SlidersHorizontal className="w-5 h-5" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Price Range Filter */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">Price Range</label>
                    <div className="space-y-2">
                      {[
                        '1-1000',
                        '1000-2500',
                        '2500-5000',
                        '5000-10000',
                        '10000-25000',
                        'Above 25000'
                      ].map((range) => (
                        <div key={range} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`price-${range}`}
                            checked={filters.priceRange.includes(range)}
                            className=""
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFilters(prev => ({ ...prev, priceRange: [...prev.priceRange, range] }));
                              } else {
                                setFilters(prev => ({ ...prev, priceRange: prev.priceRange.filter(p => p !== range) }));
                              }
                            }}
                          />
                          <label htmlFor={`price-${range}`} className="cursor-pointer text-sm">
                            {range === 'Above 25000' 
                              ? `${currency.symbol}25,000+`
                              : `${currency.symbol}${range.replace('-', ' - ')}`
                            }
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Star Rating Filter */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">Star Rating</label>
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((stars) => (
                        <div key={stars} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`rating-${stars}`}
                            checked={filters.starRating.includes(stars)}
                            className=""
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFilters(prev => ({ ...prev, starRating: [...prev.starRating, stars] }));
                              } else {
                                setFilters(prev => ({ ...prev, starRating: prev.starRating.filter(r => r !== stars) }));
                              }
                            }}
                          />
                          <label htmlFor={`rating-${stars}`} className="flex items-center gap-1 cursor-pointer">
                            {[...Array(stars)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            ))}
                            <span className="text-sm ml-1">{stars} Star{stars > 1 ? 's' : ''}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Popular Amenities Filter */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">Popular Amenities</label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { name: 'WiFi', icon: '📶' },
                        { name: 'Parking', icon: '🚗' },
                        { name: 'Restaurant', icon: '🍽️' },
                        { name: 'Gym', icon: '💪' },
                        { name: 'Pool', icon: '🏊‍♀️' },
                        { name: 'Spa', icon: '💆‍♀️' },
                        { name: 'Room Service', icon: '🛎️' },
                        { name: 'AC', icon: '❄️' }
                      ].map((amenity) => (
                        <div key={amenity.name} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`amenity-${amenity.name}`}
                            className=""
                            checked={filters.amenities.includes(amenity.name)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFilters(prev => ({ ...prev, amenities: [...prev.amenities, amenity.name] }));
                              } else {
                                setFilters(prev => ({ ...prev, amenities: prev.amenities.filter(a => a !== amenity.name) }));
                              }
                            }}
                          />
                          <label htmlFor={`amenity-${amenity.name}`} className="cursor-pointer text-sm flex items-center gap-1">
                            <span>{amenity.icon}</span>
                            {amenity.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Property Categories Filter */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">Property Categories</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {Array.isArray(propertyCategories) && propertyCategories.filter((cat: any) => cat.isActive).map((category: any) => (
                        <div key={category.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`category-${category.id}`}
                            className=""
                            checked={filters.propertyCategories.includes(category.categoryName)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFilters(prev => ({ ...prev, propertyCategories: [...prev.propertyCategories, category.categoryName] }));
                              } else {
                                setFilters(prev => ({ ...prev, propertyCategories: prev.propertyCategories.filter(c => c !== category.categoryName) }));
                              }
                            }}
                          />
                          <label htmlFor={`category-${category.id}`} className="cursor-pointer text-sm">
                            {category.categoryName}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Location/Area Filter */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">Location</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {Array.isArray(propertyAreas) && propertyAreas.filter((area: any) => area.isActive).map((area: any) => (
                        <div key={area.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`area-${area.id}`}
                            className=""
                            checked={filters.propertyAreas.includes(area.areaName)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFilters(prev => ({ ...prev, propertyAreas: [...prev.propertyAreas, area.areaName] }));
                              } else {
                                setFilters(prev => ({ ...prev, propertyAreas: prev.propertyAreas.filter(a => a !== area.areaName) }));
                              }
                            }}
                          />
                          <label htmlFor={`area-${area.id}`} className="cursor-pointer text-sm">
                            {area.areaName}, {area.cityName}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Guest Rating Filter */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">Guest Rating</label>
                    <div className="space-y-2">
                      {Array.isArray(customerReviewRatings) && customerReviewRatings.filter((rating: any) => rating.isActive).map((rating: any) => (
                        <div key={rating.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`guest-rating-${rating.id}`}
                            className=""
                            checked={filters.guestRatings.includes(rating.ratingRange)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFilters(prev => ({ ...prev, guestRatings: [...prev.guestRatings, rating.ratingRange] }));
                              } else {
                                setFilters(prev => ({ ...prev, guestRatings: prev.guestRatings.filter(r => r !== rating.ratingRange) }));
                              }
                            }}
                          />
                          <label htmlFor={`guest-rating-${rating.id}`} className="cursor-pointer text-sm flex items-center gap-2">
                            <Badge variant="secondary" className="rounded text-xs" style={{ backgroundColor: rating.color || '#f3f4f6' }}>
                              {rating.ratingLabel}
                            </Badge>
                            <span className="text-xs text-gray-500">{rating.ratingRange}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Advanced Amenities Filter */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">Amenities</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {Array.isArray(propertyAmenities) && propertyAmenities.filter((amenity: any) => amenity.isActive).slice(0, 10).map((amenity: any) => (
                        <div key={amenity.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`amenity-${amenity.id}`}
                            className=""
                            checked={filters.amenities.includes(amenity.amenityName)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFilters(prev => ({ ...prev, amenities: [...prev.amenities, amenity.amenityName] }));
                              } else {
                                setFilters(prev => ({ ...prev, amenities: prev.amenities.filter(a => a !== amenity.amenityName) }));
                              }
                            }}
                          />
                          <label htmlFor={`amenity-${amenity.id}`} className="cursor-pointer text-sm flex items-center gap-1">
                            <span>{amenity.icon || '🏨'}</span>
                            {amenity.amenityName}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Area */}
            <div className="flex-1 space-y-6">
              {/* Results Header */}
              <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                <div className="flex items-center gap-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {filteredResults.length} Hotels Found
                    </h2>
                    {searchParams && (
                      <p className="text-gray-600">
                        in {searchParams.location} for {searchParams.guests} guests
                      </p>
                    )}
                  </div>
                  
                  {/* Sort Options - Same Line */}
                  <div className="flex items-center gap-1">
                    {[
                      { value: 'popularity', label: 'Popularity' },
                      { value: 'price-low', label: 'Price - Low to High' },
                      { value: 'price-high', label: 'Price - High to Low' },
                      { value: 'rating', label: 'Guest Rating' }
                    ].map((sortOption) => (
                      <button
                        key={sortOption.value}
                        onClick={() => setFilters(prev => ({ ...prev, sortBy: sortOption.value }))}
                        className={`px-4 py-2 text-sm font-medium rounded transition-all duration-200 ${
                          filters.sortBy === sortOption.value
                            ? 'bg-[#006699] text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100 border border-gray-300'
                        }`}
                        style={{ borderRadius: '6px' }}
                        data-testid={`button-sort-${sortOption.value}`}
                      >
                        {sortOption.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {comparison.selectedProperties.length > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={() => setComparison(prev => ({ ...prev, showComparison: true }))}
                    className="border-primary-600 text-primary-600 hover:bg-primary-50"
                  >
                    Compare ({comparison.selectedProperties.length})
                  </Button>
                )}
              </div>

              {/* Hotel Cards */}
              <div className="space-y-4">
                {filteredResults.map((property) => {
                  // Get room types linked to this property via room_type_ids array
                  const propertyRoomTypeIds = property.roomTypeIds || [];
                  const propertyRoomTypes = Array.isArray(roomTypes) 
                    ? roomTypes.filter((rt: any) => propertyRoomTypeIds.includes(rt.id)) 
                    : [];
                  const amenities = getPropertyAmenities(property.amenities);
                  const isInComparison = comparison.selectedProperties.includes(property.id);
                  
                  return (
                    <Card key={property.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-gray-200">
                      <CardContent className="p-0">
                        <div className="flex flex-col lg:flex-row lg:items-stretch">
                          {/* Column 1: Hotel Image with Thumbnails */}
                          <div className="w-full lg:w-80 flex-shrink-0 p-3">
                            <div className="space-y-2">
                              {/* Main Image */}
                              <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-md overflow-hidden" style={{ height: '180px' }}>
                                {(() => {
                                  const mainPhoto = getPropertyMainPhoto(property.id);
                                  const allPhotos = getPropertyPhotos(property.id);
                                  const currentIndex = selectedMainPhoto[property.id] || 0;
                                  
                                  if (mainPhoto && mainPhoto.photoUrl) {
                                    return (
                                      <>
                                        <img 
                                          src={mainPhoto.thumbnailUrl || mainPhoto.photoUrl}
                                          alt={mainPhoto.altText || property.name}
                                          loading="eager"
                                          decoding="async"
                                          fetchPriority="high"
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const fallback = target.nextElementSibling;
                                            if (fallback) fallback.classList.remove('hidden');
                                          }}
                                        />
                                        {/* Image Counter */}
                                        {allPhotos.length > 1 && (
                                          <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                            {currentIndex + 1} / {allPhotos.length}
                                          </div>
                                        )}
                                      </>
                                    );
                                  }
                                  // Fallback to placeholder image when no photos available
                                  const placeholderImages = [
                                    "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
                                    "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
                                    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
                                    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
                                    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"
                                  ];
                                  const placeholderUrl = placeholderImages[property.id % placeholderImages.length];
                                  
                                  return (
                                    <img 
                                      src={placeholderUrl}
                                      alt={property.name}
                                      loading="eager"
                                      decoding="async"
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        // Final fallback to icon if even placeholder fails
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                          parent.innerHTML = `
                                            <div class="absolute inset-0 flex items-center justify-center">
                                              <div class="text-gray-500 text-center">
                                                <svg class="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                                                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                                                </svg>
                                                <p class="text-sm font-medium">${property.name}</p>
                                              </div>
                                            </div>
                                          `;
                                        }
                                      }}
                                    />
                                  );
                                })()}
                                
                                {/* Comparison Toggle */}
                                <button
                                  onClick={() => togglePropertyComparison(property.id)}
                                  className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
                                    isInComparison 
                                      ? 'bg-[#006699] text-white' 
                                      : 'bg-white/80 text-gray-600 hover:bg-white'
                                  }`}
                                  data-testid={`button-compare-${property.id}`}
                                >
                                  <Heart className={`w-4 h-4 ${isInComparison ? 'fill-current' : ''}`} />
                                </button>
                              </div>
                              
                              {/* Thumbnail Gallery - Always show 3 thumbnails */}
                              <div className="flex gap-1">
                                {(() => {
                                  const allPhotos = getPropertyPhotos(property.id);
                                  
                                  // If no photos, don't show thumbnail strip
                                  if (allPhotos.length === 0) {
                                    return null;
                                  }
                                  
                                  // If 3+ photos: show 2 real thumbnails + "View All" button
                                  if (allPhotos.length >= 3) {
                                    return (
                                      <>
                                        {/* First 2 thumbnails */}
                                        {[0, 1].map((index) => (
                                          <button
                                            key={index}
                                            onClick={() => handleThumbnailClick(property.id, index)}
                                            className={`flex-1 h-12 rounded overflow-hidden transition-all duration-200 ${
                                              (selectedMainPhoto[property.id] || 0) === index
                                                ? 'ring-2 ring-primary-500'
                                                : 'hover:ring-1 hover:ring-gray-300'
                                            }`}
                                            data-testid={`thumbnail-${property.id}-${index}`}
                                          >
                                            <img
                                              src={allPhotos[index]?.thumbnailUrl || allPhotos[index]?.photoUrl}
                                              alt={`Photo ${index + 1}`}
                                              loading="lazy"
                                              className="w-full h-full object-cover"
                                            />
                                          </button>
                                        ))}
                                        
                                        {/* "View All" button on 3rd thumbnail */}
                                        <button 
                                          key="view-all"
                                          className="relative flex-1 h-12 rounded overflow-hidden hover:opacity-90 transition-opacity"
                                          onClick={() => window.open(`/property-gallery/${property.id}`, '_blank')}
                                          data-testid={`button-view-all-${property.id}`}
                                        >
                                          <img
                                            src={allPhotos[2]?.thumbnailUrl || allPhotos[2]?.photoUrl}
                                            alt="View All"
                                            loading="lazy"
                                            className="w-full h-full object-cover"
                                          />
                                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                            <div className="text-white text-center">
                                              <div className="text-xs font-semibold">VIEW ALL</div>
                                              <div className="text-xs mt-0.5">{allPhotos.length} Photos</div>
                                            </div>
                                          </div>
                                        </button>
                                      </>
                                    );
                                  }
                                  
                                  // If 1-2 photos: repeat the available photo(s) to fill 3 slots
                                  const thumbnailSlots = [];
                                  for (let i = 0; i < 3; i++) {
                                    const photoIndex = i % allPhotos.length; // Cycle through available photos
                                    const photo = allPhotos[photoIndex];
                                    thumbnailSlots.push(
                                      <button
                                        key={i}
                                        onClick={() => handleThumbnailClick(property.id, photoIndex)}
                                        className={`flex-1 h-12 rounded overflow-hidden transition-all duration-200 ${
                                          (selectedMainPhoto[property.id] || 0) === photoIndex
                                            ? 'ring-2 ring-primary-500'
                                            : 'hover:ring-1 hover:ring-gray-300'
                                        }`}
                                        data-testid={`thumbnail-${property.id}-${i}`}
                                      >
                                        <img
                                          src={photo.thumbnailUrl || photo.photoUrl}
                                          alt={`Photo ${photoIndex + 1}`}
                                          loading="lazy"
                                          className="w-full h-full object-cover"
                                        />
                                      </button>
                                    );
                                  }
                                  return thumbnailSlots;
                                })()}
                              </div>
                            </div>
                          </div>
                          
                          {/* Column 2: Hotel Details */}
                          <div className="flex-1 p-6">
                            <div className="mb-4">
                              <h3 className="text-xl font-bold text-gray-900 mb-1">
                                <Link 
                                  href={`/hotel-details/${property.id}`}
                                  className="hover:text-primary-600 transition-colors cursor-pointer"
                                  data-testid={`link-hotel-name-${property.id}`}
                                >
                                  {property.name}
                                </Link>
                              </h3>
                              <p className="text-gray-600 flex items-center gap-1">
                                <MapPinIcon className="w-4 h-4" />
                                {property.area}, {property.city}
                              </p>
                              <div className="flex items-center gap-1 mt-2">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                ))}
                                <span className="text-sm text-gray-600 ml-1">
                                  ({property.reviewCount || 0} reviews)
                                </span>
                              </div>
                            </div>
                            
                            <p className="text-gray-600 mb-4 line-clamp-2">{property.description || 'Experience comfort and luxury at this carefully selected property with modern amenities and exceptional service.'}</p>
                            
                            {/* Key highlights */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 rounded">
                                ✓ Free Cancellation
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 rounded">
                                📍 Great Location
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 rounded">
                                🏆 Highly Rated
                              </Badge>
                            </div>
                            
                          </div>
                          
                          {/* Column 3: Pricing */}
                          <div className="lg:w-48 flex-shrink-0 p-6 border-l border-gray-100 bg-gray-50/50">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-[#006699] mb-1">
                                {currency.symbol}{property.hourlyRate || '2,500'}
                              </div>
                              <div className="text-sm text-gray-500 mb-2">per night + taxes</div>
                              <div className="text-xs text-green-600 font-medium mb-4">
                                💰 Best Price Guaranteed
                              </div>
                              
                              {/* See Availability Button */}
                              <Link href={`/hotel-details/${property.id}`}>
                                <Button
                                  className="w-full bg-[#006699] hover:bg-[#002a66] text-white"
                                  data-testid={`button-see-availability-${property.id}`}
                                >
                                  See Availability
                                </Button>
                              </Link>
                              
                              <div className="mt-3 text-xs text-gray-500">
                                Free cancellation till 24hrs
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-800">Complete Your Booking</DialogTitle>
          </DialogHeader>
          
          {!selectedProperty || !selectedRoomType ? (
            <div className="p-6 text-center">
              <div className="bg-gray-50 rounded p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">No Rooms Available</h4>
                <p className="text-primary-600 mb-4">
                  Sorry, there are currently no rooms available for booking at this property. 
                  Please try selecting a different property or contact us for assistance.
                </p>
                <Button 
                  onClick={() => setIsBookingDialogOpen(false)} 
                  className="bg-[#006699] hover:bg-[#002a66]"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Booking Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Booking Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>Hotel:</strong> {selectedProperty.name}</p>
                    <p><strong>Room:</strong> {selectedRoomType.roomTypeName}</p>
                    <p><strong>Check-in:</strong> {searchParams?.checkIn}</p>
                    <p><strong>Check-out:</strong> {searchParams?.checkOut}</p>
                    <p><strong>Guests:</strong> {searchParams?.guests}</p>
                    <p><strong>Rooms:</strong> {searchParams?.rooms}</p>
                    
                    {priceBreakdown && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Base Amount:</span>
                            <span>{currency.symbol}{priceBreakdown.baseAmount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Extra Charges:</span>
                            <span>{currency.symbol}{priceBreakdown.extraCharges}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tax Amount:</span>
                            <span>{currency.symbol}{priceBreakdown.taxAmount}</span>
                          </div>
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total Amount:</span>
                            <span>{currency.symbol}{priceBreakdown.totalAmount}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Guest Details Form */}
              <Form {...bookingForm}>
                <form onSubmit={bookingForm.handleSubmit(onCreateBooking as any)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={bookingForm.control as any}
                      name="guestName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Guest Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Full name" {...field} data-testid="input-guest-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={bookingForm.control as any}
                      name="guestEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@example.com" {...field} data-testid="input-guest-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={bookingForm.control as any}
                      name="guestPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+91 9876543210" {...field} data-testid="input-guest-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Requests (Optional)
                    </label>
                    <Textarea placeholder="Any special requirements" data-testid="input-special-requests" />
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsBookingDialogOpen(false)}
                      className="flex-1"
                      data-testid="button-cancel-booking"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-[#006699] hover:bg-[#002a66]"
                      disabled={createBookingMutation.isPending}
                      data-testid="button-confirm-booking"
                    >
                      {createBookingMutation.isPending ? "Creating..." : "Confirm Booking"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Show booking dialog when room is selected */}
      {selectedProperty && selectedRoomType && !isBookingDialogOpen && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ready to book?</h3>
                <p className="text-gray-600">Complete your booking for {selectedProperty.name}</p>
              </div>
              <Button
                onClick={() => setIsBookingDialogOpen(true)}
                className="bg-[#006699] hover:bg-[#002a66] px-8 py-3"
                data-testid="button-proceed-booking"
              >
                Proceed to Book
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Property Comparison Dialog */}
      <Dialog open={comparison.showComparison} onOpenChange={(open) => setComparison(prev => ({ ...prev, showComparison: open }))}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-800">Compare Properties</DialogTitle>
          </DialogHeader>
          
          {comparison.selectedProperties.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <Heart className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Properties Selected</h3>
              <p className="text-gray-600">Please select 2-3 properties to compare them side by side.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <td className="p-4 border-b font-semibold text-gray-700 w-48">Features</td>
                      {comparison.selectedProperties.map((propertyId) => {
                        const property = searchResults.find(p => p.id === propertyId);
                        if (!property) return null;
                        return (
                          <td key={propertyId} className="p-4 border-b text-center min-w-64">
                            <div className="space-y-2">
                              <img
                                src={getPropertyMainPhoto(property.id)?.photoUrl || "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"}
                                alt={property.name}
                                className="w-full h-32 object-cover rounded-lg"
                                onError={(e) => {
                                  e.currentTarget.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300";
                                }}
                              />
                              <h4 className="font-semibold text-gray-900 text-sm">{property.name}</h4>
                              <p className="text-xs text-gray-600">{property.area}, {property.city}</p>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Price Row */}
                    <tr>
                      <td className="p-4 border-b font-medium text-gray-700">Price per night</td>
                      {comparison.selectedProperties.map((propertyId) => {
                        const property = searchResults.find(p => p.id === propertyId);
                        if (!property) return null;
                        return (
                          <td key={propertyId} className="p-4 border-b text-center">
                            <span className="text-lg font-bold text-primary-600">
                              {currency.symbol}{property.hourlyRate || '2,500'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                    
                    {/* Rating Row */}
                    <tr>
                      <td className="p-4 border-b font-medium text-gray-700">Guest Rating</td>
                      {comparison.selectedProperties.map((propertyId) => {
                        const property = searchResults.find(p => p.id === propertyId);
                        if (!property) return null;
                        return (
                          <td key={propertyId} className="p-4 border-b text-center">
                            <div className="flex items-center justify-center gap-1">
                              <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${i < parseFloat(property.rating || "0") ? "fill-current" : ""}`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-600 ml-1">
                                {property.rating ? parseFloat(property.rating).toFixed(1) : "N/A"}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              ({property.reviewCount || 0} reviews)
                            </p>
                          </td>
                        );
                      })}
                    </tr>
                    
                    {/* Location Row */}
                    <tr>
                      <td className="p-4 border-b font-medium text-gray-700">Location</td>
                      {comparison.selectedProperties.map((propertyId) => {
                        const property = searchResults.find(p => p.id === propertyId);
                        if (!property) return null;
                        return (
                          <td key={propertyId} className="p-4 border-b text-center">
                            <p className="text-sm">{property.area}</p>
                            <p className="text-xs text-gray-500">{property.city}</p>
                          </td>
                        );
                      })}
                    </tr>
                    
                    {/* Amenities Row */}
                    <tr>
                      <td className="p-4 border-b font-medium text-gray-700">Key Amenities</td>
                      {comparison.selectedProperties.map((propertyId) => {
                        const property = searchResults.find(p => p.id === propertyId);
                        if (!property) return null;
                        return (
                          <td key={propertyId} className="p-4 border-b text-center">
                            <div className="space-y-1">
                              {(property.amenities || []).slice(0, 4).map((amenity, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs bg-gray-50 border-gray-200 text-[#006699]"
                                >
                                  {amenity}
                                </Badge>
                              ))}
                              {(property.amenities || []).length > 4 && (
                                <p className="text-xs text-gray-500">
                                  +{(property.amenities || []).length - 4} more
                                </p>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                    
                    {/* Description Row */}
                    <tr>
                      <td className="p-4 border-b font-medium text-gray-700">Description</td>
                      {comparison.selectedProperties.map((propertyId) => {
                        const property = searchResults.find(p => p.id === propertyId);
                        if (!property) return null;
                        return (
                          <td key={propertyId} className="p-4 border-b text-center">
                            <p className="text-xs text-gray-600 line-clamp-3">
                              {property.description || 'No description available'}
                            </p>
                          </td>
                        );
                      })}
                    </tr>
                    
                    {/* Action Row */}
                    <tr>
                      <td className="p-4 font-medium text-gray-700">Actions</td>
                      {comparison.selectedProperties.map((propertyId) => {
                        const property = searchResults.find(p => p.id === propertyId);
                        if (!property) return null;
                        return (
                          <td key={propertyId} className="p-4 text-center">
                            <div className="space-y-2">
                              <Link href={`/hotel-details/${property.id}`}>
                                <Button
                                  className="w-full bg-[#006699] hover:bg-[#002a66] text-white text-sm"
                                  size="sm"
                                >
                                  View Details
                                </Button>
                              </Link>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => togglePropertyComparison(property.id)}
                                className="w-full border-gray-300 text-gray-600 hover:bg-gray-50 text-sm"
                              >
                                Remove
                              </Button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Footer */}
              <div className="flex justify-between items-center pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Comparing {comparison.selectedProperties.length} of {searchResults.length} properties
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setComparison({ selectedProperties: [], showComparison: false })}
                  >
                    Clear All
                  </Button>
                  <Button
                    onClick={() => setComparison(prev => ({ ...prev, showComparison: false }))}
                    className="bg-[#006699] hover:bg-[#002a66]"
                  >
                    Close Comparison
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}