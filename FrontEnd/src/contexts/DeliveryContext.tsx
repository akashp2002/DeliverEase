import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { 
  mockDeliveryAgents, 
  mockScheduledDeliveries, 
  warehouseLocation,
  DeliveryAgent, 
  ScheduledDelivery,
  DeliveryLocation 
} from '@/data/mockData';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface OptimizedRouteData {
  sequence: ScheduledDelivery[];
  totalDistance: number;
  optimizedDistance: number;
  totalTime: number;
  optimizedTime: number;
}

interface DeliveryContextType {
  agents: DeliveryAgent[];
  deliveries: ScheduledDelivery[];
  optimizedRoutes: Record<string, OptimizedRouteData>;
  isLoadingDeliveries: boolean;
  addAgent: (agent: Omit<DeliveryAgent, 'id' | 'assignedDeliveries' | 'completedToday'>) => void;
  removeAgent: (agentId: string) => void;
  updateAgentStatus: (agentId: string, status: DeliveryAgent['status']) => void;
  addDelivery: (delivery: Omit<ScheduledDelivery, 'id' | 'orderId'>) => void;
  updateDeliveryStatus: (deliveryId: string, status: ScheduledDelivery['status']) => void;
  getAgentDeliveries: (agentId: string) => ScheduledDelivery[];
  optimizeRoute: (agentId: string) => OptimizedRouteData;
  fetchDeliveries: () => Promise<void>;
}

const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined);

// --- Nearest-Neighbor Heuristic ---
function nearestNeighborOrder(
  start: { lat: number; lng: number },
  deliveries: ScheduledDelivery[]
): ScheduledDelivery[] {
  if (deliveries.length <= 1) return [...deliveries];

  const remaining = [...deliveries];
  const ordered: ScheduledDelivery[] = [];
  let current = start;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const location = remaining[i].location;
      if (location.lat !== undefined && location.lng !== undefined) {
        const dist = haversineDistance(current, { lat: location.lat, lng: location.lng });
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }
      }
    }

    const next = remaining.splice(nearestIdx, 1)[0];
    ordered.push(next);
    if (next.location.lat !== undefined && next.location.lng !== undefined) {
      current = { lat: next.location.lat, lng: next.location.lng };
    }
  }

  return ordered;
}

// --- Haversine distance in km ---
function haversineDistance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

// --- Calculate total route distance ---
function totalRouteDistance(
  start: { lat: number; lng: number },
  deliveries: ScheduledDelivery[],
  end: { lat: number; lng: number }
): number {
  let total = 0;
  let prev = start;
  for (const d of deliveries) {
    if (d.location.lat !== undefined && d.location.lng !== undefined) {
      total += haversineDistance(prev, { lat: d.location.lat, lng: d.location.lng });
      prev = { lat: d.location.lat, lng: d.location.lng };
    }
  }
  total += haversineDistance(prev, end);
  return Math.round(total * 10) / 10;
}

