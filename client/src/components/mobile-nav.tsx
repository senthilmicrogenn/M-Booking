import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, 
  Home, 
  Search, 
  Calendar, 
  User, 
  Settings, 
  Download, 
  X,
  Hotel,
  Plane,
  Train,
  Car,
  Camera
} from "lucide-react";
import { getPWAState } from "@/utils/pwa";

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const updatePWAState = () => {
      const state = getPWAState();
      setIsInstallable(state.isInstallable);
      setIsStandalone(state.isStandalone);
    };

    updatePWAState();

    // Listen for PWA install events
    const handleInstallable = (e: CustomEvent) => {
      setIsInstallable(e.detail.installable);
    };

    window.addEventListener('pwa-installable', handleInstallable as EventListener);
    
    return () => {
      window.removeEventListener('pwa-installable', handleInstallable as EventListener);
    };
  }, []);

  const handleInstallApp = async () => {
    const state = getPWAState();
    const installed = await state.install();
    if (installed) {
      setIsInstallable(false);
    }
  };

  const navigation = [
    {
      name: "Home",
      href: "/",
      icon: Home,
      current: location === "/"
    },
    {
      name: "Hotels",
      href: "/hotels",
      icon: Hotel,
      current: location.startsWith("/hotels")
    },
    {
      name: "Flights", 
      href: "/flights",
      icon: Plane,
      current: location.startsWith("/flights")
    },
    {
      name: "Trains",
      href: "/trains", 
      icon: Train,
      current: location.startsWith("/trains")
    },
    {
      name: "Cabs",
      href: "/cabs",
      icon: Car,
      current: location.startsWith("/cabs")
    },
    {
      name: "My Bookings",
      href: "/guest-app",
      icon: Calendar,
      current: location === "/guest-app"
    },
    {
      name: "Photo Gallery",
      href: "/photo-gallery",
      icon: Camera,
      current: location === "/photo-gallery"
    },
    {
      name: "Admin",
      href: "/admin",
      icon: Settings,
      current: location === "/admin"
    }
  ];

  return (
    <>
      {/* Mobile Navigation Header */}
      <div className={`lg:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 ${className}`}>
        <div className="flex items-center justify-between p-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PO</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              RoomNest
            </span>
          </Link>

          <div className="flex items-center space-x-2">
            {/* PWA Install Button */}
            {isInstallable && !isStandalone && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleInstallApp}
                className="hidden sm:flex"
                data-testid="install-app-button"
              >
                <Download className="w-4 h-4 mr-2" />
                Install App
              </Button>
            )}

            {/* Mobile Menu Trigger */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  data-testid="mobile-menu-button"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex items-center justify-between pb-4 border-b">
                  <Link href="/" className="flex items-center space-x-2" onClick={() => setIsOpen(false)}>
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">PO</span>
                    </div>
                    <span className="text-xl font-bold">RoomNest</span>
                  </Link>
                </div>

                {/* Navigation Menu */}
                <nav className="mt-6 space-y-1">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                      >
                        <div
                          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            item.current
                              ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
                          }`}
                          data-testid={`mobile-nav-${item.name.toLowerCase()}`}
                        >
                          <Icon className="w-5 h-5 mr-3" />
                          {item.name}
                          {item.current && (
                            <Badge variant="secondary" className="ml-auto">
                              Active
                            </Badge>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </nav>

                {/* PWA Install Section */}
                {isInstallable && !isStandalone && (
                  <div className="mt-6 pt-6 border-t">
                    <Button
                      onClick={handleInstallApp}
                      className="w-full"
                      data-testid="mobile-install-app-button"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Install Mobile App
                    </Button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Install for offline access and faster loading
                    </p>
                  </div>
                )}

                {/* Standalone Mode Indicator */}
                {isStandalone && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-center p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-green-700 dark:text-green-300">
                        Running as installed app
                      </span>
                    </div>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navigation.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
                    item.current
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                  data-testid={`bottom-nav-${item.name.toLowerCase()}`}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium truncate">
                    {item.name}
                  </span>
                  {item.current && (
                    <div className="w-1 h-1 bg-blue-600 rounded-full mt-1"></div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}