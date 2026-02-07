import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useDelivery } from '@/contexts/DeliveryContext';
import { BarChart3, TrendingUp, Clock, MapPin, Package, Users, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

export default function ReportsAnalysis() {
  const { agents, deliveries } = useDelivery();

  const completedDeliveries = deliveries.filter(d => d.status === 'delivered').length;
  const pendingDeliveries = deliveries.filter(d => d.status === 'pending').length;
  const inTransitDeliveries = deliveries.filter(d => d.status === 'in-transit').length;

  // Mock weekly distance data
  const distanceData = [
    { name: 'Mon', original: 45, optimized: 32 },
    { name: 'Tue', original: 52, optimized: 38 },
    { name: 'Wed', original: 48, optimized: 35 },
    { name: 'Thu', original: 55, optimized: 40 },
    { name: 'Fri', original: 60, optimized: 44 },
    { name: 'Sat', original: 42, optimized: 30 },
    { name: 'Sun', original: 35, optimized: 25 },
  ];

  const statusData = [
    { name: 'Delivered', value: completedDeliveries, color: 'hsl(142, 70%, 40%)' },
    { name: 'Pending', value: pendingDeliveries, color: 'hsl(38, 92%, 50%)' },
    { name: 'In Transit', value: inTransitDeliveries, color: 'hsl(174, 62%, 40%)' },
  ];

  const agentPerformance = agents.map(agent => ({
    name: agent.name.split(' ')[0],
    assigned: deliveries.filter(d => d.agentId === agent.id).length,
    completed: deliveries.filter(d => d.agentId === agent.id && d.status === 'delivered').length,
  }));

  const weeklyTrend = [
    { week: 'Week 1', deliveries: 45, savings: 22 },
    { week: 'Week 2', deliveries: 52, savings: 25 },
    { week: 'Week 3', deliveries: 58, savings: 28 },
    { week: 'Week 4', deliveries: 65, savings: 32 },
  ];

  const totalOriginalDistance = distanceData.reduce((sum, d) => sum + d.original, 0);
  const totalOptimizedDistance = distanceData.reduce((sum, d) => sum + d.optimized, 0);
  const distanceSaved = totalOriginalDistance - totalOptimizedDistance;
  const percentageSaved = ((distanceSaved / totalOriginalDistance) * 100).toFixed(1);
  const timeSavedHours = (distanceSaved / 30).toFixed(1);

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Reports & Analysis</h1>
        <p className="text-muted-foreground mt-1">Delivery performance and optimization insights</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Distance (Before)</p>
                <p className="text-2xl font-bold">{totalOriginalDistance} km</p>
              </div>
              <div className="p-3 rounded-xl bg-muted"><MapPin className="h-5 w-5 text-muted-foreground" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Distance (After)</p>
                <p className="text-2xl font-bold text-success">{totalOptimizedDistance} km</p>
              </div>
              <div className="p-3 rounded-xl bg-success/10"><TrendingUp className="h-5 w-5 text-success" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-success/10 to-success/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Distance Saved</p>
                <p className="text-2xl font-bold text-success">{distanceSaved} km</p>
                <p className="text-sm text-success flex items-center gap-1 mt-1">
                  <ArrowDown className="h-3 w-3" />{percentageSaved}% reduction
                </p>
              </div>
              <div className="p-3 rounded-xl bg-success/20"><ArrowDown className="h-5 w-5 text-success" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Time Saved</p>
                <p className="text-2xl font-bold">{timeSavedHours} hrs</p>
                <p className="text-sm text-muted-foreground mt-1">This week</p>
              </div>
              <div className="p-3 rounded-xl bg-accent/10"><Clock className="h-5 w-5 text-accent" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Distance Comparison</CardTitle>
            <CardDescription>Original vs Optimized routes (km)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="original" fill="hsl(var(--destructive))" name="Original" radius={[4, 4, 0, 0]} opacity={0.6} />
                <Bar dataKey="optimized" fill="hsl(var(--success))" name="Optimized" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Delivery Status Distribution</CardTitle>
            <CardDescription>Current delivery statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              {statusData.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-sm text-muted-foreground">{s.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Agent Performance</CardTitle>
            <CardDescription>Completed vs Assigned deliveries</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agentPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={60} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="assigned" fill="hsl(var(--muted))" name="Assigned" radius={[0, 4, 4, 0]} />
                <Bar dataKey="completed" fill="hsl(var(--accent))" name="Completed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Optimization Trend</CardTitle>
            <CardDescription>Deliveries and distance savings over weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="deliveries" stroke="hsl(var(--primary))" strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }} name="Total Deliveries" />
                <Line type="monotone" dataKey="savings" stroke="hsl(var(--success))" strokeWidth={2}
                  dot={{ fill: 'hsl(var(--success))' }} name="Distance Saved (km)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" />Optimization Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Package className="h-8 w-8 mx-auto text-accent mb-2" />
              <p className="text-2xl font-bold">{deliveries.length}</p>
              <p className="text-sm text-muted-foreground">Total Deliveries</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Users className="h-8 w-8 mx-auto text-accent mb-2" />
              <p className="text-2xl font-bold">{agents.length}</p>
              <p className="text-sm text-muted-foreground">Active Agents</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-success/10">
              <TrendingUp className="h-8 w-8 mx-auto text-success mb-2" />
              <p className="text-2xl font-bold text-success">{percentageSaved}%</p>
              <p className="text-sm text-muted-foreground">Efficiency Gain</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Clock className="h-8 w-8 mx-auto text-accent mb-2" />
              <p className="text-2xl font-bold">{timeSavedHours}h</p>
              <p className="text-sm text-muted-foreground">Time Saved</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
