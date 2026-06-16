import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart, FileImage, Zap, HardDrive, Gauge, TrendingDown, Database, PieChart, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface CompressionStats {
  totalPhotos: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
  averageCompressionRatio: number;
  storageSpace: number;
  photoGroups: { [key: string]: number };
}

interface CompressionAnalyticsProps {
  roomTypeId: number;
  roomTypeName: string;
}

export function CompressionAnalytics({ roomTypeId, roomTypeName }: CompressionAnalyticsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: stats, isLoading, refetch } = useQuery<CompressionStats>({
    queryKey: ["/api/room-photos/stats", roomTypeId],
    queryFn: () => fetch(`/api/room-photos/stats/${roomTypeId}`).then(res => res.json()),
    enabled: isOpen
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getEfficiencyLevel = (compressionPercentage: number): {
    level: 'excellent' | 'good' | 'fair' | 'poor';
    color: string;
    description: string;
  } => {
    if (compressionPercentage >= 60) {
      return { level: 'excellent', color: 'bg-green-100 text-green-800', description: 'Optimal compression' };
    } else if (compressionPercentage >= 40) {
      return { level: 'good', color: 'bg-blue-100 text-blue-800', description: 'Good compression' };
    } else if (compressionPercentage >= 20) {
      return { level: 'fair', color: 'bg-yellow-100 text-yellow-800', description: 'Fair compression' };
    } else {
      return { level: 'poor', color: 'bg-red-100 text-red-800', description: 'Needs optimization' };
    }
  };

  if (!stats && !isLoading) return null;

  const compressionPercentage = stats ? Math.round((1 - stats.averageCompressionRatio) * 100) : 0;
  const efficiency = getEfficiencyLevel(compressionPercentage);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BarChart className="h-4 w-4" />
          Compression Analytics
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Photo Compression Analytics - {roomTypeName}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileImage className="h-4 w-4" />
                    Total Photos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPhotos}</div>
                  <p className="text-xs text-muted-foreground">
                    Across {Object.keys(stats.photoGroups).length} photo groups
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    Storage Saved
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatFileSize(stats.storageSpace)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {compressionPercentage}% reduction
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Efficiency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={efficiency.color}>
                    {efficiency.level.toUpperCase()}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {efficiency.description}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Compression Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5" />
                  Compression Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Original Size:</span>
                      <span className="font-medium">{formatFileSize(stats.totalOriginalSize)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Compressed Size:</span>
                      <span className="font-medium text-green-600">{formatFileSize(stats.totalCompressedSize)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>Space Saved:</span>
                      <span className="text-green-600">{formatFileSize(stats.storageSpace)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Compression Ratio:</span>
                      <span className="font-medium">{stats.averageCompressionRatio.toFixed(3)}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Compression Efficiency</span>
                        <span>{compressionPercentage}%</span>
                      </div>
                      <Progress value={compressionPercentage} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Photo Groups Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Photo Distribution by Groups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(stats.photoGroups).map(([group, count]) => (
                    <div key={group} className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">{count}</div>
                      <div className="text-sm text-gray-600 capitalize">
                        {group.replace('_', ' ')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Benefits and Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Optimization Benefits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-700">✓ Storage Benefits</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Reduced server storage costs</li>
                      <li>• Faster backup and sync operations</li>
                      <li>• Lower bandwidth usage</li>
                      <li>• Improved system performance</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-700">⚡ Performance Benefits</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Faster page load times</li>
                      <li>• Reduced memory usage</li>
                      <li>• Better mobile experience</li>
                      <li>• Enhanced SEO performance</li>
                    </ul>
                  </div>
                </div>

                {compressionPercentage < 40 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <h4 className="font-medium text-yellow-800 mb-2">💡 Optimization Recommendations</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Consider re-uploading photos with higher compression settings</li>
                      <li>• Use JPEG format for photos instead of PNG when possible</li>
                      <li>• Optimize image dimensions before upload</li>
                      <li>• Enable automatic compression for future uploads</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Technical Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Technical Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Compression Algorithm:</span>
                    <p className="text-gray-600">Smart JPEG with quality optimization</p>
                  </div>
                  <div>
                    <span className="font-medium">Resolution Optimization:</span>
                    <p className="text-gray-600">Adaptive sizing based on content</p>
                  </div>
                  <div>
                    <span className="font-medium">Quality Preservation:</span>
                    <p className="text-gray-600">80%+ resolution maintained</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No compression data available for this room type.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}