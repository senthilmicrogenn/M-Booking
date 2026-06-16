import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Save, Upload, Building, CalendarDays, AlertCircle, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { type RoomInventory, type Property, type RoomType } from "@shared/schema";

export function RoomInventoryManagement() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<number | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarInventory, setCalendarInventory] = useState<Map<string, { totalRooms: number; availableRooms: number }>>(new Map());
  
  // Bulk update controls with Date objects for calendar picker
  const [bulkStartDate, setBulkStartDate] = useState<Date | undefined>(undefined);
  const [bulkEndDate, setBulkEndDate] = useState<Date | undefined>(undefined);
  const [bulkStartDateOpen, setBulkStartDateOpen] = useState(false);
  const [bulkEndDateOpen, setBulkEndDateOpen] = useState(false);
  const [bulkRooms, setBulkRooms] = useState("");
  const [bulkDays, setBulkDays] = useState<string[]>(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]); // Default: all days
  const [skippedDaysBehavior, setSkippedDaysBehavior] = useState<"unchanged" | "block" | "custom">("unchanged");
  const [skippedDaysValue, setSkippedDaysValue] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
    staleTime: 0, // Always refetch when invalidated
  });

  const { data: roomTypes = [] } = useQuery<RoomType[]>({
    queryKey: ["/api/room-types"],
    staleTime: 0, // Always refetch when invalidated
  });

  // Get inventory data for selected property and room type
  // Calendar view: Use bulk update date range if both dates are set, otherwise use currentDate to today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let startDate: Date;
  let endDate: Date;
  
  if (bulkStartDate && bulkEndDate) {
    // If bulk dates are set, use them for the calendar view
    startDate = new Date(bulkStartDate.getFullYear(), bulkStartDate.getMonth(), bulkStartDate.getDate());
    endDate = new Date(bulkEndDate.getFullYear(), bulkEndDate.getMonth(), bulkEndDate.getDate());
  } else {
    // Otherwise, use currentDate to today (or 30 days ahead)
    startDate = new Date(currentDate);
    startDate.setHours(0, 0, 0, 0);
    
    endDate = new Date(today);
    if (startDate > today) {
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30);
    }
  }
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const { data: inventoryData = [], isLoading } = useQuery<RoomInventory[]>({
    queryKey: ["/api/room-inventory", selectedPropertyId, selectedRoomTypeId, { startDate: startDateStr, endDate: endDateStr }],
    enabled: selectedPropertyId !== null && selectedRoomTypeId !== null,
    queryFn: async () => {
      const response = await fetch(`/api/room-inventory/${selectedPropertyId}/${selectedRoomTypeId}?startDate=${startDateStr}&endDate=${endDateStr}`);
      if (!response.ok) throw new Error('Failed to fetch inventory');
      return response.json();
    },
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async (inventoryUpdates: { propertyId: number; roomTypeId: number; date: string; totalRooms: number; availableRooms?: number; }[]) => {
      const response = await fetch("/api/room-inventory/bulk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryUpdates }),
      });
      if (!response.ok) throw new Error('Failed to update inventory');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate room inventory queries
      queryClient.invalidateQueries({ queryKey: ["/api/room-inventory"] });
      
      // Also invalidate property-related queries to keep master data fresh
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/room-types"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties/master-data"] });
      
      toast({ title: "Success", description: "Room inventory updated successfully" });
      setCalendarInventory(new Map());
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to update room inventory",
        variant: "destructive" 
      });
    },
  });

  // Generate calendar days from startDate to endDate (custom range)
  const generateCalendarDays = () => {
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  // Generate dates from startDate to endDate (for table headers)
  const generateMonthDates = () => {
    const dates = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  // Get inventory for a specific date
  const getInventoryForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const localChanges = calendarInventory.get(dateStr);
    if (localChanges) {
      return localChanges;
    }
    
    const existing = inventoryData.find(inv => inv.date === dateStr);
    return existing ? {
      totalRooms: existing.totalRooms,
      availableRooms: existing.availableRooms
    } : { totalRooms: 10, availableRooms: 10 };
  };

  // Update inventory for a specific date
  const updateInventoryForDate = (date: Date, totalRooms: number) => {
    const dateStr = date.toISOString().split('T')[0];
    const current = getInventoryForDate(date);
    const newInventory = new Map(calendarInventory);
    newInventory.set(dateStr, {
      totalRooms,
      availableRooms: totalRooms // Set available equal to total by default
    });
    setCalendarInventory(newInventory);
  };

  // Apply bulk rooms to date range
  const applyBulkRooms = () => {
    const rooms = parseInt(bulkRooms);
    if (isNaN(rooms) || rooms < 0) {
      toast({ title: "Error", description: "Please enter a valid number of rooms (0 or higher)", variant: "destructive" });
      return;
    }

    if (!bulkStartDate || !bulkEndDate) {
      toast({ title: "Error", description: "Please select both start and end dates", variant: "destructive" });
      return;
    }

    // Work with Date objects directly - ensure clean dates without time components
    const startDate = new Date(bulkStartDate.getFullYear(), bulkStartDate.getMonth(), bulkStartDate.getDate());
    const endDate = new Date(bulkEndDate.getFullYear(), bulkEndDate.getMonth(), bulkEndDate.getDate());

    if (startDate > endDate) {
      toast({ title: "Error", description: "End date must be after start date", variant: "destructive" });
      return;
    }

    const newInventory = new Map(calendarInventory);
    
    // Use a safe date iteration method that doesn't mutate dates
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
    
    for (let time = startTime; time <= endTime; time += oneDay) {
      const currentDate = new Date(time);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // RELATIVE DAY CALCULATION: Calculate day based on current day + date difference
      // This ensures perfect alignment with system's current day understanding
      const today = new Date();
      const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const targetTime = currentDate.getTime();
      const daysDifference = Math.round((targetTime - todayTime) / (24 * 60 * 60 * 1000));
      const todayDayIndex = today.getDay(); // Current day index (0=Sunday, 1=Monday, etc.)
      const dayIndex = (todayDayIndex + daysDifference) % 7;
      // Ensure positive result for negative differences
      const normalizedDayIndex = dayIndex < 0 ? dayIndex + 7 : dayIndex;
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[normalizedDayIndex];
      
      // Check if this day is selected for the main update
      if (bulkDays.length > 0 && bulkDays.includes(dayName)) {
        // Apply the main bulk update to selected days
        newInventory.set(dateStr, {
          totalRooms: rooms,
          availableRooms: rooms
        });
      } else if (bulkDays.length > 0 && !bulkDays.includes(dayName)) {
        // Handle skipped days based on user preference
        if (skippedDaysBehavior === "block") {
          // Set skipped days to 0 (blocked)
          newInventory.set(dateStr, {
            totalRooms: 0,
            availableRooms: 0
          });
        } else if (skippedDaysBehavior === "custom") {
          // Set skipped days to custom value
          const customValue = parseInt(skippedDaysValue) || 0;
          newInventory.set(dateStr, {
            totalRooms: customValue,
            availableRooms: customValue
          });
        }
        // If "unchanged", do nothing (skip this day entirely)
      } else {
        // If no specific days selected, apply to all days
        newInventory.set(dateStr, {
          totalRooms: rooms,
          availableRooms: rooms
        });
      }
    }
    
    setCalendarInventory(newInventory);
    
    // Clear bulk update form
    setBulkStartDate(undefined);
    setBulkEndDate(undefined);
    setBulkRooms("");
    setBulkDays(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]); // Reset to all days
    setSkippedDaysBehavior("unchanged"); // Reset skipped days behavior
    setSkippedDaysValue(""); // Reset custom value
    
    toast({ title: "Success", description: "Bulk update applied successfully" });
  };

  // Save all changes
  const saveChanges = () => {
    if (!selectedPropertyId || !selectedRoomTypeId) {
      toast({ 
        title: "Error", 
        description: "Please select both property and room type before saving", 
        variant: "destructive" 
      });
      return;
    }
    
    const updates = Array.from(calendarInventory.entries()).map(([date, inventory]) => ({
      propertyId: selectedPropertyId,
      roomTypeId: selectedRoomTypeId,
      date,
      totalRooms: inventory.totalRooms,
      availableRooms: inventory.availableRooms,
    }));

    if (updates.length > 0) {
      bulkUpdateMutation.mutate(updates);
    } else {
      toast({ 
        title: "Info", 
        description: "No changes to save. Please modify room inventory first.", 
        variant: "default" 
      });
    }
  };

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const selectedRoomType = roomTypes.find(rt => rt.id === selectedRoomTypeId);
  const filteredRoomTypes = roomTypes.filter(rt => 
    selectedPropertyId && selectedProperty?.roomTypeIds ? 
      selectedProperty.roomTypeIds.includes(rt.id) : 
      !selectedPropertyId
  );

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100" data-testid="text-inventory-title">
            Room Inventory Management
          </h2>
          <p className="text-primary-600 dark:text-gray-300">
            Manage room availability by date - set 0 rooms to block/skip dates
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {calendarInventory.size > 0 && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              {calendarInventory.size} unsaved changes
            </Badge>
          )}
        </div>
      </div>

      {/* Property and Room Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5" />
            <span>Select Property & Room Type</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Property</Label>
              <Select 
                value={selectedPropertyId?.toString() || ""} 
                onValueChange={(value) => {
                  setSelectedPropertyId(parseInt(value));
                  setSelectedRoomTypeId(null); // Reset room type when property changes
                  setCalendarInventory(new Map()); // Clear unsaved changes
                }}
              >
                <SelectTrigger data-testid="select-property">
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.filter(p => p.type === "hotel").map((property) => (
                    <SelectItem key={property.id} value={property.id.toString()}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-full">
              <Label>Room Type (Touch to Select)</Label>
              {!selectedPropertyId ? (
                <div className="text-sm text-gray-500 mt-2">Please select a property first</div>
              ) : filteredRoomTypes.length === 0 ? (
                <div className="text-sm text-gray-500 mt-2">No room types available for this property</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
                  {filteredRoomTypes.map((roomType) => {
                    const isSelected = selectedRoomTypeId === roomType.id;
                    return (
                      <div
                        key={roomType.id}
                        onClick={() => {
                          setSelectedRoomTypeId(roomType.id);
                          setCalendarInventory(new Map()); // Clear unsaved changes
                        }}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'bg-[hsl(213_94%_25%)] border-[hsl(213_94%_20%)] text-white shadow-lg scale-105' 
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-[hsl(213_94%_25%)]'
                        }`}
                        data-testid={`room-type-${roomType.id}`}
                      >
                        <div className="text-sm font-bold mb-1">{roomType.roomTypeName}</div>
                        <div className={`text-xs ${isSelected ? 'opacity-90' : 'opacity-60'}`}>
                          Max: {roomType.maxOccupancy} guests
                        </div>
                        <div className={`text-xs ${isSelected ? 'opacity-90' : 'opacity-60'}`}>
                          {roomType.roomCount} rooms
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Update Section */}
      {selectedPropertyId && selectedRoomTypeId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5" />
              <span>Bulk Update Room Inventory</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range with Popover Pickers */}
              <div>
                <Label>Start Date</Label>
                <Popover open={bulkStartDateOpen} onOpenChange={setBulkStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !bulkStartDate && "text-muted-foreground"
                      )}
                      data-testid="input-bulk-start-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {bulkStartDate ? format(bulkStartDate, "PPP") : "Select start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={bulkStartDate}
                      onSelect={(date) => {
                        setBulkStartDate(date);
                        setBulkStartDateOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label>End Date</Label>
                <Popover open={bulkEndDateOpen} onOpenChange={setBulkEndDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !bulkEndDate && "text-muted-foreground"
                      )}
                      data-testid="input-bulk-end-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {bulkEndDate ? format(bulkEndDate, "PPP") : "Select end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={bulkEndDate}
                      onSelect={(date) => {
                        setBulkEndDate(date);
                        setBulkEndDateOpen(false);
                      }}
                      disabled={(date) => bulkStartDate ? date < bulkStartDate : false}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Number of Rooms */}
              <div>
                <Label>Number of Rooms</Label>
                <Input
                  type="number"
                  min="0"
                  value={bulkRooms}
                  onChange={(e) => setBulkRooms(e.target.value)}
                  placeholder="0 = blocked"
                  data-testid="input-bulk-rooms"
                />
              </div>
              
              {/* Days Selection */}
              <div className="col-span-full">
                <Label>Days to Apply (Touch to toggle)</Label>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mt-2">
                  {[
                    { key: "monday", label: "Mon", full: "Monday" },
                    { key: "tuesday", label: "Tue", full: "Tuesday" },
                    { key: "wednesday", label: "Wed", full: "Wednesday" },
                    { key: "thursday", label: "Thu", full: "Thursday" },
                    { key: "friday", label: "Fri", full: "Friday" },
                    { key: "saturday", label: "Sat", full: "Saturday" },
                    { key: "sunday", label: "Sun", full: "Sunday" },
                  ].map((day) => {
                    const isSelected = bulkDays.includes(day.key);
                    return (
                      <div
                        key={day.key}
                        onClick={() => {
                          if (isSelected) {
                            setBulkDays(bulkDays.filter(d => d !== day.key));
                          } else {
                            setBulkDays([...bulkDays, day.key]);
                          }
                        }}
                        className={`p-3 rounded border-2 cursor-pointer transition-all duration-200 text-center ${
                          isSelected 
                            ? 'bg-[hsl(213_94%_25%)] border-[hsl(213_94%_20%)] text-white' 
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                        data-testid={`day-${day.key}`}
                      >
                        <div className="text-sm font-medium">{day.label}</div>
                        <div className="text-xs opacity-80">{day.full}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs text-gray-500">
                    {bulkDays.length === 7 ? "All days selected" : `${bulkDays.length} day(s) selected`}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setBulkDays(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"])}
                      className="text-xs"
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setBulkDays([])}
                      className="text-xs"
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Skipped Days Behavior */}
              {bulkDays.length > 0 && bulkDays.length < 7 && (
                <div className="col-span-full">
                  <Label>What to do with skipped days?</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                    <div
                      onClick={() => setSkippedDaysBehavior("unchanged")}
                      className={`p-3 rounded border-2 cursor-pointer transition-all duration-200 ${
                        skippedDaysBehavior === "unchanged"
                          ? 'bg-blue-50 border-blue-300 text-blue-800' 
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="text-sm font-medium">Keep Unchanged</div>
                      <div className="text-xs opacity-80">Don't modify skipped days</div>
                    </div>
                    
                    <div
                      onClick={() => setSkippedDaysBehavior("block")}
                      className={`p-3 rounded border-2 cursor-pointer transition-all duration-200 ${
                        skippedDaysBehavior === "block"
                          ? 'bg-red-50 border-red-300 text-red-800' 
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="text-sm font-medium">Block Days</div>
                      <div className="text-xs opacity-80">Set to 0 rooms (blocked)</div>
                    </div>
                    
                    <div
                      onClick={() => setSkippedDaysBehavior("custom")}
                      className={`p-3 rounded border-2 cursor-pointer transition-all duration-200 ${
                        skippedDaysBehavior === "custom"
                          ? 'bg-green-50 border-green-300 text-green-800' 
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="text-sm font-medium">Custom Value</div>
                      <div className="text-xs opacity-80">Set specific number</div>
                    </div>
                  </div>
                  
                  {skippedDaysBehavior === "custom" && (
                    <div className="mt-3">
                      <Input
                        type="number"
                        min="0"
                        value={skippedDaysValue}
                        onChange={(e) => setSkippedDaysValue(e.target.value)}
                        placeholder="Enter rooms count for skipped days"
                        className="w-full"
                        data-testid="input-skipped-days-value"
                      />
                    </div>
                  )}
                  
                  <div className="mt-2 text-xs text-gray-500">
                    Skipped days: {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
                      .filter(day => !bulkDays.includes(day))
                      .map(day => day.charAt(0).toUpperCase() + day.slice(1))
                      .join(', ') || 'None'}
                  </div>
                </div>
              )}
              
              {/* Apply Button */}
              <div className="flex items-end">
                <Button 
                  onClick={applyBulkRooms}
                  disabled={!bulkStartDate || !bulkEndDate || !bulkRooms || bulkDays.length === 0}
                  className="w-full bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)]"
                  data-testid="button-apply-bulk"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Apply Bulk Update
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedPropertyId && selectedRoomTypeId && (
        <>
          {/* Calendar Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CalendarDays className="w-5 h-5" />
                  <span>Calendar View - {startDateStr} to {endDateStr}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newDate = new Date(currentDate);
                      newDate.setDate(newDate.getDate() - 7);
                      setCurrentDate(newDate);
                    }}
                    data-testid="button-prev-week"
                  >
                    ← Week
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                    data-testid="button-today"
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newDate = new Date(currentDate);
                      newDate.setDate(newDate.getDate() + 7);
                      setCurrentDate(newDate);
                    }}
                    data-testid="button-next-week"
                  >
                    Week →
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                  Property: <strong>{selectedProperty?.name}</strong> | 
                  Room Type: <strong>{selectedRoomType?.roomTypeName}</strong>
                </div>
                <div className="flex items-center space-x-2">
                  {calendarInventory.size > 0 && (
                    <Button 
                      onClick={saveChanges} 
                      disabled={bulkUpdateMutation.isPending}
                      data-testid="button-save-changes"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {bulkUpdateMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  )}
                </div>
              </div>

              {/* Room Type vs Date Matrix */}
              {roomTypes.filter(rt => rt.id === selectedRoomTypeId).length === 0 ? (
                <div className="text-center p-4 text-gray-500 text-sm">
                  No room type selected
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    {/* Header Row - Dates */}
                    <thead>
                      <tr>
                        <th className="text-left p-2 border border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 min-w-[140px]">
                          <div className="text-xs font-medium">Date</div>
                          <div className="text-xs text-gray-500">(Room Count)</div>
                        </th>
                        {generateMonthDates().map((date) => {
                          const isToday = date.toDateString() === new Date().toDateString();
                          return (
                            <th 
                              key={date.getDate()} 
                              className={`text-center p-1 border border-gray-200 dark:border-gray-700 min-w-[80px] ${
                                isToday ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800'
                              }`}
                            >
                              <div className="text-xs font-medium">{date.getDate()}</div>
                              <div className="text-xs text-gray-500">
                                {date.toLocaleDateString('en-US', { weekday: 'short' })}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    
                    {/* Body Row - Selected Room Type */}
                    <tbody>
                      <tr>
                        {/* Room Type Name */}
                        <td className="p-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                          <div className="text-sm font-medium">
                            {roomTypes.find(rt => rt.id === selectedRoomTypeId)?.roomTypeName || 'Unknown Room Type'}
                          </div>
                          <div className="text-xs text-gray-500">
                            Room Type ID: {selectedRoomTypeId}
                          </div>
                        </td>
                        
                        {/* Inventory cells for each date */}
                        {generateMonthDates().map((date) => {
                          const isToday = date.toDateString() === new Date().toDateString();
                          const inventory = getInventoryForDate(date);
                          const hasChanges = calendarInventory.has(date.toISOString().split('T')[0]);
                          
                          return (
                            <td 
                              key={date.getDate()}
                              className={`p-2 border border-gray-200 dark:border-gray-700 text-center ${
                                isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                              } ${hasChanges ? 'bg-orange-50 dark:bg-orange-900/20 ring-1 ring-orange-200' : ''}`}
                              data-testid={`inventory-${date.toISOString().split('T')[0]}`}
                            >
                              <div className="space-y-1">
                                <Input
                                  type="number"
                                  min="0"
                                  value={inventory.totalRooms}
                                  onChange={(e) => updateInventoryForDate(date, parseInt(e.target.value) || 0)}
                                  className="text-xs h-8 w-16 text-center mx-auto"
                                  data-testid={`input-rooms-${date.toISOString().split('T')[0]}`}
                                />
                                {inventory.totalRooms === 0 ? (
                                  <Badge variant="destructive" className="text-xs">Blocked</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    {inventory.totalRooms} rooms
                                  </Badge>
                                )}
                                {hasChanges && (
                                  <div className="text-xs text-orange-600 dark:text-orange-400">
                                    Modified
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
                  <span>Today</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-orange-500 rounded"></div>
                  <span>Modified</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-50 dark:bg-red-900/20 border rounded"></div>
                  <span>Blocked/Skipped (0 rooms)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-muted-foreground" />
                  <span>Set 0 rooms to skip/block dates</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}