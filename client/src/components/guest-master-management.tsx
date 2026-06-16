import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  UserCheck,
  UserX,
  Crown,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Filter
} from "lucide-react";

// Types for guest master
interface GuestMaster {
  id: number;
  guestCode: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumber: string;
  alternatePhoneNumber: string | null;
  dateOfBirth: Date | null;
  gender: string | null;
  nationality: string | null;
  idProofType: string | null;
  idProofNumber: string | null;
  permanentAddress: string | null;
  currentAddress: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  preferredRoomType: string | null;
  preferredLanguage: string | null;
  dietaryRequirements: string | null;
  specialRequests: string | null;
  smokingPreference: boolean;
  guestCategory: string;
  loyaltyTier: string;
  creditLimit: string;
  emergencyContactName: string | null;
  emergencyContactNumber: string | null;
  emergencyContactRelation: string | null;
  companyName: string | null;
  companyAddress: string | null;
  gstNumber: string | null;
  designation: string | null;
  totalBookings: number;
  totalAmountSpent: string;
  lastBookingDate: Date | null;
  averageStayDuration: string;
  isActive: boolean;
  isBlacklisted: boolean;
  blacklistReason: string | null;
  isVerified: boolean;
  profilePhoto: string | null;
  notes: string | null;
  tags: string[] | null;
  source: string;
  referredBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Form schema for guest master
const guestFormSchema = z.object({
  guestCode: z.string().min(1, "Guest code is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
  phoneNumber: z.string().optional().or(z.literal("")),
  alternatePhoneNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  idProofType: z.string().optional(),
  idProofNumber: z.string().optional(),
  permanentAddress: z.string().optional(),
  currentAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  preferredRoomType: z.string().optional(),
  preferredLanguage: z.string().optional(),
  dietaryRequirements: z.string().optional(),
  specialRequests: z.string().optional(),
  smokingPreference: z.boolean().default(false),
  guestCategory: z.string().min(1, "Guest category is required"),
  loyaltyTier: z.string().min(1, "Loyalty tier is required"),
  creditLimit: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactNumber: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  gstNumber: z.string().optional(),
  designation: z.string().optional(),
  isActive: z.boolean().default(true),
  isBlacklisted: z.boolean().default(false),
  blacklistReason: z.string().optional(),
  isVerified: z.boolean().default(false),
  notes: z.string().optional(),
  source: z.string().default("direct"),
  referredBy: z.string().optional(),
}).refine((data) => {
  // At least one of email or phoneNumber must be provided
  return (data.email && data.email.length > 0) || (data.phoneNumber && data.phoneNumber.length > 0);
}, {
  message: "Either email or phone number must be provided",
  path: ["phoneNumber"], // Show error on phoneNumber field
});

type GuestFormData = z.infer<typeof guestFormSchema>;

export function GuestMasterManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGuest, setEditingGuest] = useState<GuestMaster | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all guests
  const { data: guests = [], isLoading } = useQuery<GuestMaster[]>({
    queryKey: ["/api/guests"],
  });

  // Form for guest creation/editing
  const form = useForm<GuestFormData>({
    resolver: zodResolver(guestFormSchema),
    defaultValues: {
      guestCode: "",
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      alternatePhoneNumber: "",
      dateOfBirth: "",
      gender: "",
      nationality: "",
      idProofType: "",
      idProofNumber: "",
      permanentAddress: "",
      currentAddress: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
      preferredRoomType: "",
      preferredLanguage: "",
      dietaryRequirements: "",
      specialRequests: "",
      smokingPreference: false,
      guestCategory: "regular",
      loyaltyTier: "bronze",
      creditLimit: "0.00",
      emergencyContactName: "",
      emergencyContactNumber: "",
      emergencyContactRelation: "",
      companyName: "",
      companyAddress: "",
      gstNumber: "",
      designation: "",
      isActive: true,
      isBlacklisted: false,
      blacklistReason: "",
      isVerified: false,
      notes: "",
      source: "direct",
      referredBy: "",
    },
  });

