/**
 * API Configuration
 * Base URL for the backend API
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Backend API response types
 */
export interface BackendPNode {
  pubkey: string;
  status: 'online' | 'offline';
  version: string;
  storageUsed: number;
  storageTotal: number;
  uptime: number;
  ip: string;
  lastSeen: string;
  ramUsed?: number; // RAM data pre-fetched and cached in Redis
  ramTotal?: number; // RAM data pre-fetched and cached in Redis
}

export interface AnalyticsSummary {
  totalPNodes: number;
  onlinePNodes: number;
  onlinePercentage: number;
  averageUptime: number;
  totalStorageUsed: number;
  totalStorageCapacity: number;
  totalStorageUsedTB: number;
  totalStorageCapacityTB: number;
  networkHealth: 'healthy' | 'degraded' | 'unstable';
  consensusVersion: string; // Most common version used by nodes
}

export interface StorageAnalytics {
  pubkey: string;
  storageUsed: number;
  storageTotal: number;
  utilizationPercent: number;
}

export interface VersionDistribution {
  version: string;
  count: number;
}

export interface ExtendedSummary {
  totalPNodes: number;
  onlinePercentage: number;
  averageUptime24h: number;
  averageHealthScore: number;
  storagePressurePercent: number;
  networkHealth: 'healthy' | 'degraded' | 'unstable';
}

export interface NodeMetrics {
  pubkey: string;
  healthScore: number;
  uptime24h: number;
  storageUtilization: number;
  tier: 'Excellent' | 'Good' | 'Poor';
}

export interface TopNode {
  pubkey: string;
  healthScore: number;
  uptime24h: number;
}

export interface StoragePressure {
  highPressureNodes: number;
  totalNodes: number;
  percent: number;
}

export interface MapNode {
  pubkey: string;
  lat: number;
  lng: number;
  country: string;
  region: string;
  status: 'online' | 'offline';
  healthScore: number;
  uptime24h: number;
  storageUtilization: number;
  version: string;
  lastSeen: string;
}

export interface GeoSummary {
  countries: Array<{ country: string; count: number }>;
  regions: Array<{ region: string; count: number }>;
}

export interface NodeStats {
  active_streams: number;
  cpu_percent: number;
  current_index: number;
  file_size: number;
  last_updated: number;
  packets_received: number;
  packets_sent: number;
  ram_total: number;
  ram_used: number;
  total_bytes: number;
  total_pages: number;
  uptime: number;
  timestamp?: string; // ISO timestamp when stats were collected
}

/**
 * API Client
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, timeoutMs: number = 30000): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
      throw error;
    }
  }

  async getPNodes(): Promise<BackendPNode[]> {
    return this.request<BackendPNode[]>('/pnodes');
  }

  async getPNode(pubkey: string): Promise<BackendPNode> {
    return this.request<BackendPNode>(`/pnodes/${pubkey}`);
  }

  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    return this.request<AnalyticsSummary>('/analytics/summary');
  }

  async getStorageAnalytics(): Promise<StorageAnalytics[]> {
    return this.request<StorageAnalytics[]>('/analytics/storage');
  }

  async getVersionDistribution(): Promise<VersionDistribution[]> {
    return this.request<VersionDistribution[]>('/analytics/versions');
  }

  async getExtendedSummary(): Promise<ExtendedSummary> {
    return this.request<ExtendedSummary>('/analytics/extended-summary');
  }

  async getNodeMetrics(): Promise<NodeMetrics[]> {
    return this.request<NodeMetrics[]>('/analytics/node-metrics');
  }

  async getTopNodes(): Promise<TopNode[]> {
    return this.request<TopNode[]>('/analytics/top-nodes');
  }

  async getStoragePressure(): Promise<StoragePressure> {
    return this.request<StoragePressure>('/analytics/storage-pressure');
  }

  async getMapNodes(): Promise<MapNode[]> {
    // Map endpoint can take longer, so use extended timeout
    return this.request<MapNode[]>('/pnodes/map', 60000); // 60 second timeout
  }

  async getGeoSummary(): Promise<GeoSummary> {
    return this.request<GeoSummary>('/analytics/geo-summary');
  }

  async getNodeStats(pubkey: string): Promise<NodeStats> {
    // Use longer timeout for stats requests as they can take time
    return this.request<NodeStats>(`/pnodes/${pubkey}/stats`, 15000); // 15 second timeout
  }

  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

