import React, { useState } from 'react';
import { useRouter } from '../router/Router';
import { useTheme } from '../theme/ThemeContext';
import { radii, shadows } from '../theme/design-system';
import { StatusBadge } from '../components/ui/SharedComponents';
import { InteractiveMap, MapMarker } from '../components/InteractiveMap';
import { JourneyLine } from '../components/ui/JourneyLine';
import { ApiClient } from '@school-transport-platform/client-sdk';
import {
  ArrowLeft,
  UserRound,
  BusFront,
  Navigation,
  Clock3,
  Phone,
  UserCheck,
  Check,
  CircleAlert,
  ShieldCheck,
  MapPin,
} from 'lucide-react';

interface JourneyDetailPageProps {
  apiClient: ApiClient;
}

export const JourneyDetailPage: React.FC<JourneyDetailPageProps> = ({ apiClient }) => {
  const { getParam, navigate } = useRouter();
  const { colors, isDark } = useTheme();

  const [student] = useState({
    name: 'AARAV SHARMA',
    className: 'Class 7-B',
    admissionNumber: 'ADM-2024-001',
    busNumber: 'BUS 12',
    busReg: 'UP-16-BT-9912',
    routeName: 'North Corridor Express',
    guardianName: 'Priya Devi',
    guardianPhone: '+91 98765 43210',
    driver: 'Rajesh Kumar (+91 98765 43210)',
    attendant: 'Sunita Devi (+91 98765 43211)',
    currentLocation: 'Sector 61 Crossing',
    currentSpeed: 38,
    lastUpdate: 'Updated 32 sec ago',
    assignedStop: 'Sector 62 Metro Gate #2',
    etaMinutes: 8,
  });

  const timelineSteps = [
    { label: 'Expected at Stop', sublabel: 'Sector 62 Metro Gate #2', time: '07:35 AM', status: 'completed' as const },
    { label: 'Boarded Bus 12', sublabel: 'RFID Card Tap Verified', time: '07:42 AM', status: 'completed' as const },
    { label: 'On the way', sublabel: 'Sector 61 Crossing', time: '07:49 AM', status: 'current' as const },
    { label: 'Arriving at school', sublabel: 'Oakridge Campus Terminus', time: 'ETA 07:58 AM', status: 'upcoming' as const },
  ];

  const corridorStops = [
    { id: '1', name: 'Sector 62 Metro', time: '07:42 AM', status: 'passed' as const },
    { id: '2', name: 'Fortis Hospital', time: '07:48 AM', status: 'passed' as const },
    { id: '3', name: 'Sector 61 Crossing', time: '07:51 AM', status: 'current' as const },
  ];

  const eventsLedger = [
    { time: '07:42 AM', event: 'Student boarded', detail: 'Aarav Sharma verified onto Bus 12 at Sector 62' },
    { time: '07:43 AM', event: 'Bus departed stop', detail: 'Departed Sector 62 Metro stop area' },
    { time: '07:48 AM', event: 'Fortis stop cleared', detail: 'Bus 12 crossed Fortis intersection on schedule' },
    { time: '07:51 AM', event: 'Live location update', detail: 'Bus 12 on corridor near Sector 61 Crossing' },
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px' }}>
      {/* Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => navigate('/journeys')}
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
          <span>Back to Journeys</span>
        </button>
      </div>

      {/* THE JOURNEY PASSPORT CARD (Section 25: Understandable in 3 Seconds) */}
      <div
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.lg,
          border: `1px solid ${colors.border}`,
          padding: '28px',
          boxShadow: shadows.sm,
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Passport Header: Identity & Status */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
            paddingBottom: '20px',
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: colors.primaryLight,
                border: `2px solid ${colors.primaryBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.primary,
              }}
            >
              <UserRound size={26} strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Transportation Passport
              </div>
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: colors.textPrimary, margin: '2px 0 2px 0', letterSpacing: '-0.02em' }}>
                {student.name}
              </h1>
              <div style={{ fontSize: '13px', fontWeight: 500, color: colors.textSecondary }}>
                {student.className} &bull; Admission: {student.admissionNumber} &bull; Guardian: {student.guardianName}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: colors.textSecondary, fontWeight: 600 }}>Assigned Bus</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: colors.textPrimary, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
              <BusFront size={18} strokeWidth={2.2} color={colors.primary} />
              <span>{student.busNumber}</span>
            </div>
            <div style={{ marginTop: '6px' }}>
              <StatusBadge type="info" label="On the way to school" />
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Timeline & Current Location Map */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '28px' }}>
          {/* Left Column: Signature Journey Line */}
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px' }}>
              Journey Route
            </h3>
            <div style={{ backgroundColor: colors.bg, borderRadius: radii.md, padding: '16px', border: `1px solid ${colors.borderLight}` }}>
              <JourneyLine
                originName="Home (Sector 62)"
                destinationName="Oakridge Campus"
                stops={corridorStops}
                busNumber="Bus 12"
              />
            </div>

            {/* Personnel Contacts */}
            <div style={{ marginTop: '16px', padding: '14px', backgroundColor: colors.bg, borderRadius: radii.md, border: `1px solid ${colors.borderLight}` }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase' }}>
                On-Bus Personnel
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: colors.textPrimary, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={13} strokeWidth={1.8} color={colors.primary} />
                <span>Driver: {student.driver}</span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: colors.textPrimary, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserCheck size={13} strokeWidth={1.8} color={colors.primary} />
                <span>Attendant: {student.attendant}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Current Location Banner & Live Map */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Current Position Banner */}
            <div
              style={{
                padding: '14px 18px',
                backgroundColor: colors.primaryLight,
                borderRadius: radii.md,
                border: `1px solid ${colors.primaryBorder}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: colors.primary, textTransform: 'uppercase' }}>
                    Current Location
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: colors.textPrimary, marginTop: '2px' }}>
                    {student.currentLocation}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: colors.primary }}>
                    ~{student.etaMinutes} min
                  </div>
                  <div style={{ fontSize: '10px', color: colors.textSecondary }}>Estimated arrival</div>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '6px' }}>
                {student.lastUpdate}
              </div>
            </div>

            {/* Mini Map */}
            <div style={{ height: '220px', borderRadius: radii.md, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
              <InteractiveMap
                markers={mapMarkers}
                height="220px"
                busSpeed={38}
                busLive={true}
                lastUpdatedText={student.lastUpdate}
              />
            </div>
          </div>
        </div>

        {/* Section: Activity Log (Human-readable) */}
        <div style={{ paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
            Today's Safety Activity
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {eventsLedger.map((evt, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '9px 12px',
                  backgroundColor: colors.bg,
                  borderRadius: radii.sm,
                  border: `1px solid ${colors.borderLight}`,
                  fontSize: '12px',
                }}
              >
                <span style={{ fontWeight: 700, color: colors.textMuted, minWidth: '65px' }}>{evt.time}</span>
                <span style={{ fontWeight: 700, color: colors.primary, minWidth: '150px' }}>{evt.event}</span>
                <span style={{ color: colors.textSecondary }}>{evt.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
