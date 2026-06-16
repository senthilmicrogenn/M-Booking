import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CalendarCheck, DollarSign, Building, Building2, Users, Server, ServerCog, Plus, Eye, X, Plane, Train, Bus, Car, Hotel, ArrowLeft, Edit, Trash2, Star, MessageSquare, Settings, CheckCircle, XCircle, Clock, Package, Camera, Images, BarChart, Calculator, CalendarDays, Shield, UserCog, UserCheck } from "lucide-react";
import { useI18n } from "@/contexts/i18n";
import { RoomPhotoUploader } from "@/components/RoomPhotoUploader";
import { CompressionAnalytics } from "@/components/CompressionAnalytics";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { Booking, Property, PropertyCategory, PropertyArea, PropertyAmenity, HotelStarRating, CustomerReviewRating, RoomView, RoomType, RoomPhoto, PolicyTemplate, PlanMaster } from "@shared/schema";
import { PlanMasterManagement } from "@/components/plan-master-management";
import { CurrencyMasterManagement } from "@/components/currency-master-management";
import RateMasterMatrix from "@/components/rate-master-matrix";
import { GeneralLedgerManagement } from "@/components/general-ledger-management";
import { SubledgerManagement } from "@/components/subledger-management";
import { TariffSetupManagement } from "@/components/tariff-setup-management";
import { UserManagement } from "@/components/user-management";
import { PropertyManagement } from "@/components/property-management";
import { RoomInventoryManagement } from "@/components/room-inventory-management";
import { RoleManagement } from "@/components/role-management";
import { AmenityManagement } from "@/components/amenity-management";
import { LoyaltyProgramManagement } from "@/components/loyalty-program-management";
import { PromotionsManagement } from "@/components/promotions-management";
import { GuestMasterManagement } from "@/components/guest-master-management";
import { UserProfileManagement } from "@/components/user-profile-management";
import { ManagePropertyAccess } from "@/components/manage-property-access";
import PhotoVideoGallery from "@/pages/PhotoVideoGallery";

