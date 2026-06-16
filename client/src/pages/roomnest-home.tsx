import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, Calendar, Users, MapPin, Heart, Star, Wifi, Car, Utensils, ShoppingCart, Plane, Train, Bus, Hotel, ChevronDown, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { FloatingSOS } from "@/components/ui/floating-sos";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/contexts/i18n";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Property {
  id: number;
  name: string;
  type: string;
  location: string;
  city: string;
  description: string;
  amenities: string[];
  images: string[];
  pricePerNight: string;
  hourlyRate?: string;
  rating: string;
  reviewCount: number;
  category?: string;
  capacity?: number;
}

interface SearchParams {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
}

// Popular Indian cities for autocomplete
const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad',
  'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal',
  'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana',
  'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar',
  'Varanasi', 'Srinagar', 'Dhanbad', 'Jodhpur', 'Amritsar', 'Raipur', 'Allahabad',
  'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada', 'Madurai', 'Gurgaon', 'Navi Mumbai',
  'Aurangabad', 'Solapur', 'Ranchi', 'Jalandhar', 'Tiruchirappalli', 'Bhubaneswar'
];

export default function RoomNestHome() {
  const [, setLocation] = useLocation();
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useState<SearchParams>({
    location: "",
    checkIn: "",
    checkOut: "",
    guests: 1,
    rooms: 1
  });

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeBookingTab, setActiveBookingTab] = useState<string>("hotel");
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  
  // Popover states for date pickers
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [eventDateOpen, setEventDateOpen] = useState(false);
  const [flightDepartureOpen, setFlightDepartureOpen] = useState(false);
  const [flightReturnOpen, setFlightReturnOpen] = useState(false);
  const [trainDateOpen, setTrainDateOpen] = useState(false);
  const [busDateOpen, setBusDateOpen] = useState(false);
  const [taxiDateOpen, setTaxiDateOpen] = useState(false);

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.autocomplete-container')) {
        setShowCitySuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get featured properties
  const { data: featuredProperties = [] } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      const response = await fetch('/api/properties?limit=6');
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    }
  });

  // Fetch property photos for featured properties
  const { data: propertyPhotos = {} } = useQuery<Record<number, any[]>>({
    queryKey: ['/api/property-photos', featuredProperties.map((p: any) => p.id).join(',')],
    queryFn: async () => {
      const photoPromises = featuredProperties.map(async (property: any) => {
        try {
          const response = await fetch(`/api/universal-photos?entityType=property&entityId=${property.id}`);
          if (!response.ok) return [];
          const data = await response.json();
          return { propertyId: property.id, photos: data.photos || [] };
        } catch (error) {
          console.error(`Error fetching photos for property ${property.id}:`, error);
          return { propertyId: property.id, photos: [] };
        }
      });
      
      const results = await Promise.all(photoPromises);
      const photoMap: Record<number, any[]> = {};
      results.forEach(({ propertyId, photos }) => {
        photoMap[propertyId] = photos;
      });
      return photoMap;
    },
    enabled: featuredProperties.length > 0
  });

  // Get active promotions
  const { data: promotions = [] } = useQuery({
    queryKey: ['/api/promotions'],
    queryFn: async () => {
      const response = await fetch('/api/promotions');
      if (!response.ok) throw new Error('Failed to fetch promotions');
      return response.json();
    }
  });

  // Handle city input change and filtering
  const handleLocationChange = (value: string) => {
    setSearchParams(prev => ({ ...prev, location: value }));
    
    if (value.length > 0) {
      const filtered = INDIAN_CITIES.filter(city => 
        city.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8);
      setFilteredCities(filtered);
      setShowCitySuggestions(true);
    } else {
      setShowCitySuggestions(false);
      setFilteredCities([]);
    }
  };

  const selectCity = (city: string) => {
    setSearchParams(prev => ({ ...prev, location: city }));
    setShowCitySuggestions(false);
    setFilteredCities([]);
  };

  const handleSearch = () => {
    // Validate required fields
    if (!searchParams.location.trim()) {
      alert('Please enter a location');
      return;
    }
    
    if (!searchParams.checkIn) {
      alert('Please select check-in date');
      return;
    }
    
    if (!searchParams.checkOut) {
      alert('Please select check-out date');
      return;
    }

    const params = new URLSearchParams({
      type: activeBookingTab,
      location: searchParams.location,
      checkIn: searchParams.checkIn,
      checkOut: searchParams.checkOut,
      guests: searchParams.guests.toString(),
      rooms: searchParams.rooms.toString()
    });
    
    // Navigate to booking portal with search parameters
    setLocation(`/booking-portal?${params.toString()}`);
  };

  const getAmenityIcon = (amenity: string) => {
    const lowerAmenity = amenity.toLowerCase();
    if (lowerAmenity.includes('wifi')) return <Wifi className="h-4 w-4" />;
    if (lowerAmenity.includes('parking') || lowerAmenity.includes('car')) return <Car className="h-4 w-4" />;
    if (lowerAmenity.includes('restaurant') || lowerAmenity.includes('food')) return <Utensils className="h-4 w-4" />;
    return <Star className="h-4 w-4" />;
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

  // Get property image with gallery integration and smart fallback
  const getPropertyImage = (propertyId: number) => {
    const photos = propertyPhotos[propertyId] || [];
    const mainPhoto = photos.find((p: any) => p.isMainPhoto) || photos[0];
    
    if (mainPhoto) {
      console.log('📷 Using gallery photo for property', propertyId, ':', mainPhoto.photoUrl);
      return getImageUrl(mainPhoto.photoUrl);
    }
    
    console.log('🖼️ No gallery photos for property', propertyId, ', using placeholder');
    return "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#002a66] to-gray-800 bg-clip-text text-transparent" data-testid="text-brand">
                RoomNest
              </h1>
              <nav className="hidden md:flex space-x-6">
                <Link href="/" className="text-primary-600 hover:text-gray-800 transition-colors">
                  <span data-testid="link-home">🏠 Home</span>
                </Link>
                <Link href="/bookings" className="text-primary-600 hover:text-gray-800 transition-colors">
                  <span data-testid="link-bookings">📅 My Bookings</span>
                </Link>
                <Link href="/wallet" className="text-primary-600 hover:text-gray-800 transition-colors">
                  <span data-testid="link-wallet">💰 RoomNest Money</span>
                </Link>
                <Link href="/conference-rooms" className="text-primary-600 hover:text-gray-800 transition-colors">
                  <span data-testid="link-conference">🏢 Conference Rooms</span>
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" data-testid="button-search-icon">
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" data-testid="button-ecom">
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              </div>
              
              {currentUser ? (
                <div className="flex items-center space-x-2">
                  <span data-testid="text-welcome">Welcome, {currentUser.name}</span>
                  <Link href="/profile">
                    <Button variant="outline" size="sm" data-testid="button-profile">
                      Profile
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-x-2">
                  <Link href="/login">
                    <Button variant="outline" size="sm" className="border-primary-600 text-primary-600 hover:bg-[#006699] hover:text-white transition-all" data-testid="button-login">
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="bg-[#006699] hover:bg-[#002a66] text-white" data-testid="button-register">
                      Register
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Search */}
      <section className="roomnest-gradient text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-4" data-testid="text-hero-title">
              {t('booking.title')}
            </h2>
            <p className="text-xl opacity-90" data-testid="text-hero-subtitle">
              {t('booking.subtitle')}
            </p>
          </div>

          {/* Travel Booking Interface */}
          <div className="bg-white rounded shadow-lg p-6 max-w-6xl mx-auto">
            {/* Booking Type Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-6 border-b">
              {[
                { id: "hotel", label: t('booking.searchHotels'), icon: Hotel },
                { id: "conference_room", label: "BoardMeet Halls", icon: Users },
                { id: "flight", label: t('booking.searchFlights'), icon: Plane },
                { id: "train", label: t('booking.searchTrains'), icon: Train },
                { id: "bus", label: t('booking.searchBuses'), icon: Bus },
                { id: "taxi", label: "Taxis", icon: Car },
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveBookingTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-t transition-colors ${
                      activeBookingTab === tab.id
                        ? "bg-[hsl(213_94%_25%)] text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                    data-testid={`tab-${tab.id}`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Hotel Search Form */}
            {activeBookingTab === "hotel" && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <div className="relative autocomplete-container">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Hotel name, city, area, pincode"
                      className="pl-10 text-gray-900 bg-white border-gray-300 focus:text-gray-900"
                      value={searchParams.location}
                      onChange={(e) => handleLocationChange(e.target.value)}
                      onFocus={() => {
                        if (filteredCities.length > 0) {
                          setShowCitySuggestions(true);
                        }
                      }}
                      data-testid="input-hotel-location"
                    />
                    
                    {/* City Autocomplete Dropdown */}
                    {showCitySuggestions && filteredCities.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
                        {filteredCities.map((city, index) => (
                          <div
                            key={index}
                            className="px-4 py-2 hover:bg-[hsl(213_94%_97%)] cursor-pointer text-gray-800 border-b border-gray-100 last:border-b-0"
                            onClick={() => selectCity(city)}
                            data-testid={`suggestion-${city.toLowerCase()}`}
                          >
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                              {city}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
                  <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal text-gray-900 bg-white border-gray-300 focus:text-gray-900 w-full",
                          !searchParams.checkIn && "text-muted-foreground"
                        )}
                        data-testid="input-hotel-checkin"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {searchParams.checkIn ? format(new Date(searchParams.checkIn), "MMM dd, yyyy") : "Select check-in"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={searchParams.checkIn ? new Date(searchParams.checkIn) : undefined}
                        onSelect={(date) => {
                          setSearchParams(prev => ({ ...prev, checkIn: date ? format(date, 'yyyy-MM-dd') : '' }));
                          setCheckInOpen(false);
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
                  <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal text-gray-900 bg-white border-gray-300 focus:text-gray-900 w-full",
                          !searchParams.checkOut && "text-muted-foreground"
                        )}
                        data-testid="input-hotel-checkout"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {searchParams.checkOut ? format(new Date(searchParams.checkOut), "MMM dd, yyyy") : "Select check-out"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={searchParams.checkOut ? new Date(searchParams.checkOut) : undefined}
                        onSelect={(date) => {
                          setSearchParams(prev => ({ ...prev, checkOut: date ? format(date, 'yyyy-MM-dd') : '' }));
                          setCheckOutOpen(false);
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guests & Rooms</label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        min="1"
                        placeholder="Guests"
                        className="pl-10 text-gray-900 bg-white border-gray-300 focus:text-gray-900"
                        value={searchParams.guests}
                        onChange={(e) => setSearchParams(prev => ({ ...prev, guests: parseInt(e.target.value) || 1 }))}
                        data-testid="input-hotel-guests"
                      />
                    </div>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Rooms"
                      className="text-gray-900 bg-white border-gray-300 focus:text-gray-900"
                      value={searchParams.rooms}
                      onChange={(e) => setSearchParams(prev => ({ ...prev, rooms: parseInt(e.target.value) || 1 }))}
                      data-testid="input-hotel-rooms"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* BoardMeet Conference Halls Search Form */}
            {activeBookingTab === "conference_room" && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="City, area, venue name"
                      className="pl-10 text-gray-900 bg-white border-gray-300 focus:text-gray-900"
                      data-testid="input-hall-location"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                  <Popover open={eventDateOpen} onOpenChange={setEventDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal text-gray-900 bg-white border-gray-300 focus:text-gray-900 w-full",
                          "text-muted-foreground"
                        )}
                        data-testid="input-hall-date"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        Select event date
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        onSelect={(date) => {
                          console.log('Conference date selected:', date);
                          setEventDateOpen(false);
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Input
                        type="time"
                        className="w-full text-gray-900 bg-white border-gray-300 focus:text-gray-900"
                        data-testid="input-hall-start-time"
                      />
                    </div>
                    <div className="relative flex-1">
                      <Input
                        type="time"
                        className="w-full text-gray-900 bg-white border-gray-300 focus:text-gray-900"
                        data-testid="input-hall-end-time"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity & Duration</label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        min="1"
                        placeholder="People"
                        className="pl-10 text-gray-900 bg-white border-gray-300 focus:text-gray-900"
                        data-testid="input-hall-capacity"
                      />
                    </div>
                    <select className="flex-1 px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white focus:text-gray-900" data-testid="select-hall-duration">
                      <option value="2">2 Hours</option>
                      <option value="4">4 Hours</option>
                      <option value="6">6 Hours</option>
                      <option value="8">Full Day</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Flight Search Form */}
            {activeBookingTab === "flight" && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <div className="relative">
                    <Plane className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input placeholder="Mumbai, Delhi, Bangalore..." className="pl-10 text-gray-900 bg-white border-gray-300 focus:text-gray-900" data-testid="input-flight-from" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <div className="relative">
                    <Plane className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input placeholder="Mumbai, Delhi, Bangalore..." className="pl-10 text-gray-900 bg-white border-gray-300 focus:text-gray-900" data-testid="input-flight-to" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departure</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Popover open={flightDepartureOpen} onOpenChange={setFlightDepartureOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="justify-start text-left font-normal text-gray-900 bg-white border-gray-300 focus:text-gray-900 w-full"
                          data-testid="input-flight-departure"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          Select departure date
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          onSelect={(date) => {
                            console.log('Flight departure selected:', date);
                            setFlightDepartureOpen(false);
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Return</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Popover open={flightReturnOpen} onOpenChange={setFlightReturnOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="justify-start text-left font-normal text-gray-900 bg-white border-gray-300 focus:text-gray-900 w-full"
                          data-testid="input-flight-return"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          Select return date
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          onSelect={(date) => {
                            console.log('Flight return selected:', date);
                            setFlightReturnOpen(false);
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passengers</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input type="number" min="1" max="9" defaultValue="1" className="pl-10 text-gray-900 bg-white border-gray-300 focus:text-gray-900" data-testid="input-flight-passengers" />
                  </div>
                </div>
              </div>
            )}

            {/* Train Search Form */}
            {activeBookingTab === "train" && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Station</label>
                  <div className="relative">
                    <Train className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input placeholder="Mumbai Central, New Delhi..." className="pl-10 text-gray-900 bg-white border-gray-300 focus:text-gray-900" data-testid="input-train-from" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Station</label>
                  <div className="relative">
                    <Train className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input placeholder="Mumbai Central, New Delhi..." className="pl-10 text-gray-900 bg-white border-gray-300 focus:text-gray-900" data-testid="input-train-to" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Journey Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Popover open={trainDateOpen} onOpenChange={setTrainDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="justify-start text-left font-normal text-gray-900 bg-white border-gray-300 focus:text-gray-900 w-full"
                          data-testid="input-train-date"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          Select journey date
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          onSelect={(date) => {
                            console.log('Train date selected:', date);
                            setTrainDateOpen(false);
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white focus:text-gray-900" data-testid="select-train-class">
                    <option value="3ac">3AC</option>
                    <option value="2ac">2AC</option>
                    <option value="1ac">1AC</option>
                    <option value="sleeper">Sleeper</option>
                  </select>
                </div>
              </div>
            )}

            {/* Bus Search Form */}
            {activeBookingTab === "bus" && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <div className="relative">
                    <Bus className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input placeholder="Mumbai, Pune, Bangalore..." className="pl-10 text-gray-900 bg-white border-gray-300 focus:text-gray-900" data-testid="input-bus-from" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <div className="relative">
                    <Bus className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input placeholder="Mumbai, Pune, Bangalore..." className="pl-10 text-gray-900 bg-white border-gray-300 focus:text-gray-900" data-testid="input-bus-to" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Journey Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Popover open={busDateOpen} onOpenChange={setBusDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="justify-start text-left font-normal text-gray-900 bg-white border-gray-300 focus:text-gray-900 w-full"
                          data-testid="input-bus-date"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          Select travel date
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          onSelect={(date) => {
                            console.log('Bus date selected:', date);
                            setBusDateOpen(false);
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passengers</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input type="number" min="1" max="6" defaultValue="1" className="pl-10 text-gray-900 bg-white border-gray-300 focus:text-gray-900" data-testid="input-bus-passengers" />
                  </div>
                </div>
              </div>
            )}

            {/* Taxi Booking Form */}
            {activeBookingTab === "taxi" && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input placeholder="Airport, Hotel, Address..." className="pl-10 text-gray-900 bg-white border-gray-300 focus:text-gray-900" data-testid="input-taxi-pickup" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Drop Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input placeholder="Airport, Hotel, Address..." className="pl-10 text-gray-900 bg-white border-gray-300 focus:text-gray-900" data-testid="input-taxi-drop" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date & Time</label>
                  <div className="flex space-x-2">
                    <Popover open={taxiDateOpen} onOpenChange={setTaxiDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex-1 justify-start text-left font-normal text-gray-900 bg-white border-gray-300 focus:text-gray-900"
                          data-testid="input-taxi-date"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          Select date
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          onSelect={(date) => {
                            console.log('Taxi date selected:', date);
                            setTaxiDateOpen(false);
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Input type="time" className="flex-1 text-gray-900 bg-white border-gray-300 focus:text-gray-900" data-testid="input-taxi-time" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white focus:text-gray-900" data-testid="select-taxi-type">
                    <option value="sedan">Sedan (4 seats)</option>
                    <option value="suv">SUV (6-7 seats)</option>
                    <option value="auto">Auto Rickshaw</option>
                    <option value="bike">Bike Taxi</option>
                  </select>
                </div>
              </div>
            )}
            
            {/* Search Button */}
            <div className="mt-6 text-center">
              <Button 
                onClick={handleSearch}
                className="roomnest-button-primary px-8"
                data-testid="button-search"
              >
                <Search className="h-4 w-4 mr-2" />
                {activeBookingTab === "hotel" && "Search Hotels & Conference Rooms"}
                {activeBookingTab === "flight" && "Search Flights"}
                {activeBookingTab === "train" && "Search Trains"}
                {activeBookingTab === "bus" && "Search Buses"}
                {activeBookingTab === "taxi" && "Book Taxi Now"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Active Promotions */}
      {promotions.length > 0 && (
        <section className="py-12 bg-gradient-to-r from-[hsl(213_94%_97%)] to-[hsl(210_60%_97%)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-2xl font-bold text-center mb-8 text-[hsl(213_94%_25%)]" data-testid="text-promotions-title">
              🎉 Special Offers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotions.slice(0, 3).map((promo: any) => (
                <Card key={promo.id} className="roomnest-card-hover border-[hsl(158_15%_85%)] bg-white" data-testid={`card-promotion-${promo.id}`}>
                  <CardHeader>
                    <CardTitle className="text-[hsl(213_94%_25%)]">{promo.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-2">{promo.description}</p>
                    <Badge variant="secondary" className="bg-[hsl(213_94%_97%)] text-[hsl(213_94%_20%)] border-none">
                      Code: {promo.code}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Properties */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-[hsl(213_94%_25%)] mb-4" data-testid="text-featured-title">
              🌟 Featured Travel Options
            </h3>
            <p className="text-gray-600" data-testid="text-featured-subtitle">
              Discover our handpicked selection of hotels, flights, trains, buses, and taxis
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProperties.slice(0, 6).map((property: Property) => (
              <Card key={property.id} className="group roomnest-card-hover bg-white border-gray-100" data-testid={`card-property-${property.id}`}>
                <div className="relative overflow-hidden rounded-t">
                  <img
                    src={getPropertyImage(property.id)}
                    alt={property.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      console.log('Property image failed to load for property:', property.id, ', switching to placeholder');
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300';
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                    data-testid={`button-wishlist-${property.id}`}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                  {property.category && (
                    <Badge className="absolute top-2 left-2 roomnest-primary">
                      {property.category}
                    </Badge>
                  )}
                </div>
                
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg" data-testid={`text-property-name-${property.id}`}>
                      {property.name}
                    </CardTitle>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="ml-1 text-sm font-medium" data-testid={`text-rating-${property.id}`}>
                        {property.rating}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm" data-testid={`text-location-${property.id}`}>
                      {property.location}, {property.city}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2" data-testid={`text-description-${property.id}`}>
                    {property.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {property.amenities?.slice(0, 3).map((amenity, index) => (
                      <div key={index} className="flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {getAmenityIcon(amenity)}
                        <span className="ml-1">{amenity}</span>
                      </div>
                    ))}
                    {property.amenities?.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{property.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[hsl(213_94%_25%)]" data-testid={`text-price-${property.id}`}>
                      {property.type === 'hotel' || property.type === 'conference_room' 
                        ? `₹${property.type === 'conference_room' ? property.hourlyRate || '1200' : property.pricePerNight || '3500'}`
                        : property.type === 'flight' || property.type === 'train' || property.type === 'bus'
                        ? 'From ₹450'
                        : property.type === 'taxi'
                        ? '₹12/km'
                        : property.pricePerNight ? `₹${property.pricePerNight}` : 'From ₹500'
                      }
                      <span className="text-sm font-normal text-gray-600">
                        {property.type === 'conference_room' && '/hour'}
                        {property.type === 'hotel' && '/night'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500" data-testid={`text-reviews-${property.id}`}>
                      {property.reviewCount} reviews
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Link href="/booking-portal" className="w-full">
                    <Button className="w-full roomnest-button-primary" data-testid={`button-view-details-${property.id}`}>
                      {property.type === 'taxi' ? 'Book Ride' : 
                       property.type === 'hotel' || property.type === 'conference_room' ? 'View Details & Book' :
                       'Book Now'}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link href="/booking-portal">
              <Button variant="outline" size="lg" className="border-[hsl(213_94%_25%)] text-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_25%)] hover:text-white transition-all" data-testid="button-view-all">
                View All Travel Options
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* BoardMeet Conference Halls Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-[hsl(213_94%_25%)] mb-4" data-testid="text-boardmeet-title">
              🏢 BoardMeet Conference Halls
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto" data-testid="text-boardmeet-subtitle">
              Professional meeting spaces with state-of-the-art technology. Perfect for corporate events, seminars, workshops, and business meetings.
            </p>
          </div>
          
          {/* Conference Hall Features */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="text-center p-6 bg-gray-50 rounded">
              <div className="w-12 h-12 bg-[hsl(213_94%_25%)] rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-semibold mb-2">Flexible Capacity</h4>
              <p className="text-sm text-gray-600">From intimate 10-person meetings to large 500-person conferences</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded">
              <div className="w-12 h-12 bg-[hsl(213_94%_25%)] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold">AV</span>
              </div>
              <h4 className="font-semibold mb-2">Modern Tech</h4>
              <p className="text-sm text-gray-600">Projectors, sound systems, video conferencing, and high-speed Wi-Fi</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded">
              <div className="w-12 h-12 bg-[hsl(213_94%_25%)] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white">🍽️</span>
              </div>
              <h4 className="font-semibold mb-2">Catering Service</h4>
              <p className="text-sm text-gray-600">Professional catering and refreshment arrangements available</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded">
              <div className="w-12 h-12 bg-[hsl(213_94%_25%)] rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-semibold mb-2">Hourly Booking</h4>
              <p className="text-sm text-gray-600">Flexible hourly rates starting from ₹850/hour</p>
            </div>
          </div>

          {/* Featured Conference Halls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredProperties
              .filter((property: any) => property.type === 'conference_room')
              .slice(0, 3)
              .map((hall: any) => (
                <Card key={hall.id} className="hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img 
                      src={hall.images?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400'} 
                      alt={hall.name}
                      className="w-full h-48 object-cover rounded-t"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-[hsl(213_94%_25%)] text-white">
                        {hall.capacity || 50} People
                      </Badge>
                    </div>
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="text-lg" data-testid={`text-hall-name-${hall.id}`}>
                      {hall.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      📍 {hall.location}, {hall.city}
                    </p>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {hall.amenities?.slice(0, 3).map((amenity: any, index: number) => (
                        <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {amenity}
                        </span>
                      ))}
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[hsl(213_94%_25%)]">
                        ₹{hall.hourlyRate || '850'}
                        <span className="text-sm font-normal text-gray-600">/hour</span>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    <Link href="/booking-portal" className="w-full">
                      <Button className="w-full roomnest-button-primary">
                        Book Conference Hall
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
          </div>
          
          {featuredProperties.filter((p: any) => p.type === 'conference_room').length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No conference halls available at the moment. Check back soon!</p>
            </div>
          )}
          
          <div className="text-center mt-8">
            <Link href="/booking-portal?type=conference_room">
              <Button 
                variant="outline" 
                size="lg" 
                className="border-[hsl(213_94%_25%)] text-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_25%)] hover:text-white transition-all"
                data-testid="button-search-halls"
              >
                Search All Conference Halls
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose RoomNest */}
      <section className="py-16 bg-gradient-to-br from-[hsl(213_94%_97%)] to-[hsl(210_60%_97%)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-[hsl(213_94%_25%)] mb-4">✨ Why Choose RoomNest?</h3>
            <p className="text-gray-600">Experience the difference with our premium hospitality services</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center" data-testid="feature-loyalty">
              <div className="roomnest-accent w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold mb-2 text-[hsl(213_94%_25%)]">Loyalty Rewards</h4>
              <p className="text-gray-600">Earn refreshment stays with every 3 bookings. Get rewarded for your loyalty.</p>
            </div>
            
            <div className="text-center" data-testid="feature-wallet">
              <div className="roomnest-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white">💰</span>
              </div>
              <h4 className="text-xl font-semibold mb-2 text-[hsl(213_94%_25%)]">RoomNest Money</h4>
              <p className="text-gray-600">Easy refunds and payments with our digital wallet system.</p>
            </div>
            
            <div className="text-center" data-testid="feature-support">
              <div className="bg-[hsl(0_80%_55%)] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white">🆘</span>
              </div>
              <h4 className="text-xl font-semibold mb-2 text-[hsl(213_94%_25%)]">24/7 Support</h4>
              <p className="text-gray-600">Emergency SOS button and round-the-clock customer support for your safety.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Navigation (Mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="flex justify-around py-2">
          <Link href="/" className="flex flex-col items-center py-2 text-[hsl(213_94%_25%)]">
            <span className="text-lg">🏠</span>
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/booking-portal" className="flex flex-col items-center py-2 text-gray-600 hover:text-[hsl(213_94%_25%)] transition-colors">
            <Search className="h-5 w-5" />
            <span className="text-xs">Search</span>
          </Link>
          <Link href="/guest" className="flex flex-col items-center py-2 text-gray-600 hover:text-[hsl(213_94%_25%)] transition-colors">
            <span className="text-lg">📅</span>
            <span className="text-xs">Bookings</span>
          </Link>
          <Link href="/guest" className="flex flex-col items-center py-2 text-gray-600 hover:text-[hsl(25_95%_53%)] transition-colors">
            <span className="text-lg">💰</span>
            <span className="text-xs">Wallet</span>
          </Link>
          <Link href="/booking-portal?type=conference_room" className="flex flex-col items-center py-2 text-gray-600 hover:text-[hsl(213_94%_25%)] transition-colors">
            <span className="text-lg">🏢</span>
            <span className="text-xs">Conference</span>
          </Link>
        </div>
      </div>

      <FloatingSOS />
    </div>
  );
}