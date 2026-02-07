import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { 
  mockDeliveryAgents, 
  mockScheduledDeliveries, 
  warehouseLocation,
  DeliveryAgent, 
  ScheduledDelivery,
  DeliveryLocation 
} from '@/data/mockData';

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
  addAgent: (agent: Omit<DeliveryAgent, 'id' | 'assignedDeliveries' | 'completedToday'>) => void;
  removeAgent: (agentId: string) => void;
  updateAgentStatus: (agentId: string, status: DeliveryAgent['status']) => void;
  addDelivery: (delivery: Omit<ScheduledDelivery, 'id' | 'orderId'>) => void;
  updateDeliveryStatus: (deliveryId: string, status: ScheduledDelivery['status']) => void;
  getAgentDeliveries: (agentId: string) => ScheduledDelivery[];
  optimizeRoute: (agentId: string) => OptimizedRouteData;
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
      const dist = haversineDistance(current, remaining[i].location);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }

    const next = remaining.splice(nearestIdx, 1)[0];
    ordered.push(next);
    current = { lat: next.location.lat, lng: next.location.lng };
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
    total += haversineDistance(prev, d.location);
    prev = { lat: d.location.lat, lng: d.location.lng };
  }
  total += haversineDistance(prev, end);
  return Math.round(total * 10) / 10;
}

export function DeliveryProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<DeliveryAgent[]>(mockDeliveryAgents);
  const [deliveries, setDeliveries] = useState<ScheduledDelivery[]>(mockScheduledDeliveries);
  const [optimizedRoutes, setOptimizedRoutes] = useState<Record<string, OptimizedRouteData>>({});

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

  const addDelivery = useCallback((deliveryData: Omit<ScheduledDelivery, 'id' | 'orderId'>) => {
    const delivery: ScheduledDelivery = {
      id: `del-${Date.now()}`,
      orderId: `ORD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      ...deliveryData,
    };
    setDeliveries(prev => [delivery, ...prev]);
  }, []);

  const updateDeliveryStatus = useCallback((deliveryId: string, status: ScheduledDelivery['status']) => {
    setDeliveries(prev => prev.map(d => d.id === deliveryId ? { ...d, status } : d));
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
        addAgent,
        removeAgent,
        updateAgentStatus,
        addDelivery,
        updateDeliveryStatus,
        getAgentDeliveries,
        optimizeRoute,
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
