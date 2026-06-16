import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarPlus, Route, Headphones, PlaneIcon, Bed, Ticket, Building } from "lucide-react";
import type { Booking, ItineraryItem } from "@shared/schema";

export default function GuestApp() {
  const [selectedUserId] = useState("demo-user"); // In a real app, this would come from auth

  const { data: userBookings = [] } = useQuery<Booking[]>({
    queryKey: ["/api/users", selectedUserId, "bookings"],
    enabled: !!selectedUserId,
  });

  // Get the upcoming trip (most recent confirmed booking)
  const upcomingTrip = userBookings.find(booking => 
    booking.status === "confirmed" && 
    booking.checkIn && 
    new Date(booking.checkIn) > new Date()
  );

  const quickActions = [
    {
      title: "New Booking",
      description: "Book hotels, flights, and more",
      icon: CalendarPlus,
      color: "bg-blue-100 text-blue-600",
      buttonColor: "bg-primary-600 hover:bg-primary-700",
      testId: "book-now"
    },
    {
      title: "Trip Planner", 
      description: "Plan your perfect itinerary",
      icon: Route,
      color: "bg-green-100 text-green-600",
      buttonColor: "bg-green-600 hover:bg-green-700",
      testId: "plan-trip"
    },
    {
      title: "Support",
      description: "Get help with your bookings",
      icon: Headphones,
      color: "bg-purple-100 text-purple-600", 
      buttonColor: "bg-purple-600 hover:bg-purple-700",
      testId: "contact-support"
    }
  ];

  const getItineraryIcon = (type: string) => {
    switch (type) {
      case "flight":
        return PlaneIcon;
      case "hotel":
        return Bed;
      case "activity":
        return Ticket;
      default:
        return Building;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      confirmed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
      completed: "bg-gray-100 text-gray-800",
    };
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800";
  };

  // Sample itinerary data for the upcoming trip
  const sampleItinerary = upcomingTrip ? [
    {
      id: "1",
      type: "flight",
      title: "Flight to Paris",
      description: "AA1234 - JFK to CDG",
      startTime: upcomingTrip.checkIn,
      status: "confirmed"
    },
    {
      id: "2", 
      type: "hotel",
      title: upcomingTrip.propertyId || "Hotel Check-in",
      description: "Deluxe Room with City View",
      startTime: upcomingTrip.checkIn,
      endTime: upcomingTrip.checkOut,
      status: "confirmed"
    },
    {
      id: "3",
      type: "activity", 
      title: "Eiffel Tower Tour",
      description: "Skip-the-line tickets included",
      startTime: upcomingTrip.checkIn ? new Date(new Date(upcomingTrip.checkIn).getTime() + 24 * 60 * 60 * 1000) : null,
      status: "pending"
    },
    {
      id: "4",
      type: "flight",
      title: "Return Flight", 
      description: "AA1235 - CDG to JFK",
      startTime: upcomingTrip.checkOut,
      status: "confirmed"
    }
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Guest Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2" data-testid="text-guest-title">
          My Trips
        </h1>
        <p className="text-primary-600">Manage your bookings and travel itinerary</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Card key={index} className="text-center">
              <CardContent className="p-6">
                <div className={`w-12 h-12 ${action.color.split(' ')[0]} rounded flex items-center justify-center mx-auto mb-3`}>
                  <Icon className={`${action.color.split(' ')[1]} w-6 h-6`} />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">{action.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                <Button className={`w-full ${action.buttonColor} text-white`} data-testid={`button-${action.testId}`}>
                  {action.title === "New Booking" ? "Book Now" : 
                   action.title === "Trip Planner" ? "Plan Trip" : "Contact Us"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Current Trip */}
      {upcomingTrip && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle data-testid="text-upcoming-trip-title">
              Upcoming Trip - {upcomingTrip.propertyId || "Your Destination"}
            </CardTitle>
            <p className="text-sm text-gray-600" data-testid="text-upcoming-trip-dates">
              {upcomingTrip.checkIn && upcomingTrip.checkOut
                ? `${new Date(upcomingTrip.checkIn).toLocaleDateString()} - ${new Date(upcomingTrip.checkOut).toLocaleDateString()}`
                : "Dates TBD"
              }
            </p>
          </CardHeader>
          
          <CardContent>
            {/* Timeline */}
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              {sampleItinerary.map((item, index) => {
                const Icon = getItineraryIcon(item.type);
                return (
                  <div key={item.id} className="relative flex items-start mb-6" data-testid={`itinerary-item-${index}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      item.type === "flight" ? "bg-blue-100" :
                      item.type === "hotel" ? "bg-purple-100" :
                      item.type === "activity" ? "bg-orange-100" : "bg-gray-100"
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        item.type === "flight" ? "text-blue-600" :
                        item.type === "hotel" ? "text-purple-600" :
                        item.type === "activity" ? "text-orange-600" : "text-gray-600"
                      }`} />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900" data-testid={`text-itinerary-title-${index}`}>
                            {item.title}
                          </h4>
                          <p className="text-sm text-gray-600" data-testid={`text-itinerary-description-${index}`}>
                            {item.description}
                          </p>
                          <p className="text-sm text-gray-500" data-testid={`text-itinerary-time-${index}`}>
                            {item.startTime ? new Date(item.startTime).toLocaleDateString() : "Date TBD"}
                            {item.endTime && ` - ${new Date(item.endTime).toLocaleDateString()}`}
                          </p>
                        </div>
                        <Badge className={getStatusBadge(item.status)} data-testid={`badge-itinerary-status-${index}`}>
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        
        <CardContent>
          {userBookings.length === 0 ? (
            <div className="text-center py-8" data-testid="empty-bookings">
              <p className="text-gray-600">No bookings found. Start planning your next trip!</p>
              <Button className="mt-4 bg-primary-600 hover:bg-primary-700" data-testid="button-start-booking">
                Book Your First Trip
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {userBookings.slice(0, 5).map((booking, index) => (
                <div key={booking.id} className="py-6 flex justify-between items-center" data-testid={`booking-item-${index}`}>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                      <Building className="text-gray-600 w-6 h-6" />
                    </div>
                    <div className="ml-4">
                      <h4 className="font-medium text-gray-900" data-testid={`text-booking-property-${index}`}>
                        {booking.propertyId}
                      </h4>
                      <p className="text-sm text-gray-600" data-testid={`text-booking-dates-${index}`}>
                        {booking.checkIn && booking.checkOut
                          ? `${new Date(booking.checkIn).toLocaleDateString()} - ${new Date(booking.checkOut).toLocaleDateString()}`
                          : "Dates TBD"
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900" data-testid={`text-booking-amount-${index}`}>
                      ${booking.totalAmount}
                    </p>
                    <Badge className={getStatusBadge(booking.status)} data-testid={`badge-booking-status-${index}`}>
                      {booking.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
