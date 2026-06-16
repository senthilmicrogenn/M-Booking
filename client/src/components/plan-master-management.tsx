import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Bed, 
  Utensils, 
  Coffee, 
  Gift, 
  Star, 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Wifi,
  Car,
  Dumbbell,
  Sparkles
} from "lucide-react";

import type { PlanMaster, NewPlanMaster, MealInclusionMaster, PlanMealInclusion } from "@shared/schema";

const planIcons = {
  bed: Bed,
  utensils: Utensils,
  coffee: Coffee,
  gift: Gift,
  star: Star,
  restaurant: ChefHat
};

const inclusionIcons = {
  wifi: Wifi,
  parking: Car,
  gym: Dumbbell,
  spa: Sparkles,
  room_service: Users,
  laundry: CheckCircle
};

interface PlanMasterFormData {
  planCode: string;
  planName: string;
  planDescription: string | null;
  planType: string;
  hasStandardPricing: boolean | null;
  basePrice: string;
  childPrice: string;
  infantPrice: string;
  childAgeFrom: number;
  childAgeUpto: number;
  infantAgeFrom: number;
  infantAgeUpto: number;
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
  minimumStay: number | null;
  maximumStay: number | null;
  advanceBookingDays: number;
  planIcon: string;
  planColor: string;
  termsAndConditions: string;
  selectedMealInclusions: number[]; // Array of meal inclusion IDs
}