// Property form schema
const propertyFormSchema = z.object({
  name: z.string().min(1, "Property name is required"),
  type: z.enum(["hotel", "conference_room", "flight", "train", "bus", "taxi"]),
  location: z.string().min(1, "Location is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  area: z.string().optional(),
  pincode: z.string().optional(),
  description: z.string().optional(),
  pricePerNight: z.string().optional(),
  hourlyRate: z.string().optional(),
  capacity: z.string().optional(),
  amenities: z.string().optional(),
  images: z.string().optional(),
  contactInfo: z.string().optional(),
});

type PropertyFormData = z.infer<typeof propertyFormSchema>;

// Property category form schema
const categoryFormSchema = z.object({
  propertyType: z.enum(["hotel", "conference_room", "flight", "train", "bus", "taxi"]),
  categoryName: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

// Property area form schema
const areaFormSchema = z.object({
  cityName: z.string().min(1, "City name is required"),
  areaName: z.string().min(1, "Area name is required"),
  pincode: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type AreaFormData = z.infer<typeof areaFormSchema>;

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("bookings");
  const { t } = useI18n();
  const [showPropertyDialog, setShowPropertyDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showAreaDialog, setShowAreaDialog] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editingCategory, setEditingCategory] = useState<PropertyCategory | null>(null);
  const [editingArea, setEditingArea] = useState<PropertyArea | null>(null);
  const [activeMasterCategory, setActiveMasterCategory] = useState('hotel');
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyTemplate | null>(null);
  const [showPolicyViewer, setShowPolicyViewer] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [showPhotoUploader, setShowPhotoUploader] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dashboardStats } = useQuery<{
    totalBookings: number;
    revenue: number;
    properties: number;
    activeUsers: number;
  }>({
    queryKey: ["/api/stats/dashboard"],
  });

  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: pmsIntegrations = [] } = useQuery<any[]>({
    queryKey: ["/api/pms-integrations"],
  });

  const { data: propertyCategories = [], isLoading: categoriesLoading } = useQuery<PropertyCategory[]>({
    queryKey: ["/api/property-categories"],
  });

  const { data: propertyAreas = [], isLoading: areasLoading } = useQuery<PropertyArea[]>({
    queryKey: ["/api/property-areas"],
  });

  const { data: propertyAmenities = [], isLoading: amenitiesLoading } = useQuery<PropertyAmenity[]>({
    queryKey: ["/api/property-amenities"],
  });

  const { data: hotelStarRatings = [], isLoading: starRatingsLoading } = useQuery<HotelStarRating[]>({
    queryKey: ["/api/hotel-star-ratings"],
  });

  const { data: customerReviewRatings = [], isLoading: reviewRatingsLoading } = useQuery<CustomerReviewRating[]>({
    queryKey: ["/api/customer-review-ratings"],
  });

  const { data: roomViews = [], isLoading: roomViewsLoading } = useQuery<RoomView[]>({
    queryKey: ["/api/room-views"],
  });

  const { data: roomTypes = [], isLoading: roomTypesLoading } = useQuery<RoomType[]>({
    queryKey: ["/api/room-types"],
  });

  const { data: policyTemplates = [], isLoading: policyTemplatesLoading } = useQuery<PolicyTemplate[]>({
    queryKey: ["/api/policy-templates"],
  });

  const { data: roomPhotos = [], isLoading: roomPhotosLoading } = useQuery<RoomPhoto[]>({
    queryKey: ["/api/room-photos"],
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/bookings/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
    },
  });

  const updateIntegrationMutation = useMutation({
    mutationFn: async ({ id, isConnected }: { id: string; isConnected: boolean }) => {
      const response = await apiRequest("PATCH", `/api/pms-integrations/${id}`, { 
        isConnected,
        lastSyncAt: isConnected ? new Date() : null
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pms-integrations"] });
    },
  });

  // Property form
  const propertyForm = useForm<PropertyFormData>({
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
      pricePerNight: "",
      hourlyRate: "",
      capacity: "",
      amenities: "",
      images: "",
      contactInfo: "",
    },
  });

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      propertyType: "hotel",
      categoryName: "",
      description: "",
      isActive: true,
    },
  });

  // Add property mutation
  const addPropertyMutation = useMutation({
    mutationFn: async (data: PropertyFormData) => {
      const propertyData = {
        ...data,
        pricePerNight: data.pricePerNight ? parseFloat(data.pricePerNight) : null,
        hourlyRate: data.hourlyRate ? parseFloat(data.hourlyRate) : null,
        capacity: data.capacity ? parseInt(data.capacity) : null,
        amenities: data.amenities ? data.amenities.split(',').map(a => a.trim()) : [],
        images: data.images ? data.images.split(',').map(i => i.trim()) : [],
        availability: true,
        rating: "4.5",
        reviewCount: 0,
      };
      
      const response = await apiRequest("POST", "/api/properties", propertyData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      setShowPropertyDialog(false);
      setEditingProperty(null);
      propertyForm.reset();
      toast({
        title: "Success",
        description: "Property added successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add property. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update property mutation
  const updatePropertyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PropertyFormData }) => {
      const propertyData = {
        ...data,
        pricePerNight: data.pricePerNight ? parseFloat(data.pricePerNight) : null,
        hourlyRate: data.hourlyRate ? parseFloat(data.hourlyRate) : null,
        capacity: data.capacity ? parseInt(data.capacity) : null,
        amenities: data.amenities ? data.amenities.split(',').map(a => a.trim()) : [],
        images: data.images ? data.images.split(',').map(i => i.trim()) : [],
      };
      
      const response = await apiRequest("PATCH", `/api/properties/${id}`, propertyData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      setShowPropertyDialog(false);
      setEditingProperty(null);
      propertyForm.reset();
      toast({
        title: "Success",
        description: "Property updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update property. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete property mutation
  const deletePropertyMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/properties/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      toast({
        title: "Success",
        description: "Property deleted successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete property. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Property Category mutations
  const addCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const response = await apiRequest("POST", "/api/property-categories", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/property-categories"] });
      categoryForm.reset();
      setShowCategoryDialog(false);
      toast({
        title: "Success",
        description: "Property category added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add property category",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PropertyCategory> }) => {
      const response = await apiRequest("PATCH", `/api/property-categories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/property-categories"] });
      categoryForm.reset();
      setShowCategoryDialog(false);
      setEditingCategory(null);
      toast({
        title: "Success",
        description: "Property category updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update property category",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/property-categories/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/property-categories"] });
      toast({
        title: "Success",
        description: "Property category deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete property category",
        variant: "destructive",
      });
    },
  });

  const handleAddProperty = () => {
    setEditingProperty(null);
    propertyForm.reset();
    setShowPropertyDialog(true);
  };

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    propertyForm.reset({
      name: property.name,
      type: property.type as any,
      location: property.location,
      address: property.address,
      city: property.city,
      area: property.area || "",
      pincode: property.pincode || "",
      description: property.description || "",
      pricePerNight: "",
      hourlyRate: property.hourlyRate?.toString() || "",
      capacity: property.capacity?.toString() || "",
      amenities: property.amenities?.join(', ') || "",
      images: property.images?.join(', ') || "",
      contactInfo: property.description || "",
    });
    setShowPropertyDialog(true);
  };

  const onSubmitProperty = (data: PropertyFormData) => {
    if (editingProperty) {
      updatePropertyMutation.mutate({ id: editingProperty.id, data });
    } else {
      addPropertyMutation.mutate(data);
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    categoryForm.reset();
    setShowCategoryDialog(true);
  };

  const handleEditCategory = (category: PropertyCategory) => {
    setEditingCategory(category);
    categoryForm.reset({
      propertyType: category.propertyType as any,
      categoryName: category.categoryName,
      description: category.description || "",
      isActive: category.isActive || false,
    });
    setShowCategoryDialog(true);
  };

  const onSubmitCategory = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      addCategoryMutation.mutate(data);
    }
  };

  const adminTabs = [
    { id: "bookings", label: t('admin.bookings'), icon: CalendarCheck },
    { id: "properties", label: t('admin.properties'), icon: Building },
    { id: "photo-gallery", label: "Photo Gallery", icon: Camera },
    { id: "promotions", label: "Promotions & Coupons", icon: Star },
    { id: "loyalty", label: "Loyalty Programs", icon: Users },
    { id: "inventory", label: t('admin.inventory'), icon: CalendarDays },
    { id: "plans", label: t('admin.plans'), icon: Package },
    { id: "rates", label: t('admin.rates'), icon: DollarSign },
    { id: "currencies", label: t('admin.currencies'), icon: DollarSign },
    { id: "ledger", label: t('admin.ledger'), icon: ServerCog },
    { id: "subledger", label: t('admin.subledger'), icon: DollarSign },
    { id: "tariff", label: t('admin.tariff'), icon: Calculator },
    { id: "users", label: t('admin.users'), icon: Users },
    { id: "roles", label: t('admin.roles'), icon: Shield },
    { id: "property-access", label: "Manage Property Access", icon: Building2 },
    { id: "guests", label: "Guest Profile Master", icon: UserCheck },
    { id: "user-profiles", label: "User Profiles", icon: UserCog },
    { id: "masterdata", label: t('admin.masterData'), icon: ServerCog },
    { id: "integrations", label: t('admin.integrations'), icon: Server },
  ];

  const getStatusBadge = (status: string) => {
    const statusColors = {
      confirmed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
      completed: "bg-gray-100 text-gray-800",
    };
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header with Back Navigation */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-[#006699] hover:text-gray-800 hover:bg-gray-50" data-testid="button-back-home">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Portal
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800" data-testid="text-admin-title">
                  RoomNest {t('admin.dashboard')}
                </h1>
                <p className="text-sm text-primary-600">Travel Portal Management System</p>
              </div>
            </div>
            <div>
              <Link href="/reports">
                <Button 
                  variant="default" 
                  size="sm" 
                  className="bg-[#006699] hover:bg-[#002a66] text-white"
                  data-testid="button-view-reports"
                >
                  <BarChart className="h-4 w-4 mr-2" />
                  Reports & Analytics
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Quick Stats Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Travel Portal Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-[#0057B8] rounded flex items-center justify-center">
                    <CalendarCheck className="text-white w-5 h-5" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-800">Total Bookings</p>
                    <p className="text-xl font-bold text-gray-900" data-testid="stat-total-bookings">
                      {bookings.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-[#006699] rounded flex items-center justify-center">
                    <DollarSign className="text-white w-5 h-5" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-800">Revenue</p>
                    <p className="text-xl font-bold text-gray-900" data-testid="stat-revenue">
                      ₹{bookings.reduce((sum, b) => sum + parseFloat(b.totalAmount || '0'), 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-gray-200 to-gray-300 border-gray-400">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-[#002a66] rounded flex items-center justify-center">
                    <Building className="text-white w-5 h-5" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-800">Properties</p>
                    <p className="text-xl font-bold text-gray-900" data-testid="stat-properties">
                      {properties.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-gray-300 to-gray-400 border-primary-500">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-[#001F3F] rounded flex items-center justify-center">
                    <Users className="text-white w-5 h-5" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Active Users</p>
                    <p className="text-xl font-bold text-gray-900" data-testid="stat-active-users">
                      {dashboardStats?.activeUsers || 127}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-[#006699] to-[#002a66] text-white border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white/20 rounded flex items-center justify-center">
                    <Server className="text-white w-5 h-5" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white/90">Services</p>
                    <p className="text-xl font-bold text-white" data-testid="stat-services">
                      5 Types
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Service Type Breakdown */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Service Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { type: "hotel", icon: Hotel, count: properties.filter(p => p.type === "hotel").length, color: "blue" },
              { type: "flight", icon: Plane, count: properties.filter(p => p.type === "flight").length, color: "indigo" },
              { type: "train", icon: Train, count: properties.filter(p => p.type === "train").length, color: "green" },
              { type: "bus", icon: Bus, count: properties.filter(p => p.type === "bus").length, color: "yellow" },
              { type: "taxi", icon: Car, count: properties.filter(p => p.type === "taxi").length, color: "red" },
            ].map((service) => {
              const IconComponent = service.icon;
              return (
                <Card key={service.type} className="text-center">
                  <CardContent className="p-4">
                    <div className={`w-12 h-12 bg-${service.color}-100 rounded flex items-center justify-center mx-auto mb-2`}>
                      <IconComponent className={`text-${service.color}-600 w-6 h-6`} />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{service.count}</p>
                    <p className="text-sm text-gray-600 capitalize">{service.type}s</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent Properties */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Recent Properties</h2>
            <Button 
              onClick={() => setActiveTab("properties")}
              variant="outline" 
              size="sm"
              className="text-primary-600 border-gray-300 hover:bg-gray-50"
            >
              View All Properties
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.slice(0, 6).map((property) => (
              <Card key={property.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800 text-sm">{property.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {property.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{property.location}, {property.city}</p>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Created: {new Date(property.createdAt).toLocaleDateString()}</span>
                    <Badge 
                      variant={property.approvalStatus === 'approved' ? 'default' : property.approvalStatus === 'pending' ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {property.approvalStatus}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {properties.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                No properties yet. <Button variant="link" onClick={() => setActiveTab("properties")} className="p-0 h-auto text-primary-600">Create your first property</Button>
              </div>
            )}
          </div>
        </div>

        {/* Admin Tabs */}
        <div className="mb-6">
          <div className="bg-white rounded shadow-sm border">
            <nav className="flex flex-wrap gap-2 p-3">
              {adminTabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
                      activeTab === tab.id
                        ? "bg-[#006699] text-white shadow-md"
                        : "text-primary-600 hover:text-gray-800 hover:bg-gray-50 border border-transparent hover:border-gray-200"
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                    data-testid={`tab-${tab.id}`}
                  >
                    <IconComponent className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden text-xs">{tab.id === "photo-gallery" ? "Gallery" : tab.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

      {/* Recent Bookings Tab */}
      {activeTab === "bookings" && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.slice(0, 10).map((booking) => (
                  <TableRow key={booking.id} data-testid={`row-booking-${booking.id}`}>
                    <TableCell className="font-medium" data-testid={`text-booking-id-${booking.id}`}>
                      #{booking.id}
                    </TableCell>
                    <TableCell data-testid={`text-property-${booking.id}`}>
                      Property #{booking.propertyId}
                    </TableCell>
                    <TableCell data-testid={`text-dates-${booking.id}`}>
                      {booking.checkInDate && booking.checkOutDate
                        ? `${new Date(booking.checkInDate).toLocaleDateString()} - ${new Date(booking.checkOutDate).toLocaleDateString()}`
                        : "N/A"
                      }
                    </TableCell>
                    <TableCell data-testid={`text-amount-${booking.id}`}>
                      ₹{booking.totalAmount}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(booking.status)} data-testid={`badge-status-${booking.id}`}>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="ghost" data-testid={`button-view-${booking.id}`}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {booking.status !== "cancelled" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-900"
                            onClick={() => updateBookingMutation.mutate({ id: booking.id.toString(), status: "cancelled" })}
                            data-testid={`button-cancel-${booking.id}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Property Management Tab */}
      {activeTab === "properties" && (
        <PropertyManagement />
      )}

      {/* Photo Gallery Tab */}
      {activeTab === "photo-gallery" && (
        <PhotoVideoGallery />
      )}

      {/* Promotions & Coupons Management Tab */}
      {activeTab === "promotions" && (
        <PromotionsManagement />
      )}

      {/* Loyalty Programs Management Tab */}
      {activeTab === "loyalty" && (
        <LoyaltyProgramManagement />
      )}

      {/* Room Inventory Tab */}
      {activeTab === "inventory" && (
        <RoomInventoryManagement />
      )}

      {/* Plan Masters Tab */}
      {activeTab === "plans" && (
        <PlanMasterManagement />
      )}

      {/* Rate Master Tab */}
      {activeTab === "rates" && (
        <RateMasterMatrix />
      )}

      {/* Currency Master Tab */}
      {activeTab === "currencies" && (
        <CurrencyMasterManagement />
      )}

      {/* General Ledger Master Tab */}
      {activeTab === "ledger" && (
        <GeneralLedgerManagement />
      )}

      {/* Subledger Master Tab */}
      {activeTab === "subledger" && (
        <SubledgerManagement />
      )}

      {activeTab === "tariff" && (
        <TariffSetupManagement />
      )}

      {/* User Management Tab */}
      {activeTab === "users" && (
        <UserManagement />
      )}

      {activeTab === "roles" && (
        <RoleManagement />
      )}

      {/* Property Access Management Tab */}
      {activeTab === "property-access" && (
        <ManagePropertyAccess />
      )}

      {/* Guest Master Management Tab */}
      {activeTab === "guests" && (
        <GuestMasterManagement />
      )}

      {/* User Profile Management Tab */}
      {activeTab === "user-profiles" && (
        <UserProfileManagement />
      )}

      {/* Master Data Management Tab */}
      {activeTab === "masterdata" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Category Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Master Data Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <button
                    onClick={() => setActiveMasterCategory('hotel')}
                    className={`w-full text-left p-3 rounded transition-colors ${
                      activeMasterCategory === 'hotel' 
                        ? 'bg-[hsl(213_94%_25%)] text-white' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    data-testid="button-category-hotel"
                  >
                    <div className="flex items-center gap-2">
                      <Hotel className="h-4 w-4" />
                      <span className="font-medium">Hotel</span>
                    </div>
                    <div className="text-xs mt-1 opacity-80">
                      Star ratings, amenities, room types, policies
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveMasterCategory('flight')}
                    className={`w-full text-left p-3 rounded transition-colors ${
                      activeMasterCategory === 'flight' 
                        ? 'bg-[hsl(213_94%_25%)] text-white' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    data-testid="button-category-flight"
                  >
                    <div className="flex items-center gap-2">
                      <Plane className="h-4 w-4" />
                      <span className="font-medium">Flight</span>
                    </div>
                    <div className="text-xs mt-1 opacity-80">
                      Airlines, aircraft types, routes
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveMasterCategory('bus')}
                    className={`w-full text-left p-3 rounded transition-colors ${
                      activeMasterCategory === 'bus' 
                        ? 'bg-[hsl(213_94%_25%)] text-white' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    data-testid="button-category-bus"
                  >
                    <div className="flex items-center gap-2">
                      <Bus className="h-4 w-4" />
                      <span className="font-medium">Bus</span>
                    </div>
                    <div className="text-xs mt-1 opacity-80">
                      Operators, routes, bus types
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveMasterCategory('taxi')}
                    className={`w-full text-left p-3 rounded transition-colors ${
                      activeMasterCategory === 'taxi' 
                        ? 'bg-[hsl(213_94%_25%)] text-white' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    data-testid="button-category-taxi"
                  >
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      <span className="font-medium">Taxi</span>
                    </div>
                    <div className="text-xs mt-1 opacity-80">
                      Vehicle types, service zones
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveMasterCategory('general')}
                    className={`w-full text-left p-3 rounded transition-colors ${
                      activeMasterCategory === 'general' 
                        ? 'bg-[hsl(213_94%_25%)] text-white' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    data-testid="button-category-general"
                  >
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span className="font-medium">General</span>
                    </div>
                    <div className="text-xs mt-1 opacity-80">
                      Property categories, common data
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Master Data Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Hotel Master Data */}
            {activeMasterCategory === 'hotel' && (
              <div className="space-y-6">
                {/* Hotel Star Ratings Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Hotel Star Ratings
                      </CardTitle>
                      <Button 
                        onClick={() => console.log("Add star rating")}
                        className="bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)]"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Star Rating
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Stars</TableHead>
                            <TableHead>Rating Name</TableHead>
                            <TableHead>Service Level</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {hotelStarRatings.map((rating) => (
                            <TableRow key={rating.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{rating.icon}</span>
                                  <span>{rating.starRating}</span>
                                </div>
                              </TableCell>
                              <TableCell>{rating.ratingName}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {rating.serviceLevel}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {rating.description || "No description"}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={rating.isActive ? "default" : "secondary"}
                                  className={rating.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                                >
                                  {rating.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => console.log("Edit star rating:", rating.id)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => console.log("Delete star rating:", rating.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Review Ratings Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Customer Review Ratings
                      </CardTitle>
                      <Button 
                        onClick={() => console.log("Add review rating")}
                        className="bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)]"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Review Rating
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Rating Range</TableHead>
                            <TableHead>Label</TableHead>
                            <TableHead>Min Score</TableHead>
                            <TableHead>Max Score</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customerReviewRatings.map((rating) => (
                            <TableRow key={rating.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{rating.icon}</span>
                                  <span>{rating.ratingRange}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline"
                                  className={`bg-${rating.color}-100 text-${rating.color}-800`}
                                >
                                  {rating.ratingLabel}
                                </Badge>
                              </TableCell>
                              <TableCell>{rating.minRating}</TableCell>
                              <TableCell>{rating.maxRating}</TableCell>
                              <TableCell className="max-w-xs truncate">
                                {rating.description || "No description"}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={rating.isActive ? "default" : "secondary"}
                                  className={rating.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                                >
                                  {rating.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => console.log("Edit review rating:", rating.id)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => console.log("Delete review rating:", rating.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Room Amenities Management */}
                <AmenityManagement 
                  amenityType="room_amenity"
                  title="Room Amenities" 
                  icon={Hotel}
                />

                {/* Hotel Amenities Management */}
                <AmenityManagement 
                  amenityType="hotel_amenity"
                  title="Hotel Amenities" 
                  icon={Building}
                />

                {/* Property Areas Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Property Areas
                      </CardTitle>
                      <Button 
                        onClick={() => setShowAreaDialog(true)}
                        className="bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)]"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Area
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>City</TableHead>
                            <TableHead>Area Name</TableHead>
                            <TableHead>Pincode</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {propertyAreas.map((area) => (
                            <TableRow key={area.id}>
                              <TableCell className="font-medium">
                                <Badge variant="outline">
                                  {area.cityName}
                                </Badge>
                              </TableCell>
                              <TableCell>{area.areaName}</TableCell>
                              <TableCell>{area.pincode || "-"}</TableCell>
                              <TableCell className="max-w-xs truncate">
                                {area.description || "No description"}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={area.isActive ? "default" : "secondary"}
                                  className={area.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                                >
                                  {area.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingArea(area);
                                      setShowAreaDialog(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => console.log("Delete area:", area.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Room Views Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Room Views
                      </CardTitle>
                      <Button 
                        onClick={() => console.log("Add room view")}
                        className="bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)]"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Room View
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Icon</TableHead>
                            <TableHead>View Name</TableHead>
                            <TableHead>View Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {roomViews.map((view) => (
                            <TableRow key={view.id}>
                              <TableCell className="text-lg">{view.icon}</TableCell>
                              <TableCell className="font-medium">{view.viewName}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {view.viewType}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {view.description || "No description"}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={view.isActive ? "default" : "secondary"}
                                  className={view.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                                >
                                  {view.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => console.log("Edit room view:", view.id)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => console.log("Delete room view:", view.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Room Types Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Hotel className="h-5 w-5" />
                        Room Types
                      </CardTitle>
                      <Button 
                        onClick={() => console.log("Add room type")}
                        className="bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)]"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Room Type
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Room Type</TableHead>
                            <TableHead>Size (sq m)</TableHead>
                            <TableHead>Room View</TableHead>
                            <TableHead>Room Count</TableHead>
                            <TableHead>Max Occupancy</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Photos</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {roomTypes.map((roomType) => {
                            const roomView = roomViews.find(view => view.id === roomType.roomViewId);
                            const roomTypePhotos = roomPhotos.filter(photo => photo.roomTypeId === roomType.id);
                            const photoGroups = Array.from(new Set(roomTypePhotos.map(photo => photo.photoGroup)));
                            
                            return (
                              <TableRow key={roomType.id}>
                                <TableCell className="font-medium">{roomType.roomTypeName}</TableCell>
                                <TableCell>{roomType.roomSizeSquareMeters} sq m</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{roomView?.icon || "🏠"}</span>
                                    <span>{roomView?.viewName || "Standard View"}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{roomType.roomCount}</TableCell>
                                <TableCell>{roomType.maxOccupancy} guests</TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={roomType.isActive ? "default" : "secondary"}
                                    className={roomType.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                                  >
                                    {roomType.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1 text-sm">
                                      <Images className="h-3 w-3" />
                                      <span>{roomTypePhotos.length} photos</span>
                                    </div>
                                    {photoGroups.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {photoGroups.map(group => (
                                          <Badge key={group} variant="secondary" className="text-xs">
                                            {group}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedRoomType(roomType);
                                        setShowPhotoUploader(true);
                                      }}
                                      title="Manage Photos"
                                    >
                                      <Camera className="h-4 w-4" />
                                    </Button>
                                    {roomTypePhotos.length > 0 && (
                                      <CompressionAnalytics
                                        roomTypeId={roomType.id}
                                        roomTypeName={roomType.roomTypeName}
                                      />
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => console.log("Edit room type:", roomType.id)}
                                      title="Edit Room Type"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => console.log("Delete room type:", roomType.id)}
                                      title="Delete Room Type"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Policy Templates Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Policy Templates
                      </CardTitle>
                      <Button 
                        onClick={() => console.log("Add policy template")}
                        className="bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)]"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Policy Template
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Policy Type</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Applicable For</TableHead>
                            <TableHead>Version</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Default</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {policyTemplates.map((template) => (
                            <TableRow key={template.id}>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {template.policyType.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">{template.policyTitle}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {template.applicableFor?.map((service) => (
                                    <Badge key={service} variant="secondary" className="text-xs">
                                      {service}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{template.version}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={template.approvalStatus === 'approved' ? "default" : 
                                          template.approvalStatus === 'draft' ? "secondary" : "destructive"}
                                  className={
                                    template.approvalStatus === 'approved' ? "bg-green-100 text-green-800" :
                                    template.approvalStatus === 'draft' ? "bg-yellow-100 text-yellow-800" :
                                    "bg-red-100 text-red-800"
                                  }
                                >
                                  {template.approvalStatus}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {template.isDefault && (
                                  <Badge className="bg-blue-100 text-blue-800">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Default
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedPolicy(template);
                                      setShowPolicyViewer(true);
                                    }}
                                    title="View Policy"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => console.log("Edit policy:", template.id)}
                                    title="Edit Policy"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => console.log("Delete policy:", template.id)}
                                    title="Delete Policy"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Flight Master Data */}
            {activeMasterCategory === 'flight' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plane className="h-5 w-5" />
                      Flight Master Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      Flight master data management will be available soon.
                      Features include airlines, aircraft types, and routes.
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Bus Master Data */}
            {activeMasterCategory === 'bus' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bus className="h-5 w-5" />
                      Bus Master Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      Bus master data management will be available soon.
                      Features include operators, routes, and bus types.
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Taxi Master Data */}
            {activeMasterCategory === 'taxi' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      Taxi Master Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      Taxi master data management will be available soon.
                      Features include vehicle types and service zones.
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* General Master Data */}
            {activeMasterCategory === 'general' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Property Categories
                      </CardTitle>
                      <Button 
                        onClick={handleAddCategory}
                        className="bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)]"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Category
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Property Type</TableHead>
                            <TableHead>Category Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {propertyCategories.map((category) => (
                            <TableRow key={category.id}>
                              <TableCell className="font-medium">
                                <Badge variant="outline" className="capitalize">
                                  {category.propertyType.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>{category.categoryName}</TableCell>
                              <TableCell className="max-w-xs truncate">
                                {category.description || "No description"}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={category.isActive ? "default" : "secondary"}
                                  className={category.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                                >
                                  {category.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditCategory(category)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteCategoryMutation.mutate(category.id)}
                                    disabled={deleteCategoryMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {propertyCategories.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No property categories found. Add your first category to get started.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PMS Integrations Tab */}
      {activeTab === "integrations" && (
        <Card>
          <CardHeader>
            <CardTitle>PMS Integrations</CardTitle>
            <p className="text-sm text-gray-600">Connect with Property Management Systems</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pmsIntegrations.map((integration) => (
                <Card key={integration.id} className="border border-gray-200" data-testid={`card-integration-${integration.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                          {integration.provider?.includes("Oracle") ? (
                            <Server className="text-blue-600 w-5 h-5" />
                          ) : (
                            <ServerCog className="text-purple-600 w-5 h-5" />
                          )}
                        </div>
                        <div className="ml-3">
                          <h4 className="font-medium text-gray-900" data-testid={`text-integration-name-${integration.id}`}>
                            {integration.name}
                          </h4>
                          <p className="text-sm text-gray-600" data-testid={`text-integration-provider-${integration.id}`}>
                            {integration.provider}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        className={integration.isConnected ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                        data-testid={`badge-integration-status-${integration.id}`}
                      >
                        {integration.isConnected ? "Connected" : "Not Connected"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      {integration.isConnected 
                        ? "Real-time synchronization of room inventory and rates"
                        : `Integrate with ${integration.name} for seamless booking management`
                      }
                    </p>
                    <Button
                      className={`w-full ${
                        integration.isConnected
                          ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                          : "bg-primary-600 hover:bg-primary-700 text-white"
                      }`}
                      onClick={() => updateIntegrationMutation.mutate({ 
                        id: integration.id, 
                        isConnected: !integration.isConnected 
                      })}
                      disabled={updateIntegrationMutation.isPending}
                      data-testid={`button-toggle-integration-${integration.id}`}
                    >
                      {integration.isConnected ? "Configure Settings" : "Connect Now"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Add/Edit Property Dialog */}
        <Dialog open={showPropertyDialog} onOpenChange={setShowPropertyDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProperty ? "Edit Property" : "Add New Property"}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...propertyForm}>
              <form onSubmit={propertyForm.handleSubmit(onSubmitProperty)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={propertyForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter property name" className="text-gray-900 bg-white border-gray-300 focus:text-gray-900" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={propertyForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="text-gray-900 bg-white border-gray-300 focus:text-gray-900">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={propertyForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Andheri West" className="text-gray-900 bg-white border-gray-300 focus:text-gray-900" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={propertyForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Mumbai" className="text-gray-900 bg-white border-gray-300 focus:text-gray-900" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={propertyForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Complete address" className="text-gray-900 bg-white border-gray-300 focus:text-gray-900" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={propertyForm.control}
                    name="area"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Area (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Area/Locality" className="text-gray-900 bg-white border-gray-300 focus:text-gray-900" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={propertyForm.control}
                    name="pincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pincode (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 400058" className="text-gray-900 bg-white border-gray-300 focus:text-gray-900" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={propertyForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Describe the property" rows={3} className="text-gray-900 bg-white border-gray-300 focus:text-gray-900" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={propertyForm.control}
                    name="pricePerNight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price per Night (₹)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 3500" type="number" className="text-gray-900 bg-white border-gray-300 focus:text-gray-900" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={propertyForm.control}
                    name="hourlyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hourly Rate (₹)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 1200" type="number" className="text-gray-900 bg-white border-gray-300 focus:text-gray-900" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={propertyForm.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 50" type="number" className="text-gray-900 bg-white border-gray-300 focus:text-gray-900" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={propertyForm.control}
                  name="amenities"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amenities (comma separated)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="WiFi, AC, Parking, Pool" className="text-gray-900 bg-white border-gray-300 focus:text-gray-900" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={propertyForm.control}
                  name="images"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URLs (comma separated)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg" className="text-gray-900 bg-white border-gray-300 focus:text-gray-900" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={propertyForm.control}
                  name="contactInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Information</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Phone, Email, etc." className="text-gray-900 bg-white border-gray-300 focus:text-gray-900" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowPropertyDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)]"
                    disabled={addPropertyMutation.isPending || updatePropertyMutation.isPending}
                  >
                    {addPropertyMutation.isPending || updatePropertyMutation.isPending 
                      ? "Saving..." 
                      : editingProperty 
                      ? "Update Property" 
                      : "Add Property"
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Property Category Dialog */}
        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Add New Property Category"}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...categoryForm}>
              <form onSubmit={categoryForm.handleSubmit(onSubmitCategory)} className="space-y-4">
                <FormField
                  control={categoryForm.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="text-gray-900 bg-white border-gray-300 focus:text-gray-900">
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

                <FormField
                  control={categoryForm.control}
                  name="categoryName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Five Star, Business Class" className="text-gray-900 bg-white border-gray-300 focus:text-gray-900" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={categoryForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Brief description of this category" rows={3} className="text-gray-900 bg-white border-gray-300 focus:text-gray-900" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCategoryDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)]"
                    disabled={addCategoryMutation.isPending || updateCategoryMutation.isPending}
                  >
                    {addCategoryMutation.isPending || updateCategoryMutation.isPending 
                      ? "Saving..." 
                      : editingCategory 
                      ? "Update Category" 
                      : "Add Category"
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Policy Viewer Dialog */}
      <Dialog open={showPolicyViewer} onOpenChange={setShowPolicyViewer}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {selectedPolicy?.policyTitle}
              <Badge variant="outline" className="ml-2">
                {selectedPolicy?.policyType.replace('_', ' ')}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] p-4 bg-white border rounded">
            <div className="mb-4 border-b pb-2">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span><strong>Version:</strong> {selectedPolicy?.version}</span>
                <span><strong>Status:</strong> {selectedPolicy?.approvalStatus}</span>
                <span><strong>Effective Date:</strong> {selectedPolicy?.effectiveDate ? new Date(selectedPolicy.effectiveDate).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
            
            {/* Word-like Document Display */}
            <div 
              className="prose prose-sm max-w-none"
              style={{
                fontFamily: '"Times New Roman", serif',
                lineHeight: '1.6',
                fontSize: '14px',
                color: '#333'
              }}
              dangerouslySetInnerHTML={{ 
                __html: selectedPolicy?.policyContent || '<p>No content available</p>' 
              }}
            />
            
            <div className="mt-6 pt-4 border-t text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Created by: {selectedPolicy?.createdBy || 'Admin'}</span>
                <span>Last updated: {selectedPolicy?.updatedAt ? new Date(selectedPolicy.updatedAt).toLocaleString() : 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowPolicyViewer(false)}>
              Close
            </Button>
            <Button 
              className="bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)]"
              onClick={() => {
                // Here you could implement export to PDF or print functionality
                window.print();
              }}
            >
              Print/Export
            </Button>
          </div>
        </DialogContent>
      </Dialog>



      {/* Room Photo Uploader */}
      {selectedRoomType && (
        <RoomPhotoUploader
          roomTypeId={selectedRoomType.id}
          roomTypeName={selectedRoomType.roomTypeName}
          isOpen={showPhotoUploader}
          onClose={() => {
            setShowPhotoUploader(false);
            setSelectedRoomType(null);
          }}
          onUploadComplete={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/room-photos"] });
          }}
        />
      )}
    </div>
  );
}
