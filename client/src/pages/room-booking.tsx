import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Bed, 
  Users, 
  Calendar,
  CreditCard,
  Clock,
  Phone,
  Mail,
  User,
  Shield,
  CheckCircle2,
  Info,
  Tag,
  Percent
} from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBookingSchema, type LoyaltyProgram } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Property {
  id: number;
  name: string;
  type: string;
  area: string;
  city: string;
  state: string;
  country: string;
  description?: string;
  amenities?: string;
  rating?: number;
  reviewCount?: number;
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

interface BookingFormData {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phone: string;
  state: string;
  saveBillingDetails: boolean;
  specialRequests?: string;
}

interface CouponDetails {
  code: string;
  discount: number;
  type: 'percentage' | 'flat';
  description: string;
}

const bookingFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  countryCode: z.string().default("+91"),
  phone: z.string().min(10, "Valid phone number is required"),
  state: z.string().min(1, "State is required for GST"),
  saveBillingDetails: z.boolean().default(false),
  specialRequests: z.string().optional(),
});

export default function RoomBooking() {
  const [match, params] = useRoute("/room-booking/:propertyId/:roomTypeId?");
  const [, navigate] = useLocation();
  const propertyId = params?.propertyId ? parseInt(params.propertyId) : null;
  
  // Get booking parameters from URL query string with validation
  const urlParams = new URLSearchParams(window.location.search);
  
  // Handle multiple room types from URL params
  let roomTypeId = params?.roomTypeId ? parseInt(params.roomTypeId) : null;
  let selectedRoomsData: Array<{roomTypeId: number, quantity: number}> = [];
  
  // Parse rooms parameter for multiple room types (format: "21:1,22:2")
  const roomsParam = urlParams.get('rooms');
  if (roomsParam) {
    selectedRoomsData = roomsParam.split(',').map(room => {
      const [id, qty] = room.split(':');
      return { roomTypeId: parseInt(id), quantity: parseInt(qty) };
    }).filter(room => !isNaN(room.roomTypeId) && !isNaN(room.quantity));
    
    // Use first room for primary room type if no path param
    if (!roomTypeId && selectedRoomsData.length > 0) {
      roomTypeId = selectedRoomsData[0].roomTypeId;
    }
  }
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const urlCheckIn = urlParams.get('checkIn') || new Date().toISOString().split('T')[0];
  const urlCheckOut = urlParams.get('checkOut') || new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const urlQuantity = Math.max(1, parseInt(urlParams.get('quantity') || '1') || 1);
  const urlGuests = Math.max(1, parseInt(urlParams.get('guests') || '2') || 2);
  
  // Read coupon data from URL parameters (passed from hotel details)
  const urlCouponCode = urlParams.get('couponCode');
  const urlCouponType = urlParams.get('couponType') as 'percentage' | 'flat' | null;
  const urlCouponDiscount = urlParams.get('couponDiscount') ? parseFloat(urlParams.get('couponDiscount')!) : 0;
  const urlTotalDiscount = urlParams.get('totalDiscount') ? parseFloat(urlParams.get('totalDiscount')!) : 0;

  // Get currency symbol (using existing geolocation logic)
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  
  // Coupon state - allow both URL params and direct application
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponDetails | null>(
    urlCouponCode ? {
      code: urlCouponCode,
      discount: urlCouponDiscount,
      type: urlCouponType || 'percentage',
      description: `${urlCouponType === 'flat' ? '₹' + urlCouponDiscount : urlCouponDiscount + '%'} off applied from hotel selection`
    } as CouponDetails : null
  );
  const [couponError, setCouponError] = useState("");

  // Loyalty program state
  const [loyaltyProgram, setLoyaltyProgram] = useState<LoyaltyProgram | null>(null);
  const [useRefreshmentStay, setUseRefreshmentStay] = useState(false);
  
  // GST state
  const [gstCalculation, setGstCalculation] = useState<{
    cgst: { percentage: number; amount: number };
    sgst: { percentage: number; amount: number };
    total: { percentage: number; amount: number };
    totalWithGst: number;
  } | null>(null);
  
  // Booking details state
  const [bookingDetails, setBookingDetails] = useState({
    checkIn: urlCheckIn,
    checkOut: urlCheckOut,
    nights: 0,
    totalPrice: 0,
    guests: Math.max(1, urlGuests || 1),
    rooms: Math.max(1, selectedRoomsData.length > 0 
      ? selectedRoomsData.reduce((sum, room) => sum + (room.quantity || 0), 0)
      : urlQuantity)
  });
  
  // Additional guests state
  const [additionalGuests, setAdditionalGuests] = useState<Array<{ title: string; firstName: string; lastName: string }>>([]);
  
  // Add guest handler
  const handleAddGuest = () => {
    // Check if we've reached the maximum number of guests (main guest + additional guests)
    const totalGuests = 1 + additionalGuests.length;
    if (totalGuests >= bookingDetails.guests) {
      toast({
        title: "Maximum guests reached",
        description: `You can only add ${bookingDetails.guests} guest${bookingDetails.guests > 1 ? 's' : ''} for this booking`,
        variant: "destructive"
      });
      return;
    }
    
    setAdditionalGuests([...additionalGuests, { title: "Mr", firstName: "", lastName: "" }]);
  };
  
  // Remove guest handler
  const handleRemoveGuest = (index: number) => {
    setAdditionalGuests(additionalGuests.filter((_, i) => i !== index));
  };
  
  // Update guest handler
  const handleUpdateGuest = (index: number, field: 'title' | 'firstName' | 'lastName', value: string) => {
    const updated = [...additionalGuests];
    updated[index][field] = value;
    setAdditionalGuests(updated);
  };

  // GST calculation function with proper per-day rate calculation
  const calculateGST = async (totalAfterDiscount: number) => {
    try {
      // Calculate the correct per-day rate based on actual booking details
      const nights = Math.max(1, Math.ceil((new Date(bookingDetails.checkOut).getTime() - new Date(bookingDetails.checkIn).getTime()) / (1000 * 60 * 60 * 24)));
      const totalRoomsCount = selectedRoomsData.length > 0 ? 
        selectedRoomsData.reduce((sum, room) => sum + room.quantity, 0) : 
        bookingDetails.rooms;
      
      // Calculate per-day rate from the actual total after discount
      const perDayRate = totalAfterDiscount / (nights * totalRoomsCount);

      if (!perDayRate || perDayRate <= 0) {
        toast({
          title: "GST Calculation Error",
          description: "Unable to calculate per-day rate for GST",
          variant: "destructive",
        });
        setGstCalculation(null);
        return;
      }

      const response = await apiRequest("POST", "/api/calculate-gst", {
        perDayRate,
        totalAmount: totalAfterDiscount,
        days: nights
      });

      const gstData = await response.json();
      
      if (gstData && gstData.gst) {
        setGstCalculation(gstData.gst);
      } else {
        toast({
          title: "GST Calculation Failed",
          description: gstData?.message || "Unable to calculate GST for this booking",
          variant: "destructive",
        });
        setGstCalculation(null);
      }
    } catch (error) {
      console.error('GST calculation error:', error);
      toast({
        title: "GST Calculation Error",
        description: "A technical error occurred while calculating GST",
        variant: "destructive",
      });
      setGstCalculation(null);
    }
  };

  // Available coupons
  const availableCoupons: CouponDetails[] = [
    { code: "SAVE10", discount: 10, type: "percentage", description: "Get 10% off your booking" },
    { code: "FLAT500", discount: 500, type: "flat", description: "₹500 off on your booking" },
    { code: "WELCOME15", discount: 15, type: "percentage", description: "Welcome offer - 15% off" },
    { code: "FESTIVE20", discount: 20, type: "percentage", description: "Festive special - 20% off" }
  ];

  // Coupon validation functions
  const applyCoupon = () => {
    setCouponError("");
    const coupon = availableCoupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase());
    
    if (!coupon) {
      setCouponError("Invalid coupon code");
      return;
    }
    
    if (appliedCoupon && appliedCoupon.code === coupon.code) {
      setCouponError("Coupon already applied");
      return;
    }
    
    setAppliedCoupon(coupon);
    setCouponCode("");
    toast({
      title: "Coupon Applied! 🎉",
      description: coupon.description,
    });
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
    toast({
      title: "Coupon Removed",
      description: "Coupon discount has been removed from your booking",
    });
  };

  // Calculate the actual total price for multiple room types or current booking
  const calculateActualTotalPrice = (): number => {
    let actualTotal = 0;
    
    if (selectedRoomsData.length > 0) {
      // Calculate for multiple room types using correct price for each room type
      actualTotal = selectedRoomsData.reduce((total, room) => {
        let roomPrice = 2500; // Default fallback
        
        if (allRoomTypes && !allRoomTypesLoading) {
          const fetchedRoomType = allRoomTypes.find(rt => rt.id === room.roomTypeId);
          if (fetchedRoomType && fetchedRoomType.basePrice) {
            roomPrice = fetchedRoomType.basePrice;
          }
        } else if (roomType && room.roomTypeId === roomType.id && roomType.basePrice) {
          roomPrice = roomType.basePrice;
        }
        
        const validQuantity = Math.max(1, room.quantity || 1);
        const validNights = Math.max(1, bookingDetails.nights || 1);
        return total + (roomPrice * validQuantity * validNights);
      }, 0);
    } else if (roomType && roomType.basePrice) {
      // Single room type calculation
      const basePrice = roomType.basePrice;
      const validNights = Math.max(1, bookingDetails.nights || 1);
      const validRooms = Math.max(1, bookingDetails.rooms || 1);
      actualTotal = basePrice * validNights * validRooms;
    } else {
      // Use bookingDetails.totalPrice as fallback
      actualTotal = bookingDetails.totalPrice || 0;
    }
    
    return actualTotal;
  };

  // Calculate discount amount using actual calculated price
  const calculateDiscount = (totalPrice?: number): number => {
    // Use the provided totalPrice or fall back to the displayed room total
    const displayedRoomTotal = bookingDetails.totalPrice || 0;
    const actualTotalPrice = totalPrice && totalPrice > 0 ? totalPrice : displayedRoomTotal;
    
    if (actualTotalPrice <= 0) {
      return 0; // No discount if no valid total price
    }
    
    let discount = 0;
    
    // Add coupon discount (prioritize applied coupon over URL params)
    if (appliedCoupon) {
      if (appliedCoupon.type === 'percentage') {
        discount += Math.round(actualTotalPrice * (appliedCoupon.discount / 100));
      } else {
        discount += appliedCoupon.discount;
      }
    } else if (urlTotalDiscount > 0) {
      // Fallback to URL params if no coupon applied locally
      discount += urlTotalDiscount;
    }
    
    // Add loyalty program discount (free night for refreshment stays)
    if (useRefreshmentStay && loyaltyProgram && (loyaltyProgram.availableRefreshmentStays ?? 0) > 0) {
      // Give one free night equivalent discount
      const nightlyRate = actualTotalPrice / Math.max(1, bookingDetails.nights || 1);
      discount += Math.round(nightlyRate);
    }
    
    return discount;
  };

  // Calculate final price after discount
  const calculateFinalPrice = (totalPrice?: number): number => {
    const actualTotalPrice = totalPrice && totalPrice > 0 ? totalPrice : calculateActualTotalPrice();
    const discount = calculateDiscount(actualTotalPrice);
    return Math.max(0, actualTotalPrice - discount);
  };

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
  }, []);

  // Form setup
  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      title: "Mr",
      firstName: "",
      lastName: "",
      email: "",
      countryCode: "+91",
      phone: "",
      state: "",
      saveBillingDetails: false,
      specialRequests: "",
    }
  });

  // Fetch property details
  const { data: property, isLoading: propertyLoading, error: propertyError } = useQuery<Property>({
    queryKey: ["/api/properties", propertyId],
    queryFn: async () => {
      const response = await fetch(`/api/properties/${propertyId}`);
      if (!response.ok) throw new Error('Property not found');
      return response.json();
    },
    enabled: !!propertyId
  });

  // Fetch room type details
  const { data: roomType, isLoading: roomTypeLoading, error: roomTypeError } = useQuery<RoomType>({
    queryKey: ["/api/room-types", roomTypeId],
    queryFn: async () => {
      const response = await fetch(`/api/room-types/${roomTypeId}`);
      if (!response.ok) throw new Error('Room type not found');
      return response.json();
    },
    enabled: !!roomTypeId
  });

  // Fetch all room types for accurate pricing calculation
  const { data: allRoomTypes, isLoading: allRoomTypesLoading } = useQuery<RoomType[]>({
    queryKey: ["/api/room-types"],
    queryFn: async () => {
      const response = await fetch('/api/room-types');
      if (!response.ok) throw new Error('Failed to fetch room types');
      return response.json();
    }
  });

  // Fetch user's loyalty program data (for now using userId 1 as demo)
  const { data: userLoyaltyProgram } = useQuery<LoyaltyProgram>({
    queryKey: ["/api/loyalty-programs", 1],
    queryFn: async () => {
      const response = await fetch('/api/loyalty-programs/1');
      if (!response.ok) throw new Error('Failed to fetch loyalty program');
      return response.json();
    },
    enabled: !!propertyId
  });

  // Calculate booking details from multiple room types or URL parameters
  const totalRoomsSelected = selectedRoomsData.length > 0 
    ? selectedRoomsData.reduce((sum, room) => sum + (room.quantity || 0), 0)
    : urlQuantity;

  // Effect to update booking details when dependencies change  
  useEffect(() => {
    // Only update if we have valid data and avoid infinite loops
    if (allRoomTypesLoading) return;
    
    const newBookingDetails = {
      checkIn: urlCheckIn,
      checkOut: urlCheckOut,
      nights: 0,
      totalPrice: 0,
      guests: Math.max(1, urlGuests || 1),
      rooms: Math.max(1, totalRoomsSelected || 1)
    };

    if (newBookingDetails.checkIn && newBookingDetails.checkOut) {
      const checkInDate = new Date(newBookingDetails.checkIn);
      const checkOutDate = new Date(newBookingDetails.checkOut);
      
      // Validate dates - block invalid date ranges
      if (!isNaN(checkInDate.getTime()) && !isNaN(checkOutDate.getTime()) && checkOutDate > checkInDate) {
        newBookingDetails.nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Calculate total price for multiple room types or single room
        if (selectedRoomsData.length > 0) {
          // Calculate for multiple room types using correct price for each room type
          newBookingDetails.totalPrice = selectedRoomsData.reduce((total, room) => {
            // Get the correct price for each room type from fetched data
            let roomPrice = 2500; // Default fallback
            
            if (allRoomTypes && !allRoomTypesLoading) {
              // Find the room type in the fetched data
              const fetchedRoomType = allRoomTypes.find(rt => rt.id === room.roomTypeId);
              if (fetchedRoomType && fetchedRoomType.basePrice) {
                roomPrice = fetchedRoomType.basePrice;
              }
            } else if (roomType && room.roomTypeId === roomType.id && roomType.basePrice) {
              // Fallback to current room type price if it matches
              roomPrice = roomType.basePrice;
            }
            
            const validQuantity = Math.max(1, room.quantity || 1);
            const validNights = Math.max(1, newBookingDetails.nights || 1);
            return total + (roomPrice * validQuantity * validNights);
          }, 0);
        } else if (roomType && roomType.basePrice) {
          // Single room type calculation with proper validation
          const basePrice = roomType.basePrice;
          const validNights = Math.max(1, newBookingDetails.nights || 1);
          const validRooms = Math.max(1, newBookingDetails.rooms || 1);
          newBookingDetails.totalPrice = basePrice * validNights * validRooms;
        }
      }
    }

    // Only update if the data actually changed to prevent infinite loops
    const hasChanged = 
      bookingDetails.checkIn !== newBookingDetails.checkIn ||
      bookingDetails.checkOut !== newBookingDetails.checkOut ||
      bookingDetails.nights !== newBookingDetails.nights ||
      bookingDetails.totalPrice !== newBookingDetails.totalPrice ||
      bookingDetails.guests !== newBookingDetails.guests ||
      bookingDetails.rooms !== newBookingDetails.rooms;
      
    if (hasChanged) {
      setBookingDetails(newBookingDetails);
    }
  }, [urlCheckIn, urlCheckOut, urlQuantity, urlGuests, JSON.stringify(selectedRoomsData), allRoomTypesLoading, roomType?.id, roomType?.basePrice]);

  // Auto-calculate GST when total price or coupon changes (with debouncing)
  useEffect(() => {
    if (bookingDetails.totalPrice > 0 && bookingDetails.checkIn && bookingDetails.checkOut && !allRoomTypesLoading && allRoomTypes) {
      const totalAfterDiscount = calculateFinalPrice();
      
      // Debounce GST calculation to avoid excessive API calls
      const timeoutId = setTimeout(() => {
        calculateGST(totalAfterDiscount);
      }, 500); // 500ms delay
      
      return () => clearTimeout(timeoutId);
    } else {
      // Clear GST if no valid booking data or still loading room types
      setGstCalculation(null);
    }
  }, [bookingDetails.totalPrice, appliedCoupon, bookingDetails.checkIn, bookingDetails.checkOut, allRoomTypesLoading, allRoomTypes]);

  // Handle loyalty program data
  useEffect(() => {
    if (userLoyaltyProgram) {
      setLoyaltyProgram(userLoyaltyProgram);
    }
  }, [userLoyaltyProgram]);

  // Parse amenities
  const getAmenities = (amenitiesString?: string) => {
    if (!amenitiesString) return [];
    return amenitiesString.split(',').map(a => a.trim()).filter(Boolean);
  };

  const roomAmenities = getAmenities(roomType?.amenities);

  // Booking mutation
  const bookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      return await apiRequest("POST", "/api/bookings", bookingData);
    },
    onSuccess: async (response, variables) => {
      const booking = await response.json();
      
      // Create confirmation data with all necessary information using numeric values
      const confirmationData = {
        id: booking.id,
        propertyId: variables.propertyId,
        propertyName: property?.name || 'Unknown Property',
        guestName: variables.guestDetails?.name || `${variables.guestDetails?.name}`,
        guestEmail: variables.guestDetails?.email || 'N/A',
        guestPhone: variables.guestDetails?.phone || 'N/A',
        checkInDate: variables.checkInDate,
        checkOutDate: variables.checkOutDate,
        numberOfGuests: variables.guests,
        numberOfRooms: variables.numberOfRooms,
        totalPrice: variables._numericTotalPrice || 0, // Use numeric value directly
        nights: Math.max(1, Math.ceil((new Date(variables.checkOutDate).getTime() - new Date(variables.checkInDate).getTime()) / (1000 * 60 * 60 * 24))),
        selectedRooms: selectedRoomsData.length > 0 ? selectedRoomsData : [{ roomTypeId: roomTypeId!, quantity: bookingDetails.rooms }],
        appliedCoupon: appliedCoupon,
        gstAmount: variables._numericTaxAmount || 0, // Use numeric value directly
        finalTotal: variables._numericFinalPrice || variables._numericTotalPrice || 0, // Use numeric value directly
        specialRequests: variables.specialRequests
      };
      
      
      // Save confirmed booking data for confirmation page
      localStorage.setItem('confirmedBooking', JSON.stringify(confirmationData));
      
      toast({
        title: "Booking Confirmed! 🎉",
        description: `Your booking has been confirmed. Booking ID: ${booking.id}`,
      });
      
      // Navigate to confirmation page
      navigate("/payment-portal");
    },
    onError: (error) => {
      console.error("Booking failed:", error);
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BookingFormData) => {
    if (!property || !roomType) {
      toast({
        title: "Error",
        description: "Property or room information is missing",
        variant: "destructive",
      });
      return;
    }

    if (bookingDetails.nights <= 0) {
      toast({
        title: "Invalid Booking Dates",
        description: "Please select valid check-in and check-out dates. Check-out must be after check-in.",
        variant: "destructive",
      });
      return;
    }

    // Store booking data in localStorage and navigate to payment
    // Calculate total rooms from all selected room types
    const finalSelectedRooms = selectedRoomsData.length > 0 ? selectedRoomsData : [{ roomTypeId: roomTypeId!, quantity: bookingDetails.rooms }];
    const totalRoomsCount = finalSelectedRooms.reduce((sum, room) => sum + room.quantity, 0);
    
    // Calculate aggregated total price for all selected rooms using correct pricing
    const nights = Math.max(1, Math.ceil((new Date(bookingDetails.checkOut).getTime() - new Date(bookingDetails.checkIn).getTime()) / (1000 * 60 * 60 * 24)));
    const aggregatedTotalPrice = finalSelectedRooms.reduce((sum, room) => {
      // Get the correct price for each room type from fetched data
      let roomPrice = 2500; // Default fallback
      
      if (allRoomTypes && !allRoomTypesLoading) {
        // Find the room type in the fetched data
        const fetchedRoomType = allRoomTypes.find(rt => rt.id === room.roomTypeId);
        if (fetchedRoomType) {
          roomPrice = fetchedRoomType.basePrice;
        }
      } else if (roomType && room.roomTypeId === roomType.id) {
        // Fallback to current room type price if it matches
        roomPrice = roomType.basePrice;
      }
      
      return sum + (roomPrice * room.quantity * nights);
    }, 0);

    const finalPrice = calculateFinalPrice(aggregatedTotalPrice);
    const discountAmount = calculateDiscount(aggregatedTotalPrice);
    const taxAmount = gstCalculation?.total?.amount || 0;
    
    
    const bookingSubmissionData = {
      propertyId: propertyId!,
      roomTypeId: roomTypeId!,
      userId: 12, // Use existing guest user (John Smith)
      bookingType: "hotel", // Required field
      checkInDate: bookingDetails.checkIn, // Send as ISO string
      checkOutDate: bookingDetails.checkOut, // Send as ISO string  
      guests: bookingDetails.guests,
      numberOfRooms: totalRoomsCount,
      totalAmount: aggregatedTotalPrice.toString(), // Original total before discount
      discountAmount: discountAmount.toString(), // Convert to string
      taxAmount: taxAmount.toString(), // Convert to string
      finalAmount: finalPrice.toString(), // Final amount after discount
      status: "confirmed",
      paymentStatus: "paid",
      guestDetails: { // JSON object for guest info
        title: data.title,
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        phone: `${data.countryCode} ${data.phone}`,
        state: data.state,
        additionalGuests: additionalGuests.map(guest => ({
          title: guest.title,
          name: `${guest.firstName} ${guest.lastName}`
        }))
      },
      specialRequests: data.specialRequests || null,
      // Coupon information (prioritize applied coupon over URL params)
      couponCode: appliedCoupon?.code || urlCouponCode || null,
      couponType: appliedCoupon?.type || urlCouponType || null,
      couponDiscountAmount: discountAmount.toString(), // Use calculated discount amount
      // Store numeric values for confirmation page
      _numericTotalPrice: aggregatedTotalPrice,
      _numericFinalPrice: finalPrice,
      _numericDiscountAmount: discountAmount,
      _numericTaxAmount: taxAmount
    };

    // Submit the booking
    bookingMutation.mutate(bookingSubmissionData);
  };

  if (!propertyId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Booking Request</h1>
          <p className="text-gray-600">Please select a valid property.</p>
          <Link href="/booking-portal">
            <Button className="mt-4">Back to Hotels</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!roomTypeId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Room Type Selected</h1>
          <p className="text-gray-600">Please select a room type to continue with booking.</p>
          <Link href={`/hotel-details/${propertyId}`}>
            <Button className="mt-4">Back to Hotel Details</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Debug loading states
  if (propertyLoading || roomTypeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading Booking Details...</h1>
          <p className="text-gray-600">
            Property: {propertyLoading ? 'Loading...' : 'Loaded'} | 
            Room Type: {roomTypeLoading ? 'Loading...' : 'Loaded'}
          </p>
        </div>
      </div>
    );
  }

  if (propertyError || roomTypeError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-900 mb-2">Booking Error</h1>
          <p className="text-red-600">
            Property Error: {propertyError?.message || 'None'}<br/>
            Room Type Error: {roomTypeError?.message || 'None'}
          </p>
          <Link href="/booking-portal">
            <Button className="mt-4">Back to Hotels</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href={`/hotel-details/${propertyId}`}>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Hotel
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Complete Your Booking</h1>
                <p className="text-sm text-gray-600">{property?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Guest Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Guest Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Title and Name */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>TITLE</FormLabel>
                              <Select value={field.value || undefined} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-title">
                                    <SelectValue placeholder="Mr" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Mr">Mr</SelectItem>
                                  <SelectItem value="Mrs">Mrs</SelectItem>
                                  <SelectItem value="Ms">Ms</SelectItem>
                                  <SelectItem value="Dr">Dr</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="md:col-span-5">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>FULL NAME</FormLabel>
                              <FormControl>
                                <Input placeholder="First Name" {...field} data-testid="input-first-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="md:col-span-5">
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="invisible">Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Last Name" {...field} data-testid="input-last-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Email and Mobile */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              EMAIL ADDRESS 
                              <span className="text-gray-400 text-xs ml-1">(Booking voucher will be sent to this email ID)</span>
                            </FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Email ID" {...field} data-testid="input-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div>
                        <Label>MOBILE NUMBER</Label>
                        <div className="flex gap-2">
                          <FormField
                            control={form.control}
                            name="countryCode"
                            render={({ field }) => (
                              <FormItem className="w-24">
                                <Select value={field.value || undefined} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-country-code">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="+91">+91</SelectItem>
                                    <SelectItem value="+1">+1</SelectItem>
                                    <SelectItem value="+44">+44</SelectItem>
                                    <SelectItem value="+971">+971</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input placeholder="Contact Number" {...field} data-testid="input-phone" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Add Guest Button */}
                    <Button 
                      type="button" 
                      variant="link" 
                      onClick={handleAddGuest}
                      className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal"
                      data-testid="button-add-guest"
                    >
                      + Add Guest {additionalGuests.length > 0 && `(${1 + additionalGuests.length}/${bookingDetails.guests})`}
                    </Button>

                    {/* Additional Guests Forms */}
                    {additionalGuests.map((guest, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900">Guest {index + 2}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveGuest(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`button-remove-guest-${index}`}
                          >
                            Remove
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-2">
                            <Label>TITLE</Label>
                            <Select 
                              value={guest.title} 
                              onValueChange={(value) => handleUpdateGuest(index, 'title', value)}
                            >
                              <SelectTrigger data-testid={`select-guest-${index}-title`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Mr">Mr</SelectItem>
                                <SelectItem value="Mrs">Mrs</SelectItem>
                                <SelectItem value="Ms">Ms</SelectItem>
                                <SelectItem value="Dr">Dr</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="md:col-span-5">
                            <Label>FIRST NAME</Label>
                            <Input 
                              placeholder="First Name"
                              value={guest.firstName}
                              onChange={(e) => handleUpdateGuest(index, 'firstName', e.target.value)}
                              data-testid={`input-guest-${index}-first-name`}
                            />
                          </div>
                          
                          <div className="md:col-span-5">
                            <Label>LAST NAME</Label>
                            <Input 
                              placeholder="Last Name"
                              value={guest.lastName}
                              onChange={(e) => handleUpdateGuest(index, 'lastName', e.target.value)}
                              data-testid={`input-guest-${index}-last-name`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Login Section */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                      <p className="text-sm text-gray-700">
                        Login to prefill traveller details and get access to secret deals
                      </p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="bg-white border-blue-600 text-blue-600 hover:bg-blue-50"
                        data-testid="button-login"
                      >
                        LOGIN
                      </Button>
                    </div>

                    {/* State Selection for GST */}
                    <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Your State</h4>
                        <p className="text-sm text-gray-500">
                          (Required for GST purpose on your tax invoice. You can edit this anytime later in your profile section.)
                        </p>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select the State</FormLabel>
                            <Select value={field.value || undefined} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger data-testid="select-state">
                                  <SelectValue placeholder="Tamil Nadu" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                                <SelectItem value="Karnataka">Karnataka</SelectItem>
                                <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                                <SelectItem value="Delhi">Delhi</SelectItem>
                                <SelectItem value="Kerala">Kerala</SelectItem>
                                <SelectItem value="Gujarat">Gujarat</SelectItem>
                                <SelectItem value="Rajasthan">Rajasthan</SelectItem>
                                <SelectItem value="West Bengal">West Bengal</SelectItem>
                                <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                                <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
                                <SelectItem value="Telangana">Telangana</SelectItem>
                                <SelectItem value="Punjab">Punjab</SelectItem>
                                <SelectItem value="Haryana">Haryana</SelectItem>
                                <SelectItem value="Goa">Goa</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="saveBillingDetails"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="mt-1 h-4 w-4 rounded border-gray-300"
                                data-testid="checkbox-save-billing"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-normal text-gray-700">
                                Confirm and save billing details to your profile
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Booking Details - Read Only */}
                    <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Booking Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Check-in</Label>
                          <p className="text-base font-semibold text-gray-900" data-testid="display-check-in">
                            {new Date(bookingDetails.checkIn).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Check-out</Label>
                          <p className="text-base font-semibold text-gray-900" data-testid="display-check-out">
                            {new Date(bookingDetails.checkOut).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Guests</Label>
                          <p className="text-base font-semibold text-gray-900" data-testid="display-guests">
                            {bookingDetails.guests} guest{bookingDetails.guests !== 1 ? 's' : ''}
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rooms</Label>
                          <p className="text-base font-semibold text-gray-900" data-testid="display-rooms">
                            {bookingDetails.rooms} room{bookingDetails.rooms !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      
                      <div className={`mt-6 p-4 rounded-lg ${bookingDetails.nights > 0 ? 'bg-white border-2 border-gray-300' : 'bg-red-50 border-2 border-red-200'}`}>
                        {bookingDetails.nights > 0 ? (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-[#006699]">
                              Duration: {bookingDetails.nights} night{bookingDetails.nights !== 1 ? 's' : ''}
                            </span>
                            <span className="text-xl font-bold text-gray-800">
                              {currencySymbol}{bookingDetails.totalPrice.toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-700">
                            <Info className="w-4 h-4" />
                            <span className="text-sm">
                              Invalid date range - Please contact support if this continues
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Coupon Section */}
                    <div className="mt-6 p-6 bg-white rounded-lg border-2 border-gray-200 space-y-4">
                      <div className="flex items-center gap-2">
                        <Tag className="w-5 h-5 text-primary-600" />
                        <h4 className="font-semibold text-gray-900">Apply Coupon</h4>
                      </div>
                      
                      {!appliedCoupon ? (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter coupon code"
                              value={couponCode}
                              onChange={(e) => {
                                setCouponCode(e.target.value.toUpperCase());
                                setCouponError("");
                              }}
                              className="flex-1"
                              data-testid="input-coupon-code"
                            />
                            <Button
                              type="button"
                              onClick={applyCoupon}
                              disabled={!couponCode.trim()}
                              className="bg-[#006699] hover:bg-[#002a66]"
                              data-testid="button-apply-coupon"
                            >
                              Apply
                            </Button>
                          </div>
                          
                          {couponError && (
                            <p className="text-sm text-red-600" data-testid="text-coupon-error">{couponError}</p>
                          )}
                          
                          <div className="text-xs text-gray-600">
                            <p className="font-medium mb-1">Available coupons:</p>
                            <div className="space-y-1">
                              {availableCoupons.map((coupon) => (
                                <div key={coupon.code} className="flex justify-between">
                                  <span className="font-mono text-primary-600">{coupon.code}</span>
                                  <span>{coupon.description}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span className="font-medium text-green-800">{appliedCoupon.code} Applied</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={removeCoupon}
                              className="text-green-700 hover:text-green-900"
                              data-testid="button-remove-coupon"
                            >
                              Remove
                            </Button>
                          </div>
                          <p className="text-sm text-green-700 mt-1">{appliedCoupon.description}</p>
                          <p className="text-sm font-medium text-green-800 mt-2">
                            Discount: {currencySymbol}{calculateDiscount().toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Loyalty Program Section */}
                    {loyaltyProgram && (
                      <div className="mt-6 p-6 bg-white rounded-lg border-2 border-gray-200 space-y-4">
                        <div className="flex items-center gap-2">
                          <Star className="w-5 h-5 text-amber-600" />
                          <h4 className="font-semibold text-gray-900">Loyalty Benefits</h4>
                        </div>
                        
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">Completed Bookings:</span>
                              <Badge variant="outline" className="bg-amber-100 text-amber-800">
                                {loyaltyProgram.completedBookings || 0}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">Available Free Nights:</span>
                              <Badge variant="outline" className="bg-green-100 text-green-800">
                                {loyaltyProgram.availableRefreshmentStays || 0}
                              </Badge>
                            </div>
                            
                            {loyaltyProgram.isFirstTimeUser && (
                              <div className="flex items-center gap-2 text-blue-700">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-sm font-medium">First-time user - Welcome bonus eligible!</span>
                              </div>
                            )}
                            
                            {(loyaltyProgram.availableRefreshmentStays ?? 0) > 0 && (
                              <div className="border-t pt-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={useRefreshmentStay}
                                    onChange={(e) => setUseRefreshmentStay(e.target.checked)}
                                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                    data-testid="checkbox-use-refreshment-stay"
                                  />
                                  <span className="text-sm font-medium text-gray-900">
                                    Use one free night (saves {currencySymbol}{Math.round(bookingDetails.totalPrice / bookingDetails.nights).toLocaleString()})
                                  </span>
                                </label>
                                {useRefreshmentStay && (
                                  <p className="text-xs text-green-600 mt-1">
                                    🎉 One free night discount applied! Remaining free nights: {(loyaltyProgram.availableRefreshmentStays ?? 0) - 1}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="specialRequests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Special Requests (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Any special requests or preferences..."
                              className="min-h-[80px]"
                              {...field} 
                              data-testid="textarea-special-requests"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-[#006699] hover:bg-[#002a66] h-12 text-lg font-semibold"
                      disabled={bookingMutation.isPending}
                      data-testid="button-confirm-booking"
                    >
                      {bookingMutation.isPending ? "Processing..." : `Proceed to Payment - ${currencySymbol}${gstCalculation ? 
                        (calculateFinalPrice() + gstCalculation.total.amount).toFixed(2) : 
                        calculateFinalPrice().toLocaleString()
                      }`}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Booking Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Hotel Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900" data-testid="summary-hotel-name">
                    {property?.name}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{property?.area}, {property?.city}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-sm text-gray-600 ml-1">
                      ({property?.reviewCount || 156} reviews)
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Room Info */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900" data-testid="summary-room-name">
                    {roomType?.roomTypeName}
                  </h4>
                  {roomType?.description && (
                    <p className="text-sm text-gray-600">{roomType.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>Up to {roomType?.maxOccupancy} guests</span>
                    </div>
                    {roomType?.roomSize && (
                      <span>{roomType.roomSize}</span>
                    )}
                  </div>
                  
                  {roomAmenities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {roomAmenities.slice(0, 4).map((amenity, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Room Type Breakdown */}
                {selectedRoomsData.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-900 text-sm mb-3">Room Selection Details</h4>
                    <div className="space-y-3">
                      {selectedRoomsData.map((room, index) => {
                        const basePrice = roomType?.basePrice || 2500;
                        const roomTotal = basePrice * room.quantity * bookingDetails.nights;
                        const roomTypeName = room.roomTypeId === 21 ? 'Standard Single' : 
                                           room.roomTypeId === 22 ? 'Standard Double' :
                                           room.roomTypeId === 23 ? 'Deluxe Suite' :
                                           room.roomTypeId === 24 ? 'Executive Suite' : 'Room Type';
                        return (
                          <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900 text-sm mb-1">{roomTypeName}</div>
                                <div className="text-xs text-primary-600 space-y-0.5">
                                  <div>{room.quantity} room{room.quantity > 1 ? 's' : ''} × {bookingDetails.nights} night{bookingDetails.nights > 1 ? 's' : ''}</div>
                                  <div className="font-medium">{currencySymbol}{basePrice.toLocaleString()}/night per room</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-gray-900 text-base">{currencySymbol}{roomTotal.toLocaleString()}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm py-2">
                    <span className="text-gray-700">
                      Room Total ({bookingDetails.nights} night{bookingDetails.nights !== 1 ? 's' : ''} × {bookingDetails.rooms} room{bookingDetails.rooms !== 1 ? 's' : ''})
                    </span>
                    <span className="font-semibold text-gray-900">
                      {currencySymbol}{bookingDetails.totalPrice.toLocaleString()}
                    </span>
                  </div>
                  
                  {appliedCoupon && (
                    <div className="flex items-center justify-between text-sm py-2 bg-green-50 px-3 -mx-3 rounded">
                      <div className="flex items-center gap-2">
                        <Percent className="w-3 h-3 text-green-600" />
                        <span className="text-green-700 font-medium">Coupon ({appliedCoupon.code})</span>
                      </div>
                      <span className="font-semibold text-green-700">
                        -{currencySymbol}{calculateDiscount().toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  {/* GST Breakdown */}
                  {gstCalculation && (
                    <div className="space-y-2 pt-3 border-t-2 border-gray-200">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">GST Breakdown</div>
                      <div className="flex items-center justify-between text-sm py-1">
                        <span className="text-gray-600">CGST ({gstCalculation.cgst.percentage}%)</span>
                        <span className="font-medium text-gray-900">
                          {currencySymbol}{gstCalculation.cgst.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm py-1">
                        <span className="text-gray-600">SGST ({gstCalculation.sgst.percentage}%)</span>
                        <span className="font-medium text-gray-900">
                          {currencySymbol}{gstCalculation.sgst.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm border-t border-gray-200 pt-2 mt-1">
                        <span className="text-gray-700 font-semibold">Total GST ({gstCalculation.total.percentage}%)</span>
                        <span className="font-bold text-gray-900">
                          {currencySymbol}{gstCalculation.total.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <Separator className="my-3" />
                  
                  <div className="flex items-center justify-between text-lg font-bold text-gray-900 py-2 bg-gray-50 px-3 -mx-3 rounded-lg">
                    <span>Final Total</span>
                    <span data-testid="summary-total-price">
                      {currencySymbol}{gstCalculation ? 
                        (calculateFinalPrice() + gstCalculation.total.amount).toFixed(2) : 
                        calculateFinalPrice().toLocaleString()
                      }
                    </span>
                  </div>
                  
                  {appliedCoupon && (
                    <div className="text-sm text-green-600 text-right font-medium">
                      🎉 You saved {currencySymbol}{calculateDiscount().toLocaleString()}!
                    </div>
                  )}
                </div>

                {/* Policies */}
                <div className="bg-blue-50 p-3 rounded">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="text-xs text-blue-800">
                      <p className="font-medium mb-1">Booking Policies</p>
                      <ul className="space-y-1">
                        <li>• Free cancellation until 24 hours before check-in</li>
                        <li>• Check-in: 3:00 PM | Check-out: 11:00 AM</li>
                        <li>• Valid ID required at check-in</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}