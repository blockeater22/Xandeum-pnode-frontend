import { useState, useEffect, useCallback } from 'react';
import { apiClient, type BackendPNode, type AnalyticsSummary, type StorageAnalytics, type NodeMetrics, type ExtendedSummary, type TopNode, type MapNode } from '@/lib/api';

export interface PNode {
  pubkey: string;
  status: 'online' | 'offline'; // Backend only provides online/offline
  version: string;
  storageUsed: number;
  storageTotal: number;
  uptime: number;
  ip: string;
  region: string;
  lastSeen: Date;
  healthScore: number;
  tier?: 'Excellent' | 'Good' | 'Poor';
  storageUtilization?: number;
  uptime24h?: number;
  ramUsed?: number;
  ramTotal?: number;
}

export interface NetworkStats {
  totalNodes: number;
  onlineNodes: number;
  averageUptime: number;
  totalStorageUsed: number;
  totalStorageCapacity: number;
  totalStorageUsedTB: number;
  totalStorageCapacityTB: number;
  consensusVersion: string; // Most common version used by nodes
}

function mapBackendPNodeToFrontend(backendNode: BackendPNode): PNode {
  const getRegionFromIP = (ip: string): string => {
    if (!ip) return 'Unknown';
    const parts = ip.split('.');
    if (parts.length < 2) return 'Unknown';
    const firstOctet = parseInt(parts[0]);
    if (firstOctet < 64) return 'US-East';
    if (firstOctet < 128) return 'US-West';
    if (firstOctet < 192) return 'EU-West';
    return 'Asia-Pacific';
  };

  return {
    pubkey: backendNode.pubkey,
    status: backendNode.status,
    version: backendNode.version,
    storageUsed: backendNode.storageUsed,
    storageTotal: backendNode.storageTotal,
    uptime: backendNode.uptime,
    ip: backendNode.ip,
    region: getRegionFromIP(backendNode.ip),
    lastSeen: new Date(backendNode.lastSeen),
    healthScore: 0,
    ramUsed: backendNode.ramUsed,
    ramTotal: backendNode.ramTotal,
  };
}

function generateUptimeHistory(averageUptime: number): { time: string; uptime: number }[] {
  const now = new Date();
  const history: { time: string; uptime: number }[] = [];
  
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now);
    hour.setHours(hour.getHours() - i);
    const timeStr = `${hour.getHours().toString().padStart(2, '0')}:00`;
    const variation = (Math.random() - 0.5) * 4;
    const uptime = Math.max(0, Math.min(100, averageUptime + variation));
    history.push({ time: timeStr, uptime });
  }
  
  return history;
}

function convertStorageToDistribution(storageData: StorageAnalytics[]): { range: string; count: number }[] {
  const ranges = [
    { range: '0-20%', min: 0, max: 20 },
    { range: '20-40%', min: 20, max: 40 },
    { range: '40-60%', min: 40, max: 60 },
    { range: '60-80%', min: 60, max: 80 },
    { range: '80-100%', min: 80, max: 100 },
  ];

  return ranges.map(({ range, min, max }) => {
    const count = storageData.filter(
      (item) => item.utilizationPercent >= min && item.utilizationPercent < (max === 100 ? 101 : max)
    ).length;
    return { range, count };
  });
}

