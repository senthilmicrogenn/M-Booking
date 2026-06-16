import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation, Link } from "wouter";
import type { UniversalPhoto } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Wifi, 
  Car, 
  Coffee, 
  Dumbbell, 
  Waves, 
  Utensils,
  AirVent,
  Tv,
  Bath,
  Bed,
  Users,
  Calendar,
  CreditCard,
  Clock,
  Phone,
  Mail,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Shield,
  CheckCircle,
  XCircle,
  Info,
  Navigation,
  Camera,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  Flag,
  ChevronDown,
  ChevronUp,
  Edit3,
  CalendarIcon
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Property {
  id: number;
  name: string;
  type: string;
  location: string;
  address: string;
  city: string;
  area: string;
  pincode: string;
  description?: string;
  amenities?: string[];
  rating?: string;
  reviewCount?: number;
  houseRules?: string[];
  coordinates?: any;
  distanceFromLandmarks?: any;
}

interface RoomType {
  id: number;
  propertyId: number;
  roomTypeName: string;
  description?: string;
  maxOccupancy: number;
  basePrice: number;
  amenities?: string;
  roomSize?: string;
  bedType?: string;
  isActive: boolean;
}


interface Review {
  id: number;
  userId: number;
  propertyId: number;
  rating: number;
  reviewText?: string;
  isRecommended: boolean;
  images?: string[];
  response?: string;
  isVerified: boolean;
  createdAt: string;
  userName?: string;
  userAvatar?: string;
}

interface PolicyTemplate {
  id: number;
  policyType: string;
  policyTitle: string;
  policyContent: string;
  isActive: boolean;
}


