import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { DeliveryMap } from '@/components/DeliveryMap';
import { useAuth } from '@/contexts/AuthContext';
import { useDelivery } from '@/contexts/DeliveryContext';
import { useRoute } from '@/contexts/RouteContext';
import { warehouseLocation } from '@/data/mockData';
import { Zap, Route, TrendingDown, MapPin, ArrowRight, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AgentRouteOptimization() {
  const { user } = useAuth();
  const { getAgentDeliveries } = useDelivery();
  const { optimizeRoute, optimizedRoutes } = useRoute();
  const agentId = user?.agentId || 'agent-001';

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showOptimized, setShowOptimized] = useState(false);

  const agentDeliveries = getAgentDeliveries(agentId).filter(d => d.status !== 'delivered');
  const routeData = optimizedRoutes[agentId];

  // Original waypoints (in assignment order)
  const originalWaypoints = [
    { lat: warehouseLocation.lat, lng: warehouseLocation.lng, label: 'Warehouse (Start)', type: 'warehouse' as const },
    ...agentDeliveries.map((d, i) => ({
      lat: d.location.lat, lng: d.location.lng,
      label: `${i + 1}. ${d.location.streetAddress}, ${d.location.area}`, type: 'delivery' as const,
    })),
    { lat: warehouseLocation.lat, lng: warehouseLocation.lng, label: 'Warehouse (End)', type: 'warehouse' as const },
  ];

  // Optimized waypoints (after NN algorithm)
  const optimizedWaypoints = routeData ? [
    { lat: warehouseLocation.lat, lng: warehouseLocation.lng, label: 'Warehouse (Start)', type: 'warehouse' as const },
    ...routeData.sequence.map((d, i) => ({
      lat: d.location.lat, lng: d.location.lng,
      label: `${i + 1}. ${d.location.streetAddress}, ${d.location.area}`, type: 'delivery' as const,
    })),
    { lat: warehouseLocation.lat, lng: warehouseLocation.lng, label: 'Warehouse (End)', type: 'warehouse' as const },
  ] : [];

  const handleOptimize = async () => {
    setIsOptimizing(true);
    // Simulate computation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    const result = await optimizeRoute(agentId);
    setIsOptimizing(false);
    setShowOptimized(true);

    const saved = result.totalDistance - result.optimizedDistance;
    const pct = ((saved / result.totalDistance) * 100).toFixed(1);
    toast.success(`Route optimized! Distance reduced by ${pct}% (${saved.toFixed(1)} km saved)`);
  };

  const distanceSaved = routeData ? routeData.totalDistance - routeData.optimizedDistance : 0;
  const pctSaved = routeData ? ((distanceSaved / routeData.totalDistance) * 100).toFixed(1) : '0';

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Route Optimization</h1>
          <p className="text-muted-foreground mt-1">
            Optimize delivery sequence using Nearest-Neighbor heuristic & Dijkstra's shortest path
          </p>
        </div>
        <Button onClick={handleOptimize} disabled={isOptimizing || agentDeliveries.length === 0} className="gap-2">
          <Zap className="h-4 w-4" />
          {isOptimizing ? 'Computing Optimal Route...' : 'Optimize Route'}
        </Button>
      </div>

      {agentDeliveries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Route className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No pending deliveries</h3>
            <p className="text-sm text-muted-foreground mt-1">All your deliveries are completed!</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Algorithm Info */}
          <Card className="mb-6 bg-muted/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Algorithm:</strong> The system uses <span className="text-foreground font-medium">Nearest-Neighbor heuristic</span> to
                determine the optimal delivery order by always visiting the closest unvisited location next.
                Distance calculations use the <span className="text-foreground font-medium">Haversine formula</span> (geographic shortest path / Dijkstra's approach)
                to compute real-world distances between delivery points.
              </p>
            </CardContent>
          </Card>

          {/* Stats Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className={showOptimized ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-destructive" />
                  Original Route
                </CardTitle>
                <CardDescription>Before optimization (assignment order)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-2xl font-bold">{routeData ? routeData.totalDistance : '--'} km</p>
                    <p className="text-sm text-muted-foreground">Total Distance</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{routeData ? routeData.totalTime : '--'} min</p>
                    <p className="text-sm text-muted-foreground">Est. Time</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{agentDeliveries.length}</p>
                    <p className="text-sm text-muted-foreground">Stops</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={!showOptimized ? 'opacity-40' : 'ring-2 ring-success'}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-success" />
                  Optimized Route
                  {showOptimized && (
                    <span className="ml-auto text-sm font-normal text-success flex items-center gap-1">
                      <TrendingDown className="h-4 w-4" />{pctSaved}% shorter
                    </span>
                  )}
                </CardTitle>
                <CardDescription>After Nearest-Neighbor optimization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-success">{routeData ? routeData.optimizedDistance : '--'} km</p>
                    <p className="text-sm text-muted-foreground">Total Distance</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-success">{routeData ? routeData.optimizedTime : '--'} min</p>
                    <p className="text-sm text-muted-foreground">Est. Time</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{showOptimized ? agentDeliveries.length : '--'}</p>
                    <p className="text-sm text-muted-foreground">Stops</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Map */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-accent" />Route Visualization
              </CardTitle>
              <CardDescription>
                {showOptimized
                  ? 'Comparing original (dashed red) vs optimized (solid green) routes'
                  : 'Click "Optimize Route" to generate the optimal delivery sequence'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeliveryMap
                waypoints={showOptimized ? optimizedWaypoints : originalWaypoints}
                showRoute={true}
                showOptimizedRoute={showOptimized}
                height="450px"
              />
              {showOptimized && (
                <div className="flex items-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-8 rounded bg-destructive opacity-60"
                      style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, white 4px, white 8px)' }} />
                    <span className="text-muted-foreground">Original Route</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-8 rounded bg-success" />
                    <span className="text-muted-foreground">Optimized Route</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Sequence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5 text-accent" />
                Delivery Sequence {showOptimized ? '(Optimized)' : '(Original)'}
              </CardTitle>
              <CardDescription>
                {showOptimized ? 'Optimized order for minimum distance' : 'Current delivery order'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                  🏢 Warehouse
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                {(showOptimized && routeData ? routeData.sequence : agentDeliveries).map((delivery, index) => (
                  <div key={delivery.id} className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-2 bg-accent/10 text-accent rounded-lg text-sm">
                      <span className="font-medium">{index + 1}.</span>
                      <span className="max-w-[150px] truncate">{delivery.location.customerName}</span>
                    </div>
                    {index < agentDeliveries.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                  🏢 Warehouse
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
}
