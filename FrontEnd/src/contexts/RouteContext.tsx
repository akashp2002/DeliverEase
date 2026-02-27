import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { getDistanceMatrix } from '@/lib/routeService';
import { warehouseLocation, ScheduledDelivery } from '@/data/mockData';
import { useDelivery } from './DeliveryContext';

/* -------------------- Nearest Neighbour algorithm -------------------- */

// Greedy O(N²) route optimizer. Operates purely on the pre-fetched distance
// matrix — no API calls during optimisation.
// warehouseIdx = 0, delivery indices start at 1.
function nearestNeighborMatrix(
    deliveryIndices: number[],
    matrix: number[][]
): number[] {
    const remaining = [...deliveryIndices];
    const ordered: number[] = [];
    let current = 0; // start from warehouse

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

// Route: warehouse(0) → indices[0] → ... → warehouse(0)
function totalDistanceMatrix(orderedIndices: number[], matrix: number[][]): number {
    let total = 0;
    let prev = 0;
    for (const idx of orderedIndices) {
        total += matrix[prev][idx];
        prev = idx;
    }
    total += matrix[prev][0]; // return to warehouse
    return Math.round(total * 10) / 10;
}

/* -------------------- Context -------------------- */

interface OptimizedRouteData {
    sequence: ScheduledDelivery[];
    totalDistance: number;
    optimizedDistance: number;
    totalTime: number;
    optimizedTime: number;
}

interface RouteContextType {
    optimizedRoutes: Record<string, OptimizedRouteData>;
    optimizeRoute: (agentId: string) => Promise<OptimizedRouteData>;
    agentLocation: { lat: number; lng: number } | null;
    setAgentLocation: (location: { lat: number; lng: number } | null) => void;
}

const RouteContext = createContext<RouteContextType | undefined>(undefined);

export function RouteProvider({ children }: { children: ReactNode }) {
    const { deliveries } = useDelivery();
    const [optimizedRoutes, setOptimizedRoutes] = useState<Record<string, OptimizedRouteData>>({});
    const [agentLocation, setAgentLocation] = useState<{ lat: number; lng: number } | null>(null);

    const optimizeRoute = useCallback(
        async (agentId: string): Promise<OptimizedRouteData> => {
            const agentDels = deliveries.filter(
                d => d.agentId === agentId && d.status !== 'delivered'
            );

            if (agentDels.length === 0) {
                return { sequence: [], totalDistance: 0, optimizedDistance: 0, totalTime: 0, optimizedTime: 0 };
            }

            // Index 0 = warehouse, 1..N = deliveries
            const locations = [
                { lat: warehouseLocation.lat, lng: warehouseLocation.lng },
                ...agentDels.map(d => ({ lat: d.location.lat, lng: d.location.lng })),
            ];

            // ONE API call — full NxN matrix in km
            const matrix = await getDistanceMatrix(locations);

            const deliveryIndices = agentDels.map((_, i) => i + 1);
            const originalDistance = totalDistanceMatrix(deliveryIndices, matrix);

            // Greedy nearest-neighbour — pure JS, no further API calls
            const optimizedIndices = nearestNeighborMatrix(deliveryIndices, matrix);
            const optimizedSequence = optimizedIndices.map(idx => agentDels[idx - 1]);
            const optimizedDistance = totalDistanceMatrix(optimizedIndices, matrix);

            const originalTime = Math.round((originalDistance / 25) * 60 + agentDels.length * 5);
            const optimizedTime = Math.round((optimizedDistance / 25) * 60 + optimizedSequence.length * 5);

            const routeData: OptimizedRouteData = {
                sequence: optimizedSequence,
                totalDistance: originalDistance,
                optimizedDistance,
                totalTime: originalTime,
                optimizedTime,
            };

            setOptimizedRoutes(prev => ({ ...prev, [agentId]: routeData }));
            return routeData;
        },
        [deliveries]
    );

    return (
        <RouteContext.Provider value={{ optimizedRoutes, optimizeRoute, agentLocation, setAgentLocation }}>
            {children}
        </RouteContext.Provider>
    );
}

export function useRoute() {
    const context = useContext(RouteContext);
    if (!context) throw new Error('useRoute must be used inside RouteProvider');
    return context;
}
