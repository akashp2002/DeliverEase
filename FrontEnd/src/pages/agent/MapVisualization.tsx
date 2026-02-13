import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { DeliveryMap } from '@/components/DeliveryMap';
import { useAuth } from '@/contexts/AuthContext';
import { useDelivery } from '@/contexts/DeliveryContext';
import { warehouseLocation } from '@/data/mockData';
import { Map, MapPin, Navigation } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function MapVisualization() {
  const { user } = useAuth();
  const { getAgentDeliveries, optimizedRoutes } = useDelivery();
  const navigate = useNavigate();
  const agentId = user?.agentId || 'agent-001';

  const agentDeliveries = getAgentDeliveries(agentId).filter(d => d.status !== 'delivered');
  const routeData = optimizedRoutes[agentId];

  // Use optimized sequence if available, otherwise assignment order
  const orderedDeliveries = routeData ? routeData.sequence : agentDeliveries;

  const waypoints = [
    { lat: warehouseLocation.lat, lng: warehouseLocation.lng, label: 'Central Warehouse (Start)', type: 'warehouse' as const },
    ...orderedDeliveries.map((d, i) => ({
      lat: d.location.lat,
      lng: d.location.lng,
      label: `${i + 1}. ${d.location.customerName} — ${d.location.streetAddress}, ${d.location.area}`,
      type: d.status === 'in-transit' ? 'current' as const : 'delivery' as const,
    })),
    { lat: warehouseLocation.lat, lng: warehouseLocation.lng, label: 'Central Warehouse (End)', type: 'warehouse' as const },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Map Visualization</h1>
          <p className="text-muted-foreground mt-1">
            {routeData ? 'Showing optimized delivery route on map' : 'Showing delivery locations — optimize route for best path'}
          </p>
        </div>
        {!routeData && (
          <Button onClick={() => navigate('/agent/optimize')} className="gap-2">
            <Navigation className="h-4 w-4" />
            Optimize Route First
          </Button>
        )}
      </div>

      {agentDeliveries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Map className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No deliveries to show</h3>
            <p className="text-sm text-muted-foreground mt-1">No pending deliveries assigned.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Full Map */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-accent" />
                Delivery Route Map
              </CardTitle>
              <CardDescription>
                {routeData
                  ? `Optimized route: ${routeData.optimizedDistance} km • ${routeData.optimizedTime} min estimated`
                  : `${agentDeliveries.length} delivery points`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeliveryMap
                waypoints={waypoints}
                showRoute={true}
                height="500px"
              />
              <div className="flex items-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Warehouse (Start/End)</span>
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

          {/* Delivery Points List */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Points Sequence</CardTitle>
              <CardDescription>
                {routeData ? 'Ordered by optimized route' : 'In assignment order'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Seq</th>
                      <th>Customer</th>
                      <th>Address</th>
                      <th>Lat</th>
                      <th>Lng</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderedDeliveries.map((d, idx) => (
                      <tr key={d.id}>
                        <td className="font-bold text-accent">{idx + 1}</td>
                        <td className="font-medium">{d.location.customerName}</td>
                        <td className="max-w-[200px] truncate">{d.location.streetAddress}, {d.location.area}</td>
                        <td className="text-xs text-muted-foreground">{d.location.lat.toFixed(4)}</td>
                        <td className="text-xs text-muted-foreground">{d.location.lng.toFixed(4)}</td>
                        <td>{d.scheduledTime}</td>
                        <td>
                          <span className={`status-badge ${
                            d.status === 'in-transit' ? 'bg-accent/15 text-accent'
                            : d.status === 'pending' ? 'bg-warning/15 text-warning'
                            : 'bg-muted text-muted-foreground'
                          }`}>{d.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
}
