import React, { useState, useEffect } from 'react';
import { useRouter } from '../router/Router';
import { useTheme } from '../theme/ThemeContext';
import { radii, shadows } from '../theme/design-system';
import { StatusBadge } from '../components/ui/SharedComponents';
import { ApiClient } from '@school-transport-platform/client-sdk';
import { JourneyException } from '@school-transport-platform/shared-types';
import { TriangleAlert, CircleCheck, AlertCircle, Clock, BusFront, MapPin, ArrowRight } from 'lucide-react';

interface ExceptionsPageProps {
  apiClient: ApiClient;
}

export const ExceptionsPage: React.FC<ExceptionsPageProps> = ({ apiClient }) => {
  const { navigate } = useRouter();
  const { colors, isDark } = useTheme();
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('OPEN');

  const [exceptions, setExceptions] = useState<JourneyException[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiClient.getExceptions()
      .then((apiExceptions) => {
        if (active) {
          setExceptions(apiExceptions);
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : 'Exception records could not be loaded.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [apiClient]);

  const filtered = exceptions.filter((e) =>
    filter === 'ALL' || (filter === 'OPEN' ? e.status !== 'RESOLVED' && e.status !== 'DISMISSED' : e.status === 'RESOLVED' || e.status === 'DISMISSED')
  );
  const openCount = exceptions.filter((exception) => exception.status !== 'RESOLVED' && exception.status !== 'DISMISSED').length;
  const resolvedCount = exceptions.length - openCount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px' }}>
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: colors.danger, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TriangleAlert size={15} strokeWidth={2} />
            Safety First Triage
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: colors.textPrimary, margin: '4px 0 2px 0', letterSpacing: '-0.02em' }}>
            Safety Exceptions &amp; Alerts
          </h1>
          <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0 }}>
            Proactive alerts requiring administrative review or safety verification.
          </p>
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'OPEN', label: `Action Required (${openCount})` },
            { id: 'RESOLVED', label: `Resolved (${resolvedCount})` },
            { id: 'ALL', label: 'All Alerts' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              style={{
                padding: '7px 14px',
                borderRadius: radii.md,
                border: filter === tab.id ? `1px solid ${colors.danger}` : `1px solid ${colors.border}`,
                backgroundColor: filter === tab.id ? colors.dangerLight : colors.card,
                color: filter === tab.id ? colors.danger : colors.textSecondary,
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Exceptions List */}
      {loadError && (
        <div role="alert" style={{ padding: 14, borderRadius: radii.md, border: `1px solid ${colors.dangerBorder}`, background: colors.dangerLight, color: colors.danger }}>
          Exception records could not be loaded: {loadError}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {isLoading && <p role="status" style={{ color: colors.textSecondary }}>Loading safety exceptions…</p>}
        {filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate(`/exceptions/${item.id}`)}
            style={{
              backgroundColor: colors.card,
              borderRadius: radii.lg,
              border: `1px solid ${item.status === 'OPEN' ? colors.dangerBorder : colors.border}`,
              padding: '24px',
              boxShadow: shadows.card,
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.danger;
              e.currentTarget.style.boxShadow = shadows.md;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = item.status === 'OPEN' ? colors.dangerBorder : colors.border;
              e.currentTarget.style.boxShadow = shadows.card;
            }}
          >
            {/* Top row: Title & Severity */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: radii.md,
                    backgroundColor: item.status === 'OPEN' ? colors.dangerLight : colors.successLight,
                    border: `1px solid ${item.status === 'OPEN' ? colors.dangerBorder : colors.successBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {item.status === 'OPEN' ? (
                    <TriangleAlert size={18} strokeWidth={2} color={colors.danger} />
                  ) : (
                    <CircleCheck size={18} strokeWidth={2} color={colors.success} />
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: item.status === 'OPEN' ? colors.danger : colors.textPrimary, margin: 0 }}>
                    {item.type.replaceAll('_', ' ')}
                  </h3>
                  <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span>Target: <strong>{item.studentId ? `Student ${item.studentId}` : 'Trip/bus event'}</strong></span>
                    <span>&bull;</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <BusFront size={12} strokeWidth={2} />
                      {item.busId ? `Bus ${item.busId}` : 'Bus not recorded'}
                    </span>
                    <span>&bull;</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <MapPin size={12} strokeWidth={2} />
                      {item.tripId ? `Trip ${item.tripId}` : 'Stop not recorded'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: colors.textMuted, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} strokeWidth={2} />
                  {new Date(item.createdAt).toLocaleString()}
                </span>
                <StatusBadge
                  type={item.status === 'OPEN' ? 'danger' : 'success'}
                  label={item.status === 'OPEN' ? 'Action Required' : 'Resolved'}
                />
              </div>
            </div>

            {/* Description & Action */}
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: colors.canvasBg,
                borderRadius: radii.md,
                border: `1px solid ${colors.borderLight}`,
                fontSize: '13px',
                color: colors.textPrimary,
                lineHeight: 1.5,
              }}
            >
              <div>{item.description || `Recorded exception type: ${item.type}`}</div>
              <div style={{ fontSize: '12px', color: item.status === 'OPEN' ? colors.danger : colors.success, fontWeight: 700, marginTop: '4px' }}>
                {item.status === 'RESOLVED' || item.status === 'DISMISSED'
                  ? item.resolutionReason || 'Resolution recorded.'
                  : 'Review the source event and resolve only after verifying the evidence.'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: colors.primary }}>
              <span>View Safety Dossier &amp; Resolve</span>
              <ArrowRight size={13} strokeWidth={2} />
            </div>
          </div>
        ))}
        {!isLoading && !loadError && filtered.length === 0 && (
          <p style={{ padding: 24, textAlign: 'center', color: colors.textSecondary }}>
            No exceptions in this category.
          </p>
        )}
      </div>
    </div>
  );
};
