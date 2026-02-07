import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useDelivery } from '@/contexts/DeliveryContext';
import { Package, CheckCircle, Clock, MapPin, TrendingUp, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AgentDashboard() {
  const { user } = useAuth();
  const { getAgentDeliveries, optimizedRoutes } = useDelivery();
  const navigate = useNavigate();
  const agentId = user?.agentId || 'agent-001';

  const agentDeliveries = getAgentDeliveries(agentId);
  const pendingDeliveries = agentDeliveries.filter(d => d.status === 'pending');
  const inTransitDeliveries = agentDeliveries.filter(d => d.status === 'in-transit');
  const completedDeliveries = agentDeliveries.filter(d => d.status === 'delivered');
  const hasOptimizedRoute = !!optimizedRoutes[agentId];

  const upcomingDeliveries = agentDeliveries.filter(d => d.status !== 'delivered').slice(0, 5);

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user?.name.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground mt-1">Here's your delivery schedule for today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Assigned Deliveries" value={agentDeliveries.length} subtitle="For today" icon={Package} variant="primary" />
        <StatCard title="Pending" value={pendingDeliveries.length} subtitle="Waiting to start" icon={Clock} variant="default" />
        <StatCard title="In Transit" value={inTransitDeliveries.length} subtitle="On the way" icon={MapPin} variant="accent" />
        <StatCard title="Completed" value={completedDeliveries.length}
          subtitle={`${Math.round((completedDeliveries.length / (agentDeliveries.length || 1)) * 100)}% completion rate`}
          icon={CheckCircle} variant="success" />
      </div>

      {/* Optimize Route CTA */}
      <Card className="mb-8 bg-gradient-to-r from-accent/10 to-accent/5 border-accent/20">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" />
              {hasOptimizedRoute ? 'Route Optimized!' : 'Optimize Your Route'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {hasOptimizedRoute
                ? `Saved ${(optimizedRoutes[agentId].totalDistance - optimizedRoutes[agentId].optimizedDistance).toFixed(1)} km with optimization`
                : 'Use Nearest-Neighbor and Dijkstra\'s algorithm to find the shortest delivery path'}
            </p>
          </div>
          <Button onClick={() => navigate('/agent/optimize')} className="gap-2">
            <Zap className="h-4 w-4" />
            {hasOptimizedRoute ? 'View Optimized Route' : 'Optimize Route'}
          </Button>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />Today's Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Delivery Progress</span>
              <span className="font-medium">{completedDeliveries.length} / {agentDeliveries.length} completed</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-accent to-success rounded-full transition-all duration-500"
                style={{ width: `${(completedDeliveries.length / (agentDeliveries.length || 1)) * 100}%` }} />
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success" />
                <span className="text-muted-foreground">Completed: {completedDeliveries.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-accent" />
                <span className="text-muted-foreground">In Transit: {inTransitDeliveries.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-warning" />
                <span className="text-muted-foreground">Pending: {pendingDeliveries.length}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Deliveries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />Upcoming Deliveries
          </CardTitle>
          <CardDescription>Your next scheduled deliveries</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingDeliveries.length > 0 ? (
            <div className="space-y-4">
              {upcomingDeliveries.map((delivery, index) => (
                <div key={delivery.id} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{delivery.location.customerName}</p>
                        <p className="text-sm text-muted-foreground truncate">{delivery.location.address}</p>
                      </div>
                      <StatusBadge status={delivery.status} />
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{delivery.scheduledTime}</span>
                      <span>•</span>
                      <span>{delivery.orderId}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-success mb-4" />
              <h3 className="text-lg font-medium">All caught up!</h3>
              <p className="text-sm text-muted-foreground mt-1">You've completed all your deliveries for today.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