export default function HotelDetails() {
  const [match, params] = useRoute("/hotel-details/:propertyId");
  const [, setLocation] = useLocation();
  const propertyId = params?.propertyId ? parseInt(params.propertyId) : null;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [reviewsPage, setReviewsPage] = useState(1);
  const reviewsPerPage = 5;
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [showAllPolicies, setShowAllPolicies] = useState(false);

  // Get currency symbol
  const [currencySymbol, setCurrencySymbol] = useState('₹');

  // State for room selection and inventory
  const [roomQuantities, setRoomQuantities] = useState<Record<number, number>>({});
  const [roomAvailability, setRoomAvailability] = useState<Record<number, number>>({});
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState(2); // Default to 2 guests
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [gstCalculations, setGstCalculations] = useState<Record<number, any>>({});
  const [isBookingDetailsEditable, setIsBookingDetailsEditable] = useState(false);
  
  // Draft state for editing booking details
  const [draftCheckInDate, setDraftCheckInDate] = useState<Date | undefined>(undefined);
  const [draftCheckOutDate, setDraftCheckOutDate] = useState<Date | undefined>(undefined);
  const [draftGuests, setDraftGuests] = useState(2);
  const [draftCity, setDraftCity] = useState('');
  
  // Popover states for date pickers
  const [draftCheckInOpen, setDraftCheckInOpen] = useState(false);
  const [draftCheckOutOpen, setDraftCheckOutOpen] = useState(false);


  // Fetch property details
  const { data: property } = useQuery<Property>({
    queryKey: ["/api/properties", propertyId],
    queryFn: async () => {
      const response = await fetch(`/api/properties/${propertyId}`);
      if (!response.ok) throw new Error('Property not found');
      return response.json();
    },
    enabled: !!propertyId
  });

  // Fetch room types
  const { data: roomTypes = [] } = useQuery<RoomType[]>({
    queryKey: ["/api/room-types", propertyId],
    queryFn: async () => {
      const response = await fetch(`/api/room-types?propertyId=${propertyId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!propertyId
  });

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

  // Fetch room photos as fallback
  const { data: roomPhotosResponse } = useQuery({
    queryKey: ["/api/universal-photos", "room", propertyId, roomTypes],
    queryFn: async () => {
      if (!propertyId || !roomTypes || roomTypes.length === 0) return { photos: [] };
      
      const allRoomPhotos: UniversalPhoto[] = [];
      for (const roomType of roomTypes) {
        const response = await fetch(`/api/universal-photos?entityType=room&entityId=${roomType.id}`);
        if (response.ok) {
          const data = await response.json();
          allRoomPhotos.push(...(data.photos || []));
        }
      }
      return { photos: allRoomPhotos };
    },
    enabled: !!propertyId && roomTypes.length > 0
  });

  // Fetch reviews
  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ["/api/reviews", propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      const response = await fetch(`/api/reviews?propertyId=${propertyId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!propertyId
  });

  // Fetch policy templates
  const { data: policies = [] } = useQuery<PolicyTemplate[]>({
    queryKey: ["/api/policy-templates"],
    queryFn: async () => {
      const response = await fetch('/api/policy-templates');
      if (!response.ok) return [];
      return response.json();
    }
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (latitude >= 8.4 && latitude <= 37.6 && longitude >= 68.7 && longitude <= 97.25) {
            setCurrencySymbol('₹');
          } else {
            setCurrencySymbol('$');
          }
        },
        () => setCurrencySymbol('₹')
      );
    }

    // Parse URL parameters for search data
    const urlParams = new URLSearchParams(window.location.search);
    const urlCheckIn = urlParams.get('checkIn');
    const urlCheckOut = urlParams.get('checkOut');
    const urlGuests = urlParams.get('guests');

    // Set dates from URL or defaults
    if (urlCheckIn && urlCheckOut) {
      setCheckInDate(urlCheckIn);
      setCheckOutDate(urlCheckOut);
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);
      
      setCheckInDate(tomorrow.toISOString().split('T')[0]);
      setCheckOutDate(dayAfter.toISOString().split('T')[0]);
    }

    // Set guests from URL or default
    if (urlGuests) {
      setGuests(parseInt(urlGuests) || 2);
    }
  }, []);

  // Functions to handle booking details editing
  const handleModifyBooking = () => {
    // Initialize draft state with current values
    setDraftCheckInDate(checkInDate ? new Date(checkInDate) : undefined);
    setDraftCheckOutDate(checkOutDate ? new Date(checkOutDate) : undefined);
    setDraftGuests(guests);
    setDraftCity(property?.city || '');
    setIsBookingDetailsEditable(true);
  };

  const handleSearchHotels = () => {
    // Instead of just saving, redirect to hotel search with new parameters
    const searchParams = new URLSearchParams({
      city: draftCity || property?.city || 'Coimbatore',
      checkIn: draftCheckInDate ? format(draftCheckInDate, 'yyyy-MM-dd') : '',
      checkOut: draftCheckOutDate ? format(draftCheckOutDate, 'yyyy-MM-dd') : '',
      guests: draftGuests.toString()
    });
    
    setLocation(`/hotel-search-booking?${searchParams.toString()}`);
  };

  const handleCancelBooking = () => {
    // Discard draft changes and revert to original values
    setDraftCheckInDate(checkInDate ? new Date(checkInDate) : undefined);
    setDraftCheckOutDate(checkOutDate ? new Date(checkOutDate) : undefined);
    setDraftGuests(guests);
    setDraftCity(property?.city || '');
    setIsBookingDetailsEditable(false);
  };

  // Check room availability when dates or property changes
  useEffect(() => {
    if (propertyId && checkInDate && checkOutDate && roomTypes && roomTypes.length > 0) {
      checkRoomAvailability();
    }
  }, [propertyId, checkInDate, checkOutDate, roomTypes?.length]);

  // Function to check room availability
  const checkRoomAvailability = async () => {
    if (!propertyId || !checkInDate || !checkOutDate) return;
    
    setIsCheckingAvailability(true);
    try {
      const availability: Record<number, number> = {};
      
      for (const roomType of roomTypes) {
        const response = await fetch(
          `/api/room-inventory/${propertyId}/${roomType.id}?startDate=${checkInDate}&endDate=${checkOutDate}`
        );
        if (response.ok) {
          const inventories = await response.json();
          const minAvailable = inventories.length > 0 
            ? Math.min(...inventories.map((inv: any) => inv.availableRooms))
            : 0;
          availability[roomType.id] = minAvailable;
        } else {
          availability[roomType.id] = 0;
        }
      }
      
      setRoomAvailability(availability);
    } catch (error) {
      console.error('Error checking room availability:', error);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  // Handle room quantity change
  const handleRoomQuantityChange = (roomTypeId: number, quantity: number) => {
    const maxAvailable = roomAvailability[roomTypeId] || 0;
    const validQuantity = Math.min(Math.max(0, quantity), maxAvailable);
    
    setRoomQuantities(prev => ({
      ...prev,
      [roomTypeId]: validQuantity
    }));
  };

  // Get image URL with optimization
  const getImageUrl = (url: string, optimize: boolean = false) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = optimize ? '/api/object-storage/optimized/' : '/api/object-storage/';
    return baseUrl + url.replace(/^\/+/, '');
  };
  
  const propertyPhotos = (propertyPhotosResponse?.photos || []) as UniversalPhoto[];
  const roomPhotos = (roomPhotosResponse?.photos || []) as UniversalPhoto[];
  
  // Use property photos if available, otherwise fall back to room photos
  const allPhotos = propertyPhotos.length > 0 ? propertyPhotos : roomPhotos;
  const displayPhotos = allPhotos.filter(p => p.isActive).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  // Parse amenities
  const getAmenities = (amenitiesString?: string | string[]) => {
    if (!amenitiesString) return [];
    if (Array.isArray(amenitiesString)) return amenitiesString;
    return amenitiesString.split(',').map(a => a.trim()).filter(Boolean);
  };

  const propertyAmenities = getAmenities(property?.amenities);

  // Amenity icons mapping
  const getAmenityIcon = (amenity: string) => {
    const lower = amenity.toLowerCase();
    if (lower.includes('wifi') || lower.includes('internet')) return <Wifi className="w-4 h-4" />;
    if (lower.includes('parking') || lower.includes('car')) return <Car className="w-4 h-4" />;
    if (lower.includes('restaurant') || lower.includes('dining')) return <Utensils className="w-4 h-4" />;
    if (lower.includes('gym') || lower.includes('fitness')) return <Dumbbell className="w-4 h-4" />;
    if (lower.includes('pool') || lower.includes('swimming')) return <Waves className="w-4 h-4" />;
    if (lower.includes('coffee') || lower.includes('breakfast')) return <Coffee className="w-4 h-4" />;
    if (lower.includes('ac') || lower.includes('air conditioning')) return <AirVent className="w-4 h-4" />;
    if (lower.includes('tv') || lower.includes('television')) return <Tv className="w-4 h-4" />;
    return <Star className="w-4 h-4" />;
  };

  // Calculate GST based on September amendment rules
  const calculateGSTForRoom = (roomTypeId: number, perDayRateAfterDiscount: number, taxableValue: number) => {
    // GST rules: 5% if per day rate < ₹7500, 18% if >= ₹7500
    const gstPercentage = perDayRateAfterDiscount < 7500 ? 5 : 18;
    const gstAmount = (taxableValue * gstPercentage) / 100;
    
    // Split GST into CGST and SGST (equal halves)
    const cgstPercentage = gstPercentage / 2;
    const sgstPercentage = gstPercentage / 2;
    const cgstAmount = gstAmount / 2;
    const sgstAmount = gstAmount / 2;
    
    const gstCalculation = {
      cgst: { percentage: cgstPercentage, amount: cgstAmount },
      sgst: { percentage: sgstPercentage, amount: sgstAmount },
      total: { percentage: gstPercentage, amount: gstAmount }
    };
    
    setGstCalculations(prev => ({
      ...prev,
      [roomTypeId]: gstCalculation
    }));
    
    return gstCalculation;
  };


  // Calculate total price before discount
  const calculateTotalPrice = () => {
    let total = 0;
    const nights = Math.max(1, Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)));
    
    roomTypes
      .filter(rt => rt.isActive && roomQuantities[rt.id] > 0)
      .forEach(roomType => {
        const quantity = roomQuantities[roomType.id];
        const roomTotal = roomType.basePrice * quantity * nights;
        total += roomTotal;
      });
    
    return total;
  };


  // Use only real reviews from the database
  const displayReviews = reviews;
  const totalReviews = displayReviews.length;
  const totalPages = Math.ceil(totalReviews / reviewsPerPage);
  const currentReviews = displayReviews.slice((reviewsPage - 1) * reviewsPerPage, reviewsPage * reviewsPerPage);

  // Rating distribution
  const ratingDistribution = displayReviews.reduce((acc, review) => {
    acc[review.rating] = (acc[review.rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const averageRating = displayReviews.length > 0 
    ? displayReviews.reduce((sum, review) => sum + review.rating, 0) / displayReviews.length 
    : 0;

  // Effect to calculate GST when room quantities or dates change
  useEffect(() => {
    if (checkInDate && checkOutDate && roomTypes) {
      const nights = Math.max(1, Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)));
      
      // Calculate GST for all selected rooms
      Object.entries(roomQuantities).forEach(([roomTypeIdStr, quantity]) => {
        if (quantity > 0) {
          const roomTypeId = parseInt(roomTypeIdStr);
          const roomType = roomTypes.find(rt => rt.id === roomTypeId);
          if (roomType) {
            const ratePerNight = roomType.basePrice || 2500;
            const subtotal = quantity * ratePerNight * nights;
            const discountPercent = nights >= 3 ? 10 : 0;
            const discountAmount = (subtotal * discountPercent) / 100;
            const taxableValue = subtotal - discountAmount; // Room rent after discount
            const perDayRateAfterDiscount = (ratePerNight * (100 - discountPercent)) / 100;
            
            calculateGSTForRoom(roomTypeId, perDayRateAfterDiscount, taxableValue);
          }
        }
      });
    }
  }, [roomQuantities, checkInDate, checkOutDate, roomTypes]);

  if (!propertyId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Hotel Not Found</h1>
          <p className="text-gray-600">Please select a valid hotel to view details.</p>
          <Link href="/booking-portal">
            <Button className="mt-4 !bg-[#006699] hover:!bg-[#002a66] text-white">Back to Hotels</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* MMT-Style Breadcrumb Navigation */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center text-sm text-gray-600 space-x-2">
            <Link href="/booking-portal" className="hover:text-gray-600">Hotels</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-400">{property?.city}</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">{property?.name}</span>
          </div>
        </div>
      </div>

      {/* MMT-Style Hotel Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{property?.name}</h1>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4 text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{property?.area}, {property?.city}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-500 text-gray-500" />
                  <span className="text-sm font-medium">4.2</span>
                  <span className="text-sm">(1,234 reviews)</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="text-primary-600 border-primary-600 hover:bg-primary-50">
                  <Heart className="w-4 h-4 mr-2" />
                  Shortlist
                </Button>
                <Button variant="outline" size="sm" className="text-primary-600 border-primary-600 hover:bg-primary-50">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* MMT-Style Booking Summary in Header */}
            <div className="bg-gray-100 border border-gray-200 rounded px-4 py-3 min-w-80">
              {!isBookingDetailsEditable ? (
                // Read-only display
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <div>
                      <Label className="text-xs text-gray-600 uppercase tracking-wide">Check-in</Label>
                      <p className="text-sm font-semibold text-gray-800" data-testid="display-checkin-top">
                        {checkInDate ? new Date(checkInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Select date'}
                      </p>
                    </div>
                  </div>
                  
                  <Separator orientation="vertical" className="h-8 bg-gray-300" />
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <div>
                      <Label className="text-xs text-gray-600 uppercase tracking-wide">Check-out</Label>
                      <p className="text-sm font-semibold text-gray-800" data-testid="display-checkout-top">
                        {checkOutDate ? new Date(checkOutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Select date'}
                      </p>
                    </div>
                  </div>
                  
                  <Separator orientation="vertical" className="h-8 bg-gray-300" />
                  
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <div>
                      <Label className="text-xs text-gray-600 uppercase tracking-wide">Guests</Label>
                      <p className="text-sm font-semibold text-gray-800" data-testid="display-guests-top">
                        {guests} guest{guests !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleModifyBooking}
                    className="text-primary-600 border-primary-600 hover:bg-primary-50"
                    data-testid="button-modify-booking"
                  >
                    <Edit3 className="w-3 h-3 mr-1" />
                    Modify
                  </Button>
                </div>
              ) : (
                // Editable form - improved alignment and added city field
                <div className="flex items-end gap-3 flex-wrap">
                  <div className="flex-1 min-w-[140px]">
                    <Label className="text-xs text-gray-600 mb-1 block">City / Location</Label>
                    <Input
                      type="text"
                      value={draftCity}
                      onChange={(e) => setDraftCity(e.target.value)}
                      placeholder="Enter city"
                      className="h-9 text-sm"
                      data-testid="input-city-top"
                    />
                  </div>
                  
                  <div className="min-w-[140px]">
                    <Label className="text-xs text-gray-600 mb-1 block">Check-in</Label>
                    <Popover open={draftCheckInOpen} onOpenChange={setDraftCheckInOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-9 text-sm justify-start text-left font-normal",
                            !draftCheckInDate && "text-muted-foreground"
                          )}
                          data-testid="input-checkin-top"
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {draftCheckInDate ? format(draftCheckInDate, "MMM dd") : "Check-in"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={draftCheckInDate}
                          onSelect={(date) => {
                            setDraftCheckInDate(date);
                            setDraftCheckInOpen(false);
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="min-w-[140px]">
                    <Label className="text-xs text-gray-600 mb-1 block">Check-out</Label>
                    <Popover open={draftCheckOutOpen} onOpenChange={setDraftCheckOutOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-9 text-sm justify-start text-left font-normal",
                            !draftCheckOutDate && "text-muted-foreground"
                          )}
                          data-testid="input-checkout-top"
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {draftCheckOutDate ? format(draftCheckOutDate, "MMM dd") : "Check-out"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={draftCheckOutDate}
                          onSelect={(date) => {
                            setDraftCheckOutDate(date);
                            setDraftCheckOutOpen(false);
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="min-w-[100px]">
                    <Label className="text-xs text-gray-600 mb-1 block">Guests</Label>
                    <Select value={draftGuests.toString()} onValueChange={(value) => setDraftGuests(parseInt(value))}>
                      <SelectTrigger className="w-full h-9 text-sm" data-testid="select-guests-top">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="6">6</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSearchHotels}
                      className="!bg-[#006699] hover:!bg-[#002a66] text-white h-9 px-4 text-sm font-medium"
                      data-testid="button-search-hotels"
                    >
                      Search
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelBooking}
                      className="h-9 px-4 text-sm text-gray-600 border-gray-300 hover:bg-gray-50"
                      data-testid="button-cancel-booking"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>

      {/* MMT-Style Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Content Area - MMT Style */}
          <div className="lg:col-span-3 space-y-6">
            {/* MMT-Style Photo Gallery */}
            {displayPhotos.length > 0 ? (
              <div className="bg-gray-50 rounded overflow-hidden shadow-sm border border-gray-200">
                <div className="grid grid-cols-4 gap-1 h-80">
                  {/* Main Large Image */}
                  <div className="col-span-3 relative bg-gray-200 overflow-hidden">
                    <img
                      src={getImageUrl(displayPhotos[selectedImageIndex]?.photoUrl || displayPhotos[selectedImageIndex]?.photoPath || '')}
                      alt={displayPhotos[selectedImageIndex]?.altText || property?.name}
                      className="w-full h-full object-cover"
                      data-testid="main-hotel-image"
                      onError={(e) => {
                        console.log('Image failed to load:', displayPhotos[selectedImageIndex]?.photoUrl || displayPhotos[selectedImageIndex]?.photoPath);
                        e.currentTarget.src = '/api/placeholder/400x300';
                      }}
                    />
                    
                    {/* Photo Counter */}
                    <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                      {selectedImageIndex + 1} / {displayPhotos.length}
                    </div>
                    
                    {/* Navigation Arrows */}
                    {displayPhotos.length > 1 && (
                      <>
                        <button
                          onClick={() => setSelectedImageIndex(prev => prev > 0 ? prev - 1 : displayPhotos.length - 1)}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-gray-50/90 text-gray-800 p-2 rounded-full hover:bg-gray-50 transition-colors shadow-lg"
                          data-testid="button-prev-image"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setSelectedImageIndex(prev => prev < displayPhotos.length - 1 ? prev + 1 : 0)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-50/90 text-gray-800 p-2 rounded-full hover:bg-gray-50 transition-colors shadow-lg"
                          data-testid="button-next-image"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnail Grid */}
                  <div className="flex flex-col gap-2">
                    {displayPhotos.slice(1, 5).map((photo, index) => (
                      <button
                        key={photo.id}
                        onClick={() => setSelectedImageIndex(index + 1)}
                        className={`relative h-[88px] w-full rounded overflow-hidden border-2 transition-all ${
                          selectedImageIndex === index + 1
                            ? 'border-primary-500 ring-2 ring-primary-200' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        data-testid={`thumbnail-${index + 1}`}
                      >
                        <img
                          src={getImageUrl(photo.photoUrl || photo.photoPath || '')}
                          alt={`Thumbnail ${index + 2}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/api/placeholder/150x100';
                          }}
                        />
                        {index === 3 && displayPhotos.length > 5 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              +{displayPhotos.length - 4}
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                    
                    {/* View All Photos Button */}
                    <button
                      onClick={() => window.open(`/property-gallery/${propertyId}`, '_blank')}
                      className="h-[88px] w-full !bg-[#006699] hover:!bg-[#002a66] text-white rounded flex flex-col items-center justify-center transition-colors"
                      data-testid="button-view-all-photos"
                    >
                      <Camera className="w-5 h-5 mb-1" />
                      <span className="text-xs font-medium">View All</span>
                      <span className="text-xs">{displayPhotos.length} Photos</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded overflow-hidden shadow-sm border border-gray-200">
                <div className="h-96 bg-gray-100 flex items-center justify-center rounded">
                  <div className="text-center text-gray-500">
                    <ImageIcon className="w-16 h-16 mx-auto mb-2" />
                    <p>No photos available</p>
                  </div>
                </div>
              </div>
            )}

            {/* MMT-Style Content Tabs */}
            <div className="bg-gray-50 rounded shadow-sm border border-gray-200">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="border-b border-gray-200">
                  <TabsList className="grid w-full grid-cols-4 bg-transparent h-12 p-0 rounded-none">
                    <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:text-primary-600 data-[state=active]:bg-transparent font-medium">Overview</TabsTrigger>
                    <TabsTrigger value="amenities" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:text-primary-600 data-[state=active]:bg-transparent font-medium">Amenities</TabsTrigger>
                    <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:text-primary-600 data-[state=active]:bg-transparent font-medium">Reviews ({totalReviews})</TabsTrigger>
                    <TabsTrigger value="policies" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-600 data-[state=active]:text-primary-600 data-[state=active]:bg-transparent font-medium">Policies</TabsTrigger>
                  </TabsList>
                </div>

                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-6">
                  <div className="space-y-6">
                    {/* Hotel Description */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3">About this property</h3>
                      <p className="text-gray-700 leading-relaxed text-base" data-testid="hotel-description">
                        {property?.description || 'Experience luxury and comfort at this exceptional property. Located in the heart of the city, our hotel offers modern amenities, elegant accommodations, and outstanding service to ensure your stay is memorable. Whether you\'re traveling for business or leisure, you\'ll find everything you need for a perfect stay.'}
                      </p>
                    </div>

                    {/* Amenities */}
                    {propertyAmenities.length > 0 && (
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Hotel Amenities</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {(showAllAmenities ? propertyAmenities : propertyAmenities.slice(0, 9)).map((amenity, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-100 rounded border border-gray-200">
                              {getAmenityIcon(amenity)}
                              <span className="text-gray-700 font-medium">{amenity}</span>
                            </div>
                          ))}
                        </div>
                        {propertyAmenities.length > 9 && (
                          <Button
                            variant="outline"
                            onClick={() => setShowAllAmenities(!showAllAmenities)}
                            className="mt-4 border-gray-300 text-gray-600 hover:bg-gray-100"
                          >
                            {showAllAmenities ? (
                              <>Show Less <ChevronUp className="w-4 h-4 ml-2" /></>
                            ) : (
                              <>Show All {propertyAmenities.length} Amenities <ChevronDown className="w-4 h-4 ml-2" /></>
                            )}
                          </Button>
                        )}
                      </div>
                    )}

                    {/* House Rules */}
                    {property?.houseRules && property.houseRules.length > 0 && (
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4">House Rules</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {property.houseRules.map((rule, index) => (
                            <div key={index} className="flex items-start gap-2 p-3 bg-gray-100 rounded border border-gray-200">
                              <Info className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-800">{rule}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Reviews Tab */}
                <TabsContent value="reviews" className="mt-6">
                  <div className="space-y-6">
                    {/* Rating Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-100 p-6 rounded border border-gray-200">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-gray-700 mb-2">
                            {averageRating.toFixed(1)}
                          </div>
                          <div className="flex justify-center mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                          <p className="text-gray-600">Based on {totalReviews} reviews</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <div key={rating} className="flex items-center gap-2">
                            <span className="text-sm text-gray-700 w-8">{rating}★</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gray-1000 h-2 rounded-full" 
                                style={{ 
                                  width: `${totalReviews > 0 ? ((ratingDistribution[rating] || 0) / totalReviews) * 100 : 0}%` 
                                }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 w-8">{ratingDistribution[rating] || 0}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Individual Reviews */}
                    {totalReviews > 0 ? (
                      <div className="space-y-4">
                        {currentReviews.map((review) => (
                        <div key={review.id} className="border border-gray-200 rounded p-6 bg-gray-50">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-gray-600 font-medium">
                                  {review.userName?.charAt(0) || 'G'}
                                </span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-gray-800">{review.userName || 'Anonymous Guest'}</h4>
                                  {review.isVerified && (
                                    <Badge className="bg-gray-100 text-gray-700 text-xs">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Verified
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                    ))}
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" className="text-gray-400">
                                <ThumbsUp className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-gray-400">
                                <Flag className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-gray-700 leading-relaxed mb-3">{review.reviewText}</p>
                          
                          {review.isRecommended && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <ThumbsUp className="w-4 h-4" />
                              <span className="text-sm font-medium">Recommends this property</span>
                            </div>
                          )}
                          
                          {review.response && (
                            <div className="mt-4 p-4 bg-gray-100 rounded border-l-4 border-primary-500">
                              <p className="text-sm font-medium text-gray-700 mb-1">Property Response:</p>
                              <p className="text-sm text-gray-600">{review.response}</p>
                            </div>
                          )}
                        </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="bg-gray-100 rounded p-8">
                          <h4 className="text-lg font-semibold text-gray-800 mb-2">No Reviews Yet</h4>
                          <p className="text-gray-600">Be the first to share your experience at this property!</p>
                        </div>
                      </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-2 mt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReviewsPage(prev => Math.max(prev - 1, 1))}
                          disabled={reviewsPage === 1}
                          className="border-gray-300"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        
                        {[...Array(totalPages)].map((_, i) => (
                          <Button
                            key={i}
                            variant={reviewsPage === i + 1 ? "default" : "outline"}
                            size="sm"
                            onClick={() => setReviewsPage(i + 1)}
                            className={reviewsPage === i + 1 ? "!bg-[#006699] hover:!bg-[#002a66] text-white" : "border-gray-300"}
                          >
                            {i + 1}
                          </Button>
                        ))}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReviewsPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={reviewsPage === totalPages}
                          className="border-gray-300"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Location Tab */}
                <TabsContent value="location" className="mt-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Property Location</h3>
                      <div className="bg-gray-100 p-6 rounded border border-gray-200">
                        <div className="flex items-start gap-3 mb-4">
                          <MapPin className="w-5 h-5 text-gray-600 mt-1" />
                          <div>
                            <p className="font-semibold text-gray-800">{property?.name}</p>
                            <p className="text-gray-600">{property?.address}</p>
                            <p className="text-gray-600">{property?.area}, {property?.city} - {property?.pincode}</p>
                          </div>
                        </div>
                        
                        {/* Mock Map Placeholder */}
                        <div className="w-full h-64 bg-gray-200 rounded flex items-center justify-center border-2 border-dashed border-gray-300">
                          <div className="text-center text-gray-500">
                            <Navigation className="w-12 h-12 mx-auto mb-2" />
                            <p className="text-sm">Interactive Map</p>
                            <p className="text-xs">Coming Soon</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Nearby Landmarks */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Nearby Landmarks</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { name: "City Center", distance: "2.1 km", type: "shopping" },
                          { name: "Airport", distance: "15.3 km", type: "transport" },
                          { name: "Railway Station", distance: "3.8 km", type: "transport" },
                          { name: "Metro Station", distance: "800 m", type: "transport" },
                          { name: "Shopping Mall", distance: "1.5 km", type: "shopping" },
                          { name: "Hospital", distance: "2.8 km", type: "medical" }
                        ].map((landmark, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded border border-gray-200">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                landmark.type === 'transport' ? 'bg-gray-100 text-gray-600' :
                                landmark.type === 'shopping' ? 'bg-purple-100 text-purple-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                <MapPin className="w-4 h-4" />
                              </div>
                              <span className="font-medium text-gray-700">{landmark.name}</span>
                            </div>
                            <span className="text-sm text-gray-500">{landmark.distance}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Policies Tab */}
                <TabsContent value="policies" className="mt-6">
                  <div className="space-y-6">
                    {/* Cancellation Policy */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Cancellation Policy</h3>
                      <div className="bg-red-50 border border-red-200 rounded p-6">
                        <div className="flex items-start gap-3">
                          <XCircle className="w-5 h-5 text-red-600 mt-1" />
                          <div>
                            <h4 className="font-semibold text-red-800 mb-2">Standard Cancellation</h4>
                            <p className="text-red-700">Free cancellation up to 24 hours before check-in. After that, 1 night charge applies.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Check-in/Check-out Policy */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Check-in & Check-out</h3>
                      <div className="bg-gray-100 border border-gray-200 rounded p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-gray-600 mt-1" />
                            <div>
                              <h4 className="font-semibold text-gray-800 mb-1">Check-in</h4>
                              <p className="text-gray-700">2:00 PM onwards</p>
                              <p className="text-sm text-gray-600">Early check-in subject to availability</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-gray-600 mt-1" />
                            <div>
                              <h4 className="font-semibold text-gray-800 mb-1">Check-out</h4>
                              <p className="text-gray-700">11:00 AM</p>
                              <p className="text-sm text-gray-600">Late check-out available on request</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Policies */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Additional Policies</h3>
                      <div className="space-y-4">
                        {(showAllPolicies ? policies : policies.slice(0, 3)).map((policy) => (
                          <div key={policy.id} className="bg-gray-50 border border-gray-200 rounded p-6">
                            <div className="flex items-start gap-3">
                              <Shield className="w-5 h-5 text-gray-600 mt-1" />
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-2">{policy.policyTitle}</h4>
                                <p className="text-gray-700" dangerouslySetInnerHTML={{ __html: policy.policyContent }} />
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {policies.length > 3 && (
                          <Button
                            variant="outline"
                            onClick={() => setShowAllPolicies(!showAllPolicies)}
                            className="border-gray-300 text-gray-600 hover:bg-gray-100"
                          >
                            {showAllPolicies ? (
                              <>Show Less <ChevronUp className="w-4 h-4 ml-2" /></>
                            ) : (
                              <>Show All Policies <ChevronDown className="w-4 h-4 ml-2" /></>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* MMT-Style Room Selection Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              {/* Booking Details Summary */}
              <div className="bg-gray-50 rounded shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Your Selection
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Check-in:</span>
                    <span className="font-medium">{checkInDate ? new Date(checkInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select date'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Check-out:</span>
                    <span className="font-medium">{checkOutDate ? new Date(checkOutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select date'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Guests:</span>
                    <span className="font-medium">{guests} guest{guests !== 1 ? 's' : ''}</span>
                  </div>
                  {checkInDate && checkOutDate && (
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">Nights:</span>
                      <span className="font-medium">{Math.max(1, Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)))} night{Math.max(1, Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24))) !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Room Selection */}
              <div className="bg-gray-50 rounded shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Choose Room</h3>
                </div>

                {roomTypes.length > 0 ? (
                  roomTypes.filter(rt => rt.isActive).map((roomType) => (
                    <div key={roomType.id} className="border border-gray-200 rounded p-4 mb-4">
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold text-gray-800" data-testid={`room-name-${roomType.id}`}>
                              {roomType.roomTypeName}
                            </h4>
                            {roomType.description && (
                              <p className="text-sm text-gray-600 mt-1">{roomType.description}</p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>Up to {roomType.maxOccupancy} guests</span>
                            </div>
                            {roomType.roomSize && (
                              <div className="flex items-center gap-1">
                                <span>{roomType.roomSize}</span>
                              </div>
                            )}
                          </div>

                          <Separator className="bg-gray-200" />

                          {/* Availability and Quantity Selection */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Available rooms:</span>
                              <span className={`font-medium ${
                                roomAvailability[roomType.id] > 0 ? 'text-gray-600' : 'text-red-600'
                              }`}>
                                {isCheckingAvailability ? '...' : roomAvailability[roomType.id] || 0}
                              </span>
                            </div>

                            {roomAvailability[roomType.id] > 0 ? (
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600">Rooms:</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleRoomQuantityChange(roomType.id, (roomQuantities[roomType.id] || 0) - 1)}
                                    disabled={!roomQuantities[roomType.id] || roomQuantities[roomType.id] <= 0}
                                    className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    data-testid={`button-decrease-${roomType.id}`}
                                  >
                                    -
                                  </button>
                                  <span className="w-8 text-center font-medium text-gray-800" data-testid={`quantity-${roomType.id}`}>
                                    {roomQuantities[roomType.id] || 0}
                                  </span>
                                  <button
                                    onClick={() => handleRoomQuantityChange(roomType.id, (roomQuantities[roomType.id] || 0) + 1)}
                                    disabled={roomQuantities[roomType.id] >= roomAvailability[roomType.id]}
                                    className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    data-testid={`button-increase-${roomType.id}`}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center py-3 px-4 bg-red-50 border border-red-200 rounded">
                                <div className="flex items-center gap-2 text-red-600">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  <span className="font-medium text-sm">SOLD OUT</span>
                                </div>
                              </div>
                            )}
                          </div>

                          <Separator className="bg-gray-200" />

                          {/* MMT-Style Detailed Pricing Breakdown */}
                          {roomQuantities[roomType.id] > 0 && checkInDate && checkOutDate && (() => {
                            const nights = Math.max(1, Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)));
                            const quantity = roomQuantities[roomType.id];
                            const ratePerNight = roomType.basePrice || 2500;
                            const subtotal = quantity * ratePerNight * nights;
                            
                            // Calculate discount (e.g., 10% for stays longer than 3 nights)
                            const discountPercent = nights >= 3 ? 10 : 0;
                            const discountAmount = (subtotal * discountPercent) / 100;
                            const afterDiscount = subtotal - discountAmount;
                            
                            // Calculate GST based on September amendment rules
                            const perDayRateAfterDiscount = (ratePerNight * (100 - discountPercent)) / 100;
                            const gstCalculation = gstCalculations[roomType.id] || calculateGSTForRoom(roomType.id, perDayRateAfterDiscount, afterDiscount);
                            const gstAmount = gstCalculation.total.amount;
                            const gstPercent = gstCalculation.total.percentage;
                            const finalTotal = afterDiscount + gstAmount;
                            
                            return (
                              <div className="bg-gray-100 border border-gray-200 rounded p-3 space-y-2">
                                <h5 className="font-semibold text-gray-900 text-sm mb-2">Price Breakdown</h5>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Total Rooms × Rate/Night × {nights} Night{nights > 1 ? 's' : ''}:</span>
                                    <span className="font-medium">{quantity} × {currencySymbol}{ratePerNight.toLocaleString()} × {nights}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span className="font-medium">{currencySymbol}{subtotal.toLocaleString()}</span>
                                  </div>
                                  {discountAmount > 0 && (
                                    <div className="flex justify-between text-gray-600">
                                      <span>Discount ({discountPercent}%):</span>
                                      <span>-{currencySymbol}{discountAmount.toLocaleString()}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Taxable Amount:</span>
                                    <span className="font-medium">{currencySymbol}{afterDiscount.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">GST ({gstPercent}%):</span>
                                    <span className="font-medium">{currencySymbol}{gstAmount.toLocaleString()}</span>
                                  </div>
                                  <div className="border-t border-gray-300 pt-2">
                                    <div className="flex justify-between font-bold text-gray-900">
                                      <span>Total Amount:</span>
                                      <span className="text-lg text-gray-600">{currencySymbol}{finalTotal.toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                        </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Bed className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No rooms available</p>
                  </div>
                )}

                {/* Single Book Now Button */}
                {Object.values(roomQuantities).some(qty => qty > 0) && checkInDate && checkOutDate && (
                  <div className="mt-6 p-4 bg-gray-100 border border-gray-200 rounded">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Booking Summary</h4>
                      <div className="space-y-2 text-sm">
                        {roomTypes
                          .filter(rt => rt.isActive && roomQuantities[rt.id] > 0)
                          .map(roomType => {
                            const nights = Math.max(1, Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)));
                            const quantity = roomQuantities[roomType.id];
                            const ratePerNight = roomType.basePrice || 2500;
                            const subtotal = quantity * ratePerNight * nights;
                            const discountPercent = nights >= 3 ? 10 : 0;
                            const discountAmount = (subtotal * discountPercent) / 100;
                            const afterDiscount = subtotal - discountAmount;
                            // Calculate GST based on September amendment rules
                            const perDayRateAfterDiscount = (ratePerNight * (100 - discountPercent)) / 100;
                            const gstCalculation = gstCalculations[roomType.id] || calculateGSTForRoom(roomType.id, perDayRateAfterDiscount, afterDiscount);
                            const gstAmount = gstCalculation.total.amount;
                            const gstPercent = gstCalculation.total.percentage;
                            const finalTotal = afterDiscount + gstAmount;
                            
                            return (
                              <div key={roomType.id} className="flex justify-between border-b border-gray-200 pb-2">
                                <span className="text-gray-600">
                                  {quantity} × {roomType.roomTypeName} ({nights} night{nights > 1 ? 's' : ''})
                                </span>
                                <span className="font-medium text-gray-700">
                                  {currencySymbol}{finalTotal.toLocaleString()}
                                </span>
                              </div>
                            );
                          })}
                        

                        <div className="border-t border-gray-300 pt-2">
                          <div className="flex justify-between font-bold text-lg">
                            <span className="text-gray-900">Grand Total:</span>
                            <span className="text-gray-700">
                              {currencySymbol}{Math.max(0, roomTypes
                                .filter(rt => rt.isActive && roomQuantities[rt.id] > 0)
                                .reduce((total, roomType) => {
                                  const nights = Math.max(1, Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)));
                                  const quantity = roomQuantities[roomType.id];
                                  const ratePerNight = roomType.basePrice || 2500;
                                  const subtotal = quantity * ratePerNight * nights;
                                  const discountPercent = nights >= 3 ? 10 : 0;
                                  const discountAmount = (subtotal * discountPercent) / 100;
                                  const afterDiscount = subtotal - discountAmount;
                                  // Calculate GST based on September amendment rules
                                  const perDayRateAfterDiscount = (ratePerNight * (100 - discountPercent)) / 100;
                                  const gstCalculation = gstCalculations[roomType.id] || calculateGSTForRoom(roomType.id, perDayRateAfterDiscount, afterDiscount);
                                  const gstAmount = gstCalculation.total.amount;
                                  const gstPercent = gstCalculation.total.percentage;
                                  const finalTotal = afterDiscount + gstAmount;
                                  return total + finalTotal;
                                }, 0)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3">Need Help?</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>Call: +91 1234567890</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>Email: support@roomnest.com</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Book Now Button */}
      {Object.values(roomQuantities).some(qty => qty > 0) && checkInDate && checkOutDate && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 shadow-2xl z-50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <div className="text-sm text-gray-600 font-medium">
                  {Object.values(roomQuantities).reduce((total, qty) => total + qty, 0)} room{Object.values(roomQuantities).reduce((total, qty) => total + qty, 0) > 1 ? 's' : ''} selected
                </div>
                <div className="font-bold text-xl text-gray-900">
                  Total: {currencySymbol}{Math.max(0, roomTypes
                    .filter(rt => rt.isActive && roomQuantities[rt.id] > 0)
                    .reduce((total, roomType) => {
                      const nights = Math.max(1, Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)));
                      const quantity = roomQuantities[roomType.id];
                      const ratePerNight = roomType.basePrice || 2500;
                      const subtotal = quantity * ratePerNight * nights;
                      const discountPercent = nights >= 3 ? 10 : 0;
                      const discountAmount = (subtotal * discountPercent) / 100;
                      const afterDiscount = subtotal - discountAmount;
                      // Calculate GST based on September amendment rules
                      const perDayRateAfterDiscount = (ratePerNight * (100 - discountPercent)) / 100;
                      const gstCalculation = gstCalculations[roomType.id] || calculateGSTForRoom(roomType.id, perDayRateAfterDiscount, afterDiscount);
                      const gstAmount = gstCalculation.total.amount;
                      const gstPercent = gstCalculation.total.percentage;
                      const finalTotal = afterDiscount + gstAmount;
                      return total + finalTotal;
                    }, 0)).toLocaleString()}
                </div>
              </div>
              
              <Button 
                className="!bg-[#006699] hover:!bg-[#002a66] text-white text-lg px-8 py-4 font-bold shadow-xl border-2 border-[#006699] transition-all duration-200 rounded"
                onClick={() => {
                  // Navigate to booking page with all selected rooms and coupon info
                  const selectedRooms = roomTypes
                    .filter(rt => rt.isActive && roomQuantities[rt.id] > 0)
                    .map(rt => `${rt.id}:${roomQuantities[rt.id]}`)
                    .join(',');
                  
                  const bookingUrl = `/room-booking/${propertyId}?rooms=${selectedRooms}&checkIn=${checkInDate}&checkOut=${checkOutDate}&guests=${guests}`;
                  setLocation(bookingUrl);
                }}
                data-testid="button-book-now"
              >
                Book Now - Proceed to Payment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}