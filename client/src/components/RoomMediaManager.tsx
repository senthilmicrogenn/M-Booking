import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Edit, Trash2, Hotel, Upload, FileImage, FileVideo, Image, Video } from "lucide-react";
import { insertRoomPhotoSchema, type RoomPhoto } from "@shared/schema";
import { z } from "zod";

const roomMediaFormSchema = insertRoomPhotoSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  photoPath: true, // Will be generated from URL
}).extend({
  mediaFiles: z.array(z.string()).optional(),
});

const PHOTO_GROUPS = [
  { value: "bedroom", label: "Bedroom", description: "Main sleeping area with bed and furniture" },
  { value: "washroom", label: "Washroom", description: "Bathroom with shower, toilet, and amenities" },
  { value: "restroom", label: "Restroom", description: "Additional toilet facilities" },
  { value: "living_area", label: "Living Area", description: "Seating and entertainment space" },
  { value: "balcony", label: "Balcony", description: "Outdoor terrace or balcony area" },
  { value: "kitchen", label: "Kitchen", description: "Cooking and dining facilities" },
  { value: "view", label: "Room View", description: "Outside view from windows" }
];

interface RoomMediaManagerProps {
  roomTypeId: number;
  roomTypeName: string;
}

export function RoomMediaManager({ roomTypeId, roomTypeName }: RoomMediaManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<RoomPhoto | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof roomMediaFormSchema>>({
    resolver: zodResolver(roomMediaFormSchema),
    defaultValues: {
      roomTypeId,
      photoGroup: "bedroom",
      photoName: "",
      photoUrl: "",
      mediaType: "photo",
      originalResolution: "",
      compressedResolution: "",
      resolutionPercentage: 100,
      originalFileSize: 0,
      mimeType: "",
      thumbnailUrl: "",
      duration: 0,
      isCompressed: false,
      isMainPhoto: false,
      displayOrder: 1,
      altText: "",
      uploadedBy: "admin",
      isActive: true,
    }
  });

  // Fetch room photos and videos
  const { data: roomMedia = [], isLoading } = useQuery<RoomPhoto[]>({
    queryKey: ["/api/room-photos", roomTypeId],
    queryFn: async () => {
      const response = await fetch(`/api/room-photos?roomTypeId=${roomTypeId}`);
      if (!response.ok) throw new Error('Failed to fetch room media');
      return response.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof roomMediaFormSchema>) => {
      const response = await fetch("/api/room-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create room media');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/room-photos"] });
      toast({ title: "Room media added successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to add room media", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<z.infer<typeof roomMediaFormSchema>>) => {
      const response = await fetch(`/api/room-photos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update room media');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/room-photos"] });
      toast({ title: "Room media updated successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to update room media", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/room-photos/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error('Failed to delete room media');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/room-photos"] });
      toast({ title: "Room media deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete room media", variant: "destructive" });
    }
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const file = files[0]; // Upload one file at a time
      
      // Get upload URL
      const response = await fetch("/api/room-photos/upload", {
        method: "POST",
      });
      const { uploadURL } = await response.json();

      // Upload file
      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload ${file.name}`);
      }

      // Determine media type and get file info
      const mediaType = file.type.startsWith('image/') ? 'photo' : 'video';
      const fileName = file.name.replace(/\.[^/.]+$/, "");

      // Get video duration if it's a video
      let duration = 0;
      if (mediaType === 'video') {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        await new Promise((resolve) => {
          video.onloadedmetadata = () => {
            duration = Math.round(video.duration);
            URL.revokeObjectURL(video.src);
            resolve(null);
          };
        });
      }

      // Get image dimensions if it's an image
      let resolution = "1920x1080";
      if (mediaType === 'photo') {
        const ImageConstructor = globalThis.Image || window.Image;
        const img = new ImageConstructor();
        img.src = URL.createObjectURL(file);
        await new Promise((resolve) => {
          img.onload = () => {
            resolution = `${img.naturalWidth}x${img.naturalHeight}`;
            URL.revokeObjectURL(img.src);
            resolve(null);
          };
        });
      }

      // Pre-fill form with uploaded file info
      form.setValue("photoUrl", uploadURL);
      form.setValue("photoPath", uploadURL);
      form.setValue("photoName", fileName);
      form.setValue("mediaType", mediaType);
      form.setValue("mimeType", file.type);
      form.setValue("originalFileSize", file.size);
      form.setValue("originalResolution", resolution);
      form.setValue("compressedResolution", resolution);
      if (duration > 0) {
        form.setValue("duration", duration);
      }

      toast({
        title: "Upload successful",
        description: `${file.name} uploaded successfully. Please fill in the details and save.`,
      });

    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onSubmit = (data: z.infer<typeof roomMediaFormSchema>) => {
    if (editingMedia) {
      updateMutation.mutate({ id: editingMedia.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (media: RoomPhoto) => {
    setEditingMedia(media);
    form.reset({
      ...media,
      roomTypeId: media.roomTypeId,
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingMedia(null);
    form.reset({
      roomTypeId,
      photoGroup: "bedroom",
      photoName: "",
      photoUrl: "",
      mediaType: "photo",
      originalResolution: "",
      compressedResolution: "",
      resolutionPercentage: 100,
      originalFileSize: 0,
      mimeType: "",
      thumbnailUrl: "",
      duration: 0,
      isCompressed: false,
      isMainPhoto: false,
      displayOrder: 1,
      altText: "",
      uploadedBy: "admin",
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div>Loading room media...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Hotel className="h-5 w-5" />
              {roomTypeName} - Photos & Videos
            </CardTitle>
            <Button 
              onClick={handleAdd}
              className="bg-[hsl(213_94%_25%)] hover:bg-[hsl(213_94%_20%)]"
              data-testid={`add-room-media-${roomTypeId}`}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Photo/Video
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Resolution</TableHead>
                  <TableHead>File Size</TableHead>
                  <TableHead>Main</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roomMedia.map((media) => (
                  <TableRow key={media.id}>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {media.mediaType === 'video' ? (
                          <>
                            <FileVideo className="w-3 h-3" />
                            Video
                          </>
                        ) : (
                          <>
                            <FileImage className="w-3 h-3" />
                            Photo
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {media.photoGroup.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{media.photoName}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {media.originalResolution || 'N/A'}
                      {media.duration && media.duration > 0 && (
                        <div className="text-xs text-blue-600">
                          Duration: {media.duration}s
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {media.originalFileSize ? 
                        `${(media.originalFileSize / 1024 / 1024).toFixed(1)} MB` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {media.isMainPhoto && (
                        <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                          Main
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={media.isActive ? "default" : "secondary"}
                        className={media.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                      >
                        {media.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(media)}
                          data-testid={`edit-room-media-${media.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(media.id)}
                          data-testid={`delete-room-media-${media.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {roomMedia.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                      No photos or videos added yet. Click "Add Photo/Video" to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMedia ? "Edit Room Media" : "Add Room Photo/Video"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* File Upload Section */}
              <div className="space-y-2">
                <Label>Upload File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                    data-testid="room-media-file-input"
                  />
                  <Button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={isUploading}
                    data-testid="upload-room-media-button"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Photo/Video
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Supports: Images (JPG, PNG, GIF, WebP) and Videos (MP4, WebM, AVI, MOV). Max file size: 50MB
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="photoName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Media Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter media name" {...field} data-testid="media-name-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="photoGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Area</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="media-group-select">
                            <SelectValue placeholder="Select room area" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PHOTO_GROUPS.map((group) => (
                            <SelectItem key={group.value} value={group.value}>
                              {group.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="mediaType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Media Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="media-type-select">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="photo">Photo</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
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
                          <SelectTrigger data-testid="media-status-select">
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="1" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          data-testid="media-order-input" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isMainPhoto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Set as Main</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value === "true")} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger data-testid="media-main-select">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="false">No</SelectItem>
                          <SelectItem value="true">Yes (Main Photo/Video)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="altText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alt Text (for accessibility)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Brief description of the image/video content" 
                        {...field} 
                        data-testid="media-alt-text-input" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                  data-testid="save-room-media-button"
                >
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : 
                   editingMedia ? "Update" : "Add Media"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}