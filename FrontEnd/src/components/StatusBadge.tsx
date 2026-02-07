import { cn } from '@/lib/utils';

type StatusType = 'delivered' | 'pending' | 'in-transit' | 'available' | 'on-delivery' | 'off-duty' | 'failed';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  delivered: {
    label: 'Delivered',
    className: 'status-delivered',
  },
  pending: {
    label: 'Pending',
    className: 'status-pending',
  },
  'in-transit': {
    label: 'In Transit',
    className: 'status-in-transit',
  },
  available: {
    label: 'Available',
    className: 'bg-success/15 text-success',
  },
  'on-delivery': {
    label: 'On Delivery',
    className: 'bg-accent/15 text-accent',
  },
  'off-duty': {
    label: 'Off Duty',
    className: 'bg-muted text-muted-foreground',
  },
  failed: {
    label: 'Failed',
    className: 'bg-destructive/15 text-destructive',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span className={cn('status-badge', config.className, className)}>
      {config.label}
    </span>
  );
}
