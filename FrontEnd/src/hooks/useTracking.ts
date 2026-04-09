import { useState, useEffect, useCallback } from 'react';
import { useRoute } from '@/contexts/RouteContext';
import { toast } from 'sonner';

interface TrackingState {
    isTracking: boolean;
    error: string | null;
}

export function useTracking() {
    const { setAgentLocation } = useRoute();
    const [trackingState, setTrackingState] = useState<TrackingState>({
        isTracking: false,
        error: null,
    });
3
    // Keep track of the watch ID to cancel it later
    const [watchId, setWatchId] = useState<number | null>(null);

    const startTracking = useCallback(() => {
        if (!('geolocation' in navigator)) {
            setTrackingState({ isTracking: false, error: 'Geolocation is not supported by your browser' });
            toast.error('Geolocation is not supported by your browser.');
            return;
        }

        if (watchId !== null) {
            // Already tracking
            return;
        }

        // Update state immediately so the button UI changes
        setTrackingState({ isTracking: true, error: null });

        // High accuracy is ideal for driving, but can hang on some desktop PCs
        // For local testing, we set this to false. Set to true in production.
        const options = {
            enableHighAccuracy: true,
        };

        const id = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                console.log("GPS Lock acquired:", latitude, longitude);
                setAgentLocation({ lat: latitude, lng: longitude });
                setTrackingState({ isTracking: true, error: null });
                toast.dismiss('gps-waiting');
            },
            (error) => {
                let errorMessage = 'An unknown error occurred.';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'User denied the request for Geolocation.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'The request to get user location timed out.';
                        break;
                }
                setTrackingState({ isTracking: false, error: errorMessage });
                setAgentLocation(null);
                toast.error(errorMessage);
                toast.dismiss('gps-waiting');
                if (id !== null) navigator.geolocation.clearWatch(id);
                setWatchId(null);
            },
            options
        );

        setWatchId(id);
        toast.loading('Waiting for GPS signal...', { id: 'gps-waiting' });
    }, [setAgentLocation, watchId]);

    const stopTracking = useCallback(() => {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            setWatchId(null);
            setTrackingState({ isTracking: false, error: null });
            setAgentLocation(null);
            toast.info('Live tracking stopped');
        }
    }, [watchId, setAgentLocation]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [watchId]);

    return { ...trackingState, startTracking, stopTracking };
}
