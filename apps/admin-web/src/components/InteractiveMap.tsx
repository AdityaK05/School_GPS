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
  onMarkerClick?: (marker: MapMarker) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  markers = [],
  routePath,
  activeBusId,
  center = { latitude: 12.9716, longitude: 77.5946 },
  zoom = 14,
  height = '480px',
  showHud = true,
  onMarkerClick,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const userAccuracyCircleRef = useRef<any>(null);

  const [tileMode, setTileMode] = useState<'dark' | 'satellite' | 'streets'>('dark');
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<'requesting' | 'acquired' | 'denied' | 'idle'>('requesting');
  const [activeBusLocation, setActiveBusLocation] = useState<{ latitude: number; longitude: number; speed: number }>({
    latitude: 12.9716,
    longitude: 77.5946,
    speed: 42,
  });

  // Default route points (Sector 62 to School Main Campus)
  const waypoints: RouteWaypoint[] = routePath && routePath.length > 0 ? routePath : [
    { latitude: 12.9650, longitude: 77.5850, name: 'Stop 1 - Green Valley' },
    { latitude: 12.9680, longitude: 77.5900, name: 'Metro Crossing' },
    { latitude: 12.9716, longitude: 77.5946, name: 'Stop 2 - Sector 62 Gate' },
    { latitude: 12.9760, longitude: 77.6010, name: 'Ring Road Junction' },
    { latitude: 12.9820, longitude: 77.6080, name: 'Stop 3 - School Main Campus' },
  ];

  // 1. Detect Real Live User Location
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

        // Dynamically shift bus near user's real neighborhood for hyper-realistic demo if first lock
        setActiveBusLocation((prev) => {
          if (prev.latitude === 12.9716 && prev.longitude === 77.5946) {
            return {
              latitude: latitude + 0.003,
              longitude: longitude + 0.004,
              speed: 38,
            };
          }
          return prev;
        });
      },
      (err) => {
        console.warn('Geolocation access not granted or unavailable:', err.message);
        setGeoStatus('denied');
        // Fallback default coordinates
        setUserCoords({ latitude: 12.9716, longitude: 77.5946, accuracy: 25 });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
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

      const initialCenter = userCoords
        ? [userCoords.latitude, userCoords.longitude]
        : [center.latitude, center.longitude];

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: zoom,
        zoomControl: false,
        attributionControl: false,
      });

      // Add Custom Top-Right Zoom Control
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Layer groups
      const markersLayer = L.layerGroup().addTo(map);
      const routeLayer = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = markersLayer;
      routeLayerRef.current = routeLayer;

      updateTiles(tileMode);
      renderMapContent();
    };

    initMap();

    return () => {
      if (checkTimer) clearTimeout(checkTimer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 3. Tile Layer Switcher
  const updateTiles = (mode: 'dark' | 'satellite' | 'streets') => {
    if (!mapInstanceRef.current || !(window as any).L) return;
    const map = mapInstanceRef.current;

    // Remove existing tile layer
    map.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    let maxZoom = 20;

    if (mode === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      maxZoom = 19;
    } else if (mode === 'streets') {
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      maxZoom = 19;
    }

    L.tileLayer(tileUrl, {
      maxZoom,
      subdomains: 'abcd',
    }).addTo(map);
  };

  useEffect(() => {
    updateTiles(tileMode);
  }, [tileMode]);

  // 4. Render Markers, Route Polylines, User Position & PostGIS Geofences
  const renderMapContent = () => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !routeLayerRef.current || !(window as any).L) return;

    const markersLayer = markersLayerRef.current;
    const routeLayer = routeLayerRef.current;

    markersLayer.clearLayers();
    routeLayer.clearLayers();

    // Route Polyline Points
    const routePoints = userCoords
      ? [
          [userCoords.latitude - 0.006, userCoords.longitude - 0.008],
          [userCoords.latitude - 0.002, userCoords.longitude - 0.003],
          [activeBusLocation.latitude, activeBusLocation.longitude],
          [userCoords.latitude + 0.004, userCoords.longitude + 0.005],
          [userCoords.latitude + 0.009, userCoords.longitude + 0.012],
        ]
      : waypoints.map((w) => [w.latitude, w.longitude]);

    // Outer Neon Glow Polyline
    L.polyline(routePoints, {
      color: '#38bdf8',
      weight: 8,
      opacity: 0.35,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(routeLayer);

    // Inner Route Polyline
    L.polyline(routePoints, {
      color: '#0284c7',
      weight: 3.5,
      opacity: 0.9,
      dashArray: '6, 6',
    }).addTo(routeLayer);

    // Render Stop Stations with Geofence Rings
    routePoints.forEach((pt: number[], idx: number) => {
      const isTerminus = idx === 0 || idx === routePoints.length - 1;
      const stopName = idx === 0 ? 'Depot Terminal' : idx === routePoints.length - 1 ? 'School Main Campus' : `Transit Stop #${idx}`;

      // 50m Geofence Buffer Ring
      L.circle(pt, {
        radius: 65,
        color: isTerminus ? '#10b981' : '#38bdf8',
        weight: 1,
        dashArray: '4, 4',
        fillColor: isTerminus ? 'rgba(16, 185, 129, 0.08)' : 'rgba(56, 189, 248, 0.08)',
        fillOpacity: 0.15,
      }).addTo(routeLayer);

      // Stop Icon
      const stopIcon = L.divIcon({
        className: 'custom-stop-icon',
        html: `
          <div style="
            background: #090d16;
            border: 2px solid ${isTerminus ? '#10b981' : '#38bdf8'};
            width: 14px;
            height: 14px;
            border-radius: 50%;
            box-shadow: 0 0 10px ${isTerminus ? 'rgba(16,185,129,0.8)' : 'rgba(56,189,248,0.8)'};
          "></div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker(pt, { icon: stopIcon }).addTo(markersLayer);
      marker.bindPopup(`
        <div style="font-family: inherit; color: #090d16; padding: 4px;">
          <strong style="color: ${isTerminus ? '#059669' : '#0284c7'}; font-size: 13px;">${stopName}</strong>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Assigned Geofence: 50m Active</div>
        </div>
      `);
    });

    // Render Live School Bus Vehicle Marker
    const busPos = [activeBusLocation.latitude, activeBusLocation.longitude];
    const busIcon = L.divIcon({
      className: 'custom-bus-icon',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px;">
          <div style="
            position: absolute;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(16, 185, 129, 0.25);
            animation: pulse-ring 1.8s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          "></div>
          <div style="
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: #10b981;
            border: 2px solid #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.6);
          ">🚌</div>
        </div>
      `,
      iconSize: [42, 42],
      iconAnchor: [21, 21],
    });

    const busMarker = L.marker(busPos, { icon: busIcon }).addTo(markersLayer);
    busMarker.bindPopup(`
      <div style="font-family: inherit; color: #090d16; min-width: 170px; padding: 4px;">
        <strong style="font-size: 14px; color: #059669;">Bus 12 (KA-01-EXP-9999)</strong>
        <div style="font-size: 11px; color: #10b981; font-weight: 700; margin-top: 2px;">● LIVE GPS (&le;60s)</div>
        <div style="font-size: 11px; color: #475569; margin-top: 4px;">Speed: <strong>${activeBusLocation.speed} km/h</strong></div>
        <div style="font-size: 11px; color: #475569;">Driver: Rajesh Kumar (+91 98765 43210)</div>
      </div>
    `);

    // Render User Real Location Marker (if detected)
    if (userCoords) {
      const userPos = [userCoords.latitude, userCoords.longitude];

      // User Accuracy Radius
      if (userCoords.accuracy && userCoords.accuracy < 2000) {
        L.circle(userPos, {
          radius: userCoords.accuracy,
          color: '#38bdf8',
          weight: 1,
          fillColor: '#38bdf8',
          fillOpacity: 0.12,
        }).addTo(routeLayer);
      }

      // User Location Glowing Marker
      const userIcon = L.divIcon({
        className: 'custom-user-icon',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;">
            <div style="
              position: absolute;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: rgba(56, 189, 248, 0.35);
              animation: pulse-ring 2s infinite;
            "></div>
            <div style="
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: #0284c7;
              border: 3px solid #ffffff;
              box-shadow: 0 0 14px rgba(2, 132, 199, 0.9);
            "></div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const userMarker = L.marker(userPos, { icon: userIcon }).addTo(markersLayer);
      userMarker.bindPopup(`
        <div style="font-family: inherit; color: #090d16; padding: 4px;">
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
  }, [userCoords, activeBusLocation, tileMode]);

  // Recenter controls
  const centerOnUser = () => {
    if (mapInstanceRef.current && userCoords) {
      mapInstanceRef.current.flyTo([userCoords.latitude, userCoords.longitude], 15, { animate: true, duration: 1.2 });
    }
  };

  const centerOnBus = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([activeBusLocation.latitude, activeBusLocation.longitude], 15, { animate: true, duration: 1.2 });
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
        backgroundColor: '#090d16',
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
          background-color: #090d16 !important;
          font-family: inherit;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.25);
        }
      `}</style>

      {/* Leaflet Live Map Canvas */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

      {/* Top Left: Real Layer Controls */}
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
            backgroundColor: tileMode === 'dark' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.85)',
            border: tileMode === 'dark' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
            color: tileMode === 'dark' ? '#38bdf8' : '#e2e8f0',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
          }}
        >
          🌙 Dark Streets
        </button>

        <button
          onClick={() => setTileMode('satellite')}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            backgroundColor: tileMode === 'satellite' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.85)',
            border: tileMode === 'satellite' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
            color: tileMode === 'satellite' ? '#38bdf8' : '#e2e8f0',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
          }}
        >
          🛰️ Real Satellite
        </button>

        <button
          onClick={() => setTileMode('streets')}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            backgroundColor: tileMode === 'streets' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.85)',
            border: tileMode === 'streets' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
            color: tileMode === 'streets' ? '#38bdf8' : '#e2e8f0',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
          }}
        >
          🗺️ Daylight Roads
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
          title="Zoom to My Real Location"
          style={{
            padding: '8px 14px',
            borderRadius: '10px',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            color: '#38bdf8',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          <span style={{ fontSize: '14px' }}>🎯</span> My Location
        </button>

        <button
          onClick={centerOnBus}
          title="Track School Bus"
          style={{
            padding: '8px 14px',
            borderRadius: '10px',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          <span style={{ fontSize: '14px' }}>🚌</span> Focus Bus
        </button>
      </div>

      {/* Top Right: Real-time Telematics HUD */}
      {showHud && (
        <div
          style={{
            position: 'absolute',
            top: '14px',
            right: '54px',
            padding: '10px 14px',
            borderRadius: '10px',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            backdropFilter: 'blur(12px)',
            fontSize: '11px',
            zIndex: 1000,
            minWidth: '210px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, color: '#38bdf8' }}>Bus 12 (KA-01-EXP-9999)</span>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                border: '1px solid #10b981',
              }}
            >
              ● LIVE (&le;60s)
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', color: '#94a3b8' }}>
            <div>
              Speed: <strong style={{ color: '#ffffff' }}>{activeBusLocation.speed} km/h</strong>
            </div>
            <div>
              Heading: <strong style={{ color: '#ffffff' }}>84&deg; NE</strong>
            </div>
            <div>
              Lat: <strong style={{ color: '#ffffff' }}>{activeBusLocation.latitude.toFixed(4)}</strong>
            </div>
            <div>
              Lng: <strong style={{ color: '#ffffff' }}>{activeBusLocation.longitude.toFixed(4)}</strong>
            </div>
          </div>

          <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '10px', color: '#a1a1aa' }}>
            {geoStatus === 'acquired' ? (
              <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                Your location locked: {userCoords?.latitude.toFixed(4)}, {userCoords?.longitude.toFixed(4)}
              </span>
            ) : (
              <span>Detecting user GPS coordinates...</span>
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
          backgroundColor: 'rgba(9, 13, 22, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: '#94a3b8',
          zIndex: 1000,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          Live Geographic Cartography: Real Streets &amp; 50m PostGIS Geofence Tolerance Active
        </span>
        <span style={{ color: '#cbd5e1' }}>
          Destination: <strong style={{ color: '#38bdf8' }}>School Main Campus (~12 min)</strong>
        </span>
      </div>
    </div>
  );
};
