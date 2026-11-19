import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BusFront, MapPin, Navigation } from 'lucide-react';
import { useTheme } from '../theme/ThemeContext';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  type: 'bus' | 'stop' | 'school' | 'user';
  status?: string;
  meta?: Record<string, unknown>;
}

export interface InteractiveMapProps {
  markers?: MapMarker[];
  center?: [number, number];
  zoom?: number;
  height?: string | number;
  onMarkerClick?: (marker: MapMarker) => void;
  showHud?: boolean;
  busLive?: boolean;
  busSpeed?: number;
  busHeading?: number;
  lastUpdatedText?: string;
  onViewJourney?: () => void;
}

const markerColors: Record<MapMarker['type'], string> = {
  bus: '#2563eb',
  stop: '#d97706',
  school: '#059669',
  user: '#7c3aed',
};
const defaultMapCenter: [number, number] = [0, 0];
const emptyMarkers: MapMarker[] = [];
const mapControlStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  padding: 8,
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  background: '#ffffff',
  color: '#334155',
  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
  cursor: 'pointer',
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  markers = emptyMarkers,
  center = defaultMapCenter,
  zoom = 2,
  height = '420px',
  onMarkerClick,
  showHud = true,
  busLive = false,
  busSpeed,
  lastUpdatedText,
  onViewJourney,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<ReturnType<typeof L.map> | null>(null);
  const markersLayerRef = useRef<ReturnType<typeof L.layerGroup> | null>(null);
  const { colors, isDark } = useTheme();
  const validMarkers = markers.filter((marker) =>
    Number.isFinite(marker.latitude) &&
    Number.isFinite(marker.longitude) &&
    marker.latitude >= -90 &&
    marker.latitude <= 90 &&
    marker.longitude >= -180 &&
    marker.longitude <= 180
  );
  const busMarker = validMarkers.find((marker) => marker.type === 'bus');

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const firstMarker = markers[0];
    const initialCenter: [number, number] = firstMarker
      ? [firstMarker.latitude, firstMarker.longitude]
      : center;
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: firstMarker ? Math.max(zoom, 12) : zoom,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false,
    });
    mapInstanceRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const tilePane = mapInstanceRef.current?.getPane('tilePane');
    if (tilePane) {
      tilePane.style.filter = isDark
        ? 'invert(100%) hue-rotate(180deg) brightness(85%) contrast(92%)'
        : 'none';
    }
  }, [isDark]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const points: [number, number][] = [];
    for (const marker of validMarkers) {
      const position: [number, number] = [marker.latitude, marker.longitude];
      points.push(position);
      const mapMarker = L.circleMarker(position, {
        radius: marker.type === 'bus' ? 9 : 7,
        color: '#ffffff',
        weight: 2,
        fillColor: markerColors[marker.type],
        fillOpacity: 1,
      }).addTo(layer);
      const popup = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = marker.label;
      popup.append(title);
      if (marker.status) {
        const status = document.createElement('div');
        status.textContent = marker.status;
        popup.append(status);
      }
      mapMarker.bindPopup(popup);
      if (onMarkerClick) mapMarker.on('click', () => onMarkerClick(marker));
    }

    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [24, 24], maxZoom: 15 });
    } else if (points.length === 1) {
      map.setView(points[0], Math.max(zoom, 12));
    } else {
      map.setView(center, zoom);
    }
  }, [markers, center, zoom, onMarkerClick]);

  const handleCenterMap = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (validMarkers.length > 1) {
      map.fitBounds(
        L.latLngBounds(validMarkers.map((marker) => L.latLng(marker.latitude, marker.longitude))),
        { padding: [24, 24], maxZoom: 15 }
      );
    } else if (validMarkers.length === 1) {
      map.setView([validMarkers[0].latitude, validMarkers[0].longitude], Math.max(zoom, 12));
    } else {
      map.setView(center, zoom);
    }
  };

  const handleFocusBus = () => {
    if (!busMarker || !mapInstanceRef.current) return;
    mapInstanceRef.current.setView([busMarker.latitude, busMarker.longitude], 15);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: 12,
        overflow: 'hidden',
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.card,
      }}
    >
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      {validMarkers.length === 0 && (
        <div
          role="status"
          style={{
            position: 'absolute',
            inset: '12px auto auto 12px',
            zIndex: 500,
            padding: '9px 12px',
            borderRadius: 8,
            background: colors.card,
            color: colors.textSecondary,
            border: `1px solid ${colors.border}`,
            fontSize: 12,
          }}
        >
          No location data is currently available.
        </div>
      )}
      <div style={{ position: 'absolute', bottom: 42, right: 12, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 500 }}>
        <button onClick={handleCenterMap} title="Center map" aria-label="Center map" style={mapControlStyle}>
          <Navigation size={15} />
        </button>
        <button
          onClick={handleFocusBus}
          title={busMarker ? `Focus ${busMarker.label}` : 'No bus location available'}
          aria-label="Focus bus"
          disabled={!busMarker}
          style={{ ...mapControlStyle, opacity: busMarker ? 1 : 0.5 }}
        >
          <BusFront size={15} />
        </button>
      </div>
      {showHud && busMarker && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 500,
            minWidth: 180,
            padding: '10px 12px',
            borderRadius: 8,
            background: colors.card,
            border: `1px solid ${colors.border}`,
            color: colors.textPrimary,
            fontSize: 12,
          }}
        >
          <strong>{busMarker.label}</strong>
          <div style={{ color: busLive ? colors.success : colors.textSecondary, marginTop: 4 }}>
            {busLive ? 'Live GPS' : busMarker.status || 'Last reported location'}
          </div>
          {typeof busSpeed === 'number' && <div style={{ marginTop: 3 }}>{busSpeed} km/h</div>}
          {lastUpdatedText && <div style={{ color: colors.textMuted, marginTop: 3 }}>{lastUpdatedText}</div>}
          {onViewJourney && (
            <button onClick={onViewJourney} style={{ ...mapControlStyle, marginTop: 6 }}>
              View journey
            </button>
          )}
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          background: colors.card,
          borderTop: `1px solid ${colors.border}`,
          color: colors.textSecondary,
          fontSize: 11,
        }}
      >
        <MapPin size={13} color={colors.primary} />
        {validMarkers.length} mapped location{validMarkers.length === 1 ? '' : 's'} · Bus arrival does not confirm student exit.
      </div>
    </div>
  );
};
