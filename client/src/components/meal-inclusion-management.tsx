import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Filter, Utensils, Coffee, Wine, Spa, Wifi, Search } from "lucide-react";
import type { MealInclusionMaster, NewMealInclusionMaster } from "@shared/schema";

// Form schema for meal inclusion management
const mealInclusionFormSchema = z.object({
  mealCode: z.string().min(1, "Meal code is required").max(10, "Meal code too long"),
  mealName: z.string().min(2, "Meal name must be at least 2 characters").max(100, "Meal name too long"),
  mealDescription: z.string().optional(),
  mealCategory: z.enum(["meal", "beverage", "service", "amenity"], {
    errorMap: () => ({ message: "Please select a valid category" })
  }),
  displayOrder: z.number().min(1).optional(),
  mealIcon: z.string().optional(),
  mealColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Please enter a valid hex color").optional(),
  isActive: z.boolean().default(true),
  isPopular: z.boolean().default(false),
  hasAdditionalCost: z.boolean().default(false),
  additionalCostPercentage: z.string().refine((val) => {
    if (!val) return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 100;
  }, "Cost percentage must be between 0 and 100").optional(),
  servingTimes: z.string().optional(),
  dietary: z.string().optional()
});

type MealInclusionFormData = z.infer<typeof mealInclusionFormSchema>;

// Icon mapping for meal categories
const getCategoryIcon = (category: string) => {
  switch (category) {
    case "meal":
      return <Utensils className="h-4 w-4" />;
    case "beverage":
      return <Coffee className="h-4 w-4" />;
    case "service":
      return <Spa className="h-4 w-4" />;
    case "amenity":
      return <Wifi className="h-4 w-4" />;
    default:
      return <Utensils className="h-4 w-4" />;
  }
};

