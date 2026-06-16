import { Link, useLocation } from "wouter";
import { Plane, Bell, User } from "lucide-react";
import { LanguageSelector } from "./LanguageSelector";
import { useI18n } from "@/contexts/i18n";

export default function Navbar() {
  const [location] = useLocation();
  const { t } = useI18n();

  const navItems = [
    { path: "/", label: t('nav.bookingPortal'), dataView: "booking" },
    { path: "/admin", label: t('nav.adminPanel'), dataView: "admin" },
    { path: "/guest", label: t('nav.myTrips'), dataView: "guest" },
  ];

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2" data-testid="logo-link">
              <Plane className="text-primary-600 text-2xl" />
              <span className="text-xl font-bold text-gray-900">TravelEase</span>
            </Link>
            <nav className="hidden md:flex space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`nav-btn transition-colors duration-200 ${
                    location === item.path
                      ? "text-primary-600 font-medium border-b-2 border-primary-600 pb-1"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  data-testid={`nav-${item.dataView}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSelector />
            <button className="text-gray-500 hover:text-gray-700" data-testid="button-notifications">
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
              <User className="text-white text-sm" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
