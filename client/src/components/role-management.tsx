import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertRoleMasterSchema, type RoleMaster, type NewRoleMaster, type User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, Edit, Trash2, Search, Shield, Users, Crown, 
  Building, UserCheck, Calculator, User as UserIcon,
  Eye, Lock, Unlock, Star, AlertTriangle, CheckCircle
} from "lucide-react";

// Extended form schema for client-side validation
const roleFormSchema = z.object({
  roleName: z.string().min(1, "Role name is required"),
  roleCode: z.string().min(1, "Role code is required"),
  description: z.string().min(1, "Description is required"),
  level: z.number().min(1).max(10, "Level must be between 1 and 10"),
  permissions: z.array(z.string()).default([]),
  canAccessAdminPanel: z.boolean().optional(),
  canManageUsers: z.boolean().optional(),
  canManageProperties: z.boolean().optional(),
  canManageRates: z.boolean().optional(),
  canManageBookings: z.boolean().optional(),
  canManageFinance: z.boolean().optional(),
  canManageReports: z.boolean().optional(),
  canManageMasterData: z.boolean().optional(),
  canManageRoles: z.boolean().optional(),
  canViewAuditLogs: z.boolean().optional(),
  defaultPropertyPermissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isSystemRole: z.boolean().optional(),
  maxProperties: z.number().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  notes: z.string().optional(),
  createdBy: z.number().nullable().optional(),
});

type RoleFormData = z.infer<typeof roleFormSchema>;

// Icon mapping for role display
const iconMap: Record<string, any> = {
  'shield': Shield,
  'building': Building,
  'user-check': UserCheck,
  'calculator': Calculator,
  'user': UserIcon,
  'crown': Crown,
  'users': Users
};

// Available permissions for roles
const availablePermissions = [
  { id: 'system.admin', name: 'System Administration', category: 'System' },
  { id: 'user.manage', name: 'User Management', category: 'Users' },
  { id: 'user.view', name: 'View Users', category: 'Users' },
  { id: 'property.manage', name: 'Property Management', category: 'Properties' },
  { id: 'property.own', name: 'Property Ownership', category: 'Properties' },
  { id: 'booking.manage', name: 'Booking Management', category: 'Bookings' },
  { id: 'booking.create', name: 'Create Bookings', category: 'Bookings' },
  { id: 'booking.view', name: 'View Bookings', category: 'Bookings' },
  { id: 'booking.view.own', name: 'View Own Bookings', category: 'Bookings' },
  { id: 'rate.manage', name: 'Rate Management', category: 'Rates' },
  { id: 'finance.manage', name: 'Financial Management', category: 'Finance' },
  { id: 'finance.view.property', name: 'View Property Finance', category: 'Finance' },
  { id: 'report.view', name: 'View Reports', category: 'Reports' },
  { id: 'report.view.property', name: 'View Property Reports', category: 'Reports' },
  { id: 'audit.view', name: 'View Audit Logs', category: 'Security' },
  { id: 'role.manage', name: 'Role Management', category: 'Security' },
  { id: 'guest.manage', name: 'Guest Management', category: 'Guest Services' },
  { id: 'payment.process', name: 'Process Payments', category: 'Payments' },
  { id: 'payment.manage', name: 'Payment Management', category: 'Payments' },
  { id: 'invoice.manage', name: 'Invoice Management', category: 'Finance' },
  { id: 'profile.manage', name: 'Profile Management', category: 'Personal' },
  { id: 'review.create', name: 'Create Reviews', category: 'Reviews' },
  { id: 'user.manage.property', name: 'Manage Property Users', category: 'Users' }
];

// Permission categories for organization
const permissionCategories = [
  'System', 'Users', 'Properties', 'Bookings', 'Rates', 
  'Finance', 'Reports', 'Security', 'Guest Services', 'Payments', 'Personal', 'Reviews'
];

