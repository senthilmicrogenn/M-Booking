import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Edit, Trash2, Hotel, Building, Image, Video } from "lucide-react";
import { insertPropertyAmenitySchema, type PropertyAmenity, type NewPropertyAmenity } from "@shared/schema";
import { z } from "zod";
import { AmenityMediaUploader } from "./AmenityMediaUploader";

const amenityFormSchema = insertPropertyAmenitySchema.extend({
  pictures: z.array(z.string()).optional(),
  videos: z.array(z.string()).optional(),
});

interface AmenityManagementProps {
  amenityType: "room_amenity" | "hotel_amenity";
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function AmenityManagement({ amenityType, title, icon: IconComponent }: AmenityManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<PropertyAmenity | null>(null);

  const form = useForm<z.infer<typeof amenityFormSchema>>({
    resolver: zodResolver(amenityFormSchema),
    defaultValues: {
      amenityType,
      amenityName: "",
      description: "",
      icon: "",
      category: "",
      pictures: [],
      videos: [],
      isActive: true,
    }
  });

  // Fetch amenities
  const { data: amenities = [], isLoading } = useQuery<PropertyAmenity[]>({
    queryKey: ["/api/property-amenities"],
    queryFn: async () => {
      const response = await fetch("/api/property-amenities");
      if (!response.ok) throw new Error('Failed to fetch amenities');
      return response.json();
    },
    select: (data) => data.filter(amenity => amenity.amenityType === amenityType)
  });

  const createMutation = useMutation({
    mutationFn: async (data: NewPropertyAmenity) => {
      const response = await fetch("/api/property-amenities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create amenity');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/property-amenities"] });
      toast({ title: "Amenity created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create amenity", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<NewPropertyAmenity>) => {
      const response = await fetch(`/api/property-amenities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update amenity');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/property-amenities"] });
      toast({ title: "Amenity updated successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to update amenity", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/property-amenities/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error('Failed to delete amenity');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/property-amenities"] });
      toast({ title: "Amenity deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete amenity", variant: "destructive" });
    }
  });

  const onSubmit = (data: z.infer<typeof amenityFormSchema>) => {
    if (editingAmenity) {
      updateMutation.mutate({ id: editingAmenity.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (amenity: PropertyAmenity) => {
    setEditingAmenity(amenity);
    form.reset({
      ...amenity,
      pictures: amenity.pictures || [],
      videos: amenity.videos || [],
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingAmenity(null);
    form.reset({
      amenityType,
      amenityName: "",
      description: "",
      icon: "",
      category: "",
      pictures: [],
      videos: [],
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <IconComponent className="h-5 w-5" />
              {title}
            </CardTitle>
            <Button 
              onClick={handleAdd}
              className="bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)]"
              data-testid={`add-${amenityType}`}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add {title}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Icon</TableHead>
                  <TableHead>Amenity Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Media</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {amenities.map((amenity) => (
                  <TableRow key={amenity.id}>
                    <TableCell className="text-lg">{amenity.icon}</TableCell>
                    <TableCell className="font-medium">{amenity.amenityName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {amenity.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {amenity.description || "No description"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {amenity.pictures && amenity.pictures.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <Image className="w-3 h-3 mr-1" />
                            {amenity.pictures.length} pics
                          </Badge>
                        )}
                        {amenity.videos && amenity.videos.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <Video className="w-3 h-3 mr-1" />
                            {amenity.videos.length} vids
                          </Badge>
                        )}
                        {(!amenity.pictures || amenity.pictures.length === 0) && 
                         (!amenity.videos || amenity.videos.length === 0) && (
                          <span className="text-gray-400 text-xs">No media</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={amenity.isActive ? "default" : "secondary"}
                        className={amenity.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                      >
                        {amenity.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(amenity)}
                          data-testid={`edit-${amenityType}-${amenity.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(amenity.id)}
                          data-testid={`delete-${amenityType}-${amenity.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAmenity ? `Edit ${title}` : `Add ${title}`}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amenityName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amenity Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter amenity name" {...field} data-testid="amenity-name-input" />
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
                      <FormLabel>Icon (Emoji or Class)</FormLabel>
                      <FormControl>
                        <Input placeholder="🏊‍♂️ or icon-class" {...field} data-testid="amenity-icon-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="amenity-category-select">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="comfort">Comfort</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="safety">Safety</SelectItem>
                          <SelectItem value="recreation">Recreation</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="food">Food & Beverage</SelectItem>
                          <SelectItem value="wellness">Wellness</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value === "true")} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger data-testid="amenity-status-select">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
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
                        placeholder="Enter amenity description" 
                        {...field} 
                        data-testid="amenity-description-textarea"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Media Upload Section */}
              <div className="space-y-4">
                <Label>Pictures & Videos</Label>
                <AmenityMediaUploader
                  existingPictures={form.watch("pictures")}
                  existingVideos={form.watch("videos")}
                  onPicturesChange={(pictures) => form.setValue("pictures", pictures)}
                  onVideosChange={(videos) => form.setValue("videos", videos)}
                />
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)]"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="save-amenity-button"
                >
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : 
                   editingAmenity ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}