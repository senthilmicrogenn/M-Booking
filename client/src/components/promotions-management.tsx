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
  Tag, 
  Plus, 
  Edit, 
  Trash2, 
  Percent,
  DollarSign,
  Calendar,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Gift,
  Users,
  Hotel,
  Building
} from "lucide-react";

// Types for promotions
interface Promotion {
  id: number;
  title: string;
  description: string;
  code: string;
  discountType: string; // 'percentage' | 'fixed'
  discountValue: string;
  minAmount: string | null;
  maxDiscount: string | null;
  validFrom: Date;
  validUntil: Date;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  applicableFor: string[]; // ['hotel', 'conference_room']
  createdAt: Date;
}

// Form schema for promotions
const promotionFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  code: z.string().min(3, "Code must be at least 3 characters").max(20, "Code must be less than 20 characters"),
  discountType: z.enum(["percentage", "fixed"], { required_error: "Discount type is required" }),
  discountValue: z.string().min(1, "Discount value is required"),
  minAmount: z.string().optional(),
  maxDiscount: z.string().optional(),
  validFrom: z.string().min(1, "Valid from date is required"),
  validUntil: z.string().min(1, "Valid until date is required"),
  usageLimit: z.string().optional(),
  isActive: z.boolean().default(true),
  applicableFor: z.array(z.string()).min(1, "At least one applicable service is required"),
});

type PromotionFormData = z.infer<typeof promotionFormSchema>;

