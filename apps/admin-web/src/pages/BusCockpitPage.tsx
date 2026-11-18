import React, { useState } from 'react';
import { useRouter } from '../router/Router';
import { useTheme } from '../theme/ThemeContext';
import { radii, shadows } from '../theme/design-system';
import { StatusBadge } from '../components/ui/SharedComponents';
import { InteractiveMap, MapMarker } from '../components/InteractiveMap';
import { JourneyLine } from '../components/ui/JourneyLine';
import { RfidIcon } from '../components/ui/RfidIcon';
import { ApiClient } from '@school-transport-platform/client-sdk';
import {
  ArrowLeft,
  BusFront,
  UsersRound,
  Phone,
  UserCheck,
  Radio,
  Wifi,
  MapPin,
  Clock3,
} from 'lucide-react';

interface BusCockpitPageProps {
  apiClient: ApiClient;
}

export const BusCockpitPage: React.FC<BusCockpitPageProps> = ({ apiClient }) => {
  const { getParam, navigate } = useRouter();
  const { colors, isDark } = useTheme();
  const busId = getParam('id') || '88888888-8888-8888-8888-888888888801';

  const [bus] = useState({
    busNumber: 'BUS 12',
    registrationNumber: 'UP-16-BT-9912',
    routeName: 'Sector 62 → Oakridge Campus Express',
    status: 'ON_ROUTE',
    statusLabel: 'On route',
    studentsBoarded: 28,
    capacity: 32,
    driverName: 'Rajesh Kumar',
    driverPhone: '+91 98765 43210',
    attendantName: 'Sunita Devi',
    attendantPhone: '+91 98765 43211',
    currentSpeed: 38,
    lastUpdate: 'Updated 32 sec ago',
    deviceStatus: {
      gps: 'Online (Continuous location live)',
      rfid: 'Online (Reader scanner active)',
      network: 'Cellular (Strong connection)',
    },
  });

  const corridorStops = [
    { id: '1', name: 'Sector 62 Metro Gate #2', time: '07:42 AM', status: 'passed' as const },
    { id: '2', name: 'Fortis Hospital Crossing', time: '07:48 AM', status: 'passed' as const },
    { id: '3', name: 'Sector 61 Crossing', time: 'Now', status: 'current' as const },
  ];

  const mapMarkers: MapMarker[] = [
    {
      id: 'bus_12',
      label: 'Bus 12 (UP-16-BT-9912)',
      latitude: 28.6320,
      longitude: 77.3680,
      type: 'bus',
      status: 'On route',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1050px' }}>
      {/* Back button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => navigate('/buses')}
          style={{
            padding: '7px 12px',
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: radii.sm,
            fontSize: '12px',
            fontWeight: 600,
            color: colors.textPrimary,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: shadows.sm,
          }}
        >
          <ArrowLeft size={14} strokeWidth={2} />
          <span>Back to Buses</span>
        </button>
      </div>

      {/* Main Cockpit Operational Canvas */}
      <div
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.lg,
          border: `1px solid ${colors.border}`,
          padding: '24px 28px',
          boxShadow: shadows.sm,
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Header (Section 26) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', paddingBottom: '20px', borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: radii.sm,
                backgroundColor: colors.primaryLight,
                border: `1px solid ${colors.primaryBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.primary,
              }}
            >
              <BusFront size={24} strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Operational Cockpit
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: colors.textPrimary, margin: '2px 0 2px 0', letterSpacing: '-0.02em' }}>
                {bus.busNumber}
              </h1>
              <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                {bus.registrationNumber} &bull; {bus.routeName}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: colors.textSecondary, fontWeight: 600 }}>Journey Status</div>
            <div style={{ marginTop: '4px' }}>
              <StatusBadge type="info" label={bus.statusLabel} />
            </div>
            <div style={{ fontSize: '11px', color: colors.textMuted, marginTop: '4px' }}>
              {bus.lastUpdate}
            </div>
          </div>
        </div>

        {/* 2-Column: Route Visualizer & Live Corridor Map */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
          {/* Left Column: Signature Journey Line */}
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px' }}>
              Route Progression
            </h3>
            <div style={{ backgroundColor: colors.bg, borderRadius: radii.md, padding: '16px', border: `1px solid ${colors.borderLight}` }}>
              <JourneyLine
                originName="Sector 62 Metro Gate #2"
                destinationName="Oakridge Campus Terminus"
                stops={corridorStops}
                busNumber={bus.busNumber}
              />
            </div>

            {/* Capacity Card */}
            <div style={{ marginTop: '14px', padding: '14px', backgroundColor: colors.bg, borderRadius: radii.md, border: `1px solid ${colors.borderLight}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                <span style={{ color: colors.textSecondary }}>Passenger Manifest</span>
                <span style={{ color: colors.textPrimary, fontWeight: 700 }}>{bus.studentsBoarded} / {bus.capacity} students onboard</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: colors.borderLight, borderRadius: radii.full, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${(bus.studentsBoarded / bus.capacity) * 100}%`,
                    height: '100%',
                    backgroundColor: colors.success,
                    borderRadius: radii.full,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Live Map & Device Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Map */}
            <div style={{ height: '260px', borderRadius: radii.md, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
              <InteractiveMap
                markers={mapMarkers}
                height="260px"
                busSpeed={bus.currentSpeed}
                busLive={true}
                lastUpdatedText={bus.lastUpdate}
              />
            </div>

            {/* Personnel & Device Status Card */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '12px', backgroundColor: colors.bg, borderRadius: radii.sm, border: `1px solid ${colors.borderLight}` }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase' }}>Personnel</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: colors.textPrimary, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={11} strokeWidth={1.8} color={colors.primary} />
                  <span>Driver: {bus.driverName}</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: colors.textPrimary, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <UserCheck size={11} strokeWidth={1.8} color={colors.primary} />
                  <span>Attendant: {bus.attendantName}</span>
                </div>
              </div>

              <div style={{ padding: '12px', backgroundColor: colors.bg, borderRadius: radii.sm, border: `1px solid ${colors.borderLight}` }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase' }}>Device Status</div>
                <div style={{ fontSize: '11px', color: colors.textPrimary, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Radio size={11} strokeWidth={2} color={colors.success} />
                  <span>GPS: Online</span>
                </div>
                <div style={{ fontSize: '11px', color: colors.textPrimary, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <RfidIcon size={12} color={colors.success} />
                  <span>RFID Reader: Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
