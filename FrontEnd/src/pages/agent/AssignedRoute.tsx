import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { DeliveryMap } from '@/components/DeliveryMap';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useDelivery } from '@/contexts/DeliveryContext';
import { useRoute } from '@/contexts/RouteContext';
import { useTracking } from '@/hooks/useTracking';
import { warehouseLocation } from '@/data/mockData';
import { Navigation, MapPin, Clock, Phone, User, FileText, ArrowRight, Route } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigation } from '@/hooks/useNavigation';
import { NavigationPanel } from '@/components/NavigationPanel';

export default function AssignedRoute() {
  const { user } = useAuth();
  const { getAgentDeliveries, updateDeliveryStatus } = useDelivery();
  const { optimizedRoutes, agentLocation } = useRoute();
  const { isTracking, startTracking, stopTracking } = useTracking();
  const agentId = user?.agentId || 'agent-001';

  const agentDeliveries = getAgentDeliveries(agentId).filter(d => d.status !== 'delivered');
  const routeData = optimizedRoutes[agentId];
  const orderedDeliveries = routeData ? routeData.sequence.filter(d => d.status !== 'delivered') : agentDeliveries;

  // Extract navigation waypoints from remaining deliveries
  const navWaypoints = orderedDeliveries.map(d => ({ lat: d.location.lat, lng: d.location.lng }));

  // Use navigation hook
  const navProps = useNavigation(
    navWaypoints,
    agentLocation,
    isTracking
  );

  const waypoints: Array<{
    lat: number;
    lng: number;
    label?: string;
    type: 'warehouse' | 'delivery' | 'current' | 'agent';
  }> = [];

  // Start route from Agent Location if tracking, otherwise from Warehouse
  if (agentLocation) {
    waypoints.push({
      lat: agentLocation.lat,
      lng: agentLocation.lng,
      label: 'Your Current Location',
      type: 'agent' as const
    });
  } else {
    waypoints.push({
      lat: warehouseLocation.lat,
      lng: warehouseLocation.lng,
      label: 'Central Warehouse (Start)',
      type: 'warehouse' as const
    });
  }

  // Add remaining deliveries
  waypoints.push(
    ...orderedDeliveries.map((d, i) => ({
      lat: d.location.lat,
      lng: d.location.lng,
      label: `${i + 1}. ${d.location.streetAddress}, ${d.location.area}`,
      type: d.status === 'in-transit' ? 'current' as const : 'delivery' as const,
    }))
  );

  // Always end at the Warehouse
  waypoints.push({ lat: warehouseLocation.lat, lng: warehouseLocation.lng, label: 'Central Warehouse (End)', type: 'warehouse' as const });

  const currentDelivery = orderedDeliveries.find(d => d.status === 'in-transit') || orderedDeliveries[0];

  const handleMarkDelivered = (deliveryId: string) => {
    updateDeliveryStatus(deliveryId, 'delivered');
    toast.success('Delivery marked as completed!');
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8 mt-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent pb-1">Assigned Route</h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse"></span>
            {orderedDeliveries.length} deliveries remaining today
          </p>
        </div>
        <Button
          size="lg"
          className={`gap-3 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl rounded-full px-8 ${isTracking
            ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/25"
            : "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-primary/25"
            }`}
          onClick={isTracking ? stopTracking : startTracking}
        >
          {isTracking ? (
            <>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              Stop Navigation
            </>
          ) : (
            <>
              <Navigation className="h-5 w-5" />
              Start Navigation
            </>
          )}
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
          <Card className="lg:col-span-2 border-border/50 shadow-md overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <MapPin className="h-5 w-5 text-accent" />
                </div>
                Live Route Map
              </CardTitle>
              <CardDescription className="text-base">
                {routeData ? 'Following AI optimized delivery sequence' : 'Following standard delivery sequence'}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative p-0">
              {isTracking && (
                <div className="absolute top-4 left-4 right-4 z-[1000] drop-shadow-xl animate-in slide-in-from-top-4 fade-in duration-500">
                  <NavigationPanel navState={navProps} formatDistance={navProps.formatDistance} />
                </div>
              )}
              <DeliveryMap
                waypoints={waypoints}
                showRoute={true}
                showOptimizedRoute={!!routeData}
                routeCoordinates={isTracking ? navProps.routeCoordinates : undefined}
                height="600px"
              />
              <div className="absolute bottom-6 left-6 z-[1000] bg-background/90 backdrop-blur-md px-4 py-3 rounded-xl border border-border shadow-lg flex items-center gap-6 text-sm font-medium">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
                  <span className="text-foreground">Warehouse</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-warning"></span>
                  </div>
                  <span className="text-foreground">Next Stop</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-accent shadow-[0_0_8px_rgba(var(--accent),0.6)]" />
                  <span className="text-foreground">Delivery Point</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {currentDelivery && (
              <Card className="border-accent/30 shadow-lg shadow-accent/5 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-primary" />
                <CardHeader className="pb-3 bg-accent/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                      </span>
                      <CardTitle className="text-lg">Next Delivery</CardTitle>
                    </div>
                    <StatusBadge status={currentDelivery.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 pt-5">
                  <div className="flex gap-4 p-3 rounded-xl bg-muted/30 border border-border/50">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{currentDelivery.location.customerName}</p>
                      <p className="text-sm text-muted-foreground font-mono mt-0.5">{currentDelivery.orderId}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 pl-2">
                    <div className="flex items-start gap-3 group">
                      <MapPin className="h-5 w-5 text-accent mt-0.5 group-hover:scale-110 transition-transform" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{currentDelivery.location.streetAddress}</p>
                        <p className="text-sm text-muted-foreground">{currentDelivery.location.area}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 group">
                      <Phone className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <p className="text-sm font-medium">{currentDelivery.location.phone}</p>
                    </div>
                    <div className="flex items-center gap-3 group">
                      <Clock className="h-5 w-5 text-muted-foreground group-hover:text-warning transition-colors" />
                      <p className="text-sm font-medium">Scheduled: <span className="text-foreground">{currentDelivery.scheduledTime}</span></p>
                    </div>
                    {currentDelivery.location.notes && (
                      <div className="flex items-start gap-3 bg-warning/10 p-3 rounded-lg border border-warning/20">
                        <FileText className="h-5 w-5 text-warning shrink-0" />
                        <p className="text-sm text-warning-foreground font-medium">{currentDelivery.location.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-border/50">
                    <Button
                      size="lg"
                      className="w-full font-semibold tracking-wide shadow-md hover:shadow-lg transition-all"
                      onClick={() => handleMarkDelivered(currentDelivery.id)}
                    >
                      Mark as Delivered
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-md">
                    <Route className="h-4 w-4 text-primary" />
                  </div>
                  Route Sequence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 relative">
                  <div className="absolute left-[1.15rem] top-8 bottom-8 w-0.5 bg-gradient-to-b from-primary via-border to-primary rounded-full opacity-50" />

                  <div className="flex items-center gap-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-bold shadow-md z-10 transition-transform hover:scale-110">🏢</div>
                    <span className="text-sm font-semibold text-primary">Start: Central Warehouse</span>
                  </div>

                  <div className="py-2 space-y-2">
                    {orderedDeliveries.map((delivery, index) => {
                      const isActive = delivery.status === 'in-transit';
                      return (
                        <div key={delivery.id} className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${isActive
                          ? 'bg-accent/10 border-accent/20 border shadow-sm translate-x-1'
                          : 'hover:bg-muted/50 border border-transparent hover:border-border/50'
                          }`}>
                          <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm z-10 transition-transform hover:scale-110 ${isActive
                            ? 'bg-accent text-accent-foreground ring-4 ring-accent/20'
                            : 'bg-background border-2 border-muted-foreground/30 text-muted-foreground'
                            }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${isActive ? 'text-accent-foreground' : 'text-foreground'}`}>
                              {delivery.location.customerName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {delivery.scheduledTime}
                            </p>
                          </div>
                          {isActive && <ArrowRight className="h-5 w-5 text-accent animate-pulse" />}
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex items-center gap-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-bold shadow-md z-10 transition-transform hover:scale-110">🏢</div>
                    <span className="text-sm font-semibold text-primary">End: Central Warehouse</span>
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
