import { useEffect, useState } from 'react';
import { X, Copy, Check, Activity, HardDrive, Clock, Cpu, Globe, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { formatStorage, calculatePercentage, formatPercentage } from '@/lib/format';
import type { PNode } from '@/hooks/usePNodes';
import { apiClient, type NodeStats } from '@/lib/api';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

interface PNodeDetailsPanelProps {
  node: PNode | null;
  onClose: () => void;
}

const CopyButton = ({ text, label }: { text: string; label: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors w-full text-left"
    >
      <code className="text-xs font-mono text-foreground flex-1 truncate">{text}</code>
      {copied ? (
        <Check className="w-4 h-4 text-primary shrink-0" />
      ) : (
        <Copy className="w-4 h-4 text-muted-foreground shrink-0" />
      )}
    </button>
  );
};

// Mini uptime chart data
const generateMiniUptimeData = () => {
  return Array.from({ length: 12 }, (_, i) => ({
    value: 90 + Math.random() * 10,
  }));
};

export const PNodeDetailsPanel = ({ node, onClose }: PNodeDetailsPanelProps) => {
  const [isClosing, setIsClosing] = useState(false);
  const [miniUptimeData] = useState(generateMiniUptimeData);
  const [nodeStats, setNodeStats] = useState<NodeStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Fetch node stats when panel opens
  useEffect(() => {
    if (!node) {
      setNodeStats(null);
      return;
    }

    setLoadingStats(true);
    apiClient.getNodeStats(node.pubkey)
      .then((stats) => {
        setNodeStats(stats);
      })
      .catch((error) => {
        console.error('Failed to fetch node stats:', error);
        setNodeStats(null);
      })
      .finally(() => {
        setLoadingStats(false);
      });
  }, [node]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  if (!node) return null;

  const storagePercentage = node.storageTotal > 0 
    ? calculatePercentage(node.storageUsed, node.storageTotal, 2)
    : 0;

  const statusColors = {
    online: 'bg-primary text-primary-foreground',
    offline: 'bg-destructive text-destructive-foreground',
  };

  const healthColor = node.healthScore >= 80 ? 'text-primary' : node.healthScore >= 60 ? 'text-warning' : 'text-destructive';

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-background/60 backdrop-blur-sm z-40 transition-opacity',
          isClosing ? 'opacity-0' : 'opacity-100'
        )}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full sm:w-[480px] bg-elevated border-l border-border z-50 overflow-y-auto',
          isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'
        )}
      >
        {/* Header */}
        <div className="sticky top-0 bg-elevated/95 backdrop-blur-sm border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', statusColors[node.status])}>
              {node.status.charAt(0).toUpperCase() + node.status.slice(1)}
            </div>
            <span className="text-sm text-muted-foreground">pNode Details</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Pubkey */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Full Public Key
            </label>
            <CopyButton text={node.pubkey} label="Copy" />
          </div>

          {/* Health Score */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Health Score</span>
              </div>
              <div className="flex items-center gap-3">
                {node.tier && (
                  <span className={cn(
                    'text-xs px-2 py-1 rounded-full font-medium',
                    node.tier === 'Excellent' ? 'bg-primary/20 text-primary' :
                    node.tier === 'Good' ? 'bg-warning/20 text-warning' :
                    'bg-destructive/20 text-destructive'
                  )}>
                    {node.tier}
                  </span>
                )}
                <span className={cn('text-2xl font-bold', healthColor)}>
                  {node.healthScore?.toFixed(1) || 'N/A'}
                </span>
              </div>
            </div>
            <Progress
              value={node.healthScore || 0}
              className="h-2"
            />
            {node.tier && (
              <div className="mt-2 text-xs text-muted-foreground">
                {node.tier === 'Excellent' && '≥90: Excellent performance'}
                {node.tier === 'Good' && '75-89: Good performance'}
                {node.tier === 'Poor' && '<75: Needs attention'}
              </div>
            )}
          </div>

          {/* Storage Usage */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-3">
              <HardDrive className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Storage Usage</span>
            </div>
            <div className="space-y-3">
              <Progress
                value={storagePercentage}
                className={cn(
                  'h-3',
                  storagePercentage > 80 ? '[&>div]:bg-destructive' : storagePercentage > 60 ? '[&>div]:bg-warning' : ''
                )}
              />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {formatStorage(node.storageUsed)} used
                </span>
                <span className="text-foreground font-medium">
                  {storagePercentage.toFixed(2)}%
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Total capacity: {formatStorage(node.storageTotal)}
              </div>
              {node.storageUtilization !== undefined && (
                <div className="text-xs text-muted-foreground pt-1 border-t border-border">
                  Utilization: {formatPercentage(node.storageUtilization, 2)}
                </div>
              )}
            </div>
          </div>

          {/* Uptime Metrics */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Uptime Metrics</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">30-day Uptime</span>
                <span className="text-sm font-semibold text-foreground">{formatPercentage(node.uptime, 2)}</span>
              </div>
              {node.uptime24h !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">24h Normalized</span>
                  <span className="text-sm font-semibold text-foreground">{formatPercentage(node.uptime24h, 2)}</span>
                </div>
              )}
            </div>
            <div className="h-16 mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={miniUptimeData}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(142, 71%, 45%)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Version</span>
              </div>
              <span className="text-sm font-medium text-foreground">{node.version}</span>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Region</span>
              </div>
              <span className="text-sm font-medium text-foreground">{node.region}</span>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Last Seen</span>
              </div>
              <span className="text-sm font-medium text-foreground">
                {node.lastSeen.toLocaleTimeString()}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">IP Address</span>
              </div>
              <span className="text-sm font-medium text-foreground">{node.ip}</span>
            </div>
          </div>

          {/* Last Gossip */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border">
            <span className="text-xs text-muted-foreground">Last Gossip Timestamp</span>
            <p className="text-sm font-mono text-foreground mt-1">
              {node.lastSeen.toISOString()}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
