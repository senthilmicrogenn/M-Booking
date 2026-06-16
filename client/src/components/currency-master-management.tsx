import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCurrencyMasterSchema, type CurrencyMaster, type NewCurrencyMaster } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Star, Search, DollarSign, TrendingUp, Calendar } from "lucide-react";

export function CurrencyMasterManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<CurrencyMaster | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch currencies
  const { data: currencies = [], isLoading } = useQuery<CurrencyMaster[]>({
    queryKey: ["/api/currencies"],
  });

  // Form for currency creation/editing
  const form = useForm<NewCurrencyMaster>({
    resolver: zodResolver(insertCurrencyMasterSchema),
    defaultValues: {
      currencyName: "",
      shortName: "",
      conversionPrice: "1.000000",
      asOnDate: new Date().toISOString().split('T')[0],
      isActive: true,
      symbol: "",
      country: "",
      isBaseCurrency: false,
    },
  });

  // Create currency mutation
  const createCurrencyMutation = useMutation({
    mutationFn: (data: NewCurrencyMaster) => apiRequest("/api/currencies", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      setShowCreateDialog(false);
      form.reset();
      toast({ title: "Success", description: "Currency created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.details?.map((d: any) => d.message).join(", ") || "Failed to create currency",
        variant: "destructive" 
      });
    },
  });

  // Update currency mutation
  const updateCurrencyMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<NewCurrencyMaster> }) =>
      apiRequest(`/api/currencies/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      setEditingCurrency(null);
      form.reset();
      toast({ title: "Success", description: "Currency updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.details?.map((d: any) => d.message).join(", ") || "Failed to update currency",
        variant: "destructive" 
      });
    },
  });

  // Delete currency mutation
  const deleteCurrencyMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/currencies/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      toast({ title: "Success", description: "Currency deleted successfully" });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to delete currency",
        variant: "destructive" 
      });
    },
  });

  // Set base currency mutation
  const setBaseCurrencyMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/currencies/${id}/set-base`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/currencies"] });
      toast({ title: "Success", description: "Base currency updated successfully" });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to set base currency",
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (data: NewCurrencyMaster) => {
    if (editingCurrency) {
      updateCurrencyMutation.mutate({ id: editingCurrency.id, data });
    } else {
      createCurrencyMutation.mutate(data);
    }
  };

  const handleEdit = (currency: CurrencyMaster) => {
    setEditingCurrency(currency);
    form.reset({
      currencyName: currency.currencyName,
      shortName: currency.shortName,
      conversionPrice: currency.conversionPrice,
      asOnDate: currency.asOnDate,
      isActive: currency.isActive,
      symbol: currency.symbol,
      country: currency.country || "",
      isBaseCurrency: currency.isBaseCurrency,
    });
    setShowCreateDialog(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this currency?")) {
      deleteCurrencyMutation.mutate(id);
    }
  };

  const handleSetBaseCurrency = (id: number) => {
    if (confirm("Are you sure you want to set this as the base currency?")) {
      setBaseCurrencyMutation.mutate(id);
    }
  };

  // Filter currencies based on search
  const filteredCurrencies = currencies.filter(currency =>
    currency.currencyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.country?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const baseCurrency = currencies.find(c => c.isBaseCurrency);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100" data-testid="text-currency-title">Currency Master Management</h2>
          <p className="text-primary-600 dark:text-gray-300">Manage multi-currency support and exchange rates</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingCurrency(null);
              form.reset();
            }} data-testid="button-add-currency">
              <Plus className="w-4 h-4 mr-2" />
              Add Currency
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">
                {editingCurrency ? "Edit Currency" : "Add New Currency"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="currencyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Indian Rupee" {...field} data-testid="input-currency-name" />
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
                        <FormLabel>Short Name / Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., INR" {...field} data-testid="input-short-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="symbol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency Symbol</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., ₹" {...field} data-testid="input-symbol" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., India" {...field} data-testid="input-country" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="conversionPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exchange Rate (per base currency)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.000001" 
                            placeholder="e.g., 83.250000" 
                            {...field} 
                            data-testid="input-conversion-price" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="asOnDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exchange Rate Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            data-testid="input-as-on-date" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center space-x-6">
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
                        <FormLabel className="!mt-0">Active Currency</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isBaseCurrency"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-is-base-currency"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Base Currency</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)} data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createCurrencyMutation.isPending || updateCurrencyMutation.isPending}
                    data-testid="button-save-currency"
                  >
                    {editingCurrency ? "Update Currency" : "Create Currency"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-500 rounded flex items-center justify-center">
                <DollarSign className="text-white w-5 h-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800">Total Currencies</p>
                <p className="text-xl font-bold text-blue-900" data-testid="stat-total-currencies">
                  {currencies.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-500 rounded flex items-center justify-center">
                <TrendingUp className="text-white w-5 h-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">Active Currencies</p>
                <p className="text-xl font-bold text-green-900" data-testid="stat-active-currencies">
                  {currencies.filter(c => c.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-500 rounded flex items-center justify-center">
                <Star className="text-white w-5 h-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-800">Base Currency</p>
                <p className="text-lg font-bold text-purple-900" data-testid="stat-base-currency">
                  {baseCurrency?.shortName || "Not Set"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Calendar className="text-white w-5 h-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-800">Last Updated</p>
                <p className="text-sm font-bold text-orange-900" data-testid="stat-last-updated">
                  {currencies.length > 0 ? new Date(Math.max(...currencies.map(c => new Date(c.updatedAt).getTime()))).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Currency Search & Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search currencies by name, code, or country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
                data-testid="input-search-currencies"
              />
            </div>
          </div>

          {/* Currency Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Currency</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Exchange Rate</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading currencies...
                    </TableCell>
                  </TableRow>
                ) : filteredCurrencies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No currencies found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCurrencies.map((currency) => (
                    <TableRow key={currency.id} data-testid={`row-currency-${currency.id}`}>
                      <TableCell className="font-medium" data-testid={`text-currency-name-${currency.id}`}>
                        <div className="flex items-center space-x-2">
                          <span>{currency.currencyName}</span>
                          {currency.isBaseCurrency && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              <Star className="w-3 h-3 mr-1" />
                              Base
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-short-name-${currency.id}`}>
                        <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                          {currency.shortName}
                        </code>
                      </TableCell>
                      <TableCell data-testid={`text-symbol-${currency.id}`}>
                        <span className="text-lg font-semibold">{currency.symbol}</span>
                      </TableCell>
                      <TableCell data-testid={`text-country-${currency.id}`}>
                        {currency.country}
                      </TableCell>
                      <TableCell data-testid={`text-conversion-price-${currency.id}`}>
                        <div className="text-right font-mono">
                          {parseFloat(currency.conversionPrice).toFixed(6)}
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-as-on-date-${currency.id}`}>
                        {new Date(currency.asOnDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={currency.isActive ? "default" : "secondary"}
                          className={currency.isActive ? "bg-green-100 text-green-800" : ""}
                          data-testid={`badge-status-${currency.id}`}
                        >
                          {currency.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(currency)}
                            data-testid={`button-edit-${currency.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {!currency.isBaseCurrency && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSetBaseCurrency(currency.id)}
                              data-testid={`button-set-base-${currency.id}`}
                            >
                              <Star className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(currency.id)}
                            className="text-red-600 hover:text-red-900"
                            data-testid={`button-delete-${currency.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
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
    </div>
  );
}