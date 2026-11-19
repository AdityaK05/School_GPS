import React, { useState, useEffect } from 'react';
import { useRouter } from '../router/Router';
import { useTheme } from '../theme/ThemeContext';
import { radii, shadows } from '../theme/design-system';
import { SafetyPulse, StatusBadge } from '../components/ui/SharedComponents';
import { InteractiveMap, MapMarker } from '../components/InteractiveMap';
import { ApiClient } from '@school-transport-platform/client-sdk';
import { Bus, GPSLocation } from '@school-transport-platform/shared-types';
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
    totalStudents: 0,
    accountedStudents: 0,
    activeBuses: 0,
    totalBuses: 0,
    criticalIssues: 0,
    studentsOnboard: 0,
  });

  const [recentEvents, setRecentEvents] = useState<Array<{
    id: string;
    type: string;
    time: string;
    text: string;
    detail: string;
  }>>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const [overview, buses] = await Promise.all([
          apiClient.getDashboardOverview(),
          apiClient.listBuses(),
        ]);
        const busesWithLocation = buses as Array<Bus & { latestLocation?: GPSLocation | null }>;
        setMapMarkers(
          busesWithLocation.flatMap((bus) => {
            const location = bus.latestLocation;
            if (!location || location.schoolId !== bus.schoolId) return [];
            const ageSeconds = (Date.now() - new Date(location.recordedAt).getTime()) / 1000;
            return [{
              id: bus.id,
              label: bus.fleetNumber || bus.registrationNumber || 'Bus',
              latitude: location.latitude,
              longitude: location.longitude,
              type: 'bus' as const,
              status: Number.isFinite(ageSeconds) && ageSeconds <= 60 ? 'GPS update is fresh' : 'GPS update is stale',
            }];
          })
        );
        setMetrics({
          totalStudents: overview.manifestStudents ?? 0,
          accountedStudents: overview.accountedStudents ?? 0,
          activeBuses: overview.activeBuses ?? 0,
          totalBuses: buses.length,
          criticalIssues: overview.openExceptions ?? 0,
          studentsOnboard: overview.studentsOnboard ?? 0,
        });
        setRecentEvents(overview.recentIncidents.map((exception) => ({
          id: exception.id,
          type: exception.severity === 'CRITICAL' ? 'attention' : 'transit',
          time: new Date(exception.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: exception.type.replaceAll('_', ' '),
          detail: exception.description || 'Review the recorded evidence for this exception.',
        })));
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Dashboard data could not be loaded.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [apiClient]);

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
            Transport Management
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
            Transport Safety Overview
          </h1>
          <p style={{ fontSize: '13px', color: colors.textSecondary, margin: 0 }}>
            Know where every student is during their journey.
          </p>
        </div>

        {/* Live Status Pill & Quick Corridor Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <StatusBadge type="neutral" label="Operational overview" />
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

        {loadError && (
          <div role="alert" style={{ padding: 14, borderRadius: radii.md, border: `1px solid ${colors.dangerBorder}`, background: colors.dangerLight, color: colors.danger }}>
            Dashboard data is unavailable: {loadError}
          </div>
        )}
      </div>

      {/* 2. Primary Hero: Student Accountability Pulse (Sections 18, 19, 20) */}
      <SafetyPulse
        accountedStudents={metrics.accountedStudents}
        totalStudents={metrics.totalStudents}
        activeBuses={metrics.activeBuses}
        totalBuses={metrics.totalBuses}
        criticalIssues={metrics.criticalIssues}
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
              Recent safety exceptions
            </div>
          </div>
          <button
            onClick={() => navigate('/exceptions')}
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
            <span>View exceptions</span>
            <ArrowRight size={13} strokeWidth={2} />
          </button>
        </div>

        {/* Human-Readable Event Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {isLoading && <p role="status" style={{ color: colors.textSecondary }}>Loading operational data…</p>}
          {!isLoading && !loadError && recentEvents.length === 0 && (
            <p style={{ color: colors.textSecondary, fontSize: 12 }}>
              No safety exceptions were returned for this school.
            </p>
          )}
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
