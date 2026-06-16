import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Calendar, User, Phone, Mail, MapPin, Download, Share2, Home } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface BookingData {
  id?: number;
  propertyName: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  numberOfRooms: number;
  totalPrice: number;
  nights: number;
  selectedRooms?: Array<{roomTypeId: number, quantity: number}>;
  appliedCoupon?: any;
  gstAmount?: number;
  finalTotal?: number;
}

interface RoomTypeDetail {
  id: number;
  roomTypeName: string;
  basePrice?: number;
  quantity: number;
}

export default function BookingConfirmation() {
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [roomTypesDetails, setRoomTypesDetails] = useState<RoomTypeDetail[]>([]);
  const [isEmailSent, setIsEmailSent] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const { toast } = useToast();

  // Email sending mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (data: BookingData) => {
      return await apiRequest("POST", "/api/send-booking-confirmation", data);
    },
    onSuccess: () => {
      setIsEmailSent(true);
      toast({
        title: "Email Sent! 📧",
        description: "Booking confirmation has been sent to your email",
      });
    },
    onError: (error) => {
      console.error('Email sending error:', error);
      toast({
        title: "Email Error",
        description: "Confirmation saved but email failed to send",
        variant: "destructive",
      });
    }
  });

  // Load booking data from localStorage and fetch room type details
  useEffect(() => {
    const loadBookingData = async () => {
      try {
        const savedBooking = localStorage.getItem('confirmedBooking');
        if (!savedBooking) {
          // If no confirmed booking, redirect to home
          window.location.href = '/';
          return;
        }

        const parsed = JSON.parse(savedBooking);
        
        
        setBookingData(parsed);

        // Fetch room type details for all selected rooms first
        if (parsed.selectedRooms && parsed.selectedRooms.length > 0) {
          await fetchRoomTypeDetails(parsed.selectedRooms, parsed);
          
          // Wait a bit to ensure room types are loaded, then send email with room type info
          setTimeout(() => {
            // Calculate correct totals for email including discount logic
            let emailTotalPrice = parsed.totalPrice;
            let emailFinalTotal = parsed.finalTotal;
            
            if ((!emailTotalPrice || emailTotalPrice === 0) && roomTypesDetails.length > 0 && parsed.nights > 0) {
              emailTotalPrice = roomTypesDetails.reduce((sum, room) => 
                sum + ((room.basePrice || 0) * room.quantity * parsed.nights), 0
              );
            }
            
            // Calculate discount amount if coupon is applied
            let discountAmount = 0;
            if (parsed.appliedCoupon) {
              if (parsed.appliedCoupon.type === 'percentage') {
                discountAmount = emailTotalPrice * (parsed.appliedCoupon.discount / 100);
              } else {
                discountAmount = parsed.appliedCoupon.discount;
              }
            }
            
            // Calculate final total: Room Total - Discount + GST
            emailFinalTotal = emailTotalPrice - discountAmount + (parsed.gstAmount || 0);
            
            const emailData = {
              ...parsed,
              totalPrice: emailTotalPrice,
              finalTotal: emailFinalTotal,
              // Add the numeric values that the email API expects
              _numericTotalPrice: emailTotalPrice,
              _numericFinalPrice: emailFinalTotal,
              _numericDiscountAmount: discountAmount,
              _numericTaxAmount: parsed.gstAmount || 0,
              // Add coupon information for email
              couponCode: parsed.appliedCoupon?.code || null,
              couponType: parsed.appliedCoupon?.type || null,
              couponDiscountAmount: discountAmount,
              // Add room type information
              roomTypeId: parsed.selectedRooms && parsed.selectedRooms.length > 0 ? parsed.selectedRooms[0].roomTypeId : undefined,
              roomTypeName: roomTypesDetails.length > 0 ? roomTypesDetails[0].roomTypeName : undefined,
              roomTypePrice: roomTypesDetails.length > 0 ? roomTypesDetails[0].basePrice : undefined
            };
            sendEmailMutation.mutate(emailData);
          }, 500);
        } else {
          // No room types to fetch, calculate totals and send email immediately
          let emailTotalPrice = parsed.totalPrice;
          let emailFinalTotal = parsed.finalTotal;
          
          // Calculate discount amount if coupon is applied
          let discountAmount = 0;
          if (parsed.appliedCoupon) {
            if (parsed.appliedCoupon.type === 'percentage') {
              discountAmount = emailTotalPrice * (parsed.appliedCoupon.discount / 100);
            } else {
              discountAmount = parsed.appliedCoupon.discount;
            }
          }
          
          // Calculate final total: Room Total - Discount + GST  
          if (emailTotalPrice > 0) {
            emailFinalTotal = emailTotalPrice - discountAmount + (parsed.gstAmount || 0);
          }
          
          const emailData = {
            ...parsed,
            totalPrice: emailTotalPrice,
            finalTotal: emailFinalTotal,
            // Add the numeric values that the email API expects
            _numericTotalPrice: emailTotalPrice,
            _numericFinalPrice: emailFinalTotal,
            _numericDiscountAmount: discountAmount,
            _numericTaxAmount: parsed.gstAmount || 0,
            // Add coupon information for email
            couponCode: parsed.appliedCoupon?.code || null,
            couponType: parsed.appliedCoupon?.type || null,
            couponDiscountAmount: discountAmount,
            // Add room type information if available
            roomTypeId: parsed.selectedRooms && parsed.selectedRooms.length > 0 ? parsed.selectedRooms[0].roomTypeId : undefined
          };
          
          sendEmailMutation.mutate(emailData);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading booking data:', error);
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Failed to load booking details",
          variant: "destructive",
        });
      }
    };

    loadBookingData();
  }, []);

  const fetchRoomTypeDetails = async (selectedRooms: Array<{roomTypeId: number, quantity: number}>, bookingInfo: BookingData) => {
    try {
      const roomTypePromises = selectedRooms.map(async (room) => {
        const response = await fetch(`/api/room-types/${room.roomTypeId}`);
        if (response.ok) {
          const roomType = await response.json();
          // Use the actual room type base price from the API
          let roomPrice = roomType.basePrice || 2500; // Use API price or fallback to 2500
          
          // If room type doesn't have basePrice, calculate from booking total as fallback
          if (!roomType.basePrice && bookingInfo) {
            const totalRooms = selectedRooms.reduce((sum, r) => sum + r.quantity, 0);
            const totalNights = bookingInfo.nights || 1;
            if (totalRooms > 0 && totalNights > 0 && bookingInfo.totalPrice > 0) {
              roomPrice = Math.round(bookingInfo.totalPrice / (totalRooms * totalNights));
            }
          }
          
          return { 
            ...roomType, 
            quantity: room.quantity,
            basePrice: roomPrice
          };
        }
        return null;
      });
      
      const roomTypes = await Promise.all(roomTypePromises);
      const validRoomTypes = roomTypes.filter(rt => rt !== null) as RoomTypeDetail[];
      setRoomTypesDetails(validRoomTypes);
    } catch (error) {
      console.error('Error fetching room type details:', error);
    }
  };

  // Get currency symbol based on location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // India coordinates check
          if (latitude >= 8.4 && latitude <= 37.6 && longitude >= 68.7 && longitude <= 97.25) {
            setCurrencySymbol('₹');
          } else {
            setCurrencySymbol('$');
          }
        },
        () => setCurrencySymbol('₹') // Default to INR
      );
    }
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const downloadBookingDetails = () => {
    if (!bookingData) return;
    
    const content = `
BOOKING CONFIRMATION
===================

Booking ID: ${bookingData.id || 'Pending'}
Property: ${bookingData.propertyName}
Guest: ${bookingData.guestName}
Email: ${bookingData.guestEmail}
Phone: ${bookingData.guestPhone}

CHECK-IN: ${formatDate(bookingData.checkInDate)}
CHECK-OUT: ${formatDate(bookingData.checkOutDate)}
Duration: ${bookingData.nights} night${bookingData.nights !== 1 ? 's' : ''}
Guests: ${bookingData.numberOfGuests}
Rooms: ${bookingData.numberOfRooms}

Total Amount: ${currencySymbol}${bookingData.totalPrice.toLocaleString()}
${bookingData.gstAmount ? `GST Included: ${currencySymbol}${bookingData.gstAmount.toFixed(2)}` : ''}
${bookingData.finalTotal ? `Final Total: ${currencySymbol}${bookingData.finalTotal.toFixed(2)}` : ''}

Thank you for your booking!
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-confirmation-${bookingData.id || 'temp'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Processing your booking confirmation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <MapPin className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Booking Found</h2>
            <p className="text-gray-600 mb-4">We couldn't find your booking details.</p>
            <Link href="/">
              <Button>
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🎉 Booking Confirmed!</h1>
          <p className="text-gray-600">Your booking has been successfully confirmed and saved.</p>
          {isEmailSent && (
            <Badge variant="secondary" className="mt-2">
              <Mail className="h-3 w-3 mr-1" />
              Confirmation email sent
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{bookingData.propertyName}</h3>
                {bookingData.id && (
                  <p className="text-sm text-gray-600 mb-4">Booking ID: <span className="font-mono font-medium">#{bookingData.id}</span></p>
                )}
              </CardContent>
            </Card>

            {/* Guest Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Guest Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-3 text-gray-400" />
                  <span className="font-medium">{bookingData.guestName}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-3 text-gray-400" />
                  <span>{bookingData.guestEmail}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-3 text-gray-400" />
                  <span>{bookingData.guestPhone}</span>
                </div>
              </CardContent>
            </Card>

            {/* Stay Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  Stay Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Check-in</p>
                    <p className="font-semibold">{formatDate(bookingData.checkInDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Check-out</p>
                    <p className="font-semibold">{formatDate(bookingData.checkOutDate)}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-semibold">{bookingData.nights} night{bookingData.nights !== 1 ? 's' : ''}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Guests</p>
                    <p className="font-semibold">{bookingData.numberOfGuests}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Rooms</p>
                    <p className="font-semibold">{bookingData.numberOfRooms}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Room Details */}
            {roomTypesDetails.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Room Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {roomTypesDetails.map((room, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-semibold">{room.roomTypeName}</h4>
                          <p className="text-sm text-gray-600">Quantity: {room.quantity}</p>
                        </div>
                        <p className="font-semibold">{currencySymbol}{room.basePrice ? room.basePrice.toLocaleString() : '0'}/night</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Payment Summary Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Room Total</span>
                    <span>{currencySymbol}{(() => {
                      // Calculate room total from room types and nights if totalPrice is 0
                      if (bookingData.totalPrice && bookingData.totalPrice > 0) {
                        return bookingData.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      }
                      
                      // Fallback calculation using room type details
                      if (roomTypesDetails.length > 0 && bookingData.nights > 0) {
                        const calculatedTotal = roomTypesDetails.reduce((sum, room) => 
                          sum + ((room.basePrice || 0) * room.quantity * bookingData.nights), 0
                        );
                        return calculatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      }
                      
                      return '0';
                    })()}</span>
                  </div>
                  {bookingData.appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({bookingData.appliedCoupon.code})</span>
                      <span>-{currencySymbol}{(() => {
                        // Calculate discount properly based on coupon type
                        const roomTotal = bookingData.totalPrice || (roomTypesDetails.length > 0 && bookingData.nights > 0 ? 
                          roomTypesDetails.reduce((sum, room) => sum + ((room.basePrice || 0) * room.quantity * bookingData.nights), 0) : 0);
                        
                        if (bookingData.appliedCoupon.type === 'percentage') {
                          return (roomTotal * (bookingData.appliedCoupon.discount / 100)).toFixed(2);
                        } else {
                          return bookingData.appliedCoupon.discount.toFixed(2);
                        }
                      })()}</span>
                    </div>
                  )}
                  {bookingData.gstAmount && (
                    <div className="flex justify-between">
                      <span>GST</span>
                      <span>{currencySymbol}{bookingData.gstAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Paid</span>
                  <span>{currencySymbol}{(() => {
                    // Calculate total properly: Room Total - Discount + GST
                    const roomTotal = bookingData.totalPrice || (roomTypesDetails.length > 0 && bookingData.nights > 0 ? 
                      roomTypesDetails.reduce((sum, room) => sum + ((room.basePrice || 0) * room.quantity * bookingData.nights), 0) : 0);
                    
                    let discount = 0;
                    if (bookingData.appliedCoupon) {
                      if (bookingData.appliedCoupon.type === 'percentage') {
                        discount = roomTotal * (bookingData.appliedCoupon.discount / 100);
                      } else {
                        discount = bookingData.appliedCoupon.discount;
                      }
                    }
                    
                    const gstAmount = bookingData.gstAmount || 0;
                    const finalTotal = roomTotal - discount + gstAmount;
                    
                    return finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  })()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={downloadBookingDetails} 
                variant="outline" 
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Details
              </Button>
              
              <Button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Booking Confirmed',
                      text: `My booking at ${bookingData.propertyName} is confirmed!`,
                      url: window.location.href
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    toast({ title: "Link copied to clipboard!" });
                  }
                }}
                variant="outline" 
                className="w-full"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Booking
              </Button>

              <Link href="/">
                <Button className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Need help? Contact our support team at support@yourdomain.com
          </p>
        </div>
      </div>
    </div>
  );
}