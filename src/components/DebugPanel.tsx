/**
 * Debug Panel Component
 * 
 * Shows raw API values and derived calculations for data accuracy validation.
 * Enable via ?debug=true in URL.
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DebugPanelProps {
  apiData: {
    pnodes?: any[];
    summary?: any;
    extendedSummary?: any;
    nodeMetrics?: any[];
    storagePressure?: any;
    uptimeHistory?: any[];
    storageDistribution?: any[];
    mapNodes?: any[];
    topNodes?: any[];
  };
}

export const DebugPanel = ({ apiData }: DebugPanelProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const debugMode = searchParams.get('debug') === 'true';

  useEffect(() => {
    setIsOpen(debugMode);
  }, [debugMode]);

  if (!debugMode) return null;

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={togglePanel}
        variant="outline"
        size="sm"
        className="mb-2 bg-card border-border"
      >
        {isOpen ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
        {isOpen ? 'Hide' : 'Show'} Debug
      </Button>

      {isOpen && (
        <Card className="w-[600px] max-h-[80vh] overflow-y-auto bg-card border-border shadow-2xl">
          <CardHeader className="sticky top-0 bg-card border-b border-border z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">🔍 Debug Panel</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchParams({});
                  setIsOpen(false);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Raw API values and derived calculations for validation
            </p>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Summary Stats */}
            {apiData.summary && (
              <div>
                <h3 className="text-sm font-semibold mb-2">📊 Summary Stats</h3>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  {JSON.stringify(apiData.summary, null, 2)}
                </pre>
              </div>
            )}

            {/* Extended Summary */}
            {apiData.extendedSummary && (
              <div>
                <h3 className="text-sm font-semibold mb-2">📈 Extended Summary</h3>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  {JSON.stringify(apiData.extendedSummary, null, 2)}
                </pre>
              </div>
            )}

            {/* Node Counts Validation */}
            {apiData.pnodes && apiData.summary && (
              <div>
                <h3 className="text-sm font-semibold mb-2">✅ Validation Checks</h3>
                <div className="space-y-1 text-xs">
                  <div className={cn(
                    "p-2 rounded",
                    apiData.pnodes.length === apiData.summary.totalPNodes
                      ? "bg-green-500/10 text-green-400"
                      : "bg-red-500/10 text-red-400"
                  )}>
                    Total Nodes: /pnodes={apiData.pnodes.length}, /summary={apiData.summary.totalPNodes}
                    {apiData.pnodes.length === apiData.summary.totalPNodes ? ' ✓' : ' ✗'}
                    {apiData.pnodes.length !== apiData.summary.totalPNodes && (
                      <span className="block text-xs text-muted-foreground mt-1">
                        Note: Backend now deduplicates nodes, so counts should match
                      </span>
                    )}
                  </div>
                  <div className={cn(
                    "p-2 rounded",
                    apiData.pnodes.filter(n => n.status === 'online').length === apiData.summary.onlinePNodes
                      ? "bg-green-500/10 text-green-400"
                      : "bg-red-500/10 text-red-400"
                  )}>
                    Online Nodes: /pnodes={apiData.pnodes.filter(n => n.status === 'online').length}, /summary={apiData.summary.onlinePNodes}
                    {apiData.pnodes.filter(n => n.status === 'online').length === apiData.summary.onlinePNodes ? ' ✓' : ' ✗'}
                  </div>
                </div>
              </div>
            )}

            {/* Sample Node Metrics */}
            {apiData.nodeMetrics && apiData.nodeMetrics.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">
                  📦 Sample Node Metrics (First 3)
                </h3>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  {JSON.stringify(apiData.nodeMetrics.slice(0, 3), null, 2)}
                </pre>
              </div>
            )}

            {/* Storage Pressure */}
            {apiData.storagePressure && (
              <div>
                <h3 className="text-sm font-semibold mb-2">💾 Storage Pressure</h3>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  {JSON.stringify(apiData.storagePressure, null, 2)}
                </pre>
              </div>
            )}

            {/* Tier Distribution */}
            {apiData.nodeMetrics && (
              <div>
                <h3 className="text-sm font-semibold mb-2">🎯 Tier Distribution</h3>
                <div className="text-xs space-y-1">
                  <div>Excellent: {apiData.nodeMetrics.filter(m => m.tier === 'Excellent').length}</div>
                  <div>Good: {apiData.nodeMetrics.filter(m => m.tier === 'Good').length}</div>
                  <div>Poor: {apiData.nodeMetrics.filter(m => m.tier === 'Poor').length}</div>
                  <div className="mt-2 font-semibold">
                    Total: {apiData.nodeMetrics.length}
                    {apiData.nodeMetrics.length === (apiData.pnodes?.length || 0) ? ' ✓' : ' ✗'}
                  </div>
                </div>
              </div>
            )}

            {/* Uptime History (for UptimeChart) */}
            {apiData.uptimeHistory && apiData.uptimeHistory.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">⏱️ Uptime History (Chart Data)</h3>
                <div className="text-xs space-y-1 mb-2">
                  <div>Data Points: {apiData.uptimeHistory.length}</div>
                  <div>Latest: {apiData.uptimeHistory[apiData.uptimeHistory.length - 1]?.time} - {apiData.uptimeHistory[apiData.uptimeHistory.length - 1]?.uptime?.toFixed(2)}%</div>
                </div>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-32">
                  {JSON.stringify(apiData.uptimeHistory.slice(-5), null, 2)}
                </pre>
                <p className="text-xs text-muted-foreground mt-1">Showing last 5 data points</p>
              </div>
            )}

            {/* Storage Distribution (for StorageChart) */}
            {apiData.storageDistribution && apiData.storageDistribution.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">💾 Storage Distribution (Chart Data)</h3>
                <div className="text-xs space-y-1 mb-2">
                  <div>Ranges: {apiData.storageDistribution.length}</div>
                  <div>Total Nodes in Chart: {apiData.storageDistribution.reduce((sum: number, item: any) => sum + (item.count || 0), 0)}</div>
                </div>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  {JSON.stringify(apiData.storageDistribution, null, 2)}
                </pre>
              </div>
            )}

            {/* Map Nodes */}
            {apiData.mapNodes && apiData.mapNodes.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">🗺️ Map Nodes</h3>
                <div className="text-xs space-y-1 mb-2">
                  <div>Total Map Nodes: {apiData.mapNodes.length}</div>
                  <div>With Geo Data: {apiData.mapNodes.filter((n: any) => n.lat && n.lng).length}</div>
                  <div>Online on Map: {apiData.mapNodes.filter((n: any) => n.status === 'online').length}</div>
                </div>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-32">
                  {JSON.stringify(apiData.mapNodes.slice(0, 3), null, 2)}
                </pre>
                <p className="text-xs text-muted-foreground mt-1">Showing first 3 map nodes</p>
              </div>
            )}

            {/* Top Nodes */}
            {apiData.topNodes && apiData.topNodes.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">🏆 Top Nodes (Top 10)</h3>
                <div className="text-xs space-y-1 mb-2">
                  <div>Count: {apiData.topNodes.length}</div>
                  <div>Best Health Score: {apiData.topNodes[0]?.healthScore?.toFixed(2)}%</div>
                </div>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-32">
                  {JSON.stringify(apiData.topNodes.slice(0, 5), null, 2)}
                </pre>
                <p className="text-xs text-muted-foreground mt-1">Showing top 5 nodes</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

