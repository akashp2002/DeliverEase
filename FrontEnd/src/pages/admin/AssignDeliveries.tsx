import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { useDelivery } from '@/contexts/DeliveryContext';
import { formatFullAddress } from '@/lib/utils';
import { Users, Package, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AssignDeliveries() {
  const { agents, deliveries } = useDelivery();

  // Group deliveries by agent
  const agentDeliveryMap = agents.map(agent => ({
    agent,
    deliveries: deliveries.filter(d => d.agentId === agent.id),
  }));

  const unassignedDeliveries = deliveries.filter(d => !d.agentId);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Assign Deliveries</h1>
        <p className="text-muted-foreground mt-1">
          View deliveries grouped by assigned delivery agent
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{agents.length}</p>
              <p className="text-sm text-muted-foreground">Total Agents</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-accent/10">
              <Package className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{deliveries.length}</p>
              <p className="text-sm text-muted-foreground">Total Deliveries</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-warning/10">
              <Package className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{unassignedDeliveries.length}</p>
              <p className="text-sm text-muted-foreground">Unassigned</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent-wise delivery groups */}
      <div className="space-y-6">
        {agentDeliveryMap.map(({ agent, deliveries: agentDels }) => (
          <Card key={agent.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                    {agent.name.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <CardDescription>
                      {agent.id} • <StatusBadge status={agent.status} />
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{agentDels.length}</p>
                  <p className="text-xs text-muted-foreground">Assigned Deliveries</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {agentDels.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Address</th>
                        <th>Time</th>
                        <th>Priority</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agentDels.map((del, idx) => (
                        <tr key={del.id}>
                          <td>{idx + 1}</td>
                          <td className="font-medium">{del.orderId}</td>
                          <td>{del.location.customerName}</td>
                          <td className="max-w-[200px] truncate" title={formatFullAddress(del.location)}>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              {formatFullAddress(del.location)}
                            </span>
                          </td>
                          <td>
                            <span className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {del.scheduledTime}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${
                              del.priority === 'high'
                                ? 'bg-destructive/15 text-destructive'
                                : del.priority === 'medium'
                                ? 'bg-warning/15 text-warning'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {del.priority}
                            </span>
                          </td>
                          <td><StatusBadge status={del.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No deliveries assigned to this agent yet.
                </p>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Unassigned Deliveries */}
        {unassignedDeliveries.length > 0 && (
          <Card className="border-warning/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-warning" />
                Unassigned Deliveries
              </CardTitle>
              <CardDescription>
                These deliveries have not been assigned to any agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Address</th>
                      <th>Area</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unassignedDeliveries.map(del => (
                      <tr key={del.id}>
                        <td className="font-medium">{del.orderId}</td>
                        <td>{del.location.customerName}</td>
                        <td className="max-w-[200px] truncate" title={formatFullAddress(del.location)}>
                          {formatFullAddress(del.location)}
                        </td>
                        <td>{del.area}</td>
                        <td>{del.scheduledTime}</td>
                        <td><StatusBadge status={del.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
