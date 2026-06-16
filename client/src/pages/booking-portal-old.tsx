import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import SearchForm from "@/components/search-form";
import PropertyCard from "@/components/property-card";
import BookingModal from "@/components/booking-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck, Headphones, RotateCcw } from "lucide-react";
import type { Property } from "@shared/schema";

export default function BookingPortal() {
  const [location] = useLocation();
  const [searchData, setSearchData] = useState<any>({});
  const [showResults, setShowResults] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Parse URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const locationParam = urlParams.get('location');
    const checkIn = urlParams.get('checkIn');
    const checkOut = urlParams.get('checkOut');
    const guests = urlParams.get('guests');
    const rooms = urlParams.get('rooms');

    if (locationParam || type) {
      const searchParams = {
        type: type || 'hotel',
        location: locationParam || '',
        checkIn: checkIn || '',
        checkOut: checkOut || '',
        guests: parseInt(guests || '1'),
        rooms: parseInt(rooms || '1'),
        destination: locationParam || ''  // For SearchForm compatibility
      };
      
      setSearchData(searchParams);
      
      // Show results if we have location or just show all properties of the type
      if (locationParam || type) {
        setShowResults(true);
      }
    }
  }, [location]);

  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties", searchData],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchData.type) params.append('type', searchData.type);
      if (searchData.location) params.append('location', searchData.location);
      if (searchData.starRatings && searchData.starRatings.length > 0) {
        searchData.starRatings.forEach((rating: number) => {
          params.append('starRating', rating.toString());
        });
      }
      if (searchData.reviewRatings && searchData.reviewRatings.length > 0) {
        searchData.reviewRatings.forEach((rating: string) => {
          params.append('reviewRating', rating);
        });
      }
      
      const response = await fetch(`/api/properties?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    },
    enabled: showResults,
  });

  const handleSearch = (data: any) => {
    setSearchData(data);
    setShowResults(true);
  };

  const handleViewDetails = (property: Property) => {
    setSelectedProperty(property);
    setShowBookingModal(true);
  };

  const featuredDestinations = [
    {
      name: "Paris",
      image: "https://images.unsplash.com/photo-1502602898536-47ad22581b52?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      price: "$299"
    },
    {
      name: "Tokyo", 
      image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      price: "$189"
    },
    {
      name: "New York",
      image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400", 
      price: "$259"
    },
    {
      name: "London",
      image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      price: "$219"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[hsl(213_94%_25%)] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PO</span>
              </div>
              <span className="text-xl font-bold text-[hsl(213_94%_25%)]">RoomNest</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-600 hover:text-[hsl(213_94%_25%)] transition-colors">
                Admin
              </Link>
              <Link href="/guest" className="text-gray-600 hover:text-[hsl(213_94%_25%)] transition-colors">
                My Bookings
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Search */}
      <section className="relative bg-gradient-to-r from-[hsl(213_94%_20%)] to-[hsl(213_94%_15%)] text-white">
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div 
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=800')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
          className="absolute inset-0"
        ></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-4" data-testid="text-hero-title">
              Find Your Next Adventure
            </h1>
            <p className="text-xl md:text-2xl text-blue-100" data-testid="text-hero-subtitle">
              Book hotels, flights, trains, and buses all in one place
            </p>
          </div>

          <SearchForm onSearch={handleSearch} />
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4" data-testid="text-destinations-title">
              Popular Destinations
            </h2>
            <p className="text-gray-600">Discover amazing places around the world</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredDestinations.map((destination, index) => (
              <div key={index} className="group cursor-pointer" data-testid={`card-destination-${index}`}>
                <div className="relative overflow-hidden rounded-xl">
                  <img
                    src={destination.image}
                    alt={destination.name}
                    className="w-full h-64 object-cover group-hover:scale-110 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-bold" data-testid={`text-destination-name-${index}`}>
                      {destination.name}
                    </h3>
                    <p className="text-sm" data-testid={`text-destination-price-${index}`}>
                      From {destination.price}/night
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search Results Section */}
      {showResults && (
        <section className="py-16 bg-gray-50" data-testid="section-search-results">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-results-title">
                Hotels in {searchData.destination || "Your Destination"}
              </h2>
              <p className="text-gray-600">Found {properties.length} hotels for your dates</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Filters Sidebar */}
              <div className="lg:col-span-1">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Filters</h3>
                    
                    {/* Price Range */}
                    <div className="mb-6">
                      <h4 className="font-medium mb-3">Price Range</h4>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <Checkbox className="rounded text-primary-600" />
                          <span className="ml-2 text-sm">$0 - $100</span>
                        </label>
                        <label className="flex items-center">
                          <Checkbox className="rounded text-primary-600" />
                          <span className="ml-2 text-sm">$100 - $200</span>
                        </label>
                        <label className="flex items-center">
                          <Checkbox className="rounded text-primary-600" />
                          <span className="ml-2 text-sm">$200+</span>
                        </label>
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div className="mb-6">
                      <h4 className="font-medium mb-3">Star Rating</h4>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <Checkbox className="rounded text-primary-600" />
                          <span className="ml-2 text-sm">5 Star</span>
                        </label>
                        <label className="flex items-center">
                          <Checkbox className="rounded text-primary-600" />
                          <span className="ml-2 text-sm">4 Star</span>
                        </label>
                        <label className="flex items-center">
                          <Checkbox className="rounded text-primary-600" />
                          <span className="ml-2 text-sm">3 Star</span>
                        </label>
                      </div>
                    </div>

                    {/* Amenities */}
                    <div>
                      <h4 className="font-medium mb-3">Amenities</h4>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <Checkbox className="rounded text-primary-600" />
                          <span className="ml-2 text-sm">Free WiFi</span>
                        </label>
                        <label className="flex items-center">
                          <Checkbox className="rounded text-primary-600" />
                          <span className="ml-2 text-sm">Swimming Pool</span>
                        </label>
                        <label className="flex items-center">
                          <Checkbox className="rounded text-primary-600" />
                          <span className="ml-2 text-sm">Gym</span>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Results List */}
              <div className="lg:col-span-3">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading hotels...</p>
                  </div>
                ) : properties.length > 0 ? (
                  <div className="space-y-6">
                    {properties.map((property) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        onViewDetails={handleViewDetails}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
                    <p className="text-gray-600 mb-4">Try searching with different criteria or browse all available properties.</p>
                    <button 
                      className="bg-[hsl(213_94%_25%)] text-white px-6 py-2 rounded-md hover:bg-[hsl(213_94%_20%)] transition-colors"
                      onClick={() => {
                        setShowResults(false);
                        setSearchData({});
                      }}
                    >
                      Browse All Properties
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trust and Security Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Book with Confidence</h2>
            <p className="text-gray-600">Your travel experience is secured with industry-leading protection</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="text-green-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
              <p className="text-gray-600">SSL encrypted transactions and PCI compliant processing</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Headphones className="text-blue-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
              <p className="text-gray-600">Round-the-clock customer support in multiple languages</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="text-purple-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Free Cancellation</h3>
              <p className="text-gray-600">Flexible booking policies with free cancellation options</p>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        property={selectedProperty}
        searchData={searchData}
      />
    </div>
  );
}