export function RoleManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleMaster | null>(null);
  const [viewingUsers, setViewingUsers] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: roles = [], isLoading } = useQuery<RoleMaster[]>({
    queryKey: ["/api/roles"],
  });

  const { data: roleUsers = [], isLoading: isUsersLoading } = useQuery<User[]>({
    queryKey: ["/api/roles", viewingUsers, "users"],
    enabled: !!viewingUsers,
    queryFn: async () => {
      if (!viewingUsers) return [];
      const response = await fetch(`/api/roles/${viewingUsers}/users`);
      if (!response.ok) throw new Error('Failed to fetch role users');
      return response.json();
    }
  });

  // Form for role creation/editing
  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      roleName: "",
      roleCode: "",
      description: "",
      level: 5,
      permissions: [],
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
      defaultPropertyPermissions: ["read"],
      isActive: true,
      isSystemRole: false,
      maxProperties: undefined,
      color: "#3B82F6",
      icon: "user",
      notes: "",
      createdBy: null
    },
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (data: RoleFormData) => {
      const response = await apiRequest("POST", "/api/roles", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setShowCreateDialog(false);
      form.reset();
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
    mutationFn: async ({ id, data }: { id: number; data: RoleFormData }) => {
      const response = await apiRequest("PUT", `/api/roles/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setEditingRole(null);
      setShowCreateDialog(false);
      form.reset();
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
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/roles/${id}`);
      return response;
    },
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

  const handleSubmit = (data: RoleFormData) => {
    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, data });
    } else {
      createRoleMutation.mutate(data);
    }
  };

  const handleEdit = (role: RoleMaster) => {
    setEditingRole(role);
    form.reset({
      roleName: role.roleName,
      roleCode: role.roleCode,
      description: role.description || "",
      level: role.level,
      permissions: Array.isArray(role.permissions) ? role.permissions as string[] : [],
      canAccessAdminPanel: role.canAccessAdminPanel || false,
      canManageUsers: role.canManageUsers || false,
      canManageProperties: role.canManageProperties || false,
      canManageRates: role.canManageRates || false,
      canManageBookings: role.canManageBookings || false,
      canManageFinance: role.canManageFinance || false,
      canManageReports: role.canManageReports || false,
      canManageMasterData: role.canManageMasterData || false,
      canManageRoles: role.canManageRoles || false,
      canViewAuditLogs: role.canViewAuditLogs || false,
      defaultPropertyPermissions: Array.isArray(role.defaultPropertyPermissions) ? role.defaultPropertyPermissions as string[] : ["read"],
      isActive: role.isActive,
      isSystemRole: role.isSystemRole || false,
      maxProperties: role.maxProperties || undefined,
      color: role.color || "#3B82F6",
      icon: role.icon || "user",
      notes: role.notes || "",
      createdBy: role.createdBy || null
    });
    setShowCreateDialog(true);
  };

  const handleDelete = (role: RoleMaster) => {
    if (role.isSystemRole) {
      toast({
        title: "Cannot Delete System Role",
        description: "System roles cannot be deleted as they are essential for platform operation.",
        variant: "destructive"
      });
      return;
    }

    if (confirm(`Are you sure you want to delete the role "${role.roleName}"? This action cannot be undone.`)) {
      deleteRoleMutation.mutate(role.id);
    }
  };

  const handleCreate = () => {
    setEditingRole(null);
    form.reset();
    setShowCreateDialog(true);
  };

  const filteredRoles = roles.filter((role) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      role.roleName.toLowerCase().includes(searchLower) ||
      role.roleCode.toLowerCase().includes(searchLower) ||
      role.description?.toLowerCase().includes(searchLower)
    );
  });

  const getRoleIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || UserIcon;
    return <IconComponent className="w-4 h-4" />;
  };

  const getLevelBadgeColor = (level: number) => {
    if (level === 1) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    if (level === 2) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    if (level === 3) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    if (level === 4) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

  const getLevelName = (level: number) => {
    if (level === 1) return "Executive";
    if (level === 2) return "Manager";
    if (level === 3) return "Supervisor";
    if (level === 4) return "Staff";
    return "Guest";
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Role Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Define user roles and permissions for system access control
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate} data-testid="button-create-role">
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRole ? "Edit Role" : "Create New Role"}
              </DialogTitle>
              <DialogDescription>
                Configure role permissions and access levels for your organization
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="permissions">Permissions</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="roleName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Hotel Manager, Front Desk Staff" 
                                {...field} 
                                data-testid="input-role-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="roleCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role Code</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., HOTEL_MGR, FRONT_DESK" 
                                {...field}
                                style={{ textTransform: 'uppercase' }}
                                onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
                                data-testid="input-role-code"
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
                              placeholder="Describe the role's responsibilities and scope..." 
                              {...field}
                              value={field.value || ""}
                              data-testid="textarea-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="level"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Authority Level</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                              <FormControl>
                                <SelectTrigger data-testid="select-level">
                                  <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">1 - Executive (Highest)</SelectItem>
                                <SelectItem value="2">2 - Manager</SelectItem>
                                <SelectItem value="3">3 - Supervisor</SelectItem>
                                <SelectItem value="4">4 - Staff</SelectItem>
                                <SelectItem value="5">5 - Guest (Lowest)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Color</FormLabel>
                            <FormControl>
                              <div className="flex space-x-2">
                                <Input 
                                  type="color" 
                                  {...field} 
                                  className="w-16 h-10 p-1 rounded"
                                  data-testid="input-color"
                                />
                                <Input 
                                  {...field} 
                                  placeholder="#3B82F6" 
                                  className="flex-1"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="icon"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Icon</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-icon">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="shield">🛡️ Shield (Admin)</SelectItem>
                                <SelectItem value="building">🏢 Building (Property)</SelectItem>
                                <SelectItem value="user-check">✅ User Check (Staff)</SelectItem>
                                <SelectItem value="calculator">🧮 Calculator (Finance)</SelectItem>
                                <SelectItem value="crown">👑 Crown (Owner)</SelectItem>
                                <SelectItem value="users">👥 Users (Group)</SelectItem>
                                <SelectItem value="user">👤 User (Standard)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="permissions" className="space-y-6">
                    {/* Admin Panel Access */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-blue-500" />
                        <h3 className="text-lg font-medium">Administrative Access</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded">
                        <FormField
                          control={form.control}
                          name="canAccessAdminPanel"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between">
                              <FormLabel>Admin Panel Access</FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-admin-access"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="canManageRoles"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between">
                              <FormLabel>Role Management</FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-role-management"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="canViewAuditLogs"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between">
                              <FormLabel>View Audit Logs</FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-audit-logs"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="canManageMasterData"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between">
                              <FormLabel>Master Data Management</FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-master-data"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Operational Permissions */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Building className="w-5 h-5 text-green-500" />
                        <h3 className="text-lg font-medium">Operational Permissions</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded">
                        <FormField
                          control={form.control}
                          name="canManageUsers"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between">
                              <FormLabel>User Management</FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-user-management"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="canManageProperties"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between">
                              <FormLabel>Property Management</FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-property-management"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="canManageBookings"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between">
                              <FormLabel>Booking Management</FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-booking-management"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="canManageRates"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between">
                              <FormLabel>Rate Management</FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-rate-management"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="canManageFinance"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between">
                              <FormLabel>Financial Management</FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-finance-management"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="canManageReports"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between">
                              <FormLabel>Report Access</FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-report-access"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* System Permissions */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Lock className="w-5 h-5 text-purple-500" />
                        <h3 className="text-lg font-medium">Custom Permissions</h3>
                      </div>
                      <FormField
                        control={form.control}
                        name="permissions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>System Permissions</FormLabel>
                            <FormControl>
                              <div className="max-h-64 overflow-y-auto border rounded p-4">
                                {permissionCategories.map((category) => {
                                  const categoryPermissions = availablePermissions.filter(p => p.category === category);
                                  if (categoryPermissions.length === 0) return null;
                                  
                                  return (
                                    <div key={category} className="mb-4">
                                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {category}
                                      </h4>
                                      <div className="grid grid-cols-2 gap-2">
                                        {categoryPermissions.map((permission) => (
                                          <label key={permission.id} className="flex items-center space-x-2 text-sm">
                                            <input
                                              type="checkbox"
                                              checked={field.value.includes(permission.id)}
                                              onChange={(e) => {
                                                const newPermissions = e.target.checked
                                                  ? [...field.value, permission.id]
                                                  : field.value.filter(p => p !== permission.id);
                                                field.onChange(newPermissions);
                                              }}
                                              className="rounded"
                                            />
                                            <span>{permission.name}</span>
                                          </label>
                                        ))}
                                      </div>
                                      <Separator className="mt-2" />
                                    </div>
                                  );
                                })}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="advanced" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="maxProperties"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Properties (Leave empty for unlimited)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              placeholder="Unlimited"
                              data-testid="input-max-properties"
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
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Active Status</FormLabel>
                            <div className="text-sm text-gray-500">
                              Enable this role for assignment to users
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
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Additional notes about this role..." 
                              {...field} 
                              data-testid="textarea-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateDialog(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                    data-testid="button-submit-role"
                  >
                    {editingRole ? "Update Role" : "Create Role"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search roles by name, code, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
      </div>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>System Roles ({filteredRoles.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRoles.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                No roles found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm
                  ? "No roles match your search criteria."
                  : "Create your first custom role to get started."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                            style={{ backgroundColor: role.color }}
                          >
                            {getRoleIcon(role.icon)}
                          </div>
                          <div>
                            <div className="font-medium flex items-center space-x-2">
                              <span>{role.roleName}</span>
                              {role.isSystemRole && (
                                <Badge variant="outline" className="text-xs">
                                  System
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {role.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {role.roleCode}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getLevelBadgeColor(role.level)}>
                          Level {role.level} - {getLevelName(role.level)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {role.canAccessAdminPanel && (
                            <Badge variant="outline" className="text-xs">
                              Admin
                            </Badge>
                          )}
                          {role.canManageUsers && (
                            <Badge variant="outline" className="text-xs">
                              Users
                            </Badge>
                          )}
                          {role.canManageProperties && (
                            <Badge variant="outline" className="text-xs">
                              Properties
                            </Badge>
                          )}
                          {role.canManageFinance && (
                            <Badge variant="outline" className="text-xs">
                              Finance
                            </Badge>
                          )}
                          {Array.isArray(role.permissions) && role.permissions.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{role.permissions.length - 4}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingUsers(role.id)}
                          data-testid={`button-view-users-${role.id}`}
                        >
                          <Users className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge variant={role.isActive ? "default" : "secondary"}>
                          {role.isActive ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(role)}
                            data-testid={`button-edit-role-${role.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {!role.isSystemRole && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(role)}
                              data-testid={`button-delete-role-${role.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Dialog */}
      <Dialog open={!!viewingUsers} onOpenChange={() => setViewingUsers(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Users with Role</DialogTitle>
            <DialogDescription>
              Users currently assigned to this role
            </DialogDescription>
          </DialogHeader>
          
          {isUsersLoading ? (
            <div className="p-4 text-center">Loading users...</div>
          ) : roleUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No users currently assigned to this role
            </div>
          ) : (
            <div className="space-y-2">
              {roleUsers.map((user) => (
                <div key={user.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <UserIcon className="w-8 h-8 text-gray-400" />
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}