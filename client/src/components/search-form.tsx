import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Plane, Bed, Train, Bus, MapPin, Search, Star, MessageSquare, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { HotelStarRating, CustomerReviewRating } from "@shared/schema";

interface SearchFormProps {
  onSearch: (searchData: any) => void;
}

export default function SearchForm({ onSearch }: SearchFormProps) {
  const [activeTab, setActiveTab] = useState("hotels");
  
  // Popover states for date pickers
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [departureOpen, setDepartureOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [eventDateOpen, setEventDateOpen] = useState(false);

  // Fetch rating data for filters
  const { data: hotelStarRatings = [] } = useQuery<HotelStarRating[]>({
    queryKey: ["/api/hotel-star-ratings"],
  });

  const { data: customerReviewRatings = [] } = useQuery<CustomerReviewRating[]>({
    queryKey: ["/api/customer-review-ratings"],
  });
  const [searchData, setSearchData] = useState({
    destination: "",
    checkIn: undefined as Date | undefined,
    checkOut: undefined as Date | undefined,
    guests: "2",
    from: "",
    to: "",
    departure: undefined as Date | undefined,
    return: undefined as Date | undefined,
    passengers: "1",
    starRatings: [] as number[],
    reviewRatings: [] as string[]
  });

  const searchTabs = [
    { id: "hotels", label: "Hotels", icon: Bed },
    { id: "conference_room", label: "BoardMeet Halls", icon: MapPin },
    { id: "flights", label: "Flights", icon: Plane },
    { id: "trains", label: "Trains", icon: Train },
    { id: "buses", label: "Buses", icon: Bus },
  ];

  const handleInputChange = (field: string, value: string) => {
    setSearchData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (field: string, date: Date | undefined) => {
    setSearchData(prev => ({ ...prev, [field]: date }));
  };

  const handleStarRatingChange = (starRating: number, checked: boolean) => {
    setSearchData(prev => ({
      ...prev,
      starRatings: checked 
        ? [...prev.starRatings, starRating]
        : prev.starRatings.filter(rating => rating !== starRating)
    }));
  };

  const handleReviewRatingChange = (ratingRange: string, checked: boolean) => {
    setSearchData(prev => ({
      ...prev,
      reviewRatings: checked 
        ? [...prev.reviewRatings, ratingRange]
        : prev.reviewRatings.filter(rating => rating !== ratingRange)
    }));
  };

  const handleSearch = () => {
    onSearch({ ...searchData, type: activeTab });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search Tabs */}
      <div className="bg-white rounded-t p-1 inline-flex space-x-1 shadow-lg">
        {searchTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`search-tab px-6 py-3 rounded text-sm font-medium transition-colors duration-200 ${
                activeTab === tab.id
                  ? "bg-primary-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab(tab.id)}
              data-testid={`tab-${tab.id}`}
            >
              <Icon className="w-4 h-4 mr-2 inline" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Hotels Search Form */}
      {activeTab === "hotels" && (
        <div className="search-form bg-white rounded-b rounded-tr shadow-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <Label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
                Destination
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <Input
                  id="destination"
                  type="text"
                  className="pl-10 text-gray-900 bg-white border-gray-300 focus:text-gray-900"
                  placeholder="Mumbai, Delhi, Bangalore, Chennai..."
                  value={searchData.destination}
                  onChange={(e) => handleInputChange("destination", e.target.value)}
                  data-testid="input-destination"
                />
                {/* Add autocomplete dropdown here when implemented */}
              </div>
            </div>
            <div>
              <Label htmlFor="checkIn" className="block text-sm font-medium text-gray-700 mb-2">
                Check-in
              </Label>
              <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal text-gray-900 bg-white border-gray-300 focus:text-gray-900",
                      !searchData.checkIn && "text-muted-foreground"
                    )}
                    data-testid="input-checkin"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {searchData.checkIn ? format(searchData.checkIn, "PPP") : "Select check-in date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={searchData.checkIn}
                    onSelect={(date) => {
                      handleDateChange("checkIn", date);
                      setCheckInOpen(false);
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="checkOut" className="block text-sm font-medium text-gray-700 mb-2">
                Check-out
              </Label>
              <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal text-gray-900 bg-white border-gray-300 focus:text-gray-900",
                      !searchData.checkOut && "text-muted-foreground"
                    )}
                    data-testid="input-checkout"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {searchData.checkOut ? format(searchData.checkOut, "PPP") : "Select check-out date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={searchData.checkOut}
                    onSelect={(date) => {
                      handleDateChange("checkOut", date);
                      setCheckOutOpen(false);
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Guests</Label>
              <Select value={searchData.guests} onValueChange={(value) => handleInputChange("guests", value)}>
                <SelectTrigger data-testid="select-guests">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Adult</SelectItem>
                  <SelectItem value="2">2 Adults</SelectItem>
                  <SelectItem value="3">2 Adults, 1 Child</SelectItem>
                  <SelectItem value="4">2 Adults, 2 Children</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-6">
            <Button 
              className="w-full bg-secondary-600 hover:bg-secondary-700 text-white font-bold py-3 px-6"
              onClick={handleSearch}
              data-testid="button-search-hotels"
            >
              <Search className="w-4 h-4 mr-2" />
              Search Hotels
            </Button>
          </div>
        </div>
      )}

      {/* Flights Search Form */}
      {activeTab === "flights" && (
        <div className="search-form bg-white rounded-b rounded-tr shadow-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="from" className="block text-sm font-medium text-gray-700 mb-2">
                From
              </Label>
              <Input
                id="from"
                type="text"
                className="text-gray-900 bg-white border-gray-300 focus:text-gray-900"
                placeholder="Mumbai, Delhi, Bangalore..."
                value={searchData.from}
                onChange={(e) => handleInputChange("from", e.target.value)}
                data-testid="input-from"
              />
            </div>
            <div>
              <Label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-2">
                To
              </Label>
              <Input
                id="to"
                type="text"
                className="text-gray-900 bg-white border-gray-300 focus:text-gray-900"
                placeholder="Mumbai, Delhi, Bangalore..."
                value={searchData.to}
                onChange={(e) => handleInputChange("to", e.target.value)}
                data-testid="input-to"
              />
            </div>
            <div>
              <Label htmlFor="departure" className="block text-sm font-medium text-gray-700 mb-2">
                Departure
              </Label>
              <Popover open={departureOpen} onOpenChange={setDepartureOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal text-gray-900 bg-white border-gray-300 focus:text-gray-900",
                      !searchData.departure && "text-muted-foreground"
                    )}
                    data-testid="input-departure"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {searchData.departure ? format(searchData.departure, "PPP") : "Select departure date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={searchData.departure}
                    onSelect={(date) => {
                      handleDateChange("departure", date);
                      setDepartureOpen(false);
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="return" className="block text-sm font-medium text-gray-700 mb-2">
                Return
              </Label>
              <Popover open={returnOpen} onOpenChange={setReturnOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal text-gray-900 bg-white border-gray-300 focus:text-gray-900",
                      !searchData.return && "text-muted-foreground"
                    )}
                    data-testid="input-return"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {searchData.return ? format(searchData.return, "PPP") : "Select return date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={searchData.return}
                    onSelect={(date) => {
                      handleDateChange("return", date);
                      setReturnOpen(false);
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Passengers</Label>
              <Select value={searchData.passengers} onValueChange={(value) => handleInputChange("passengers", value)}>
                <SelectTrigger data-testid="select-passengers">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Adult</SelectItem>
                  <SelectItem value="2">2 Adults</SelectItem>
                  <SelectItem value="3">1 Adult, 1 Child</SelectItem>
                  <SelectItem value="4">2 Adults, 1 Child</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-6">
            <Button 
              className="w-full bg-secondary-600 hover:bg-secondary-700 text-white font-bold py-3 px-6"
              onClick={handleSearch}
              data-testid="button-search-flights"
            >
              <Search className="w-4 h-4 mr-2" />
              Search Flights
            </Button>
          </div>
        </div>
      )}

      {/* Conference Rooms Search Form */}
      {activeTab === "conference_room" && (
        <div className="search-form bg-white rounded-b rounded-tr shadow-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <Label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <Input
                  id="location"
                  placeholder="City, area, venue name"
                  className="pl-10"
                  value={searchData.destination}
                  onChange={(e) => handleInputChange("destination", e.target.value)}
                  data-testid="input-location"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Event Date
              </Label>
              <Popover open={eventDateOpen} onOpenChange={setEventDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal text-gray-900 bg-white border-gray-300 focus:text-gray-900",
                      !searchData.checkIn && "text-muted-foreground"
                    )}
                    data-testid="input-event-date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {searchData.checkIn ? format(searchData.checkIn, "PPP") : "Select event date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={searchData.checkIn}
                    onSelect={(date) => {
                      handleDateChange("checkIn", date);
                      setEventDateOpen(false);
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Capacity</Label>
              <Select value={searchData.guests} onValueChange={(value) => handleInputChange("guests", value)}>
                <SelectTrigger data-testid="select-capacity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Up to 10 people</SelectItem>
                  <SelectItem value="25">Up to 25 people</SelectItem>
                  <SelectItem value="50">Up to 50 people</SelectItem>
                  <SelectItem value="100">Up to 100 people</SelectItem>
                  <SelectItem value="200">Up to 200 people</SelectItem>
                  <SelectItem value="500">500+ people</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Duration</Label>
              <Select value={searchData.passengers} onValueChange={(value) => handleInputChange("passengers", value)}>
                <SelectTrigger data-testid="select-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Hours</SelectItem>
                  <SelectItem value="4">4 Hours</SelectItem>
                  <SelectItem value="6">6 Hours</SelectItem>
                  <SelectItem value="8">Full Day (8+ hours)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-6">
            <Button 
              className="w-full bg-secondary-600 hover:bg-secondary-700 text-white font-bold py-3 px-6"
              onClick={handleSearch}
              data-testid="button-search-halls"
            >
              <Search className="w-4 h-4 mr-2" />
              Search Conference Halls
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