export function PromotionsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all promotions for admin
  const { data: promotions = [], isLoading } = useQuery<Promotion[]>({
    queryKey: ["/api/promotions/all"],
  });

  // Form for promotion creation/editing
  const form = useForm<PromotionFormData>({
    resolver: zodResolver(promotionFormSchema),
    defaultValues: {
      title: "",
      description: "",
      code: "",
      discountType: "percentage",
      discountValue: "",
      minAmount: "",
      maxDiscount: "",
      validFrom: "",
      validUntil: "",
      usageLimit: "",
      isActive: true,
      applicableFor: [],
    },
  });

  // Create promotion mutation
  const createPromotionMutation = useMutation({
    mutationFn: (data: PromotionFormData) => {
      const promotionData = {
        ...data,
        discountValue: parseFloat(data.discountValue).toString(),
        minAmount: data.minAmount ? parseFloat(data.minAmount).toString() : null,
        maxDiscount: data.maxDiscount ? parseFloat(data.maxDiscount).toString() : null,
        validFrom: new Date(data.validFrom),
        validUntil: new Date(data.validUntil),
        usageLimit: data.usageLimit ? parseInt(data.usageLimit) : null,
        usedCount: 0,
      };
      
      return apiRequest("POST", "/api/promotions", promotionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotions/all"] });
      setShowCreateDialog(false);
      form.reset();
      toast({ title: "Success", description: "Promotion created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create promotion",
        variant: "destructive" 
      });
    },
  });

  // Update promotion mutation
  const updatePromotionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: PromotionFormData }) => {
      const promotionData = {
        ...data,
        discountValue: parseFloat(data.discountValue).toString(),
        minAmount: data.minAmount ? parseFloat(data.minAmount).toString() : null,
        maxDiscount: data.maxDiscount ? parseFloat(data.maxDiscount).toString() : null,
        validFrom: new Date(data.validFrom),
        validUntil: new Date(data.validUntil),
        usageLimit: data.usageLimit ? parseInt(data.usageLimit) : null,
      };
      
      return apiRequest("PUT", `/api/promotions/${id}`, promotionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotions/all"] });
      setEditingPromotion(null);
      setShowCreateDialog(false);
      form.reset();
      toast({ title: "Success", description: "Promotion updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update promotion",
        variant: "destructive" 
      });
    },
  });

  // Delete promotion mutation
  const deletePromotionMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/promotions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotions/all"] });
      toast({ title: "Success", description: "Promotion deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete promotion",
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (data: PromotionFormData) => {
    if (editingPromotion) {
      updatePromotionMutation.mutate({ id: editingPromotion.id, data });
    } else {
      createPromotionMutation.mutate(data);
    }
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    form.reset({
      title: promotion.title,
      description: promotion.description,
      code: promotion.code,
      discountType: promotion.discountType as "percentage" | "fixed",
      discountValue: promotion.discountValue.toString(),
      minAmount: promotion.minAmount?.toString() || "",
      maxDiscount: promotion.maxDiscount?.toString() || "",
      validFrom: new Date(promotion.validFrom).toISOString().split('T')[0],
      validUntil: new Date(promotion.validUntil).toISOString().split('T')[0],
      usageLimit: promotion.usageLimit?.toString() || "",
      isActive: promotion.isActive,
      applicableFor: promotion.applicableFor,
    });
    setShowCreateDialog(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this promotion?")) {
      deletePromotionMutation.mutate(id);
    }
  };

  const filteredPromotions = promotions.filter(promotion => 
    searchTerm === "" || 
    promotion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    promotion.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const isPromotionActive = (promotion: Promotion) => {
    const now = new Date();
    const validFrom = new Date(promotion.validFrom);
    const validUntil = new Date(promotion.validUntil);
    return promotion.isActive && now >= validFrom && now <= validUntil;
  };

  const getStatusBadge = (promotion: Promotion) => {
    if (!promotion.isActive) {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactive</Badge>;
    }
    
    const now = new Date();
    const validFrom = new Date(promotion.validFrom);
    const validUntil = new Date(promotion.validUntil);
    
    if (now < validFrom) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Scheduled</Badge>;
    } else if (now > validUntil) {
      return <Badge variant="secondary" className="bg-red-100 text-red-800">Expired</Badge>;
    } else {
      return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
    }
  };

  return (
    <Card data-testid="card-promotions-management">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-orange-600" />
              Promotions & Coupon Management
            </CardTitle>
            <CardDescription>
              Create and manage discount codes, promotional offers, and coupon campaigns
            </CardDescription>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button 
                className="bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)]"
                data-testid="button-create-promotion"
                onClick={() => {
                  setEditingPromotion(null);
                  form.reset();
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Promotion
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPromotion ? "Edit Promotion" : "Create New Promotion"}
                </DialogTitle>
                <DialogDescription>
                  {editingPromotion ? "Update the promotion details" : "Create a new discount code or promotional offer"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Summer Sale 2024"
                              {...field}
                              data-testid="input-promotion-title"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Promo Code</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="SUMMER20"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                              data-testid="input-promotion-code"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Get 20% off on all hotel bookings this summer"
                            {...field}
                            data-testid="input-promotion-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="discountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-discount-type">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="fixed">Fixed Amount</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="discountValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount Value</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              placeholder="20"
                              {...field}
                              data-testid="input-discount-value"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="maxDiscount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Discount (₹)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              placeholder="1000"
                              {...field}
                              data-testid="input-max-discount"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="minAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Amount (₹)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              placeholder="500"
                              {...field}
                              data-testid="input-min-amount"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="usageLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Usage Limit</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="100"
                              {...field}
                              data-testid="input-usage-limit"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="validFrom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valid From</FormLabel>
                          <FormControl>
                            <Input 
                              type="date"
                              {...field}
                              data-testid="input-valid-from"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="validUntil"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valid Until</FormLabel>
                          <FormControl>
                            <Input 
                              type="date"
                              {...field}
                              data-testid="input-valid-until"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="applicableFor"
                    render={() => (
                      <FormItem>
                        <FormLabel>Applicable For</FormLabel>
                        <div className="grid grid-cols-2 gap-2">
                          {["hotel", "conference_room"].map((service) => (
                            <FormField
                              key={service}
                              control={form.control}
                              name="applicableFor"
                              render={({ field }) => (
                                <FormItem
                                  key={service}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <input
                                      type="checkbox"
                                      checked={field.value?.includes(service)}
                                      onChange={(e) => {
                                        const updatedValue = e.target.checked
                                          ? [...(field.value || []), service]
                                          : (field.value || []).filter((value) => value !== service);
                                        field.onChange(updatedValue);
                                      }}
                                      data-testid={`checkbox-applicable-${service}`}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {service === "hotel" ? "Hotels" : "Conference Rooms"}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active Status</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Enable or disable this promotion
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-is-active"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCreateDialog(false)}
                      data-testid="button-cancel-promotion"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createPromotionMutation.isPending || updatePromotionMutation.isPending}
                      data-testid="button-save-promotion"
                    >
                      {editingPromotion ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
                data-testid="input-search-promotions"
              />
            </div>
          </div>

          {/* Promotions Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title / Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Valid Period</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Applicable For</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      Loading promotions...
                    </TableCell>
                  </TableRow>
                ) : filteredPromotions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No promotions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPromotions.map((promotion) => (
                    <TableRow key={promotion.id} data-testid={`row-promotion-${promotion.id}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{promotion.title}</div>
                          <Badge variant="outline" className="mt-1">
                            {promotion.code}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {promotion.discountType === "percentage" ? (
                            <Percent className="h-4 w-4 text-green-600" />
                          ) : (
                            <DollarSign className="h-4 w-4 text-blue-600" />
                          )}
                          <span className="font-medium">
                            {promotion.discountType === "percentage" 
                              ? `${promotion.discountValue}%` 
                              : `₹${promotion.discountValue}`}
                          </span>
                        </div>
                        {promotion.maxDiscount && (
                          <div className="text-sm text-gray-600">
                            Max: ₹{promotion.maxDiscount}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(promotion.validFrom)}</div>
                          <div className="text-gray-600">to {formatDate(promotion.validUntil)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{promotion.usedCount} used</div>
                          {promotion.usageLimit && (
                            <div className="text-gray-600">
                              of {promotion.usageLimit} limit
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {promotion.applicableFor.map((service) => (
                            <Badge key={service} variant="secondary" className="text-xs">
                              {service === "hotel" ? (
                                <Hotel className="h-3 w-3 mr-1" />
                              ) : (
                                <Building className="h-3 w-3 mr-1" />
                              )}
                              {service === "hotel" ? "Hotels" : "Conference"}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(promotion)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(promotion)}
                            data-testid={`button-edit-promotion-${promotion.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(promotion.id)}
                            data-testid={`button-delete-promotion-${promotion.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary Stats */}
          {!isLoading && filteredPromotions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Tag className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Promotions</p>
                      <p className="text-2xl font-bold">{filteredPromotions.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Promotions</p>
                      <p className="text-2xl font-bold">
                        {filteredPromotions.filter(p => isPromotionActive(p)).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Usage</p>
                      <p className="text-2xl font-bold">
                        {filteredPromotions.reduce((sum, p) => sum + p.usedCount, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <XCircle className="h-8 w-8 text-red-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Expired</p>
                      <p className="text-2xl font-bold">
                        {filteredPromotions.filter(p => new Date(p.validUntil) < new Date()).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}