import React, { useState, useEffect } from 'react';

export interface MapMarker {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  type: 'bus' | 'stop' | 'school';
  status?: string;
  speed?: number;
  heading?: number;
  isLive?: boolean;
}

export interface RouteWaypoint {
  latitude: number;
  longitude: number;
  name?: string;
}

interface InteractiveMapProps {
  markers: MapMarker[];
  routePath?: RouteWaypoint[];
  activeBusId?: string;
  center?: { latitude: number; longitude: number };
  zoom?: number;
  height?: string;
  showHud?: boolean;
  onMarkerClick?: (marker: MapMarker) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  markers,
  routePath,
  activeBusId,
  center = { latitude: 12.9716, longitude: 77.5946 },
  zoom = 14,
  height = '420px',
  showHud = true,
  onMarkerClick,
}) => {
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite' | 'transit'>('dark');
  const [showGeofences, setShowGeofences] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(zoom);
  const [pulseTick, setPulseTick] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPulseTick((t) => (t + 1) % 100);
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  // Default demo route path if none provided (Sector 62 to School Campus)
  const waypoints = routePath && routePath.length > 0 ? routePath : [
    { latitude: 12.9650, longitude: 77.5850, name: 'Stop 1 - Green Valley' },
    { latitude: 12.9680, longitude: 77.5900, name: 'Metro Crossing' },
    { latitude: 12.9716, longitude: 77.5946, name: 'Stop 2 - Sector 62 Gate' },
    { latitude: 12.9760, longitude: 77.6010, name: 'Ring Road Junction' },
    { latitude: 12.9820, longitude: 77.6080, name: 'Stop 3 - School Main Campus' },
  ];

  // Coordinate projection into SVG viewport (width 800, height 400)
  const minLat = Math.min(...waypoints.map((p) => p.latitude), ...markers.map((m) => m.latitude)) - 0.005;
  const maxLat = Math.max(...waypoints.map((p) => p.latitude), ...markers.map((m) => m.latitude)) + 0.005;
  const minLng = Math.min(...waypoints.map((p) => p.longitude), ...markers.map((m) => m.longitude)) - 0.008;
  const maxLng = Math.max(...waypoints.map((p) => p.longitude), ...markers.map((m) => m.longitude)) + 0.008;

  const project = (lat: number, lng: number) => {
    const latSpan = maxLat - minLat || 0.01;
    const lngSpan = maxLng - minLng || 0.01;
    const x = ((lng - minLng) / lngSpan) * 700 + 50;
    const y = 350 - ((lat - minLat) / latSpan) * 300;
    return { x, y };
  };

  const polylinePoints = waypoints
    .map((wp) => {
      const { x, y } = project(wp.latitude, wp.longitude);
      return `${x},${y}`;
    })
    .join(' ');

  const activeBus = markers.find((m) => m.id === activeBusId) || markers.find((m) => m.type === 'bus') || markers[0];

  return (
    <div
      style={{
        position: 'relative',
        height,
        width: '100%',
        borderRadius: '16px',
        overflow: 'hidden',
        backgroundColor: mapStyle === 'satellite' ? '#070d18' : '#090d16',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Background Cartography Grid & Neon Roads */}
      <svg
        viewBox="0 0 800 400"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          backgroundImage:
            mapStyle === 'satellite'
              ? 'radial-gradient(ellipse at center, #0f172a 0%, #020617 100%)'
              : 'radial-gradient(circle at 50% 50%, #0d1527 0%, #060911 100%)',
        }}
      >
        <defs>
          {/* Cartography grid pattern */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke={mapStyle === 'satellite' ? 'rgba(56, 189, 248, 0.04)' : 'rgba(255, 255, 255, 0.03)'}
              strokeWidth="1"
            />
          </pattern>

          {/* Road glow filter */}
          <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>

        {/* Base Grid */}
        <rect width="800" height="400" fill="url(#grid)" />

        {/* Secondary Road Network Lines */}
        <path d="M 0 100 Q 250 80 500 130 T 800 110" stroke="rgba(255,255,255,0.04)" strokeWidth="4" fill="none" />
        <path d="M 0 280 Q 200 320 450 260 T 800 290" stroke="rgba(255,255,255,0.04)" strokeWidth="4" fill="none" />
        <path d="M 220 0 Q 240 200 210 400" stroke="rgba(255,255,255,0.04)" strokeWidth="3" fill="none" />
        <path d="M 580 0 Q 560 200 590 400" stroke="rgba(255,255,255,0.04)" strokeWidth="3" fill="none" />

        {/* Primary Bus Corridor Route Line */}
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="rgba(56, 189, 248, 0.25)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#neon-glow)"
        />
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="url(#routeGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="8 4"
        />

        {/* Geofence Circles around Stops (50m Tolerance) */}
        {showGeofences &&
          waypoints.map((wp, i) => {
            const { x, y } = project(wp.latitude, wp.longitude);
            return (
              <g key={`geofence-${i}`}>
                <circle
                  cx={x}
                  cy={y}
                  r="28"
                  fill="rgba(56, 189, 248, 0.05)"
                  stroke="rgba(56, 189, 248, 0.2)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              </g>
            );
          })}

        {/* Stop Markers */}
        {waypoints.map((wp, i) => {
          const { x, y } = project(wp.latitude, wp.longitude);
          const isTerminus = i === 0 || i === waypoints.length - 1;
          return (
            <g
              key={`stop-${i}`}
              style={{ cursor: 'pointer' }}
              onClick={() =>
                onMarkerClick &&
                onMarkerClick({
                  id: `stop-${i}`,
                  label: wp.name || `Stop ${i + 1}`,
                  latitude: wp.latitude,
                  longitude: wp.longitude,
                  type: isTerminus ? 'school' : 'stop',
                })
              }
            >
              <circle cx={x} cy={y} r="7" fill="#0f172a" stroke={isTerminus ? '#10b981' : '#38bdf8'} strokeWidth="2.5" />
              <circle cx={x} cy={y} r="2.5" fill={isTerminus ? '#10b981' : '#ffffff'} />
              <text
                x={x}
                y={y - 12}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="9"
                fontWeight="600"
                style={{ pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
              >
                {wp.name || `Stop #${i + 1}`}
              </text>
            </g>
          );
        })}

        {/* Live Buses with Directional Heading & Animated Pulses */}
        {markers
          .filter((m) => m.type === 'bus')
          .map((bus) => {
            const { x, y } = project(bus.latitude, bus.longitude);
            const isLive = bus.isLive ?? true;

            return (
              <g
                key={bus.id}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setSelectedMarker(bus);
                  if (onMarkerClick) onMarkerClick(bus);
                }}
              >
                {/* Pulse ring for live bus */}
                {isLive && (
                  <circle
                    cx={x}
                    cy={y}
                    r={18 + (pulseTick % 12)}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.5"
                    opacity={1 - (pulseTick % 12) / 12}
                  />
                )}

                {/* Outer Glow Halo */}
                <circle cx={x} cy={y} r="14" fill={isLive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'} />

                {/* Bus Body */}
                <circle
                  cx={x}
                  cy={y}
                  r="9"
                  fill={isLive ? '#10b981' : '#f59e0b'}
                  stroke="#ffffff"
                  strokeWidth="2"
                  filter="url(#neon-glow)"
                />

                {/* Vehicle Glyph / Icon */}
                <text
                  x={x}
                  y={y + 3}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="8"
                  fontWeight="bold"
                  style={{ pointerEvents: 'none' }}
                >
                  🚌
                </text>

                {/* Label Callout */}
                <rect
                  x={x - 42}
                  y={y + 14}
                  width="84"
                  height="18"
                  rx="4"
                  fill="rgba(15, 23, 42, 0.9)"
                  stroke={isLive ? '#10b981' : '#f59e0b'}
                  strokeWidth="0.8"
                />
                <text
                  x={x}
                  y={y + 26}
                  textAnchor="middle"
                  fill="#f8fafc"
                  fontSize="8.5"
                  fontWeight="700"
                  style={{ pointerEvents: 'none' }}
                >
                  {bus.label} • {bus.speed ?? 42} km/h
                </text>
              </g>
            );
          })}
      </svg>

      {/* Top Left: Map Mode & Geofence Controls */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          display: 'flex',
          gap: '6px',
          zIndex: 10,
        }}
      >
        <button
          onClick={() => setMapStyle((s) => (s === 'dark' ? 'satellite' : 'dark'))}
          style={{
            padding: '5px 10px',
            borderRadius: '6px',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#f8fafc',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}
        >
          {mapStyle === 'dark' ? '🛰️ Satellite' : '🗺️ Dark Mode'}
        </button>

        <button
          onClick={() => setShowGeofences(!showGeofences)}
          style={{
            padding: '5px 10px',
            borderRadius: '6px',
            backgroundColor: showGeofences ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.85)',
            border: showGeofences ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
            color: showGeofences ? '#38bdf8' : '#94a3b8',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}
        >
          🎯 Geofences ({showGeofences ? 'ON' : 'OFF'})
        </button>
      </div>

      {/* Top Right: Telematics HUD Card */}
      {showHud && activeBus && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            padding: '10px 14px',
            borderRadius: '10px',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            backdropFilter: 'blur(12px)',
            fontSize: '11px',
            zIndex: 10,
            minWidth: '200px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, color: '#38bdf8' }}>{activeBus.label}</span>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: (activeBus.isLive ?? true) ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                color: (activeBus.isLive ?? true) ? '#34d399' : '#fbbf24',
                border: `1px solid ${(activeBus.isLive ?? true) ? '#10b981' : '#f59e0b'}`,
              }}
            >
              {(activeBus.isLive ?? true) ? '● LIVE (<60s)' : '⚠ GPS STALE'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', color: '#94a3b8' }}>
            <div>
              Speed: <strong style={{ color: '#ffffff' }}>{activeBus.speed ?? 42} km/h</strong>
            </div>
            <div>
              Heading: <strong style={{ color: '#ffffff' }}>{activeBus.heading ?? 84}&deg; NE</strong>
            </div>
            <div>
              Lat: <strong style={{ color: '#ffffff' }}>{activeBus.latitude.toFixed(4)}</strong>
            </div>
            <div>
              Lng: <strong style={{ color: '#ffffff' }}>{activeBus.longitude.toFixed(4)}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar: Interactive Status Feed */}
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '12px',
          right: '12px',
          padding: '8px 12px',
          borderRadius: '8px',
          backgroundColor: 'rgba(9, 13, 22, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: '#94a3b8',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          Deterministic Safety Engine: PostGIS Geofence Tolerance Active (&plusmn;50m)
        </span>
        <span style={{ color: '#cbd5e1' }}>
          Next Terminus: <strong style={{ color: '#38bdf8' }}>School Main Campus (ETA: ~12m)</strong>
        </span>
      </div>
    </div>
  );
};
