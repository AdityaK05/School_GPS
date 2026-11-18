import React, { useState } from 'react';
import { useRouter } from '../router/Router';
import { useTheme } from '../theme/ThemeContext';
import { radii, shadows } from '../theme/design-system';
import { StatusBadge } from '../components/ui/SharedComponents';
import { JourneyLine } from '../components/ui/JourneyLine';
import { ApiClient } from '@school-transport-platform/client-sdk';
import { Route, MapPin, BusFront, ArrowRight, ArrowLeft, UsersRound, ShieldCheck } from 'lucide-react';

interface RoutesPageProps {
  apiClient: ApiClient;
}

export const RoutesPage: React.FC<RoutesPageProps> = ({ apiClient }) => {
  const { getParam, navigate } = useRouter();
  const { colors, isDark } = useTheme();
  const selectedRouteId = getParam('id');

  const [routes] = useState([
    {
      id: 'r_01',
      name: 'North Corridor Express',
      code: 'R-NC-01',
      direction: 'MORNING',
      assignedBuses: ['Bus 12 (KA-01-EXP-9999)'],
      studentsCount: 32,
      stops: [
        { seq: 1, name: 'Sector 62 Metro Gate #2', geofence: '50m buffer', students: 8, time: '07:35 AM' },
        { seq: 2, name: 'Shipra Sun City Gate #4', geofence: '50m buffer', students: 10, time: '07:42 AM' },
        { seq: 3, name: 'Fortis Hospital Crossing', geofence: '50m buffer', students: 6, time: '07:48 AM' },
        { seq: 4, name: 'Indirapuram Habitat Centre', geofence: '50m buffer', students: 8, time: '07:52 AM' },
        { seq: 5, name: 'Oakridge Campus Terminus', geofence: '75m buffer', students: 32, time: '08:00 AM' },
      ],
      activeJourney: {
        busNumber: 'Bus 12',
        currentStop: 'Stop 1: Sector 62 Metro',
        status: 'ON_ROUTE',
      },
    },
    {
      id: 'r_02',
      name: 'Vaishali & East Ring Road',
      code: 'R-VR-02',
      direction: 'MORNING',
      assignedBuses: ['Bus 14 (KA-01-EXP-4444)'],
      studentsCount: 28,
      stops: [
        { seq: 1, name: 'Vaishali Metro Station Bay 2', geofence: '50m buffer', students: 12, time: '07:30 AM' },
        { seq: 2, name: 'Anand Vihar Flyover Crossing', geofence: '50m buffer', students: 8, time: '07:40 AM' },
        { seq: 3, name: 'Ghazipur Junction', geofence: '50m buffer', students: 8, time: '07:48 AM' },
        { seq: 4, name: 'Oakridge Campus Terminus', geofence: '75m buffer', students: 28, time: '08:02 AM' },
      ],
      activeJourney: {
        busNumber: 'Bus 14',
        currentStop: 'Stop 2: Anand Vihar Crossing',
        status: 'ON_ROUTE',
      },
    },
  ]);

  const activeRoute = selectedRouteId ? routes.find((r) => r.id === selectedRouteId) || routes[0] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px' }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Route size={15} strokeWidth={2} />
          Corridor Planning
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: colors.textPrimary, margin: '4px 0 2px 0', letterSpacing: '-0.02em' }}>
          Routes &amp; Stops
        </h1>
        <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0 }}>
          Authoritative geofenced bus corridors, sequential stops, and assigned vehicles.
        </p>
      </div>

      {/* If looking at route detail */}
      {activeRoute ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <button
            onClick={() => navigate('/routes')}
            style={{
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: radii.md,
              color: colors.textPrimary,
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            <ArrowLeft size={14} strokeWidth={2} />
            View All Routes
          </button>

          <div
            style={{
              backgroundColor: colors.card,
              borderRadius: radii.xl,
              border: `1px solid ${colors.border}`,
              padding: '28px 32px',
              boxShadow: shadows.card,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `1px solid ${colors.border}`, paddingBottom: '18px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {activeRoute.code} &bull; {activeRoute.direction}
                </span>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: colors.textPrimary, margin: '4px 0' }}>
                  {activeRoute.name}
                </h2>
                <div style={{ fontSize: '13px', color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <BusFront size={14} strokeWidth={2} color={colors.primary} />
                    <strong>{activeRoute.assignedBuses.join(', ')}</strong>
                  </span>
                  <span>&bull;</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <UsersRound size={14} strokeWidth={2} color={colors.primary} />
                    <strong>{activeRoute.studentsCount} Students</strong>
                  </span>
                </div>
              </div>
              <StatusBadge type="info" icon="●" label="Active Corridor" />
            </div>

            {/* Visual Corridor Progress */}
            <div style={{ margin: '24px 0', padding: '16px 20px', backgroundColor: colors.canvasBg, borderRadius: radii.lg, border: `1px solid ${colors.borderLight}` }}>
              <JourneyLine
                orientation="horizontal"
                busNumber="Bus 12"
                originName={activeRoute.stops[0].name}
                destinationName={activeRoute.stops[activeRoute.stops.length - 1].name}
                stops={activeRoute.stops.map((s, idx) => ({
                  id: `stop_${s.seq}`,
                  name: s.name,
                  time: s.time,
                  status: idx === 0 ? 'passed' : idx === 1 ? 'current' : 'upcoming',
                  studentsCount: s.students,
                }))}
              />
            </div>

            {/* Vertical Stop Sequence */}
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: colors.textPrimary, textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={15} strokeWidth={2} color={colors.primary} />
                Sequential Geofenced Stops
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeRoute.stops.map((st, i) => (
                  <div key={st.seq} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: i === 0 ? colors.primary : colors.primaryLight,
                        color: i === 0 ? '#ffffff' : colors.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {st.seq}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        backgroundColor: colors.canvasBg,
                        borderRadius: radii.md,
                        border: `1px solid ${colors.borderLight}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: colors.textPrimary }}>
                          {st.name}
                        </div>
                        <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ShieldCheck size={12} strokeWidth={2} color={colors.success} />
                          PostGIS Geofence: {st.geofence} &bull; Scheduled: {st.time}
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: colors.primary, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <UsersRound size={13} strokeWidth={2} />
                        {st.students} Students
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Routes List View with Visual Ribbons */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {routes.map((r) => (
            <div
              key={r.id}
              onClick={() => navigate(`/routes/${r.id}`)}
              style={{
                backgroundColor: colors.card,
                borderRadius: radii.lg,
                border: `1px solid ${colors.border}`,
                padding: '24px',
                boxShadow: shadows.card,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.boxShadow = shadows.md;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.border;
                e.currentTarget.style.boxShadow = shadows.card;
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {r.code} &bull; {r.direction}
                  </span>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: colors.textPrimary, margin: '2px 0 4px 0' }}>
                    {r.name}
                  </h3>
                  <div style={{ fontSize: '13px', color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span>{r.stops.length} Geofenced Stops</span>
                    <span>&bull;</span>
                    <span>{r.studentsCount} Students Assigned</span>
                    <span>&bull;</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <BusFront size={13} strokeWidth={2} color={colors.primary} />
                      {r.assignedBuses[0]}
                    </span>
                  </div>
                </div>

                <StatusBadge type="info" label="Active Corridor" />
              </div>

              {/* Visual Stop Sequence Ribbon */}
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px 14px',
                  backgroundColor: colors.canvasBg,
                  borderRadius: radii.md,
                  border: `1px solid ${colors.borderLight}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  overflowX: 'auto',
                }}
              >
                {r.stops.map((st, i) => (
                  <React.Fragment key={st.seq}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: colors.textPrimary, whiteSpace: 'nowrap' }}>
                      {st.seq}. {st.name}
                    </span>
                    {i < r.stops.length - 1 && (
                      <ArrowRight size={12} strokeWidth={2} color={colors.textMuted} style={{ flexShrink: 0 }} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: colors.primary }}>
                <span>View Stops Sequence &amp; Geofences</span>
                <ArrowRight size={13} strokeWidth={2} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
