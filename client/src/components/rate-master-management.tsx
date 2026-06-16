import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertRateMasterSchema, type RateMaster, type NewRateMaster, type Property, type RoomType, type CurrencyMaster } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Search, Calendar, DollarSign, TrendingUp, Users, Building, Home, Clock, Star, Filter, X } from "lucide-react";

// Custom form schema that handles both single and multi-property scenarios
const rateMasterFormSchema = insertRateMasterSchema.extend({
  propertySelectionType: z.enum(["single", "multiple"]),
  selectedProperties: z.array(z.number()).min(1, "At least one property must be selected")
});

type RateMasterFormData = z.infer<typeof rateMasterFormSchema>;

export function RateMasterManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRate, setEditingRate] = useState<RateMaster | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: rates = [], isLoading } = useQuery<RateMaster[]>({
    queryKey: ["/api/rates"],
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: roomTypes = [] } = useQuery<RoomType[]>({
    queryKey: ["/api/room-types"],
  });

  const { data: currencies = [] } = useQuery<CurrencyMaster[]>({
    queryKey: ["/api/currencies"],
  });

  // Form for rate creation/editing
  const form = useForm<RateMasterFormData>({
    resolver: zodResolver(rateMasterFormSchema),
    defaultValues: {
      propertySelectionType: "single",
      selectedProperties: [],
      propertyId: undefined,
      propertyIds: undefined,
      roomTypeId: 0,
      rateName: "",
      fromDate: "",
      toDate: "",
      singleOccupancyRate: "0.00",
      doubleOccupancyRate: "0.00",
      tripleOccupancyRate: "0.00",
      quadrupleOccupancyRate: "0.00",
      extraPersonCharge: "0.00",
      petCharge: "0.00",
      childCharge: "0.00",
      infantCharge: "0.00",
      weekendSurcharge: "0.00",
      festivalSurcharge: "0.00",
      currencyId: 0,
      excludedDays: [],
      weekendDays: ["friday", "saturday", "sunday"],
      isActive: true,
      priority: 1,
      notes: "",
    },
  });

  const propertySelectionType = form.watch("propertySelectionType");

  // Create rate mutation
  const createRateMutation = useMutation({
    mutationFn: async (data: RateMasterFormData) => {
      // Transform form data to API format
      const apiData: NewRateMaster = {
        ...data,
        propertyId: data.propertySelectionType === "single" ? data.selectedProperties[0] : undefined,
        propertyIds: data.propertySelectionType === "multiple" ? data.selectedProperties : undefined
      };
      
      const response = await apiRequest("POST", "/api/rates", apiData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rates"] });
      setShowCreateDialog(false);
      form.reset();
      toast({ title: "Success", description: "Rate plan created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create rate plan",
        variant: "destructive" 
      });
    },
  });

  // Update rate mutation
  const updateRateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RateMasterFormData }) => {
      // Transform form data to API format
      const apiData: Partial<NewRateMaster> = {
        ...data,
        propertyId: data.propertySelectionType === "single" ? data.selectedProperties[0] : undefined,
        propertyIds: data.propertySelectionType === "multiple" ? data.selectedProperties : undefined
      };
      
      const response = await apiRequest("PUT", `/api/rates/${id}`, apiData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rates"] });
      setEditingRate(null);
      setShowCreateDialog(false);
      form.reset();
      toast({ title: "Success", description: "Rate plan updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update rate plan",
        variant: "destructive" 
      });
    },
  });

  // Delete rate mutation
  const deleteRateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/rates/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rates"] });
      toast({ title: "Success", description: "Rate plan deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete rate plan",
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (data: RateMasterFormData) => {
    if (editingRate) {
      updateRateMutation.mutate({ id: editingRate.id, data });
    } else {
      createRateMutation.mutate(data);
    }
  };

  const handleEdit = (rate: RateMaster) => {
    setEditingRate(rate);
    
    // Determine if this is a single or multi-property rate
    const isMultiProperty = Array.isArray(rate.propertyIds) && rate.propertyIds.length > 0;
    const selectedProperties = isMultiProperty 
      ? rate.propertyIds || []
      : rate.propertyId 
        ? [rate.propertyId] 
        : [];

    form.reset({
      propertySelectionType: isMultiProperty ? "multiple" : "single",
      selectedProperties,
      propertyId: rate.propertyId || undefined,
      propertyIds: rate.propertyIds || undefined,
      roomTypeId: rate.roomTypeId,
      rateName: rate.rateName,
      fromDate: rate.fromDate,
      toDate: rate.toDate,
      singleOccupancyRate: rate.singleOccupancyRate,
      doubleOccupancyRate: rate.doubleOccupancyRate,
      tripleOccupancyRate: rate.tripleOccupancyRate,
      quadrupleOccupancyRate: rate.quadrupleOccupancyRate,
      extraPersonCharge: rate.extraPersonCharge || "0.00",
      petCharge: rate.petCharge || "0.00",
      childCharge: rate.childCharge || "0.00",
      infantCharge: rate.infantCharge || "0.00",
      weekendSurcharge: rate.weekendSurcharge || "0.00",
      festivalSurcharge: rate.festivalSurcharge || "0.00",
      currencyId: rate.currencyId,
      excludedDays: rate.excludedDays || [],
      weekendDays: rate.weekendDays || ["friday", "saturday", "sunday"],
      isActive: rate.isActive,
      priority: rate.priority || 1,
      notes: rate.notes || "",
    });
    setShowCreateDialog(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this rate plan?")) {
      deleteRateMutation.mutate(id);
    }
  };

  const handleCreate = () => {
    setEditingRate(null);
    form.reset({
      propertySelectionType: "single",
      selectedProperties: [],
      propertyId: undefined,
      propertyIds: undefined,
      roomTypeId: 0,
      rateName: "",
      fromDate: "",
      toDate: "",
      singleOccupancyRate: "0.00",
      doubleOccupancyRate: "0.00",
      tripleOccupancyRate: "0.00",
      quadrupleOccupancyRate: "0.00",
      extraPersonCharge: "0.00",
      petCharge: "0.00",
      childCharge: "0.00",
      infantCharge: "0.00",
      weekendSurcharge: "0.00",
      festivalSurcharge: "0.00",
      currencyId: currencies[0]?.id || 0,
      excludedDays: [],
      weekendDays: ["friday", "saturday", "sunday"],
      isActive: true,
      priority: 1,
      notes: "",
    });
    setShowCreateDialog(true);
  };

  // Filter rates based on search and filters
  const filteredRates = rates.filter((rate) => {
    const matchesSearch = !searchTerm || rate.rateName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProperty = !selectedProperty || rate.propertyId === selectedProperty || 
      (Array.isArray(rate.propertyIds) && rate.propertyIds.includes(selectedProperty));
    const matchesRoomType = !selectedRoomType || rate.roomTypeId === selectedRoomType;
    
    return matchesSearch && matchesProperty && matchesRoomType;
  });

  // Helper functions
  const getPropertyNames = (rate: RateMaster) => {
    if (Array.isArray(rate.propertyIds) && rate.propertyIds.length > 0) {
      return rate.propertyIds
        .map(id => properties.find(p => p.id === id)?.name)
        .filter(Boolean)
        .join(", ");
    }
    
    if (rate.propertyId) {
      return properties.find(p => p.id === rate.propertyId)?.name || `Property ${rate.propertyId}`;
    }
    
    return "No properties assigned";
  };

  const getRoomTypeName = (roomTypeId: number) => {
    return roomTypes.find(rt => rt.id === roomTypeId)?.roomTypeName || `Room Type ${roomTypeId}`;
  };

  const getCurrencyCode = (currencyId: number) => {
    return currencies.find(c => c.id === currencyId)?.shortCode || "USD";
  };

  const isMultiProperty = (rate: RateMaster) => {
    return Array.isArray(rate.propertyIds) && rate.propertyIds.length > 0;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Rate Master Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage pricing plans for single properties or entire chains
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate} data-testid="button-create-rate">
              <Plus className="w-4 h-4 mr-2" />
              Create Rate Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRate ? "Edit Rate Plan" : "Create Rate Plan"}
              </DialogTitle>
              <DialogDescription>
                Configure pricing for your properties with flexible rate structures
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="pricing">Pricing</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="space-y-4">
                    {/* Property Selection Type */}
                    <FormField
                      control={form.control}
                      name="propertySelectionType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rate Plan Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-property-type">
                                <SelectValue placeholder="Select rate plan type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="single">
                                <div className="flex items-center space-x-2">
                                  <Building className="w-4 h-4" />
                                  <div>
                                    <div className="font-medium">Single Property</div>
                                    <div className="text-sm text-gray-500">Apply to one property only</div>
                                  </div>
                                </div>
                              </SelectItem>
                              <SelectItem value="multiple">
                                <div className="flex items-center space-x-2">
                                  <Users className="w-4 h-4" />
                                  <div>
                                    <div className="font-medium">Multi-Property Chain</div>
                                    <div className="text-sm text-gray-500">Apply to multiple properties</div>
                                  </div>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Property Selection */}
                    <FormField
                      control={form.control}
                      name="selectedProperties"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {propertySelectionType === "single" ? "Select Property" : "Select Properties"}
                          </FormLabel>
                          <div className="space-y-2">
                            {propertySelectionType === "single" ? (
                              <Select 
                                onValueChange={(value) => field.onChange([parseInt(value)])}
                                value={field.value[0]?.toString() || ""}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-single-property">
                                    <SelectValue placeholder="Choose a property" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {properties.map((property) => (
                                    <SelectItem key={property.id} value={property.id.toString()}>
                                      <div className="flex items-center space-x-2">
                                        <Building className="w-4 h-4" />
                                        <span>{property.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                                {properties.map((property) => (
                                  <div key={property.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      checked={field.value.includes(property.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          field.onChange([...field.value, property.id]);
                                        } else {
                                          field.onChange(field.value.filter(id => id !== property.id));
                                        }
                                      }}
                                      data-testid={`checkbox-property-${property.id}`}
                                    />
                                    <Label className="text-sm">{property.name}</Label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Room Type */}
                    <FormField
                      control={form.control}
                      name="roomTypeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Room Type</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                            <FormControl>
                              <SelectTrigger data-testid="select-room-type">
                                <SelectValue placeholder="Select room type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {roomTypes.map((roomType) => (
                                <SelectItem key={roomType.id} value={roomType.id.toString()}>
                                  {roomType.roomTypeName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Rate Name */}
                    <FormField
                      control={form.control}
                      name="rateName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rate Plan Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Summer Special, Weekend Rates, Corporate Package" 
                              {...field} 
                              data-testid="input-rate-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="fromDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>From Date</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field} 
                                data-testid="input-from-date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="toDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>To Date</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field} 
                                data-testid="input-to-date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="pricing" className="space-y-4">
                    {/* Currency */}
                    <FormField
                      control={form.control}
                      name="currencyId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                            <FormControl>
                              <SelectTrigger data-testid="select-currency">
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {currencies.map((currency) => (
                                <SelectItem key={currency.id} value={currency.id.toString()}>
                                  {currency.shortCode} - {currency.currencyName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Occupancy Rates */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="singleOccupancyRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Single Occupancy Rate</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="0.00" 
                                {...field} 
                                data-testid="input-single-rate"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="doubleOccupancyRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Double Occupancy Rate</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="0.00" 
                                {...field} 
                                data-testid="input-double-rate"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tripleOccupancyRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Triple Occupancy Rate</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="0.00" 
                                {...field} 
                                data-testid="input-triple-rate"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="quadrupleOccupancyRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quadruple Occupancy Rate</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="0.00" 
                                {...field} 
                                data-testid="input-quad-rate"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Additional Charges */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="extraPersonCharge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Extra Person Charge</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="0.00" 
                                {...field} 
                                data-testid="input-extra-person"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="petCharge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pet Charge</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="0.00" 
                                {...field} 
                                data-testid="input-pet-charge"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="childCharge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Child Charge (6-12 years)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="0.00" 
                                {...field} 
                                data-testid="input-child-charge"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="infantCharge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Infant Charge (0-5 years)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="0.00" 
                                {...field} 
                                data-testid="input-infant-charge"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Surcharges */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="weekendSurcharge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weekend Surcharge</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="0.00" 
                                {...field} 
                                data-testid="input-weekend-surcharge"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="festivalSurcharge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Festival Surcharge</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="0.00" 
                                {...field} 
                                data-testid="input-festival-surcharge"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="advanced" className="space-y-4">
                    {/* Priority */}
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority (Higher number = Higher priority)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              max="100" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-priority"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Active Status */}
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Active Status</FormLabel>
                            <div className="text-sm text-gray-500">
                              Enable this rate plan for bookings
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-active"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Notes */}
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Additional notes about this rate plan..." 
                              {...field} 
                              data-testid="textarea-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateDialog(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createRateMutation.isPending || updateRateMutation.isPending}
                    data-testid="button-submit-rate"
                  >
                    {editingRate ? "Update Rate Plan" : "Create Rate Plan"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search rate plans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search"
                className="w-full"
              />
            </div>
            <Select value={selectedProperty?.toString() || "all"} onValueChange={(value) => setSelectedProperty(value === "all" ? null : parseInt(value))}>
              <SelectTrigger className="w-[200px]" data-testid="select-filter-property">
                <SelectValue placeholder="Filter by property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id.toString()}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedRoomType?.toString() || "all"} onValueChange={(value) => setSelectedRoomType(value === "all" ? null : parseInt(value))}>
              <SelectTrigger className="w-[200px]" data-testid="select-filter-room-type">
                <SelectValue placeholder="Filter by room type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Room Types</SelectItem>
                {roomTypes.map((roomType) => (
                  <SelectItem key={roomType.id} value={roomType.id.toString()}>
                    {roomType.roomTypeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Rate Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Rate Plans ({filteredRates.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRates.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                No rate plans found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || selectedProperty || selectedRoomType
                  ? "No rate plans match your current filters."
                  : "Start by creating your first rate plan."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rate Plan</TableHead>
                    <TableHead>Properties</TableHead>
                    <TableHead>Room Type</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Single Rate</TableHead>
                    <TableHead>Double Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRates.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{rate.rateName}</span>
                          <div className="flex items-center space-x-2 mt-1">
                            {isMultiProperty(rate) ? (
                              <Badge variant="secondary" className="text-xs">
                                <Users className="w-3 h-3 mr-1" />
                                Chain Rate
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                <Building className="w-3 h-3 mr-1" />
                                Single Property
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              Priority {rate.priority}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <span className="text-sm" title={getPropertyNames(rate)}>
                            {getPropertyNames(rate)}
                          </span>
                          {isMultiProperty(rate) && (
                            <div className="text-xs text-gray-500 mt-1">
                              {rate.propertyIds?.length} properties
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getRoomTypeName(rate.roomTypeId)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{rate.fromDate}</div>
                          <div>to {rate.toDate}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {getCurrencyCode(rate.currencyId)} {rate.singleOccupancyRate}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {getCurrencyCode(rate.currencyId)} {rate.doubleOccupancyRate}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={rate.isActive ? "default" : "secondary"}>
                          {rate.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(rate)}
                            data-testid={`button-edit-rate-${rate.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(rate.id)}
                            data-testid={`button-delete-rate-${rate.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}