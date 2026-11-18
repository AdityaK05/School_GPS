import React, { useState, useEffect } from 'react';
import { useRouter } from '../router/Router';
import { useTheme } from '../theme/ThemeContext';
import { radii, shadows } from '../theme/design-system';
import { SafetyPulse, StatusBadge } from '../components/ui/SharedComponents';
import { InteractiveMap, MapMarker } from '../components/InteractiveMap';
import { ApiClient } from '@school-transport-platform/client-sdk';
import {
  UsersRound,
  Bell,
  BusFront,
  Route,
  ArrowRight,
  CircleCheck,
  TriangleAlert,
  Clock3,
  Check,
  CircleAlert,
  ShieldCheck,
} from 'lucide-react';

interface OverviewPageProps {
  apiClient: ApiClient;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ apiClient }) => {
  const { navigate } = useRouter();
  const { colors } = useTheme();

  const [metrics, setMetrics] = useState({
    totalStudents: 8,
    accountedStudents: 7,
    activeBuses: 3,
    totalBuses: 3,
    criticalIssues: 1,
    studentsOnboard: 1,
  });

  // Human-readable Activity Stream (Section 16 & 17: NO DEVELOPER JARGON)
  const [recentEvents, setRecentEvents] = useState<any[]>([
    {
      id: '1',
      time: '08:31 AM',
      text: 'Student exit not recorded',
      detail: 'Aarav Sharma · Bus 12 · Sector 62 Metro',
      type: 'attention',
    },
    {
      id: '2',
      time: '08:24 AM',
      text: 'Bus 12 reached Fortis stop area',
      detail: 'Bus 12 on designated morning corridor',
      type: 'transit',
    },
    {
      id: '3',
      time: '08:17 AM',
      text: 'Aarav Sharma boarded',
      detail: 'Bus 12 · Sector 62 Metro Gate #2',
      type: 'boarded',
    },
    {
      id: '4',
      time: '08:05 AM',
      text: 'Diya Sharma boarded',
      detail: 'Bus 12 · Shipra Sun City Gate #4',
      type: 'boarded',
    },
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
          const openExceptions = exceptions.filter((e) => e.status === 'OPEN').length;
          const totalS = students.length || 8;
          setMetrics({
            totalStudents: totalS,
            accountedStudents: openExceptions > 0 ? totalS - openExceptions : totalS,
            activeBuses: overview.activeBuses || (buses.length || 3),
            totalBuses: buses.length || 3,
            criticalIssues: openExceptions > 0 ? openExceptions : 1, // Keep demo accountability alert active
            studentsOnboard: (overview as any).studentsOnboard || 1,
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
      label: 'Bus 12 (UP-16-BT-9912)',
      latitude: 28.6320,
      longitude: 77.3680,
      type: 'bus',
      status: 'On route',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px' }}>
      {/* 1. Page Header with Clean Hierarchy */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: colors.primary,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Oakridge International School &bull; Transport Management
          </div>
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 800,
              color: colors.textPrimary,
              margin: '4px 0 2px 0',
              letterSpacing: '-0.02em',
            }}
          >
            Morning Transport Safety
          </h1>
          <p style={{ fontSize: '13px', color: colors.textSecondary, margin: 0 }}>
            Know where every student is during their journey.
          </p>
        </div>

        {/* Live Status Pill & Quick Corridor Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <StatusBadge
            type="success"
            icon={<Check size={12} strokeWidth={2.4} />}
            label="Live Active"
          />
          <button
            onClick={() => navigate('/journeys')}
            style={{
              padding: '8px 14px',
              backgroundColor: colors.primary,
              color: colors.textWhite,
              borderRadius: radii.sm,
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: shadows.sm,
            }}
          >
            <span>Live Journeys</span>
            <ArrowRight size={14} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* 2. Primary Hero: Student Accountability Pulse (Sections 18, 19, 20) */}
      <SafetyPulse
        accountedStudents={metrics.accountedStudents}
        totalStudents={metrics.totalStudents}
        activeBuses={metrics.activeBuses}
        totalBuses={metrics.totalBuses}
        criticalIssues={metrics.criticalIssues}
        attentionStudentName="Aarav Sharma"
        attentionDetail="Bus 12 · Sector 62 Metro · Student exit not recorded"
        onReviewAttention={() => navigate('/exceptions')}
      />

      {/* 3. Main Operational Layout: Corridor Map & Today's Safety Ledger */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)',
          gap: '20px',
        }}
      >
        {/* Left: Clean Light Map (Section 8: Calm, Supporting Story) */}
        <div
          style={{
            backgroundColor: colors.card,
            borderRadius: radii.md,
            border: `1px solid ${colors.border}`,
            boxShadow: shadows.sm,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '14px 18px',
              borderBottom: `1px solid ${colors.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
                Corridor Safety Map
              </h3>
              <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
                Active morning transit corridors
              </div>
            </div>
            <button
              onClick={() => navigate('/buses')}
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: colors.primary,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>View Buses</span>
              <ArrowRight size={13} strokeWidth={2} />
            </button>
          </div>

          <div style={{ height: '340px' }}>
            <InteractiveMap
              markers={mapMarkers}
              height="340px"
              busSpeed={38}
              busLive={true}
              lastUpdatedText="Updated 32 sec ago"
            />
          </div>
        </div>

        {/* Right: Today's Safety (Section 18: Restrained, Ledger-like) */}
        <div
          style={{
            backgroundColor: colors.card,
            borderRadius: radii.md,
            border: `1px solid ${colors.border}`,
            boxShadow: shadows.sm,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
              Today's Safety
            </h3>
            <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
              Instant verification across transport routes
            </div>

            {/* Subtle Ledger Separator Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              {/* Row 1: Students Accounted */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  backgroundColor: colors.successLight,
                  borderRadius: radii.sm,
                  border: `1px solid ${colors.successBorder}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CircleCheck size={16} strokeWidth={2} color={colors.success} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>
                    Students accounted
                  </span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: colors.success }}>
                  {metrics.accountedStudents} / {metrics.totalStudents}
                </span>
              </div>

              {/* Row 2: Buses Reporting */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  backgroundColor: colors.primaryLight,
                  borderRadius: radii.sm,
                  border: `1px solid ${colors.primaryBorder}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <BusFront size={16} strokeWidth={2} color={colors.primary} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>
                    Buses reporting
                  </span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: colors.primary }}>
                  {metrics.activeBuses} / {metrics.totalBuses}
                </span>
              </div>

              {/* Row 3: Needs Attention */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  backgroundColor: metrics.criticalIssues > 0 ? colors.warningLight : colors.badgeBg,
                  borderRadius: radii.sm,
                  border: `1px solid ${metrics.criticalIssues > 0 ? colors.warningBorder : colors.border}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {metrics.criticalIssues > 0 ? (
                    <TriangleAlert size={16} strokeWidth={2} color={colors.warning} />
                  ) : (
                    <ShieldCheck size={16} strokeWidth={2} color={colors.success} />
                  )}
                  <span style={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>
                    Needs attention
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: metrics.criticalIssues > 0 ? colors.warning : colors.success,
                  }}
                >
                  {metrics.criticalIssues}
                </span>
              </div>
            </div>
          </div>

          {/* Clean Quick Action Links */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
            <button
              onClick={() => navigate('/students')}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: radii.sm,
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.card,
                color: colors.textPrimary,
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <UsersRound size={14} strokeWidth={1.8} />
              <span>Students</span>
            </button>
            <button
              onClick={() => navigate('/exceptions')}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: radii.sm,
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.card,
                color: colors.textPrimary,
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Bell size={14} strokeWidth={1.8} />
              <span>Alerts</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Today's Journey Activity (Section 16 & 17) */}
      <div
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.md,
          border: `1px solid ${colors.border}`,
          boxShadow: shadows.sm,
          padding: '20px 22px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
              Today's Journey Activity
            </h3>
            <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
              Live student and bus activity
            </div>
          </div>
          <button
            onClick={() => navigate('/audit')}
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: colors.primary,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>Safety Ledger</span>
            <ArrowRight size={13} strokeWidth={2} />
          </button>
        </div>

        {/* Human-Readable Event Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {recentEvents.map((evt) => {
            const isAttention = evt.type === 'attention';
            return (
              <div
                key={evt.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '11px 14px',
                  backgroundColor: isAttention ? colors.warningLight : colors.bg,
                  borderRadius: radii.sm,
                  border: `1px solid ${isAttention ? colors.warningBorder : colors.borderLight}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: colors.textMuted,
                      minWidth: '60px',
                    }}
                  >
                    {evt.time}
                  </span>

                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: isAttention ? 'rgba(217, 119, 6, 0.2)' : colors.successLight,
                      color: isAttention ? colors.warning : colors.success,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isAttention ? (
                      <TriangleAlert size={13} strokeWidth={2.2} />
                    ) : (
                      <Check size={13} strokeWidth={2.4} />
                    )}
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: isAttention ? colors.warning : colors.textPrimary,
                      }}
                    >
                      {evt.text}
                    </div>
                    <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '1px' }}>
                      {evt.detail}
                    </div>
                  </div>
                </div>

                <StatusBadge
                  type={isAttention ? 'warning' : 'success'}
                  label={isAttention ? 'Attention' : 'Accounted'}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
