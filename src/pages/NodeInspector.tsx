import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Info, ExternalLink, Shield, Trophy, HardDrive, Clock, Globe, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { formatStorage, calculatePercentage, formatRelativeTime, shortenPubkey } from '@/lib/format';
import { apiClient, type NodeStats } from '@/lib/api';
import { usePNodes, type PNode } from '@/hooks/usePNodes';

const CopyButton = ({ text, label }: { text: string; label?: string }) => {
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

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  return parts.length > 0 ? parts.join(' ') : '0m';
};

export default function NodeInspector() {
  const { pubkey } = useParams<{ pubkey: string }>();
  const navigate = useNavigate();
  const { pnodes, isLoading } = usePNodes(false);
  const [node, setNode] = useState<PNode | null>(null);
  const [nodeStats, setNodeStats] = useState<NodeStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (!pubkey || !pnodes.length) return;
    const foundNode = pnodes.find(n => n.pubkey === pubkey);
    setNode(foundNode || null);
  }, [pubkey, pnodes]);

  useEffect(() => {
    if (!node) return;

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="h-64 rounded-xl bg-card border border-border animate-pulse" />
        </div>
      </div>
    );
  }

  if (!node) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Node not found</p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const storageUtilization = node.storageTotal > 0 
    ? (node.storageUsed / node.storageTotal) * 100 
    : 0;
  const healthScore = node.healthScore || 0;
  const tier = node.tier || (healthScore >= 90 ? 'Excellent' : healthScore >= 75 ? 'Good' : 'Poor');
  const isPublic = node.ip && node.ip !== 'unknown';
  const rpcEndpoint = isPublic ? `http://${node.ip}:9001` : null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/')} variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Node Inspector</h1>
              <p className="text-sm text-muted-foreground mt-1">Version {node.version}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <span className="text-xl">×</span>
          </Button>
        </div>

        {/* Address */}
        <div className="rounded-xl bg-card border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Address</p>
              <p className="text-sm font-mono">{node.ip || 'Unknown'}</p>
            </div>
            <CopyButton text={node.ip || ''} />
          </div>
        </div>

        {/* Health Score and Visibility */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-card border border-border p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Health Score</span>
              <Info className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="text-5xl font-bold text-foreground">{Math.round(healthScore)}</div>
          </div>
          <div className="rounded-xl bg-card border border-border p-6">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Visibility</span>
            </div>
            <div className={cn(
              "text-2xl font-bold",
              isPublic ? "text-primary" : "text-warning"
            )}>
              {isPublic ? 'PUBLIC' : 'PRIVATE'}
            </div>
          </div>
        </div>

        {/* Network Rewards */}
        <div className="rounded-xl bg-card border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold uppercase tracking-wider">Network Rewards</span>
              <Info className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg bg-secondary/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-warning" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Global Rank</span>
              </div>
              <div className="text-2xl font-bold text-warning">
                #{nodeStats ? '129' : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Storage Metrics */}
        <div className="rounded-xl bg-card border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-semibold uppercase tracking-wider">Storage Metrics</span>
            <Info className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Used</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-primary">{formatStorage(node.storageUsed)}</span>
                  <span className="text-xs text-muted-foreground">RAW {node.storageUsed.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Committed</span>
                <span className="text-sm font-semibold text-primary">{formatStorage(node.storageTotal)}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Utilization</span>
                  <Info className="w-3 h-3 text-muted-foreground" />
                </div>
                <span className="text-sm font-semibold text-primary">
                  {storageUtilization < 0.01 ? '< 0.01' : storageUtilization.toFixed(2)}%
                </span>
              </div>
              <Progress value={storageUtilization} className="mt-2" />
            </div>
          </div>
        </div>

        {/* Node Information */}
        <div className="rounded-xl bg-card border border-border p-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Last Seen</p>
              <p className="text-sm">
                {formatRelativeTime(node.lastSeen)} ({node.lastSeen.toLocaleString()})
              </p>
            </div>
            {rpcEndpoint && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">RPC Endpoint</p>
                <CopyButton text={rpcEndpoint} />
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Public Key</p>
              <CopyButton text={node.pubkey} />
            </div>
            {nodeStats && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Uptime</p>
                <p className="text-sm">{formatUptime(nodeStats.uptime)}</p>
              </div>
            )}
            {nodeStats && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <Activity className={cn(
                    "w-4 h-4",
                    node.status === 'online' ? "text-primary" : "text-destructive"
                  )} />
                  <span className="text-sm capitalize">{node.status}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

