import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { mockDeliveryAgents, DeliveryAgent } from '@/data/mockData';
import api from '@/lib/api';
import { useAuth } from './AuthContext';

interface AgentContextType {
    agents: DeliveryAgent[];
    isLoadingAgents: boolean;
    fetchAgents: () => Promise<void>;
    addAgent: (agent: Omit<DeliveryAgent, 'id' | 'assignedDeliveries' | 'completedToday'>) => void;
    removeAgent: (agentId: string) => void;
    updateAgentStatus: (agentId: string, status: DeliveryAgent['status']) => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export function AgentProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [agents, setAgents] = useState<DeliveryAgent[]>(mockDeliveryAgents);
    const [isLoadingAgents, setIsLoadingAgents] = useState(false);

    const fetchAgents = useCallback(async () => {
        setIsLoadingAgents(true);
        try {
            const response = await api.get('/agents');
            if (response.data.success && response.data.data) {
                const transformed = response.data.data.map((agent: any) => ({
                    id: String(agent._id),
                    name: agent.name,
                    email: agent.email,
                    phone: agent.phone,
                    status: agent.status || 'available',
                    assignedDeliveries: agent.assignedDeliveries || 0,
                    completedToday: agent.completedToday || 0,
                }));
                setAgents(transformed);
            }
        } catch (error) {
            console.warn('Failed to fetch agents', error);
        } finally {
            setIsLoadingAgents(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) fetchAgents();
    }, [fetchAgents, isAuthenticated]);

    const addAgent = useCallback(
        (agentData: Omit<DeliveryAgent, 'id' | 'assignedDeliveries' | 'completedToday'>) => {
            const agent: DeliveryAgent = {
                id: `agent-${Date.now()}`,
                ...agentData,
                assignedDeliveries: 0,
                completedToday: 0,
            };
            setAgents(prev => [...prev, agent]);
        },
        []
    );

    const removeAgent = useCallback((agentId: string) => {
        setAgents(prev => prev.filter(a => a.id !== agentId));
    }, []);

    const updateAgentStatus = useCallback(
        (agentId: string, status: DeliveryAgent['status']) => {
            setAgents(prev => prev.map(a => (a.id === agentId ? { ...a, status } : a)));
        },
        []
    );

    return (
        <AgentContext.Provider
            value={{ agents, isLoadingAgents, fetchAgents, addAgent, removeAgent, updateAgentStatus }}
        >
            {children}
        </AgentContext.Provider>
    );
}

export function useAgent() {
    const context = useContext(AgentContext);
    if (!context) throw new Error('useAgent must be used inside AgentProvider');
    return context;
}
