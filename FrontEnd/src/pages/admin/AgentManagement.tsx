import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { useDelivery } from '@/contexts/DeliveryContext';
import { DeliveryAgent } from '@/data/mockData';
import { Plus, Search, Phone, Mail, Edit, Trash2, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function AgentManagement() {
  const { agents, addAgent, removeAgent, updateAgentStatus, getAgentDeliveries } = useDelivery();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'available' as DeliveryAgent['status'],
  });

  const filteredAgents = agents.filter(
    agent =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddAgent = () => {
    if (!newAgent.name || !newAgent.email || !newAgent.phone) {
      toast.error('Please fill in all fields');
      return;
    }
    addAgent(newAgent);
    setNewAgent({ name: '', email: '', phone: '', status: 'available' });
    setIsAddDialogOpen(false);
    toast.success('Delivery agent added successfully');
  };

  const handleDeleteAgent = (agentId: string) => {
    removeAgent(agentId);
    toast.success('Agent removed successfully');
  };

  const handleStatusChange = (agentId: string, status: DeliveryAgent['status']) => {
    updateAgentStatus(agentId, status);
    toast.success('Agent status updated');
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Delivery Agents</h1>
          <p className="text-muted-foreground mt-1">Manage your delivery team</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add New Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Delivery Agent</DialogTitle>
              <DialogDescription>Enter the details of the new delivery agent.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Enter agent's full name" value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="agent@example.com" value={newAgent.email}
                  onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="+91 98765 43210" value={newAgent.phone}
                  onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Initial Status</Label>
                <Select value={newAgent.status}
                  onValueChange={(value) => setNewAgent({ ...newAgent, status: value as DeliveryAgent['status'] })}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="on-delivery">On Delivery</SelectItem>
                    <SelectItem value="off-duty">Off Duty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddAgent}>Add Agent</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search agents by name or email..." value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map(agent => {
          const agentDels = getAgentDeliveries(agent.id);
          return (
            <Card key={agent.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-semibold">
                      {agent.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <CardDescription>{agent.id}</CardDescription>
                    </div>
                  </div>
                  <StatusBadge status={agent.status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" /><span>{agent.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" /><span>{agent.phone}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Assigned: </span>
                      <span className="font-medium">{agentDels.length}</span>
                      <span className="text-muted-foreground"> deliveries</span>
                    </div>
                  </div>

                  {/* Status Update */}
                  <div className="pt-3 border-t">
                    <Label className="text-xs text-muted-foreground mb-2 block">Update Status</Label>
                    <Select value={agent.status}
                      onValueChange={(value) => handleStatusChange(agent.id, value as DeliveryAgent['status'])}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="on-delivery">On Delivery</SelectItem>
                        <SelectItem value="off-duty">Off Duty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteAgent(agent.id)}>
                      <Trash2 className="h-3 w-3" />Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No agents found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery ? 'Try a different search term' : 'Add your first delivery agent to get started'}
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}
