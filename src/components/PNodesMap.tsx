import { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents, useMapEvent } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster'; // Import to add markerClusterGroup to L
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MapNode } from '@/lib/api';
import { MapMarker } from './MapMarker';
import { MapFilters } from './MapFilters';
import { cn } from '@/lib/utils';

// Import markercluster CSS
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// Fix for default marker icon in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface PNodesMapProps {
  mapNodes: MapNode[];
  isLoading?: boolean;
  onNodeClick?: (pubkey: string) => void;
}

/**
 * Dark theme tile layer component
 */
const DarkTileLayer = () => {
  return (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      maxZoom={19}
      minZoom={1}
      noWrap={false}
    />
  );
};

/**
 * Component to handle map view updates
 */
const MapViewUpdater = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
};

/**
 * Component to enable/disable scroll wheel zoom based on map click
 */
const MapZoomController = ({ 
  isActive, 
  onActivate 
}: { 
  isActive: boolean; 
  onActivate: () => void;
}) => {
  const map = useMap();

  useEffect(() => {
    if (isActive) {
      map.scrollWheelZoom.enable();
    } else {
      map.scrollWheelZoom.disable();
    }
  }, [map, isActive]);

  // Enable zoom on click anywhere on the map
  useMapEvent('click', () => {
    if (!isActive) {
      onActivate();
    }
  });

  return null;
};

/**
 * Markers layer component that handles clustering
 */
const MarkersLayer = ({
  nodes,
  enableClustering,
  onNodeClick,
  onPopupOpen,
}: {
  nodes: MapNode[];
  enableClustering: boolean;
  onNodeClick?: (pubkey: string) => void;
  onPopupOpen?: () => void;
}) => {
  const map = useMap();
  const clusterGroupRef = useRef<any>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    // Function to adjust popup position to avoid UI elements
    const adjustPopupPosition = (marker: L.Marker, popup: L.Popup) => {
      setTimeout(() => {
        const mapSize = map.getSize();
        const markerPoint = map.latLngToContainerPoint(marker.getLatLng());
        
        // Define UI element areas (top-right for filters, bottom-left for legend)
        const filterArea = { x: mapSize.x - 280, y: 0, width: 280, height: 350 };
        const legendArea = { x: 0, y: mapSize.y - 250, width: 280, height: 250 };
        
        // Check if marker is in or near UI element areas
        const isNearFilters = markerPoint.x > filterArea.x && markerPoint.y < filterArea.height;
        const isNearLegend = markerPoint.x < legendArea.width && markerPoint.y > legendArea.y;
        
        if (isNearFilters) {
          // Position popup to the left of the marker when near filters (top-right)
          const popupWidth = popup.options.maxWidth || 300;
          popup.setOffset(L.point(-popupWidth - 30, -10));
          popup.update();
        } else if (isNearLegend) {
          // Position popup to the right of the marker when near legend (bottom-left)
          popup.setOffset(L.point(30, -10));
          popup.update();
        } else {
          // Default position (above marker)
          popup.setOffset(L.point(0, -10));
          popup.update();
        }
      }, 10);
    };
    // Clear existing markers
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }
    markersRef.current.forEach(marker => {
      if (marker) {
        map.removeLayer(marker);
      }
    });
    markersRef.current = [];

    if (enableClustering) {
      // Create cluster group
      const clusterGroup = (L as any).markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
      });

      // Add markers to cluster group
      nodes.forEach((node) => {
        const icon = createMarkerIcon(node);
        const marker = L.marker([node.lat, node.lng], { icon });
        
        // Add popup with options to avoid UI elements
        const popupContent = createPopupContent(node);
        const popup = marker.bindPopup(popupContent, {
          autoPan: true,
          autoPanPadding: L.point(50, 50),
          autoPanPaddingTopLeft: L.point(50, 300), // Extra padding for top-right (where filters are)
          autoPanPaddingBottomRight: L.point(300, 300), // Extra padding for bottom-right (where legend is)
          className: 'custom-popup',
          maxWidth: 300,
          offset: L.point(0, -10),
        });
        
        // Custom positioning to avoid UI elements when popup opens
        marker.on('popupopen', (e) => {
          const popupInstance = e.popup;
          adjustPopupPosition(marker, popupInstance);
          onPopupOpen?.();
        });
        
        // Add click handler
        marker.on('click', () => {
          onNodeClick?.(node.pubkey);
        });

        clusterGroup.addLayer(marker);
      });

      clusterGroup.addTo(map);
      clusterGroupRef.current = clusterGroup;
    } else {
      // Add markers directly to map
      nodes.forEach((node) => {
        const icon = createMarkerIcon(node);
        const marker = L.marker([node.lat, node.lng], { icon });
        
        const popupContent = createPopupContent(node);
        const popup = marker.bindPopup(popupContent, {
          autoPan: true,
          autoPanPadding: L.point(50, 50),
          autoPanPaddingTopLeft: L.point(50, 300), // Extra padding for top-right (where filters are)
          autoPanPaddingBottomRight: L.point(300, 300), // Extra padding for bottom-right (where legend is)
          className: 'custom-popup',
          maxWidth: 300,
          offset: L.point(0, -10),
        });
        
        // Custom positioning to avoid UI elements when popup opens
        marker.on('popupopen', (e) => {
          const popupInstance = e.popup;
          adjustPopupPosition(marker, popupInstance);
          onPopupOpen?.();
        });
        
        marker.on('click', () => {
          onNodeClick?.(node.pubkey);
        });

        marker.addTo(map);
        markersRef.current.push(marker);
      });
    }

    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
      }
      markersRef.current.forEach(marker => {
        if (marker) {
          map.removeLayer(marker);
        }
      });
    };
  }, [map, nodes, enableClustering, onNodeClick]);

  return null;
};

