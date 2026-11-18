import React, { useState } from 'react';
import { useRouter } from '../router/Router';
import { colors, radii, shadows } from '../theme/design-system';
import { StatusBadge } from '../components/ui/SharedComponents';
import { ApiClient } from '@school-transport-platform/client-sdk';

interface RoutesPageProps {
  apiClient: ApiClient;
}

export const RoutesPage: React.FC<RoutesPageProps> = ({ apiClient }) => {
  const { getParam, navigate } = useRouter();
  const selectedRouteId = getParam('id');

  const [routes] = useState([
    {
      id: 'r_01',
      name: 'North Corridor Express',
      code: 'R-NC-01',
      direction: 'MORNING',
      assignedBuses: ['Bus 12 (UP-16-BT-9912)'],
      studentsCount: 32,
      stops: [
        { seq: 1, name: 'Sector 62 Metro Gate #2', geofence: '50m', students: 8, time: '07:35 AM' },
        { seq: 2, name: 'Shipra Sun City Gate #4', geofence: '50m', students: 10, time: '07:42 AM' },
        { seq: 3, name: 'Fortis Hospital Crossing', geofence: '50m', students: 6, time: '07:48 AM' },
        { seq: 4, name: 'Indirapuram Habitat Centre', geofence: '50m', students: 8, time: '07:52 AM' },
        { seq: 5, name: 'Oakridge Campus Terminus', geofence: '75m', students: 32, time: '08:00 AM' },
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
        { seq: 1, name: 'Vaishali Metro Station Bay 2', geofence: '50m', students: 12, time: '07:30 AM' },
        { seq: 2, name: 'Anand Vihar Flyover Crossing', geofence: '50m', students: 8, time: '07:40 AM' },
        { seq: 3, name: 'Ghazipur Junction', geofence: '50m', students: 8, time: '07:48 AM' },
        { seq: 4, name: 'Oakridge Campus Terminus', geofence: '75m', students: 28, time: '08:02 AM' },
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
        <div style={{ fontSize: '13px', fontWeight: 700, color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button
            onClick={() => navigate('/routes')}
            style={{
              alignSelf: 'flex-start',
              padding: '6px 12px',
              backgroundColor: '#ffffff',
              border: `1px solid ${colors.border}`,
              borderRadius: radii.md,
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ← View All Routes
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `1px solid ${colors.border}`, paddingBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: colors.primary, textTransform: 'uppercase' }}>
                  {activeRoute.code} &bull; {activeRoute.direction}
                </span>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: colors.textPrimary, margin: '4px 0' }}>
                  {activeRoute.name}
                </h2>
                <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                  Assigned Bus: <strong>{activeRoute.assignedBuses.join(', ')}</strong> &bull; Enrolled Students: <strong>{activeRoute.studentsCount}</strong>
                </div>
              </div>
              <StatusBadge type="info" icon="●" label="Active Corridor" />
            </div>

            {/* Vertical Stop Sequence */}
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: colors.textPrimary, textTransform: 'uppercase', marginBottom: '16px' }}>
                Sequential Geofenced Stops
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                        backgroundColor: '#f8fafc',
                        borderRadius: radii.md,
                        border: `1px solid ${colors.borderLight}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: colors.textPrimary }}>
                          {st.name}
                        </div>
                        <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '2px' }}>
                          PostGIS Buffer: {st.geofence} &bull; Scheduled: {st.time}
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: colors.primary }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: colors.primary, textTransform: 'uppercase' }}>
                    {r.code} &bull; {r.direction}
                  </span>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: colors.textPrimary, margin: '2px 0 4px 0' }}>
                    {r.name}
                  </h3>
                  <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                    {r.stops.length} Geofenced Stops &bull; {r.studentsCount} Students Assigned &bull; 🚌 {r.assignedBuses[0]}
                  </div>
                </div>

                <StatusBadge type="info" label="Active Corridor" />
              </div>

              {/* Visual Stop Sequence Ribbon */}
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px 14px',
                  backgroundColor: '#f8fafc',
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
                    {i < r.stops.length - 1 && <span style={{ color: colors.textMuted }}>→</span>}
                  </React.Fragment>
                ))}
              </div>

              <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end', fontSize: '12px', fontWeight: 700, color: colors.primary }}>
                View Stops Sequence &amp; Geofences →
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
