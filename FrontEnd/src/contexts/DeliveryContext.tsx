import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { mockScheduledDeliveries, ScheduledDelivery } from '@/data/mockData';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface DeliveryContextType {
  deliveries: ScheduledDelivery[];
  isLoadingDeliveries: boolean;
  fetchDeliveries: () => Promise<void>;
  addDelivery: (delivery: Omit<ScheduledDelivery, 'id' | 'orderId'>) => Promise<void>;
  updateDeliveryStatus: (deliveryId: string, status: ScheduledDelivery['status']) => Promise<void>;
  getAgentDeliveries: (agentId: string) => ScheduledDelivery[];
}

const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined);

export function DeliveryProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [deliveries, setDeliveries] = useState<ScheduledDelivery[]>(mockScheduledDeliveries);
  const [isLoadingDeliveries, setIsLoadingDeliveries] = useState(false);

  /* ---------------- FETCH ---------------- */

  const fetchDeliveries = useCallback(async () => {
    setIsLoadingDeliveries(true);
    try {
      const response = await api.get('/deliveries');
      if (response.data.success && response.data.data) {
        const transformed = response.data.data.map((delivery: any) => ({
          id: delivery._id,
          orderId: delivery.orderId,
          location: { id: delivery.location._id, ...delivery.location },
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
        setDeliveries(transformed);
      }
    } catch (error) {
      console.warn('Failed to fetch deliveries', error);
    } finally {
      setIsLoadingDeliveries(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchDeliveries();
  }, [fetchDeliveries, isAuthenticated]);

  /* ---------------- CRUD ---------------- */

  const addDelivery = useCallback(async (deliveryData: Omit<ScheduledDelivery, 'id' | 'orderId'>) => {
    try {
      const orderId = `ORD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
      console.log('🚀 SENDING TO API:', { orderId, street: deliveryData.location.streetAddress });

      const response = await api.post('/deliveries', { orderId, ...deliveryData });
      console.log('✅ API SUCCESS:', response.data);

      if (response.data.success) {
        const d = response.data.data;
        const transformed: ScheduledDelivery = {
          id: d._id,
          orderId: d.orderId,
          location: { id: d.location._id, ...d.location },
          scheduledDate: d.scheduledDate,
          scheduledTime: d.scheduledTime,
          status: d.status,
          agentId: d.agentId?._id
            ? String(d.agentId._id)
            : d.agentId
              ? String(d.agentId)
              : undefined,
          area: d.area,
          priority: d.priority,
          packageWeight: d.packageWeight,
        };
        setDeliveries(prev => [transformed, ...prev]);
        toast.success(`Delivery ${orderId} created successfully!`);
      }
    } catch (error: any) {
      console.error('❌ API ERROR:', error.response?.data || error.message);
      const msg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to create delivery';
      toast.error(msg);
      throw error;
    }
  }, []);

  const updateDeliveryStatus = useCallback(async (deliveryId: string, status: ScheduledDelivery['status']) => {
    try {
      const response = await api.put(`/deliveries/${deliveryId}/status`, { status });
      if (response.data.success) {
        setDeliveries(prev => prev.map(d => d.id === deliveryId ? { ...d, status } : d));
        toast.success('Delivery status updated');
      }
    } catch (error: any) {
      console.error('Failed to update delivery status:', error);
      setDeliveries(prev => prev.map(d => d.id === deliveryId ? { ...d, status } : d));
    }
  }, []);

  /* ---------------- HELPERS ---------------- */

  const getAgentDeliveries = useCallback(
    (agentId: string) => deliveries.filter(d => d.agentId === agentId),
    [deliveries]
  );

  return (
    <DeliveryContext.Provider
      value={{ deliveries, isLoadingDeliveries, fetchDeliveries, addDelivery, updateDeliveryStatus, getAgentDeliveries }}
    >
      {children}
    </DeliveryContext.Provider>
  );
}

export function useDelivery() {
  const context = useContext(DeliveryContext);
  if (!context) throw new Error('useDelivery must be used inside DeliveryProvider');
  return context;
}
