import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Gift, 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  Star,
  TrendingUp,
  Award,
  CheckCircle,
  XCircle,
  Calendar,
  Search
} from "lucide-react";

// Types for loyalty program
interface LoyaltyProgram {
  id: number;
  userId: number;
  completedBookings: number;
  availableRefreshmentStays: number;
  isFirstTimeUser: boolean;
  firstRefreshmentClaimed: boolean;
  lastRefreshmentEarned: Date | null;
  refreshmentExpiryDate: Date | null;
  totalPointsEarned: number;
  currentPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

// Form schema for loyalty program
const loyaltyProgramFormSchema = z.object({
  userId: z.number().min(1, "User ID is required"),
  completedBookings: z.number().min(0, "Completed bookings must be 0 or more").default(0),
  availableRefreshmentStays: z.number().min(0, "Available refreshment stays must be 0 or more").default(0),
  isFirstTimeUser: z.boolean().default(true),
  firstRefreshmentClaimed: z.boolean().default(false),
  totalPointsEarned: z.number().min(0, "Total points earned must be 0 or more").default(0),
  currentPoints: z.number().min(0, "Current points must be 0 or more").default(0),
});

type LoyaltyProgramFormData = z.infer<typeof loyaltyProgramFormSchema>;

export function LoyaltyProgramManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProgram, setEditingProgram] = useState<LoyaltyProgram | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch loyalty programs - we'll need to create an API endpoint for this
  const { data: loyaltyPrograms = [], isLoading } = useQuery<LoyaltyProgram[]>({
    queryKey: ["/api/loyalty/all"],
  });

  // Fetch users for dropdown
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  // Form for loyalty program creation/editing
  const form = useForm<LoyaltyProgramFormData>({
    resolver: zodResolver(loyaltyProgramFormSchema),
    defaultValues: {
      userId: 0,
      completedBookings: 0,
      availableRefreshmentStays: 0,
      isFirstTimeUser: true,
      firstRefreshmentClaimed: false,
      totalPointsEarned: 0,
      currentPoints: 0,
    },
  });

  // Create loyalty program mutation
  const createLoyaltyProgramMutation = useMutation({
    mutationFn: (data: LoyaltyProgramFormData) => apiRequest("/api/loyalty", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty/all"] });
      setShowCreateDialog(false);
      form.reset();
      toast({ title: "Success", description: "Loyalty program created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create loyalty program",
        variant: "destructive" 
      });
    },
  });

  // Update loyalty program mutation
  const updateLoyaltyProgramMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: Partial<LoyaltyProgramFormData> }) => 
      apiRequest(`/api/loyalty/${userId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty/all"] });
      setEditingProgram(null);
      form.reset();
      toast({ title: "Success", description: "Loyalty program updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update loyalty program",
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (data: LoyaltyProgramFormData) => {
    if (editingProgram) {
      updateLoyaltyProgramMutation.mutate({ userId: editingProgram.userId, data });
    } else {
      createLoyaltyProgramMutation.mutate(data);
    }
  };

  const handleEdit = (program: LoyaltyProgram) => {
    setEditingProgram(program);
    form.reset({
      userId: program.userId,
      completedBookings: program.completedBookings,
      availableRefreshmentStays: program.availableRefreshmentStays,
      isFirstTimeUser: program.isFirstTimeUser,
      firstRefreshmentClaimed: program.firstRefreshmentClaimed,
      totalPointsEarned: program.totalPointsEarned,
      currentPoints: program.currentPoints,
    });
    setShowCreateDialog(true);
  };

  const filteredPrograms = loyaltyPrograms.filter(program => 
    searchTerm === "" || 
    program.userId.toString().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: Date | null) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString();
  };

  return (
    <Card data-testid="card-loyalty-program-management">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-yellow-600" />
              Loyalty Program Management
            </CardTitle>
            <CardDescription>
              Manage customer loyalty programs, points, and rewards
            </CardDescription>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button 
                className="bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)]"
                data-testid="button-create-loyalty-program"
                onClick={() => {
                  setEditingProgram(null);
                  form.reset();
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Loyalty Program
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingProgram ? "Edit Loyalty Program" : "Create New Loyalty Program"}
                </DialogTitle>
                <DialogDescription>
                  {editingProgram ? "Update the loyalty program details" : "Create a new customer loyalty program"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User ID</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter user ID"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-user-id"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="completedBookings"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Completed Bookings</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-completed-bookings"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="availableRefreshmentStays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available Refreshment Stays</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-refreshment-stays"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currentPoints"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Points</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-current-points"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCreateDialog(false)}
                      data-testid="button-cancel-loyalty-program"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createLoyaltyProgramMutation.isPending || updateLoyaltyProgramMutation.isPending}
                      data-testid="button-save-loyalty-program"
                    >
                      {editingProgram ? "Update" : "Create"}
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
                placeholder="Search by User ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
                data-testid="input-search-loyalty-programs"
              />
            </div>
          </div>

          {/* Programs Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Completed Bookings</TableHead>
                  <TableHead>Refreshment Stays</TableHead>
                  <TableHead>Current Points</TableHead>
                  <TableHead>First Time User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      Loading loyalty programs...
                    </TableCell>
                  </TableRow>
                ) : filteredPrograms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No loyalty programs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPrograms.map((program) => (
                    <TableRow key={program.id} data-testid={`row-loyalty-program-${program.id}`}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">
                          User #{program.userId}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          {program.completedBookings}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Gift className="h-4 w-4 text-yellow-600" />
                          {program.availableRefreshmentStays}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{program.currentPoints}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={program.isFirstTimeUser ? "secondary" : "default"}
                          className={program.isFirstTimeUser ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}
                        >
                          {program.isFirstTimeUser ? "First Time" : "Returning"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="default"
                          className="bg-green-100 text-green-800"
                        >
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(program)}
                            data-testid={`button-edit-loyalty-program-${program.id}`}
                          >
                            <Edit className="h-4 w-4" />
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
          {!isLoading && filteredPrograms.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Programs</p>
                      <p className="text-2xl font-bold">{filteredPrograms.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                      <p className="text-2xl font-bold">
                        {filteredPrograms.reduce((sum, p) => sum + p.completedBookings, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Star className="h-8 w-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Points</p>
                      <p className="text-2xl font-bold">
                        {filteredPrograms.reduce((sum, p) => sum + p.currentPoints, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Gift className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Refreshment Stays</p>
                      <p className="text-2xl font-bold">
                        {filteredPrograms.reduce((sum, p) => sum + p.availableRefreshmentStays, 0)}
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