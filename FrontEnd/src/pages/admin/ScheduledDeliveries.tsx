import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { useDelivery } from '@/contexts/DeliveryContext';
import { Plus, Search, Filter, Calendar, Package } from 'lucide-react';
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

const areas = ['Central Delhi', 'South Delhi', 'North Delhi', 'East Delhi', 'West Delhi'];

export default function ScheduledDeliveries() {
  const { deliveries, agents, addDelivery } = useDelivery();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDelivery, setNewDelivery] = useState({
    customerName: '',
    address: '',
    lat: '',
    lng: '',
    phone: '',
    scheduledDate: '',
    scheduledTime: '',
    area: 'Central Delhi',
    priority: 'medium' as 'low' | 'medium' | 'high',
    notes: '',
    agentId: '',
  });

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch =
      delivery.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.location.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.location.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArea = filterArea === 'all' || delivery.area === filterArea;
    const matchesStatus = filterStatus === 'all' || delivery.status === filterStatus;
    return matchesSearch && matchesArea && matchesStatus;
  });

  const areaGroups = deliveries.reduce((acc, d) => {
    acc[d.area] = (acc[d.area] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleAddDelivery = () => {
    if (!newDelivery.customerName || !newDelivery.address || !newDelivery.scheduledDate || !newDelivery.lat || !newDelivery.lng) {
      toast.error('Please fill in all required fields including latitude and longitude');
      return;
    }

    const lat = parseFloat(newDelivery.lat);
    const lng = parseFloat(newDelivery.lng);

    if (isNaN(lat) || isNaN(lng)) {
      toast.error('Latitude and Longitude must be valid numbers');
      return;
    }

    addDelivery({
      location: {
        id: `loc-${Date.now()}`,
        address: newDelivery.address,
        lat,
        lng,
        customerName: newDelivery.customerName,
        phone: newDelivery.phone,
        notes: newDelivery.notes || undefined,
      },
      scheduledDate: newDelivery.scheduledDate,
      scheduledTime: newDelivery.scheduledTime || '10:00 AM',
      status: 'pending',
      agentId: newDelivery.agentId || undefined,
      area: newDelivery.area,
      priority: newDelivery.priority,
      packageWeight: Math.round(Math.random() * 5 * 10) / 10,
    });

    setNewDelivery({
      customerName: '', address: '', lat: '', lng: '', phone: '',
      scheduledDate: '', scheduledTime: '', area: 'Central Delhi',
      priority: 'medium', notes: '', agentId: '',
    });
    setIsAddDialogOpen(false);
    toast.success('Delivery created and added to table successfully!');
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Scheduled Deliveries</h1>
          <p className="text-muted-foreground mt-1">Create and manage delivery orders</p>
        </div>
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
                Fill in the delivery details. Delivery ID will be auto-generated.
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
                <Label>Delivery Location (Address) *</Label>
                <Textarea
                  placeholder="Enter complete delivery address"
                  value={newDelivery.address}
                  onChange={(e) => setNewDelivery({ ...newDelivery, address: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Latitude *</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="e.g. 28.6315"
                    value={newDelivery.lat}
                    onChange={(e) => setNewDelivery({ ...newDelivery, lat: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Longitude *</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="e.g. 77.2167"
                    value={newDelivery.lng}
                    onChange={(e) => setNewDelivery({ ...newDelivery, lng: e.target.value })}
                  />
                </div>
              </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Area</Label>
                  <Select
                    value={newDelivery.area}
                    onValueChange={(value) => setNewDelivery({ ...newDelivery, area: value })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {areas.map(area => (
                        <SelectItem key={area} value={area}>{area}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              </div>
              <div className="space-y-2">
                <Label>Assign Delivery Agent</Label>
                <Select
                  value={newDelivery.agentId}
                  onValueChange={(value) => setNewDelivery({ ...newDelivery, agentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.filter(a => a.status !== 'off-duty').map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddDelivery}>Create Delivery</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Area Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {areas.map(area => (
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
                  const agent = agents.find(a => a.id === delivery.agentId);
                  return (
                    <tr key={delivery.id}>
                      <td className="font-medium">{delivery.orderId}</td>
                      <td>{delivery.location.customerName}</td>
                      <td className="max-w-[180px] truncate" title={delivery.location.address}>
                        {delivery.location.address}
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
                            <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                              {agent.name.charAt(0)}
                            </div>
                            <span className="text-sm">{agent.name}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Unassigned</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${
                          delivery.priority === 'high'
                            ? 'bg-destructive/15 text-destructive'
                            : delivery.priority === 'medium'
                            ? 'bg-warning/15 text-warning'
                            : 'bg-muted text-muted-foreground'
                        }`}>
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

      {filteredDeliveries.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No deliveries found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery ? 'Try adjusting your search or filters' : 'Create your first delivery order'}
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}