export function PlanMasterManagement() {
  const [selectedPlan, setSelectedPlan] = useState<PlanMaster | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Initial form data
  const getInitialFormData = (): PlanMasterFormData => ({
    planCode: "",
    planName: "",
    planDescription: null,
    planType: "meal_plan",
    hasStandardPricing: false,
    basePrice: "0.00",
    childPrice: "0.00",
    infantPrice: "0.00",
    childAgeFrom: 2,
    childAgeUpto: 12,
    infantAgeFrom: 0,
    infantAgeUpto: 2,
    isActive: true,
    isPopular: false,
    sortOrder: 1,
    minimumStay: 1,
    maximumStay: null,
    advanceBookingDays: 0,
    planIcon: "bed",
    planColor: "#6B7280",
    termsAndConditions: "",
    selectedMealInclusions: []
  });

  const [formData, setFormData] = useState<PlanMasterFormData>(getInitialFormData());

  // Fetch plan masters
  const { data: planMasters = [], isLoading } = useQuery({
    queryKey: ['/api/plan-masters', ...(filterType !== 'all' ? [`?planType=${filterType}`] : [])],
  });

  // Fetch meal inclusions
  const { data: mealInclusions = [] } = useQuery({
    queryKey: ['/api/meal-inclusions', '?isActive=true'],
  });

  // Fetch plan meal inclusions for editing
  const { data: planMealInclusions = [] } = useQuery({
    queryKey: ['/api/plans', selectedPlan?.id, 'meal-inclusions'],
    queryFn: async () => {
      if (!selectedPlan) return [];
      const response = await apiRequest('GET', `/api/plans/${selectedPlan.id}/meal-inclusions`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!selectedPlan?.id
  });

  // Create plan master mutation
  const createPlanMutation = useMutation({
    mutationFn: async (data: { planData: NewPlanMaster; mealInclusions: number[] }) => {
      // Create the plan first
      const response = await apiRequest('POST', '/api/plan-masters', data.planData);
      const plan = await response.json();
      
      // Then create meal inclusions if any
      if (data.mealInclusions.length > 0) {
        for (const mealInclusionId of data.mealInclusions) {
          await apiRequest('POST', `/api/plans/${plan.id}/meal-inclusions`, { 
            mealInclusionId,
            isIncluded: true,
            quantity: 1,
            additionalCost: "0.00"
          });
        }
      }
      
      return plan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/plan-masters'] });
      setIsFormOpen(false);
      setFormData(getInitialFormData());
      toast({ title: "Plan master created successfully" });
    },
    onError: (error: any) => {
      const message = error?.message || error?.response?.data?.message || "Unknown error occurred";
      toast({ 
        title: "Failed to create plan master", 
        description: message,
        variant: "destructive" 
      });
    }
  });

  // Update plan master mutation
  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, planData, mealInclusions }: { id: number; planData: Partial<PlanMaster>; mealInclusions: number[] }) => {
      // Update the plan first
      const response = await apiRequest('PUT', `/api/plan-masters/${id}`, planData);
      const plan = await response.json();
      
      // Get current meal inclusions and remove all
      try {
        const currentInclusionsResponse = await apiRequest('GET', `/api/plans/${id}/meal-inclusions`);
        const currentInclusions = await currentInclusionsResponse.json();
        for (const inclusion of currentInclusions) {
          await apiRequest('DELETE', `/api/plans/${id}/meal-inclusions/${inclusion.mealInclusionId}`);
        }
      } catch (error) {
        // Ignore errors if no existing inclusions
      }
      
      // Add new meal inclusions
      if (mealInclusions.length > 0) {
        for (const mealInclusionId of mealInclusions) {
          await apiRequest('POST', `/api/plans/${id}/meal-inclusions`, { 
            mealInclusionId,
            isIncluded: true,
            quantity: 1,
            additionalCost: "0.00"
          });
        }
      }
      
      return plan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/plan-masters'] });
      queryClient.invalidateQueries({ queryKey: ['/api/plans'] });
      setIsFormOpen(false);
      setIsEditing(false);
      setSelectedPlan(null);
      setFormData(getInitialFormData());
      toast({ title: "Plan master updated successfully" });
    },
    onError: (error: any) => {
      const message = error?.message || error?.response?.data?.message || "Unknown error occurred";
      toast({ 
        title: "Failed to update plan master", 
        description: message,
        variant: "destructive" 
      });
    }
  });

  // Delete plan master mutation
  const deletePlanMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/plan-masters/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/plan-masters'] });
      toast({ title: "Plan master deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete plan master", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const { selectedMealInclusions, ...planData } = formData;
    const submitData: NewPlanMaster = {
      ...planData,
      basePrice: formData.basePrice,
      childPrice: formData.childPrice,
      infantPrice: formData.infantPrice
    };

    if (isEditing && selectedPlan) {
      updatePlanMutation.mutate({ 
        id: selectedPlan.id, 
        planData: submitData, 
        mealInclusions: selectedMealInclusions 
      });
    } else {
      createPlanMutation.mutate({ 
        planData: submitData, 
        mealInclusions: selectedMealInclusions 
      });
    }
  };

  const handleEdit = async (plan: PlanMaster) => {
    setSelectedPlan(plan);
    
    // Load existing meal inclusions for this plan
    let existingMealInclusions: number[] = [];
    try {
      const planInclusionsResponse = await apiRequest('GET', `/api/plans/${plan.id}/meal-inclusions`);
      const planInclusions = await planInclusionsResponse.json();
      existingMealInclusions = Array.isArray(planInclusions) ? planInclusions.map((inclusion: any) => inclusion.mealInclusionId) : [];
    } catch (error) {
      // Ignore error if no inclusions exist
    }
    
    setFormData({
      // Only include business fields, NOT id, createdAt, updatedAt
      planCode: plan.planCode,
      planName: plan.planName,
      planDescription: plan.planDescription,
      planType: plan.planType,
      hasStandardPricing: plan.hasStandardPricing,
      basePrice: plan.basePrice?.toString() || "0.00",
      childPrice: plan.childPrice?.toString() || "0.00",
      infantPrice: plan.infantPrice?.toString() || "0.00",
      childAgeFrom: plan.childAgeFrom || 2,
      childAgeUpto: plan.childAgeUpto || 12,
      infantAgeFrom: plan.infantAgeFrom || 0,
      infantAgeUpto: plan.infantAgeUpto || 2,
      isActive: plan.isActive,
      isPopular: plan.isPopular,
      sortOrder: plan.sortOrder,
      minimumStay: plan.minimumStay,
      maximumStay: plan.maximumStay,
      advanceBookingDays: plan.advanceBookingDays,
      planIcon: plan.planIcon,
      planColor: plan.planColor,
      termsAndConditions: plan.termsAndConditions,
      includesBreakfast: plan.includesBreakfast,
      includesLunch: plan.includesLunch,
      includesDinner: plan.includesDinner,
      includesWifi: plan.includesWifi,
      includesGym: plan.includesGym,
      selectedMealInclusions: existingMealInclusions
    });
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleDelete = (plan: PlanMaster) => {
    if (confirm(`Are you sure you want to delete ${plan.planName}?`)) {
      deletePlanMutation.mutate(plan.id);
    }
  };

  const resetForm = () => {
    setFormData(getInitialFormData());
    setSelectedPlan(null);
    setIsEditing(false);
  };

  const PlanIcon = ({ iconName, className }: { iconName: string; className?: string }) => {
    const Icon = planIcons[iconName as keyof typeof planIcons] || Bed;
    return <Icon className={className} />;
  };

  const InclusionIcon = ({ iconName, className }: { iconName: string; className?: string }) => {
    const Icon = inclusionIcons[iconName as keyof typeof inclusionIcons] || CheckCircle;
    return <Icon className={className} />;
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading plan masters...</div>;
  }

  return (
    <div className="space-y-6" data-testid="plan-master-management">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Plan Master Management</h2>
          <p className="text-primary-600 dark:text-gray-300">Manage hotel meal plans and pricing packages</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48" data-testid="filter-plan-type">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="meal_plan">Meal Plans</SelectItem>
              <SelectItem value="package_plan">Package Plans</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isFormOpen} onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-plan">
                <Plus className="h-4 w-4 mr-2" />
                Add Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isEditing ? 'Edit Plan Master' : 'Create New Plan Master'}</DialogTitle>
                <DialogDescription>
                  {isEditing ? 'Update the plan master details' : 'Create a new meal plan or package for your properties'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="inclusions">Inclusions</TabsTrigger>
                    <TabsTrigger value="pricing">Pricing</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="planCode">Plan Code *</Label>
                        <Input
                          id="planCode"
                          value={formData.planCode}
                          onChange={(e) => setFormData({ ...formData, planCode: e.target.value.toUpperCase() })}
                          placeholder="EP, MAP, AP"
                          maxLength={10}
                          required
                          data-testid="input-plan-code"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="planType">Plan Type</Label>
                        <Select 
                          value={formData.planType} 
                          onValueChange={(value) => setFormData({ ...formData, planType: value })}
                        >
                          <SelectTrigger data-testid="select-plan-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="meal_plan">Meal Plan</SelectItem>
                            <SelectItem value="package_plan">Package Plan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="planName">Plan Name *</Label>
                      <Input
                        id="planName"
                        value={formData.planName}
                        onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                        placeholder="European Plan"
                        required
                        data-testid="input-plan-name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="planDescription">Description</Label>
                      <Textarea
                        id="planDescription"
                        value={formData.planDescription || ""}
                        onChange={(e) => setFormData({ ...formData, planDescription: e.target.value })}
                        placeholder="Detailed description of what's included in this plan"
                        rows={3}
                        data-testid="textarea-plan-description"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="planIcon">Plan Icon</Label>
                        <Select 
                          value={formData.planIcon || "bed"} 
                          onValueChange={(value) => setFormData({ ...formData, planIcon: value })}
                        >
                          <SelectTrigger data-testid="select-plan-icon">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bed">🛏️ Bed</SelectItem>
                            <SelectItem value="utensils">🍽️ Utensils</SelectItem>
                            <SelectItem value="coffee">☕ Coffee</SelectItem>
                            <SelectItem value="restaurant">🍴 Restaurant</SelectItem>
                            <SelectItem value="gift">🎁 Gift</SelectItem>
                            <SelectItem value="star">⭐ Star</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="planColor">Plan Color</Label>
                        <Input
                          id="planColor"
                          type="color"
                          value={formData.planColor}
                          onChange={(e) => setFormData({ ...formData, planColor: e.target.value })}
                          data-testid="input-plan-color"
                        />
                      </div>

                      <div>
                        <Label htmlFor="sortOrder">Sort Order</Label>
                        <Input
                          id="sortOrder"
                          type="number"
                          value={formData.sortOrder}
                          onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                          min="1"
                          data-testid="input-sort-order"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="inclusions" className="space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Meal Inclusions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {[
                            { key: 'includesBreakfast', label: 'Breakfast' },
                            { key: 'includesLunch', label: 'Lunch' },
                            { key: 'includesDinner', label: 'Dinner' },
                            { key: 'includesSnacks', label: 'Snacks' },
                            { key: 'includesBeverages', label: 'Beverages' },
                            { key: 'includesAlcohol', label: 'Alcohol' }
                          ].map(({ key, label }) => (
                            <div key={key} className="flex items-center justify-between">
                              <Label htmlFor={key}>{label}</Label>
                              <Switch
                                id={key}
                                checked={formData[key as keyof PlanMasterFormData] as boolean}
                                onCheckedChange={(checked) => 
                                  setFormData({ ...formData, [key]: checked })
                                }
                                data-testid={`switch-${key}`}
                              />
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Service Inclusions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {[
                            { key: 'includesRoomService', label: 'Room Service' },
                            { key: 'includesLaundry', label: 'Laundry' },
                            { key: 'includesWifi', label: 'WiFi' },
                            { key: 'includesParking', label: 'Parking' },
                            { key: 'includesGym', label: 'Gym Access' },
                            { key: 'includesSpa', label: 'Spa Access' }
                          ].map(({ key, label }) => (
                            <div key={key} className="flex items-center justify-between">
                              <Label htmlFor={key}>{label}</Label>
                              <Switch
                                id={key}
                                checked={formData[key as keyof PlanMasterFormData] as boolean}
                                onCheckedChange={(checked) => 
                                  setFormData({ ...formData, [key]: checked })
                                }
                                data-testid={`switch-${key}`}
                              />
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="pricing" className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <Switch
                        id="hasStandardPricing"
                        checked={formData.hasStandardPricing}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, hasStandardPricing: checked })
                        }
                        data-testid="switch-has-standard-pricing"
                      />
                      <Label htmlFor="hasStandardPricing">Enable Standard Pricing</Label>
                    </div>

                    {formData.hasStandardPricing && (
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="basePrice">Base Price per Day</Label>
                          <Input
                            id="basePrice"
                            type="number"
                            step="0.01"
                            value={formData.basePrice}
                            onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                            placeholder="0.00"
                            data-testid="input-base-price"
                          />
                        </div>

                        <div>
                          <Label htmlFor="childPrice">Child Price per Day</Label>
                          <Input
                            id="childPrice"
                            type="number"
                            step="0.01"
                            value={formData.childPrice}
                            onChange={(e) => setFormData({ ...formData, childPrice: e.target.value })}
                            placeholder="0.00"
                            data-testid="input-child-price"
                          />
                        </div>

                        <div>
                          <Label htmlFor="infantPrice">Infant Price per Day</Label>
                          <Input
                            id="infantPrice"
                            type="number"
                            step="0.01"
                            value={formData.infantPrice}
                            onChange={(e) => setFormData({ ...formData, infantPrice: e.target.value })}
                            placeholder="0.00"
                            data-testid="input-infant-price"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="childAgeFrom">Child Age From</Label>
                          <Input
                            id="childAgeFrom"
                            type="number"
                            value={formData.childAgeFrom}
                            onChange={(e) => setFormData({ ...formData, childAgeFrom: parseInt(e.target.value) })}
                            min="0"
                            data-testid="input-child-age-from"
                          />
                        </div>
                        <div>
                          <Label htmlFor="childAgeUpto">Child Age Up To</Label>
                          <Input
                            id="childAgeUpto"
                            type="number"
                            value={formData.childAgeUpto}
                            onChange={(e) => setFormData({ ...formData, childAgeUpto: parseInt(e.target.value) })}
                            min="0"
                            data-testid="input-child-age-upto"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="infantAgeFrom">Infant Age From</Label>
                          <Input
                            id="infantAgeFrom"
                            type="number"
                            value={formData.infantAgeFrom}
                            onChange={(e) => setFormData({ ...formData, infantAgeFrom: parseInt(e.target.value) })}
                            min="0"
                            data-testid="input-infant-age-from"
                          />
                        </div>
                        <div>
                          <Label htmlFor="infantAgeUpto">Infant Age Up To</Label>
                          <Input
                            id="infantAgeUpto"
                            type="number"
                            value={formData.infantAgeUpto}
                            onChange={(e) => setFormData({ ...formData, infantAgeUpto: parseInt(e.target.value) })}
                            min="0"
                            data-testid="input-infant-age-upto"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="minimumStay">Minimum Stay (nights)</Label>
                        <Input
                          id="minimumStay"
                          type="number"
                          value={formData.minimumStay}
                          onChange={(e) => setFormData({ ...formData, minimumStay: parseInt(e.target.value) })}
                          min="1"
                          data-testid="input-minimum-stay"
                        />
                      </div>

                      <div>
                        <Label htmlFor="maximumStay">Maximum Stay (nights)</Label>
                        <Input
                          id="maximumStay"
                          type="number"
                          value={formData.maximumStay || ""}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            maximumStay: e.target.value ? parseInt(e.target.value) : null 
                          })}
                          min="1"
                          placeholder="No limit"
                          data-testid="input-maximum-stay"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="advanceBookingDays">Advance Booking Required (days)</Label>
                      <Input
                        id="advanceBookingDays"
                        type="number"
                        value={formData.advanceBookingDays}
                        onChange={(e) => setFormData({ ...formData, advanceBookingDays: parseInt(e.target.value) })}
                        min="0"
                        data-testid="input-advance-booking-days"
                      />
                    </div>

                    <div>
                      <Label htmlFor="termsAndConditions">Terms & Conditions</Label>
                      <Textarea
                        id="termsAndConditions"
                        value={formData.termsAndConditions || ""}
                        onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                        placeholder="Terms and conditions specific to this plan"
                        rows={3}
                        data-testid="textarea-terms-conditions"
                      />
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => 
                            setFormData({ ...formData, isActive: checked })
                          }
                          data-testid="switch-is-active"
                        />
                        <Label htmlFor="isActive">Active</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isPopular"
                          checked={formData.isPopular}
                          onCheckedChange={(checked) => 
                            setFormData({ ...formData, isPopular: checked })
                          }
                          data-testid="switch-is-popular"
                        />
                        <Label htmlFor="isPopular">Popular Plan</Label>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsFormOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                    data-testid="button-save-plan"
                  >
                    {createPlanMutation.isPending || updatePlanMutation.isPending ? 'Saving...' : 
                     isEditing ? 'Update Plan' : 'Create Plan'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(planMasters as any[])?.map((plan: any) => (
          <Card key={plan.id} className="relative" data-testid={`plan-card-${plan.id}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="p-2 rounded"
                    style={{ backgroundColor: plan.planColor + '20', color: plan.planColor }}
                  >
                    <PlanIcon iconName={plan.planIcon || "bed"} className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{plan.planName}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{plan.planCode}</Badge>
                      {plan.isPopular && <Badge variant="default">Popular</Badge>}
                      {!plan.isActive && <Badge variant="destructive">Inactive</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleEdit(plan)}
                    data-testid={`button-edit-${plan.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleDelete(plan)}
                    data-testid={`button-delete-${plan.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {plan.planDescription}
              </p>

              {plan.hasStandardPricing && (
                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">
                    ₹{plan.basePrice}/day
                  </span>
                  {plan.childPrice !== "0.00" && (
                    <span className="text-xs text-gray-500">
                      (Child: ₹{plan.childPrice})
                    </span>
                  )}
                </div>
              )}

              <div className="space-y-2">
                {plan.includesBreakfast && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Breakfast included</span>
                  </div>
                )}
                {plan.includesLunch && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Lunch included</span>
                  </div>
                )}
                {plan.includesDinner && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Dinner included</span>
                  </div>
                )}
                {plan.includesWifi && (
                  <div className="flex items-center gap-2 text-sm">
                    <Wifi className="h-3 w-3 text-blue-600" />
                    <span>WiFi included</span>
                  </div>
                )}
                {plan.includesGym && (
                  <div className="flex items-center gap-2 text-sm">
                    <Dumbbell className="h-3 w-3 text-orange-600" />
                    <span>Gym access</span>
                  </div>
                )}
              </div>

              {plan.minimumStay > 1 && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>Min {plan.minimumStay} nights</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {planMasters.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <ChefHat className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No plan masters found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Create your first plan master to get started.
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Plan Master
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}