  // Create guest mutation
  const createGuestMutation = useMutation({
    mutationFn: (data: GuestFormData) => {
      const guestData = {
        ...data,
        email: data.email || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        creditLimit: parseFloat(data.creditLimit || "0").toString(),
      };
      
      return apiRequest("POST", "/api/guests", guestData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guests"] });
      setShowCreateDialog(false);
      form.reset();
      toast({ title: "Success", description: "Guest created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create guest",
        variant: "destructive" 
      });
    },
  });

  // Update guest mutation
  const updateGuestMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: GuestFormData }) => {
      const guestData = {
        ...data,
        email: data.email || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        creditLimit: parseFloat(data.creditLimit || "0").toString(),
      };
      
      return apiRequest("PUT", `/api/guests/${id}`, guestData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guests"] });
      setEditingGuest(null);
      setShowCreateDialog(false);
      form.reset();
      toast({ title: "Success", description: "Guest updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update guest",
        variant: "destructive" 
      });
    },
  });

  // Delete guest mutation
  const deleteGuestMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/guests/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guests"] });
      toast({ title: "Success", description: "Guest deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete guest",
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (data: GuestFormData) => {
    if (editingGuest) {
      updateGuestMutation.mutate({ id: editingGuest.id, data });
    } else {
      createGuestMutation.mutate(data);
    }
  };

  const handleEdit = (guest: GuestMaster) => {
    setEditingGuest(guest);
    form.reset({
      guestCode: guest.guestCode,
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email || "",
      phoneNumber: guest.phoneNumber,
      alternatePhoneNumber: guest.alternatePhoneNumber || "",
      dateOfBirth: guest.dateOfBirth ? new Date(guest.dateOfBirth).toISOString().split('T')[0] : "",
      gender: guest.gender || "",
      nationality: guest.nationality || "",
      idProofType: guest.idProofType || "",
      idProofNumber: guest.idProofNumber || "",
      permanentAddress: guest.permanentAddress || "",
      currentAddress: guest.currentAddress || "",
      city: guest.city || "",
      state: guest.state || "",
      country: guest.country || "",
      pincode: guest.pincode || "",
      preferredRoomType: guest.preferredRoomType || "",
      preferredLanguage: guest.preferredLanguage || "",
      dietaryRequirements: guest.dietaryRequirements || "",
      specialRequests: guest.specialRequests || "",
      smokingPreference: guest.smokingPreference,
      guestCategory: guest.guestCategory,
      loyaltyTier: guest.loyaltyTier,
      creditLimit: guest.creditLimit,
      emergencyContactName: guest.emergencyContactName || "",
      emergencyContactNumber: guest.emergencyContactNumber || "",
      emergencyContactRelation: guest.emergencyContactRelation || "",
      companyName: guest.companyName || "",
      companyAddress: guest.companyAddress || "",
      gstNumber: guest.gstNumber || "",
      designation: guest.designation || "",
      isActive: guest.isActive,
      isBlacklisted: guest.isBlacklisted,
      blacklistReason: guest.blacklistReason || "",
      isVerified: guest.isVerified,
      notes: guest.notes || "",
      source: guest.source,
      referredBy: guest.referredBy || "",
    });
    setShowCreateDialog(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this guest?")) {
      deleteGuestMutation.mutate(id);
    }
  };

  // Filter guests based on search and category
  const filteredGuests = guests.filter((guest) => {
    const matchesSearch = searchTerm === "" || 
      guest.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.phoneNumber.includes(searchTerm) ||
      guest.guestCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === "" || filterCategory === "all" || guest.guestCategory === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'vip': return <Crown className="h-4 w-4" />;
      case 'corporate': return <Building className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Guest Profile Master
            </CardTitle>
            <CardDescription>
              Manage guest profiles, preferences, and booking history
            </CardDescription>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingGuest(null);
                  form.reset();
                }}
                className="bg-[#006699] hover:bg-[#002a66]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Guest
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {editingGuest ? "Edit Guest" : "Add New Guest"}
                </DialogTitle>
                <DialogDescription>
                  {editingGuest ? "Update guest information" : "Add a new guest to the system"}
                </DialogDescription>
              </DialogHeader>
              <div className="overflow-y-auto max-h-[70vh]">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="guestCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Guest Code *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="GUEST_001" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="guestCategory"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Guest Category *</FormLabel>
                              <FormControl>
                                <Select value={field.value || undefined} onValueChange={field.onChange}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="regular">Regular</SelectItem>
                                    <SelectItem value="vip">VIP</SelectItem>
                                    <SelectItem value="corporate">Corporate</SelectItem>
                                    <SelectItem value="loyalty">Loyalty</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name *</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name *</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email (Required if no phone)</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" placeholder="Enter email address" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phoneNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number (Required if no email)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter phone number" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Personal Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Personal Details</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="dateOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Birth</FormLabel>
                              <FormControl>
                                <Input {...field} type="date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gender</FormLabel>
                              <FormControl>
                                <Select value={field.value || undefined} onValueChange={field.onChange}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="nationality"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nationality</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Status and Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">Status & Settings</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between">
                                <div>
                                  <FormLabel>Active Guest</FormLabel>
                                  <p className="text-sm text-gray-600">Guest can make bookings</p>
                                </div>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="isVerified"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between">
                                <div>
                                  <FormLabel>Verified Guest</FormLabel>
                                  <p className="text-sm text-gray-600">Guest identity verified</p>
                                </div>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="loyaltyTier"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Loyalty Tier</FormLabel>
                                <FormControl>
                                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select tier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="bronze">Bronze</SelectItem>
                                      <SelectItem value="silver">Silver</SelectItem>
                                      <SelectItem value="gold">Gold</SelectItem>
                                      <SelectItem value="platinum">Platinum</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="creditLimit"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Credit Limit</FormLabel>
                                <FormControl>
                                  <Input {...field} type="number" step="0.01" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4 border-t">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowCreateDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-[#006699] hover:bg-[#002a66]"
                        disabled={createGuestMutation.isPending || updateGuestMutation.isPending}
                      >
                        {createGuestMutation.isPending || updateGuestMutation.isPending 
                          ? "Saving..." 
                          : editingGuest 
                          ? "Update Guest" 
                          : "Create Guest"
                        }
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search guests by name, email, phone, or guest code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterCategory || "all"} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
              <SelectItem value="corporate">Corporate</SelectItem>
              <SelectItem value="loyalty">Loyalty</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Guests Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Loyalty Tier</TableHead>
                <TableHead>Bookings / Spent</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Loading guests...
                  </TableCell>
                </TableRow>
              ) : filteredGuests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No guests found
                  </TableCell>
                </TableRow>
              ) : (
                filteredGuests.map((guest) => (
                  <TableRow key={guest.id}>
                    <TableCell className="font-mono font-medium">
                      {guest.guestCode}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{guest.firstName} {guest.lastName}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          {guest.isVerified && <UserCheck className="h-3 w-3 text-green-600" />}
                          {guest.isBlacklisted && <UserX className="h-3 w-3 text-red-600" />}
                          {guest.isVerified ? "Verified" : "Unverified"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {guest.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {guest.email}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {guest.phoneNumber}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        {getCategoryIcon(guest.guestCategory)}
                        {guest.guestCategory.charAt(0).toUpperCase() + guest.guestCategory.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`capitalize ${
                          guest.loyaltyTier === 'platinum' ? 'bg-purple-100 text-purple-800' :
                          guest.loyaltyTier === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                          guest.loyaltyTier === 'silver' ? 'bg-gray-100 text-gray-800' :
                          'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {guest.loyaltyTier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{guest.totalBookings} bookings</div>
                        <div className="text-gray-600">₹{parseFloat(guest.totalAmountSpent).toLocaleString()}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={guest.source === 'booking_portal' ? "bg-blue-50 text-blue-700" : "bg-gray-50 text-[#006699]"}
                      >
                        {guest.source === 'booking_portal' ? 'Portal' : guest.source === 'direct' ? 'Direct' : guest.source}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={guest.isActive ? "default" : "secondary"}
                          className={guest.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                        >
                          {guest.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {guest.isBlacklisted && (
                          <Badge variant="destructive" className="bg-red-100 text-red-800">
                            Blacklisted
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(guest)}
                          title="Edit Guest"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(guest.id)}
                          title="Delete Guest"
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}