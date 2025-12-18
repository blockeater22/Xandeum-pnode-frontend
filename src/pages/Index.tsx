import { useState } from 'react';
import { Server, Percent, Clock, HardDrive, Activity, AlertTriangle, TrendingUp, Code } from 'lucide-react';
import { Header } from '@/components/Header';
import { MetricCard, MetricCardSkeleton } from '@/components/MetricCard';
import { MetricDetailDialog } from '@/components/MetricDetailDialog';
import { DebugPanel } from '@/components/DebugPanel';
import { UptimeChart } from '@/components/UptimeChart';
import { StorageChart } from '@/components/StorageChart';
import { PNodesTable } from '@/components/PNodesTable';
import { PNodeDetailsPanel } from '@/components/PNodeDetailsPanel';
import { PNodesMap } from '@/components/PNodesMap';
import { Footer } from '@/components/Footer';
import { usePNodes, type PNode } from '@/hooks/usePNodes';

const Index = () => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedNode, setSelectedNode] = useState<PNode | null>(null);
  const [metricDialog, setMetricDialog] = useState<{ open: boolean; type: string; title: string } | null>(null);
  
  const handleNodeSelect = (node: PNode) => {
    setSelectedNode(node);
  };
  
  const {
    pnodes,
    stats,
    loading,
    error,
    lastUpdated,
    refresh,
    uptimeHistory,
    storageDistribution,
    extendedSummary,
    topNodes,
    nodeMetrics,
    mapNodes,
    mapLoading,
  } = usePNodes(autoRefresh);

  const networkHealth = stats.totalNodes > 0 && stats.onlineNodes / stats.totalNodes >= 0.60
    ? 'healthy'
    : stats.totalNodes > 0 && stats.onlineNodes / stats.totalNodes >= 0.40
    ? 'degraded'
    : 'critical';

  return (
    <div className="min-h-screen bg-background">
      <Header
        lastUpdated={lastUpdated}
        onRefresh={refresh}
        autoRefresh={autoRefresh}
        onAutoRefreshChange={setAutoRefresh}
        networkHealth={networkHealth}
        isLoading={loading}
      />

      <main className="container py-10 space-y-12">
        {/* Error State */}
        {error && (
          <div className="p-8 rounded-2xl bg-destructive/10 border border-destructive/30 text-center">
            <p className="text-destructive font-semibold mb-4 text-lg">{error}</p>
            <button
              onClick={refresh}
              className="px-6 py-2.5 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-all font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Metric Cards - Row 1: Basic Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {loading ? (
            <>
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </>
          ) : (
            <>
              <MetricCard
                title="Total pNodes"
                value={stats.totalNodes}
                icon={Server}
                delay={0}
              />
              <MetricCard
                title="Online"
                value={stats.totalNodes > 0 ? (stats.onlineNodes / stats.totalNodes) * 100 : 0}
                icon={Percent}
                format="percentage"
                delay={80}
                onClick={() => setMetricDialog({ 
                  open: true, 
                  type: 'online', 
                  title: 'Online Status' 
                })}
              />
              {extendedSummary && (
                <MetricCard
                  title="Avg Health Score"
                  value={extendedSummary.averageHealthScore}
                  icon={Activity}
                  format="percentage"
                  delay={160}
                />
              )}
              <MetricCard
                title="Total Storage"
                value={Math.round((stats.totalStorageCapacityTB || 0) * 100) / 100}
                suffix=" TB"
                icon={HardDrive}
                format="number"
                delay={240}
                onClick={() => setMetricDialog({ 
                  open: true, 
                  type: 'storage', 
                  title: 'Total Storage' 
                })}
              />
            </>
          )}
        </section>

        {/* Metric Cards - Row 2: Advanced Metrics */}
        {extendedSummary && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {loading ? (
              <>
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
                <MetricCardSkeleton />
              </>
            ) : (
              <>
                <MetricCard
                  title="Consensus Version"
                  value={stats.consensusVersion || 'unknown'}
                  icon={Code}
                  format="number"
                  delay={0}
                />
                <MetricCard
                  title="Network Stability"
                  value={extendedSummary.networkHealth === 'healthy' ? 100 : extendedSummary.networkHealth === 'degraded' ? 75 : 50}
                  icon={TrendingUp}
                  format="percentage"
                  delay={80}
                />
                <MetricCard
                  title="Storage Pressure"
                  value={extendedSummary.storagePressurePercent}
                  icon={AlertTriangle}
                  format="percentage"
                  delay={160}
                />
                <MetricCard
                  title="Avg Uptime (24h)"
                  value={extendedSummary.averageUptime24h}
                  icon={Clock}
                  format="percentage"
                  delay={240}
                />
              </>
            )}
          </section>
        )}

        {/* Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UptimeChart data={uptimeHistory} isLoading={loading} />
          <StorageChart data={storageDistribution} isLoading={loading} />
        </section>

        {/* Global Map */}
        <section>
          <div className="mb-6">
            <h2 className="section-title">Global pNode Distribution</h2>
          </div>
          <PNodesMap
            mapNodes={mapNodes}
            isLoading={mapLoading}
            onNodeClick={(pubkey) => {
              const node = pnodes.find(n => n.pubkey === pubkey);
              if (node) setSelectedNode(node);
            }}
          />
        </section>

        {/* Table */}
        <section>
          <div className="mb-6">
            <h2 className="section-title">pNode Directory</h2>
            <p className="section-subtitle">
              Click on any node to view detailed information
            </p>
          </div>
          <PNodesTable
            pnodes={pnodes}
            isLoading={loading}
            onSelectNode={handleNodeSelect}
          />
        </section>
      </main>

      <Footer />

      {/* Detail Panel */}
      <PNodeDetailsPanel
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
      />

      {/* Metric Detail Dialog */}
      {metricDialog && (
        <MetricDetailDialog
          open={metricDialog.open}
          onOpenChange={(open) => {
            if (!open) {
              setMetricDialog(null);
            } else {
              setMetricDialog({ ...metricDialog, open: true });
            }
          }}
          title={metricDialog.title}
          type={metricDialog.type as 'storage' | 'online' | 'uptime' | 'health' | 'pressure' | 'stability'}
          data={
            metricDialog.type === 'storage' ? {
              totalCapacityTB: stats.totalStorageCapacityTB,
              totalCapacityGB: stats.totalStorageCapacity / (1024 ** 3),
              usedTB: stats.totalStorageUsedTB,
              usedGB: stats.totalStorageUsed / (1024 ** 3),
              usedPercentage: stats.totalStorageCapacity > 0 
                ? (stats.totalStorageUsed / stats.totalStorageCapacity) * 100 
                : 0,
            } :
            metricDialog.type === 'online' ? {
              totalNodes: stats.totalNodes,
              onlineNodes: stats.onlineNodes,
              offlineNodes: stats.totalNodes - stats.onlineNodes,
              onlinePercentage: stats.totalNodes > 0 ? (stats.onlineNodes / stats.totalNodes) * 100 : 0,
            } :
            metricDialog.type === 'uptime' ? {
              averageUptime: stats.averageUptime,
            } :
            metricDialog.type === 'health' ? {
              averageHealthScore: extendedSummary?.averageHealthScore,
            } :
            metricDialog.type === 'pressure' ? {
              storagePressurePercent: extendedSummary?.storagePressurePercent,
            } :
            metricDialog.type === 'stability' ? {
              networkHealth: extendedSummary?.networkHealth,
              stabilityValue: extendedSummary?.networkHealth === 'healthy' ? 100 : extendedSummary?.networkHealth === 'degraded' ? 75 : 50,
            } :
            undefined
          }
        />
      )}

      {/* Debug Panel */}
      <DebugPanel
        apiData={{
          pnodes,
          summary: stats,
          extendedSummary,
          nodeMetrics,
          storagePressure: extendedSummary ? {
            highPressureNodes: extendedSummary.storagePressurePercent ? Math.round((extendedSummary.storagePressurePercent / 100) * stats.totalNodes) : 0,
            totalNodes: stats.totalNodes,
            percent: extendedSummary.storagePressurePercent || 0,
          } : undefined,
          uptimeHistory,
          storageDistribution,
          mapNodes,
          topNodes,
        }}
      />
    </div>
  );
};

export default Index;