/**
 * Create marker icon (extracted from MapMarker for use in clustering)
 */
function createMarkerIcon(node: MapNode): L.DivIcon {
  let color = 'hsl(0,84%,60%)'; // Red (Poor)
  if (node.status === 'offline') {
    color = 'hsl(0,0%,50%)'; // Gray
  } else if (node.healthScore >= 85) {
    color = 'hsl(142,71%,45%)'; // Green (Excellent)
  } else if (node.healthScore >= 60) {
    color = 'hsl(38,92%,50%)'; // Yellow (Good)
  }

  const baseSize = 20;
  const sizeVariation = (node.storageUtilization / 100) * 20;
  const markerSize = baseSize + sizeVariation;

  const lastSeenDate = new Date(node.lastSeen);
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  const isRecent = node.status === 'online' && lastSeenDate.getTime() > fiveMinutesAgo;
  const pulseClass = isRecent ? 'animate-pulse' : '';

  const html = `
    <div class="${pulseClass}" style="
      width: ${markerSize}px;
      height: ${markerSize}px;
      background-color: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      cursor: pointer;
      transition: transform 0.2s;
    "></div>
  `;

  return L.divIcon({
    html,
    className: 'custom-marker',
    iconSize: [markerSize, markerSize],
    iconAnchor: [markerSize / 2, markerSize / 2],
  });
}

/**
 * Create popup content HTML
 */
function createPopupContent(node: MapNode): string {
  const lastSeenDate = new Date(node.lastSeen);
  const formatRelativeTime = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 0) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const formatPercentage = (value: number, decimals: number = 1): string => {
    return `${value.toFixed(decimals)}%`;
  };

  // Shorten pubkey format: first 4 chars + .. + last 4 chars
  const shortPubkey = `${node.pubkey.substring(0, 4)}..${node.pubkey.substring(node.pubkey.length - 4)}`;

  return `
    <div style="padding: 12px; min-width: 250px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
        <code style="font-size: 11px; font-family: monospace;">
          ${shortPubkey}
        </code>
        <span style="
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 9999px;
          font-weight: 500;
          ${node.status === 'online' ? 'background-color: rgba(34, 197, 94, 0.2); color: rgb(34, 197, 94);' : 'background-color: rgba(239, 68, 68, 0.2); color: rgb(239, 68, 68);'}
        ">
          ${node.status}
        </span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
        <span style="color: #9ca3af;">Health Score:</span>
        <span style="font-weight: 600;">${formatPercentage(node.healthScore, 1)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
        <span style="color: #9ca3af;">Uptime (24h):</span>
        <span style="font-weight: 500;">${formatPercentage(node.uptime24h, 1)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
        <span style="color: #9ca3af;">Storage Used:</span>
        <span style="font-weight: 500;">${formatPercentage(node.storageUtilization, 1)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
        <span style="color: #9ca3af;">Version:</span>
        <span style="font-weight: 500;">${node.version}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px;">
        <span style="color: #9ca3af;">Last Seen:</span>
        <span style="font-weight: 500;">${formatRelativeTime(lastSeenDate)}</span>
      </div>
      <div style="padding-top: 8px; border-top: 1px solid #374151; font-size: 11px; color: #9ca3af;">
        ${node.city ? `${node.city}, ` : ''}${node.region}, ${node.country}
      </div>
    </div>
  `;
}

