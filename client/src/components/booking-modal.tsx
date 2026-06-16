import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Property } from "@shared/schema";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
  searchData: any;
}

export default function BookingModal({ isOpen, onClose, property, searchData }: BookingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [guestInfo, setGuestInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      // First create user
      const userResponse = await apiRequest("POST", "/api/users", {
        email: guestInfo.email,
        firstName: guestInfo.firstName,
        lastName: guestInfo.lastName,
        phone: guestInfo.phone,
      });
      const user = await userResponse.json();

      // Then create booking
      const bookingResponse = await apiRequest("POST", "/api/bookings", {
        userId: user.id,
        propertyId: property?.id,
        propertyType: property?.type || "hotel",
        checkIn: searchData.checkIn ? new Date(searchData.checkIn) : null,
        checkOut: searchData.checkOut ? new Date(searchData.checkOut) : null,
        guests: parseInt(searchData.guests || "1"),
        totalAmount: calculateTotal(),
        status: "confirmed",
        paymentStatus: "completed",
        guestInfo: guestInfo,
      });
      return bookingResponse.json();
    },
    onSuccess: (booking) => {
      toast({
        title: "Booking Confirmed!",
        description: `Your booking ${booking.bookingId} has been confirmed.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const calculateTotal = () => {
    if (!property?.pricePerNight || !searchData.checkIn || !searchData.checkOut) return "0";
    
    const checkIn = new Date(searchData.checkIn);
    const checkOut = new Date(searchData.checkOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    return (parseFloat(property.pricePerNight) * nights).toString();
  };

  const resetForm = () => {
    setGuestInfo({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    });
    setPaymentInfo({
      cardNumber: "",
      expiryDate: "",
      cvv: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!guestInfo.firstName || !guestInfo.lastName || !guestInfo.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required guest information.",
        variant: "destructive",
      });
      return;
    }

    if (!paymentInfo.cardNumber || !paymentInfo.expiryDate || !paymentInfo.cvv) {
      toast({
        title: "Missing Payment Information",
        description: "Please fill in all payment details.",
        variant: "destructive",
      });
      return;
    }

    createBookingMutation.mutate({});
  };

  if (!property) return null;

  const total = calculateTotal();
  const nights = searchData.checkIn && searchData.checkOut ? 
    Math.ceil((new Date(searchData.checkOut).getTime() - new Date(searchData.checkIn).getTime()) / (1000 * 60 * 60 * 24)) : 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto" data-testid="modal-booking">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Complete Your Booking</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Booking Summary */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-900 mb-2" data-testid="text-property-summary">
                {property.name}
              </h3>
              <p className="text-sm text-gray-600 mb-2">{property.description}</p>
              <div className="flex justify-between text-sm">
                <span data-testid="text-booking-dates">
                  {searchData.checkIn && searchData.checkOut
                    ? `${new Date(searchData.checkIn).toLocaleDateString()} - ${new Date(searchData.checkOut).toLocaleDateString()} (${nights} nights)`
                    : "Dates not selected"
                  }
                </span>
                <span className="font-medium" data-testid="text-total-amount">${total} total</span>
              </div>
            </CardContent>
          </Card>

          {/* Guest Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Guest Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={guestInfo.firstName}
                  onChange={(e) => setGuestInfo(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                  data-testid="input-first-name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={guestInfo.lastName}
                  onChange={(e) => setGuestInfo(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                  data-testid="input-last-name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={guestInfo.email}
                  onChange={(e) => setGuestInfo(prev => ({ ...prev, email: e.target.value }))}
                  required
                  data-testid="input-email"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={guestInfo.phone}
                  onChange={(e) => setGuestInfo(prev => ({ ...prev, phone: e.target.value }))}
                  data-testid="input-phone"
                />
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="cardNumber">Card Number *</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={paymentInfo.cardNumber}
                  onChange={(e) => setPaymentInfo(prev => ({ ...prev, cardNumber: e.target.value }))}
                  required
                  data-testid="input-card-number"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiryDate">Expiry Date *</Label>
                  <Input
                    id="expiryDate"
                    placeholder="MM/YY"
                    value={paymentInfo.expiryDate}
                    onChange={(e) => setPaymentInfo(prev => ({ ...prev, expiryDate: e.target.value }))}
                    required
                    data-testid="input-expiry"
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV *</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={paymentInfo.cvv}
                    onChange={(e) => setPaymentInfo(prev => ({ ...prev, cvv: e.target.value }))}
                    required
                    data-testid="input-cvv"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <Card className="bg-green-50 border border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <ShieldCheck className="text-green-600 mr-2 w-5 h-5" />
                <span className="text-sm text-green-800">
                  Your payment information is encrypted and secure
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-secondary-600 hover:bg-secondary-700 text-white font-bold py-3 px-6"
            disabled={createBookingMutation.isPending}
            data-testid="button-complete-booking"
          >
            <Lock className="w-4 h-4 mr-2" />
            {createBookingMutation.isPending ? "Processing..." : `Complete Booking - $${total}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
