import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Image, Video, Upload, FileImage, FileVideo } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AmenityMediaUploaderProps {
  existingPictures?: string[];
  existingVideos?: string[];
  onPicturesChange?: (pictures: string[]) => void;
  onVideosChange?: (videos: string[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
  buttonClassName?: string;
}

/**
 * A media uploader component specifically for amenity pictures and videos.
 * 
 * Features:
 * - Upload pictures (jpg, png, gif, webp)
 * - Upload videos (mp4, webm, avi, mov)
 * - Manage existing media files
 * - Remove individual media files
 * - Progress tracking
 */
export function AmenityMediaUploader({
  existingPictures = [],
  existingVideos = [],
  onPicturesChange,
  onVideosChange,
  maxFiles = 10,
  maxFileSize = 52428800, // 50MB default
  buttonClassName,
}: AmenityMediaUploaderProps) {
  const [pictures, setPictures] = useState<string[]>(existingPictures);
  const [videos, setVideos] = useState<string[]>(existingVideos);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Get upload URL
        const response = await fetch("/api/amenity-media/upload", {
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

        return {
          url: uploadURL,
          type: file.type,
          name: file.name
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      // Categorize uploads
      const newPictures = [...pictures];
      const newVideos = [...videos];

      uploadedFiles.forEach(({ url, type }) => {
        if (type.startsWith('image/')) {
          newPictures.push(url);
        } else if (type.startsWith('video/')) {
          newVideos.push(url);
        }
      });

      setPictures(newPictures);
      setVideos(newVideos);
      onPicturesChange?.(newPictures);
      onVideosChange?.(newVideos);

      toast({
        title: "Upload successful",
        description: `${uploadedFiles.length} file(s) uploaded successfully.`,
      });

    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload files",
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

  const removePicture = (pictureToRemove: string) => {
    const newPictures = pictures.filter(pic => pic !== pictureToRemove);
    setPictures(newPictures);
    onPicturesChange?.(newPictures);
  };

  const removeVideo = (videoToRemove: string) => {
    const newVideos = videos.filter(vid => vid !== videoToRemove);
    setVideos(newVideos);
    onVideosChange?.(newVideos);
  };

  const getFileName = (url: string) => {
    return url.split('/').pop()?.split('?')[0] || 'Unknown file';
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Media Files</Label>
        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
            data-testid="media-file-input"
          />
          <Button 
            type="button"
            onClick={() => fileInputRef.current?.click()} 
            className={buttonClassName}
            disabled={isUploading}
            data-testid="upload-media-button"
          >
            {isUploading ? (
              <>
                <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Pictures & Videos
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          Supports: Images (JPG, PNG, GIF, WebP) and Videos (MP4, WebM, AVI, MOV). Max file size: 50MB
        </p>
      </div>

      {/* Display existing pictures */}
      {pictures.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <FileImage className="w-4 h-4" />
            Pictures ({pictures.length})
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {pictures.map((picture, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded-md bg-gray-50">
                <Badge variant="secondary" className="flex-1 mr-2 text-xs truncate">
                  <Image className="w-3 h-3 mr-1" />
                  {getFileName(picture)}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePicture(picture)}
                  className="text-red-600 hover:text-red-800"
                  data-testid={`remove-picture-${index}`}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Display existing videos */}
      {videos.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <FileVideo className="w-4 h-4" />
            Videos ({videos.length})
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {videos.map((video, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded-md bg-gray-50">
                <Badge variant="secondary" className="flex-1 mr-2 text-xs truncate">
                  <Video className="w-3 h-3 mr-1" />
                  {getFileName(video)}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeVideo(video)}
                  className="text-red-600 hover:text-red-800"
                  data-testid={`remove-video-${index}`}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}