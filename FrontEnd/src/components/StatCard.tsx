import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'primary' | 'accent' | 'success' | 'default';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
}: StatCardProps) {
  const variantStyles = {
    primary: 'stat-card stat-card-primary',
    accent: 'stat-card stat-card-accent',
    success: 'stat-card stat-card-success',
    default: 'dashboard-card',
  };

  const isGradient = variant !== 'default';

  return (
    <div className={cn(variantStyles[variant], 'animate-fade-in')}>
      <div className="flex items-start justify-between">
        <div>
          <p className={cn(
            'text-sm font-medium',
            isGradient ? 'text-white/80' : 'text-muted-foreground'
          )}>
            {title}
          </p>
          <p className={cn(
            'text-3xl font-bold mt-1',
            isGradient ? 'text-white' : 'text-foreground'
          )}>
            {value}
          </p>
          {subtitle && (
            <p className={cn(
              'text-sm mt-1',
              isGradient ? 'text-white/70' : 'text-muted-foreground'
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-sm',
              trend.isPositive 
                ? isGradient ? 'text-success-foreground/80' : 'text-success'
                : isGradient ? 'text-destructive-foreground/80' : 'text-destructive'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
              <span className={isGradient ? 'text-white/60' : 'text-muted-foreground'}>
                vs last week
              </span>
            </div>
          )}
        </div>
        <div className={cn(
          'p-3 rounded-xl',
          isGradient ? 'bg-white/20' : 'bg-muted'
        )}>
          <Icon className={cn(
            'h-6 w-6',
            isGradient ? 'text-white' : 'text-accent'
          )} />
        </div>
      </div>
    </div>
  );
}
