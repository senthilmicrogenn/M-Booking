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
import { Plus, Edit, Trash2, DollarSign, TrendingUp, TrendingDown, Building, Search, Filter } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertGeneralLedgerMasterSchema, type GeneralLedgerMaster } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

export function GeneralLedgerManagement() {
  const [editingAccount, setEditingAccount] = useState<GeneralLedgerMaster | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof insertGeneralLedgerMasterSchema>>({
    resolver: zodResolver(insertGeneralLedgerMasterSchema),
    defaultValues: {
      accountName: "",
      shortName: "",
      accountCode: "",
      accountType: "asset",
      normalBalance: "debit",
      description: "",
      isActive: true,
      isSystemAccount: false
    }
  });

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["/api/general-ledger-accounts"],
    queryFn: async () => {
      const response = await fetch("/api/general-ledger-accounts");
      if (!response.ok) throw new Error('Failed to fetch accounts');
      return response.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertGeneralLedgerMasterSchema>) => {
      const response = await fetch("/api/general-ledger-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create account');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/general-ledger-accounts"] });
      setIsDialogOpen(false);
      setEditingAccount(null);
      form.reset();
      toast({ title: "Account created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create account", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<GeneralLedgerMaster>) => {
      const response = await fetch(`/api/general-ledger-accounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update account');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/general-ledger-accounts"] });
      setIsDialogOpen(false);
      setEditingAccount(null);
      form.reset();
      toast({ title: "Account updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update account", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/general-ledger-accounts/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete account');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/general-ledger-accounts"] });
      toast({ title: "Account deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to delete account", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const filteredAccounts = accounts.filter((account: GeneralLedgerMaster) => {
    const matchesSearch = account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (account.accountCode && account.accountCode.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === "all" || account.accountType === filterType;
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && account.isActive) ||
                         (filterStatus === "inactive" && !account.isActive);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const onSubmit = (data: z.infer<typeof insertGeneralLedgerMasterSchema>) => {
    if (editingAccount) {
      updateMutation.mutate({ id: editingAccount.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (account: GeneralLedgerMaster) => {
    setEditingAccount(account);
    form.reset({
      accountName: account.accountName,
      shortName: account.shortName,
      accountCode: account.accountCode || "",
      accountType: account.accountType,
      normalBalance: account.normalBalance,
      description: account.description || "",
      isActive: account.isActive,
      isSystemAccount: account.isSystemAccount
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'asset': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'liability': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'equity': return <Building className="w-4 h-4 text-blue-600" />;
      case 'income': return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case 'expense': return <TrendingDown className="w-4 h-4 text-orange-600" />;
      default: return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  const getAccountTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      asset: "bg-green-100 text-green-800",
      liability: "bg-red-100 text-red-800", 
      equity: "bg-blue-100 text-blue-800",
      income: "bg-emerald-100 text-emerald-800",
      expense: "bg-orange-100 text-orange-800"
    };
    return variants[type] || "bg-gray-100 text-gray-800";
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(parseFloat(amount));
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading accounts...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">General Ledger Master</h2>
          <p className="text-primary-600">Manage chart of accounts and financial structure</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-[#006699] hover:bg-[#002a66]"
              onClick={() => {
                setEditingAccount(null);
                form.reset();
              }}
              data-testid="button-add-account"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-gray-800">
                {editingAccount ? "Edit Account" : "Add New Account"}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="accountName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Cash in Hand" {...field} data-testid="input-account-name" />
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
                          <Input placeholder="e.g., CASH" {...field} data-testid="input-short-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="accountCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Code (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 1001" {...field} data-testid="input-account-code" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="accountType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Type</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger data-testid="select-account-type">
                              <SelectValue placeholder="Select account type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="asset">Asset</SelectItem>
                              <SelectItem value="liability">Liability</SelectItem>
                              <SelectItem value="equity">Equity</SelectItem>
                              <SelectItem value="income">Income</SelectItem>
                              <SelectItem value="expense">Expense</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="normalBalance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Normal Balance</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger data-testid="select-normal-balance">
                              <SelectValue placeholder="Select normal balance" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="debit">Debit</SelectItem>
                              <SelectItem value="credit">Credit</SelectItem>
                            </SelectContent>
                          </Select>
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
                          placeholder="Brief description of the account purpose"
                          {...field} 
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
                    data-testid="button-save-account"
                  >
                    {createMutation.isPending || updateMutation.isPending 
                      ? "Saving..." 
                      : editingAccount ? "Update Account" : "Create Account"}
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
              <Label htmlFor="search">Search Accounts</Label>
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
              <Label htmlFor="type-filter">Account Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40" data-testid="select-filter-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="asset">Asset</SelectItem>
                  <SelectItem value="liability">Liability</SelectItem>
                  <SelectItem value="equity">Equity</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
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
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts List */}
      <div className="grid gap-4">
        {filteredAccounts.map((account: GeneralLedgerMaster) => (
          <Card key={account.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getAccountTypeIcon(account.accountType)}
                    <h3 className="text-lg font-semibold text-gray-800" data-testid={`text-account-name-${account.id}`}>
                      {account.accountName}
                    </h3>
                    <Badge className={getAccountTypeBadge(account.accountType)}>
                      {account.accountType.toUpperCase()}
                    </Badge>
                    {account.isSystemAccount && (
                      <Badge variant="secondary">System</Badge>
                    )}
                    {!account.isActive && (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Short Name</p>
                      <p className="font-medium" data-testid={`text-short-name-${account.id}`}>{account.shortName}</p>
                    </div>
                    {account.accountCode && (
                      <div>
                        <p className="text-gray-600">Account Code</p>
                        <p className="font-medium" data-testid={`text-account-code-${account.id}`}>{account.accountCode}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-600">Normal Balance</p>
                      <p className="font-medium capitalize" data-testid={`text-normal-balance-${account.id}`}>
                        {account.normalBalance}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Current Balance</p>
                      <p className="font-medium" data-testid={`text-current-balance-${account.id}`}>
                        {formatCurrency(account.currentBalance)}
                      </p>
                    </div>
                  </div>
                  
                  {account.description && (
                    <p className="text-gray-600 mt-2" data-testid={`text-description-${account.id}`}>
                      {account.description}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(account)}
                    data-testid={`button-edit-${account.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  {!account.isSystemAccount && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          data-testid={`button-delete-${account.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Account</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{account.accountName}"? 
                            This action cannot be undone. Accounts with child accounts or non-zero balances cannot be deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(account.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAccounts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts found</h3>
            <p className="text-gray-600">
              {searchTerm || filterType !== "all" || filterStatus !== "all"
                ? "Try adjusting your search criteria."
                : "Create your first general ledger account to get started."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}