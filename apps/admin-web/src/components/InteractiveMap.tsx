import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../theme/ThemeContext';
import { Navigation, BusFront, School, Clock3, UsersRound, MapPin, Check } from 'lucide-react';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  type: 'bus' | 'stop' | 'school' | 'user';
  status?: string;
  meta?: any;
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

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  center = [28.6320, 77.3680],
  zoom = 14,
  height = '420px',
  onMarkerClick,
  showHud = true,
  busLive = true,
  busSpeed = 38,
  lastUpdatedText = 'Updated 32 sec ago',
  onViewJourney,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const markersLayerRef = useRef<any | null>(null);
  const routeLayerRef = useRef<any | null>(null);
  const activeTileLayerRef = useRef<any | null>(null);
  const { colors, isDark } = useTheme();

  // Primary waypoints along demo corridor (Sector 62 -> Campus)
  const waypoints = [
    { name: 'Sector 62 Metro Gate #2', latitude: 28.6280, longitude: 77.3649, isOrigin: true },
    { name: 'Shipra Sun City Gate #4', latitude: 28.6360, longitude: 77.3715 },
    { name: 'Indirapuram Habitat Centre', latitude: 28.6410, longitude: 77.3780 },
    { name: 'School Main Campus', latitude: 28.6495, longitude: 77.3890, isTerminus: true },
  ];

  const busLocation = {
    latitude: 28.6320,
    longitude: 77.3680,
    name: 'Bus 12 (UP-16-BT-9912)',
  };

  // 1. Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: false,
    });

    mapInstanceRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);

    // Apply standard clean OpenStreetMap layer
    const tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      crossOrigin: true,
      keepBuffer: 6,
    });
    tileLayer.addTo(map);
    activeTileLayerRef.current = tileLayer;

    // Apply dark filter if theme is dark
    const tilePane = map.getPane('tilePane');
    if (tilePane) {
      tilePane.style.filter = isDark
        ? 'invert(100%) hue-rotate(180deg) brightness(85%) contrast(92%)'
        : 'none';
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. React to theme change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const tilePane = mapInstanceRef.current.getPane('tilePane');
    if (tilePane) {
      tilePane.style.filter = isDark
        ? 'invert(100%) hue-rotate(180deg) brightness(85%) contrast(92%)'
        : 'none';
    }
  }, [isDark]);

  // 3. Render Route Corridor, Stop Markers, and Bus Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const routeLayer = routeLayerRef.current;

    if (!map || !markersLayer || !routeLayer) return;

    markersLayer.clearLayers();
    routeLayer.clearLayers();

    // Route corridor polyline (Clean brand blue)
    const polylineCoords: [number, number][] = waypoints.map((w) => [w.latitude, w.longitude]);
    L.polyline(polylineCoords, {
      color: '#2563eb',
      weight: 4,
      opacity: 0.85,
    }).addTo(routeLayer);

    // Render Stops (Stop areas)
    waypoints.forEach((wp, idx) => {
      const isTerminus = wp.isTerminus;
      const isOrigin = wp.isOrigin;

      // Subtle Stop Area radius circle
      L.circle([wp.latitude, wp.longitude], {
        radius: isTerminus ? 120 : 80,
        color: isTerminus ? '#059669' : '#2563eb',
        weight: 1,
        dashArray: '4, 4',
        fillColor: isTerminus ? '#059669' : '#2563eb',
        fillOpacity: 0.08,
      }).addTo(routeLayer);

      // Professional clean SVG stop marker (NO EMOJIS)
      const stopIcon = L.divIcon({
        className: 'custom-stop-icon',
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background-color: ${isTerminus ? '#059669' : isOrigin ? '#2563eb' : colors.card};
            border: 2px solid ${isTerminus ? '#059669' : isOrigin ? '#2563eb' : colors.borderHover};
            color: ${isTerminus || isOrigin ? '#ffffff' : colors.textPrimary};
            font-size: 11px;
            font-weight: 700;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          ">
            ${
              isTerminus
                ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"/><path d="M18 10h4l-10-8-10 8h4v12h12v-12z"/></svg>'
                : idx + 1
            }
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker([wp.latitude, wp.longitude], { icon: stopIcon }).addTo(markersLayer);
      marker.bindPopup(`
        <div style="font-family: inherit; color: #0f172a; min-width: 160px; padding: 4px;">
          <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">
            ${isTerminus ? 'Destination Terminus' : `Stop #${idx + 1}`}
          </div>
          <strong style="font-size: 13px; color: #0f172a; display: block; margin-top: 2px;">${wp.name}</strong>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
            Stop area buffer: <strong>${isTerminus ? '120m' : '80m'}</strong>
          </div>
        </div>
      `);
    });

    // Render Clean Bus Map Marker (Section 12: Professional SVG, NO EMOJIS)
    const busPos: [number, number] = [busLocation.latitude, busLocation.longitude];
    const busIcon = L.divIcon({
      className: 'custom-bus-marker',
      html: `
        <div style="
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 18px;
          background-color: #0f172a;
          color: #ffffff;
          border: 2px solid #2563eb;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);
          white-space: nowrap;
          cursor: pointer;
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 6 2 7"/><path d="M10 6h4"/><path d="m22 7-2-1"/><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M8 15h.01"/><path d="M16 15h.01"/><path d="M6 19v2"/><path d="M18 21v-2"/>
          </svg>
          <span style="font-size: 11px; font-weight: 800; letter-spacing: 0.02em;">BUS 12</span>
          <span style="font-size: 8px; color: #10b981;">●</span>
          <span style="font-size: 10px; font-weight: 600; color: #94a3b8;">On route</span>
        </div>
      `,
      iconSize: [120, 28],
      iconAnchor: [60, 14],
    });

    const activeBusMarker = L.marker(busPos, { icon: busIcon }).addTo(markersLayer);

    // Section 13: Redesigned Human Map Popup (NO RAW TELEMETRY)
    activeBusMarker.bindPopup(`
      <div style="font-family: inherit; color: #0f172a; min-width: 190px; padding: 4px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <strong style="font-size: 14px; font-weight: 800; color: #0f172a;">BUS 12</strong>
          <span style="font-size: 11px; font-weight: 700; color: #059669;">● On route</span>
        </div>
        <div style="font-size: 12px; font-weight: 600; color: #2563eb; margin-top: 2px;">
          Sector 62
        </div>
        <div style="font-size: 12px; color: #475569; margin-top: 6px; display: flex; align-items: center; gap: 4px;">
          <span>28 / 32 students onboard</span>
        </div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">
          ${lastUpdatedText}
        </div>
        <div style="margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
          <a href="/journeys/88888888-8888-8888-8888-888888888801" style="font-size: 12px; font-weight: 700; color: #2563eb; text-decoration: none; display: flex; align-items: center; gap: 4px;">
            <span>View journey</span> &rarr;
          </a>
        </div>
      </div>
    `);
  }, [colors, isDark, lastUpdatedText]);

  // Center on corridor
  const handleCenterMap = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo(center, zoom, { duration: 0.8 });
  };

  // Center on bus
  const handleFocusBus = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([busLocation.latitude, busLocation.longitude], 16, { duration: 0.8 });
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: '12px',
        overflow: 'hidden',
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.card,
      }}
    >
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating Center Controls (Center map & Focus bus with proper Lucide icons) */}
      <div
        style={{
          position: 'absolute',
          bottom: '44px',
          right: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 1000,
        }}
      >
        <button
          onClick={handleCenterMap}
          title="Center Corridor Map"
          style={{
            padding: '7px 12px',
            borderRadius: '8px',
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
            color: colors.textPrimary,
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Navigation size={13} strokeWidth={2} />
          <span>Center map</span>
        </button>

        <button
          onClick={handleFocusBus}
          title="Focus Bus 12"
          style={{
            padding: '7px 12px',
            borderRadius: '8px',
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
            color: colors.primary,
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <BusFront size={13} strokeWidth={2.2} />
          <span>Focus bus</span>
        </button>
      </div>

      {/* Top Right: Human-readable Bus Status Card (Section 13) */}
      {showHud && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            padding: '10px 14px',
            borderRadius: '8px',
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
            color: colors.textPrimary,
            fontSize: '11px',
            zIndex: 1000,
            minWidth: '190px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontWeight: 800, fontSize: '13px', color: colors.textPrimary }}>BUS 12</span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: busLive ? colors.successLight : colors.warningLight,
                color: busLive ? colors.success : colors.warning,
                border: `1px solid ${busLive ? colors.successBorder : colors.warningBorder}`,
              }}
            >
              ● On route
            </span>
          </div>

          <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '2px' }}>
            Sector 62
          </div>
          <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '2px' }}>
            28 / 32 students onboard
          </div>
          <div style={{ fontSize: '10px', color: colors.textMuted, marginTop: '4px' }}>
            {lastUpdatedText}
          </div>
        </div>
      )}

      {/* Bottom Corridor Footer Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.card,
          borderTop: `1px solid ${colors.border}`,
          padding: '8px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: colors.textSecondary,
          zIndex: 1000,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={13} strokeWidth={2} color={colors.primary} />
          <span>Transit Corridor: Sector 62 &rarr; School Main Campus</span>
        </div>
        <div style={{ color: colors.primary, fontWeight: 600 }}>
          Next stop: Sector 62 Metro (ETA: ~8 min)
        </div>
      </div>
    </div>
  );
};
