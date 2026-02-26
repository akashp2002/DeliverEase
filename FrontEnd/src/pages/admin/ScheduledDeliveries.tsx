import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { useDelivery } from '@/contexts/DeliveryContext';
import { useAgent } from '@/contexts/AgentContext';
import type { ScheduledDelivery, DeliveryAgent } from '../../data/mockData';
import { DeliveryMap } from '@/components/DeliveryMap';
import { Plus, Search, Filter, Calendar, Package, Loader2, MapPin, RefreshCw } from 'lucide-react';
import { geocodeAddress, isCoordinateInIndia } from '@/lib/geocode';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// Comprehensive Indian locations database
const indianLocations: Record<string, Record<string, { lat: number; lng: number }>> = {
  'Delhi': {
    'Central Delhi': { lat: 28.6315, lng: 77.2167 },
    'South Delhi': { lat: 28.5244, lng: 77.2066 },
    'North Delhi': { lat: 28.7041, lng: 77.1025 },
    'East Delhi': { lat: 28.6139, lng: 77.3060 },
    'West Delhi': { lat: 28.5529, lng: 77.0583 },
  },
  'Karnataka': {
    'Bangalore': { lat: 12.9716, lng: 77.5946 },
    'Mysore': { lat: 12.2958, lng: 76.6394 },
    'Belgaum': { lat: 15.8691, lng: 75.6204 },
    'Mangalore': { lat: 12.8479, lng: 74.8430 },
  },
  'Kerala': {
    'Kochi': { lat: 9.9312, lng: 76.2673 },
    'Thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
    'Kannur': { lat: 12.1817, lng: 75.3710 },
    'Kozhikode': { lat: 11.2588, lng: 75.7804 },
    'Kottayam': { lat: 9.5941, lng: 76.5214 },
  },
  'Maharashtra': {
    'Mumbai': { lat: 19.0760, lng: 72.8777 },
    'Pune': { lat: 18.5204, lng: 73.8567 },
    'Nagpur': { lat: 21.1458, lng: 79.0882 },
    'Aurangabad': { lat: 19.8762, lng: 75.3433 },
  },
  'Tamil Nadu': {
    'Chennai': { lat: 13.0827, lng: 80.2707 },
    'Coimbatore': { lat: 11.0081, lng: 76.9124 },
    'Madurai': { lat: 9.9252, lng: 78.1198 },
    'Salem': { lat: 11.6643, lng: 78.1460 },
  },
  'Rajasthan': {
    'Jaipur': { lat: 26.9124, lng: 75.7873 },
    'Udaipur': { lat: 24.5854, lng: 73.7125 },
    'Jodhpur': { lat: 26.2389, lng: 73.0243 },
    'Ajmer': { lat: 26.4499, lng: 74.6399 },
  },
  'Uttar Pradesh': {
    'Lucknow': { lat: 26.8467, lng: 80.9462 },
    'Kanpur': { lat: 26.4499, lng: 80.3319 },
    'Agra': { lat: 27.1767, lng: 78.0081 },
    'Varanasi': { lat: 25.3200, lng: 82.9789 },
  },
  'Gujarat': {
    'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
    'Surat': { lat: 21.1702, lng: 72.8311 },
    'Vadodara': { lat: 22.3072, lng: 73.1812 },
    'Rajkot': { lat: 22.3039, lng: 70.8022 },
  },
  'West Bengal': {
    'Kolkata': { lat: 22.5726, lng: 88.3639 },
    'Darjeeling': { lat: 27.0413, lng: 88.2663 },
    'Siliguri': { lat: 26.5124, lng: 88.4262 },
    'Asansol': { lat: 23.6840, lng: 86.9657 },
  },
  'Telangana': {
    'Hyderabad': { lat: 17.3850, lng: 78.4867 },
    'Warangal': { lat: 17.9689, lng: 79.5941 },
    'Nizamabad': { lat: 19.3041, lng: 78.1349 },
  },
};

const states = Object.keys(indianLocations).sort();

