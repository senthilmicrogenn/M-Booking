import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, User, X, CheckCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { User as UserType, Property, UserPropertyAccess } from "@shared/schema";

export function ManagePropertyAccess() {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<number[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("manager");
  const [propertySearchTerm, setPropertySearchTerm] = useState<string>("");
  const [userSearchTerm, setUserSearchTerm] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: userPropertyAccess = [] } = useQuery<UserPropertyAccess[]>({
    queryKey: ["/api/user-property-access"],
  });

  const assignPropertiesMutation = useMutation({
    mutationFn: async ({ userId, propertyIds, role }: { userId: number; propertyIds: number[]; role: string }) => {
      const promises = propertyIds.map(propertyId =>
        fetch("/api/user-property-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, propertyId, role })
        }).then(res => {
          if (!res.ok) return res.json().then(err => Promise.reject(err));
          return res.json();
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-property-access"] });
      setSelectedPropertyIds([]);
      toast({ title: "Properties assigned successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: error.message || "Failed to assign properties", 
        variant: "destructive" 
      });
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

  const getFilteredUsers = () => {
    if (!userSearchTerm.trim()) return users;
    
    const searchLower = userSearchTerm.toLowerCase();
    return users.filter(u => 
      u.name.toLowerCase().includes(searchLower) ||
      (u.email && u.email.toLowerCase().includes(searchLower)) ||
      u.phoneNumber.toLowerCase().includes(searchLower)
    );
  };

  const getAssignedProperties = () => {
    if (!selectedUserId) return [];
    const userId = parseInt(selectedUserId);
    let assignedProps = userPropertyAccess
      .filter(access => access.userId === userId && access.isActive)
      .map(access => {
        const property = properties.find(p => p.id === access.propertyId);
        return { access, property };
      })
      .filter(item => item.property);
    
    // Apply role filter
    if (roleFilter !== "all") {
      assignedProps = assignedProps.filter(item => item.access.role === roleFilter);
    }
    
    return assignedProps;
  };

  const getAvailableProperties = () => {
    if (!selectedUserId) return [];
    const userId = parseInt(selectedUserId);
    const assignedPropertyIds = userPropertyAccess
      .filter(access => access.userId === userId && access.isActive)
      .map(access => access.propertyId);
    
    let availableProps = properties.filter(p => !assignedPropertyIds.includes(p.id));
    
    // Apply search filter
    if (propertySearchTerm.trim()) {
      const searchLower = propertySearchTerm.toLowerCase();
      availableProps = availableProps.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.type.toLowerCase().includes(searchLower) ||
        p.city.toLowerCase().includes(searchLower) ||
        (p.address && p.address.toLowerCase().includes(searchLower))
      );
    }
    
    return availableProps;
  };

  const togglePropertySelection = (propertyId: number) => {
    setSelectedPropertyIds(prev =>
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleAssignProperties = () => {
    if (!selectedUserId || selectedPropertyIds.length === 0) {
      toast({ title: "Please select a user and at least one property", variant: "destructive" });
      return;
    }
    assignPropertiesMutation.mutate({
      userId: parseInt(selectedUserId),
      propertyIds: selectedPropertyIds,
      role: selectedRole
    });
  };

  const handleRemoveProperty = (accessId: number) => {
    removePropertyMutation.mutate(accessId);
  };

  const selectedUser = users.find(u => u.id === parseInt(selectedUserId));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Manage Property Access</h2>
        <p className="text-primary-600">Assign multiple properties to a user with a specific role</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - User Selection & Property Assignment */}
        <div className="space-y-6">
          {/* User Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                <User className="w-5 h-5" />
                Select User
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* User Search */}
              <div>
                <Label htmlFor="user-search">Search Users</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="user-search"
                    placeholder="Search by name, email, or phone..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-users"
                  />
                </div>
              </div>

              {/* User Search Results */}
              {userSearchTerm ? (
                <div>
                  <p className="text-xs text-primary-600 mb-2">
                    {getFilteredUsers().length} {getFilteredUsers().length === 1 ? 'user' : 'users'} found
                  </p>
                  {getFilteredUsers().length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {getFilteredUsers().map((user) => (
                        <div
                          key={user.id}
                          onClick={() => {
                            setSelectedUserId(user.id.toString());
                            setSelectedPropertyIds([]);
                            setUserSearchTerm("");
                          }}
                          className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedUserId === user.id.toString()
                              ? 'border-primary-600 bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          data-testid={`user-result-${user.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{user.name}</p>
                              <p className="text-sm text-primary-600">{user.email || user.phoneNumber}</p>
                            </div>
                            <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                              {user.role}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic py-4 text-center">
                      No users match your search
                    </p>
                  )}
                </div>
              ) : null}

              {selectedUser && !userSearchTerm && (
                <div>
                  <Label>Selected User</Label>
                  <div className="p-4 bg-gray-50 rounded-lg border-2 border-primary-600">
                    <p className="text-sm font-medium text-gray-800">{selectedUser.name}</p>
                    <p className="text-sm text-primary-600">{selectedUser.email || selectedUser.phoneNumber}</p>
                    <Badge className="mt-2 bg-[#006699] text-white">
                      {selectedUser.role}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Role Selection */}
          {selectedUserId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-gray-800">Select Role for Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="role-select">Role (applies to all selected properties)</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger id="role-select" data-testid="select-role">
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
              </CardContent>
            </Card>
          )}

          {/* Available Properties */}
          {selectedUserId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Select Properties to Assign
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Property Search */}
                <div className="mb-4">
                  <Label htmlFor="property-search">Search Properties</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="property-search"
                      placeholder="Search by name, type, city, or address..."
                      value={propertySearchTerm}
                      onChange={(e) => setPropertySearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-properties"
                    />
                  </div>
                  {propertySearchTerm && (
                    <p className="text-xs text-primary-600 mt-1">
                      {getAvailableProperties().length} {getAvailableProperties().length === 1 ? 'property' : 'properties'} found
                    </p>
                  )}
                </div>

                {getAvailableProperties().length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {getAvailableProperties().map((property) => (
                      <div
                        key={property.id}
                        onClick={() => togglePropertySelection(property.id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedPropertyIds.includes(property.id)
                            ? 'border-primary-600 bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        data-testid={`property-card-${property.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedPropertyIds.includes(property.id)}
                            onCheckedChange={() => togglePropertySelection(property.id)}
                            data-testid={`checkbox-property-${property.id}`}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{property.name}</p>
                            <p className="text-sm text-primary-600">{property.type} • {property.city}</p>
                            {property.address && (
                              <p className="text-xs text-gray-500 mt-1">{property.address}</p>
                            )}
                          </div>
                          {selectedPropertyIds.includes(property.id) && (
                            <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic py-4 text-center">
                    {propertySearchTerm 
                      ? "No properties match your search" 
                      : selectedUserId 
                        ? "All properties are already assigned to this user" 
                        : "Select a user first"}
                  </p>
                )}

                {selectedPropertyIds.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-[#006699] mb-3">
                      {selectedPropertyIds.length} {selectedPropertyIds.length === 1 ? 'property' : 'properties'} selected
                    </p>
                    <Button
                      onClick={handleAssignProperties}
                      disabled={assignPropertiesMutation.isPending}
                      className="w-full bg-[#006699] hover:bg-[#002a66]"
                      data-testid="button-assign-properties"
                    >
                      {assignPropertiesMutation.isPending 
                        ? "Assigning..." 
                        : `Assign ${selectedPropertyIds.length} ${selectedPropertyIds.length === 1 ? 'Property' : 'Properties'} as ${selectedRole}`}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Currently Assigned Properties */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Currently Assigned Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Role Filter */}
              {selectedUserId && (
                <div className="mb-4">
                  <Label htmlFor="role-filter">Filter by Role</Label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger id="role-filter" data-testid="select-role-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  {roleFilter !== "all" && getAssignedProperties().length > 0 && (
                    <p className="text-xs text-primary-600 mt-1">
                      Showing {getAssignedProperties().length} {getAssignedProperties().length === 1 ? 'property' : 'properties'} with "{roleFilter}" role
                    </p>
                  )}
                </div>
              )}

              {selectedUserId ? (
                getAssignedProperties().length > 0 ? (
                  <div className="space-y-3">
                    {getAssignedProperties().map(({ access, property }) => (
                      <div
                        key={access.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-primary-600" />
                          <div>
                            <p className="font-medium text-gray-900">{property?.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm text-primary-600">{property?.type}</p>
                              <span className="text-gray-400">•</span>
                              <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                                {access.role}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveProperty(access.id)}
                          disabled={removePropertyMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          data-testid={`button-remove-access-${access.id}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic py-8 text-center">
                    No properties assigned yet
                  </p>
                )
              ) : (
                <p className="text-sm text-gray-500 italic py-8 text-center">
                  Select a user to view their assigned properties
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
