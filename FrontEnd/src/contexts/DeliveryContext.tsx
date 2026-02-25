import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { getDistanceMatrix } from '@/lib/routeService';
import {
  mockDeliveryAgents,
  mockScheduledDeliveries,
  warehouseLocation,
  DeliveryAgent,
  ScheduledDelivery
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
  isLoadingAgents: boolean;
  addAgent: (agent: Omit<DeliveryAgent, 'id' | 'assignedDeliveries' | 'completedToday'>) => void;
  removeAgent: (agentId: string) => void;
  updateAgentStatus: (agentId: string, status: DeliveryAgent['status']) => void;
  addDelivery: (delivery: Omit<ScheduledDelivery, 'id' | 'orderId'>) => void;
  updateDeliveryStatus: (deliveryId: string, status: ScheduledDelivery['status']) => void;
  getAgentDeliveries: (agentId: string) => ScheduledDelivery[];
  optimizeRoute: (agentId: string) => Promise<OptimizedRouteData>;
  fetchDeliveries: () => Promise<void>;
  fetchAgents: () => Promise<void>;
}


const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined);

/* ---------------- MATRIX-BASED HELPERS (no per-pair API calls) ---------------- */

// Nearest Neighbor using a pre-fetched distance matrix.
// warehouseIdx = 0, delivery indices = 1..N
function nearestNeighborMatrix(
  deliveryIndices: number[],
  matrix: number[][]
): number[] {
  const remaining = [...deliveryIndices];
  const ordered: number[] = [];
  let current = 0; // start from warehouse (index 0)

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const dist = matrix[current][remaining[i]];
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }

    const chosen = remaining.splice(nearestIdx, 1)[0];
    ordered.push(chosen);
    current = chosen;
  }

  return ordered;
}

// Compute total route distance using the matrix.
// Route: warehouse(0) → indices[0] → indices[1] → ... → warehouse(0)
function totalDistanceMatrix(orderedIndices: number[], matrix: number[][]): number {
  let total = 0;
  let prev = 0; // warehouse
  for (const idx of orderedIndices) {
    total += matrix[prev][idx];
    prev = idx;
  }
  total += matrix[prev][0]; // return to warehouse
  return Math.round(total * 10) / 10;
}

/* ---------------- PROVIDER ---------------- */

export function DeliveryProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  const [agents, setAgents] = useState<DeliveryAgent[]>(mockDeliveryAgents);
  const [deliveries, setDeliveries] = useState<ScheduledDelivery[]>(mockScheduledDeliveries);
  const [optimizedRoutes, setOptimizedRoutes] = useState<Record<string, OptimizedRouteData>>({});
  const [isLoadingDeliveries, setIsLoadingDeliveries] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);

  /* ---------------- FETCH ---------------- */

  // Fetch deliveries from backend
  const fetchDeliveries = useCallback(async () => {
    setIsLoadingDeliveries(true);
    try {
      const response = await api.get('/deliveries');

      if (response.data.success && response.data.data) {
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
          agentId: delivery.agentId?._id
            ? String(delivery.agentId._id)
            : delivery.agentId
              ? String(delivery.agentId)
              : undefined,
          area: delivery.area,
          priority: delivery.priority,
          packageWeight: delivery.packageWeight,
        }));

        setDeliveries(transformedDeliveries);
      }
    } catch (error) {
      console.warn("Failed to fetch deliveries", error);
    } finally {
      setIsLoadingDeliveries(false); // ✅ VERY IMPORTANT
    }
  }, []);

  // Fetch agents from backend
  const fetchAgents = useCallback(async () => {
    setIsLoadingAgents(true);
    try {
      const response = await api.get('/agents');

      if (response.data.success && response.data.data) {
        const transformedAgents = response.data.data.map((agent: any) => ({
          id: String(agent._id),
          name: agent.name,
          email: agent.email,
          phone: agent.phone,
          status: agent.status || 'available',
          assignedDeliveries: agent.assignedDeliveries || 0,
          completedToday: agent.completedToday || 0,
        }));

        setAgents(transformedAgents);
      }
    } catch (error) {
      console.warn("Failed to fetch agents", error);
    } finally {
      setIsLoadingAgents(false); // ✅ VERY IMPORTANT
    }
  }, []);

  // Fetch deliveries and agents when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchDeliveries();
      fetchAgents();
    }
  }, [fetchDeliveries, fetchAgents, isAuthenticated]);

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
          agentId: createdDelivery.agentId?._id
            ? String(createdDelivery.agentId._id)
            : createdDelivery.agentId
              ? String(createdDelivery.agentId)
              : undefined,

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




  /* ---------------- HELPERS ---------------- */

  const getAgentDeliveries = useCallback((agentId: string) => {
    return deliveries.filter(d => d.agentId === agentId);
  }, [deliveries]);

  /* ---------------- OPTIMIZATION ---------------- */

  const optimizeRoute = useCallback(async (agentId: string): Promise<OptimizedRouteData> => {

    const agentDels = deliveries.filter(
      d => d.agentId === agentId && d.status !== 'delivered'
    );

    if (agentDels.length === 0) {
      return {
        sequence: [],
        totalDistance: 0,
        optimizedDistance: 0,
        totalTime: 0,
        optimizedTime: 0,
      };
    }

    // Build locations array: index 0 = warehouse, indices 1..N = deliveries
    const locations = [
      { lat: warehouseLocation.lat, lng: warehouseLocation.lng },
      ...agentDels.map(d => ({ lat: d.location.lat, lng: d.location.lng })),
    ];

    // ✅ ONE API call — returns full NxN distance matrix in km
    const matrix = await getDistanceMatrix(locations);

    // Delivery indices in the matrix (1-based; 0 = warehouse)
    const deliveryIndices = agentDels.map((_, i) => i + 1);

    // Original order total distance (warehouse → as-is order → warehouse)
    const originalDistance = totalDistanceMatrix(deliveryIndices, matrix);

    // Nearest Neighbor optimized order (fully synchronous — no more API calls)
    const optimizedMatrixIndices = nearestNeighborMatrix(deliveryIndices, matrix);
    const optimizedSequence = optimizedMatrixIndices.map(idx => agentDels[idx - 1]);

    // Optimized total distance
    const optimizedDistance = totalDistanceMatrix(optimizedMatrixIndices, matrix);

    const originalTime = Math.round((originalDistance / 25) * 60 + agentDels.length * 5);
    const optimizedTime = Math.round((optimizedDistance / 25) * 60 + optimizedSequence.length * 5);

    const routeData = {
      sequence: optimizedSequence,
      totalDistance: originalDistance,
      optimizedDistance,
      totalTime: originalTime,
      optimizedTime,
    };

    setOptimizedRoutes(prev => ({
      ...prev,
      [agentId]: routeData,
    }));

    return routeData;

  }, [deliveries]);

  return (
    <DeliveryContext.Provider
      value={{
        agents,
        deliveries,
        optimizedRoutes,
        isLoadingDeliveries,
        isLoadingAgents,
        getAgentDeliveries,
        addAgent,
        removeAgent,
        updateAgentStatus,
        addDelivery,
        updateDeliveryStatus,
        optimizeRoute,
        fetchDeliveries,
        fetchAgents,
      }}
    >
      {children}
    </DeliveryContext.Provider>
  );
}

export function useDelivery() {
  const context = useContext(DeliveryContext);
  if (!context) throw new Error('useDelivery must be used inside provider');
  return context;
}
