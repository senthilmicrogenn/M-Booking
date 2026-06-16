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
import { FileSpreadsheet, FileText, FileDown, File, Info, Printer, CalendarIcon, Filter, BarChart3 } from "lucide-react";
import { format as formatDate } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

type RoomAvailabilityData = {
  propertyId: number;
  propertyName: string;
  roomTypeId: number;
  roomTypeName: string;
  date: string;
  totalRooms: number;
  bookedRooms: number;
  blockedRooms: number;
  availableRooms: number;
};

type ReportResponse = {
  data: RoomAvailabilityData[];
  total: number;
  page: number;
  pageSize: number;
  grandTotals: {
    totalRooms: number;
    bookedRooms: number;
    blockedRooms: number;
    availableRooms: number;
  };
};

type PropertyGroup = {
  propertyName: string;
  data: RoomAvailabilityData[];
};

const groupByProperty = (data: RoomAvailabilityData[]): PropertyGroup[] => {
  const grouped = data.reduce((acc, row) => {
    if (!acc[row.propertyName]) {
      acc[row.propertyName] = [];
    }
    acc[row.propertyName].push(row);
    return acc;
  }, {} as Record<string, RoomAvailabilityData[]>);

  return Object.entries(grouped).map(([propertyName, data]) => ({
    propertyName,
    data
  }));
};

