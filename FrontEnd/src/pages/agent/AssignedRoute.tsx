import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { DeliveryMap } from '@/components/DeliveryMap';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useDelivery } from '@/contexts/DeliveryContext';
import { warehouseLocation } from '@/data/mockData';
import { Navigation, MapPin, Clock, Phone, User, FileText, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AssignedRoute() {
  const { user } = useAuth();
  const { getAgentDeliveries, optimizedRoutes, updateDeliveryStatus } = useDelivery();
  const agentId = user?.agentId || 'agent-001';

  const agentDeliveries = getAgentDeliveries(agentId).filter(d => d.status !== 'delivered');
  const routeData = optimizedRoutes[agentId];
  const orderedDeliveries = routeData ? routeData.sequence.filter(d => d.status !== 'delivered') : agentDeliveries;

  const waypoints = [
    { lat: warehouseLocation.lat, lng: warehouseLocation.lng, label: 'Central Warehouse (Start)', type: 'warehouse' as const },
    ...orderedDeliveries.map((d, i) => ({
      lat: d.location.lat, lng: d.location.lng,
      label: `${i + 1}. ${d.location.streetAddress}, ${d.location.area}`,
      type: d.status === 'in-transit' ? 'current' as const : 'delivery' as const,
    })),
    { lat: warehouseLocation.lat, lng: warehouseLocation.lng, label: 'Central Warehouse (End)', type: 'warehouse' as const },
  ];

  const currentDelivery = orderedDeliveries.find(d => d.status === 'in-transit') || orderedDeliveries[0];

  const handleMarkDelivered = (deliveryId: string) => {
    updateDeliveryStatus(deliveryId, 'delivered');
    toast.success('Delivery marked as completed!');
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Assigned Route</h1>
          <p className="text-muted-foreground mt-1">{orderedDeliveries.length} deliveries remaining today</p>
        </div>
        <Button className="gap-2" onClick={() => toast.info('Navigation started!')}>
          <Navigation className="h-4 w-4" />Start Navigation
        </Button>
      </div>

      {orderedDeliveries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No deliveries assigned</h3>
            <p className="text-sm text-muted-foreground mt-1">Check back later for new assignments</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-accent" />Route Map
              </CardTitle>
              <CardDescription>
                {routeData ? 'Optimized delivery route' : 'Your delivery route'}
              </CardDescription>
            </CardHeader>
            <CardContent>
                     <DeliveryMap
                      waypoints={waypoints}
                      showRoute={!routeData}
                      originalRoute={!routeData ? undefined : [
                      { lat: warehouseLocation.lat, lng: warehouseLocation.lng },
                      ...agentDeliveries.map(d => ({
      lat: d.location.lat,
      lng: d.location.lng
    })),
    { lat: warehouseLocation.lat, lng: warehouseLocation.lng }
  ]}
  optimizedRoute={!routeData ? undefined : [
    { lat: warehouseLocation.lat, lng: warehouseLocation.lng },
    ...routeData.sequence.map(d => ({
      lat: d.location.lat,
      lng: d.location.lng
    })),
    { lat: warehouseLocation.lat, lng: warehouseLocation.lng }
  ]}
  height="500px"
/>
              <div className="flex items-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Warehouse</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-warning" />
                  <span className="text-muted-foreground">Current Stop</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-accent" />
                  <span className="text-muted-foreground">Delivery Point</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {currentDelivery && (
              <Card className="ring-2 ring-accent">   
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Current Delivery</CardTitle>
                    <StatusBadge status={currentDelivery.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="font-medium">{currentDelivery.location.customerName}</p>
                      <p className="text-sm text-muted-foreground">{currentDelivery.orderId}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <p className="text-sm">{currentDelivery.location.streetAddress}, {currentDelivery.location.area}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                    <p className="text-sm">{currentDelivery.location.phone}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground mt-1" />
                    <p className="text-sm">Scheduled: {currentDelivery.scheduledTime}</p>
                  </div>
                  {currentDelivery.location.notes && (
                    <div className="flex items-start gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                      <p className="text-sm text-muted-foreground">{currentDelivery.location.notes}</p>
                    </div>
                  )}
                  <div className="pt-3 border-t">
                    <Button className="w-full" onClick={() => handleMarkDelivered(currentDelivery.id)}>
                      Mark as Delivered
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Delivery Sequence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/10">
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">🏢</div>
                    <span className="text-sm font-medium">Start: Warehouse</span>
                  </div>
                  {orderedDeliveries.map((delivery, index) => (
                    <div key={delivery.id} className="relative">
                      <div className="absolute left-4 top-10 bottom-0 w-px bg-border" />
                      <div className={`flex items-center gap-3 p-2 rounded-lg ${
                        delivery.status === 'in-transit' ? 'bg-accent/10 ring-1 ring-accent' : 'hover:bg-muted/50'
                      }`}>
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          delivery.status === 'in-transit' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                        }`}>{index + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{delivery.location.customerName}</p>
                          <p className="text-xs text-muted-foreground">{delivery.scheduledTime}</p>
                        </div>
                        {delivery.status === 'in-transit' && <ArrowRight className="h-4 w-4 text-accent" />}
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/10">
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">🏢</div>
                    <span className="text-sm font-medium">End: Warehouse</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
