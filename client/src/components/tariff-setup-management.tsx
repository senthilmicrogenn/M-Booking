import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Calculator, Search, Filter, Clock, Target } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertTariffSetupMasterSchema, type TariffSetupMaster, type SubledgerMaster } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

export function TariffSetupManagement() {
  const [editingTariff, setEditingTariff] = useState<TariffSetupMaster | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubledger, setFilterSubledger] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof insertTariffSetupMasterSchema>>({
    resolver: zodResolver(insertTariffSetupMasterSchema),
    defaultValues: {
      fromAmount: "",
      toAmount: "",
      cgstPercentage: "",
      sgstPercentage: "",
      validFromDate: "",
      validToDate: "",
      subledgerId: 1,
      cgstSubledgerId: undefined,
      sgstSubledgerId: undefined,
      graceHour: 0,
      isActive: true,
      description: ""
    }
  });

  const { data: tariffSetups = [], isLoading } = useQuery({
    queryKey: ["/api/tariff-setups"],
    queryFn: async () => {
      const response = await fetch("/api/tariff-setups");
      if (!response.ok) throw new Error('Failed to fetch tariff setups');
      return response.json();
    }
  });

  const { data: subledgers = [] } = useQuery({
    queryKey: ["/api/subledgers"],
    queryFn: async () => {
      const response = await fetch("/api/subledgers");
      if (!response.ok) throw new Error('Failed to fetch subledgers');
      return response.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertTariffSetupMasterSchema>) => {
      const response = await fetch("/api/tariff-setups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to create tariff setup');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tariff-setups"] });
      setIsDialogOpen(false);
      setEditingTariff(null);
      form.reset();
      toast({ title: "Tariff setup created successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create tariff setup", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<TariffSetupMaster>) => {
      const response = await fetch(`/api/tariff-setups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to update tariff setup');
      }
      return response.json();
    },
    onSuccess: () => {
      // Force fresh data fetch
      queryClient.invalidateQueries({ queryKey: ["/api/tariff-setups"] });
      queryClient.refetchQueries({ queryKey: ["/api/tariff-setups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subledgers"] });
      setIsDialogOpen(false);
      setEditingTariff(null);
      form.reset();
      toast({ 
        title: "Tariff setup updated successfully",
        description: "Changes have been saved and are now visible." 
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to update tariff setup", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/tariff-setups/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete tariff setup');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tariff-setups"] });
      toast({ title: "Tariff setup deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to delete tariff setup", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleSubmit = (data: z.infer<typeof insertTariffSetupMasterSchema>) => {
    if (editingTariff) {
      updateMutation.mutate({ id: editingTariff.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (tariff: TariffSetupMaster) => {
    setEditingTariff(tariff);
    form.reset({
      fromAmount: tariff.fromAmount,
      toAmount: tariff.toAmount,
      cgstPercentage: tariff.cgstPercentage,
      sgstPercentage: tariff.sgstPercentage,
      validFromDate: tariff.validFromDate,
      validToDate: tariff.validToDate,
      subledgerId: tariff.subledgerId,
      cgstSubledgerId: tariff.cgstSubledgerId || undefined,
      sgstSubledgerId: tariff.sgstSubledgerId || undefined,
      graceHour: tariff.graceHour,
      isActive: tariff.isActive,
      description: tariff.description || ""
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingTariff(null);
    
    // Ensure we have a valid subledger ID
    const defaultSubledgerId = subledgers && subledgers.length > 0 ? subledgers[0].id : 1;
    
    form.reset({
      fromAmount: "",
      toAmount: "",
      cgstPercentage: "",
      sgstPercentage: "",
      validFromDate: "",
      validToDate: "",
      subledgerId: defaultSubledgerId,
      cgstSubledgerId: undefined,
      sgstSubledgerId: undefined,
      graceHour: 0,
      isActive: true,
      description: ""
    });
    setIsDialogOpen(true);
  };

  const filteredTariffs = tariffSetups.filter((tariff: TariffSetupMaster) => {
    const subledger = subledgers.find((s: SubledgerMaster) => s.id === tariff.subledgerId);
    const subledgerName = subledger?.subledgerName || '';
    
    const matchesSearch = 
      tariff.fromAmount.toString().includes(searchTerm) ||
      tariff.toAmount.toString().includes(searchTerm) ||
      subledgerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tariff.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesSubledger = filterSubledger === "all" || tariff.subledgerId.toString() === filterSubledger;
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "active" && tariff.isActive) ||
      (filterStatus === "inactive" && !tariff.isActive);
      
    return matchesSearch && matchesSubledger && matchesStatus;
  });

  const getSubledgerName = (id: number) => {
    const subledger = subledgers.find((s: SubledgerMaster) => s.id === id);
    return subledger?.subledgerName || 'Unknown';
  };

  const getCgstSubledgerName = (id?: number | null) => {
    if (!id) return 'Not Set';
    const subledger = subledgers.find((s: SubledgerMaster) => s.id === id);
    return subledger?.subledgerName || 'Unknown';
  };

  const getSgstSubledgerName = (id?: number | null) => {
    if (!id) return 'Not Set';
    const subledger = subledgers.find((s: SubledgerMaster) => s.id === id);
    return subledger?.subledgerName || 'Unknown';
  };

  return (
    <div className="space-y-6" data-testid="tariff-setup-management">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Tariff Setup Master
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tariffs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-tariffs"
              />
            </div>
            <Select value={filterSubledger} onValueChange={setFilterSubledger}>
              <SelectTrigger className="w-full md:w-48" data-testid="filter-subledger">
                <SelectValue placeholder="Filter by Subledger" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subledgers</SelectItem>
                {subledgers.map((subledger: SubledgerMaster) => (
                  <SelectItem key={subledger.id} value={subledger.id.toString()}>
                    {subledger.subledgerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-32" data-testid="filter-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAdd} data-testid="add-tariff-button">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tariff Setup
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingTariff ? "Edit Tariff Setup" : "Add New Tariff Setup"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="fromAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>From Amount</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="0.00" 
                                {...field} 
                                data-testid="input-from-amount"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="toAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>To Amount</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="0.00" 
                                {...field} 
                                data-testid="input-to-amount"
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
                        name="validFromDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valid From Date</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field} 
                                data-testid="input-valid-from-date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="validToDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valid To Date</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field} 
                                data-testid="input-valid-to-date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="subledgerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>General Subledger</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))} 
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-subledger">
                                <SelectValue placeholder="Select general subledger" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {subledgers.map((subledger: SubledgerMaster) => (
                                <SelectItem key={subledger.id} value={subledger.id.toString()}>
                                  {subledger.subledgerName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-muted-foreground">CGST Configuration</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="cgstSubledgerId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CGST Subledger</FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                                value={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-cgst-subledger">
                                    <SelectValue placeholder="Select CGST subledger" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {subledgers.map((subledger: SubledgerMaster) => (
                                    <SelectItem key={subledger.id} value={subledger.id.toString()}>
                                      {subledger.subledgerName}
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
                          name="cgstPercentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CGST Percentage</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="9.00" 
                                  {...field} 
                                  data-testid="input-cgst-percentage"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-muted-foreground">SGST Configuration</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="sgstSubledgerId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SGST Subledger</FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                                value={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-sgst-subledger">
                                    <SelectValue placeholder="Select SGST subledger" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {subledgers.map((subledger: SubledgerMaster) => (
                                    <SelectItem key={subledger.id} value={subledger.id.toString()}>
                                      {subledger.subledgerName}
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
                          name="sgstPercentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SGST Percentage</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="9.00" 
                                  {...field} 
                                  data-testid="input-sgst-percentage"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="graceHour"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grace Hour</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-grace-hour"
                            />
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
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Additional notes about this tariff setup..." 
                              {...field} 
                              data-testid="input-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Switch 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                              data-testid="switch-is-active"
                            />
                          </FormControl>
                          <FormLabel>Active</FormLabel>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsDialogOpen(false)}
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createMutation.isPending || updateMutation.isPending}
                        data-testid="button-submit"
                      >
                        {editingTariff ? "Update" : "Create"} Tariff Setup
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTariffs.map((tariff: TariffSetupMaster) => (
                <Card key={tariff.id} className="p-4" data-testid={`tariff-card-${tariff.id}`}>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    <div>
                      <div className="font-medium">Amount Range</div>
                      <div className="text-sm text-muted-foreground">
                        ₹{parseFloat(tariff.fromAmount).toLocaleString()} - ₹{parseFloat(tariff.toAmount).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">GST Rates</div>
                      <div className="text-sm text-muted-foreground">
                        CGST: {tariff.cgstPercentage}% | SGST: {tariff.sgstPercentage}%
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Valid Period</div>
                      <div className="text-sm text-muted-foreground">
                        {tariff.validFromDate} to {tariff.validToDate}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Subledgers</div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>General: {getSubledgerName(tariff.subledgerId)}</div>
                        <div>CGST: {getCgstSubledgerName(tariff.cgstSubledgerId)}</div>
                        <div>SGST: {getSgstSubledgerName(tariff.sgstSubledgerId)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={tariff.isActive ? "default" : "secondary"}>
                        {tariff.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {tariff.graceHour > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {tariff.graceHour}h
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEdit(tariff)}
                        data-testid={`edit-tariff-${tariff.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            data-testid={`delete-tariff-${tariff.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Tariff Setup</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this tariff setup? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(tariff.id)}
                              disabled={deleteMutation.isPending}
                              data-testid={`confirm-delete-tariff-${tariff.id}`}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  {tariff.description && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      {tariff.description}
                    </div>
                  )}
                </Card>
              ))}
              {filteredTariffs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No tariff setups found matching your criteria.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}