const RoomAvailabilityChart = ({ data }: { data: RoomAvailabilityData[] }) => {
  const chartData = data.reduce((acc, row) => {
    const date = formatDate(new Date(row.date), "MMM dd");
    const existingDate = acc.find(item => item.date === date);
    
    if (existingDate) {
      existingDate[`${row.roomTypeName} - Available`] = (existingDate[`${row.roomTypeName} - Available`] || 0) + row.availableRooms;
      existingDate[`${row.roomTypeName} - Booked`] = (existingDate[`${row.roomTypeName} - Booked`] || 0) + row.bookedRooms;
    } else {
      acc.push({
        date,
        [`${row.roomTypeName} - Available`]: row.availableRooms,
        [`${row.roomTypeName} - Booked`]: row.bookedRooms,
      });
    }
    
    return acc;
  }, [] as any[]);

  const allKeysSet = new Set<string>();
  chartData.forEach(entry => {
    Object.keys(entry).forEach(key => {
      if (key !== 'date') {
        allKeysSet.add(key);
      }
    });
  });
  const allKeys = Array.from(allKeysSet);
  
  return (
    <div className="mb-6 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg border-2 border-gray-300 dark:border-primary-600 print:hidden">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-[#006699] dark:text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Room Availability Trend</h3>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--sage-300))" />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--sage-700))"
            tick={{ fill: 'hsl(var(--sage-700))' }}
          />
          <YAxis 
            stroke="hsl(var(--sage-700))"
            tick={{ fill: 'hsl(var(--sage-700))' }}
            label={{ value: 'Rooms Count', angle: -90, position: 'insideLeft', fill: 'hsl(var(--sage-700))' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--sage-50))',
              border: '2px solid hsl(var(--sage-400))',
              borderRadius: '8px'
            }}
          />
          <Legend />
          {allKeys.filter(key => key.includes('Available')).map((key, idx) => (
            <Line 
              key={key}
              type="monotone" 
              dataKey={key} 
              stroke={`hsl(${140 + idx * 30}, 60%, 50%)`}
              strokeWidth={2}
              dot={{ fill: `hsl(${140 + idx * 30}, 60%, 50%)`, r: 4 }}
            />
          ))}
          {allKeys.filter(key => key.includes('Booked')).map((key, idx) => (
            <Line 
              key={key}
              type="monotone" 
              dataKey={key} 
              stroke={`hsl(${0 + idx * 30}, 70%, 50%)`}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: `hsl(${0 + idx * 30}, 70%, 50%)`, r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function RoomAvailabilityReport() {
  const [propertyId, setPropertyId] = useState<string>("");
  const [roomTypeId, setRoomTypeId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [showReport, setShowReport] = useState(false);
  const [reportGeneratedTime, setReportGeneratedTime] = useState<Date | null>(null);
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [propertyId, roomTypeId, dateFrom, dateTo, pageSize]);

  const { data: properties } = useQuery({
    queryKey: ["/api/properties"],
  });

  const { data: roomTypes } = useQuery({
    queryKey: [`/api/properties/${propertyId}/room-types`],
    enabled: !!propertyId && propertyId !== "all",
  });

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (propertyId && propertyId !== "all") params.append("propertyId", propertyId);
    if (roomTypeId && roomTypeId !== "all") params.append("roomTypeId", roomTypeId);
    if (dateFrom) params.append("dateFrom", dateFrom);
    if (dateTo) params.append("dateTo", dateTo);
    params.append("page", currentPage.toString());
    params.append("pageSize", pageSize.toString());
    return params.toString();
  };

  const { data: reportData, isLoading, error } = useQuery<ReportResponse>({
    queryKey: ["/api/reports/room-availability", propertyId, roomTypeId, dateFrom, dateTo, currentPage, pageSize],
    enabled: showReport && !!(dateFrom && dateTo),
    queryFn: async () => {
      const queryParams = buildQueryParams();
      const response = await fetch(`/api/reports/room-availability?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch room availability report');
      }
      return response.json();
    }
  });

  const handleShowReport = () => {
    if (dateFrom && dateTo) {
      setShowReport(true);
      setReportGeneratedTime(new Date());
    }
  };

  useEffect(() => {
    if (!dateFrom || !dateTo) {
      setShowReport(false);
    }
  }, [dateFrom, dateTo]);

  const handleDownload = (format: 'excel' | 'csv' | 'pdf' | 'word') => {
    const params = new URLSearchParams();
    params.append("format", format);
    if (propertyId && propertyId !== "all") params.append("propertyId", propertyId);
    if (roomTypeId && roomTypeId !== "all") params.append("roomTypeId", roomTypeId);
    if (dateFrom) params.append("dateFrom", dateFrom);
    if (dateTo) params.append("dateTo", dateTo);

    window.location.href = `/api/reports/room-availability/export?${params.toString()}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const totalPages = reportData ? Math.ceil(reportData.total / pageSize) : 0;
  const groupedData = reportData?.data ? groupByProperty(reportData.data) : [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className="border-gray-300 dark:border-[#002a66] shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
          <CardTitle className="text-gray-900 dark:text-gray-100">Room Availability Report</CardTitle>
          <CardDescription className="text-[#006699] dark:text-gray-300">
            View and export room availability data across properties and date ranges
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="property-filter" className="text-[#006699] dark:text-gray-300">Property</Label>
              <Select
                value={propertyId}
                onValueChange={(value) => {
                  setPropertyId(value);
                  setRoomTypeId("");
                  setShowReport(false);
                }}
              >
                <SelectTrigger id="property-filter" data-testid="select-property" className="border-gray-300 focus:ring-primary-500">
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
              <Label htmlFor="roomtype-filter" className="text-[#006699] dark:text-gray-300">Room Type</Label>
              <Select
                value={roomTypeId}
                onValueChange={(value) => {
                  setRoomTypeId(value);
                  setShowReport(false);
                }}
                disabled={!propertyId || propertyId === "all"}
              >
                <SelectTrigger id="roomtype-filter" data-testid="select-roomtype" className="border-gray-300 focus:ring-primary-500">
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
              <Label className="text-[#006699] dark:text-gray-300">Date From</Label>
              <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-gray-300 hover:bg-gray-50 dark:hover:bg-[#001529]",
                      !dateFrom && "text-muted-foreground"
                    )}
                    data-testid="button-date-from"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary-600" />
                    {dateFrom ? formatDate(new Date(dateFrom), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom ? new Date(dateFrom) : undefined}
                    onSelect={(date) => {
                      setDateFrom(date ? formatDate(date, "yyyy-MM-dd") : "");
                      setDateFromOpen(false);
                      setShowReport(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-[#006699] dark:text-gray-300">Date To</Label>
              <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-gray-300 hover:bg-gray-50 dark:hover:bg-[#001529]",
                      !dateTo && "text-muted-foreground"
                    )}
                    data-testid="button-date-to"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary-600" />
                    {dateTo ? formatDate(new Date(dateTo), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo ? new Date(dateTo) : undefined}
                    onSelect={(date) => {
                      setDateTo(date ? formatDate(date, "yyyy-MM-dd") : "");
                      setDateToOpen(false);
                      setShowReport(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="page-size-select" className="text-[#006699] dark:text-gray-300">Rows Per Page</Label>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(parseInt(value));
                  setShowReport(false);
                }}
              >
                <SelectTrigger id="page-size-select" data-testid="select-page-size" className="w-40 border-gray-300 focus:ring-primary-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 rows</SelectItem>
                  <SelectItem value="50">50 rows</SelectItem>
                  <SelectItem value="100">100 rows</SelectItem>
                  <SelectItem value="200">200 rows</SelectItem>
                  <SelectItem value="1000">All rows</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              onClick={handleShowReport}
              disabled={!dateFrom || !dateTo}
              className="bg-[#006699] hover:bg-[#002a66] text-white"
              data-testid="button-show-report"
            >
              <Filter className="w-4 h-4 mr-2" />
              Show Report
            </Button>
          </div>

          {showReport && (
            <>
              {error && (
                <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 p-3 rounded border border-red-200 dark:border-red-800">
                  Error loading report: {(error as Error).message}
                </div>
              )}

              {isLoading && (
                <div className="text-center py-8 text-primary-600 dark:text-gray-400">
                  Loading report data...
                </div>
              )}

              {reportData && (
                <>
                  <div className="flex gap-2 print:hidden">
                    <Button
                      onClick={handlePrint}
                      variant="outline"
                      size="sm"
                      className="border-gray-400 text-[#006699] hover:bg-gray-50 dark:hover:bg-[#001529]"
                      data-testid="button-print"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Print
                    </Button>
                    <Button
                      onClick={() => handleDownload('excel')}
                      variant="outline"
                      size="sm"
                      className="border-gray-400 text-[#006699] hover:bg-gray-50 dark:hover:bg-[#001529]"
                      data-testid="button-download-excel"
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Excel
                    </Button>
                    <Button
                      onClick={() => handleDownload('csv')}
                      variant="outline"
                      size="sm"
                      className="border-gray-400 text-[#006699] hover:bg-gray-50 dark:hover:bg-[#001529]"
                      data-testid="button-download-csv"
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      CSV
                    </Button>
                    <Button
                      onClick={() => handleDownload('pdf')}
                      variant="outline"
                      size="sm"
                      className="border-gray-400 text-[#006699] hover:bg-gray-50 dark:hover:bg-[#001529]"
                      data-testid="button-download-pdf"
                    >
                      <File className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                    <Button
                      onClick={() => handleDownload('word')}
                      variant="outline"
                      size="sm"
                      className="border-gray-400 text-[#006699] hover:bg-gray-50 dark:hover:bg-[#001529]"
                      data-testid="button-download-word"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Word
                    </Button>
                  </div>

                  <div ref={printRef}>
                    <div className="border-b-2 border-gray-300 dark:border-primary-600 pb-4 mb-4">
                      <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100">Room Availability Report</h1>
                      <div className="text-sm text-center text-primary-600 dark:text-gray-400 mt-2 space-y-1">
                        <div>Report Date: {reportGeneratedTime ? formatDate(reportGeneratedTime, "MMMM dd, yyyy") : formatDate(new Date(), "MMMM dd, yyyy")}</div>
                        <div>Report Time: {reportGeneratedTime ? formatDate(reportGeneratedTime, "hh:mm:ss a") : formatDate(new Date(), "hh:mm:ss a")}</div>
                        <div>Generated by: {(user as any)?.name || (user as any)?.email || 'System User'}</div>
                        <div className="mt-2 font-semibold">
                          Period: {dateFrom ? formatDate(new Date(dateFrom), "MMM dd, yyyy") : 'N/A'} to {dateTo ? formatDate(new Date(dateTo), "MMM dd, yyyy") : 'N/A'}
                        </div>
                      </div>
                    </div>

                    {reportData.data.length > 0 && (
                      <RoomAvailabilityChart data={reportData.data} />
                    )}

                    {groupedData.map((group, groupIndex) => (
                      <div key={groupIndex} className="mb-8 property-group">
                        <div className="bg-gradient-to-r from-[#006699] to-[#002a66] dark:from-[#002a66] dark:to-gray-800 text-white px-4 py-3 rounded-t-lg">
                          <h2 className="text-xl font-bold">{group.propertyName}</h2>
                        </div>

                        <div className="rounded-b-lg border-2 border-gray-300 dark:border-primary-600 border-t-0 overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gray-100 dark:bg-[#001529] hover:bg-gray-100 dark:hover:bg-[#001529]">
                                <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Room Type</TableHead>
                                <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Date</TableHead>
                                <TableHead className="text-right text-gray-900 dark:text-gray-100 font-semibold">Total Rooms</TableHead>
                                <TableHead className="text-right text-gray-900 dark:text-gray-100 font-semibold">Booked</TableHead>
                                <TableHead className="text-right text-gray-900 dark:text-gray-100 font-semibold">Blocked</TableHead>
                                <TableHead className="text-right text-gray-900 dark:text-gray-100 font-semibold">Available</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.data.map((row, index) => (
                                <TableRow 
                                  key={index} 
                                  data-testid={`row-report-${groupIndex}-${index}`}
                                  className="hover:bg-gray-50 dark:hover:bg-gray-950"
                                >
                                  <TableCell data-testid={`text-roomtype-${groupIndex}-${index}`} className="font-medium text-gray-800 dark:text-gray-200">
                                    {row.roomTypeName}
                                  </TableCell>
                                  <TableCell data-testid={`text-date-${groupIndex}-${index}`} className="text-[#006699] dark:text-gray-300">
                                    {formatDate(new Date(row.date), "MMM dd, yyyy")}
                                  </TableCell>
                                  <TableCell className="text-right text-[#006699] dark:text-gray-300" data-testid={`text-total-${groupIndex}-${index}`}>
                                    <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-[#001F3F] rounded">{row.totalRooms}</span>
                                  </TableCell>
                                  <TableCell className="text-right" data-testid={`text-booked-${groupIndex}-${index}`}>
                                    <span className="inline-block px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded font-semibold">{row.bookedRooms}</span>
                                  </TableCell>
                                  <TableCell className="text-right" data-testid={`text-blocked-${groupIndex}-${index}`}>
                                    <span className="inline-block px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded font-semibold">{row.blockedRooms}</span>
                                  </TableCell>
                                  <TableCell className="text-right" data-testid={`text-available-${groupIndex}-${index}`}>
                                    <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded font-bold">{row.availableRooms}</span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ))}

                    <div className="border-t-2 border-gray-300 dark:border-primary-600 mt-4 pt-4 space-y-4">
                      <div className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-4 rounded-lg border-2 border-gray-300 dark:border-primary-600">
                        <div className="font-bold text-gray-900 dark:text-gray-100 mb-3">Page Totals (Current Page)</div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-primary-600 dark:text-gray-400">Total Rooms</div>
                            <div className="font-bold text-2xl text-gray-900 dark:text-gray-100">{reportData?.data.reduce((sum, row) => sum + row.totalRooms, 0) || 0}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-primary-600 dark:text-gray-400">Booked</div>
                            <div className="font-bold text-2xl text-red-600 dark:text-red-400">{reportData?.data.reduce((sum, row) => sum + row.bookedRooms, 0) || 0}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-primary-600 dark:text-gray-400">Blocked</div>
                            <div className="font-bold text-2xl text-yellow-600 dark:text-yellow-400">{reportData?.data.reduce((sum, row) => sum + row.blockedRooms, 0) || 0}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-primary-600 dark:text-gray-400">Available</div>
                            <div className="font-bold text-2xl text-green-600 dark:text-green-400">{reportData?.data.reduce((sum, row) => sum + row.availableRooms, 0) || 0}</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-[#006699] to-[#002a66] dark:from-[#002a66] dark:to-gray-800 text-white p-4 rounded-lg border-2 border-primary-500 dark:border-primary-600">
                        <div className="font-bold text-lg mb-3">Grand Totals (All Pages)</div>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-gray-200 dark:text-gray-300">Total Rooms</div>
                            <div className="font-bold text-3xl">{reportData?.grandTotals?.totalRooms || 0}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-200 dark:text-gray-300">Booked</div>
                            <div className="font-bold text-3xl text-red-200">{reportData?.grandTotals?.bookedRooms || 0}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-200 dark:text-gray-300">Blocked</div>
                            <div className="font-bold text-3xl text-yellow-200">{reportData?.grandTotals?.blockedRooms || 0}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-200 dark:text-gray-300">Available</div>
                            <div className="font-bold text-3xl text-green-200">{reportData?.grandTotals?.availableRooms || 0}</div>
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-center text-primary-600 dark:text-gray-400 pt-2">
                        <div className="font-semibold">Total Records: {reportData?.total || 0}</div>
                        <div className="mt-2">
                          Generated on {reportGeneratedTime ? formatDate(reportGeneratedTime, "MMMM dd, yyyy 'at' hh:mm:ss a") : formatDate(new Date(), "MMMM dd, yyyy 'at' hh:mm:ss a")}
                        </div>
                      </div>
                    </div>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between print:hidden">
                      <div className="text-sm text-primary-600 dark:text-gray-400">
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
                          className="border-gray-400 text-[#006699] hover:bg-gray-50 dark:hover:bg-[#001529]"
                          data-testid="button-prev-page"
                        >
                          Previous
                        </Button>
                        <div className="flex items-center px-3 text-sm text-[#006699] dark:text-gray-300 font-semibold">
                          Page {currentPage} of {totalPages}
                        </div>
                        <Button
                          onClick={() => {
                            setCurrentPage(currentPage + 1);
                          }}
                          disabled={currentPage === totalPages}
                          variant="outline"
                          size="sm"
                          className="border-gray-400 text-[#006699] hover:bg-gray-50 dark:hover:bg-[#001529]"
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

          <Alert className="bg-gradient-to-r from-blue-50 to-gray-50 border-2 border-gray-300 dark:from-gray-900 dark:to-gray-950 dark:border-[#002a66]" data-testid="alert-help-tips">
            <Info className="h-5 w-5 text-primary-600 dark:text-gray-400" />
            <AlertDescription className="text-sm space-y-2">
              <div className="font-bold text-gray-900 dark:text-gray-100">How to Use This Report</div>
              <ul className="list-disc list-inside space-y-1 text-gray-800 dark:text-gray-200">
                <li><strong>Formula:</strong> Available Rooms = Total Rooms - (Booked + Blocked)</li>
                <li><strong>Visual Chart:</strong> Line graph shows availability trends across dates for easy pattern recognition</li>
                <li><strong>Property Groups:</strong> Data is organized by property with clear headings for better readability</li>
                <li><strong>Filters:</strong> Select property, room type, and date range to view availability data</li>
                <li><strong>Date Range:</strong> Both "Date From" and "Date To" are required to generate the report</li>
                <li><strong>Show Button:</strong> Click "Show Report" after setting your filters to display the data</li>
                <li><strong>Color Codes:</strong> Booked (Red), Blocked (Yellow), Available (Green) for quick visual identification</li>
                <li><strong>Print:</strong> Use the Print button for a formatted printout with header and footer</li>
                <li><strong>Export:</strong> Download the report in Excel, CSV, PDF, or Word format for offline analysis</li>
                <li><strong>Pagination:</strong> Results are shown 50 records per page for better performance</li>
              </ul>
              <div className="text-xs text-[#006699] dark:text-gray-300 mt-2">
                <strong>Tip:</strong> Use "All Properties" or "All Room Types" to get a comprehensive view across your entire inventory.
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
