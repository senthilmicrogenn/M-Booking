import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, Building, Download, Filter, FileText, CalendarCheck } from "lucide-react";
import { Link } from "wouter";

export function ReportsAnalytics() {
  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/stats/dashboard"],
    queryFn: async () => {
      const response = await fetch("/api/stats/dashboard");
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  // Sample data for charts - in real app, this would come from your API
  const monthlyRevenue = [
    { month: "Jan", revenue: 125000, bookings: 45 },
    { month: "Feb", revenue: 132000, bookings: 52 },
    { month: "Mar", revenue: 148000, bookings: 63 },
    { month: "Apr", revenue: 156000, bookings: 58 },
    { month: "May", revenue: 142000, bookings: 67 },
    { month: "Jun", revenue: 168000, bookings: 72 },
  ];

  const serviceBreakdown = [
    { name: "Hotel Bookings", value: 65, color: "#10B981" },
    { name: "Conference Rooms", value: 20, color: "#3B82F6" },
    { name: "Transportation", value: 15, color: "#F59E0B" },
  ];

  const topProperties = [
    { name: "RoomNest Grand Mumbai", bookings: 156, revenue: 7800000 },
    { name: "RoomNest Executive Delhi", bookings: 142, revenue: 4540000 },
    { name: "RoomNest Resort Goa", bookings: 98, revenue: 3920000 },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Reports Menu */}
      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/reports/room-availability">
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-200 hover:border-gray-400">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <Building className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">Room Availability Report</h3>
                      <p className="text-sm text-gray-600">View room availability across properties and dates. Export to Excel, CSV, PDF, or Word.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/reports/booking-details">
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-200 hover:border-gray-400">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <CalendarCheck className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">Booking Details Report</h3>
                      <p className="text-sm text-gray-600">View detailed booking information with filters. Export to multiple formats.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h2>
          <p className="text-primary-600">Comprehensive business insights and performance metrics</p>
        </div>
        
        <div className="flex gap-2">
          <Select defaultValue="last-30-days">
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-7-days">Last 7 Days</SelectItem>
              <SelectItem value="last-30-days">Last 30 Days</SelectItem>
              <SelectItem value="last-3-months">Last 3 Months</SelectItem>
              <SelectItem value="last-year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-800">{dashboardStats?.revenue ? `₹${(dashboardStats.revenue / 100000).toFixed(1)}L` : '₹0'}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600">+12.5% from last month</span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-800">{dashboardStats?.totalBookings || 0}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600">+8.2% from last month</span>
                </div>
              </div>
              <Calendar className="w-8 h-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Properties</p>
                <p className="text-2xl font-bold text-gray-800">{dashboardStats?.properties || 0}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600">+2 new this month</span>
                </div>
              </div>
              <Building className="w-8 h-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Customer Satisfaction</p>
                <p className="text-2xl font-bold text-gray-800">4.8/5</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600">+0.2 from last month</span>
                </div>
              </div>
              <Users className="w-8 h-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-800">Revenue Trend (6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(value) => [formatCurrency(value as number), "Revenue"]} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Service Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-800">Service Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={serviceBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {serviceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, "Share"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {serviceBreakdown.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm">{entry.name} ({entry.value}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Booking Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-800">Monthly Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="bookings" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Properties */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-800">Top Performing Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProperties.map((property, index) => (
                <div key={property.name} className="flex items-center justify-between p-4 border rounded">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{property.name}</p>
                      <p className="text-sm text-gray-600">{property.bookings} bookings</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{formatCurrency(property.revenue)}</p>
                    <Badge variant="secondary" className="text-xs">
                      Revenue
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-800">Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded">
              <p className="text-2xl font-bold text-green-600">₹18.2L</p>
              <p className="text-sm text-gray-600">Total Income (YTD)</p>
            </div>
            <div className="text-center p-4 border rounded">
              <p className="text-2xl font-bold text-red-600">₹5.8L</p>
              <p className="text-sm text-gray-600">Total Expenses (YTD)</p>
            </div>
            <div className="text-center p-4 border rounded">
              <p className="text-2xl font-bold text-primary-600">₹12.4L</p>
              <p className="text-sm text-gray-600">Net Profit (YTD)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}