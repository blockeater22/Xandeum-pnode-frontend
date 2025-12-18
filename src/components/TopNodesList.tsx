import { Trophy, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPercentage } from '@/lib/format';
import type { TopNode } from '@/lib/api';

interface TopNodesListProps {
  topNodes: TopNode[];
  isLoading?: boolean;
  onSelectNode?: (pubkey: string) => void;
}

export const TopNodesList = ({ topNodes, isLoading, onSelectNode }: TopNodesListProps) => {
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-card border border-border p-6">
        <div className="text-muted-foreground">Loading top nodes...</div>
      </div>
    );
  }

  if (topNodes.length === 0) {
    return (
      <div className="rounded-2xl bg-card border border-border p-6">
        <div className="text-muted-foreground">No top nodes available</div>
      </div>
    );
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-amber-600';
    return 'text-muted-foreground';
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) return <Trophy className={cn('w-4 h-4', getRankColor(rank))} />;
    return null;
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-6">
      <div className="mb-6 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Top Performing Nodes</h3>
      </div>
      <div className="space-y-3">
        {topNodes.map((node, index) => {
          const rank = index + 1;
          return (
            <div
              key={node.pubkey}
              onClick={() => onSelectNode?.(node.pubkey)}
              className={cn(
                'flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border',
                'hover:bg-secondary/50 cursor-pointer transition-colors',
                onSelectNode && 'cursor-pointer'
              )}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={cn('flex items-center gap-1 w-8', getRankColor(rank))}>
                  {getRankIcon(rank) || <span className="text-sm font-semibold">#{rank}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <code className="text-sm font-mono text-foreground block truncate">
                    {node.pubkey.substring(0, 8)}...{node.pubkey.substring(node.pubkey.length - 6)}
                  </code>
                </div>
              </div>
              <div className="flex items-center gap-4 ml-4">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Health</div>
                  <div className="text-sm font-semibold text-foreground">
                    {formatPercentage(node.healthScore, 1)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Uptime</div>
                  <div className="text-sm font-semibold text-foreground">
                    {formatPercentage(node.uptime24h, 1)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

