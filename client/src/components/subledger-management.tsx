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
import { Plus, Edit, Trash2, DollarSign, Search, Filter, Star, Percent, Target } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertSubledgerMasterSchema, type SubledgerMaster, type GeneralLedgerMaster } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

export function SubledgerManagement() {
  const [editingSubledger, setEditingSubledger] = useState<SubledgerMaster | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAccount, setFilterAccount] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof insertSubledgerMasterSchema>>({
    resolver: zodResolver(insertSubledgerMasterSchema),
    defaultValues: {
      subledgerName: "",
      shortName: "",
      subledgerCode: "",
      description: "",
      isActive: true,
      isDefaultLedger: false,
      taxPercentage: "0.00"
    }
  });

  const { data: subledgers = [], isLoading } = useQuery({
    queryKey: ["/api/subledgers"],
    queryFn: async () => {
      const response = await fetch("/api/subledgers");
      if (!response.ok) throw new Error('Failed to fetch subledgers');
      return response.json();
    }
  });

  const { data: generalLedgerAccounts = [] } = useQuery({
    queryKey: ["/api/general-ledger-accounts"],
    queryFn: async () => {
      const response = await fetch("/api/general-ledger-accounts");
      if (!response.ok) throw new Error('Failed to fetch accounts');
      return response.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertSubledgerMasterSchema>) => {
      const response = await fetch("/api/subledgers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create subledger');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subledgers"] });
      setIsDialogOpen(false);
      setEditingSubledger(null);
      form.reset();
      toast({ title: "Subledger created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create subledger", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<SubledgerMaster>) => {
      const response = await fetch(`/api/subledgers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update subledger');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subledgers"] });
      setIsDialogOpen(false);
      setEditingSubledger(null);
      form.reset();
      toast({ title: "Subledger updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update subledger", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/subledgers/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete subledger');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subledgers"] });
      toast({ title: "Subledger deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to delete subledger", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/subledgers/${id}/set-default`, {
        method: "PUT"
      });
      if (!response.ok) throw new Error('Failed to set default subledger');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subledgers"] });
      toast({ title: "Default subledger updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to set default subledger", variant: "destructive" });
    }
  });

  const filteredSubledgers = subledgers.filter((subledger: SubledgerMaster) => {
    const matchesSearch = subledger.subledgerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subledger.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (subledger.subledgerCode && subledger.subledgerCode.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesAccount = filterAccount === "all" || subledger.generalLedgerAccountId?.toString() === filterAccount;
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && subledger.isActive) ||
                         (filterStatus === "inactive" && !subledger.isActive) ||
                         (filterStatus === "default" && subledger.isDefaultLedger);
    
    return matchesSearch && matchesAccount && matchesStatus;
  });

  const onSubmit = (data: z.infer<typeof insertSubledgerMasterSchema>) => {
    if (editingSubledger) {
      updateMutation.mutate({ id: editingSubledger.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (subledger: SubledgerMaster) => {
    setEditingSubledger(subledger);
    form.reset({
      subledgerName: subledger.subledgerName,
      shortName: subledger.shortName,
      subledgerCode: subledger.subledgerCode || "",
      generalLedgerAccountId: subledger.generalLedgerAccountId || undefined,
      description: subledger.description || "",
      isActive: subledger.isActive,
      isDefaultLedger: subledger.isDefaultLedger,
      taxPercentage: subledger.taxPercentage
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleSetDefault = (id: number) => {
    setDefaultMutation.mutate(id);
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(parseFloat(amount));
  };

  const getAccountName = (accountId?: number) => {
    if (!accountId) return "Unassigned";
    const account = generalLedgerAccounts.find((acc: GeneralLedgerMaster) => acc.id === accountId);
    return account ? account.accountName : "Unknown Account";
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading subledgers...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Subledger Master</h2>
          <p className="text-primary-600">Manage subsidiary ledgers with tax percentages and default settings</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-[#006699] hover:bg-[#002a66]"
              onClick={() => {
                setEditingSubledger(null);
                form.reset();
              }}
              data-testid="button-add-subledger"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Subledger
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-gray-800">
                {editingSubledger ? "Edit Subledger" : "Add New Subledger"}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="subledgerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subledger Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., CGST Payable" {...field} data-testid="input-subledger-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="shortName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., CGST_PAY" {...field} data-testid="input-short-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="subledgerCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subledger Code (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., GST001" {...field} data-testid="input-subledger-code" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="generalLedgerAccountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>General Ledger Account</FormLabel>
                        <FormControl>
                          <Select value={field.value?.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                            <SelectTrigger data-testid="select-account">
                              <SelectValue placeholder="Select parent account" />
                            </SelectTrigger>
                            <SelectContent>
                              {generalLedgerAccounts.map((account: GeneralLedgerMaster) => (
                                <SelectItem key={account.id} value={account.id.toString()}>
                                  {account.accountName} ({account.shortName})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="taxPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Percentage (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            min="0" 
                            max="100" 
                            placeholder="e.g., 18.00" 
                            {...field} 
                            data-testid="input-tax-percentage"
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
                          placeholder="Brief description of the subledger purpose"
                          {...field} 
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active Status</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Enable/disable this subledger
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
                  
                  <FormField
                    control={form.control}
                    name="isDefaultLedger"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Default Ledger</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Set as default for this category
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-default"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-[#006699] hover:bg-[#002a66]"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-subledger"
                  >
                    {createMutation.isPending || updateMutation.isPending 
                      ? "Saving..." 
                      : editingSubledger ? "Update Subledger" : "Create Subledger"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Subledgers</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search by name, short name, or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="account-filter">Parent Account</Label>
              <Select value={filterAccount} onValueChange={setFilterAccount}>
                <SelectTrigger className="w-48" data-testid="select-filter-account">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {generalLedgerAccounts.map((account: GeneralLedgerMaster) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.accountName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32" data-testid="select-filter-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="default">Default</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subledgers List */}
      <div className="grid gap-4">
        {filteredSubledgers.map((subledger: SubledgerMaster) => (
          <Card key={subledger.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800" data-testid={`text-subledger-name-${subledger.id}`}>
                      {subledger.subledgerName}
                    </h3>
                    {subledger.isDefaultLedger && (
                      <Badge className="bg-amber-100 text-amber-800">
                        <Star className="w-3 h-3 mr-1" />
                        Default
                      </Badge>
                    )}
                    {!subledger.isActive && (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Short Name</p>
                      <p className="font-medium" data-testid={`text-short-name-${subledger.id}`}>{subledger.shortName}</p>
                    </div>
                    {subledger.subledgerCode && (
                      <div>
                        <p className="text-gray-600">Code</p>
                        <p className="font-medium" data-testid={`text-code-${subledger.id}`}>{subledger.subledgerCode}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-600">Parent Account</p>
                      <p className="font-medium" data-testid={`text-parent-account-${subledger.id}`}>
                        {getAccountName(subledger.generalLedgerAccountId)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Tax %</p>
                      <p className="font-medium flex items-center" data-testid={`text-tax-percentage-${subledger.id}`}>
                        <Percent className="w-3 h-3 mr-1" />
                        {subledger.taxPercentage}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Current Balance</p>
                      <p className="font-medium" data-testid={`text-current-balance-${subledger.id}`}>
                        {formatCurrency(subledger.currentBalance)}
                      </p>
                    </div>
                  </div>
                  
                  {subledger.description && (
                    <p className="text-gray-600 mt-2" data-testid={`text-description-${subledger.id}`}>
                      {subledger.description}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2 ml-4">
                  {!subledger.isDefaultLedger && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(subledger.id)}
                      disabled={setDefaultMutation.isPending}
                      data-testid={`button-set-default-${subledger.id}`}
                    >
                      <Target className="w-4 h-4" />
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(subledger)}
                    data-testid={`button-edit-${subledger.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        data-testid={`button-delete-${subledger.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Subledger</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{subledger.subledgerName}"? 
                          This action cannot be undone. Subledgers with non-zero balances cannot be deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(subledger.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSubledgers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No subledgers found</h3>
            <p className="text-gray-600">
              {searchTerm || filterAccount !== "all" || filterStatus !== "all"
                ? "Try adjusting your search criteria."
                : "Create your first subledger to get started."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}