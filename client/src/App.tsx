import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MobileNav } from "@/components/mobile-nav";
import { useIsMobile } from "@/hooks/use-mobile";
import { I18nProvider } from "@/contexts/i18n";
import RoomNestHome from "@/pages/roomnest-home";
import BookingPortal from "@/pages/booking-portal";
import HotelDetails from "@/pages/hotel-details";
import RoomBooking from "@/pages/room-booking";
import AdminPanel from "@/pages/admin-panel";
import GuestApp from "@/pages/guest-app";
import PhotoVideoGallery from "@/pages/PhotoVideoGallery";
import PropertyGallery from "@/pages/property-gallery";
import PaymentInfoPage from "@/pages/payment-info";
import PaymentPortal from "@/pages/payment-portal";
import RoomAvailabilityReport from "@/pages/room-availability-report";
import BookingDetailsReport from "@/pages/booking-details-report";
import Reports from "@/pages/reports";
import Login from "@/pages/login";
import Register from "@/pages/register";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={RoomNestHome} />
      <Route path="/booking" component={BookingPortal} />
      <Route path="/booking-portal" component={BookingPortal} />
      <Route path="/search" component={BookingPortal} />
      <Route path="/property/:id" component={BookingPortal} />
      <Route path="/hotel/:propertyId" component={HotelDetails} />
      <Route path="/hotel-details/:propertyId" component={HotelDetails} />
      <Route path="/room-booking/:propertyId/:roomTypeId?" component={RoomBooking} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/photo-gallery" component={PhotoVideoGallery} />
      <Route path="/property-gallery/:propertyId" component={PropertyGallery} />
      <Route path="/guest" component={GuestApp} />
      <Route path="/payment" component={PaymentInfoPage} />
      <Route path="/payment-info" component={PaymentInfoPage} />
      <Route path="/payment-portal" component={PaymentPortal} />
      <Route path="/reports" component={Reports} />
      <Route path="/reports/room-availability" component={RoomAvailabilityReport} />
      <Route path="/reports/booking-details" component={BookingDetailsReport} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const isMobile = useIsMobile();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <I18nProvider>
          <Toaster />
          <div className="min-h-screen bg-background">
            {isMobile && <MobileNav />}
            <div className={isMobile ? "pb-20" : ""}>
              <Router />
            </div>
          </div>
        </I18nProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