// Color mapping for categories
const getCategoryColor = (category: string) => {
  switch (category) {
    case "meal":
      return "bg-green-100 text-green-800 border-green-200";
    case "beverage":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "service":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "amenity":
      return "bg-teal-100 text-teal-800 border-teal-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export default function MealInclusionManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInclusion, setEditingInclusion] = useState<MealInclusionMaster | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch meal inclusions with filters
  const { data: mealInclusions = [], isLoading } = useQuery({
    queryKey: ["/api/meal-inclusions", { isActive: true, mealCategory: selectedCategory }],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append("isActive", "true");
      if (selectedCategory) {
        params.append("mealCategory", selectedCategory);
      }
      return fetch(`/api/meal-inclusions?${params}`).then(res => res.json());
    }
  });

  // Form setup
  const form = useForm<MealInclusionFormData>({
    resolver: zodResolver(mealInclusionFormSchema),
    defaultValues: {
      mealCode: "",
      mealName: "",
      mealDescription: "",
      mealCategory: "meal",
      displayOrder: 1,
      mealIcon: "",
      mealColor: "#6B7280",
      isActive: true,
      isPopular: false,
      hasAdditionalCost: false,
      additionalCostPercentage: "0.00",
      servingTimes: "",
      dietary: ""
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: NewMealInclusionMaster) => 
      apiRequest("POST", "/api/meal-inclusions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-inclusions"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Meal inclusion created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create meal inclusion",
        variant: "destructive",
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<MealInclusionMaster> }) =>
      apiRequest("PUT", `/api/meal-inclusions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-inclusions"] });
      setIsDialogOpen(false);
      setEditingInclusion(null);
      form.reset();
      toast({
        title: "Success",
        description: "Meal inclusion updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update meal inclusion",
        variant: "destructive",
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/meal-inclusions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-inclusions"] });
      toast({
        title: "Success",
        description: "Meal inclusion deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete meal inclusion",
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const onSubmit = (data: MealInclusionFormData) => {
    const formattedData = {
      ...data,
      displayOrder: data.displayOrder || 1,
      additionalCostPercentage: data.additionalCostPercentage || "0.00"
    };

    if (editingInclusion) {
      updateMutation.mutate({ id: editingInclusion.id, data: formattedData });
    } else {
      createMutation.mutate(formattedData);
    }
  };

  // Handle edit
  const handleEdit = (inclusion: MealInclusionMaster) => {
    setEditingInclusion(inclusion);
    form.reset({
      mealCode: inclusion.mealCode,
      mealName: inclusion.mealName,
      mealDescription: inclusion.mealDescription || "",
      mealCategory: inclusion.mealCategory as "meal" | "beverage" | "service" | "amenity",
      displayOrder: inclusion.displayOrder || 1,
      mealIcon: inclusion.mealIcon || "",
      mealColor: inclusion.mealColor || "#6B7280",
      isActive: inclusion.isActive,
      isPopular: inclusion.isPopular,
      hasAdditionalCost: inclusion.hasAdditionalCost,
      additionalCostPercentage: inclusion.additionalCostPercentage || "0.00",
      servingTimes: inclusion.servingTimes || "",
      dietary: inclusion.dietary || ""
    });
    setIsDialogOpen(true);
  };

  // Handle delete
  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this meal inclusion?")) {
      deleteMutation.mutate(id);
    }
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingInclusion(null);
    form.reset();
  };

  // Filter meal inclusions based on search query
  const filteredInclusions = mealInclusions.filter((inclusion: MealInclusionMaster) =>
    inclusion.mealName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inclusion.mealCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inclusion.mealCategory.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="meal-inclusion-management">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
            Meal Inclusion Master
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage meal inclusions, services, and amenities for your plans
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-[#6B8E23] hover:bg-[#556B2F] text-white"
              data-testid="button-create-meal-inclusion"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Meal Inclusion
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="dialog-title">
                {editingInclusion ? "Edit Meal Inclusion" : "Create New Meal Inclusion"}
              </DialogTitle>
              <DialogDescription>
                {editingInclusion 
                  ? "Update the meal inclusion details" 
                  : "Add a new meal inclusion to your system"
                }
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mealCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meal Code *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="BF, LN, DN" 
                            {...field} 
                            data-testid="input-meal-code"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mealCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-meal-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="meal">Meal</SelectItem>
                            <SelectItem value="beverage">Beverage</SelectItem>
                            <SelectItem value="service">Service</SelectItem>
                            <SelectItem value="amenity">Amenity</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="mealName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meal Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Breakfast, Lunch, Wi-Fi Access" 
                          {...field} 
                          data-testid="input-meal-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mealDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detailed description of the meal inclusion"
                          className="resize-none"
                          {...field}
                          data-testid="textarea-meal-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="displayOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Order</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            data-testid="input-display-order"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mealIcon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="coffee, utensils" 
                            {...field} 
                            data-testid="input-meal-icon"
                          />
                        </FormControl>
                        <FormDescription>Lucide icon name</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mealColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                          <Input 
                            type="color" 
                            {...field} 
                            data-testid="input-meal-color"
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
                    name="hasAdditionalCost"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Additional Cost</FormLabel>
                          <FormDescription>Has additional charges</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-additional-cost"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {form.watch("hasAdditionalCost") && (
                    <FormField
                      control={form.control}
                      name="additionalCostPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost Percentage</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              min="0"
                              max="100"
                              placeholder="0.00" 
                              {...field} 
                              data-testid="input-cost-percentage"
                            />
                          </FormControl>
                          <FormDescription>Percentage markup (0-100%)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="servingTimes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serving Times</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder='["07:00-10:30", "19:00-22:00"]' 
                            {...field} 
                            data-testid="input-serving-times"
                          />
                        </FormControl>
                        <FormDescription>JSON format time ranges</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dietary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dietary Info</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder='["vegetarian", "vegan"]' 
                            {...field} 
                            data-testid="input-dietary"
                          />
                        </FormControl>
                        <FormDescription>JSON format dietary options</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex space-x-4">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-active"
                          />
                        </FormControl>
                        <FormLabel>Active</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isPopular"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-popular"
                          />
                        </FormControl>
                        <FormLabel>Popular</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDialogClose}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#6B8E23] hover:bg-[#556B2F]"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save"
                  >
                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search meal inclusions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48" data-testid="select-filter-category">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            <SelectItem value="meal">Meal</SelectItem>
            <SelectItem value="beverage">Beverage</SelectItem>
            <SelectItem value="service">Service</SelectItem>
            <SelectItem value="amenity">Amenity</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Meal Inclusions Grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-[#6B8E23] border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading meal inclusions...</p>
        </div>
      ) : filteredInclusions.length === 0 ? (
        <div className="text-center py-12">
          <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No meal inclusions found</h3>
          <p className="text-gray-600 dark:text-gray-400">Get started by creating your first meal inclusion.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInclusions.map((inclusion: MealInclusionMaster) => (
            <Card 
              key={inclusion.id} 
              className="hover:shadow-lg transition-shadow duration-200"
              data-testid={`card-meal-inclusion-${inclusion.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(inclusion.mealCategory)}
                    <Badge 
                      variant="outline" 
                      className={getCategoryColor(inclusion.mealCategory)}
                    >
                      {inclusion.mealCategory}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1">
                    {inclusion.isPopular && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        Popular
                      </Badge>
                    )}
                    <Badge 
                      variant={inclusion.isActive ? "default" : "secondary"}
                      className={inclusion.isActive ? "bg-green-100 text-green-800" : ""}
                    >
                      {inclusion.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-xl" data-testid={`text-meal-name-${inclusion.id}`}>
                  {inclusion.mealName}
                </CardTitle>
                <CardDescription>
                  <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {inclusion.mealCode}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inclusion.mealDescription && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {inclusion.mealDescription}
                    </p>
                  )}
                  
                  {inclusion.hasAdditionalCost && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Additional Cost:</span>
                      <span className="text-sm font-medium text-red-600">
                        +{inclusion.additionalCostPercentage}%
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="text-xs text-gray-500">
                      Order: {inclusion.displayOrder}
                    </span>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(inclusion)}
                        data-testid={`button-edit-${inclusion.id}`}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(inclusion.id)}
                        className="text-red-600 hover:text-red-700"
                        data-testid={`button-delete-${inclusion.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}