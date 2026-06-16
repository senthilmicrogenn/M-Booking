import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plane, Train, Bus, Car, Building2, Users } from "lucide-react";
import { HotelSearchBooking } from "@/components/hotel-search-booking";

export default function BookingPortal() {
  const [activeService, setActiveService] = useState<string>("hotels");

  const services = [
    {
      id: 'hotels',
      title: 'Hotels',
      icon: Building2,
      description: 'Book comfortable stays worldwide',
      color: 'bg-[#0057B8]',
      available: true
    },
    {
      id: 'flights',
      title: 'Flights',
      icon: Plane,
      description: 'Find best flight deals',
      color: 'bg-gray-400',
      available: false
    },
    {
      id: 'trains',
      title: 'Trains',
      icon: Train,
      description: 'Railway bookings made easy',
      color: 'bg-gray-400',
      available: false
    },
    {
      id: 'buses',
      title: 'Buses',
      icon: Bus,
      description: 'Intercity bus travel',
      color: 'bg-gray-400',
      available: false
    },
    {
      id: 'taxis',
      title: 'Taxis',
      icon: Car,
      description: 'Local and outstation cabs',
      color: 'bg-gray-400',
      available: false
    },
    {
      id: 'boardmeet',
      title: 'BoardMeet',
      icon: Users,
      description: 'Conference halls & meeting rooms',
      color: 'bg-gray-400',
      available: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4" data-testid="text-portal-title">
            RoomNest Booking Portal
          </h1>
          <p className="text-xl text-primary-600 max-w-2xl mx-auto">
            Your one-stop destination for all travel and accommodation needs
          </p>
        </div>

        {/* Service Tabs */}
        <Tabs value={activeService} onValueChange={setActiveService} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-gray-100">
            {services.map((service) => {
              const IconComponent = service.icon;
              return (
                <TabsTrigger 
                  key={service.id} 
                  value={service.id}
                  disabled={!service.available}
                  className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-[#006699] data-[state=active]:text-white"
                  data-testid={`tab-${service.id}`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="text-xs">{service.title}</span>
                  {!service.available && (
                    <Badge variant="secondary" className="text-xs">Soon</Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Hotel Booking Content */}
          <TabsContent value="hotels" className="mt-8">
            <HotelSearchBooking />
          </TabsContent>

          {/* Coming Soon Content for Other Services */}
          {services.filter(s => !s.available).map((service) => {
            const IconComponent = service.icon;
            return (
              <TabsContent key={service.id} value={service.id} className="mt-8">
                <Card className="text-center py-16">
                  <CardContent>
                    <div className={`w-24 h-24 ${service.color} rounded flex items-center justify-center mx-auto mb-6`}>
                      <IconComponent className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">{service.title} Coming Soon</h2>
                    <p className="text-primary-600 mb-6">{service.description}</p>
                    <Badge variant="secondary" className="text-sm px-4 py-2">
                      Under Development
                    </Badge>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-gray-800">Best Price Guarantee</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-primary-600">We offer competitive rates and price matching for all bookings</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-gray-800">24/7 Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-primary-600">Round-the-clock customer support for all your travel needs</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-gray-800">Secure Booking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-primary-600">Safe and secure payment processing with data protection</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}