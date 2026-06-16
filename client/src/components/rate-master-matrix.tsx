import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, eachDayOfInterval, parse } from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  Building2, 
  Save, 
  DollarSign,
  Bed,
  CalendarDays,
  RefreshCw,
  Check,
  X,
  Edit3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import type { Property, RoomType, RateMaster, NewRateMaster, CurrencyMaster } from '@shared/schema';

interface RateCell {
  roomTypeId: number;
  date: string;
  currentRate: RateMaster | null;
  existingRate: string; // Read-only existing rate
  newRate: string; // Editable new rate
  isEditing: boolean;
}

interface MatrixRow {
  roomType: RoomType;
  cells: RateCell[];
}

export default function RateMasterMatrix() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(addDays(new Date(), 14), 'yyyy-MM-dd'));
  const [startDateObj, setStartDateObj] = useState<Date | undefined>(new Date());
  const [endDateObj, setEndDateObj] = useState<Date | undefined>(addDays(new Date(), 14));
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [matrixData, setMatrixData] = useState<MatrixRow[]>([]);
  const [editingCell, setEditingCell] = useState<{roomTypeId: number, date: string} | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [applyingBulkRate, setApplyingBulkRate] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [skipDays, setSkipDays] = useState<string[]>([]);
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<number[]>([]);
  const [roomTypeFilter, setRoomTypeFilter] = useState<'all' | 'specific'>('all');
  
  // Bulk edit states
  const [pendingRateChanges, setPendingRateChanges] = useState<Map<string, { roomTypeId: number; date: string; rate: string }>>(new Map());
  const [bulkEditMode, setBulkEditMode] = useState<boolean>(true);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [bulkEditRate, setBulkEditRate] = useState<string>('');

  // Fetch properties
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });

  // Fetch room types for selected property
  const { data: roomTypes = [] } = useQuery<RoomType[]>({
    queryKey: ['/api/room-types'],
    enabled: !!selectedPropertyId
  });

  // Fetch currencies
  const { data: currencies = [] } = useQuery<CurrencyMaster[]>({
    queryKey: ['/api/currencies']
  });

  // Fetch rates for property and date range
  const { data: rates = [], isLoading: ratesLoading, refetch: refetchRates } = useQuery<RateMaster[]>({
    queryKey: ['/api/rates', 'matrix', selectedPropertyId, startDate, endDate],
    queryFn: async () => {
      if (!selectedPropertyId) return [];
      // Add cache busting parameter to force fresh data
      const response = await fetch(`/api/rates?propertyId=${selectedPropertyId}&startDate=${startDate}&endDate=${endDate}&t=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-cache' // Disable caching
      });
      if (!response.ok) throw new Error('Failed to fetch rates');
      return response.json();
    },
    enabled: !!selectedPropertyId,
    staleTime: 0, // Always consider data stale
    gcTime: 0  // Don't cache the results
  });

  // Generate date range for the matrix
  const dateRange = eachDayOfInterval({
    start: parse(startDate, 'yyyy-MM-dd', new Date()),
    end: parse(endDate, 'yyyy-MM-dd', new Date())
  });

  // Bulk rate update mutation (following room inventory pattern)
  const bulkRateUpdateMutation = useMutation({
    mutationFn: async (rateUpdates: { propertyId: number; roomTypeId: number; date: string; rate: string }[]) => {
      console.log('=== BULK RATE UPDATE ===');
      console.log(JSON.stringify(rateUpdates, null, 2));
      
      const response = await fetch('/api/rates/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rateUpdates }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('=== BULK UPDATE ERROR ===');
        console.error(JSON.stringify(errorData, null, 2));
        throw new Error(`Failed to update rates: ${JSON.stringify(errorData)}`);
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate rate queries (same as room inventory)
      queryClient.invalidateQueries({ queryKey: ['/api/rates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/room-types'] });
      
      toast({ title: "Success", description: "Rates updated successfully" });
      setPendingRateChanges(new Map()); // Clear pending changes
    },
    onError: (error: any) => {
      console.error('Bulk rate update failed:', error);
      toast({ 
        title: "Error", 
        description: "Failed to update rates",
        variant: "destructive" 
      });
    }
  });

  // Create rate mutation
  const createRateMutation = useMutation({
    mutationFn: async (rateData: NewRateMaster) => {
      console.log('Frontend: Creating new rate with:', rateData);
      const response = await fetch('/api/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rateData),
        credentials: 'include'
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Frontend: Rate creation failed:', response.status, errorText);
        throw new Error(`Failed to create rate: ${response.status} - ${errorText}`);
      }
      const result = await response.json();
      console.log('Frontend: Rate created successfully:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rates'] });
    },
    onError: (error: any) => {
      console.error('Create rate failed:', error);
    }
  });

  // Update rate mutation
  const updateRateMutation = useMutation({
    mutationFn: async ({ id, rateData }: { id: number; rateData: Partial<RateMaster> }) => {
      console.log(`Frontend: Updating rate ${id} with:`, rateData);
      const response = await fetch(`/api/rates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rateData),
        credentials: 'include'
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Frontend: Rate update failed:`, response.status, errorText);
        throw new Error(`Failed to update rate: ${response.status} - ${errorText}`);
      }
      const result = await response.json();
      console.log(`Frontend: Rate ${id} updated successfully:`, result);
      return result;
    },
    onSuccess: () => {
      // Always invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/rates'] });
      // Only show individual success messages during non-bulk operations
      if (!applyingBulkRate && !isUpdating) {
        toast({ title: 'Rate updated successfully' });
      }
    },
    onError: (error: any) => {
      if (!applyingBulkRate && !isUpdating) {
        toast({ 
          title: 'Failed to update rate', 
          description: error.message,
          variant: 'destructive' 
        });
      }
    }
  });

  // Build matrix data when rates or room types change
  useEffect(() => {
    if (!selectedPropertyId || roomTypes.length === 0) {
      setMatrixData([]);
      return;
    }

    // Store current newRate and editing states before rebuilding
    const currentNewRates = new Map<string, { newRate: string; isEditing: boolean }>();
    matrixData.forEach(row => {
      row.cells.forEach(cell => {
        const key = `${cell.roomTypeId}-${cell.date}`;
        if (cell.newRate || cell.isEditing) {
          currentNewRates.set(key, { newRate: cell.newRate, isEditing: cell.isEditing });
        }
      });
    });

    // Filter room types based on user selection
    const filteredRoomTypes = roomTypeFilter === 'all' 
      ? roomTypes 
      : roomTypes.filter(rt => selectedRoomTypes.includes(rt.id));

    const newMatrixData: MatrixRow[] = filteredRoomTypes.map(roomType => ({
      roomType,
      cells: dateRange.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        
        // Find most recent existing rate for this room type and date (in case of duplicates)
        const applicableRates = (rates as RateMaster[])
          .filter((rate: RateMaster) => 
            rate.roomTypeId === roomType.id &&
            dateStr >= rate.fromDate &&
            dateStr <= rate.toDate &&
            rate.isActive
          )
          .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
        
        const existingRate = applicableRates[0]; // Get the most recent rate

        // Restore preserved newRate and editing state
        const key = `${roomType.id}-${dateStr}`;
        const preserved = currentNewRates.get(key);

        return {
          roomTypeId: roomType.id,
          date: dateStr,
          currentRate: existingRate || null,
          existingRate: existingRate ? existingRate.doubleOccupancyRate?.toString() || '0' : '',
          newRate: preserved?.newRate || '', // Preserve existing newRate values
          isEditing: preserved?.isEditing || false
        };
      })
    }));

    setMatrixData(newMatrixData);
  }, [roomTypes, rates, dateRange, selectedPropertyId, roomTypeFilter, selectedRoomTypes]);

  // Helper functions following room inventory pattern
  const getRateForDate = (roomTypeId: number, date: string): string => {
    const key = `${roomTypeId}-${date}`;
    const pendingChange = pendingRateChanges.get(key);
    if (pendingChange) {
      return pendingChange.rate;
    }
    
    // Find most recent existing rate from server data (in case of duplicates)
    const applicableRates = (rates as RateMaster[])
      .filter((rate: RateMaster) => 
        rate.roomTypeId === roomTypeId &&
        rate.propertyId === selectedPropertyId &&
        date >= rate.fromDate &&
        date <= rate.toDate &&
        rate.isActive
      )
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
    
    const existingRate = applicableRates[0]; // Get the most recent rate
    
    return existingRate ? existingRate.singleOccupancyRate : '';
  };
  
  const updateRateForDate = (roomTypeId: number, date: string, rate: string) => {
    const key = `${roomTypeId}-${date}`;
    const newChanges = new Map(pendingRateChanges);
    
    if (rate && parseFloat(rate) > 0) {
      newChanges.set(key, { roomTypeId, date, rate });
    } else {
      newChanges.delete(key); // Remove if empty or zero
    }
    
    setPendingRateChanges(newChanges);
  };
  
  // Save all pending changes (following room inventory pattern)
  const saveAllChanges = async () => {
    if (pendingRateChanges.size === 0) {
      toast({
        title: 'No changes to save',
        description: 'Please make some changes before saving',
        variant: 'destructive'
      });
      return;
    }
    
    setIsUpdating(true);
    
    try {
      const rateUpdates = Array.from(pendingRateChanges.values()).map(change => ({
        propertyId: selectedPropertyId!,
        roomTypeId: change.roomTypeId,
        date: change.date,
        rate: change.rate
      }));
      
      console.log(`Saving ${rateUpdates.length} rate changes...`);
      await bulkRateUpdateMutation.mutateAsync(rateUpdates);
      
    } catch (error) {
      console.error('Failed to save rate changes:', error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Legacy helper functions (keeping for compatibility)
  const getCellKey = (roomTypeId: number, date: string) => `${roomTypeId}-${date}`;
  
  const getPendingEditValue = (roomTypeId: number, date: string) => {
    return getRateForDate(roomTypeId, date);
  };
  
  const setPendingEdit = (roomTypeId: number, date: string, value: string) => {
    updateRateForDate(roomTypeId, date, value);
  };
  
  const clearAllPendingEdits = () => {
    setPendingRateChanges(new Map());
    setSelectedCells(new Set());
    setBulkEditRate('');
  };
  
  // Helper function to normalize day name from date - prevents duplication and ensures consistency
  const normalizeDayName = (date: Date): string => {
    const today = new Date();
    const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const targetTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const daysDifference = Math.round((targetTime - todayTime) / (24 * 60 * 60 * 1000));
    const todayDayIndex = today.getDay();
    const dayIndex = (todayDayIndex + daysDifference) % 7;
    const normalizedDayIndex = dayIndex < 0 ? dayIndex + 7 : dayIndex;
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return dayNames[normalizedDayIndex];
  };
  
  // Check if we have any pending changes - show apply button when any amount > 0 is typed
  const hasAnyPendingChanges = () => {
    // Check Map-based pending changes (individual cell edits when bulk mode OFF)
    const hasPendingChanges = pendingRateChanges.size > 0;
    
    // Bulk rate entered > 0 ONLY when bulk update mode is ON
    const hasBulkAmount = bulkEditMode && bulkEditRate && parseFloat(bulkEditRate) > 0;
    
    // New rates in matrix > 0 (individual cell edits when bulk mode OFF)
    const hasNewRatesInMatrix = !bulkEditMode && matrixData.some(row => 
      row.cells.some(cell => {
        const value = parseFloat(cell.newRate || '0');
        return !isNaN(value) && value > 0;
      })
    );
    
    return hasPendingChanges || hasBulkAmount || hasNewRatesInMatrix;
  };
  
  // Calculate how many cells will be affected by bulk update (for display)
  const getBulkUpdateCellCount = () => {
    if (!bulkEditRate) return 0;
    
    let count = 0;
    const filteredRoomTypes = roomTypeFilter === 'all' ? roomTypes : roomTypes.filter(rt => selectedRoomTypes.includes(rt.id));
    
    filteredRoomTypes.forEach(roomType => {
      dateRange.forEach(date => {
        const dayName = normalizeDayName(date);
        const isSkipped = skipDays.includes(dayName);
        
        if (!isSkipped) count++;
      });
    });
    
    return count;
  };
  
  const toggleCellSelection = (roomTypeId: number, date: string) => {
    const key = getCellKey(roomTypeId, date);
    setSelectedCells(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };
  
  const isCellSelected = (roomTypeId: number, date: string) => {
    const key = getCellKey(roomTypeId, date);
    return selectedCells.has(key);
  };
  
  const selectAllCellsForRoomTypes = () => {
    const filteredRoomTypes = roomTypeFilter === 'all' 
      ? roomTypes 
      : roomTypes.filter(rt => selectedRoomTypes.includes(rt.id));
      
    const newSelectedCells = new Set<string>();
    
    filteredRoomTypes.forEach(roomType => {
      // Use the common room type filter selection
      const shouldInclude = roomTypeFilter === 'all' || selectedRoomTypes.includes(roomType.id);
      if (shouldInclude) {
        dateRange.forEach(date => {
          const dateStr = format(date, 'yyyy-MM-dd');
          
          // Skip cells that are on skip days using normalized helper
          const dayName = normalizeDayName(date);
          const isSkipped = skipDays.includes(dayName);
          
          if (!isSkipped) {
            newSelectedCells.add(getCellKey(roomType.id, dateStr));
          }
        });
      }
    });
    
    setSelectedCells(newSelectedCells);
  };

  const handleCellEdit = (roomTypeId: number, date: string, value: string) => {
    // Always use pending edits for both bulk and single cell editing
    setPendingEdit(roomTypeId, date, value);
    
    // Also update matrix data for visual feedback
    setMatrixData(prev => prev.map(row => ({
      ...row,
      cells: row.cells.map(cell => 
        cell.roomTypeId === roomTypeId && cell.date === date
          ? { ...cell, newRate: value }
          : cell
      )
    })));
  };

  // Room inventory style bulk apply - automatic application to all non-skip days
  const applyBulkRates = async () => {
    console.log('=== BULK RATE APPLY STARTED (Room Inventory Style) ===');
    
    if (!selectedPropertyId || !bulkEditRate) {
      toast({
        title: 'Missing Information',
        description: 'Please select a property and enter a bulk rate',
        variant: 'destructive'
      });
      return;
    }

    const rateValue = parseFloat(bulkEditRate);
    if (isNaN(rateValue) || rateValue <= 0) {
      toast({
        title: 'Invalid Rate',
        description: 'Please enter a valid positive number for bulk rate',
        variant: 'destructive'
      });
      return;
    }

    setIsUpdating(true);
    setApplyingBulkRate(true);

    try {
      const rateUpdates: any[] = [];
      
      // Get filtered room types (same as room inventory logic)
      const filteredRoomTypes = roomTypeFilter === 'all' ? roomTypes : roomTypes.filter(rt => selectedRoomTypes.includes(rt.id));
      
      console.log(`Applying bulk rate ${rateValue} to ${filteredRoomTypes.length} room types across ${dateRange.length} dates`);
      
      // Process each room type and date combination (same as room inventory)
      filteredRoomTypes.forEach(roomType => {
        dateRange.forEach(currentDate => {
          // Use normalized day name helper to prevent duplication
          const dayName = normalizeDayName(currentDate);
          
          // Skip days that are in the skip list (same logic as room inventory)
          const isSkipped = skipDays.includes(dayName);
          if (isSkipped) {
            console.log(`Skipping ${dayName} ${format(currentDate, 'yyyy-MM-dd')} for room type ${roomType.id}`);
            return;
          }

          const dateStr = format(currentDate, 'yyyy-MM-dd');
          
          // Add to bulk update list
          rateUpdates.push({
            propertyId: selectedPropertyId,
            roomTypeId: roomType.id,
            date: dateStr,
            rate: rateValue.toFixed(2)
          });
        });
      });

      console.log(`Prepared ${rateUpdates.length} rate updates`);

      if (rateUpdates.length === 0) {
        toast({
          title: 'No Updates',
          description: 'No rates to update (all selected dates are skipped)',
          variant: 'destructive'
        });
        return;
      }

      // Send bulk update request (same as existing)
      const response = await fetch('/api/rates/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rateUpdates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update rates');
      }

      const result = await response.json();
      
      // Success feedback
      toast({
        title: 'Bulk Update Successful',
        description: `Updated ${result.results?.length || rateUpdates.length} rates to ${rateValue.toFixed(2)}`,
      });
      
      // Clear bulk update mode
      setBulkEditMode(false);
      setBulkEditRate('');
      
      // Refresh data
      await refetchRates();
      
      console.log('✅ Bulk rate update completed successfully');
      
    } catch (error) {
      console.error('Bulk rate update failed:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update rates. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUpdating(false);
      setApplyingBulkRate(false);
    }
  };

  // Simple apply for individual cell edits only
  const handleUnifiedApply = async () => {
    if (!selectedPropertyId) return;
    
    setIsUpdating(true);

    try {
      const updates: Promise<any>[] = [];
      
      // Process pending edits (individual cell changes)
      for (const [key, change] of Array.from(pendingRateChanges.entries())) {
        const roomTypeIdNum = change.roomTypeId;
        const date = change.date;
        const value = change.rate;
        
        if (!value || isNaN(roomTypeIdNum)) continue;

        // Find existing rate or create new one
        const existingRate = (rates as RateMaster[]).find((rate: RateMaster) => 
          rate.roomTypeId === roomTypeIdNum &&
          date >= rate.fromDate &&
          date <= rate.toDate &&
          rate.isActive
        );

        if (existingRate) {
          // Update existing rate
          const updateData = {
            singleOccupancyRate: value,
            doubleOccupancyRate: value,
            tripleOccupancyRate: value,
            quadrupleOccupancyRate: value
          };
          updates.push(updateRateMutation.mutateAsync({ id: existingRate.id, rateData: updateData }));
        } else {
          // Create new rate
          const rateData: NewRateMaster = {
            propertyId: selectedPropertyId,
            roomTypeId: roomTypeIdNum,
            currencyId: 16,
            rateName: `Rate - ${format(new Date(date), 'MMM dd, yyyy')}`,
            fromDate: date,
            toDate: date,
            singleOccupancyRate: value,
            doubleOccupancyRate: value,
            tripleOccupancyRate: value,
            quadrupleOccupancyRate: value,
            extraPersonCharge: '0.00',
            petCharge: '0.00',
            childCharge: '0.00',
            infantCharge: '0.00',
            weekendSurcharge: '0.00',
            festivalSurcharge: '0.00'
          };
          updates.push(createRateMutation.mutateAsync(rateData));
        }
      }
      
      if (updates.length === 0) {
        toast({
          title: 'No Changes',
          description: 'Please make some changes before applying',
          variant: 'destructive'
        });
        return;
      }

      // Execute all updates
      const results = await Promise.allSettled(updates);
      
      // Check for failures
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        throw new Error(`${failures.length} out of ${updates.length} updates failed`);
      }
      
      // Success - clear pending edits and refresh
      clearAllPendingEdits();
      setEditingCell(null);
      
      toast({ 
        title: 'Changes Applied', 
        description: `Updated ${updates.length} rate(s)` 
      });
      
      // Refresh data
      queryClient.removeQueries({ queryKey: ['/api/rates'] });
      await refetchRates();

    } catch (error: any) {
      console.error('Apply failed:', error);
      toast({
        title: 'Update Failed',
        description: error?.message || 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setIsUpdating(false);
      setApplyingBulkRate(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, roomTypeId: number, date: string) => {
    if (e.key === 'Enter') {
      // Save the current editing value
      handleCellEdit(roomTypeId, date, editingValue);
      setEditingCell(null);
      setEditingValue('');
    } else if (e.key === 'Escape') {
      // Cancel editing without saving
      setEditingCell(null);
      setEditingValue('');
    }
  };

  const startEditing = (roomTypeId: number, date: string) => {
    if (bulkEditMode) return;
    
    // Set editing cell and initialize value with current rate
    setEditingCell({ roomTypeId, date });
    
    // Find the current cell data
    const cellData = matrixData.find(row => row.roomType.id === roomTypeId)?.cells.find(cell => cell.date === date);
    const currentValue = getPendingEditValue(roomTypeId, date) || 
                        cellData?.newRate || 
                        cellData?.existingRate || 
                        '';
    setEditingValue(currentValue);
  };

  const finishEditing = (roomTypeId: number, date: string) => {
    // Save the current editing value
    handleCellEdit(roomTypeId, date, editingValue);
    setEditingCell(null);
    setEditingValue('');
  };

  // Helper function to check if a date has any rates across all room types
  const dateHasAnyRates = (date: string) => {
    return matrixData.some(row => 
      row.cells.some(cell => 
        cell.date === date && (cell.existingRate || cell.newRate)
      )
    );
  };

  return (
    <div className="space-y-6 p-6" data-testid="rate-master-matrix">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Rate Master Matrix</h1>
          <p className="text-gray-600 dark:text-gray-400">Grid-based rate management with room types and dates</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Bulk Update Toggle */}
          <div className="flex items-center gap-2">
            <Label htmlFor="bulk-edit-toggle" className="text-sm font-medium">
              Bulk Update
            </Label>
            <Button
              variant={bulkEditMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setBulkEditMode(!bulkEditMode);
                if (bulkEditMode) {
                  clearAllPendingEdits();
                }
              }}
              data-testid="button-bulk-edit-toggle"
            >
              {bulkEditMode ? 'ON' : 'OFF'}
            </Button>
          </div>
          
          
          {/* Clear Selection Button - Only show when has selected cells */}
          {bulkEditMode && selectedCells.size > 0 && (
            <Button 
              onClick={clearAllPendingEdits}
              variant="outline"
              size="sm"
              disabled={isUpdating || applyingBulkRate}
              data-testid="button-clear-selection"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Selection ({selectedCells.size})
            </Button>
          )}
          
          <Button 
            onClick={() => refetchRates()}
            className="roomnest-primary"
            data-testid="button-refresh-rates"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Property and Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Matrix Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* First Row - Property, Date Range, and Rate */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Property</Label>
                <Select value={selectedPropertyId?.toString() || ''} onValueChange={(value) => setSelectedPropertyId(parseInt(value))}>
                  <SelectTrigger data-testid="select-property">
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property: Property) => (
                      <SelectItem key={property.id} value={property.id.toString()}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="button-start-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDateObj ? format(startDateObj, 'PPP') : <span>Select start date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDateObj}
                      onSelect={(date) => {
                        if (date) {
                          setStartDateObj(date);
                          setStartDate(format(date, 'yyyy-MM-dd'));
                          setStartDateOpen(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="button-end-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDateObj ? format(endDateObj, 'PPP') : <span>Select end date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDateObj}
                      onSelect={(date) => {
                        if (date) {
                          setEndDateObj(date);
                          setEndDate(format(date, 'yyyy-MM-dd'));
                          setEndDateOpen(false);
                        }
                      }}
                      disabled={(date) => startDateObj ? date < startDateObj : false}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

            </div>

          </div>
        </CardContent>
      </Card>

      {/* Room Type Selection - Touch-based Cards */}
      {selectedPropertyId && roomTypes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bed className="h-5 w-5" />
              Room Type Selection (Touch to Select)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Room Types to Include:</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRoomTypes(roomTypes.map(rt => rt.id));
                      setRoomTypeFilter('specific');
                    }}
                    data-testid="button-select-all-rooms"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRoomTypes([]);
                      setRoomTypeFilter('all');
                    }}
                    data-testid="button-clear-room-selection"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {roomTypes.map((roomType) => {
                  const isSelected = selectedRoomTypes.includes(roomType.id);
                  return (
                    <div
                      key={roomType.id}
                      onClick={() => {
                        if (isSelected) {
                          const newSelection = selectedRoomTypes.filter(id => id !== roomType.id);
                          setSelectedRoomTypes(newSelection);
                          if (newSelection.length === 0) {
                            setRoomTypeFilter('all');
                          }
                        } else {
                          setSelectedRoomTypes(prev => [...prev, roomType.id]);
                          setRoomTypeFilter('specific');
                        }
                      }}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-primary-600 bg-[#006699] text-white'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                      }`}
                      data-testid={`card-roomtype-${roomType.id}`}
                    >
                      <div className="flex items-center justify-center">
                        <span className={`text-sm font-medium ${
                          isSelected ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {roomType.roomTypeName}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedRoomTypes.length > 0 
                  ? `${selectedRoomTypes.length} room type(s) selected. This affects both single cell editing and bulk operations.`
                  : 'All room types included. Touch cards to select specific room types.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skip Days Selection - Touch Panel Style */}
      {selectedPropertyId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Skip Days (Touch Panel)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select days to skip when applying bulk rates. Skipped days will not have rates applied.
              </p>
              
              {/* Touch-friendly day selection */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {[
                  { key: 'sunday', label: 'Sunday', short: 'Sun' },
                  { key: 'monday', label: 'Monday', short: 'Mon' },
                  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
                  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
                  { key: 'thursday', label: 'Thursday', short: 'Thu' },
                  { key: 'friday', label: 'Friday', short: 'Fri' },
                  { key: 'saturday', label: 'Saturday', short: 'Sat' }
                ].map((day) => (
                  <Button
                    key={day.key}
                    variant={skipDays.includes(day.key) ? "default" : "outline"}
                    className={`h-16 flex flex-col gap-1 touch-manipulation ${
                      skipDays.includes(day.key) 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => {
                      setSkipDays(prev => {
                        const daySet = new Set(prev.map(d => d.toLowerCase()));
                        const normalizedDay = day.key.toLowerCase();
                        if (daySet.has(normalizedDay)) {
                          return Array.from(daySet).filter(d => d !== normalizedDay);
                        } else {
                          daySet.add(normalizedDay);
                          return Array.from(daySet);
                        }
                      });
                    }}
                    data-testid={`button-skip-${day.key}`}
                  >
                    <span className="text-sm font-semibold">{day.short}</span>
                    <span className="text-xs opacity-75">
                      {skipDays.includes(day.key) ? 'Skip' : 'Apply'}
                    </span>
                  </Button>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSkipDays([])}
                  data-testid="button-clear-skip-days"
                >
                  Clear All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSkipDays(['saturday', 'sunday'])}
                  data-testid="button-skip-weekends"
                >
                  Skip Weekends
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSkipDays(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])}
                  data-testid="button-skip-all"
                >
                  Skip All
                </Button>
              </div>

              {/* Selected Skip Days Display */}
              {skipDays.length > 0 && (
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded">
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-2">
                    Days to Skip:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {skipDays.map(day => (
                      <Badge key={day} className="capitalize bg-emerald-600 text-white hover:bg-emerald-700">
                        {day}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Update Controls - Only show when bulk update mode is ON */}
      {selectedPropertyId && bulkEditMode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Bulk Update Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Bulk Rate Input and Apply Button - Side by Side */}
              <div className="space-y-2">
                <Label htmlFor="bulk-edit-rate">Rate Amount</Label>
                <div className="flex gap-3">
                  <Input
                    id="bulk-edit-rate"
                    type="number"
                    step="0.01"
                    placeholder="Enter rate (e.g., 2500.00)"
                    value={bulkEditRate}
                    onChange={(e) => setBulkEditRate(e.target.value)}
                    className="flex-1"
                    data-testid="input-bulk-edit-rate"
                  />
                  {bulkEditRate && parseFloat(bulkEditRate) > 0 && (
                    <Button
                      onClick={applyBulkRates}
                      disabled={isUpdating || applyingBulkRate}
                      className="bg-[#006699] hover:bg-[#002a66] text-white px-8"
                      data-testid="button-apply-bulk-rate"
                    >
                      {isUpdating || applyingBulkRate ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Applying...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Apply Bulk Rate
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Status Info */}
              {bulkEditRate && parseFloat(bulkEditRate) > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded">
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>🤖 Auto-Apply:</strong> Rate ₹{bulkEditRate} will apply to all selected room types and dates, except skip days.
                  </div>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-300 font-medium">
                    ✨ Will update {getBulkUpdateCellCount()} cells
                  </div>
                  {skipDays.length > 0 && (
                    <div className="mt-2 text-sm text-orange-700 dark:text-orange-300">
                      ⚠️ Skip days: {skipDays.join(', ')} - these days will be excluded
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rate Matrix */}
      {selectedPropertyId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Rate Matrix - {properties.find(p => p.id === selectedPropertyId)?.name}
              <Badge variant="outline">
                {startDate && endDate ? (
                  <>
                    {format(parse(startDate, 'yyyy-MM-dd', new Date()), 'MMM dd')} - 
                    {format(parse(endDate, 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy')}
                  </>
                ) : 'Select date range'}
              </Badge>
              <Badge variant="secondary">
                All Occupancy Types
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ratesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-2">Loading matrix...</span>
              </div>
            ) : (
              <ScrollArea className="w-full">
                <div className="min-w-max border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                  {/* Matrix Header */}
                  <div className="grid grid-flow-col auto-cols-[150px] bg-gray-50 dark:bg-gray-800 border-b">
                    <div className="p-3 font-semibold border-r bg-gray-100 dark:bg-gray-700 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <Bed className="h-4 w-4" />
                        Room Type
                      </div>
                    </div>
                    {dateRange.map((date) => {
                      // Use normalized day name helper for skip day indication
                      const dayName = normalizeDayName(date);
                      const isSkipped = skipDays.includes(dayName);

                      return (
                        <div 
                          key={format(date, 'yyyy-MM-dd')} 
                          className={`p-3 font-semibold border-r text-center w-[150px] ${
                            isSkipped && !dateHasAnyRates(format(date, 'yyyy-MM-dd')) ? 'bg-emerald-100 dark:bg-emerald-900/40' : ''
                          }`}
                        >
                          <div className="text-sm">{format(date, 'MMM dd')}</div>
                          <div className="text-xs text-gray-500">{format(date, 'EEE')}</div>
                          {isSkipped && (
                            <div className="text-xs text-emerald-600 dark:text-emerald-300 font-medium">Skip</div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Matrix Rows */}
                  {matrixData.map((row) => (
                    <div key={row.roomType.id} className="grid grid-flow-col auto-cols-[150px] border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="p-3 border-r bg-gray-50 dark:bg-gray-900 min-w-[200px]">
                        <div className="font-medium text-sm">{row.roomType.roomTypeName}</div>
                        <div className="text-xs text-gray-500">{row.roomType.description}</div>
                      </div>
                      
                      {row.cells.map((cell) => {
                        // Use normalized day name helper to check if date should be skipped
                        const cellDate = parse(cell.date, 'yyyy-MM-dd', new Date());
                        const dayName = normalizeDayName(cellDate);
                        const isSkipped = skipDays.includes(dayName);

                        return (
                          <div 
                            key={cell.date} 
                            className={`p-2 border-r min-h-[120px] w-[150px] flex items-center justify-center ${
                              isSkipped && !cell.existingRate && !cell.newRate ? 'bg-emerald-50 dark:bg-emerald-950' : ''
                            }`}
                          >
                            {(editingCell?.roomTypeId === cell.roomTypeId && editingCell?.date === cell.date && !bulkEditMode) ? (
                              <Input
                                type="number"
                                step="0.01"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onBlur={() => finishEditing(cell.roomTypeId, cell.date)}
                                onKeyDown={(e) => handleKeyPress(e, cell.roomTypeId, cell.date)}
                                className="w-full h-8 text-center text-xs"
                                autoFocus
                                disabled={isUpdating || applyingBulkRate}
                                data-testid={`input-rate-${cell.roomTypeId}-${cell.date}`}
                              />
                            ) : (
                              <div
                                className={`w-full h-full flex items-center justify-center rounded transition-colors ${
                                  bulkEditMode ? (
                                    isSkipped
                                      ? 'bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700 cursor-not-allowed'
                                      : isCellSelected(cell.roomTypeId, cell.date)
                                      ? 'bg-green-200 dark:bg-green-800 border-2 border-green-500 dark:border-green-400 cursor-pointer'
                                      : 'bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 cursor-not-allowed opacity-60'
                                  ) : (
                                    isSkipped
                                      ? 'bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700 cursor-not-allowed'
                                      : cell.existingRate || cell.newRate
                                      ? 'bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 cursor-pointer'
                                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                                  )
                                }`}
                                onClick={() => {
                                  if (bulkEditMode) {
                                    // In bulk mode, show message and don't allow cell editing
                                    if (!isSkipped) {
                                      // Only allow selection if using old bulk cell selection method
                                      if (isCellSelected(cell.roomTypeId, cell.date)) {
                                        // Deselect
                                        toggleCellSelection(cell.roomTypeId, cell.date);
                                      } else {
                                        // Show message instead of editing
                                        toast({
                                          title: "Bulk Update Mode is ON",
                                          description: "Individual cell editing is locked. Use the bulk rate input above or turn off Bulk Update to edit individual cells.",
                                          variant: "default"
                                        });
                                      }
                                    }
                                  } else {
                                    // In normal mode, start editing cell
                                    if (!isUpdating && !applyingBulkRate) {
                                      startEditing(cell.roomTypeId, cell.date);
                                    }
                                  }
                                }}
                                data-testid={`cell-rate-${cell.roomTypeId}-${cell.date}`}
                              >
                                {cell.existingRate || cell.newRate ? (
                                  <div className="w-full h-full flex flex-col gap-1 p-1">
                                    {/* Skip day indicator if applicable */}
                                    {isSkipped && (
                                      <div className="bg-emerald-100 dark:bg-emerald-800 rounded px-1 py-0.5 mb-1">
                                        <div className="text-xs text-emerald-700 dark:text-emerald-200 text-center font-medium">SKIP DAY</div>
                                      </div>
                                    )}
                                    {/* Existing Rate - Read Only */}
                                    {cell.existingRate && (
                                      <div className="bg-gray-100 dark:bg-gray-700 rounded px-2 py-1">
                                        <div className="text-xs text-gray-600 dark:text-gray-400">Current</div>
                                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                          ₹{cell.existingRate}
                                        </div>
                                      </div>
                                    )}
                                    {/* Pending Edit - Show in both modes */}
                                    {getPendingEditValue(cell.roomTypeId, cell.date) && (
                                      <div className="bg-yellow-100 dark:bg-yellow-900 rounded px-2 py-1">
                                        <div className="text-xs text-yellow-600 dark:text-yellow-400">Pending</div>
                                        <div className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                                          ₹{getPendingEditValue(cell.roomTypeId, cell.date)}
                                        </div>
                                      </div>
                                    )}
                                    {/* New Rate - Editable (Single edit mode) */}
                                    {!bulkEditMode && cell.newRate && !getPendingEditValue(cell.roomTypeId, cell.date) && (
                                      <div className="bg-green-100 dark:bg-green-900 rounded px-2 py-1">
                                        <div className="text-xs text-green-600 dark:text-green-400">New</div>
                                        <div className="text-sm font-semibold text-green-700 dark:text-green-300">
                                          ₹{cell.newRate}
                                        </div>
                                      </div>
                                    )}
                                    {/* Selected indicator for bulk update mode */}
                                    {bulkEditMode && isCellSelected(cell.roomTypeId, cell.date) && (
                                      <div className="bg-green-600 text-white rounded px-2 py-1">
                                        <div className="text-xs text-center font-medium">
                                          SELECTED
                                        </div>
                                        <div className="text-xs text-center">
                                          Will apply ₹{bulkEditRate || '---'}
                                        </div>
                                      </div>
                                    )}
                                    {/* If only existing rate, show click message */}
                                    {cell.existingRate && !cell.newRate && !isSkipped && !bulkEditMode && (
                                      <div className="text-xs text-gray-500 text-center mt-1">
                                        Click to set new rate
                                      </div>
                                    )}
                                    {/* Bulk edit mode instructions */}
                                    {bulkEditMode && !isCellSelected(cell.roomTypeId, cell.date) && !isSkipped && (
                                      <div className="text-xs text-orange-600 dark:text-orange-400 text-center mt-1">
                                        🔒 LOCKED - Cell editing disabled in Bulk Update
                                      </div>
                                    )}
                                  </div>
                                ) : isSkipped && !cell.existingRate && !cell.newRate ? (
                                  <div className="text-xs text-emerald-600 dark:text-emerald-300 text-center font-medium">
                                    SKIP DAY<br />No rates
                                  </div>
                                ) : bulkEditMode ? (
                                  <div className="text-xs text-center">
                                    {isCellSelected(cell.roomTypeId, cell.date) ? (
                                      <>
                                        <div className="text-green-600 dark:text-green-400 font-medium">SELECTED</div>
                                        <div>Will apply ₹{bulkEditRate || '---'}</div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="text-orange-600 dark:text-orange-400 font-medium">🔒 LOCKED</div>
                                        <div className="text-orange-500 dark:text-orange-300">Cell editing disabled</div>
                                        <div className="text-xs text-orange-400 dark:text-orange-500">Use bulk rate above</div>
                                      </>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-400 text-center">
                                    Click to<br />add rate
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Unified Apply Button - Shows immediately when typing any amount > 0 */}
            {hasAnyPendingChanges() && (
              <div className="mt-4">
                <div className="bg-green-50 dark:bg-green-900 border-2 border-green-200 dark:border-green-700 rounded-lg p-4">
                  <div className="text-center space-y-3">
                    <div className="space-y-1">
                      {/* Pending rate changes */}
                      {pendingRateChanges.size > 0 && (
                        <p className="text-green-800 dark:text-green-200 text-sm">
                          📝 {pendingRateChanges.size} rate changes ready to apply
                        </p>
                      )}
                      {/* Bulk rate entered ONLY when bulk update mode is ON */}
                      {bulkEditMode && bulkEditRate && parseFloat(bulkEditRate) > 0 && (
                        <div className="space-y-2">
                          <p className="text-green-800 dark:text-green-200 text-sm">
                            🔄 Bulk rate ₹{bulkEditRate} ready - will auto-apply to ALL non-skip day cells ({getBulkUpdateCellCount()} cells)!
                          </p>
                          {skipDays.length > 0 && (
                            <p className="text-orange-700 dark:text-orange-300 text-sm">
                              ⚠️ Skip days: {skipDays.join(', ')} - these days will be excluded from bulk update
                            </p>
                          )}
                        </div>
                      )}
                      <p className="text-green-800 dark:text-green-200 font-medium text-lg">
                        {bulkEditMode && bulkEditRate && parseFloat(bulkEditRate) > 0 ? 
                          'Ready to bulk apply to all non-skip days' : 
                          'Ready to apply individual cell changes'
                        }
                      </p>
                    </div>
                    <Button 
                      onClick={bulkEditMode && bulkEditRate && parseFloat(bulkEditRate) > 0 ? applyBulkRates : saveAllChanges}
                      disabled={isUpdating || bulkRateUpdateMutation.isPending || (pendingRateChanges.size === 0 && !(bulkEditMode && bulkEditRate && parseFloat(bulkEditRate) > 0))}
                      className="w-full bg-green-600 hover:bg-green-700 text-white text-xl py-6 font-bold disabled:opacity-50"
                      data-testid="button-unified-apply"
                    >
                      {(isUpdating || bulkRateUpdateMutation.isPending) ? (
                        <>
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-4"></div>
                          Saving Rates...
                        </>
                      ) : (
                        <>
                          <Check className="h-8 w-8 mr-4" />
                          {bulkEditMode && bulkEditRate && parseFloat(bulkEditRate) > 0 ? 
                            `APPLY BULK RATE ₹${bulkEditRate} TO ${getBulkUpdateCellCount()} CELLS` : 
                            `SAVE INDIVIDUAL CHANGES (${pendingRateChanges.size})`
                          }
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                How to use the Rate Matrix:
              </h4>
              <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                <li>• <strong>Simple Bulk Rate:</strong> Enter a rate in the "Rate Amount" field above and the Apply button appears automatically!</li>
                <li>• <strong>Auto-Apply:</strong> Bulk rates automatically apply to ALL dates in your range (respecting skip days) - no cell selection needed!</li>
                <li>• <strong>Single Edit Mode:</strong> Click any cell to set a rate for that specific room type and date</li>
                <li>• <strong>Smart Apply Button:</strong> Appears when you enter any bulk rate OR make individual cell edits</li>
                <li>• Existing rates are shown in gray boxes (Current), new rates in green (New)</li>
                <li>• Use the skip days panel to exclude specific days from rate applications</li>
                <li>• <strong>User-Friendly:</strong> Just set your date range, select room types, enter bulk rate - done!</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Loading Overlay */}
      {(isUpdating || applyingBulkRate) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <div className="text-lg font-medium">
              {applyingBulkRate ? 'Rate update process going on...' : 'Updating rate...'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}