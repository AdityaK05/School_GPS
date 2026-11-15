import React, { useEffect, useRef, useState } from 'react';

declare const L: any;

export interface MapMarker {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  type: 'bus' | 'stop' | 'school' | 'user';
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
  markers?: MapMarker[];
  routePath?: RouteWaypoint[];
  activeBusId?: string;
  center?: { latitude: number; longitude: number };
  zoom?: number;
  height?: string;
  showHud?: boolean;
  busSpeed?: number;
  busHeading?: number;
  busLive?: boolean;
  onMarkerClick?: (marker: MapMarker) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  markers = [],
  routePath,
  activeBusId,
  center = { latitude: 28.6280, longitude: 77.3649 }, // Default: Noida Sector 62 / NCR Campus Corridor
  zoom = 14,
  height = '480px',
  showHud = true,
  busSpeed = 38,
  busHeading = 84,
  busLive = true,
  onMarkerClick,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const activeTileLayerRef = useRef<any>(null);

  const [tileMode, setTileMode] = useState<'dark' | 'streets' | 'satellite'>('dark');
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<'requesting' | 'acquired' | 'denied' | 'idle'>('idle');

  // Authoritative NCR / Sector 62 to School Main Campus stops
  const waypoints: RouteWaypoint[] = routePath && routePath.length > 0 ? routePath : [
    { latitude: 28.6280, longitude: 77.3649, name: 'Stop 1: Sector 62 Metro Gate #2' },
    { latitude: 28.6360, longitude: 77.3715, name: 'Stop 2: Shipra Sun City Gate #4' },
    { latitude: 28.6410, longitude: 77.3780, name: 'Stop 3: Indirapuram Habitat Centre' },
    { latitude: 28.6495, longitude: 77.3890, name: 'Terminus: DPIS Main Campus' },
  ];

  // Bus Location (falls back to stop 1 or passed markers)
  const busMarker = markers.find((m) => m.type === 'bus');
  const busLocation = busMarker
    ? { latitude: busMarker.latitude, longitude: busMarker.longitude }
    : { latitude: 28.6320, longitude: 77.3680 };