export default function ScheduledDeliveries() {
  const { agents, fetchAgents } = useAgent();
  const { deliveries, addDelivery, fetchDeliveries, isLoadingDeliveries } = useDelivery();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previewCoords, setPreviewCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [newDelivery, setNewDelivery] = useState({
    customerName: '',
    phone: '',
    streetAddress: '',
    state: 'Delhi',
    area: 'Central Delhi',
    city: 'New Delhi',
    country: 'India',
    postalCode: '',
    landmark: '',
    scheduledDate: '',
    scheduledTime: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    notes: '',
    agentId: '',
  });

  // State for assigning agent to existing delivery
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [assignmentMode, setAssignmentMode] = useState<'assign' | 'edit'>('assign');

  // State for viewing delivery details
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedDeliveryForDetails, setSelectedDeliveryForDetails] = useState<ScheduledDelivery | null>(null);

  const openDetailsDialog = async (delivery: ScheduledDelivery) => {
    // Ensure agents are loaded before opening details
    console.log('📂 Opening delivery details for:', delivery.id);
    console.log('📋 Current agents count:', agents.length);
    console.log('🏷️ Delivery agentId:', delivery.agentId);

    if (agents.length === 0) {
      console.log('⏳ Agents not loaded, fetching now...');
      await fetchAgents();
    }

    console.log('✅ Agents ready, setting delivery details');
    setSelectedDeliveryForDetails(delivery);
    setDetailsDialogOpen(true);
  };

  const getAgentNameById = (agentId?: string) => {
    if (!agentId) {
      console.log('❌ No agentId provided');
      return null;
    }
    console.log('🔍 LOOKING FOR AGENT WITH ID:', agentId);
    console.log('📋 AGENTS ARRAY:', agents);
    console.log('📋 AGENTS COUNT:', agents.length);

    // Try exact match
    let found = agents.find(a => {
      const matches = String(a.id) === String(agentId);
      console.log(`  Comparing agent "${a.id}" (${typeof a.id}) === agentId "${agentId}" (${typeof agentId}) = ${matches}`);
      return matches;
    });

    if (found) {
      console.log('✅ FOUND AGENT:', found);
      return found;
    }

    console.log('❌ AGENT NOT FOUND');
    return null;
  };

  // Handle agent assignment
  const handleAssignAgent = async () => {
    if (!selectedDeliveryId || !selectedAgentId) {
      toast.error('Please select an agent');
      return;
    }

    try {
      // Call API to update delivery with agent
      const response = await api.put(`/deliveries/${selectedDeliveryId}/assign`, {
        agentId: selectedAgentId,
      });

      if (response.data.success) {
        toast.success(`Delivery assigned to ${agents.find(a => a.id === selectedAgentId)?.name}`);
        await fetchDeliveries();
        setAssignDialogOpen(false);
        setSelectedDeliveryId(null);
        setSelectedAgentId('');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to assign delivery';
      toast.error(errorMsg);
    }
  };

  const openAssignDialog = (deliveryId: string, mode: 'assign' | 'edit' = 'assign') => {
    const delivery = deliveries.find(d => d.id === deliveryId);
    setSelectedDeliveryId(deliveryId);
    setAssignmentMode(mode);
    if (mode === 'edit' && delivery?.agentId) {
      setSelectedAgentId(delivery.agentId);
    } else {
      setSelectedAgentId('');
    }
    setAssignDialogOpen(true);
  };

  // Fetch deliveries and agents on component mount
  useEffect(() => {
    fetchDeliveries();
    fetchAgents();
  }, [fetchDeliveries, fetchAgents]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchDeliveries();
      toast.success('Deliveries refreshed');
    } catch (error) {
      toast.error('Failed to refresh deliveries');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get areas for selected state
  const getAreasForState = (selectedState: string) => {
    return Object.keys(indianLocations[selectedState] || {});
  };

  const currentAreas = getAreasForState(newDelivery.state);

  // Preview geocoding when address changes
  const handleAddressChange = async () => {
    if (!newDelivery.streetAddress || !newDelivery.state || !newDelivery.city) {
      setPreviewCoords(null);
      return;
    }

    setIsGeocodingLoading(true);
    try {
      const fullAddress = `${newDelivery.streetAddress}, ${newDelivery.area}, ${newDelivery.city}, ${newDelivery.state}, ${newDelivery.country}`;
      const result = await geocodeAddress(fullAddress);

      if (result && isCoordinateInIndia(result.lat, result.lng)) {
        setPreviewCoords({ lat: result.lat, lng: result.lng });
      } else if (result) {
        toast.error('Geocoded location is outside India. Please verify your address.');
        setPreviewCoords(null);
      } else {
        // Fallback to database coordinates if geocoding fails
        const dbCoords = indianLocations[newDelivery.state]?.[newDelivery.area];
        if (dbCoords) {
          setPreviewCoords(dbCoords);
        }
      }
    } catch (error) {
      console.error('Geocoding preview error:', error);
      setPreviewCoords(null);
    } finally {
      setIsGeocodingLoading(false);
    }
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch =
      delivery.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.location.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${delivery.location.streetAddress} ${delivery.location.area}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArea = filterArea === 'all' || delivery.area === filterArea;
    const matchesStatus = filterStatus === 'all' || delivery.status === filterStatus;
    return matchesSearch && matchesArea && matchesStatus;
  });

  const areaGroups = deliveries.reduce((acc, d) => {
    acc[d.area] = (acc[d.area] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleAddDelivery = async () => {
    if (!newDelivery.customerName || !newDelivery.streetAddress || !newDelivery.scheduledDate || !newDelivery.agentId) {
      toast.error('Please fill all required fields including agent assignment');
      return;
    }

    setIsGeocodingLoading(true);
    try {
      let lat: number;
      let lng: number;

      // Try real geocoding first
      const fullAddress = `${newDelivery.streetAddress}, ${newDelivery.area}, ${newDelivery.city}, ${newDelivery.state}, ${newDelivery.country}`;
      const geocodeResult = await geocodeAddress(fullAddress);

      if (geocodeResult && isCoordinateInIndia(geocodeResult.lat, geocodeResult.lng)) {
        // Use real geocoded coordinates
        lat = geocodeResult.lat;
        lng = geocodeResult.lng;
      } else {
        // Fallback to database coordinates
        const dbCoords = indianLocations[newDelivery.state]?.[newDelivery.area];

        if (!dbCoords) {
          toast.error('Location coordinates could not be determined. Please verify your location.');
          setIsGeocodingLoading(false);
          return;
        }

        // Add slight variance to avoid clustering
        lat = dbCoords.lat + (Math.random() - 0.5) * 0.02;
        lng = dbCoords.lng + (Math.random() - 0.5) * 0.02;
        toast.info('Using approximate coordinates from location database');
      }

      console.log('📤 Component calling addDelivery...');
      await addDelivery({
        location: {
          id: `loc-${Date.now()}`,
          streetAddress: newDelivery.streetAddress,
          area: newDelivery.area,
          city: newDelivery.city,
          state: newDelivery.state,
          country: newDelivery.country,
          postalCode: newDelivery.postalCode,
          landmark: newDelivery.landmark || undefined,
          customerName: newDelivery.customerName,
          phone: newDelivery.phone || '0000000000',
          notes: newDelivery.notes || undefined,
          lat,
          lng,
        },
        scheduledDate: newDelivery.scheduledDate,
        scheduledTime: newDelivery.scheduledTime || '10:00 AM',
        status: 'pending',
        agentId: newDelivery.agentId,
        area: newDelivery.area,
        priority: newDelivery.priority,
        packageWeight: Math.round(Math.random() * 5 * 10) / 10,
      });

      console.log('✅ Delivery sent successfully to API');

      setNewDelivery({
        customerName: '', phone: '', streetAddress: '', landmark: '',
        area: 'Central Delhi', city: 'New Delhi', state: 'Delhi', country: 'India', postalCode: '',
        scheduledDate: '', scheduledTime: '', priority: 'medium', notes: '', agentId: '',
      });
      setPreviewCoords(null);
      setIsAddDialogOpen(false);

      // Refresh deliveries list after short delay to ensure backend is updated
      setTimeout(() => fetchDeliveries(), 500);
    } catch (error: any) {
      console.error('❌ DELIVERY ERROR:', error);
      // Error handling is done in DeliveryContext - no need to duplicate here
    } finally {
      setIsGeocodingLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Scheduled Deliveries</h1>
          <p className="text-muted-foreground mt-1">Create and manage delivery orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoadingDeliveries || isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingDeliveries || isRefreshing ? 'animate-spin' : ''}`} />
            {isLoadingDeliveries ? 'Loading...' : 'Refresh'}
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Delivery
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Delivery</DialogTitle>
                <DialogDescription>
                  Fill in the delivery details. Coordinates will be auto-generated based on the selected area.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Customer Name *</Label>
                    <Input
                      placeholder="Full name"
                      value={newDelivery.customerName}
                      onChange={(e) => setNewDelivery({ ...newDelivery, customerName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      placeholder="+91 98765 43210"
                      value={newDelivery.phone}
                      onChange={(e) => setNewDelivery({ ...newDelivery, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Street Address *</Label>
                  <Input
                    placeholder="e.g., 101 Connaught Place, Block A"
                    value={newDelivery.streetAddress}
                    onChange={(e) => {
                      setNewDelivery({ ...newDelivery, streetAddress: e.target.value });
                    }}
                    onBlur={handleAddressChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Landmark / Building Details (Optional)</Label>
                  <Input
                    placeholder="e.g., Office building, 3rd floor"
                    value={newDelivery.landmark}
                    onChange={(e) => setNewDelivery({ ...newDelivery, landmark: e.target.value })}
                    onBlur={handleAddressChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Country *</Label>
                    <Select
                      value={newDelivery.country}
                      onValueChange={(value) => setNewDelivery({ ...newDelivery, country: value })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="India">India</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>State *</Label>
                    <Select
                      value={newDelivery.state}
                      onValueChange={(value) => {
                        setNewDelivery({ ...newDelivery, state: value, area: getAreasForState(value)[0] || '' });
                        handleAddressChange();
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {states.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Area / City *</Label>
                    <Select
                      value={newDelivery.area}
                      onValueChange={(value) => {
                        setNewDelivery({ ...newDelivery, area: value });
                        handleAddressChange();
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {currentAreas.map(area => (
                          <SelectItem key={area} value={area}>{area}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      placeholder="e.g., New Delhi, Bangalore"
                      value={newDelivery.city}
                      onChange={(e) => {
                        setNewDelivery({ ...newDelivery, city: e.target.value });
                      }}
                      onBlur={handleAddressChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Postal Code</Label>
                  <Input
                    placeholder="110001"
                    value={newDelivery.postalCode}
                    onChange={(e) => setNewDelivery({ ...newDelivery, postalCode: e.target.value })}
                  />
                </div>

                {/* Map Preview */}
                {previewCoords && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      Location Preview
                      {isGeocodingLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    </Label>
                    <div className="border border-blue-200 rounded-lg overflow-hidden bg-blue-50 dark:bg-blue-950">
                      <DeliveryMap
                        waypoints={[{
                          lat: previewCoords.lat,
                          lng: previewCoords.lng,
                          label: newDelivery.customerName || 'Delivery Location'
                        }]}
                        height="200px"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      📍 {previewCoords.lat.toFixed(4)}°, {previewCoords.lng.toFixed(4)}°
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Scheduled Date *</Label>
                    <Input
                      type="date"
                      value={newDelivery.scheduledDate}
                      onChange={(e) => setNewDelivery({ ...newDelivery, scheduledDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Delivery Time Slot</Label>
                    <Input
                      type="time"
                      value={newDelivery.scheduledTime}
                      onChange={(e) => setNewDelivery({ ...newDelivery, scheduledTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={newDelivery.priority}
                    onValueChange={(value) => setNewDelivery({ ...newDelivery, priority: value as 'low' | 'medium' | 'high' })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Assign Delivery Agent *</Label>
                  <Select
                    value={newDelivery.agentId}
                    onValueChange={(value) => setNewDelivery({ ...newDelivery, agentId: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent (required)" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.length === 0 ? (
                        <SelectItem value="loading" disabled>Loading agents...</SelectItem>
                      ) : (
                        agents.filter(a => a.status !== 'off-duty').map(agent => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name} - {agent.status === 'available' ? '✓ Available' : 'On Delivery'} ({agent.assignedDeliveries} assigned)
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {agents.filter(a => a.status !== 'off-duty').length === 0 && (
                    <p className="text-xs text-red-600 font-medium">⚠️ No available agents. Cannot create delivery.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    placeholder="Any special instructions..."
                    value={newDelivery.notes}
                    onChange={(e) => setNewDelivery({ ...newDelivery, notes: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    🌍 <strong>Real-world Geocoding:</strong> Your address is automatically converted to precise GPS coordinates using the OpenStreetMap API. The map preview updates as you enter details, and coordinates are validated to be within India. Falls back to our location database if geocoding is unavailable.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isGeocodingLoading}>Cancel</Button>
                <Button onClick={handleAddDelivery} disabled={isGeocodingLoading} className="gap-2">
                  {isGeocodingLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isGeocodingLoading ? 'Creating...' : 'Create Delivery'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Assign/Edit Agent Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{assignmentMode === 'edit' ? 'Change Delivery Agent' : 'Assign Delivery Agent'}</DialogTitle>
            <DialogDescription>
              {assignmentMode === 'edit'
                ? 'Select a different agent to reassign this delivery to.'
                : 'Select an available agent to assign this delivery to.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-3">
              <Label htmlFor="agent-select" className="text-base font-medium">
                {assignmentMode === 'edit' ? 'Change Agent' : 'Select Agent'}
              </Label>
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger id="agent-select">
                  <SelectValue placeholder="Choose an agent..." />
                </SelectTrigger>
                <SelectContent>
                  {agents.filter(a => a.status !== 'off-duty').length === 0 ? (
                    <SelectItem value="none" disabled>No available agents</SelectItem>
                  ) : (
                    agents.filter(a => a.status !== 'off-duty').map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                            {agent.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{agent.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {agent.status === 'available' ? '✓ Available' : 'On Delivery'} ({agent.assignedDeliveries} orders)
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignAgent} disabled={!selectedAgentId}>
              {assignmentMode === 'edit' ? 'Update Agent' : 'Assign Agent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Delivery Details</DialogTitle>
          </DialogHeader>
          {selectedDeliveryForDetails && (() => {
            console.log('📦 Delivery agentId:', selectedDeliveryForDetails.agentId);
            const deliveryAgent = getAgentNameById(selectedDeliveryForDetails.agentId);
            return (
              <div className="grid gap-4 py-4">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                  <div>
                    <p className="text-sm text-muted-foreground">Order ID</p>
                    <p className="font-semibold text-base">{selectedDeliveryForDetails.orderId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Priority</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${selectedDeliveryForDetails.priority === 'high'
                          ? 'bg-destructive/15 text-destructive'
                          : selectedDeliveryForDetails.priority === 'medium'
                            ? 'bg-warning/15 text-warning'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                        {selectedDeliveryForDetails.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Status</p>
                  <StatusBadge status={selectedDeliveryForDetails.status} />
                </div>

                {/* Assigned Agent */}
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-muted-foreground mb-2">Assigned Delivery Agent</p>
                  {selectedDeliveryForDetails.agentId ? (
                    <div>
                      {deliveryAgent ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                              {deliveryAgent.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-base">{deliveryAgent.name}</p>
                              <p className="text-xs text-muted-foreground">{deliveryAgent.email}</p>
                              <p className="text-xs text-muted-foreground">{deliveryAgent.phone}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAssignDialog(selectedDeliveryForDetails.id, 'edit')}
                            className="ml-2"
                            title="Change assigned agent"
                          >
                            ✏️ Edit
                          </Button>
                        </div>
                      ) : (
                        <div className="text-amber-600 font-medium">
                          <p>⏳ Loading agent details... (ID: {selectedDeliveryForDetails.agentId})</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchAgents()}
                            className="mt-2"
                          >
                            Retry Loading
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-amber-600 font-medium">⚠️ No agent assigned yet</p>
                  )}
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Customer Name</p>
                    <p className="font-medium">{selectedDeliveryForDetails.location.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedDeliveryForDetails.location.phone}</p>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Delivery Address</p>
                  <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                    <p><strong>Street:</strong> {selectedDeliveryForDetails.location.streetAddress}</p>
                    {selectedDeliveryForDetails.location.landmark && (
                      <p><strong>Landmark:</strong> {selectedDeliveryForDetails.location.landmark}</p>
                    )}
                    <p><strong>Area:</strong> {selectedDeliveryForDetails.location.area}</p>
                    <p><strong>City:</strong> {selectedDeliveryForDetails.location.city}</p>
                    <p><strong>State:</strong> {selectedDeliveryForDetails.location.state}</p>
                    <p><strong>Postal Code:</strong> {selectedDeliveryForDetails.location.postalCode}</p>
                    <p><strong>Coordinates:</strong> {selectedDeliveryForDetails.location.lat.toFixed(4)}°, {selectedDeliveryForDetails.location.lng.toFixed(4)}°</p>
                  </div>
                </div>

                {/* Schedule */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Scheduled Date</p>
                    <p className="font-medium">{selectedDeliveryForDetails.scheduledDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Delivery Time</p>
                    <p className="font-medium">{selectedDeliveryForDetails.scheduledTime}</p>
                  </div>
                </div>

                {/* Package Info */}
                <div>
                  <p className="text-sm text-muted-foreground">Package Weight</p>
                  <p className="font-medium">{selectedDeliveryForDetails.packageWeight} kg</p>
                </div>

                {/* Notes */}
                {selectedDeliveryForDetails.location.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Notes</p>
                    <p className="text-sm bg-muted p-3 rounded-lg">{selectedDeliveryForDetails.location.notes}</p>
                  </div>
                )}
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>Close</Button>
            {selectedDeliveryForDetails && !selectedDeliveryForDetails.agentId && (
              <Button onClick={() => {
                openAssignDialog(selectedDeliveryForDetails.id, 'assign');
                setDetailsDialogOpen(false);
              }} className="gap-2">
                ➕ Assign Agent
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Area Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {currentAreas.map(area => (
          <Card
            key={area}
            className={`cursor-pointer transition-all ${filterArea === area ? 'ring-2 ring-accent' : ''}`}
            onClick={() => setFilterArea(filterArea === area ? 'all' : area)}
          >
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{area}</p>
              <p className="text-2xl font-bold">{areaGroups[area] || 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order ID, customer, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in-transit">In Transit</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Deliveries Table */}
      {!isLoadingDeliveries && filteredDeliveries.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Address</th>
                    <th>Lat / Lng</th>
                    <th>Area</th>
                    <th>Date & Time</th>
                    <th>Agent</th>
                    <th>Priority</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeliveries.map(delivery => {
                    const agent = agents.find(a => String(a.id) === String(delivery.agentId));

                    return (
                      <tr
                        key={delivery.id}
                        onClick={() => openDetailsDialog(delivery)}
                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                      >
                        <td className="font-medium">{delivery.orderId}</td>
                        <td>{delivery.location.customerName}</td>
                        <td
                          className="max-w-[180px] truncate"
                          title={`${delivery.location.streetAddress}, ${delivery.location.area}`}
                        >
                          {delivery.location.streetAddress}, {delivery.location.area}
                        </td>
                        <td className="text-xs text-muted-foreground">
                          {delivery.location.lat.toFixed(4)}, {delivery.location.lng.toFixed(4)}
                        </td>
                        <td>{delivery.area}</td>

                        <td>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {delivery.scheduledDate} {delivery.scheduledTime}
                          </div>
                        </td>

                        <td>
                          {agent ? (
                            <span className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">
                                {agent.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium">{agent.name}</span>
                            </span>
                          ) : (
                            <button
                              className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-50 hover:bg-amber-100 dark:bg-amber-950 dark:hover:bg-amber-900 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-medium transition-colors"
                              onClick={() => openAssignDialog(delivery.id, 'assign')}
                            >
                              ➕ Assign Agent
                            </button>
                          )}
                        </td>

                        <td>
                          <span
                            className={`status-badge ${delivery.priority === 'high'
                                ? 'bg-destructive/15 text-destructive'
                                : delivery.priority === 'medium'
                                  ? 'bg-warning/15 text-warning'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                          >
                            {delivery.priority}
                          </span>
                        </td>

                        <td>
                          <StatusBadge status={delivery.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoadingDeliveries ? (
        <Card>
          <CardContent className="p-12 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-12 w-12 mx-auto text-blue-500 animate-spin mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">Loading deliveries...</h3>
              <p className="text-sm text-muted-foreground mt-1">Fetching data from the server</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredDeliveries.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No deliveries found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery ? 'Try adjusting your search or filters' : 'Create your first delivery order'}
          </p>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
