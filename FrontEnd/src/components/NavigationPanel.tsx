import { NavigationState } from '@/hooks/useNavigation';
import { Card, CardContent } from '@/components/ui/card';
import {
    ArrowUp,
    CornerUpLeft,
    CornerUpRight,
    ArrowLeft,
    ArrowRight,
    Flag,
    AlertCircle,
    Navigation as NavIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';

interface NavigationPanelProps {
    navState: NavigationState & {
        isMuted?: boolean;
        toggleMute?: () => void;
    };
    formatDistance: (meters: number) => string;
}

export function NavigationPanel({ navState, formatDistance }: NavigationPanelProps) {
    const { currentStep, distanceToNextTurn, isLoading, error, isMuted, toggleMute } = navState;

    if (isLoading) {
        return (
            <Card className="absolute top-4 left-4 right-4 z-[9999] shadow-lg border-2 border-primary animate-pulse">
                <CardContent className="p-4 flex items-center justify-center h-20">
                    <p className="text-muted-foreground font-medium flex items-center gap-2">
                        <NavIcon className="h-5 w-5 animate-spin" />
                        Calculating Route...
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="absolute top-4 left-4 right-4 z-[9999] shadow-lg border-2 border-destructive">
                <CardContent className="p-4 flex items-center gap-3">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                    <div>
                        <p className="font-bold text-destructive">Navigation Error</p>
                        <p className="text-sm text-muted-foreground">{error}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!currentStep) return null;

    // Determine icon based on modifier/type
    const getTurnIcon = () => {
        const modifier = currentStep.maneuver.modifier?.toLowerCase() || '';
        const type = currentStep.maneuver.type?.toLowerCase() || '';

        if (type === 'arrive') return <Flag className="h-10 w-10 text-primary-foreground" />;

        switch (modifier) {
            case 'left':
            case 'sharp left':
                return <ArrowLeft className="h-12 w-12 text-primary-foreground" />;
            case 'slight left':
                return <CornerUpLeft className="h-12 w-12 text-primary-foreground" />;
            case 'right':
            case 'sharp right':
                return <ArrowRight className="h-12 w-12 text-primary-foreground" />;
            case 'slight right':
                return <CornerUpRight className="h-12 w-12 text-primary-foreground" />;
            case 'straight':
            default:
                return <ArrowUp className="h-12 w-12 text-primary-foreground" />;
        }
    };

    // Toggle Mute logic is now handled by the useNavigation hook directly
    // to ensure upcoming voice prompts are physically silenced.

    return (
        <Card className="absolute top-4 left-4 right-4 z-[1000] shadow-xl border-accent overflow-hidden">
            {/* Main Instruction Area */}
            <div className="bg-accent text-accent-foreground p-4 flex items-center gap-4">
                <div className="shrink-0">
                    {getTurnIcon()}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-2xl font-black mb-1">
                        {Math.round(distanceToNextTurn)} m
                    </p>
                    <p className="text-lg font-medium leading-tight truncate px-1">
                        {currentStep.instruction || "Proceed on route"}
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-accent-foreground hover:bg-accent/80 shrink-0"
                    onClick={toggleMute}
                >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
            </div>

            {/* Next / Upcoming turn preview (Optional, only show if distance is somewhat far) */}
            {distanceToNextTurn > 50 && navState.nextStep && (
                <div className="bg-background px-4 py-2 border-t flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-semibold">Next:</span>
                        <span className="truncate max-w-[200px]">{navState.nextStep.instruction}</span>
                    </div>
                </div>
            )}
        </Card>
    );
}
