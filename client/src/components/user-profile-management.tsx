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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Users, 
  UserCog,
  Shield,
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Crown,
  Building,
  UserCheck,
  Settings,
  Lock,
  Eye,
  CheckCircle,
  XCircle,
  Filter
} from "lucide-react";

// Types for roles and users
interface RoleMaster {
  id: number;
  roleName: string;
  roleCode: string;
  description: string | null;
  level: number;
  permissions: any[];
  canAccessAdminPanel: boolean;
  canManageUsers: boolean;
  canManageProperties: boolean;
  canManageRates: boolean;
  canManageBookings: boolean;
  canManageFinance: boolean;
  canManageReports: boolean;
  canManageMasterData: boolean;
  canManageRoles: boolean;
  canViewAuditLogs: boolean;
  defaultPropertyPermissions: string[];
  isActive: boolean;
  isSystemRole: boolean;
  maxProperties: number | null;
  color: string;
  icon: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface User {
  id: number;
  email: string | null;
  phoneNumber: string;
  name: string;
  role: string;
  roleId: number | null;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Form schemas
const roleFormSchema = z.object({
  roleName: z.string().min(1, "Role name is required"),
  roleCode: z.string().min(1, "Role code is required"),
  description: z.string().optional(),
  level: z.number().min(1).max(10),
  canAccessAdminPanel: z.boolean().default(false),
  canManageUsers: z.boolean().default(false),
  canManageProperties: z.boolean().default(false),
  canManageRates: z.boolean().default(false),
  canManageBookings: z.boolean().default(false),
  canManageFinance: z.boolean().default(false),
  canManageReports: z.boolean().default(false),
  canManageMasterData: z.boolean().default(false),
  canManageRoles: z.boolean().default(false),
  canViewAuditLogs: z.boolean().default(false),
  isActive: z.boolean().default(true),
  maxProperties: z.string().optional(),
  color: z.string().default("#3B82F6"),
  icon: z.string().default("user"),
  notes: z.string().optional(),
});

type RoleFormData = z.infer<typeof roleFormSchema>;

export function UserProfileManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("roles");
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleMaster | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserRoleDialog, setShowUserRoleDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery<RoleMaster[]>({
    queryKey: ["/api/roles"],
  });

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users/all"],
  });

  // Form for role creation/editing
  const roleForm = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      roleName: "",
      roleCode: "",
      description: "",
      level: 5,
      canAccessAdminPanel: false,
      canManageUsers: false,
      canManageProperties: false,
      canManageRates: false,
      canManageBookings: false,
      canManageFinance: false,
      canManageReports: false,
      canManageMasterData: false,
      canManageRoles: false,
      canViewAuditLogs: false,
      isActive: true,
      maxProperties: "",
      color: "#3B82F6",
      icon: "user",
      notes: "",
    },
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: (data: RoleFormData) => {
      const roleData = {
        ...data,
        maxProperties: data.maxProperties ? parseInt(data.maxProperties) : null,
        permissions: [], // Default empty permissions array
        defaultPropertyPermissions: ["read"], // Default property permissions
      };
      
      return apiRequest("POST", "/api/roles", roleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setShowRoleDialog(false);
      roleForm.reset();
      toast({ title: "Success", description: "Role created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create role",
        variant: "destructive" 
      });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RoleFormData }) => {
      const roleData = {
        ...data,
        maxProperties: data.maxProperties ? parseInt(data.maxProperties) : null,
      };
      
      return apiRequest("PUT", `/api/roles/${id}`, roleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setEditingRole(null);
      setShowRoleDialog(false);
      roleForm.reset();
      toast({ title: "Success", description: "Role updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update role",
        variant: "destructive" 
      });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({ title: "Success", description: "Role deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete role",
        variant: "destructive" 
      });
    },
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) => 
      apiRequest("PUT", `/api/users/${userId}/role`, { roleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/all"] });
      setShowUserRoleDialog(false);
      setSelectedUser(null);
      toast({ title: "Success", description: "User role updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update user role",
        variant: "destructive" 
      });
    },
  });

  const handleRoleSubmit = (data: RoleFormData) => {
    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, data });
    } else {
      createRoleMutation.mutate(data);
    }
  };

  const handleEditRole = (role: RoleMaster) => {
    setEditingRole(role);
    roleForm.reset({
      roleName: role.roleName,
      roleCode: role.roleCode,
      description: role.description || "",
      level: role.level,
      canAccessAdminPanel: role.canAccessAdminPanel,
      canManageUsers: role.canManageUsers,
      canManageProperties: role.canManageProperties,
      canManageRates: role.canManageRates,
      canManageBookings: role.canManageBookings,
      canManageFinance: role.canManageFinance,
      canManageReports: role.canManageReports,
      canManageMasterData: role.canManageMasterData,
      canManageRoles: role.canManageRoles,
      canViewAuditLogs: role.canViewAuditLogs,
      isActive: role.isActive,
      maxProperties: role.maxProperties?.toString() || "",
      color: role.color,
      icon: role.icon,
      notes: role.notes || "",
    });
    setShowRoleDialog(true);
  };

  const handleDeleteRole = (id: number) => {
    if (confirm("Are you sure you want to delete this role?")) {
      deleteRoleMutation.mutate(id);
    }
  };

  const handleUpdateUserRole = (user: User) => {
    setSelectedUser(user);
    setShowUserRoleDialog(true);
  };

  // Filter data based on search
  const filteredRoles = roles.filter((role) =>
    role.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.roleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phoneNumber.includes(searchTerm) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (icon: string) => {
    switch (icon) {
      case 'crown': return <Crown className="h-4 w-4" />;
      case 'shield': return <Shield className="h-4 w-4" />;
      case 'building': return <Building className="h-4 w-4" />;
      case 'settings': return <Settings className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              User Profile & Role Management
            </CardTitle>
            <CardDescription>
              Manage user roles, permissions, and user profile assignments
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Role Master
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Profiles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => {
                      setEditingRole(null);
                      roleForm.reset();
                    }}
                    className="bg-[#006699] hover:bg-[#002a66]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Role
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      {editingRole ? "Edit Role" : "Add New Role"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingRole ? "Update role configuration" : "Create a new role with specific permissions"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="overflow-y-auto max-h-[70vh]">
                    <Form {...roleForm}>
                      <form onSubmit={roleForm.handleSubmit(handleRoleSubmit)} className="space-y-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={roleForm.control}
                              name="roleName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Role Name *</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Super Admin" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={roleForm.control}
                              name="roleCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Role Code *</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="SUPER_ADMIN" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={roleForm.control}
                              name="level"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Level (1-10) *</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      type="number" 
                                      min="1" 
                                      max="10"
                                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={roleForm.control}
                              name="maxProperties"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Max Properties</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="number" placeholder="Leave empty for unlimited" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={roleForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea {...field} placeholder="Role description and responsibilities" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Permissions */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold border-b pb-2">Permissions</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={roleForm.control}
                              name="canAccessAdminPanel"
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between">
                                  <div>
                                    <FormLabel>Admin Panel Access</FormLabel>
                                    <p className="text-xs text-gray-600">Can access admin panel</p>
                                  </div>
                                  <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={roleForm.control}
                              name="canManageUsers"
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between">
                                  <div>
                                    <FormLabel>Manage Users</FormLabel>
                                    <p className="text-xs text-gray-600">Create, edit, delete users</p>
                                  </div>
                                  <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={roleForm.control}
                              name="canManageProperties"
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between">
                                  <div>
                                    <FormLabel>Manage Properties</FormLabel>
                                    <p className="text-xs text-gray-600">Property operations</p>
                                  </div>
                                  <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={roleForm.control}
                              name="canManageBookings"
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between">
                                  <div>
                                    <FormLabel>Manage Bookings</FormLabel>
                                    <p className="text-xs text-gray-600">Booking operations</p>
                                  </div>
                                  <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={roleForm.control}
                              name="canManageFinance"
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between">
                                  <div>
                                    <FormLabel>Manage Finance</FormLabel>
                                    <p className="text-xs text-gray-600">Financial operations</p>
                                  </div>
                                  <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={roleForm.control}
                              name="canManageRoles"
                              render={({ field }) => (
                                <FormItem className="flex items-center justify-between">
                                  <div>
                                    <FormLabel>Manage Roles</FormLabel>
                                    <p className="text-xs text-gray-600">Role and permission management</p>
                                  </div>
                                  <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2 pt-4 border-t">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setShowRoleDialog(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            className="bg-[#006699] hover:bg-[#002a66]"
                            disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                          >
                            {createRoleMutation.isPending || updateRoleMutation.isPending 
                              ? "Saving..." 
                              : editingRole 
                              ? "Update Role" 
                              : "Create Role"
                            }
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Roles Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rolesLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading roles...
                      </TableCell>
                    </TableRow>
                  ) : filteredRoles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No roles found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRoles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: role.color }}
                            />
                            {getRoleIcon(role.icon)}
                            <div>
                              <div className="font-medium">{role.roleName}</div>
                              {role.description && (
                                <div className="text-sm text-gray-600">{role.description}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{role.roleCode}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{role.level}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {role.canAccessAdminPanel && <Badge variant="secondary" className="text-xs">Admin</Badge>}
                            {role.canManageUsers && <Badge variant="secondary" className="text-xs">Users</Badge>}
                            {role.canManageProperties && <Badge variant="secondary" className="text-xs">Properties</Badge>}
                            {role.canManageBookings && <Badge variant="secondary" className="text-xs">Bookings</Badge>}
                            {role.canManageFinance && <Badge variant="secondary" className="text-xs">Finance</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={role.isActive ? "default" : "secondary"}
                              className={role.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                            >
                              {role.isActive ? "Active" : "Inactive"}
                            </Badge>
                            {role.isSystemRole && (
                              <Badge variant="outline" className="text-xs">
                                <Lock className="h-3 w-3 mr-1" />
                                System
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditRole(role)}
                              title="Edit Role"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {!role.isSystemRole && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRole(role.id)}
                                title="Delete Role"
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{user.name}</div>
                            {user.isVerified && <UserCheck className="h-4 w-4 text-green-600" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {user.email && (
                              <div className="text-sm">{user.email}</div>
                            )}
                            <div className="text-sm text-gray-600">{user.phoneNumber}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.isVerified ? "default" : "secondary"}
                            className={user.isVerified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                          >
                            {user.isVerified ? "Verified" : "Unverified"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateUserRole(user)}
                            title="Update Role"
                          >
                            <UserCog className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {/* User Role Update Dialog */}
        <Dialog open={showUserRoleDialog} onOpenChange={setShowUserRoleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Update User Role
              </DialogTitle>
              <DialogDescription>
                Change the role for {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Current Role</Label>
                <div className="p-2 bg-gray-50 rounded">
                  <Badge variant="outline" className="capitalize">
                    {selectedUser?.role}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label>New Role</Label>
                <Select
                  onValueChange={(value) => {
                    if (selectedUser) {
                      updateUserRoleMutation.mutate({
                        userId: selectedUser.id,
                        roleId: parseInt(value)
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles
                      .filter(role => role.isActive)
                      .map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          <div className="flex items-center gap-2">
                            {getRoleIcon(role.icon)}
                            {role.roleName}
                            <Badge variant="outline" className="ml-2 text-xs">
                              Level {role.level}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}