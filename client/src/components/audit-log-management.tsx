import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Eye, AlertCircle, Info, AlertTriangle, XCircle, Activity, User, Table, Clock, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { AuditLog, User as UserType, Property } from "@shared/schema";

export default function AuditLogManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTable, setFilterTable] = useState<string>("all");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Fetch audit logs with filters
  const { data: auditLogs = [], isLoading: isAuditLoading } = useQuery<AuditLog[]>({
    queryKey: ['/api/audit-logs', {
      tableName: filterTable !== "all" ? filterTable : undefined,
      action: filterAction !== "all" ? filterAction : undefined,
      severity: filterSeverity !== "all" ? filterSeverity : undefined,
      userId: filterUser !== "all" ? parseInt(filterUser) : undefined,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString()
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterTable !== "all") params.append("tableName", filterTable);
      if (filterAction !== "all") params.append("action", filterAction);
      if (filterSeverity !== "all") params.append("severity", filterSeverity);
      if (filterUser !== "all") params.append("userId", filterUser);
      if (startDate) params.append("startDate", startDate.toISOString());
      if (endDate) params.append("endDate", endDate.toISOString());
      
      const response = await fetch(`/api/audit-logs?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      return response.json();
    }
  });

  // Fetch users for filter dropdown
  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  // Filter logs based on search query
  const filteredLogs = auditLogs.filter(log => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      log.tableName.toLowerCase().includes(searchLower) ||
      log.action.toLowerCase().includes(searchLower) ||
      log.description?.toLowerCase().includes(searchLower) ||
      log.userEmail?.toLowerCase().includes(searchLower) ||
      log.userName?.toLowerCase().includes(searchLower)
    );
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return <XCircle className="w-4 h-4 text-red-500" />;
      case "error": return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "info": return <Info className="w-4 h-4 text-blue-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "error": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "warning": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "info": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "CREATE": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "UPDATE": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "DELETE": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "LOGIN": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "LOGOUT": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterTable("all");
    setFilterAction("all");
    setFilterSeverity("all");
    setFilterUser("all");
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const formatJsonValue = (value: any) => {
    if (value === null || value === undefined) return "null";
    if (typeof value === "string") return `"${value}"`;
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
  };

  const tables = [
    "user_property_access",
    "rate_master",
    "properties",
    "bookings",
    "users",
    "currencies",
    "general_ledger_master",
    "subledger_master",
    "tariff_setup_master"
  ];

  const actions = ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT"];
  const severityLevels = ["info", "warning", "error", "critical"];

  if (isAuditLoading) {
    return <div className="p-6">Loading audit logs...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">System Audit Logs</h1>
          <p className="text-gray-600 dark:text-gray-400">Track all system changes and user activities</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={clearFilters} data-testid="button-clear-filters">
            <Filter className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="col-span-2">
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
                className="w-full"
              />
            </div>
            
            <Select value={filterTable} onValueChange={setFilterTable}>
              <SelectTrigger data-testid="select-filter-table">
                <SelectValue placeholder="Table" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tables</SelectItem>
                {tables.map((table) => (
                  <SelectItem key={table} value={table}>
                    {table.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger data-testid="select-filter-action">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger data-testid="select-filter-severity">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                {severityLevels.map((severity) => (
                  <SelectItem key={severity} value={severity}>
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger data-testid="select-filter-user">
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                  data-testid="button-start-date"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                  data-testid="button-end-date"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Total Events</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="text-total-events">
                  {filteredLogs.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Critical/Errors</p>
                <p className="text-2xl font-bold text-red-600" data-testid="text-critical-errors">
                  {filteredLogs.filter(log => ["critical", "error"].includes(log.severity || "info")).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Unique Users</p>
                <p className="text-2xl font-bold text-green-600" data-testid="text-unique-users">
                  {new Set(filteredLogs.map(log => log.userId).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Table className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Tables Modified</p>
                <p className="text-2xl font-bold text-purple-600" data-testid="text-tables-modified">
                  {new Set(filteredLogs.map(log => log.tableName)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Logs Table */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  No audit logs found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery || filterTable !== "all" || filterAction !== "all" || filterSeverity !== "all" || filterUser !== "all"
                    ? "No logs match your current filters."
                    : "System audit logs will appear here as users make changes."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map((log) => (
            <Card key={log.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {getSeverityIcon(log.severity || "info")}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getActionBadgeColor(log.action)}>
                          {log.action}
                        </Badge>
                        <Badge variant="outline">
                          <Table className="w-3 h-3 mr-1" />
                          {log.tableName.replace("_", " ")}
                        </Badge>
                        <Badge className={getSeverityBadgeColor(log.severity || "info")}>
                          {log.severity}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-900 dark:text-gray-100 mb-1">
                        {log.description || `${log.action} operation on ${log.tableName}`}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{log.userName || log.userEmail || `User ${log.userId}` || "System"}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{format(new Date(log.createdAt), "PPp")}</span>
                        </div>
                        {log.changedFields && log.changedFields.length > 0 && (
                          <div>
                            <span>Fields: {log.changedFields.join(", ")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        data-testid={`button-view-log-${log.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>Audit Log Details</DialogTitle>
                        <DialogDescription>
                          Detailed information about this system event
                        </DialogDescription>
                      </DialogHeader>
                      
                      <ScrollArea className="h-[60vh]">
                        <div className="space-y-6">
                          {/* Basic Info */}
                          <div>
                            <h4 className="font-medium mb-3">Event Information</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Action:</span> {log.action}
                              </div>
                              <div>
                                <span className="font-medium">Table:</span> {log.tableName}
                              </div>
                              <div>
                                <span className="font-medium">Record ID:</span> {log.recordId}
                              </div>
                              <div>
                                <span className="font-medium">Severity:</span> {log.severity}
                              </div>
                              <div>
                                <span className="font-medium">Timestamp:</span> {format(new Date(log.createdAt), "PPpp")}
                              </div>
                              <div>
                                <span className="font-medium">User:</span> {log.userName || log.userEmail || "System"}
                              </div>
                            </div>
                          </div>

                          {/* Changed Fields */}
                          {log.changedFields && log.changedFields.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-3">Changed Fields</h4>
                              <div className="flex flex-wrap gap-2">
                                {log.changedFields.map((field, index) => (
                                  <Badge key={index} variant="outline">{field}</Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Data Changes */}
                          {(log.oldValues || log.newValues) && (
                            <div>
                              <Tabs defaultValue="changes" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                  <TabsTrigger value="changes">Changes</TabsTrigger>
                                  <TabsTrigger value="old">Old Values</TabsTrigger>
                                  <TabsTrigger value="new">New Values</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="changes" className="space-y-2">
                                  {log.changedFields?.map((field) => (
                                    <div key={field} className="border rounded p-3">
                                      <div className="font-medium mb-2">{field}</div>
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <div className="text-red-600 font-medium">Old:</div>
                                          <pre className="whitespace-pre-wrap bg-red-50 dark:bg-red-950 p-2 rounded">
                                            {formatJsonValue(log.oldValues?.[field])}
                                          </pre>
                                        </div>
                                        <div>
                                          <div className="text-green-600 font-medium">New:</div>
                                          <pre className="whitespace-pre-wrap bg-green-50 dark:bg-green-950 p-2 rounded">
                                            {formatJsonValue(log.newValues?.[field])}
                                          </pre>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </TabsContent>
                                
                                <TabsContent value="old" className="space-y-2">
                                  <pre className="whitespace-pre-wrap bg-gray-50 dark:bg-gray-950 p-4 rounded text-sm">
                                    {JSON.stringify(log.oldValues, null, 2)}
                                  </pre>
                                </TabsContent>
                                
                                <TabsContent value="new" className="space-y-2">
                                  <pre className="whitespace-pre-wrap bg-gray-50 dark:bg-gray-950 p-4 rounded text-sm">
                                    {JSON.stringify(log.newValues, null, 2)}
                                  </pre>
                                </TabsContent>
                              </Tabs>
                            </div>
                          )}

                          {/* Additional Metadata */}
                          {(log.metadata || log.ipAddress || log.userAgent) && (
                            <div>
                              <h4 className="font-medium mb-3">Additional Information</h4>
                              <div className="space-y-2 text-sm">
                                {log.ipAddress && (
                                  <div>
                                    <span className="font-medium">IP Address:</span> {log.ipAddress}
                                  </div>
                                )}
                                {log.userAgent && (
                                  <div>
                                    <span className="font-medium">User Agent:</span> {log.userAgent}
                                  </div>
                                )}
                                {log.sessionId && (
                                  <div>
                                    <span className="font-medium">Session ID:</span> {log.sessionId}
                                  </div>
                                )}
                                {log.metadata && (
                                  <div>
                                    <span className="font-medium">Metadata:</span>
                                    <pre className="whitespace-pre-wrap bg-gray-50 dark:bg-gray-950 p-2 rounded mt-1">
                                      {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}