import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Edit, Trash2, Hotel, Building, MapPin, Star, Settings, FileText, CheckCircle, XCircle, Clock, Camera, ChevronDown, ChevronUp, Wifi, Car, Coffee, Utensils, Waves, Dumbbell, Gamepad2, Shield, Baby, Dog, Snowflake, Wind, Home, Tv, Bath, ChefHat, ShowerHead, AirVent, Bed, Eye, Check, ChevronsUpDown, Image } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { insertPropertySchema, type Property, type NewProperty } from "@shared/schema";
import { z } from "zod";
import { RoomMediaManager } from "./RoomMediaManager";
import { UniversalPhotoUploader } from "./UniversalPhotoUploader";
import { PropertyPhotoGallery } from "./PropertyPhotoGallery";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface PropertyMasterData {
  currencies: any[];
  hotelStarRatings: any[];
  customerReviews: any[];
  propertyAreas: any[];
  roomAmenities: any[];
  hotelAmenities: any[];
  roomTypes: any[];
  policyTemplates: any[];
}

const propertyFormSchema = insertPropertySchema;

// Function to get appropriate icon for amenities
function getAmenityIcon(amenityName: string, category?: string) {
  const name = amenityName.toLowerCase();
  
  // WiFi related
  if (name.includes('wifi') || name.includes('internet') || name.includes('wireless')) {
    return <Wifi className="w-4 h-4" />;
  }
  
  // Parking related
  if (name.includes('parking') || name.includes('valet')) {
    return <Car className="w-4 h-4" />;
  }
  
  // Food & Beverage
  if (name.includes('restaurant') || name.includes('dining') || name.includes('kitchen') || name.includes('breakfast')) {
    return <Utensils className="w-4 h-4" />;
  }
  if (name.includes('coffee') || name.includes('tea') || name.includes('bar')) {
    return <Coffee className="w-4 h-4" />;
  }
  
  // Recreation
  if (name.includes('pool') || name.includes('swimming')) {
    return <Waves className="w-4 h-4" />;
  }
  if (name.includes('gym') || name.includes('fitness') || name.includes('exercise')) {
    return <Dumbbell className="w-4 h-4" />;
  }
  if (name.includes('game') || name.includes('play') || name.includes('entertainment')) {
    return <Gamepad2 className="w-4 h-4" />;
  }
  
  // Safety & Security
  if (name.includes('security') || name.includes('safe') || name.includes('cctv') || name.includes('guard')) {
    return <Shield className="w-4 h-4" />;
  }
  
  // Family Services
  if (name.includes('baby') || name.includes('child') || name.includes('kid')) {
    return <Baby className="w-4 h-4" />;
  }
  if (name.includes('pet') || name.includes('dog') || name.includes('animal')) {
    return <Dog className="w-4 h-4" />;
  }
  
  // Climate Control
  if (name.includes('ac') || name.includes('air condition') || name.includes('cooling')) {
    return <Snowflake className="w-4 h-4" />;
  }
  if (name.includes('heating') || name.includes('heater')) {
    return <Wind className="w-4 h-4" />;
  }
  
  // Media & Entertainment
  if (name.includes('tv') || name.includes('television') || name.includes('cable')) {
    return <Tv className="w-4 h-4" />;
  }
  
  // Spa & Wellness
  if (name.includes('spa') || name.includes('massage') || name.includes('wellness')) {
    return <Bath className="w-4 h-4" />;
  }
  
  // Room Services
  if (name.includes('room service') || name.includes('housekeeping') || name.includes('concierge')) {
    return <Home className="w-4 h-4" />;
  }
  
  // Bathroom amenities
  if (name.includes('shower') || name.includes('bathroom') || name.includes('toiletries')) {
    return <ShowerHead className="w-4 h-4" />;
  }
  
  // Based on category
  if (category) {
    switch (category.toLowerCase()) {
      case 'technology':
        return <Wifi className="w-4 h-4" />;
      case 'recreation':
        return <Gamepad2 className="w-4 h-4" />;
      case 'comfort':
        return <Home className="w-4 h-4" />;
      case 'safety':
        return <Shield className="w-4 h-4" />;
      case 'transportation':
        return <Car className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  }
  
  // Default icon
  return <Star className="w-4 h-4" />;
}

export function PropertyManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isPolicyDialogOpen, setIsPolicyDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);
  const [expandedProperty, setExpandedProperty] = useState<number | null>(null);
  const [showAddAreaDialog, setShowAddAreaDialog] = useState(false);
  const [showAddStarRatingDialog, setShowAddStarRatingDialog] = useState(false);
  const [showAddReviewRatingDialog, setShowAddReviewRatingDialog] = useState(false);
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [newAreaForm, setNewAreaForm] = useState({
    cityName: "",
    areaName: "",
    pincode: "",
    description: ""
  });
  const [newStarRatingForm, setNewStarRatingForm] = useState({
    starRating: "",
    ratingName: "",
    description: ""
  });
  const [newReviewRatingForm, setNewReviewRatingForm] = useState({
    ratingRange: "",
    ratingLabel: "",
    description: ""
  });
  const [newCategoryForm, setNewCategoryForm] = useState({
    propertyType: "",
    categoryName: "",
    description: ""
  });
  
  // Dropdown open/close states
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [starRatingOpen, setStarRatingOpen] = useState(false);
  const [reviewRatingOpen, setReviewRatingOpen] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);

  // Photo uploader state
  const [showPhotoUploader, setShowPhotoUploader] = useState(false);
  const [selectedPropertyForPhotos, setSelectedPropertyForPhotos] = useState<Property | null>(null);

  const form = useForm<z.infer<typeof propertyFormSchema>>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      name: "",
      type: "hotel",
      location: "",
      address: "",
      city: "",
      area: "",
      pincode: "",
      description: "",

      availability: true,
      categoryId: undefined,
      currencyId: undefined,
      hotelStarRatingId: undefined,
      customerReviewRatingId: undefined,
      propertyAreaId: undefined,
      roomAmenityIds: [],
      hotelAmenityIds: [],
      roomTypeIds: [],
      roomTypeCounts: {},
      policyTemplateIds: []
    }
  });

  // Fetch properties
  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
    queryFn: async () => {
      const response = await fetch("/api/properties");
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    }
  });

  // Fetch master data for property relationships
  const { data: masterData, isLoading: isMasterDataLoading } = useQuery<PropertyMasterData>({
    queryKey: ["/api/properties/master-data"],
    queryFn: async () => {
      const response = await fetch("/api/properties/master-data");
      if (!response.ok) throw new Error('Failed to fetch master data');
      return response.json();
    }
  });

  // Fetch policy templates for policy management
  const { data: policies = [] } = useQuery({
    queryKey: ["/api/policy-templates"],
    queryFn: async () => {
      const response = await fetch("/api/policy-templates");
      if (!response.ok) throw new Error('Failed to fetch policies');
      return response.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: NewProperty) => {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        try {
          const responseText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch {
            errorData = { message: responseText };
          }
          
          if (response.status === 409 && errorData.type === "duplicate") {
            throw new Error(errorData.message);
          }
          throw new Error(errorData.message || `Failed to create property: ${response.status}`);
        } catch (error) {
          if (error instanceof Error) throw error;
          throw new Error(`Failed to create property: ${response.status}`);
        }
      }
      return response.json();
    },
    onSuccess: () => {
      // Force immediate cache invalidation and refetch
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      queryClient.refetchQueries({ queryKey: ["/api/properties"] });
      queryClient.refetchQueries({ queryKey: ["/api/stats/dashboard"] });
      setIsDialogOpen(false);
      setEditingProperty(null);
      form.reset();
      toast({ title: "Property created successfully", variant: "default" });
    },
    onError: (error: Error) => {
      console.error("Create error:", error);
      toast({ 
        title: "Failed to create property", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<NewProperty>) => {
      const response = await fetch(`/api/properties/${id}`, {
        method: "PUT", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        try {
          const responseText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch {
            errorData = { message: responseText };
          }
          
          if (response.status === 409 && errorData.type === "duplicate") {
            throw new Error(errorData.message);
          }
          throw new Error(errorData.message || `Failed to update property: ${response.status}`);
        } catch (error) {
          if (error instanceof Error) throw error;
          throw new Error(`Failed to update property: ${response.status}`);
        }
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Force immediate cache invalidation and refetch
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      queryClient.refetchQueries({ queryKey: ["/api/properties"] });
      queryClient.refetchQueries({ queryKey: ["/api/stats/dashboard"] });
      setIsDialogOpen(false);
      setEditingProperty(null);
      form.reset();
      toast({ title: "Property updated successfully", variant: "default" });
    },
    onError: (error: Error) => {
      console.error("Update error:", error);
      toast({ 
        title: "Failed to update property", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/properties/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error('Failed to delete property');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({ title: "Property deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete property", variant: "destructive" });
    }
  });


  // Create star rating mutation
  const createStarRatingMutation = useMutation({
    mutationFn: async (ratingData: typeof newStarRatingForm) => {
      const response = await fetch("/api/hotel-star-ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ratingData)
      });
      if (!response.ok) throw new Error("Failed to create star rating");
      return response.json();
    },
    onSuccess: (newRating) => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties/master-data"] });
      form.setValue("hotelStarRatingId", newRating.id);
      setShowAddStarRatingDialog(false);
      setNewStarRatingForm({ starRating: "", ratingName: "", description: "" });
      toast({ title: "Star rating created successfully!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create star rating", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Create review rating mutation
  const createReviewRatingMutation = useMutation({
    mutationFn: async (reviewData: typeof newReviewRatingForm) => {
      const response = await fetch("/api/customer-review-ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewData)
      });
      if (!response.ok) throw new Error("Failed to create review rating");
      return response.json();
    },
    onSuccess: (newReview) => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties/master-data"] });
      form.setValue("customerReviewRatingId", newReview.id);
      setShowAddReviewRatingDialog(false);
      setNewReviewRatingForm({ ratingRange: "", ratingLabel: "", description: "" });
      toast({ title: "Review rating created successfully!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create review rating", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Handle creating area from input
  const handleCreateAreaFromInput = async (inputValue: string, onChange: (value: number) => void) => {
    try {
      // Parse the input - expect format like "Area Name, City Name" or just "Area Name"
      const parts = inputValue.split(',').map(part => part.trim());
      const areaName = parts[0];
      const cityName = parts.length > 1 ? parts[1] : "Default City";
      
      const response = await fetch("/api/property-areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areaName,
          cityName,
          pincode: "",
          description: `Created from search: ${inputValue}`
        })
      });
      
      if (!response.ok) throw new Error("Failed to create area");
      const newArea = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/properties/master-data"] });
      onChange(newArea.id);
      toast({ title: `Area "${areaName}" created successfully!` });
    } catch (error: any) {
      toast({ 
        title: "Failed to create area", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  // Handle creating category from input
  const handleCreateCategoryFromInput = async (inputValue: string, onChange: (value: number) => void) => {
    try {
      const response = await fetch("/api/property-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyType: "hotel",
          categoryName: inputValue,
          description: `Created from search: ${inputValue}`
        })
      });
      
      if (!response.ok) throw new Error("Failed to create category");
      const newCategory = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/properties/master-data"] });
      onChange(newCategory.id);
      toast({ title: `Category "${inputValue}" created successfully!` });
    } catch (error: any) {
      toast({ 
        title: "Failed to create category", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  // Handle creating star rating from input
  const handleCreateStarRatingFromInput = async (inputValue: string, onChange: (value: number) => void) => {
    try {
      const starValue = parseInt(inputValue);
      if (isNaN(starValue) || starValue < 1 || starValue > 5) {
        toast({ 
          title: "Invalid star rating", 
          description: "Please enter a number between 1 and 5",
          variant: "destructive" 
        });
        return;
      }

      const response = await fetch("/api/hotel-star-ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          starRating: starValue,
          ratingName: `${starValue} Star`,
          description: `Created from search: ${inputValue}`
        })
      });
      
      if (!response.ok) throw new Error("Failed to create star rating");
      const newRating = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/properties/master-data"] });
      onChange(newRating.id);
      toast({ title: `${starValue} Star rating created successfully!` });
    } catch (error: any) {
      toast({ 
        title: "Failed to create star rating", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  // Handle creating review rating from input
  const handleCreateReviewRatingFromInput = async (inputValue: string, onChange: (value: number) => void) => {
    try {
      const response = await fetch("/api/customer-review-ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ratingRange: inputValue,
          ratingLabel: inputValue,
          description: `Created from search: ${inputValue}`
        })
      });
      
      if (!response.ok) throw new Error("Failed to create review rating");
      const newRating = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/properties/master-data"] });
      onChange(newRating.id);
      toast({ title: `Review rating "${inputValue}" created successfully!` });
    } catch (error: any) {
      toast({ 
        title: "Failed to create review rating", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: typeof newCategoryForm) => {
      const response = await fetch("/api/property-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryData)
      });
      if (!response.ok) throw new Error("Failed to create category");
      return response.json();
    },
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties/master-data"] });
      form.setValue("categoryId", newCategory.id);
      setShowAddCategoryDialog(false);
      setNewCategoryForm({ propertyType: "", categoryName: "", description: "" });
      toast({ title: "Category created successfully!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create category", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/properties/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedBy: 10 }) // RoomNest Admin user ID
      });
      if (!response.ok) throw new Error('Failed to approve property');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({ title: "Property approved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to approve property", variant: "destructive" });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number, reason: string }) => {
      const response = await fetch(`/api/properties/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectedBy: 10, rejectionReason: reason }) // RoomNest Admin user ID
      });
      if (!response.ok) throw new Error('Failed to reject property');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({ title: "Property rejected successfully" });
    },
    onError: () => {
      toast({ title: "Failed to reject property", variant: "destructive" });
    }
  });

  const onSubmit = (data: z.infer<typeof propertyFormSchema>) => {
    if (editingProperty) {
      updateMutation.mutate({ id: editingProperty.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    form.reset({
      name: property.name,
      type: property.type as "hotel" | "conference_room" | "flight" | "train" | "bus" | "taxi",
      location: property.location,
      address: property.address,
      city: property.city,
      area: property.area || "",
      pincode: property.pincode || "",
      description: property.description || "",
      hourlyRate: property.hourlyRate?.toString() || "",
      rating: property.rating?.toString() || "",
      reviewCount: property.reviewCount || 0,
      availability: property.availability ?? true,
      categoryId: property.categoryId || undefined,
      capacity: property.capacity || 0,
      distanceFromLandmarks: property.distanceFromLandmarks,
      houseRules: property.houseRules || [],
      cancellationPolicy: property.cancellationPolicy,
      coordinates: property.coordinates,
      departureLocation: property.departureLocation || "",
      arrivalLocation: property.arrivalLocation || "",
      departureTime: property.departureTime ? String(property.departureTime) : "",
      arrivalTime: property.arrivalTime ? String(property.arrivalTime) : "",
      duration: property.duration || "",
      operatorName: property.operatorName || "",
      vehicleNumber: property.vehicleNumber || "",
      vehicleType: property.vehicleType || "",
      seatTypes: property.seatTypes,
      totalSeats: property.totalSeats || 0,
      availableSeats: property.availableSeats || 0,
      stops: property.stops,
      baggage: property.baggage,
      operatorLogo: property.operatorLogo || "",
      taxiType: property.taxiType || "",
      driverName: property.driverName || "",
      driverPhone: property.driverPhone || "",
      vehicleModel: property.vehicleModel || "",
      licensePlate: property.licensePlate || "",
      ratePerKm: property.ratePerKm?.toString() || "",
      baseFare: property.baseFare?.toString() || "",
      currencyId: property.currencyId || undefined,
      hotelStarRatingId: property.hotelStarRatingId || undefined,
      customerReviewRatingId: property.customerReviewRatingId || undefined,
      propertyAreaId: property.propertyAreaId || undefined,
      roomAmenityIds: property.roomAmenityIds || [],
      hotelAmenityIds: property.hotelAmenityIds || [],
      roomTypeIds: property.roomTypeIds || [],
      roomTypeCounts: property.roomTypeCounts || {},
      policyTemplateIds: property.policyTemplateIds || [],
      approvalStatus: property.approvalStatus || "pending",
      approvedBy: property.approvedBy || undefined,
      approvedAt: property.approvedAt ? String(property.approvedAt) : "",
      rejectionReason: property.rejectionReason || "",
      metadata: property.metadata
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingProperty(null);
    form.reset({
      name: "",
      type: "hotel",
      location: "",
      address: "",
      city: "",
      area: "",
      pincode: "",
      description: "",

      availability: true,
      categoryId: undefined,
      currencyId: undefined,
      hotelStarRatingId: undefined,
      customerReviewRatingId: undefined,
      propertyAreaId: undefined,
      roomAmenityIds: [],
      hotelAmenityIds: [],
      roomTypeIds: [],
      roomTypeCounts: {},
      policyTemplateIds: []
    });
    setIsDialogOpen(true);
  };

  if (isLoading || isMasterDataLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Hotel className="h-5 w-5" />
              Property Management
            </CardTitle>
            <Button onClick={handleAdd} className="bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)]">
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Star Rating</TableHead>
                  <TableHead>Review Rating</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Total Rooms</TableHead>
                  <TableHead>Policies</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead>Media</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => (
                  <React.Fragment key={property.id}>
                    <TableRow>
                    <TableCell className="font-medium">{property.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {property.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{property.location}</TableCell>
                    <TableCell>
                      {masterData?.hotelStarRatings.find(r => r.id === property.hotelStarRatingId)?.starRating ? 
                        `${masterData.hotelStarRatings.find(r => r.id === property.hotelStarRatingId)?.starRating} Star` : "N/A"}
                    </TableCell>
                    <TableCell>
                      {property.customerReviewRatingId ? 
                        (() => {
                          const rating = masterData?.customerReviews.find(r => r.id === property.customerReviewRatingId);
                          return rating ? (
                            <Badge variant="outline" className="text-xs">
                              {rating.ratingRange}
                            </Badge>
                          ) : "Invalid Rating";
                        })() 
                        : "No Rating"}
                    </TableCell>
                    <TableCell>
                      {masterData?.propertyAreas.find(a => a.id === property.propertyAreaId)?.areaName || "N/A"}
                    </TableCell>
                    <TableCell>
                      {property.roomTypeIds && property.roomTypeIds.length > 0 ? (
                        (() => {
                          // Calculate total rooms across all room types
                          const totalRooms = property.roomTypeIds.reduce((total, roomTypeId) => {
                            const count = (property.roomTypeCounts as Record<number, number>)?.[roomTypeId] || 0;
                            return total + count;
                          }, 0);
                          
                          return (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-sm font-medium">
                                {totalRooms} rooms
                              </Badge>
                              <span className="text-xs text-gray-500">
                                ({property.roomTypeIds.length} types)
                              </span>
                            </div>
                          );
                        })()
                      ) : (
                        <span className="text-gray-500 text-sm">No rooms configured</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {property.policyTemplateIds && property.policyTemplateIds.length > 0 ? (
                        <div className="space-y-1">
                          {property.policyTemplateIds.slice(0, 2).map((policyId) => {
                            const policy = masterData?.policyTemplates.find(p => p.id === policyId);
                            return policy ? (
                              <Badge key={policyId} variant="outline" className="text-xs capitalize">
                                {policy.policyType}
                              </Badge>
                            ) : null;
                          })}
                          {property.policyTemplateIds.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{property.policyTemplateIds.length - 2} more
                            </div>
                          )}
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingProperty(property);
                            setIsDialogOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Policies
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          property.approvalStatus === "approved" ? "default" : 
                          property.approvalStatus === "rejected" ? "destructive" : 
                          "secondary"
                        }
                        className={
                          property.approvalStatus === "approved" ? "bg-green-100 text-green-800" : 
                          property.approvalStatus === "rejected" ? "bg-red-100 text-red-800" : 
                          "bg-yellow-100 text-yellow-800"
                        }
                      >
                        <div className="flex items-center gap-1">
                          {property.approvalStatus === "approved" && <CheckCircle className="h-3 w-3" />}
                          {property.approvalStatus === "rejected" && <XCircle className="h-3 w-3" />}
                          {property.approvalStatus === "pending" && <Clock className="h-3 w-3" />}
                          {property.approvalStatus === "approved" ? "Approved" : 
                           property.approvalStatus === "rejected" ? "Rejected" : 
                           "Pending"}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            console.log('Editing property:', property.id, property.name);
                            handleEdit(property);
                          }}
                          data-testid={`button-edit-${property.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {property.approvalStatus === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => approveMutation.mutate(property.id)}
                              className="text-green-600 hover:text-green-800 hover:bg-green-50"
                              data-testid={`button-approve-${property.id}`}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const reason = prompt("Please provide a rejection reason:");
                                if (reason) {
                                  rejectMutation.mutate({ id: property.id, reason });
                                }
                              }}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              data-testid={`button-reject-${property.id}`}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(property.id)}
                          data-testid={`button-delete-${property.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedProperty(
                          expandedProperty === property.id ? null : property.id
                        )}
                        data-testid={`button-room-media-${property.id}`}
                      >
                        <Camera className="h-4 w-4 mr-1" />
                        {expandedProperty === property.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedProperty === property.id && property.roomTypeIds && property.roomTypeIds.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="p-0">
                        <div className="p-6 bg-gray-50 border-t">
                          {/* Property Level Photos & Videos */}
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-lg font-medium flex items-center gap-2">
                                <Image className="h-5 w-5" />
                                Property Photos & Videos - {property.name}
                              </h4>
                              <Button
                                onClick={() => {
                                  setSelectedPropertyForPhotos(property);
                                  setShowPhotoUploader(true);
                                }}
                                className="bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)]"
                                size="sm"
                                data-testid={`button-upload-property-photos-${property.id}`}
                              >
                                <Camera className="h-4 w-4 mr-2" />
                                Upload Property Media
                              </Button>
                            </div>
                            <div className="p-4 bg-white rounded border border-gray-200 mb-4">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 rounded">
                                  <Building className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900 mb-1">
                                    🏨 Property Elevation & Main Photos for Booking Portal
                                  </p>
                                  <p className="text-sm text-gray-600 mb-2">
                                    These photos will be displayed to customers on the booking portal when they search for properties.
                                  </p>
                                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                                    <span>• Building exterior & elevation</span>
                                    <span>• Main entrance & facade</span>
                                    <span>• Lobby & reception area</span>
                                    <span>• Key amenities (pool, restaurant, gym)</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Property Photo Gallery */}
                            <PropertyPhotoGallery 
                              propertyId={property.id} 
                              propertyName={property.name} 
                            />
                          </div>

                          {/* Room Photos & Videos */}
                          <div>
                            <div className="flex items-center gap-3 mb-4">
                              <h4 className="text-lg font-medium flex items-center gap-2">
                                <Camera className="h-5 w-5" />
                                Room Type Photos & Videos - {property.name}
                              </h4>
                            </div>
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded mb-4">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-white rounded">
                                  <Bed className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-blue-900 mb-1">
                                    🛏️ Room-Specific Photos for Booking Portal
                                  </p>
                                  <p className="text-sm text-blue-700">
                                    Upload photos for each room type. Customers will see these when selecting room categories during booking.
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-6">
                              {property.roomTypeIds.map((roomTypeId) => {
                                const roomType = masterData?.roomTypes.find(rt => rt.id === roomTypeId);
                                if (!roomType) return null;
                                
                                return (
                                  <RoomMediaManager
                                    key={roomTypeId}
                                    roomTypeId={roomTypeId}
                                    roomTypeName={roomType.roomTypeName}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProperty ? "Edit Property" : "Add Property"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-property-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-property-type">
                            <SelectValue placeholder="Select property type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hotel">Hotel</SelectItem>
                          <SelectItem value="conference_room">Conference Room</SelectItem>
                          <SelectItem value="flight">Flight</SelectItem>
                          <SelectItem value="train">Train</SelectItem>
                          <SelectItem value="bus">Bus</SelectItem>
                          <SelectItem value="taxi">Taxi</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Category</FormLabel>
                      <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="combobox-property-category"
                            >
                              {field.value
                                ? (masterData as any)?.propertyCategories?.find((cat: any) => cat.id === field.value)?.categoryName
                                : "Type to search or create category..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Type category name..." />
                            <CommandList>
                              <CommandEmpty>
                                <div className="p-2">
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-start"
                                    onClick={() => {
                                      const input = document.querySelector('[cmdk-input]') as HTMLInputElement;
                                      const value = input?.value?.trim();
                                      if (value) {
                                        handleCreateCategoryFromInput(value, field.onChange);
                                        setCategoryOpen(false);
                                      }
                                    }}
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create category
                                  </Button>
                                </div>
                              </CommandEmpty>
                              <CommandGroup>
                                {(masterData as any)?.propertyCategories?.map((category: any) => (
                                  <CommandItem
                                    key={category.id}
                                    value={category.categoryName}
                                    onSelect={() => {
                                      field.onChange(category.id);
                                      setCategoryOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === category.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {category.categoryName}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currencyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : null)} 
                              value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger data-testid="select-currency">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {masterData?.currencies.map((currency) => (
                            <SelectItem key={currency.id} value={currency.id.toString()}>
                              {currency.currencyName} ({currency.shortName})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hotelStarRatingId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hotel Star Rating</FormLabel>
                      <Popover open={starRatingOpen} onOpenChange={setStarRatingOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="combobox-star-rating"
                            >
                              {field.value
                                ? (() => {
                                    const rating = masterData?.hotelStarRatings.find((r) => r.id === field.value);
                                    return rating ? `${rating.starRating} Star - ${rating.ratingName}` : "";
                                  })()
                                : "Type star rating (1-5) to create..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Type star rating (1-5)..." />
                            <CommandList>
                              <CommandEmpty>
                                <div className="p-2">
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-start"
                                    onClick={() => {
                                      const input = document.querySelector('[cmdk-input]') as HTMLInputElement;
                                      const value = input?.value?.trim();
                                      if (value) {
                                        handleCreateStarRatingFromInput(value, field.onChange);
                                        setStarRatingOpen(false);
                                      }
                                    }}
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create star rating
                                  </Button>
                                </div>
                              </CommandEmpty>
                              <CommandGroup>
                                {masterData?.hotelStarRatings.map((rating) => (
                                  <CommandItem
                                    key={rating.id}
                                    value={`${rating.starRating} Star - ${rating.ratingName}`}
                                    onSelect={() => {
                                      field.onChange(rating.id);
                                      setStarRatingOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === rating.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {rating.starRating} Star - {rating.ratingName}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerReviewRatingId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Review Rating</FormLabel>
                      <Popover open={reviewRatingOpen} onOpenChange={setReviewRatingOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="combobox-review-rating"
                            >
                              {field.value
                                ? (() => {
                                    const rating = masterData?.customerReviews.find((r) => r.id === field.value);
                                    return rating ? `${rating.ratingRange} - ${rating.ratingLabel}` : "";
                                  })()
                                : "Type rating range to create..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Type rating range..." />
                            <CommandList>
                              <CommandEmpty>
                                <div className="p-2">
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-start"
                                    onClick={() => {
                                      const input = document.querySelector('[cmdk-input]') as HTMLInputElement;
                                      const value = input?.value?.trim();
                                      if (value) {
                                        handleCreateReviewRatingFromInput(value, field.onChange);
                                        setReviewRatingOpen(false);
                                      }
                                    }}
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create review rating
                                  </Button>
                                </div>
                              </CommandEmpty>
                              <CommandGroup>
                                {masterData?.customerReviews.map((review) => (
                                  <CommandItem
                                    key={review.id}
                                    value={`${review.ratingRange} - ${review.ratingLabel}`}
                                    onSelect={() => {
                                      field.onChange(review.id);
                                      setReviewRatingOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === review.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {review.ratingRange} - {review.ratingLabel}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="propertyAreaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Area</FormLabel>
                      <Popover open={areaOpen} onOpenChange={setAreaOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="combobox-property-area"
                            >
                              {field.value
                                ? masterData?.propertyAreas?.find((area) => area.id === field.value)?.areaName + ", " + 
                                  masterData?.propertyAreas?.find((area) => area.id === field.value)?.cityName
                                : "Type to search or create area..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Type area name..." />
                            <CommandList>
                              <CommandEmpty>
                                <div className="p-2">
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-start"
                                    onClick={() => {
                                      const input = document.querySelector('[cmdk-input]') as HTMLInputElement;
                                      const value = input?.value?.trim();
                                      const selectedCity = form.getValues("city");
                                      if (value && selectedCity) {
                                        handleCreateAreaFromInput(`${value}, ${selectedCity}`, field.onChange);
                                        setAreaOpen(false);
                                      } else if (value) {
                                        handleCreateAreaFromInput(value, field.onChange);
                                        setAreaOpen(false);
                                      }
                                    }}
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create area
                                  </Button>
                                </div>
                              </CommandEmpty>
                              <CommandGroup>
                                {masterData?.propertyAreas
                                  ?.filter((area) => {
                                    const selectedCity = form.getValues("city");
                                    return !selectedCity || area.cityName.toLowerCase().includes(selectedCity.toLowerCase());
                                  })
                                  ?.map((area) => (
                                  <CommandItem
                                    key={area.id}
                                    value={`${area.areaName}, ${area.cityName}`}
                                    onSelect={() => {
                                      field.onChange(area.id);
                                      setAreaOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === area.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {area.areaName}, {area.cityName}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pincode</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-pincode" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="textarea-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="textarea-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="availability"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-6">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-availability"
                        />
                      </FormControl>
                      <FormLabel>Available</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              {/* Room Amenities */}
              <div className="space-y-4">
                <Label>Room Amenities</Label>
                <FormField
                  control={form.control}
                  name="roomAmenityIds"
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-4">
                      {masterData?.roomAmenities.map((amenity) => {
                        const isSelected = field.value?.includes(amenity.id) || false;
                        return (
                          <div
                            key={amenity.id}
                            onClick={() => {
                              const current = field.value || [];
                              if (isSelected) {
                                field.onChange(current.filter(id => id !== amenity.id));
                              } else {
                                field.onChange([...current, amenity.id]);
                              }
                            }}
                            className="flex flex-col items-center gap-2 p-3 rounded border cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 min-w-[100px] max-w-[120px]"
                          >
                            <div className={`p-2 rounded-full transition-all duration-200 ${
                              isSelected 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                              {getAmenityIcon(amenity.amenityName, amenity.category)}
                            </div>
                            <span className="text-xs text-center font-medium leading-tight">
                              {amenity.amenityName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                />
              </div>

              {/* Hotel Amenities */}
              <div className="space-y-4">
                <Label>Hotel Amenities</Label>
                <FormField
                  control={form.control}
                  name="hotelAmenityIds"
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-4">
                      {masterData?.hotelAmenities.map((amenity) => {
                        const isSelected = field.value?.includes(amenity.id) || false;
                        return (
                          <div
                            key={amenity.id}
                            onClick={() => {
                              const current = field.value || [];
                              if (isSelected) {
                                field.onChange(current.filter(id => id !== amenity.id));
                              } else {
                                field.onChange([...current, amenity.id]);
                              }
                            }}
                            className="flex flex-col items-center gap-2 p-3 rounded border cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 min-w-[100px] max-w-[120px]"
                          >
                            <div className={`p-2 rounded-full transition-all duration-200 ${
                              isSelected 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                              {getAmenityIcon(amenity.amenityName, amenity.category)}
                            </div>
                            <span className="text-xs text-center font-medium leading-tight">
                              {amenity.amenityName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                />
              </div>

              {/* Room Types with Counts */}
              <div className="space-y-4">
                <Label>Room Types & Counts</Label>
                <FormField
                  control={form.control}
                  name="roomTypeIds"
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-4">
                      {masterData?.roomTypes
                        .filter(roomType => roomType.roomTypeName && roomType.roomTypeName.trim().length > 0)
                        .map((roomType) => {
                          const isSelected = field.value?.includes(roomType.id) || false;
                          return (
                            <div
                              key={roomType.id}
                              onClick={() => {
                                const current = field.value || [];
                                const currentCounts = form.getValues("roomTypeCounts") || {};
                                
                                if (isSelected) {
                                  field.onChange(current.filter(id => id !== roomType.id));
                                  // Remove count when room type is deselected
                                  const { [roomType.id]: removed, ...remainingCounts } = currentCounts;
                                  form.setValue("roomTypeCounts", remainingCounts);
                                } else {
                                  field.onChange([...current, roomType.id]);
                                  // Set default count of 1 when room type is selected
                                  form.setValue("roomTypeCounts", {
                                    ...currentCounts,
                                    [roomType.id]: 1
                                  });
                                }
                              }}
                              className="flex flex-col items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 min-w-[140px] max-w-[160px]"
                              data-testid={`card-roomtype-${roomType.id}`}
                            >
                              <div className={`p-3 rounded-full transition-all duration-200 ${
                                isSelected 
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                              }`}>
                                <Bed className="w-5 h-5" />
                              </div>
                              <span className="text-sm text-center font-medium leading-tight">
                                {roomType.roomTypeName}
                              </span>
                              {isSelected && (
                                <FormField
                                  control={form.control}
                                  name="roomTypeCounts"
                                  render={({ field: countField }) => (
                                    <Input
                                      type="number"
                                      min="1"
                                      placeholder="Count"
                                      value={countField.value?.[roomType.id] || 1}
                                      onChange={(e) => {
                                        const newCount = parseInt(e.target.value) || 1;
                                        countField.onChange({
                                          ...countField.value,
                                          [roomType.id]: newCount
                                        });
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-center w-16 h-8 text-xs"
                                      data-testid={`input-roomcount-${roomType.id}`}
                                    />
                                  )}
                                />
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                />
              </div>

              {/* Policy Templates */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label>Policy Templates (Optional)</Label>
                  <p className="text-sm text-gray-500">Select policies that apply to this property. Leave unselected if no specific policies are needed.</p>
                </div>
                <FormField
                  control={form.control}
                  name="policyTemplateIds"
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-4">
                      {masterData?.policyTemplates.length === 0 ? (
                        <div className="text-sm text-gray-500 italic p-4 border rounded-lg w-full text-center">
                          No policy templates available. You can create policies in the Policy Master section.
                        </div>
                      ) : (
                        masterData?.policyTemplates.map((policy) => {
                        const isSelected = field.value?.includes(policy.id) || false;
                        return (
                          <div
                            key={policy.id}
                            className="flex flex-col gap-3 p-4 rounded-lg border transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 min-w-[200px] max-w-[250px]"
                          >
                            <div
                              onClick={() => {
                                const current = field.value || [];
                                if (isSelected) {
                                  field.onChange(current.filter(id => id !== policy.id));
                                } else {
                                  field.onChange([...current, policy.id]);
                                }
                              }}
                              className="flex items-center gap-3 cursor-pointer"
                            >
                              <div className={`p-2 rounded-full transition-all duration-200 ${
                                isSelected 
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                              }`}>
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-medium">{policy.policyTitle}</div>
                                <div className="text-xs text-gray-500 capitalize">{policy.policyType}</div>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="space-y-2">
                                <div className="flex gap-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingPolicy(policy);
                                      setIsPolicyDialogOpen(true);
                                    }}
                                    className="flex-1 text-xs"
                                  >
                                    <Edit className="w-3 h-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // Open policy in read-only mode to view full content
                                      setEditingPolicy({ ...policy, readOnly: true });
                                      setIsPolicyDialogOpen(true);
                                    }}
                                    className="flex-1 text-xs"
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    View
                                  </Button>
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">
                                  {policy.policyContent ? 
                                    policy.policyContent.replace(/<[^>]*>/g, '').substring(0, 100) + '...' 
                                    : 'No content available'
                                  }
                                </div>
                              </div>
                            )}
                          </div>
                        );
                        })
                      )}
                    </div>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)]"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : 
                   editingProperty ? "Update Property" : "Create Property"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Policy Template Dialog */}
      <Dialog open={isPolicyDialogOpen} onOpenChange={setIsPolicyDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPolicy ? "Edit Policy Template" : "Add Policy Template"}
            </DialogTitle>
          </DialogHeader>
          <PolicyTemplateForm 
            policy={editingPolicy}
            onClose={() => {
              setIsPolicyDialogOpen(false);
              setEditingPolicy(null);
            }}
            onSave={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/policy-templates"] });
              queryClient.invalidateQueries({ queryKey: ["/api/properties/master-data"] });
              queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
              setIsPolicyDialogOpen(false);
              setEditingPolicy(null);
              toast({ title: editingPolicy ? "Policy updated successfully" : "Policy created successfully" });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Add New Area Dialog */}
      <Dialog open={showAddAreaDialog} onOpenChange={setShowAddAreaDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[hsl(213_94%_25%)]">Add New Area</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newCityName">City Name</Label>
              <Input
                id="newCityName"
                value={newAreaForm.cityName}
                onChange={(e) => setNewAreaForm({ ...newAreaForm, cityName: e.target.value })}
                placeholder="Enter city name"
                data-testid="input-new-city"
              />
            </div>
            <div>
              <Label htmlFor="newAreaName">Area Name</Label>
              <Input
                id="newAreaName"
                value={newAreaForm.areaName}
                onChange={(e) => setNewAreaForm({ ...newAreaForm, areaName: e.target.value })}
                placeholder="Enter area name"
                data-testid="input-new-area"
              />
            </div>
            <div>
              <Label htmlFor="newPincode">Pincode</Label>
              <Input
                id="newPincode"
                value={newAreaForm.pincode}
                onChange={(e) => setNewAreaForm({ ...newAreaForm, pincode: e.target.value })}
                placeholder="Enter pincode"
                data-testid="input-new-pincode"
              />
            </div>
            <div>
              <Label htmlFor="newDescription">Description (Optional)</Label>
              <Textarea
                id="newDescription"
                value={newAreaForm.description}
                onChange={(e) => setNewAreaForm({ ...newAreaForm, description: e.target.value })}
                placeholder="Enter area description"
                data-testid="textarea-new-description"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowAddAreaDialog(false);
                  setNewAreaForm({ cityName: "", areaName: "", pincode: "", description: "" });
                }}
                data-testid="button-cancel-area"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // Handle area creation inline for now
                  const createAreaData = async () => {
                    try {
                      const response = await fetch("/api/property-areas", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(newAreaForm)
                      });
                      if (!response.ok) throw new Error("Failed to create area");
                      const newArea = await response.json();
                      queryClient.invalidateQueries({ queryKey: ["/api/properties/master-data"] });
                      setShowAddAreaDialog(false);
                      setNewAreaForm({ cityName: "", areaName: "", pincode: "", description: "" });
                      toast({ title: "Area created successfully!" });
                    } catch (error: any) {
                      toast({ 
                        title: "Failed to create area", 
                        description: error.message,
                        variant: "destructive" 
                      });
                    }
                  };
                  createAreaData();
                }}
                disabled={!newAreaForm.cityName || !newAreaForm.areaName || !newAreaForm.pincode}
                className="bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)]"
                data-testid="button-save-area"
              >
                Create Area
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add New Star Rating Dialog */}
      <Dialog open={showAddStarRatingDialog} onOpenChange={setShowAddStarRatingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[hsl(213_94%_25%)]">Add New Star Rating</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newStarRating">Star Rating</Label>
              <Select onValueChange={(value) => setNewStarRatingForm({ ...newStarRatingForm, starRating: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select star rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Star</SelectItem>
                  <SelectItem value="2">2 Star</SelectItem>
                  <SelectItem value="3">3 Star</SelectItem>
                  <SelectItem value="4">4 Star</SelectItem>
                  <SelectItem value="5">5 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="newRatingName">Rating Name</Label>
              <Input
                id="newRatingName"
                value={newStarRatingForm.ratingName}
                onChange={(e) => setNewStarRatingForm({ ...newStarRatingForm, ratingName: e.target.value })}
                placeholder="e.g., Budget, Standard, Luxury"
                data-testid="input-rating-name"
              />
            </div>
            <div>
              <Label htmlFor="newRatingDescription">Description (Optional)</Label>
              <Textarea
                id="newRatingDescription"
                value={newStarRatingForm.description}
                onChange={(e) => setNewStarRatingForm({ ...newStarRatingForm, description: e.target.value })}
                placeholder="Enter rating description"
                data-testid="textarea-rating-description"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowAddStarRatingDialog(false);
                  setNewStarRatingForm({ starRating: "", ratingName: "", description: "" });
                }}
                data-testid="button-cancel-star-rating"
              >
                Cancel
              </Button>
              <Button
                onClick={() => createStarRatingMutation.mutate(newStarRatingForm)}
                disabled={!newStarRatingForm.starRating || !newStarRatingForm.ratingName || createStarRatingMutation.isPending}
                className="bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)]"
                data-testid="button-save-star-rating"
              >
                {createStarRatingMutation.isPending ? "Creating..." : "Create Rating"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add New Review Rating Dialog */}
      <Dialog open={showAddReviewRatingDialog} onOpenChange={setShowAddReviewRatingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[hsl(213_94%_25%)]">Add New Review Rating</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newRatingRange">Rating Range</Label>
              <Select onValueChange={(value) => setNewReviewRatingForm({ ...newReviewRatingForm, ratingRange: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rating range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1.0-2.0">1.0 - 2.0</SelectItem>
                  <SelectItem value="2.0-3.0">2.0 - 3.0</SelectItem>
                  <SelectItem value="3.0-4.0">3.0 - 4.0</SelectItem>
                  <SelectItem value="4.0-4.5">4.0 - 4.5</SelectItem>
                  <SelectItem value="4.5-5.0">4.5 - 5.0</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="newRatingLabel">Rating Label</Label>
              <Input
                id="newRatingLabel"
                value={newReviewRatingForm.ratingLabel}
                onChange={(e) => setNewReviewRatingForm({ ...newReviewRatingForm, ratingLabel: e.target.value })}
                placeholder="e.g., Poor, Good, Excellent"
                data-testid="input-rating-label"
              />
            </div>
            <div>
              <Label htmlFor="newReviewDescription">Description (Optional)</Label>
              <Textarea
                id="newReviewDescription"
                value={newReviewRatingForm.description}
                onChange={(e) => setNewReviewRatingForm({ ...newReviewRatingForm, description: e.target.value })}
                placeholder="Enter rating description"
                data-testid="textarea-review-description"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowAddReviewRatingDialog(false);
                  setNewReviewRatingForm({ ratingRange: "", ratingLabel: "", description: "" });
                }}
                data-testid="button-cancel-review-rating"
              >
                Cancel
              </Button>
              <Button
                onClick={() => createReviewRatingMutation.mutate(newReviewRatingForm)}
                disabled={!newReviewRatingForm.ratingRange || !newReviewRatingForm.ratingLabel || createReviewRatingMutation.isPending}
                className="bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)]"
                data-testid="button-save-review-rating"
              >
                {createReviewRatingMutation.isPending ? "Creating..." : "Create Rating"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add New Category Dialog */}
      <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[hsl(213_94%_25%)]">Add New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPropertyType">Property Type</Label>
              <Select onValueChange={(value) => setNewCategoryForm({ ...newCategoryForm, propertyType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="conference_room">Conference Room</SelectItem>
                  <SelectItem value="flight">Flight</SelectItem>
                  <SelectItem value="train">Train</SelectItem>
                  <SelectItem value="bus">Bus</SelectItem>
                  <SelectItem value="taxi">Taxi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="newCategoryName">Category Name</Label>
              <Input
                id="newCategoryName"
                value={newCategoryForm.categoryName}
                onChange={(e) => setNewCategoryForm({ ...newCategoryForm, categoryName: e.target.value })}
                placeholder="e.g., Luxury, Budget, Executive"
                data-testid="input-category-name"
              />
            </div>
            <div>
              <Label htmlFor="newCategoryDescription">Description (Optional)</Label>
              <Textarea
                id="newCategoryDescription"
                value={newCategoryForm.description}
                onChange={(e) => setNewCategoryForm({ ...newCategoryForm, description: e.target.value })}
                placeholder="Enter category description"
                data-testid="textarea-category-description"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowAddCategoryDialog(false);
                  setNewCategoryForm({ propertyType: "", categoryName: "", description: "" });
                }}
                data-testid="button-cancel-category"
              >
                Cancel
              </Button>
              <Button
                onClick={() => createCategoryMutation.mutate(newCategoryForm)}
                disabled={!newCategoryForm.propertyType || !newCategoryForm.categoryName || createCategoryMutation.isPending}
                className="bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)]"
                data-testid="button-save-category"
              >
                {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Property Photo Uploader */}
      {selectedPropertyForPhotos && (
        <UniversalPhotoUploader
          entityType="property"
          entityId={selectedPropertyForPhotos.id}
          isOpen={showPhotoUploader}
          onClose={() => {
            setShowPhotoUploader(false);
            setSelectedPropertyForPhotos(null);
          }}
          onUploadComplete={(uploadedPhotos) => {
            toast({
              title: "Property Media Upload Complete",
              description: `${uploadedPhotos.length} photos/videos uploaded successfully for ${selectedPropertyForPhotos.name}`,
            });
            setShowPhotoUploader(false);
            setSelectedPropertyForPhotos(null);
          }}
          title={`Property Media - ${selectedPropertyForPhotos.name}`}
          allowedCategories={[
            { value: "elevation", label: "Building Elevation", description: "Main building exterior and facade - primary booking portal photo" },
            { value: "entrance", label: "Main Entrance", description: "Property entrance and approach - first impression for customers" },
            { value: "lobby", label: "Lobby & Reception", description: "Reception area and main lobby - booking portal showcase" },
            { value: "amenities", label: "Key Amenities", description: "Pool, gym, restaurant - booking portal highlights" },
            { value: "overview", label: "Property Overview", description: "General property showcase for booking portal" },
            { value: "exterior_views", label: "Exterior Views", description: "Additional building views and surroundings" }
          ]}
          maxPhotos={20}
        />
      )}
    </>
  );
}

// Policy Template Form Component  
function PolicyTemplateForm({ 
  policy, 
  onClose, 
  onSave 
}: { 
  policy: any; 
  onClose: () => void; 
  onSave: () => void; 
}) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Import the schema for validation
  const policyFormSchema = z.object({
    policyType: z.string().min(1, "Policy type is required"),
    policyTitle: z.string().min(1, "Policy title is required").refine(
      (val) => val.trim().length > 0, 
      { message: "Policy title cannot be empty or contain only spaces" }
    ),
    policyContent: z.string().min(1, "Policy content is required").refine(
      (val) => val.trim().length > 0, 
      { message: "Policy content cannot be empty or contain only spaces" }
    ),
    templateFormat: z.string().default("html"),
    applicableFor: z.array(z.string()).min(1, "At least one service must be selected"),
    isDefault: z.boolean().default(false),
    version: z.string().min(1, "Version is required"),
    effectiveDate: z.string().min(1, "Effective date is required"),
    expiryDate: z.string().optional(),
    approvalStatus: z.string().default("draft")
  });
  
  const form = useForm<z.infer<typeof policyFormSchema>>({
    resolver: zodResolver(policyFormSchema),
    defaultValues: {
      policyType: policy?.policyType || "cancellation",
      policyTitle: policy?.policyTitle || "",
      policyContent: policy?.policyContent || "",
      templateFormat: policy?.templateFormat || "html",
      applicableFor: policy?.applicableFor || ["hotel"],
      isDefault: policy?.isDefault || false,
      version: policy?.version || "1.0",
      effectiveDate: policy?.effectiveDate ? new Date(policy.effectiveDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      expiryDate: policy?.expiryDate ? new Date(policy.expiryDate).toISOString().split('T')[0] : "",
      approvalStatus: policy?.approvalStatus || "draft"
    }
  });

  const onSubmit = async (data: z.infer<typeof policyFormSchema>) => {
    setIsSubmitting(true);
    try {
      // Validate rich text content isn't just empty HTML tags
      const contentText = data.policyContent.replace(/<[^>]*>/g, '').trim();
      if (!contentText) {
        form.setError("policyContent", { 
          type: "manual", 
          message: "Policy content cannot be empty" 
        });
        form.setFocus("policyContent");
        setIsSubmitting(false);
        return;
      }

      const url = policy ? `/api/policy-templates/${policy.id}` : "/api/policy-templates";
      const method = policy ? "PATCH" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.errors && Array.isArray(errorData.errors)) {
          // Handle Zod validation errors from server
          const firstError = errorData.errors[0];
          const fieldName = firstError.path?.[0];
          const message = firstError.message;
          
          if (fieldName && form.setError) {
            form.setError(fieldName as any, { type: "manual", message });
            form.setFocus(fieldName as any);
          }
          
          toast({ 
            title: "Validation Error", 
            description: `${fieldName ? `${fieldName}: ` : ''}${message}`,
            variant: "destructive" 
          });
        } else {
          throw new Error(errorData.message || 'Failed to save policy template');
        }
        setIsSubmitting(false);
        return;
      }
      
      onSave();
    } catch (error) {
      console.error("Policy save error:", error);
      toast({ 
        title: "Failed to save policy template", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    }
    setIsSubmitting(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="policyType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Policy Type *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className={form.formState.errors.policyType ? 'border-red-500 focus:border-red-500' : ''}>
                      <SelectValue placeholder="Select policy type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="cancellation">Cancellation Policy</SelectItem>
                    <SelectItem value="house_rules">House Rules</SelectItem>
                    <SelectItem value="refund">Refund Policy</SelectItem>
                    <SelectItem value="privacy">Privacy Policy</SelectItem>
                    <SelectItem value="terms">Terms & Conditions</SelectItem>
                    <SelectItem value="check_in">Check-in Policy</SelectItem>
                    <SelectItem value="payment">Payment Policy</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="policyTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Policy Title *</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="e.g., Standard Cancellation Policy" 
                    className={form.formState.errors.policyTitle ? 'border-red-500 focus:border-red-500' : ''}
                    data-testid="input-policy-title"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="policyContent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Policy Content *</FormLabel>
              <FormControl>
                <div className={`rich-text-editor ${form.formState.errors.policyContent ? 'border-red-500' : ''}`}>
                  <ReactQuill
                    theme="snow"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Enter the detailed policy content here..."
                    modules={{
                      toolbar: [
                        [{ 'header': ['1', '2', '3', '4', '5', '6', false] }],
                        [{ 'font': [] }],
                        [{ 'size': ['small', false, 'large', 'huge'] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'script': 'sub'}, { 'script': 'super' }],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'indent': '-1'}, { 'indent': '+1' }],
                        [{ 'direction': 'rtl' }],
                        [{ 'align': [] }],
                        ['link', 'image', 'video'],
                        ['blockquote', 'code-block'],
                        ['clean']
                      ],
                    }}
                    formats={[
                      'header', 'font', 'size',
                      'bold', 'italic', 'underline', 'strike', 'blockquote',
                      'list', 'bullet', 'indent',
                      'link', 'image', 'video',
                      'align', 'color', 'background',
                      'script', 'code-block', 'direction'
                    ]}
                    style={{
                      height: '300px',
                      marginBottom: '42px'
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="version"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Version *</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="1.0" 
                    className={form.formState.errors.version ? 'border-red-500 focus:border-red-500' : ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="effectiveDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Effective Date *</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="date" 
                    className={form.formState.errors.effectiveDate ? 'border-red-500 focus:border-red-500' : ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expiry Date (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="applicableFor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Applicable For Services *</FormLabel>
                <div className={`space-y-2 p-3 border rounded-md ${form.formState.errors.applicableFor ? 'border-red-500' : ''}`}>
                  {["hotel", "conference_room", "flight", "train", "bus", "taxi"].map((service) => (
                    <div key={service} className="flex items-center space-x-2">
                      <Checkbox
                        checked={field.value?.includes(service)}
                        onCheckedChange={(checked) => {
                          const current = field.value || [];
                          if (checked) {
                            field.onChange([...current, service]);
                          } else {
                            field.onChange(current.filter((s: string) => s !== service));
                          }
                        }}
                      />
                      <Label className="text-sm capitalize">{service.replace('_', ' ')}</Label>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Set as Default Template</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="approvalStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Approval Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)]"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : policy ? "Update Policy" : "Create Policy"}
          </Button>
        </div>
      </form>
    </Form>
  );
}