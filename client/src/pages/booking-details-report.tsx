import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileSpreadsheet, FileText, FileDown, File, Info, Printer, CalendarIcon, Filter } from "lucide-react";
import { format as formatDate } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type BookingDetailsData = {
  bookingId: string;
  propertyId: number;
  propertyName: string;
  roomTypeId: number | null;
  roomTypeName: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfRooms: number;
  numberOfNights: number;
  totalAmount: string;
  status: string;
  paymentStatus: string;
  bookingDate: string;
};

type ReportResponse = {
  data: BookingDetailsData[];
  total: number;
  page: number;
  pageSize: number;
  grandTotals: {
    numberOfRooms: number;
    numberOfNights: number;
    totalAmount: number;
  };
};

export default function BookingDetailsReport() {
  const [propertyId, setPropertyId] = useState<string>("");
  const [roomTypeId, setRoomTypeId] = useState<string>("");
  const [guestName, setGuestName] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showReport, setShowReport] = useState(false);
  const [reportGeneratedTime, setReportGeneratedTime] = useState<Date | null>(null);
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);
  const pageSize = 50;
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [propertyId, roomTypeId, guestName, dateFrom, dateTo]);

  // Fetch all properties for dropdown
  const { data: properties } = useQuery({
    queryKey: ["/api/properties"],
  });

  // Fetch room types for selected property
  const { data: roomTypes } = useQuery({
    queryKey: [`/api/properties/${propertyId}/room-types`],
    enabled: !!propertyId && propertyId !== "all",
  });

  // Build query params
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (propertyId && propertyId !== "all") params.append("propertyId", propertyId);
    if (roomTypeId && roomTypeId !== "all") params.append("roomTypeId", roomTypeId);
    if (guestName) params.append("guestName", guestName);
    if (dateFrom) params.append("dateFrom", dateFrom);
    if (dateTo) params.append("dateTo", dateTo);
    params.append("page", currentPage.toString());
    params.append("pageSize", pageSize.toString());
    return params.toString();
  };

  // Fetch report data
  const { data: reportData, isLoading, error } = useQuery<ReportResponse>({
    queryKey: ["/api/reports/booking-details", propertyId, roomTypeId, guestName, dateFrom, dateTo, currentPage],
    enabled: showReport,
    queryFn: async () => {
      const queryParams = buildQueryParams();
      const response = await fetch(`/api/reports/booking-details?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch booking details report');
      }
      return response.json();
    }
  });

  // Handle Show button click
  const handleShowReport = () => {
    setShowReport(true);
    setReportGeneratedTime(new Date());
  };

  // Handle download
  const handleDownload = (format: 'excel' | 'csv' | 'pdf' | 'word') => {
    const params = new URLSearchParams();
    params.append("format", format);
    if (propertyId && propertyId !== "all") params.append("propertyId", propertyId);
    if (roomTypeId && roomTypeId !== "all") params.append("roomTypeId", roomTypeId);
    if (guestName) params.append("guestName", guestName);
    if (dateFrom) params.append("dateFrom", dateFrom);
    if (dateTo) params.append("dateTo", dateTo);

    window.location.href = `/api/reports/booking-details/export?${params.toString()}`;
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  const totalPages = reportData ? Math.ceil(reportData.total / pageSize) : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Booking Details Report</CardTitle>
          <CardDescription>
            View detailed booking information with guest data and export capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="property-filter">Property</Label>
              <Select
                value={propertyId}
                onValueChange={(value) => {
                  setPropertyId(value);
                  setRoomTypeId("");
                  setShowReport(false);
                }}
              >
                <SelectTrigger id="property-filter" data-testid="select-property">
                  <SelectValue placeholder="All Properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  {properties?.map((property: any) => (
                    <SelectItem key={property.id} value={property.id.toString()}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roomtype-filter">Room Type</Label>
              <Select
                value={roomTypeId}
                onValueChange={(value) => {
                  setRoomTypeId(value);
                  setShowReport(false);
                }}
                disabled={!propertyId || propertyId === "all"}
              >
                <SelectTrigger id="roomtype-filter" data-testid="select-roomtype">
                  <SelectValue placeholder="All Room Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Room Types</SelectItem>
                  {roomTypes?.map((roomType: any) => (
                    <SelectItem key={roomType.id} value={roomType.id.toString()}>
                      {roomType.roomTypeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-name">Guest Name</Label>
              <Input
                id="guest-name"
                type="text"
                placeholder="Enter guest name"
                value={guestName}
                onChange={(e) => {
                  setGuestName(e.target.value);
                  setShowReport(false);
                }}
                data-testid="input-guestname"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-from">Date From</Label>
              <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                    data-testid="button-datefrom"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? formatDate(new Date(dateFrom), "PPP") : "Select date from"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom ? new Date(dateFrom) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setDateFrom(formatDate(date, "yyyy-MM-dd"));
                        setShowReport(false);
                        setDateFromOpen(false);
                      }
                    }}
                    initialFocus
                    data-testid="calendar-datefrom"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-to">Date To</Label>
              <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                    data-testid="button-dateto"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? formatDate(new Date(dateTo), "PPP") : "Select date to"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo ? new Date(dateTo) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setDateTo(formatDate(date, "yyyy-MM-dd"));
                        setShowReport(false);
                        setDateToOpen(false);
                      }
                    }}
                    disabled={(date) => {
                      if (!dateFrom) return false;
                      return date < new Date(dateFrom);
                    }}
                    initialFocus
                    data-testid="calendar-dateto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Show Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleShowReport}
              size="lg"
              data-testid="button-show-report"
            >
              Show Report
            </Button>
          </div>

          {/* Report Display */}
          {showReport && (
            <>
              {isLoading ? (
                <div className="text-center py-12">Loading report...</div>
              ) : error ? (
                <div className="text-center py-12 text-destructive">
                  Error loading report. Please try again.
                </div>
              ) : !reportData || reportData.data.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No bookings found for the selected filters
                </div>
              ) : (
                <>
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 print:hidden">
                    <Button
                      onClick={handlePrint}
                      variant="outline"
                      size="sm"
                      data-testid="button-print"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Print
                    </Button>
                    <Button
                      onClick={() => handleDownload('excel')}
                      variant="outline"
                      size="sm"
                      data-testid="button-download-excel"
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Excel
                    </Button>
                    <Button
                      onClick={() => handleDownload('csv')}
                      variant="outline"
                      size="sm"
                      data-testid="button-download-csv"
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      CSV
                    </Button>
                    <Button
                      onClick={() => handleDownload('pdf')}
                      variant="outline"
                      size="sm"
                      data-testid="button-download-pdf"
                    >
                      <File className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                    <Button
                      onClick={() => handleDownload('word')}
                      variant="outline"
                      size="sm"
                      data-testid="button-download-word"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Word
                    </Button>
                  </div>

                  {/* Report Content */}
                  <div ref={printRef}>
                    {/* Report Header */}
                    <div className="border-b pb-4 mb-4">
                      <h1 className="text-2xl font-bold text-center">Booking Details Report</h1>
                      <div className="text-sm text-center text-muted-foreground mt-2 space-y-1">
                        <div>Report Date: {reportGeneratedTime ? formatDate(reportGeneratedTime, "MMMM dd, yyyy") : formatDate(new Date(), "MMMM dd, yyyy")}</div>
                        <div>Report Time: {reportGeneratedTime ? formatDate(reportGeneratedTime, "hh:mm:ss a") : formatDate(new Date(), "hh:mm:ss a")}</div>
                        <div>Generated by: {(user as any)?.name || (user as any)?.email || 'System User'}</div>
                        {(dateFrom || dateTo) && (
                          <div className="mt-2">
                            Period: {dateFrom ? formatDate(new Date(dateFrom), "MMM dd, yyyy") : 'N/A'} to {dateTo ? formatDate(new Date(dateTo), "MMM dd, yyyy") : 'N/A'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Report Table */}
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Booking ID</TableHead>
                            <TableHead>Property</TableHead>
                            <TableHead>Room Type</TableHead>
                            <TableHead>Guest Name</TableHead>
                            <TableHead>Check-in</TableHead>
                            <TableHead>Check-out</TableHead>
                            <TableHead className="text-right">Rooms</TableHead>
                            <TableHead className="text-right">Nights</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Payment</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.data.map((row, index) => (
                            <TableRow key={index} data-testid={`row-report-${index}`}>
                              <TableCell className="font-medium" data-testid={`text-bookingid-${index}`}>
                                {row.bookingId}
                              </TableCell>
                              <TableCell data-testid={`text-property-${index}`}>
                                {row.propertyName}
                              </TableCell>
                              <TableCell data-testid={`text-roomtype-${index}`}>
                                {row.roomTypeName}
                              </TableCell>
                              <TableCell data-testid={`text-guest-${index}`}>
                                {row.guestName}
                              </TableCell>
                              <TableCell data-testid={`text-checkin-${index}`}>
                                {row.checkInDate ? formatDate(new Date(row.checkInDate), "MMM dd, yyyy") : 'N/A'}
                              </TableCell>
                              <TableCell data-testid={`text-checkout-${index}`}>
                                {row.checkOutDate ? formatDate(new Date(row.checkOutDate), "MMM dd, yyyy") : 'N/A'}
                              </TableCell>
                              <TableCell className="text-right" data-testid={`text-rooms-${index}`}>
                                {row.numberOfRooms}
                              </TableCell>
                              <TableCell className="text-right" data-testid={`text-nights-${index}`}>
                                {row.numberOfNights}
                              </TableCell>
                              <TableCell className="text-right font-semibold" data-testid={`text-amount-${index}`}>
                                ₹{row.totalAmount}
                              </TableCell>
                              <TableCell data-testid={`text-status-${index}`}>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  row.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                  row.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  row.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {row.status}
                                </span>
                              </TableCell>
                              <TableCell data-testid={`text-payment-${index}`}>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  row.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                  row.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {row.paymentStatus}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Report Footer */}
                    <div className="border-t mt-4 pt-4 space-y-4">
                      {/* Page Totals */}
                      <div className="bg-muted/50 p-3 rounded">
                        <div className="font-semibold text-sm mb-2">Page Totals (Current Page)</div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Number of Rooms</div>
                            <div className="font-semibold">{reportData?.data.reduce((sum, row) => sum + row.numberOfRooms, 0) || 0}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Number of Nights</div>
                            <div className="font-semibold">{reportData?.data.reduce((sum, row) => sum + row.numberOfNights, 0) || 0}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Total Amount</div>
                            <div className="font-semibold">₹{reportData?.data.reduce((sum, row) => sum + parseFloat(row.totalAmount || '0'), 0).toFixed(2) || '0.00'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Grand Totals */}
                      <div className="bg-primary/10 p-3 rounded">
                        <div className="font-semibold text-sm mb-2">Grand Totals (All Pages)</div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Number of Rooms</div>
                            <div className="font-bold text-lg">{reportData?.grandTotals?.numberOfRooms || 0}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Number of Nights</div>
                            <div className="font-bold text-lg">{reportData?.grandTotals?.numberOfNights || 0}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Total Amount</div>
                            <div className="font-bold text-lg">₹{Number(reportData?.grandTotals?.totalAmount || 0).toFixed(2)}</div>
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground text-center">
                        <div>Total Records: {reportData?.total || 0}</div>
                        <div className="mt-2">
                          Generated on {reportGeneratedTime ? formatDate(reportGeneratedTime, "MMMM dd, yyyy 'at' hh:mm:ss a") : formatDate(new Date(), "MMMM dd, yyyy 'at' hh:mm:ss a")}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between print:hidden">
                      <div className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, reportData.total)} of {reportData.total} records
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setCurrentPage(currentPage - 1);
                          }}
                          disabled={currentPage === 1}
                          variant="outline"
                          size="sm"
                          data-testid="button-prev-page"
                        >
                          Previous
                        </Button>
                        <div className="flex items-center px-3 text-sm">
                          Page {currentPage} of {totalPages}
                        </div>
                        <Button
                          onClick={() => {
                            setCurrentPage(currentPage + 1);
                          }}
                          disabled={currentPage === totalPages}
                          variant="outline"
                          size="sm"
                          data-testid="button-next-page"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Help Tips - Bottom */}
          <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800 mt-6" data-testid="alert-help-tips">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-sm space-y-2">
              <div className="font-semibold text-blue-900 dark:text-blue-100">How to Use This Report</div>
              <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                <li><strong>Date Filtering:</strong> Shows bookings where stay period overlaps with selected date range (Check-out ≥ Date From AND Check-in ≤ Date To)</li>
                <li><strong>Property & Room Type:</strong> Filter by specific property and room type, or select "All" for comprehensive view</li>
                <li><strong>Guest Search:</strong> Enter guest name to find specific bookings (partial matches supported)</li>
                <li><strong>Show Button:</strong> Click "Show Report" after setting your filters to display the data</li>
                <li><strong>Status Indicators:</strong> Confirmed/Pending/Cancelled booking status and Paid/Pending payment status shown with color codes</li>
                <li><strong>Print:</strong> Use the Print button for a formatted printout with header and footer</li>
                <li><strong>Export:</strong> Download complete booking details in Excel, CSV, PDF, or Word format for record keeping</li>
                <li><strong>Pagination:</strong> Results shown 50 records per page for optimal performance</li>
              </ul>
              <div className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                <strong>Tip:</strong> Use date range filtering to capture bookings that check-in before and check-out after your reporting period - perfect for occupancy analysis.
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