export const PNodesMap = ({ mapNodes, isLoading, onNodeClick }: PNodesMapProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [healthTierFilter, setHealthTierFilter] = useState<'all' | 'Excellent' | 'Good' | 'Poor'>('all');
  const [versionFilter, setVersionFilter] = useState<string>('all');
  const [enableClustering, setEnableClustering] = useState(true);
  const [mapActive, setMapActive] = useState(false);

  // Calculate center from nodes (average of all coordinates)
  const mapCenter: [number, number] = useMemo(() => {
    if (mapNodes.length === 0) return [20, 0]; // Default center
    
    const avgLat = mapNodes.reduce((sum, n) => sum + n.lat, 0) / mapNodes.length;
    const avgLng = mapNodes.reduce((sum, n) => sum + n.lng, 0) / mapNodes.length;
    return [avgLat, avgLng];
  }, [mapNodes]);

  // Filter nodes based on filters
  const filteredNodes = useMemo(() => {
    let filtered = [...mapNodes];

    // Filter by online status
    if (showOnlineOnly) {
      filtered = filtered.filter(n => n.status === 'online');
    }

    // Filter by health tier
    if (healthTierFilter !== 'all') {
      filtered = filtered.filter(n => {
        if (healthTierFilter === 'Excellent') return n.healthScore >= 90;
        if (healthTierFilter === 'Good') return n.healthScore >= 75 && n.healthScore < 90;
        if (healthTierFilter === 'Poor') return n.healthScore < 75;
        return true;
      });
    }

    // Filter by version
    if (versionFilter !== 'all') {
      filtered = filtered.filter(n => n.version === versionFilter);
    }

    return filtered;
  }, [mapNodes, showOnlineOnly, healthTierFilter, versionFilter]);

  // Get unique versions for filter
  const versions = useMemo(() => {
    const uniqueVersions = Array.from(new Set(mapNodes.map(n => n.version))).sort();
    return uniqueVersions;
  }, [mapNodes]);

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-card border border-border h-[500px] flex items-center justify-center">
        <div className="text-muted-foreground">Loading map...</div>
      </div>
    );
  }

  if (mapNodes.length === 0) {
    return (
      <div className="rounded-2xl bg-card border border-border h-[500px] flex items-center justify-center">
        <div className="text-muted-foreground">No map data available</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden h-[500px] relative">
      {/* Filter Toggle Button - Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="bg-elevated/95 backdrop-blur-sm border-border"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Filters Panel - Toggleable - Top Right, aligned to right edge */}
      {showFilters && (
        <div className="absolute top-4 right-4 z-20 mt-12">
          <MapFilters
            showOnlineOnly={showOnlineOnly}
            onShowOnlineOnlyChange={setShowOnlineOnly}
            healthTierFilter={healthTierFilter}
            onHealthTierFilterChange={setHealthTierFilter}
            versionFilter={versionFilter}
            onVersionFilterChange={setVersionFilter}
            versions={versions}
            enableClustering={enableClustering}
            onEnableClusteringChange={setEnableClustering}
            onClose={() => setShowFilters(false)}
          />
        </div>
      )}

      {/* Map */}
      <MapContainer
        center={mapCenter}
        zoom={2}
        minZoom={1}
        maxZoom={19}
        style={{ height: '100%', width: '100%', zIndex: 0, backgroundColor: 'hsl(220, 20%, 6%)' }}
        zoomControl={true}
        scrollWheelZoom={false}
        worldCopyJump={true}
      >
        <DarkTileLayer />
        <MapViewUpdater center={mapCenter} zoom={2} />
        <MapZoomController 
          isActive={mapActive} 
          onActivate={() => setMapActive(true)}
        />

        <MarkersLayer
          nodes={filteredNodes}
          enableClustering={enableClustering}
          onNodeClick={onNodeClick}
          onPopupOpen={() => setShowFilters(false)}
        />
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-20 bg-elevated/95 backdrop-blur-sm border border-border rounded-lg p-4 space-y-2 text-xs">
        <div className="font-semibold text-foreground mb-2">Legend</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[hsl(142,71%,45%)]" />
            <span className="text-muted-foreground">Health ≥85 (Excellent)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[hsl(38,92%,50%)]" />
            <span className="text-muted-foreground">Health 60-84 (Good)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[hsl(0,84%,60%)]" />
            <span className="text-muted-foreground">Health &lt;60 (Poor)</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-3 h-3 rounded-full bg-gray-500" />
            <span className="text-muted-foreground">Offline</span>
          </div>
          <div className="text-muted-foreground mt-2 text-[10px]">
            Marker size = Storage Utilization
          </div>
        </div>
      </div>
    </div>
  );
};

