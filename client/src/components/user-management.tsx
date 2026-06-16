import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Search, Filter, User, Mail, Phone, Shield, Clock, Building2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertUserSchema, type User as UserType, type Property, type UserPropertyAccess } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

const userFormSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type UserFormData = z.infer<typeof userFormSchema>;

export function UserManagement() {
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [propertyDialogUser, setPropertyDialogUser] = useState<UserType | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [selectedPropertyRole, setSelectedPropertyRole] = useState<string>("manager");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      role: "guest",
      isVerified: false
    }
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: userPropertyAccess = [] } = useQuery<UserPropertyAccess[]>({
    queryKey: ["/api/user-property-access"],
    queryFn: async () => {
      const response = await fetch("/api/user-property-access");
      if (!response.ok) throw new Error('Failed to fetch user property access');
      return response.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const { confirmPassword, ...userData } = data;
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDialogOpen(false);
      setEditingUser(null);
      form.reset();
      toast({ title: "User created successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: error.message || "Failed to create user", 
        variant: "destructive" 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<UserType>) => {
      const response = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDialogOpen(false);
      setEditingUser(null);
      form.reset();
      toast({ title: "User updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update user", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error('Failed to delete user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete user", variant: "destructive" });
    }
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ id, isVerified }: { id: number; isVerified: boolean }) => {
      const response = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified })
      });
      if (!response.ok) throw new Error('Failed to update user status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update user status", variant: "destructive" });
    }
  });

  const assignPropertyMutation = useMutation({
    mutationFn: async ({ userId, propertyId, role }: { userId: number; propertyId: number; role: string }) => {
      const response = await fetch("/api/user-property-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, propertyId, role })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to assign property');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-property-access"] });
      setSelectedPropertyId("");
      setSelectedPropertyRole("manager");
      toast({ title: "Property assigned successfully" });
    },
    onError: (error: Error) => {
      toast({ title: error.message || "Failed to assign property", variant: "destructive" });
    }
  });

  const removePropertyMutation = useMutation({
    mutationFn: async (accessId: number) => {
      const response = await fetch(`/api/user-property-access/${accessId}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error('Failed to remove property');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-property-access"] });
      toast({ title: "Property removed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to remove property", variant: "destructive" });
    }
  });

  const filteredUsers = users.filter((user: UserType) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && user.isVerified) ||
                         (filterStatus === "inactive" && !user.isVerified);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const onSubmit = (data: UserFormData) => {
    if (editingUser) {
      const { confirmPassword, ...updateData } = data;
      updateMutation.mutate({ id: editingUser.id, ...updateData });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (user: UserType) => {
    setEditingUser(user);
    form.reset({
      name: user.name,
      email: user.email || "",
      password: "", // Don't show existing password
      confirmPassword: "",
      phoneNumber: user.phoneNumber,
      role: user.role,
      isVerified: user.isVerified
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleToggleStatus = (id: number, currentStatus: boolean) => {
    toggleUserStatusMutation.mutate({ id, isVerified: !currentStatus });
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: "bg-red-100 text-red-800",
      manager: "bg-blue-100 text-blue-800",
      staff: "bg-green-100 text-green-800",
      customer: "bg-gray-100 text-gray-800",
    };
    return colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getUserProperties = (userId: number) => {
    return userPropertyAccess
      .filter(access => access.userId === userId && access.isActive)
      .map(access => {
        const property = properties.find(p => p.id === access.propertyId);
        return { access, property };
      })
      .filter(item => item.property);
  };

  const handleAssignProperty = () => {
    if (!propertyDialogUser || !selectedPropertyId) return;
    assignPropertyMutation.mutate({
      userId: propertyDialogUser.id,
      propertyId: parseInt(selectedPropertyId),
      role: selectedPropertyRole
    });
  };

  const handleRemoveProperty = (accessId: number) => {
    removePropertyMutation.mutate(accessId);
  };

  const getAvailableProperties = (userId: number) => {
    const assignedPropertyIds = userPropertyAccess
      .filter(access => access.userId === userId && access.isActive)
      .map(access => access.propertyId);
    return properties.filter(p => !assignedPropertyIds.includes(p.id));
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
          <p className="text-primary-600">Manage system users, roles, and permissions</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-[#006699] hover:bg-[#002a66]"
              onClick={() => {
                setEditingUser(null);
                form.reset();
              }}
              data-testid="button-add-user"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-gray-800">
                {editingUser ? "Edit User" : "Add New User"}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} data-testid="input-name" />
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} data-testid="input-email" />
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
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+91 9876543210" {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger data-testid="select-role">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="customer">Customer</SelectItem>
                              <SelectItem value="staff">Staff</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{editingUser ? "New Password (optional)" : "Password"}</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder={editingUser ? "Leave empty to keep current" : "Password"} 
                            {...field} 
                            data-testid="input-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Confirm password" 
                            {...field} 
                            data-testid="input-confirm-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="isVerified"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Status</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Enable/disable user access to the system
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-verified"
                        />
                      </FormControl>
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
                    data-testid="button-save-user"
                  >
                    {createMutation.isPending || updateMutation.isPending 
                      ? "Saving..." 
                      : editingUser ? "Update User" : "Create User"}
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
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search by username, email, or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="role-filter">Role</Label>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-32" data-testid="select-filter-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
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

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.map((user: UserType) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800" data-testid={`text-user-name-${user.id}`}>
                      {user.name}
                    </h3>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      <Shield className="w-3 h-3 mr-1" />
                      {user.role}
                    </Badge>
                    {!user.isVerified && (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Name</p>
                      <p className="font-medium" data-testid={`text-name-${user.id}`}>{user.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Email</p>
                      <p className="font-medium" data-testid={`text-email-${user.id}`}>{user.email || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Phone</p>
                      <p className="font-medium" data-testid={`text-phone-${user.id}`}>
                        {user.phoneNumber}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Created: {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Assigned Properties Section */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-[#006699]">Assigned Properties</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPropertyDialogUser(user);
                          setSelectedPropertyId("");
                          setSelectedPropertyRole("manager");
                        }}
                        className="text-primary-600 hover:text-[#006699]"
                        data-testid={`button-manage-properties-${user.id}`}
                      >
                        <Building2 className="w-4 h-4 mr-1" />
                        Manage Properties
                      </Button>
                    </div>
                    {getUserProperties(user.id).length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {getUserProperties(user.id).map(({ access, property }) => (
                          <Badge 
                            key={access.id} 
                            variant="secondary"
                            className="bg-gray-100 text-gray-800"
                          >
                            {property?.name}
                            <span className="ml-1 text-xs text-primary-600">({access.role})</span>
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No properties assigned</p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(user.id, user.isVerified)}
                    disabled={toggleUserStatusMutation.isPending}
                    data-testid={`button-toggle-status-${user.id}`}
                  >
                    {user.isVerified ? "Deactivate" : "Activate"}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(user)}
                    data-testid={`button-edit-${user.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        data-testid={`button-delete-${user.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{user.name}"? 
                          This action cannot be undone and will remove all user data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(user.id)}
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

      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">
              {searchTerm || filterRole !== "all" || filterStatus !== "all"
                ? "Try adjusting your search criteria."
                : "Create your first user to get started."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Property Assignment Dialog */}
      <Dialog open={!!propertyDialogUser} onOpenChange={(open) => !open && setPropertyDialogUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-800">
              Manage Properties for {propertyDialogUser?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Currently Assigned Properties */}
            <div>
              <h3 className="text-sm font-medium text-[#006699] mb-3">Assigned Properties</h3>
              {propertyDialogUser && getUserProperties(propertyDialogUser.id).length > 0 ? (
                <div className="space-y-2">
                  {getUserProperties(propertyDialogUser.id).map(({ access, property }) => (
                    <div 
                      key={access.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-primary-600" />
                        <div>
                          <p className="font-medium text-gray-900">{property?.name}</p>
                          <p className="text-sm text-primary-600">
                            Role: <span className="font-medium">{access.role}</span>
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveProperty(access.id)}
                        disabled={removePropertyMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid={`button-remove-property-${access.id}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic py-4">No properties assigned yet</p>
              )}
            </div>

            {/* Assign New Property */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-[#006699] mb-3">Assign New Property</h3>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="property-select">Property</Label>
                  <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                    <SelectTrigger id="property-select" data-testid="select-property">
                      <SelectValue placeholder="Select a property" />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyDialogUser && getAvailableProperties(propertyDialogUser.id).length > 0 ? (
                        getAvailableProperties(propertyDialogUser.id).map((property) => (
                          <SelectItem key={property.id} value={property.id.toString()}>
                            {property.name} ({property.type})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No available properties</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-40">
                  <Label htmlFor="role-select">Role</Label>
                  <Select value={selectedPropertyRole} onValueChange={setSelectedPropertyRole}>
                    <SelectTrigger id="role-select" data-testid="select-property-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={handleAssignProperty}
                    disabled={!selectedPropertyId || assignPropertyMutation.isPending}
                    className="bg-[#006699] hover:bg-[#002a66]"
                    data-testid="button-assign-property"
                  >
                    {assignPropertyMutation.isPending ? "Assigning..." : "Assign"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}