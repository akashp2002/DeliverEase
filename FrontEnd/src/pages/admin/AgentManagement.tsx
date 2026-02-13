import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Plus, Search, Phone, Mail, Trash2, User, Loader } from 'lucide-react';
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

interface Agent {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone: string;
  status: 'available' | 'on-delivery' | 'off-duty';
  role: string;
}

export default function AgentManagement() {
  const { isAuthenticated } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [newAgent, setNewAgent] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    status: 'available' as Agent['status'],
  });

  // Fetch agents from backend
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setIsFetching(true);
        const response = await api.get('/agents');

        if (response.data.success) {
          setAgents(response.data.data);
        } else {
          toast.error(response.data.message || 'Failed to fetch agents');
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to fetch agents');
        console.error(error);
      } finally {
        setIsFetching(false);
      }
    };

    if (isAuthenticated) {
      fetchAgents();
    }
  }, [isAuthenticated]);

  const filteredAgents = agents.filter(
    agent =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddAgent = async () => {
    if (!newAgent.name || !newAgent.email || !newAgent.phone || !newAgent.password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);

      const response = await api.post('/agents', {
        name: newAgent.name,
        email: newAgent.email,
        phone: newAgent.phone,
        password: newAgent.password,
        status: newAgent.status,
      });

      if (response.data.success) {
        setAgents([...agents, response.data.data]);
        setNewAgent({ name: '', email: '', phone: '', password: '', status: 'available' });
        setIsAddDialogOpen(false);
        toast.success('Agent created successfully');
      } else {
        toast.error(response.data.message || 'Failed to create agent');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create agent');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    try {
      setIsLoading(true);

      const response = await api.delete(`/agents/${agentId}`);

      if (response.data.success) {
        setAgents(agents.filter(agent => agent._id !== agentId));
        toast.success('Agent removed successfully');
      } else {
        toast.error(response.data.message || 'Failed to delete agent');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete agent');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (agentId: string, status: Agent['status']) => {
    try {
      setIsLoading(true);

      const response = await api.put(`/agents/${agentId}/status`, { status });

      if (response.data.success) {
        setAgents(agents.map(agent =>
          agent._id === agentId ? { ...agent, status } : agent
        ));
        toast.success('Agent status updated');
      } else {
        toast.error(response.data.message || 'Failed to update status');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
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
            <Button className="gap-2" disabled={isLoading}>
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
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })} disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="agent@example.com" value={newAgent.email}
                  onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })} disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="+91 " value={newAgent.phone}
                  onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })} disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Enter password" value={newAgent.password}
                  onChange={(e) => setNewAgent({ ...newAgent, password: e.target.value })} disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Initial Status</Label>
                <Select value={newAgent.status}
                  onValueChange={(value) => setNewAgent({ ...newAgent, status: value as Agent['status'] })} disabled={isLoading}>
                  <SelectTrigger disabled={isLoading}><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="on-delivery">On Delivery</SelectItem>
                    <SelectItem value="off-duty">Off Duty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isLoading}>Cancel</Button>
              <Button onClick={handleAddAgent} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                    Adding...
                  </>
                ) : (
                  'Add Agent'
                )}
              </Button>
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

      {/* Loading State */}
      {isFetching && (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading agents...</span>
        </div>
      )}

      {/* Agent Cards Grid */}
      {!isFetching && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map(agent => (
            <Card key={agent._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-semibold">
                      {agent.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <CardDescription>{agent._id}</CardDescription>
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

                  {/* Status Update */}
                  <div className="pt-3 border-t">
                    <Label className="text-xs text-muted-foreground mb-2 block">Update Status</Label>
                    <Select value={agent.status}
                      onValueChange={(value) => handleStatusChange(agent._id, value as Agent['status'])}>
                      <SelectTrigger className="h-9" disabled={isLoading}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="on-delivery">On Delivery</SelectItem>
                        <SelectItem value="off-duty">Off Duty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 gap-1 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteAgent(agent._id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-3 w-3" />Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredAgents.length === 0 && !isFetching && (
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
