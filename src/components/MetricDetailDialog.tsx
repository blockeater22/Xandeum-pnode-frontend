import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatStorage, formatPercentage, calculatePercentage } from '@/lib/format';
import { cn } from '@/lib/utils';

interface MetricDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  type: 'storage' | 'online' | 'uptime' | 'health' | 'pressure' | 'stability';
  data?: {
    // Storage details
    totalCapacityTB?: number;
    totalCapacityGB?: number;
    usedTB?: number;
    usedGB?: number;
    usedPercentage?: number;
    // Online details
    totalNodes?: number;
    onlineNodes?: number;
    offlineNodes?: number;
    onlinePercentage?: number;
    // Uptime details
    averageUptime?: number;
    // Health details
    averageHealthScore?: number;
    // Pressure details
    storagePressurePercent?: number;
    // Stability details
    networkHealth?: string;
    stabilityValue?: number;
  };
}

export const MetricDetailDialog = ({
  open,
  onOpenChange,
  title,
  type,
  data,
}: MetricDetailDialogProps) => {
  if (!data) return null;

  const renderContent = () => {
    switch (type) {
      case 'storage':
        const usedGB = data.usedGB || (data.usedTB ? data.usedTB * 1024 : 0);
        const totalGB = data.totalCapacityGB || (data.totalCapacityTB ? data.totalCapacityTB * 1024 : 0);
        const usedPct = data.usedPercentage || (totalGB > 0 ? (usedGB / totalGB) * 100 : 0);
        
        return (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Storage metrics reflect only online/active nodes
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Capacity</span>
                <span className="text-sm font-semibold">{data.totalCapacityTB?.toFixed(2) || '0.00'} TB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Used Storage</span>
                <span className="text-sm font-semibold">{usedGB.toFixed(2)} GB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Usage Percentage</span>
                <span className={cn(
                  'text-sm font-semibold',
                  usedPct > 80 ? 'text-destructive' : usedPct > 60 ? 'text-warning' : 'text-primary'
                )}>
                  {usedPct.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all',
                  usedPct > 80 ? 'bg-destructive' : usedPct > 60 ? 'bg-warning' : 'bg-primary'
                )}
                style={{ width: `${Math.min(100, usedPct)}%` }}
              />
            </div>
          </div>
        );

      case 'online':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Nodes</span>
                <span className="text-sm font-semibold">{data.totalNodes || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Online Nodes</span>
                <span className="text-sm font-semibold text-primary">{data.onlineNodes || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Offline Nodes</span>
                <span className="text-sm font-semibold text-destructive">{data.offlineNodes || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Online Percentage</span>
                <span className="text-sm font-semibold">{data.onlinePercentage?.toFixed(2) || '0.00'}%</span>
              </div>
            </div>
          </div>
        );

      case 'uptime':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Average Uptime</span>
                <span className="text-sm font-semibold">{data.averageUptime?.toFixed(2) || '0.00'}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This represents the average uptime percentage across all online nodes in the network.
              </p>
            </div>
          </div>
        );

      case 'health':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Average Health Score</span>
                <span className={cn(
                  'text-sm font-semibold',
                  (data.averageHealthScore || 0) >= 90 ? 'text-primary' :
                  (data.averageHealthScore || 0) >= 75 ? 'text-warning' : 'text-destructive'
                )}>
                  {data.averageHealthScore?.toFixed(2) || '0.00'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Health score is calculated based on uptime, storage utilization, and node status.
              </p>
            </div>
          </div>
        );

      case 'pressure':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Storage Pressure</span>
                <span className={cn(
                  'text-sm font-semibold',
                  (data.storagePressurePercent || 0) > 20 ? 'text-destructive' :
                  (data.storagePressurePercent || 0) > 10 ? 'text-warning' : 'text-primary'
                )}>
                  {data.storagePressurePercent?.toFixed(2) || '0.00'}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Percentage of nodes with storage utilization above 80%.
              </p>
            </div>
          </div>
        );

      case 'stability':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Network Stability</span>
                <span className={cn(
                  'text-sm font-semibold',
                  data.networkHealth === 'healthy' ? 'text-primary' :
                  data.networkHealth === 'degraded' ? 'text-warning' : 'text-destructive'
                )}>
                  {data.networkHealth || 'Unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Stability Score</span>
                <span className="text-sm font-semibold">{data.stabilityValue?.toFixed(0) || '0'}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Network stability is based on the percentage of online nodes.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title} Details</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

