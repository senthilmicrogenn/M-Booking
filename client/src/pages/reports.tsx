import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, DollarSign, TrendingUp, Package, BarChart3, ClipboardList } from "lucide-react";
import { Link } from "wouter";

type ReportItem = {
  id: string;
  title: string;
  description: string;
  icon: any;
  route: string;
  category: string;
};

export default function Reports() {
  const reports: ReportItem[] = [
    {
      id: "room-availability",
      title: "Room Availability Report",
      description: "View room availability across properties with date range filters. Export to Excel, CSV, PDF, or Word.",
      icon: Calendar,
      route: "/reports/room-availability",
      category: "Inventory"
    },
    {
      id: "booking-details",
      title: "Booking Details Report",
      description: "Comprehensive booking details with guest information, payment status, and financial data. Filter by property, room type, guest name, and date range.",
      icon: ClipboardList,
      route: "/reports/booking-details",
      category: "Bookings"
    }
  ];

  const categories = Array.from(new Set(reports.map(r => r.category)));

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Reports & Analytics</h1>
        <p className="text-gray-600">
          Access detailed reports and analytics for your travel booking platform
        </p>
      </div>

      {categories.map(category => (
        <div key={category} className="mb-8">
          <h2 className="text-xl font-semibold text-[#006699] mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {category} Reports
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports
              .filter(report => report.category === category)
              .map(report => {
                const IconComponent = report.icon;
                return (
                  <Link key={report.id} href={report.route} data-testid={`link-report-${report.id}`}>
                    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-gray-400 h-full" data-testid={`card-report-${report.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-gray-100 rounded-lg">
                              <IconComponent className="h-6 w-6 text-primary-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{report.title}</CardTitle>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-sm">
                          {report.description}
                        </CardDescription>
                        <div className="mt-4 flex items-center text-sm text-primary-600 font-medium">
                          View Report →
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
          </div>
        </div>
      ))}

      {/* Placeholder for future reports */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-[#006699] mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Financial Reports
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-dashed bg-gray-50 opacity-60" data-testid="card-report-revenue-placeholder">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gray-200 rounded-lg">
                    <DollarSign className="h-6 w-6 text-gray-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-500">Revenue Report</CardTitle>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm text-gray-500">
                Coming soon: Comprehensive revenue analysis with breakdowns by property, room type, and time period.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-dashed bg-gray-50 opacity-60" data-testid="card-report-occupancy-placeholder">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gray-200 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-gray-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-500">Occupancy Report</CardTitle>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm text-gray-500">
                Coming soon: Detailed occupancy rates and trends across all properties.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-dashed bg-gray-50 opacity-60" data-testid="card-report-tax-placeholder">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gray-200 rounded-lg">
                    <Package className="h-6 w-6 text-gray-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-500">Tax Summary Report</CardTitle>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm text-gray-500">
                Coming soon: GST and tax calculations summary for accounting purposes.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-[#006699] mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Guest & Customer Reports
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-dashed bg-gray-50 opacity-60" data-testid="card-report-guestprofile-placeholder">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gray-200 rounded-lg">
                    <Users className="h-6 w-6 text-gray-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-500">Guest Profile Report</CardTitle>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm text-gray-500">
                Coming soon: Detailed guest profiles with booking history and preferences.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
