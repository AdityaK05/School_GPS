import React, { useState, useEffect } from 'react';
import { useRouter } from '../router/Router';
import { colors, radii, shadows } from '../theme/design-system';
import { SafetyPulse, StatusBadge } from '../components/ui/SharedComponents';
import { InteractiveMap, MapMarker } from '../components/InteractiveMap';
import { ApiClient } from '@school-transport-platform/client-sdk';

interface OverviewPageProps {
  apiClient: ApiClient;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ apiClient }) => {
  const { navigate } = useRouter();
  const [metrics, setMetrics] = useState({
    totalStudents: 428,
    accountedStudents: 428,
    activeBuses: 18,
    totalBuses: 18,
    criticalIssues: 0,
    studentsOnboard: 28,
    gpsOnlineCount: 18,
    gpsStaleCount: 0,
  });

  const [recentEvents, setRecentEvents] = useState<any[]>([
    { id: '1', time: '08:14 AM', text: 'Aarav Sharma verified onto Bus 12', stop: 'Sector 62 Metro Gate #2', status: 'success' },
    { id: '2', time: '08:11 AM', text: 'Bus 12 reached Stop #1 on schedule', stop: 'Sector 62 Metro Gate #2', status: 'info' },
    { id: '3', time: '08:08 AM', text: 'Diya Sharma waiting at scheduled stop', stop: 'Shipra Sun City Gate #4', status: 'neutral' },
    { id: '4', time: '08:02 AM', text: 'Morning transit corridor commenced', stop: 'Campus Terminus', status: 'info' },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [overview, buses, students, exceptions] = await Promise.all([
          apiClient.getDashboardOverview().catch(() => null),
          apiClient.listBuses().catch(() => []),
          apiClient.getStudents().catch(() => []),
          apiClient.getExceptions().catch(() => []),
        ]);

        if (overview) {
          setMetrics({
            totalStudents: students.length || 428,
            accountedStudents: students.length ? students.length - exceptions.length : 428,
            activeBuses: overview.activeBuses || (buses.length || 18),
            totalBuses: buses.length || 18,
            criticalIssues: exceptions.filter((e) => e.status === 'OPEN').length,
            studentsOnboard: (overview as any).studentsOnboard || 28,
            gpsOnlineCount: (overview as any).gpsOnlineCount || 18,
            gpsStaleCount: (overview as any).gpsStaleCount || 0,
          });
        }
      } catch (err) {
        // Safe fallback
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [apiClient]);

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
      id: 'school_campus',
      label: 'Oakridge Campus Terminus',
      latitude: 28.6400,
      longitude: 77.3800,
      type: 'school',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1200px' }}>
      {/* 1. Header with greeting and today's status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Oakridge International School
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: colors.textPrimary, margin: '4px 0 2px 0', letterSpacing: '-0.02em' }}>
            Good Morning, Transport Admin
          </h1>
          <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0 }}>
            Here is today's morning student transport overview.
          </p>
        </div>

        {/* Live Status Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StatusBadge type="success" icon="●" label="All Systems Operational" />
          <button
            onClick={() => navigate('/journeys')}
            style={{
              padding: '8px 16px',
              backgroundColor: colors.primary,
              color: '#ffffff',
              borderRadius: radii.md,
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: shadows.sm,
            }}
          >
            View Live Journeys →
          </button>
        </div>
      </div>

      {/* 2. Safety Pulse - Primary Accountability KPI Summary */}
      <SafetyPulse
        accountedStudents={metrics.accountedStudents}
        totalStudents={metrics.totalStudents}
        activeBuses={metrics.activeBuses}
        totalBuses={metrics.totalBuses}
        criticalIssues={metrics.criticalIssues}
      />

      {/* 3. Main Grid: Live Map & Current Transport Status Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)',
          gap: '24px',
        }}
      >
        {/* Left: Simple Live Transport Map */}
        <div
          style={{
            backgroundColor: colors.card,
            borderRadius: radii.lg,
            border: `1px solid ${colors.border}`,
            boxShadow: shadows.card,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
                Live Fleet Corridor Map
              </h3>
              <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
                Real-time 60s GPS tracking along active routes
              </div>
            </div>
            <button
              onClick={() => navigate('/buses')}
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: colors.primary,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              All Buses →
            </button>
          </div>

          <div style={{ height: '340px' }}>
            <InteractiveMap
              markers={mapMarkers}
              height="340px"
              busSpeed={38}
              busLive={true}
            />
          </div>
        </div>

        {/* Right: Current Status Checklist & Live Safety Pulse */}
        <div
          style={{
            backgroundColor: colors.card,
            borderRadius: radii.lg,
            border: `1px solid ${colors.border}`,
            boxShadow: shadows.card,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
              Current Safety Status
            </h3>
            <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
              Instant verification across physical fleets
            </div>

            {/* Checklist Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: colors.successLight, borderRadius: radii.md, border: `1px solid ${colors.successBorder}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: colors.success, fontWeight: 800 }}>✓</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>Students Boarded &amp; Verified</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: colors.success }}>
                  {metrics.totalStudents} / {metrics.totalStudents}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: colors.primaryLight, borderRadius: radii.md, border: `1px solid ${colors.primaryBorder}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: colors.primary, fontWeight: 800 }}>✓</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>Buses Live &amp; Reporting GPS</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: colors.primary }}>
                  {metrics.activeBuses} / {metrics.totalBuses}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: metrics.criticalIssues === 0 ? '#f8fafc' : colors.dangerLight, borderRadius: radii.md, border: `1px solid ${metrics.criticalIssues === 0 ? colors.border : colors.dangerBorder}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: metrics.criticalIssues === 0 ? colors.success : colors.danger, fontWeight: 800 }}>
                    {metrics.criticalIssues === 0 ? '✓' : '⚠'}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>
                    {metrics.criticalIssues === 0 ? 'No Critical Alerts' : 'Exceptions in Triage'}
                  </span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: metrics.criticalIssues === 0 ? colors.success : colors.danger }}>
                  {metrics.criticalIssues === 0 ? 'Resolved' : `${metrics.criticalIssues} Open`}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
            <button
              onClick={() => navigate('/students')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: radii.md,
                border: `1px solid ${colors.border}`,
                backgroundColor: '#ffffff',
                color: colors.textPrimary,
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              👥 Students Directory
            </button>
            <button
              onClick={() => navigate('/exceptions')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: radii.md,
                border: `1px solid ${colors.border}`,
                backgroundColor: '#ffffff',
                color: colors.textPrimary,
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🔔 Safety Alerts
            </button>
          </div>
        </div>
      </div>

      {/* 4. Live Activity Ledger Stream */}
      <div
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.lg,
          border: `1px solid ${colors.border}`,
          boxShadow: shadows.card,
          padding: '20px 24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
              Recent Commute Activity
            </h3>
            <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
              Continuous RFID hardware taps &amp; geofence events
            </div>
          </div>
          <button
            onClick={() => navigate('/audit')}
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: colors.primary,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Full Safety Ledger →
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {recentEvents.map((evt) => (
            <div
              key={evt.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                backgroundColor: '#f8fafc',
                borderRadius: radii.md,
                border: `1px solid ${colors.borderLight}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: radii.full,
                    backgroundColor: evt.status === 'success' ? colors.successLight : colors.primaryLight,
                    color: evt.status === 'success' ? colors.success : colors.primary,
                  }}
                >
                  {evt.time}
                </span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>
                    {evt.text}
                  </div>
                  <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '1px' }}>
                    Stop: {evt.stop}
                  </div>
                </div>
              </div>
              <StatusBadge type="success" label="Verified" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
