import React, { useState } from 'react';
import { useRouter } from '../router/Router';
import { colors, radii, shadows } from '../theme/design-system';
import { StatusBadge } from '../components/ui/SharedComponents';
import { InteractiveMap, MapMarker } from '../components/InteractiveMap';
import { ApiClient } from '@school-transport-platform/client-sdk';

interface BusCockpitPageProps {
  apiClient: ApiClient;
}

export const BusCockpitPage: React.FC<BusCockpitPageProps> = ({ apiClient }) => {
  const { getParam, navigate } = useRouter();
  const busId = getParam('id') || '88888888-8888-8888-8888-888888888801';

  const [bus] = useState({
    busNumber: 'Bus 12',
    registrationNumber: 'KA-01-EXP-9999',
    routeName: 'Sector 62 → Oakridge Campus Express',
    status: 'ON_ROUTE',
    statusLabel: 'On Route',
    studentsBoarded: 28,
    capacity: 32,
    driverName: 'Rajesh Kumar',
    driverPhone: '+91 98765 43210',
    attendantName: 'Sunita Devi',
    attendantPhone: '+91 98765 43211',
    currentSpeed: 38,
    heading: '84° NE',
    deviceHealth: {
      gps: 'Online (12 Satellites Fix, <15s fresh)',
      rfid: 'Online (Reader Active, 0 Queue)',
      network: '4G LTE (Strong Signal -68 dBm)',
    },
  });

  const routeStops = [
    { name: 'Stop 1: Sector 62 Metro Gate #2', status: 'completed', time: '07:42 AM' },
    { name: 'Stop 2: Fortis Hospital Crossing', status: 'completed', time: '07:48 AM' },
    { name: 'Stop 3: Sector 61 Junction', status: 'current', time: 'Now (Bus Position)' },
    { name: 'Stop 4: Shipra Sun City', status: 'pending', time: '~07:53 AM' },
    { name: 'Destination: Oakridge Campus', status: 'pending', time: '~07:58 AM' },
  ];

  const mapMarkers: MapMarker[] = [
    {
      id: 'bus_12',
      label: 'Bus 12 (KA-01-EXP-9999)',
      latitude: 28.6320,
      longitude: 77.3680,
      type: 'bus',
      speed: 38,
      isLive: true,
    },
    {
      id: 'stop_1',
      label: 'Sector 62 Metro Gate #2',
      latitude: 28.6280,
      longitude: 77.3649,
      type: 'stop',
    },
    {
      id: 'campus',
      label: 'Oakridge Campus Terminus',
      latitude: 28.6400,
      longitude: 77.3800,
      type: 'school',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px' }}>
      {/* Back button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => navigate('/buses')}
          style={{
            padding: '8px 14px',
            backgroundColor: '#ffffff',
            border: `1px solid ${colors.border}`,
            borderRadius: radii.md,
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: shadows.sm,
          }}
        >
          ← Back to Fleet
        </button>
        <span style={{ fontSize: '13px', color: colors.textMuted }}>/</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: colors.textSecondary }}>Bus Cockpit</span>
      </div>

      {/* Main Cockpit Operational Canvas */}
      <div
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          border: `1px solid ${colors.border}`,
          padding: '28px 32px',
          boxShadow: shadows.md,
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Top Header: Bus Identity, Route & Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', paddingBottom: '20px', borderBottom: `1px solid ${colors.border}` }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: colors.textPrimary }}>
                🚌 {bus.busNumber}
              </span>
              <span style={{ fontSize: '14px', color: colors.textSecondary, fontWeight: 600 }}>
                ({bus.registrationNumber})
              </span>
              <StatusBadge type="info" icon="●" label={bus.statusLabel} />
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: colors.textSecondary, marginTop: '4px' }}>
              {bus.routeName}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: colors.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Passenger Load</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: colors.success }}>
              {bus.studentsBoarded} / {bus.capacity} <span style={{ fontSize: '14px', color: colors.textSecondary, fontWeight: 600 }}>Boarded</span>
            </div>
          </div>
        </div>

        {/* Visual Route Sequence Ribbon */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 800, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: '12px' }}>
            Active Route Sequence &bull; Bus Position
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
            {routeStops.map((st, i) => (
              <React.Fragment key={i}>
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: radii.md,
                    backgroundColor: st.status === 'completed' ? colors.successLight : st.status === 'current' ? colors.primaryLight : '#f8fafc',
                    border: `1px solid ${st.status === 'completed' ? colors.successBorder : st.status === 'current' ? colors.primaryBorder : colors.border}`,
                    color: st.status === 'completed' ? colors.success : st.status === 'current' ? colors.primary : colors.textSecondary,
                    fontSize: '12px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <span>{st.status === 'completed' ? '✓ ' : st.status === 'current' ? '📍 ' : '○ '}{st.name}</span>
                  <span style={{ fontSize: '10px', color: colors.textMuted }}>{st.time}</span>
                </div>
                {i < routeStops.length - 1 && <span style={{ color: colors.textMuted, fontWeight: 700 }}>→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Live Interactive Map */}
        <div style={{ height: '320px', borderRadius: radii.lg, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
          <InteractiveMap
            markers={mapMarkers}
            height="320px"
            busSpeed={bus.currentSpeed}
            busLive={true}
          />
        </div>

        {/* 2-Column Grid: On-Bus Personnel & Secondary Device Health */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Personnel */}
          <div style={{ padding: '18px 20px', backgroundColor: '#f8fafc', borderRadius: radii.lg, border: `1px solid ${colors.borderLight}` }}>
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: colors.textPrimary, textTransform: 'uppercase', margin: '0 0 12px 0' }}>
              On-Bus Personnel
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>👨‍✈️ Driver: {bus.driverName}</div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary }}>{bus.driverPhone}</div>
                </div>
                <button
                  onClick={() => alert(`Calling driver at ${bus.driverPhone}`)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: radii.md,
                    backgroundColor: '#ffffff',
                    border: `1px solid ${colors.border}`,
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Call
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: `1px solid ${colors.borderLight}` }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>👩‍💼 Attendant: {bus.attendantName}</div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary }}>{bus.attendantPhone}</div>
                </div>
                <button
                  onClick={() => alert(`Calling attendant at ${bus.attendantPhone}`)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: radii.md,
                    backgroundColor: '#ffffff',
                    border: `1px solid ${colors.border}`,
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Call
                </button>
              </div>
            </div>
          </div>

          {/* Secondary Device Health */}
          <div style={{ padding: '18px 20px', backgroundColor: '#f8fafc', borderRadius: radii.lg, border: `1px solid ${colors.borderLight}` }}>
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: colors.textPrimary, textTransform: 'uppercase', margin: '0 0 12px 0' }}>
              Hardware Device Health
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.textSecondary }}>GPS Telematics:</span>
                <span style={{ fontWeight: 700, color: colors.success }}>● {bus.deviceHealth.gps}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.textSecondary }}>RFID Card Scanner:</span>
                <span style={{ fontWeight: 700, color: colors.success }}>● {bus.deviceHealth.rfid}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.textSecondary }}>Cellular Telemetry:</span>
                <span style={{ fontWeight: 700, color: colors.primary }}>● {bus.deviceHealth.network}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
