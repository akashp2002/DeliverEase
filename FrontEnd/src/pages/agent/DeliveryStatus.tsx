import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useDelivery } from '@/contexts/DeliveryContext';
import { ScheduledDelivery } from '@/data/mockData';
import { CheckCircle, Clock, Package, MapPin, Phone, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

export default function DeliveryStatus() {
  const { user } = useAuth();
  const { getAgentDeliveries, updateDeliveryStatus, optimizedRoutes } = useDelivery();
  const agentId = user?.agentId || 'agent-001';
  const [filter, setFilter] = useState<string>('all');

  const agentDeliveries = getAgentDeliveries(agentId);
  const routeData = optimizedRoutes[agentId];

  // Show in optimized order if available
  const orderedDeliveries = routeData
    ? [...routeData.sequence, ...agentDeliveries.filter(d => d.status === 'delivered')]
    : agentDeliveries;

  const filteredDeliveries = filter === 'all'
    ? orderedDeliveries
    : orderedDeliveries.filter(d => d.status === filter);

  const handleStatusUpdate = (deliveryId: string, newStatus: ScheduledDelivery['status']) => {
    updateDeliveryStatus(deliveryId, newStatus);
    const msgs: Record<string, string> = {
      delivered: 'Delivery marked as completed!',
      'in-transit': 'Delivery marked as in transit.',
      pending: 'Delivery marked as pending.',
      failed: 'Delivery marked as failed.',
    };
    toast.success(msgs[newStatus]);
  };

  const stats = {
    total: agentDeliveries.length,
    pending: agentDeliveries.filter(d => d.status === 'pending').length,
    inTransit: agentDeliveries.filter(d => d.status === 'in-transit').length,
    delivered: agentDeliveries.filter(d => d.status === 'delivered').length,
    failed: agentDeliveries.filter(d => d.status === 'failed').length,
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Delivery Status</h1>
        <p className="text-muted-foreground mt-1">Update and track your delivery progress</p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { key: 'all', label: 'Total', value: stats.total, icon: Package, color: '' },
          { key: 'pending', label: 'Pending', value: stats.pending, icon: Clock, color: 'ring-warning' },
          { key: 'in-transit', label: 'In Transit', value: stats.inTransit, icon: MapPin, color: 'ring-accent' },
          { key: 'delivered', label: 'Delivered', value: stats.delivered, icon: CheckCircle, color: 'ring-success' },
          { key: 'failed', label: 'Failed', value: stats.failed, icon: X, color: 'ring-destructive' },
        ].map(s => (
          <Card key={s.key}
            className={`cursor-pointer transition-all ${filter === s.key ? `ring-2 ${s.color || 'ring-accent'}` : ''}`}
            onClick={() => setFilter(s.key)}>
            <CardContent className="p-4 text-center">
              <s.icon className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delivery List */}
      <Card>
        <CardHeader>
          <CardTitle>All Deliveries</CardTitle>
          <CardDescription>
            {routeData ? 'Shown in optimized order' : 'Update delivery status below'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDeliveries.length > 0 ? (
            <div className="space-y-4">
              {filteredDeliveries.map((delivery, idx) => (
                <div key={delivery.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  {routeData && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground text-sm font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{delivery.orderId}</span>
                          <StatusBadge status={delivery.status} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{delivery.location.customerName}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{delivery.location.streetAddress}, {delivery.location.area}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />{delivery.location.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />{delivery.scheduledTime}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                    {delivery.status !== 'delivered' && (
                      <Button size="sm" onClick={() => handleStatusUpdate(delivery.id, 'delivered')} className="gap-1">
                        <CheckCircle className="h-3 w-3" />Delivered
                      </Button>
                    )}
                    {delivery.status === 'pending' && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(delivery.id, 'in-transit')} className="gap-1">
                        <MapPin className="h-3 w-3" />Start
                      </Button>
                    )}
                    {delivery.status !== 'failed' && delivery.status !== 'delivered' && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(delivery.id, 'failed')}
                        className="gap-1 text-destructive hover:text-destructive">
                        <X className="h-3 w-3" />Failed
                      </Button>
                    )}
                    {(delivery.status === 'delivered' || delivery.status === 'failed') && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(delivery.id, 'pending')} className="gap-1">
                        <Clock className="h-3 w-3" />Reset
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">No deliveries found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {filter !== 'all' ? 'Try selecting a different filter' : 'No deliveries assigned yet'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
