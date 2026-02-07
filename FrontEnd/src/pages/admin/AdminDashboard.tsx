import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { DeliveryMap } from '@/components/DeliveryMap';
import { useDelivery } from '@/contexts/DeliveryContext';
import { warehouseLocation } from '@/data/mockData';
import { Users, Package, Clock, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboard() {
  const { agents, deliveries } = useDelivery();

  const availableAgents = agents.filter(a => a.status === 'available').length;
  const pendingDeliveries = deliveries.filter(d => d.status === 'pending').length;
  const activeAgents = agents.filter(a => a.status !== 'off-duty').slice(0, 4);
  const recentDeliveries = deliveries.slice(0, 5);

  const mapWaypoints = [
    { lat: warehouseLocation.lat, lng: warehouseLocation.lng, label: 'Central Warehouse', type: 'warehouse' as const },
    ...deliveries.slice(0, 4).map(d => ({
      lat: d.location.lat,
      lng: d.location.lng,
      label: d.location.address,
      type: 'delivery' as const,
    })),
  ];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's your delivery operations overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Delivery Agents" value={agents.length}
          subtitle={`${availableAgents} available`} icon={Users} variant="primary" />
        <StatCard title="Scheduled Deliveries" value={deliveries.length}
          subtitle={`${pendingDeliveries} pending`} icon={Package} variant="accent" />
        <StatCard title="In Transit" value={deliveries.filter(d => d.status === 'in-transit').length}
          icon={MapPin} variant="success" />
        <StatCard title="Completed Today" value={deliveries.filter(d => d.status === 'delivered').length}
          subtitle="Deliveries done" icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-accent" />Live Delivery Map
            </CardTitle>
            <CardDescription>Today's active delivery locations</CardDescription>
          </CardHeader>
          <CardContent>
            <DeliveryMap waypoints={mapWaypoints} showRoute={true} height="350px" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />Active Agents
            </CardTitle>
            <CardDescription>Currently on duty</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeAgents.map(agent => (
                <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                      {agent.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">{agent.id}</p>
                    </div>
                  </div>
                  <StatusBadge status={agent.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />Recent Deliveries
          </CardTitle>
          <CardDescription>Latest scheduled deliveries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Location</th>
                  <th>Scheduled Time</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentDeliveries.map(delivery => (
                  <tr key={delivery.id}>
                    <td className="font-medium">{delivery.orderId}</td>
                    <td>{delivery.location.customerName}</td>
                    <td className="max-w-[200px] truncate">{delivery.location.address}</td>
                    <td>{delivery.scheduledTime}</td>
                    <td>
                      <span className={`status-badge ${
                        delivery.priority === 'high' ? 'bg-destructive/15 text-destructive'
                        : delivery.priority === 'medium' ? 'bg-warning/15 text-warning'
                        : 'bg-muted text-muted-foreground'
                      }`}>{delivery.priority}</span>
                    </td>
                    <td><StatusBadge status={delivery.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