export const usePNodes = (autoRefresh: boolean = true) => {
  const [pnodes, setPNodes] = useState<PNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [uptimeHistory, setUptimeHistory] = useState<{ time: string; uptime: number }[]>([]);
  const [storageDistribution, setStorageDistribution] = useState<{ range: string; count: number }[]>([]);
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
  const [extendedSummary, setExtendedSummary] = useState<ExtendedSummary | null>(null);
  const [nodeMetrics, setNodeMetrics] = useState<NodeMetrics[]>([]);
  const [topNodes, setTopNodes] = useState<TopNode[]>([]);
  const [mapNodes, setMapNodes] = useState<MapNode[]>([]);
  const [mapLoading, setMapLoading] = useState(true);

  const fetchPNodes = useCallback(async () => {
    try {
      setError(null);
      
      const [nodesData, summaryData, storageData, extendedData, metricsData, topNodesData] = await Promise.all([
        apiClient.getPNodes(),
        apiClient.getAnalyticsSummary(),
        apiClient.getStorageAnalytics(),
        apiClient.getExtendedSummary(),
        apiClient.getNodeMetrics(),
        apiClient.getTopNodes(),
      ]);

      setMapLoading(true);
      apiClient.getMapNodes()
        .then((mapData) => {
          setMapNodes(mapData);
          setMapLoading(false);
        })
        .catch((error) => {
          setMapNodes([]);
          setMapLoading(false);
        });

      const mappedNodes = nodesData.map(mapBackendPNodeToFrontend);
      
      const seen = new Set<string>();
      const uniqueNodes = mappedNodes.filter(node => {
        if (seen.has(node.pubkey)) {
          return false;
        }
        seen.add(node.pubkey);
        return true;
      });
      
      const metricsMap = new Map(metricsData.map(m => [m.pubkey, m]));
      const enrichedNodes = uniqueNodes.map(node => {
        const metrics = metricsMap.get(node.pubkey);
        return {
          ...node,
          healthScore: metrics?.healthScore ?? node.healthScore,
          tier: metrics?.tier,
          storageUtilization: metrics?.storageUtilization,
          uptime24h: metrics?.uptime24h,
        };
      });
      
      setPNodes(enrichedNodes);
      setAnalyticsSummary(summaryData);
      setExtendedSummary(extendedData);
      setNodeMetrics(metricsData);
      setTopNodes(topNodesData);
      
      const history = generateUptimeHistory(summaryData.averageUptime);
      setUptimeHistory(history);
      
      const distribution = convertStorageToDistribution(storageData);
      setStorageDistribution(distribution);
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching pNodes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch pNodes. Make sure the backend is running on http://localhost:3000');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchPNodes();
  }, [fetchPNodes]);

  useEffect(() => {
    fetchPNodes();
  }, [fetchPNodes]);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchPNodes();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchPNodes]);

  const stats: NetworkStats = analyticsSummary
    ? {
        totalNodes: analyticsSummary.totalPNodes,
        onlineNodes: analyticsSummary.onlinePNodes,
        averageUptime: analyticsSummary.averageUptime,
        totalStorageUsed: analyticsSummary.totalStorageUsed,
        totalStorageCapacity: analyticsSummary.totalStorageCapacity,
        totalStorageUsedTB: analyticsSummary.totalStorageUsedTB || 0,
        totalStorageCapacityTB: analyticsSummary.totalStorageCapacityTB || 0,
        consensusVersion: analyticsSummary.consensusVersion || 'unknown',
      }
    : {
        totalNodes: pnodes.length,
        onlineNodes: pnodes.filter(n => n.status === 'online').length,
        averageUptime: pnodes.length > 0 
          ? pnodes.reduce((acc, n) => acc + n.uptime, 0) / pnodes.length 
          : 0,
        totalStorageUsed: pnodes.reduce((acc, n) => acc + n.storageUsed, 0),
        totalStorageCapacity: pnodes.reduce((acc, n) => acc + n.storageTotal, 0),
        totalStorageUsedTB: 0,
        totalStorageCapacityTB: 0,
        consensusVersion: (() => {
          const versionMap = new Map<string, number>();
          pnodes.forEach(n => {
            const version = n.version || 'unknown';
            versionMap.set(version, (versionMap.get(version) || 0) + 1);
          });
          let consensusVersion = 'unknown';
          let maxCount = 0;
          for (const [version, count] of versionMap.entries()) {
            if (count > maxCount) {
              maxCount = count;
              consensusVersion = version;
            }
          }
          return consensusVersion;
        })(),
      };

  return {
    pnodes,
    stats,
    loading,
    error,
    lastUpdated,
    refresh,
    uptimeHistory,
    storageDistribution,
    extendedSummary,
    nodeMetrics,
    topNodes,
    mapNodes,
    mapLoading,
  };
};
