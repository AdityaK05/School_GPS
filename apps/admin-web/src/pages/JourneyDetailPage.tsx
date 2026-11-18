import React, { useState } from 'react';
import { useRouter } from '../router/Router';
import { colors, radii, shadows } from '../theme/design-system';
import { StatusBadge, JourneyTimeline } from '../components/ui/SharedComponents';
import { InteractiveMap, MapMarker } from '../components/InteractiveMap';
import { ApiClient } from '@school-transport-platform/client-sdk';

interface JourneyDetailPageProps {
  apiClient: ApiClient;
}

export const JourneyDetailPage: React.FC<JourneyDetailPageProps> = ({ apiClient }) => {
  const { getParam, navigate } = useRouter();
  const journeyId = getParam('id') || 'c1111111-1111-1111-1111-111111111101';

  const [student] = useState({
    name: 'Aarav Sharma',
    className: 'Class 7-B',
    admissionNumber: 'ADM-2024-001',
    busNumber: 'Bus 12',
    busReg: 'UP-16-BT-9912',
    routeName: 'North Corridor Express',
    guardianName: 'Priya Devi',
    guardianPhone: '+91 98765 43210',
    driver: 'Rajesh Kumar (+91 98765 43210)',
    attendant: 'Sunita Devi (+91 98765 43211)',
    currentLocation: 'Sector 61 Crossing',
    currentSpeed: 38,
    lastUpdate: '1 min ago (Live 60s GPS)',
    assignedStop: 'Stop 1: Sector 62 Metro Gate #2',
    etaMinutes: 8,
  });

  const timelineSteps = [
    { label: 'Expected at Stop', sublabel: 'Sector 62 Metro Gate #2', time: '07:35 AM', status: 'completed' as const },
    { label: 'Boarded Bus 12', sublabel: 'RFID Card Tap Verified', time: '07:42 AM', status: 'completed' as const },
    { label: 'On the way', sublabel: 'Sector 61 Crossing (Speed 38 km/h)', time: '07:49 AM', status: 'current' as const },
    { label: 'School Arrival', sublabel: 'Oakridge Campus Terminus', time: '~07:58 AM', status: 'pending' as const },
  ];

  const routeStops = [
    { name: 'Home / Pickup Area', status: 'completed' },
    { name: 'Sector 62 Metro Gate #2 (Boarded)', status: 'completed' },
    { name: 'Fortis Hospital Crossing', status: 'completed' },
    { name: 'Sector 61 Junction (Current Bus Position)', status: 'current' },
    { name: 'Oakridge International Campus', status: 'pending' },
  ];

  const eventsLedger = [
    { time: '07:42 AM', event: 'RFID Boarding Verified', detail: 'Card CARD-AARAV-01 verified by hardware scanner on Bus 12.' },
    { time: '07:43 AM', event: 'Bus Departed Stop #1', detail: 'Geofence departure recorded (Speed: 24 km/h).' },
    { time: '07:48 AM', event: 'Fortis Stop Cleared', detail: 'Bus 12 crossed Fortis intersection on schedule.' },
    { time: '07:49 AM', event: 'Sector 61 Telematics Update', detail: 'Live telemetry received: Speed 38 km/h, Heading 84° NE.' },
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1080px' }}>
      {/* Back Button & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => navigate('/journeys')}
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
          ← Back to Journeys
        </button>
        <span style={{ fontSize: '13px', color: colors.textMuted }}>/</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: colors.textSecondary }}>Journey Passport</span>
      </div>

      {/* THE JOURNEY PASSPORT CARD */}
      <div
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          border: `2px solid ${colors.primary}`,
          padding: '32px',
          boxShadow: shadows.md,
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Passport Header: Identity & Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', paddingBottom: '24px', borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: colors.primaryLight,
                border: `2px solid ${colors.primary}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: 800,
                color: colors.primary,
              }}
            >
              A
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Official Journey Passport
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: colors.textPrimary, margin: '2px 0 2px 0', letterSpacing: '-0.02em' }}>
                {student.name}
              </h1>
              <div style={{ fontSize: '14px', fontWeight: 600, color: colors.textSecondary }}>
                {student.className} &bull; Admission: {student.admissionNumber} &bull; Guardian: {student.guardianName}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', color: colors.textSecondary, fontWeight: 600 }}>Assigned Vehicle</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: colors.textPrimary, marginTop: '2px' }}>
              🚌 {student.busNumber}
            </div>
            <div style={{ marginTop: '6px' }}>
              <StatusBadge type="info" icon="●" label="On the way to School" />
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Timeline & Current Location Map */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '32px' }}>
          {/* Left Column: Visual Step Progression Timeline */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '18px' }}>
              Commute Progression
            </h3>
            <JourneyTimeline steps={timelineSteps} />

            {/* Assigned Staff Contacts */}
            <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: radii.md, border: `1px solid ${colors.borderLight}` }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: colors.textSecondary, textTransform: 'uppercase' }}>On-Bus Personnel</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary, marginTop: '6px' }}>
                👨‍✈️ Driver: {student.driver}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary, marginTop: '4px' }}>
                👩‍💼 Attendant: {student.attendant}
              </div>
            </div>
          </div>

          {/* Right Column: Current Location & Live Mini Map */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Current Position Banner */}
            <div style={{ padding: '16px 20px', backgroundColor: colors.primaryLight, borderRadius: radii.md, border: `1px solid ${colors.primaryBorder}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: colors.primary, textTransform: 'uppercase' }}>Current Position</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: colors.textPrimary, marginTop: '2px' }}>
                    📍 {student.currentLocation}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: colors.primary }}>~{student.etaMinutes} min</div>
                  <div style={{ fontSize: '11px', color: colors.textSecondary }}>Estimated School ETA</div>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '8px' }}>
                Speed: <strong>{student.currentSpeed} km/h</strong> &bull; Updated: {student.lastUpdate}
              </div>
            </div>

            {/* Mini Map */}
            <div style={{ height: '220px', borderRadius: radii.md, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
              <InteractiveMap
                markers={mapMarkers}
                height="220px"
                busSpeed={38}
                busLive={true}
              />
            </div>
          </div>
        </div>

        {/* Section: Today's Journey Route Sequence */}
        <div style={{ paddingTop: '20px', borderTop: `1px solid ${colors.border}` }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px' }}>
            Today's Journey Stops
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflowX: 'auto', paddingBottom: '6px' }}>
            {routeStops.map((st, i) => (
              <React.Fragment key={i}>
                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: radii.md,
                    backgroundColor: st.status === 'completed' ? colors.successLight : st.status === 'current' ? colors.primaryLight : '#f1f5f9',
                    border: `1px solid ${st.status === 'completed' ? colors.successBorder : st.status === 'current' ? colors.primaryBorder : colors.border}`,
                    color: st.status === 'completed' ? colors.success : st.status === 'current' ? colors.primary : colors.textSecondary,
                    fontSize: '12px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {st.status === 'completed' ? '✓ ' : st.status === 'current' ? '● ' : '○ '}
                  {st.name}
                </div>
                {i < routeStops.length - 1 && <span style={{ color: colors.textMuted }}>→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Section: Events Ledger */}
        <div style={{ paddingTop: '20px', borderTop: `1px solid ${colors.border}` }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px' }}>
            Immutable Event Log
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {eventsLedger.map((evt, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '10px 14px',
                  backgroundColor: '#f8fafc',
                  borderRadius: radii.md,
                  border: `1px solid ${colors.borderLight}`,
                  fontSize: '13px',
                }}
              >
                <span style={{ fontWeight: 800, color: colors.textPrimary, minWidth: '70px' }}>{evt.time}</span>
                <span style={{ fontWeight: 700, color: colors.primary, minWidth: '180px' }}>{evt.event}</span>
                <span style={{ color: colors.textSecondary }}>{evt.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
