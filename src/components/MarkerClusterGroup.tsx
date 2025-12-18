import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';

interface MarkerClusterGroupProps {
  children: React.ReactNode;
  maxClusterRadius?: number;
}

/**
 * Custom MarkerClusterGroup wrapper for react-leaflet
 * Uses Leaflet.markercluster plugin directly
 */
export const MarkerClusterGroup = ({ children, maxClusterRadius = 50 }: MarkerClusterGroupProps) => {
  const map = useMap();

  useEffect(() => {
    // Create marker cluster group
    const markerClusterGroup = (L as any).markerClusterGroup({
      maxClusterRadius,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
    });

    // Add to map
    map.addLayer(markerClusterGroup);

    return () => {
      map.removeLayer(markerClusterGroup);
    };
  }, [map, maxClusterRadius]);

  // This component doesn't render children directly
  // Children are handled by the cluster group via refs
  return null;
};

