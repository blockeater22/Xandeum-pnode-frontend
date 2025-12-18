import { useEffect, useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapNode } from '@/lib/api';
import { formatPercentage, formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

interface MapMarkerProps {
  node: MapNode;
  onClick?: () => void;
}

/**
 * Creates a custom marker icon based on health score and storage utilization
 */
function createMarkerIcon(node: MapNode): L.DivIcon {
  // Color based on health score
  let color = 'hsl(0,84%,60%)'; // Red (Poor)
  if (node.status === 'offline') {
    color = 'hsl(0,0%,50%)'; // Gray
  } else if (node.healthScore >= 85) {
    color = 'hsl(142,71%,45%)'; // Green (Excellent)
  } else if (node.healthScore >= 60) {
    color = 'hsl(38,92%,50%)'; // Yellow (Good)
  }

  // Size based on storage utilization (20-40px range)
  // Higher utilization = larger marker
  const baseSize = 20;
  const sizeVariation = (node.storageUtilization / 100) * 20; // 0-20px additional
  const markerSize = baseSize + sizeVariation;

  // Pulse animation for recently seen online nodes (within last 5 minutes)
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

export const MapMarker = ({ node, onClick }: MapMarkerProps) => {
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    // Fade-in animation on mount
    if (markerRef.current) {
      const marker = markerRef.current;
      const element = marker.getElement();
      if (element) {
        element.style.opacity = '0';
        element.style.transition = 'opacity 0.3s';
        setTimeout(() => {
          element.style.opacity = '1';
        }, 10);
      }
    }
  }, []);

  const icon = createMarkerIcon(node);
  const lastSeenDate = new Date(node.lastSeen);

  return (
    <Marker
      ref={markerRef}
      position={[node.lat, node.lng]}
      icon={icon}
      eventHandlers={{
        click: () => {
          onClick?.();
        },
      }}
    >
      <Popup className="custom-popup" maxWidth={300}>
        <div className="p-3 space-y-2 min-w-[250px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <code className="text-xs font-mono text-foreground">
              {node.pubkey.substring(0, 4)}..{node.pubkey.substring(node.pubkey.length - 4)}
            </code>
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full font-medium',
                node.status === 'online'
                  ? 'bg-primary/20 text-primary'
                  : 'bg-destructive/20 text-destructive'
              )}
            >
              {node.status}
            </span>
          </div>

          {/* Health Score */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Health Score:</span>
            <span
              className={cn(
                'font-semibold',
                node.healthScore >= 85
                  ? 'text-primary'
                  : node.healthScore >= 60
                  ? 'text-warning'
                  : 'text-destructive'
              )}
            >
              {formatPercentage(node.healthScore, 1)}
            </span>
          </div>

          {/* Uptime */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Uptime (24h):</span>
            <span className="font-medium text-foreground">
              {formatPercentage(node.uptime24h, 1)}
            </span>
          </div>

          {/* Storage */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Storage Used:</span>
            <span className="font-medium text-foreground">
              {formatPercentage(node.storageUtilization, 1)}
            </span>
          </div>

          {/* Version */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Version:</span>
            <span className="font-medium text-foreground">{node.version}</span>
          </div>

          {/* Last Seen */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Last Seen:</span>
            <span className="font-medium text-foreground">
              {formatRelativeTime(lastSeenDate)}
            </span>
          </div>

          {/* Location */}
          <div className="pt-2 border-t border-border">
            <div className="text-xs text-muted-foreground">
              {node.city ? `${node.city}, ` : ''}
              {node.region}, {node.country}
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

