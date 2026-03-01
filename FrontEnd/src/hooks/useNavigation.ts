import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { getRoadPath } from '@/lib/routeService';

// Haversine distance in meters
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

export interface NavStep {
    instruction: string;
    distance: number;
    duration: number;
    maneuver: {
        location: [number, number]; // [lng, lat]
        type: string;
        modifier?: string; // e.g., 'left', 'right'
    };
    geometry: [number, number][]; // [lat, lng]
}

export interface NavigationState {
    currentStep: NavStep | null;
    nextStep: NavStep | null;
    distanceToNextTurn: number;
    totalRemainingDistance: number;
    totalRemainingTime: number;
    routeCoordinates: [number, number][];
    isLoading: boolean;
    error: string | null;
}

const VOICE_PROXIMITY_THRESHOLD = 50; // meters. trigger voice when 50m away from turn.
const RECALCULATE_THRESHOLD = 150; // meters. if >150m off route, recalculate.

export function useNavigation(
    waypoints: { lat: number; lng: number }[],
    agentLocation: { lat: number; lng: number } | null,
    isTracking: boolean
) {
    const [navState, setNavState] = useState<NavigationState>({
        currentStep: null,
        nextStep: null,
        distanceToNextTurn: 0,
        totalRemainingDistance: 0,
        totalRemainingTime: 0,
        routeCoordinates: [],
        isLoading: false,
        error: null,
    });

    const [isMuted, setIsMuted] = useState(false);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => {
            if (!prev && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            return !prev;
        });
    }, []);

    const stepsRef = useRef<NavStep[]>([]);
    const currentStepIndexRef = useRef<number>(0);
    const hasSpokenStepRef = useRef<boolean>(false);

    // We only fetch the full route once (or when waypoints significantly change/recalc).
    const waypointsStr = JSON.stringify(waypoints);

    const fetchRoute = useCallback(async (startLoc: { lat: number; lng: number }) => {
        const currentWaypoints = JSON.parse(waypointsStr);
        if (!currentWaypoints || currentWaypoints.length < 2) return;
        setNavState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // Include agent's current location as the start point specifically for routing 
            // if we are live tracking, to get accurate steps from their current spot.
            const routeWaypoints = [startLoc, ...currentWaypoints.slice(1)];
            const locations = routeWaypoints.map((w: any) => ({ lat: w.lat, lng: w.lng }));

            // Fetch route from backend proxy to ORS
            const data = await getRoadPath(locations);

            if (data.features && data.features[0]) {
                const feature = data.features[0];
                const coordinates = feature.geometry.coordinates.map(
                    ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
                );

                // Extract all steps from all legs (segments in ORS)
                const allSteps: NavStep[] = [];
                if (feature.properties && feature.properties.segments) {
                    for (const segment of feature.properties.segments) {
                        if (segment.steps) {
                            for (const step of segment.steps) {
                                // Extract maneuver location from the coordinates array using way_points[0]
                                const startPointIdx = step.way_points[0];
                                const pointCoords = feature.geometry.coordinates[startPointIdx];

                                const navStep: NavStep = {
                                    instruction: step.instruction || 'Continue straight',
                                    distance: step.distance,
                                    duration: step.duration,
                                    maneuver: {
                                        location: [pointCoords[0], pointCoords[1]],
                                        type: step.type?.toString() || 'turn',
                                        modifier: ''
                                    },
                                    geometry: feature.geometry.coordinates.slice(step.way_points[0], step.way_points[1] + 1).map((p: any) => [p[1], p[0]])
                                };
                                allSteps.push(navStep);
                            }
                        }
                    }
                }

                stepsRef.current = allSteps;
                currentStepIndexRef.current = 0;
                hasSpokenStepRef.current = false;

                setNavState(prev => ({
                    ...prev,
                    routeCoordinates: coordinates,
                    currentStep: allSteps[0] || null,
                    nextStep: allSteps[1] || null,
                    totalRemainingDistance: feature.properties.summary?.distance || 0,
                    totalRemainingTime: feature.properties.summary?.duration || 0,
                    isLoading: false,
                }));
            }
        } catch (err) {
            console.error("Failed to fetch navigation route:", err);
            setNavState(prev => ({ ...prev, error: "Failed to load route", isLoading: false }));
        }
    }, [waypointsStr]);

    // Initial load when tracking starts
    useEffect(() => {
        if (isTracking && agentLocation && stepsRef.current.length === 0) {
            fetchRoute(agentLocation);
        } else if (!isTracking) {
            // Reset when tracking stops
            stepsRef.current = [];
            currentStepIndexRef.current = 0;
            hasSpokenStepRef.current = false;
            setNavState({
                currentStep: null,
                nextStep: null,
                distanceToNextTurn: 0,
                totalRemainingDistance: 0,
                totalRemainingTime: 0,
                routeCoordinates: [],
                isLoading: false,
                error: null,
            });
        }
    }, [isTracking, agentLocation, fetchRoute]);

    // Voice Synthesis Helper
    const speakInstruction = useCallback((text: string) => {
        if (isMuted) return;
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            // Format for better Text-To-Speech
            let speakText = text.replace('turn', 'turn ');
            speakText = speakText.replace('onto', 'onto ');

            const utterance = new SpeechSynthesisUtterance(speakText);
            // Optional: configure voice settings here
            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            // Fallback for names: clean up undefined or empty ones
            utterance.text = utterance.text.replace(/onto $/i, '');

            window.speechSynthesis.speak(utterance);
        }
    }, [isMuted]);

    // Main tracking loop: Update distance, trigger voice, advance steps
    useEffect(() => {
        if (!isTracking || !agentLocation || stepsRef.current.length === 0) return;

        const currentStepIndex = currentStepIndexRef.current;
        const currentStep = stepsRef.current[currentStepIndex];

        if (!currentStep) return; // Arrived

        // OSRM Maneuver location is [lng, lat]
        const maneuverLng = currentStep.maneuver.location[0];
        const maneuverLat = currentStep.maneuver.location[1];

        const distToManeuver = getDistance(
            agentLocation.lat,
            agentLocation.lng,
            maneuverLat,
            maneuverLng
        );

        // Update state
        setNavState(prev => ({
            ...prev,
            distanceToNextTurn: distToManeuver,
        }));

        // 1. Voice Prompt (e.g., "In 50 meters, turn left")
        if (distToManeuver > 0 && distToManeuver <= VOICE_PROXIMITY_THRESHOLD && !hasSpokenStepRef.current) {
            speakInstruction(`In ${Math.round(distToManeuver)} meters, ${currentStep.instruction}`);
            hasSpokenStepRef.current = true;
        }

        // 2. Advance Step (we passed the maneuver point)
        // Note: Real GPS jumps around, so a simple distance check might fail if they take a different route.
        // For robustness, usually we check if distance starts INCREASING again or if they are just very close.
        if (distToManeuver <= 15) {
            currentStepIndexRef.current += 1;
            hasSpokenStepRef.current = false; // Reset for next instruction

            const nextIndex = currentStepIndexRef.current;

            if (nextIndex < stepsRef.current.length) {
                const newlyActiveStep = stepsRef.current[nextIndex];

                // Speak immediate action if it's right there
                speakInstruction(newlyActiveStep.instruction);

                setNavState(prev => ({
                    ...prev,
                    currentStep: newlyActiveStep,
                    nextStep: stepsRef.current[nextIndex + 1] || null,
                }));
            } else {
                // Reached end!
                speakInstruction("You have arrived at your destination.");
                setNavState(prev => ({
                    ...prev,
                    currentStep: null,
                    nextStep: null,
                }));
            }
        }

        // 3. (Optional) Off-Route Recalculation
        // Real implementation would check distance to the polyline segment, not just the single maneuver point.
        // If distToManeuver > RECALCULATE_THRESHOLD and they are far from the expected segment, we call fetchRoute(agentLocation) again.
        // Keeping it simple for now to avoid rapid recalculation thrashing loop.

    }, [agentLocation, isTracking, speakInstruction]);


    return {
        ...navState,
        isMuted,
        toggleMute,
        // Utility to manually trigger recalculation/refresh if needed
        recalculateRoute: () => agentLocation && fetchRoute(agentLocation),
        // Also exporting distance formatter
        formatDistance: (meters: number) => {
            if (meters < 1000) return `${Math.round(meters)} m`;
            return `${(meters / 1000).toFixed(1)} km`;
        }
    };
}
