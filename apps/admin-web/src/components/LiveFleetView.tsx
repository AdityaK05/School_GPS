import React from 'react';
import { THRESHOLDS } from '@school-transport-platform/constants';
import { InteractiveMap, MapMarker } from './InteractiveMap';

export interface LiveBusItem {
  busId: string;
  fleetNumber: string;
  registrationNumber: string;
  tripId?: string;
  routeName?: string;
  currentStopName?: string;
  latitude?: number;
  longitude?: number;
  speed?: number;
  lastRecordedAt?: string;
}

export function getGpsStatus(lastRecordedAt?: string, currentTimeMs: number = Date.now()): 'LIVE' | 'STALE' | 'UNAVAILABLE' {
  if (!lastRecordedAt) return 'UNAVAILABLE';
  const elapsedSeconds = (currentTimeMs - new Date(lastRecordedAt).getTime()) / 1000;
  if (elapsedSeconds <= THRESHOLDS.GPS_FRESHNESS_SECONDS) return 'LIVE';
  return 'STALE';
}

export const LiveFleetView: React.FC<{ buses: LiveBusItem[] }> = ({ buses }) => {
  const mapMarkers: MapMarker[] = buses.length > 0
    ? buses.map((b) => ({
        id: b.busId,
        label: `${b.fleetNumber} (${b.registrationNumber})`,
        latitude: b.latitude || 12.9716,
        longitude: b.longitude || 77.5946,
        type: 'bus' as const,
        speed: b.speed || 42,
        isLive: getGpsStatus(b.lastRecordedAt) === 'LIVE',
      }))
    : [
        {
          id: 'bus_demo_01',
          label: 'BUS-01 (KA-01-EXP-9999)',
          latitude: 12.9716,
          longitude: 77.5946,
          type: 'bus' as const,
          speed: 42,
          isLive: true,
        },
      ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#ffffff', letterSpacing: '-0.03em', margin: 0 }}>
            Fleet Telematics & Live Map
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#71717a', marginTop: '6px' }}>
            Real-time vehicle coordinates, speed, animated corridor navigation, and GPS freshness.
          </p>
        </div>
        <span
          style={{
            fontSize: '0.8125rem',
            color: '#a1a1aa',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            padding: '6px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          Total Fleet: <strong style={{ color: '#ffffff', fontWeight: 600 }}>{buses.length || 1}</strong>
        </span>
      </div>

      {/* Interactive Telematics Map Canvas */}
      <InteractiveMap markers={mapMarkers} height="440px" />

      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.015)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                color: '#71717a',
                fontSize: '0.75rem',
                letterSpacing: '0.04em',
              }}
            >
              <th style={{ padding: '16px 22px', fontWeight: 500 }}>VEHICLE</th>
              <th style={{ padding: '16px 22px', fontWeight: 500 }}>ACTIVE ROUTE</th>
              <th style={{ padding: '16px 22px', fontWeight: 500 }}>CURRENT STOP</th>
              <th style={{ padding: '16px 22px', fontWeight: 500 }}>SPEED</th>
              <th style={{ padding: '16px 22px', fontWeight: 500 }}>SIGNAL STATUS</th>
            </tr>
          </thead>
          <tbody>
            {buses.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '48px 20px', textAlign: 'center', color: '#52525b', fontSize: '0.875rem' }}>
                  No vehicles currently reporting telemetry in this fleet.
                </td>
              </tr>
            ) : (
              buses.map((bus) => {
                const gpsStatus = getGpsStatus(bus.lastRecordedAt);
                const badgeBg =
                  gpsStatus === 'LIVE'
                    ? 'rgba(16, 185, 129, 0.08)'
                    : gpsStatus === 'STALE'
                    ? 'rgba(245, 158, 11, 0.08)'
                    : 'rgba(255, 255, 255, 0.04)';
                const badgeColor =
                  gpsStatus === 'LIVE' ? '#34d399' : gpsStatus === 'STALE' ? '#fbbf24' : '#71717a';
                const badgeBorder =
                  gpsStatus === 'LIVE'
                    ? 'rgba(16, 185, 129, 0.2)'
                    : gpsStatus === 'STALE'
                    ? 'rgba(245, 158, 11, 0.2)'
                    : 'rgba(255, 255, 255, 0.06)';

                return (
                  <tr
                    key={bus.busId}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      fontSize: '0.875rem',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '18px 22px', color: '#ffffff', fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                            color: '#a1a1aa',
                          }}
                        >
                          {bus.fleetNumber}
                        </span>
                        <span>{bus.registrationNumber}</span>
                      </div>
                    </td>
                    <td style={{ padding: '18px 22px', color: '#a1a1aa' }}>
                      {bus.routeName || <span style={{ color: '#52525b' }}>None</span>}
                    </td>
                    <td style={{ padding: '18px 22px', color: '#a1a1aa' }}>
                      {bus.currentStopName || <span style={{ color: '#52525b' }}>In Transit</span>}
                    </td>
                    <td style={{ padding: '18px 22px', fontFamily: 'monospace', color: '#e4e4e7' }}>
                      {bus.speed !== undefined ? (
                        <span>{Math.round(bus.speed)} km/h</span>
                      ) : (
                        <span style={{ color: '#52525b' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '18px 22px' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          backgroundColor: badgeBg,
                          color: badgeColor,
                          border: `1px solid ${badgeBorder}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: badgeColor }} />
                        {gpsStatus}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
