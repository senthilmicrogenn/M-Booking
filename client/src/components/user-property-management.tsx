import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { UserPropertyAccess, NewUserPropertyAccess, User, Property } from "@shared/schema";
import { Plus, Edit, Trash2, Users, Building, Settings, Shield } from "lucide-react";

const userPropertyAccessSchema = z.object({
  userId: z.number({ required_error: "User is required" }),
  propertyId: z.number({ required_error: "Property is required" }),
  role: z.string().min(1, "Role is required"),
  permissions: z.array(z.string()),
  isActive: z.boolean(),
  assignedBy: z.number().optional()
});

type UserPropertyAccessFormData = z.infer<typeof userPropertyAccessSchema>;

export default function UserPropertyManagement() {
  const [editingAccess, setEditingAccess] = useState<UserPropertyAccess | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UserPropertyAccessFormData>({
    resolver: zodResolver(userPropertyAccessSchema),
    defaultValues: {
      permissions: ["read", "write"],
      isActive: true
    }
  });

  // Fetch user property access data
  const { data: accessData = [], isLoading: isAccessLoading } = useQuery<UserPropertyAccess[]>({
    queryKey: ['/api/user-property-access'],
    queryFn: async () => {
      const response = await fetch('/api/user-property-access');
      if (!response.ok) throw new Error('Failed to fetch user property access');
      return response.json();
    }
  });

  // Fetch users and properties for dropdowns
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      const response = await fetch('/api/properties');
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: NewUserPropertyAccess) => 
      apiRequest('POST', '/api/user-property-access', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-property-access'] });
      toast({
        title: "User Property Access Created",
        description: "User access has been granted successfully.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user property access",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UserPropertyAccess> }) =>
      apiRequest('PUT', `/api/user-property-access/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-property-access'] });
      toast({
        title: "User Property Access Updated",
        description: "User access has been updated successfully.",
      });
      setIsDialogOpen(false);
      setEditingAccess(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user property access",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/user-property-access/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-property-access'] });
      toast({
        title: "User Property Access Removed",
        description: "User access has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove user property access",
        variant: "destructive",
      });
    },
  });

  // Filter access data
  const filteredAccess = accessData.filter(access => {
    const user = users.find(u => u.id === access.userId);
    const property = properties.find(p => p.id === access.propertyId);
    
    const matchesSearch = !searchQuery || 
      user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === "all" || access.role === filterRole;
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "active" && access.isActive) ||
      (filterStatus === "inactive" && !access.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const onSubmit = (data: UserPropertyAccessFormData) => {
    if (editingAccess) {
      updateMutation.mutate({
        id: editingAccess.id,
        data
      });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (access: UserPropertyAccess) => {
    setEditingAccess(access);
    form.reset({
      userId: access.userId,
      propertyId: access.propertyId,
      role: access.role,
      permissions: Array.isArray(access.permissions) ? access.permissions : ["read", "write"],
      isActive: access.isActive,
      assignedBy: access.assignedBy || undefined
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to remove this user property access?")) {
      deleteMutation.mutate(id);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "manager": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "staff": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "viewer": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user?.name || `User ${userId}`;
  };

  const getPropertyName = (propertyId: number) => {
    const property = properties.find(p => p.id === propertyId);
    return property?.name || `Property ${propertyId}`;
  };

  const roleOptions = [
    { value: "owner", label: "Owner", description: "Full access to all property operations" },
    { value: "manager", label: "Manager", description: "Manage property operations and staff" },
    { value: "staff", label: "Staff", description: "Limited access to assigned tasks" },
    { value: "viewer", label: "Viewer", description: "Read-only access to property data" }
  ];

  const permissionOptions = [
    { value: "read", label: "Read" },
    { value: "write", label: "Write" },
    { value: "delete", label: "Delete" },
    { value: "manage_users", label: "Manage Users" },
    { value: "financial", label: "Financial Access" }
  ];

  if (isAccessLoading) {
    return <div className="p-6">Loading user property access...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User Property Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage user access to different properties in your chain</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              data-testid="button-create-access"
              onClick={() => {
                setEditingAccess(null);
                form.reset({
                  permissions: ["read", "write"],
                  isActive: true
                });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Grant Property Access
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAccess ? "Edit Property Access" : "Grant Property Access"}
              </DialogTitle>
              <DialogDescription>
                Assign a user to manage or access a specific property with defined roles and permissions.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger data-testid="select-user">
                              <SelectValue placeholder="Select user" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                <div className="flex items-center space-x-2">
                                  <span>{user.name}</span>
                                  <span className="text-sm text-gray-500">({user.email})</span>
                                </div>
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
                    name="propertyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger data-testid="select-property">
                              <SelectValue placeholder="Select property" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {properties.map((property) => (
                              <SelectItem key={property.id} value={property.id.toString()}>
                                {property.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-role">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roleOptions.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              <div>
                                <div className="font-medium">{role.label}</div>
                                <div className="text-sm text-gray-500">{role.description}</div>
                              </div>
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
                  name="permissions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Permissions</FormLabel>
                      <FormDescription>
                        Select the specific permissions this user will have for the property
                      </FormDescription>
                      <div className="grid grid-cols-3 gap-2">
                        {permissionOptions.map((permission) => (
                          <div key={permission.value} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={permission.value}
                              checked={field.value?.includes(permission.value) || false}
                              onChange={(e) => {
                                const currentPermissions = field.value || [];
                                if (e.target.checked) {
                                  field.onChange([...currentPermissions, permission.value]);
                                } else {
                                  field.onChange(currentPermissions.filter(p => p !== permission.value));
                                }
                              }}
                              className="rounded"
                            />
                            <label htmlFor={permission.value} className="text-sm">
                              {permission.label}
                            </label>
                          </div>
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
                        <FormLabel className="text-base">Active Access</FormLabel>
                        <FormDescription>
                          When enabled, the user can access the property with the assigned permissions
                        </FormDescription>
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

                <DialogFooter>
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
                    data-testid="button-submit-access"
                  >
                    {editingAccess ? "Update Access" : "Grant Access"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search users or properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
                className="w-full"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[150px]" data-testid="select-filter-role">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]" data-testid="select-filter-status">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Access List */}
      <div className="grid gap-4">
        {filteredAccess.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  No property access found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery || filterRole !== "all" || filterStatus !== "all"
                    ? "No access matches your current filters."
                    : "Start by granting users access to properties."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredAccess.map((access) => (
            <Card key={access.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {getUserName(access.userId)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Building className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {getPropertyName(access.propertyId)}
                      </span>
                    </div>
                    <Badge className={getRoleBadgeColor(access.role)}>
                      <Shield className="w-3 h-3 mr-1" />
                      {access.role}
                    </Badge>
                    <Badge variant={access.isActive ? "default" : "secondary"}>
                      {access.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-gray-500">
                      Permissions: {Array.isArray(access.permissions) ? access.permissions.join(", ") : "N/A"}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(access)}
                      data-testid={`button-edit-access-${access.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(access.id)}
                      data-testid={`button-delete-access-${access.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  Assigned: {new Date(access.assignedAt).toLocaleDateString()}
                  {access.assignedBy && ` by User ${access.assignedBy}`}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}