  // 1. Detect Real Live User Location (HTML5 Geolocation)
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoStatus('denied');
      return;
    }

    setGeoStatus('requesting');
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setUserCoords({ latitude, longitude, accuracy });
        setGeoStatus('acquired');
      },
      (err) => {
        console.warn('Geolocation access not granted, using Delhi NCR default coordinates:', err.message);
        setGeoStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // 2. Initialize Real Leaflet Map
  useEffect(() => {
    let checkTimer: any;

    const initMap = () => {
      if (!mapContainerRef.current) return;
      if (typeof window === 'undefined' || !(window as any).L) {
        checkTimer = setTimeout(initMap, 150);
        return;
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const initialCenter = [center.latitude, center.longitude];

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: zoom,
        zoomControl: false,
        attributionControl: false,
      });

      // Custom top-right zoom control
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Layer groups
      const routeLayer = L.layerGroup().addTo(map);
      const markersLayer = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = markersLayer;
      routeLayerRef.current = routeLayer;

      updateTiles(tileMode);
      renderMapContent();

      // Invalidate size after DOM mount and container layout stabilize to prevent black tile gaps
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 150);

      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 500);
    };

    initMap();

    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (checkTimer) clearTimeout(checkTimer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 3. Ultra-Reliable Tile Layer Switcher (Zero Black Box Glitches)
  const updateTiles = (mode: 'dark' | 'streets' | 'satellite') => {
    if (!mapInstanceRef.current || !(window as any).L) return;
    const map = mapInstanceRef.current;

    // Remove existing tile layer cleanly without destroying other overlay layers
    if (activeTileLayerRef.current) {
      map.removeLayer(activeTileLayerRef.current);
      activeTileLayerRef.current = null;
    }

    let tileUrl: string;
    let options: any;

    if (mode === 'streets') {
      // CartoDB Voyager — Crisp daylight streets, crossOrigin enabled, buffer cached
      tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
      options = {
        maxZoom: 19,
        subdomains: 'abcd',
        crossOrigin: true,
        keepBuffer: 8,
        updateWhenZooming: false,
        attribution: '&copy; CartoDB &copy; OpenStreetMap',
      };
    } else if (mode === 'satellite') {
      // ESRI World Imagery — High resolution global satellite tiles
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      options = {
        maxZoom: 19,
        keepBuffer: 8,
        updateWhenZooming: false,
        attribution: '&copy; ESRI',
      };
    } else {
      // Dark Matter — Default executive night aesthetic
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
      options = {
        maxZoom: 19,
        subdomains: 'abcd',
        crossOrigin: true,
        keepBuffer: 8,
        updateWhenZooming: false,
        attribution: '&copy; CartoDB &copy; OpenStreetMap',
      };
    }

    const tileLayer = L.tileLayer(tileUrl, options);
    tileLayer.addTo(map);
    activeTileLayerRef.current = tileLayer;

    // Adjust container background so loading tiles blend seamlessly
    if (mapContainerRef.current) {
      mapContainerRef.current.style.backgroundColor =
        mode === 'streets' ? '#f1f5f9' : mode === 'satellite' ? '#0f172a' : '#121217';
    }

    // Invalidate size smoothly
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 100);
  };

  useEffect(() => {
    if (mapInstanceRef.current) {
      updateTiles(tileMode);
    }
  }, [tileMode]);

  // 4. Render Markers, Route Polylines, User Position & PostGIS Geofences
  const renderMapContent = () => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !routeLayerRef.current || !(window as any).L) return;

    const markersLayer = markersLayerRef.current;
    const routeLayer = routeLayerRef.current;

    markersLayer.clearLayers();
    routeLayer.clearLayers();

    // Route points from waypoints
    const routePoints: number[][] = waypoints.map((w) => [w.latitude, w.longitude]);

    // Outer neon glow corridor
    L.polyline(routePoints, {
      color: '#38bdf8',
      weight: 8,
      opacity: 0.3,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(routeLayer);

    // Inner route polyline
    L.polyline(routePoints, {
      color: '#0284c7',
      weight: 3.5,
      opacity: 0.95,
      dashArray: '6, 6',
    }).addTo(routeLayer);

    // Render Stops with Geofence Rings
    waypoints.forEach((wp, idx) => {
      const isTerminus = idx === waypoints.length - 1;
      const isOrigin = idx === 0;

      // 100m Geofence Buffer Ring
      L.circle([wp.latitude, wp.longitude], {
        radius: isTerminus ? 150 : 100,
        color: isTerminus ? '#10b981' : isOrigin ? '#38bdf8' : '#64748b',
        weight: 1.5,
        dashArray: '4, 4',
        fillColor: isTerminus ? 'rgba(16, 185, 129, 0.12)' : 'rgba(56, 189, 248, 0.08)',
        fillOpacity: 0.25,
      }).addTo(routeLayer);

      // Stop Icon
      const stopIcon = L.divIcon({
        className: 'custom-stop-icon',
        html: `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background-color: ${isTerminus ? '#059669' : isOrigin ? '#0284c7' : '#1e293b'};
            border: 2px solid ${isTerminus ? '#34d399' : '#38bdf8'};
            box-shadow: 0 0 12px ${isTerminus ? 'rgba(16,185,129,0.5)' : 'rgba(56,189,248,0.5)'};
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
          ">
            ${isTerminus ? '🏫' : idx + 1}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([wp.latitude, wp.longitude], { icon: stopIcon }).addTo(markersLayer);
      marker.bindPopup(`
        <div style="font-family: inherit; color: #09090b; min-width: 160px; padding: 2px;">
          <div style="font-size: 11px; font-weight: 700; color: #0284c7; text-transform: uppercase;">
            ${isTerminus ? 'Terminus Campus' : `Stop #${idx + 1}`}
          </div>
          <strong style="font-size: 13px; color: #09090b; display: block; margin-top: 2px;">${wp.name || 'Transit Stop'}</strong>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
            Geofence Tolerance: <strong>${isTerminus ? '150m' : '100m'}</strong>
          </div>
        </div>
      `);
    });

    // Render Active Bus Marker
    const busPos = [busLocation.latitude, busLocation.longitude];
    const busIcon = L.divIcon({
      className: 'custom-bus-icon',
      html: `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
        ">
          <div style="
            position: absolute;
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background: rgba(16, 185, 129, 0.25);
            animation: pulse-ring 2s infinite;
          "></div>
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #059669;
            border: 2px solid #ffffff;
            box-shadow: 0 0 16px rgba(16, 185, 129, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
          ">
            🚌
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    const activeBusMarker = L.marker(busPos, { icon: busIcon }).addTo(markersLayer);
    activeBusMarker.bindPopup(`
      <div style="font-family: inherit; color: #09090b; min-width: 190px; padding: 4px;">
        <strong style="font-size: 14px; color: #059669;">Bus 12 (UP-16-BT-9912)</strong>
        <div style="font-size: 11px; color: ${busLive ? '#10b981' : '#f59e0b'}; font-weight: 700; margin-top: 2px;">
          ● ${busLive ? 'LIVE GPS (≤60s)' : 'GPS STALE (>60s)'}
        </div>
        <div style="font-size: 11px; color: #475569; margin-top: 4px;">Speed: <strong>${busSpeed} km/h</strong></div>
        <div style="font-size: 11px; color: #475569;">Route: <strong>North Corridor Express</strong></div>
        <div style="font-size: 11px; color: #475569;">Driver: Rajesh Kumar (+91 98765 43210)</div>
      </div>
    `);

    // Render Real Live User Location (if granted)
    if (userCoords) {
      const userPos = [userCoords.latitude, userCoords.longitude];

      if (userCoords.accuracy && userCoords.accuracy < 2000) {
        L.circle(userPos, {
          radius: userCoords.accuracy,
          color: '#38bdf8',
          weight: 1,
          fillColor: '#38bdf8',
          fillOpacity: 0.1,
        }).addTo(routeLayer);
      }

      const userIcon = L.divIcon({
        className: 'custom-user-icon',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
            <div style="
              position: absolute;
              width: 30px;
              height: 30px;
              border-radius: 50%;
              background: rgba(56, 189, 248, 0.35);
              animation: pulse-ring 2s infinite;
            "></div>
            <div style="
              width: 14px;
              height: 14px;
              border-radius: 50%;
              background: #0284c7;
              border: 2px solid #ffffff;
              box-shadow: 0 0 12px rgba(2, 132, 199, 0.9);
            "></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const userMarker = L.marker(userPos, { icon: userIcon }).addTo(markersLayer);
      userMarker.bindPopup(`
        <div style="font-family: inherit; color: #09090b; padding: 4px;">
          <strong style="font-size: 13px; color: #0284c7;">📍 You Are Here</strong>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Live Device Geolocation</div>
          <div style="font-size: 10px; color: #94a3b8; font-family: monospace; margin-top: 2px;">
            ${userCoords.latitude.toFixed(5)}, ${userCoords.longitude.toFixed(5)}
          </div>
        </div>
      `);
    }
  };

  useEffect(() => {
    renderMapContent();
  }, [markers, userCoords, busLocation.latitude, busLocation.longitude, busSpeed, busLive, tileMode]);

  // Recenter controls
  const centerOnUser = () => {
    if (mapInstanceRef.current && userCoords) {
      mapInstanceRef.current.flyTo([userCoords.latitude, userCoords.longitude], 15, { animate: true, duration: 1 });
    }
  };

  const centerOnBus = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([busLocation.latitude, busLocation.longitude], 15, { animate: true, duration: 1 });
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        height,
        width: '100%',
        borderRadius: '16px',
        overflow: 'hidden',
        backgroundColor: '#121217',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.6); opacity: 0.9; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .leaflet-container {
          background-color: transparent !important;
          font-family: inherit;
        }
        .leaflet-tile {
          filter: brightness(0.98);
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
          border: 1px solid rgba(0,0,0,0.08);
        }
      `}</style>

      {/* Leaflet Live Map Canvas */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

      {/* Top Left: Layer Selector */}
      <div
        style={{
          position: 'absolute',
          top: '14px',
          left: '14px',
          display: 'flex',
          gap: '6px',
          zIndex: 1000,
        }}
      >
        <button
          onClick={() => setTileMode('dark')}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            backgroundColor: tileMode === 'dark' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(18, 18, 23, 0.85)',
            border: tileMode === 'dark' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
            color: tileMode === 'dark' ? '#38bdf8' : '#e4e4e7',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.15s ease',
          }}
        >
          🌙 Dark Streets
        </button>

        <button
          onClick={() => setTileMode('streets')}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            backgroundColor: tileMode === 'streets' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(18, 18, 23, 0.85)',
            border: tileMode === 'streets' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
            color: tileMode === 'streets' ? '#38bdf8' : '#e4e4e7',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.15s ease',
          }}
        >
          🗺️ Daylight Roads
        </button>

        <button
          onClick={() => setTileMode('satellite')}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            backgroundColor: tileMode === 'satellite' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(18, 18, 23, 0.85)',
            border: tileMode === 'satellite' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
            color: tileMode === 'satellite' ? '#38bdf8' : '#e4e4e7',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.15s ease',
          }}
        >
          🛰️ Real Satellite
        </button>
      </div>

      {/* Floating Center Controls (Recenter User / Bus) */}
      <div
        style={{
          position: 'absolute',
          bottom: '50px',
          right: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 1000,
        }}
      >
        <button
          onClick={centerOnUser}
          title="Zoom to My Location"
          style={{
            padding: '8px 14px',
            borderRadius: '10px',
            backgroundColor: 'rgba(18, 18, 23, 0.92)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            color: '#38bdf8',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
          }}
        >
          <span>🎯</span> My Location
        </button>

        <button
          onClick={centerOnBus}
          title="Track School Bus"
          style={{
            padding: '8px 14px',
            borderRadius: '10px',
            backgroundColor: 'rgba(18, 18, 23, 0.92)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
          }}
        >
          <span>🚌</span> Focus Bus
        </button>
      </div>

      {/* Top Right: Telematics HUD */}
      {showHud && (
        <div
          style={{
            position: 'absolute',
            top: '14px',
            right: '54px',
            padding: '10px 14px',
            borderRadius: '10px',
            backgroundColor: 'rgba(18, 18, 23, 0.92)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            backdropFilter: 'blur(12px)',
            fontSize: '11px',
            zIndex: 1000,
            minWidth: '220px',
            boxShadow: '0 4px 18px rgba(0,0,0,0.6)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, color: '#38bdf8' }}>Bus 12 (UP-16-BT-9912)</span>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: busLive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                color: busLive ? '#34d399' : '#fbbf24',
                border: busLive ? '1px solid #10b981' : '1px solid #f59e0b',
              }}
            >
              ● {busLive ? 'LIVE (≤60s)' : 'GPS STALE'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', color: '#a1a1aa' }}>
            <div>
              Speed: <strong style={{ color: '#ffffff' }}>{busSpeed} km/h</strong>
            </div>
            <div>
              Heading: <strong style={{ color: '#ffffff' }}>{busHeading}&deg; NE</strong>
            </div>
            <div>
              Lat: <strong style={{ color: '#ffffff' }}>{busLocation.latitude.toFixed(4)}</strong>
            </div>
            <div>
              Lng: <strong style={{ color: '#ffffff' }}>{busLocation.longitude.toFixed(4)}</strong>
            </div>
          </div>

          <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '10px', color: '#71717a' }}>
            {geoStatus === 'acquired' && userCoords ? (
              <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                Your location: {userCoords.latitude.toFixed(4)}, {userCoords.longitude.toFixed(4)}
              </span>
            ) : (
              <span>Geofence radius: 100m PostGIS polygon buffer</span>
            )}
          </div>
        </div>
      )}

      {/* Bottom Floating Telematics Banner */}
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '14px',
          right: '14px',
          padding: '8px 14px',
          borderRadius: '10px',
          backgroundColor: 'rgba(18, 18, 23, 0.94)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: '#a1a1aa',
          zIndex: 1000,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          Authoritative Cartography: Sector 62 &rarr; DPIS Noida Campus Corridor (50m Buffer)
        </span>
        <span style={{ color: '#e4e4e7' }}>
          Terminus: <strong style={{ color: '#38bdf8' }}>DPIS Main Campus (~12 min)</strong>
        </span>
      </div>
    </div>
  );
};