export function DeliveryProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [agents, setAgents] = useState<DeliveryAgent[]>(mockDeliveryAgents);
  const [deliveries, setDeliveries] = useState<ScheduledDelivery[]>(mockScheduledDeliveries);
  const [optimizedRoutes, setOptimizedRoutes] = useState<Record<string, OptimizedRouteData>>({});
  const [isLoadingDeliveries, setIsLoadingDeliveries] = useState(false);

  // Fetch deliveries from backend
  const fetchDeliveries = useCallback(async () => {
    setIsLoadingDeliveries(true);
    try {
      const response = await api.get('/deliveries');
      if (response.data.success && response.data.data) {
        // Transform backend data to match ScheduledDelivery interface
        const transformedDeliveries = response.data.data.map((delivery: any) => ({
          id: delivery._id,
          orderId: delivery.orderId,
          location: {
            id: delivery.location._id,
            ...delivery.location,
          },
          scheduledDate: delivery.scheduledDate,
          scheduledTime: delivery.scheduledTime,
          status: delivery.status,
          agentId: delivery.agentId?._id || delivery.agentId,
          area: delivery.area,
          priority: delivery.priority,
          packageWeight: delivery.packageWeight,
        }));
        setDeliveries(transformedDeliveries);
        console.log('✓ Successfully loaded deliveries from API:', transformedDeliveries.length);
      }
    } catch (error: any) {
      // Log the error for debugging, but don't show a toast since we're using mock data
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      const errorDetails = {
        status: error.response?.status,
        message: errorMsg,
        url: error.config?.url,
      };
      console.warn('Failed to fetch deliveries from API, using mock data:', errorDetails);
      // Keep using mockData if API fails - this is expected behavior
    } finally {
      setIsLoadingDeliveries(false);
    }
  }, []);

  // Fetch deliveries only when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchDeliveries();
    }
  }, [fetchDeliveries, isAuthenticated]);

  const addAgent = useCallback((agentData: Omit<DeliveryAgent, 'id' | 'assignedDeliveries' | 'completedToday'>) => {
    const agent: DeliveryAgent = {
      id: `agent-${Date.now()}`,
      ...agentData,
      assignedDeliveries: 0,
      completedToday: 0,
    };
    setAgents(prev => [...prev, agent]);
  }, []);

  const removeAgent = useCallback((agentId: string) => {
    setAgents(prev => prev.filter(a => a.id !== agentId));
  }, []);

  const updateAgentStatus = useCallback((agentId: string, status: DeliveryAgent['status']) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status } : a));
  }, []);

  const addDelivery = useCallback(async (deliveryData: Omit<ScheduledDelivery, 'id' | 'orderId'>) => {
    try {
      // Generate orderId
      const orderId = `ORD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

      console.log('🚀 SENDING TO API:', { orderId, street: deliveryData.location.streetAddress });

      // Call backend API
      const response = await api.post('/deliveries', {
        orderId,
        ...deliveryData,
      });

      console.log('✅ API SUCCESS:', response.data);

      if (response.data.success) {
        const createdDelivery = response.data.data;
        
        // Transform and add to local state
        const transformedDelivery: ScheduledDelivery = {
          id: createdDelivery._id,
          orderId: createdDelivery.orderId,
          location: {
            id: createdDelivery.location._id,
            ...createdDelivery.location,
          },
          scheduledDate: createdDelivery.scheduledDate,
          scheduledTime: createdDelivery.scheduledTime,
          status: createdDelivery.status,
          agentId: createdDelivery.agentId?._id || createdDelivery.agentId,
          area: createdDelivery.area,
          priority: createdDelivery.priority,
          packageWeight: createdDelivery.packageWeight,
        };

        setDeliveries(prev => [transformedDelivery, ...prev]);
        toast.success(`Delivery ${orderId} created successfully!`);
      }
    } catch (error: any) {
      console.error('❌ API ERROR:', error.response?.data || error.message);
      console.error('Full response:', error.response);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to create delivery';
      toast.error(errorMsg);
      // DO NOT create fake local delivery - throw error so component knows it failed
      throw error;
    }
  }, []);

  const updateDeliveryStatus = useCallback(async (deliveryId: string, status: ScheduledDelivery['status']) => {
    try {
      // Try updating via API first
      const response = await api.put(`/deliveries/${deliveryId}/status`, { status });
      
      if (response.data.success) {
        setDeliveries(prev => prev.map(d => d.id === deliveryId ? { ...d, status } : d));
        toast.success('Delivery status updated');
      }
    } catch (error: any) {
      console.error('Failed to update delivery status:', error);
      // Fallback to local update
      setDeliveries(prev => prev.map(d => d.id === deliveryId ? { ...d, status } : d));
    }
  }, []);

  const getAgentDeliveries = useCallback((agentId: string) => {
    return deliveries.filter(d => d.agentId === agentId);
  }, [deliveries]);

  const optimizeRoute = useCallback((agentId: string): OptimizedRouteData => {
    const agentDels = deliveries.filter(d => d.agentId === agentId && d.status !== 'delivered');
    
    // Original distance (in assignment order)
    const originalDistance = totalRouteDistance(warehouseLocation, agentDels, warehouseLocation);
    
    // Apply Nearest-Neighbor heuristic
    const optimizedSequence = nearestNeighborOrder(warehouseLocation, agentDels);
    const optDistance = totalRouteDistance(warehouseLocation, optimizedSequence, warehouseLocation);

    // Estimate time: assume average speed 25 km/h in city + 5 min per stop
    const originalTime = Math.round((originalDistance / 25) * 60 + agentDels.length * 5);
    const optimizedTime = Math.round((optDistance / 25) * 60 + optimizedSequence.length * 5);

    const routeData: OptimizedRouteData = {
      sequence: optimizedSequence,
      totalDistance: originalDistance,
      optimizedDistance: optDistance,
      totalTime: originalTime,
      optimizedTime: optimizedTime,
    };

    setOptimizedRoutes(prev => ({ ...prev, [agentId]: routeData }));
    return routeData;
  }, [deliveries]);

  return (
    <DeliveryContext.Provider
      value={{
        agents,
        deliveries,
        optimizedRoutes,
        isLoadingDeliveries,
        addAgent,
        removeAgent,
        updateAgentStatus,
        addDelivery,
        updateDeliveryStatus,
        getAgentDeliveries,
        optimizeRoute,
        fetchDeliveries,
      }}
    >
      {children}
    </DeliveryContext.Provider>
  );
}

export function useDelivery() {
  const context = useContext(DeliveryContext);
  if (!context) {
    throw new Error('useDelivery must be used within a DeliveryProvider');
  }
  return context;
}
