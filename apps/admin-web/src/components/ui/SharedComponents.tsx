import React from 'react';
import { colors, shadows, radii } from '../../theme/design-system';

// 1. SAFETY PULSE
export const SafetyPulse: React.FC<{
  accountedStudents: number;
  totalStudents: number;
  activeBuses: number;
  totalBuses: number;
  criticalIssues: number;
}> = ({
  accountedStudents,
  totalStudents,
  activeBuses,
  totalBuses,
  criticalIssues,
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        width: '100%',
      }}
    >
      {/* Accounted Card */}
      <div
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.lg,
          padding: '20px 24px',
          border: `1px solid ${colors.border}`,
          boxShadow: shadows.card,
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: radii.md,
            backgroundColor: colors.successLight,
            border: `1px solid ${colors.successBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            color: colors.success,
            flexShrink: 0,
          }}
        >
          ✓
        </div>
        <div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: colors.textPrimary, lineHeight: 1.1 }}>
            {accountedStudents} <span style={{ fontSize: '16px', color: colors.textMuted, fontWeight: 600 }}>/ {totalStudents}</span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary, marginTop: '4px' }}>
            Students Accounted
          </div>
        </div>
      </div>

      {/* Active Buses Card */}
      <div
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.lg,
          padding: '20px 24px',
          border: `1px solid ${colors.border}`,
          boxShadow: shadows.card,
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: radii.md,
            backgroundColor: colors.primaryLight,
            border: `1px solid ${colors.primaryBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            color: colors.primary,
            flexShrink: 0,
          }}
        >
          🚌
        </div>
        <div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: colors.textPrimary, lineHeight: 1.1 }}>
            {activeBuses} <span style={{ fontSize: '16px', color: colors.textMuted, fontWeight: 600 }}>/ {totalBuses}</span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary, marginTop: '4px' }}>
            Buses Active Today
          </div>
        </div>
      </div>

      {/* Critical Issues Card */}
      <div
        style={{
          backgroundColor: criticalIssues > 0 ? colors.dangerLight : colors.card,
          borderRadius: radii.lg,
          padding: '20px 24px',
          border: `1px solid ${criticalIssues > 0 ? colors.dangerBorder : colors.border}`,
          boxShadow: shadows.card,
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: radii.md,
            backgroundColor: criticalIssues > 0 ? '#fee2e2' : colors.successLight,
            border: `1px solid ${criticalIssues > 0 ? colors.dangerBorder : colors.successBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            color: criticalIssues > 0 ? colors.danger : colors.success,
            flexShrink: 0,
          }}
        >
          {criticalIssues > 0 ? '⚠' : '🛡️'}
        </div>
        <div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: criticalIssues > 0 ? colors.danger : colors.textPrimary, lineHeight: 1.1 }}>
            {criticalIssues}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: criticalIssues > 0 ? colors.danger : colors.textSecondary, marginTop: '4px' }}>
            {criticalIssues === 0 ? '0 Critical Issues' : 'Attention Required'}
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. STATUS BADGE
export const StatusBadge: React.FC<{
  type: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  icon?: string;
  label: string;
}> = ({ type, icon, label }) => {
  const configs = {
    success: { bg: colors.successLight, text: colors.success, border: colors.successBorder },
    warning: { bg: colors.warningLight, text: colors.warning, border: colors.warningBorder },
    danger: { bg: colors.dangerLight, text: colors.danger, border: colors.dangerBorder },
    info: { bg: colors.primaryLight, text: colors.primary, border: colors.primaryBorder },
    neutral: { bg: '#f1f5f9', text: colors.textSecondary, border: '#cbd5e1' },
  };
  const cfg = configs[type] || configs.neutral;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 10px',
        borderRadius: radii.full,
        backgroundColor: cfg.bg,
        color: cfg.text,
        border: `1px solid ${cfg.border}`,
        fontSize: '12px',
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </span>
  );
};

// 3. JOURNEY TIMELINE
export interface TimelineStep {
  label: string;
  sublabel?: string;
  time?: string;
  status: 'completed' | 'current' | 'pending';
}

export const JourneyTimeline: React.FC<{ steps: TimelineStep[] }> = ({ steps }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', position: 'relative' }}>
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        const isCompleted = step.status === 'completed';
        const isCurrent = step.status === 'current';

        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', minHeight: isLast ? 'auto' : '52px' }}>
            {/* Dot & Connecting line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: isCompleted ? colors.success : isCurrent ? colors.primary : '#e2e8f0',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 800,
                  boxShadow: isCurrent ? `0 0 0 4px ${colors.primaryLight}` : 'none',
                  zIndex: 2,
                }}
              >
                {isCompleted ? '✓' : isCurrent ? '●' : idx + 1}
              </div>
              {!isLast && (
                <div
                  style={{
                    width: '2px',
                    flex: 1,
                    minHeight: '26px',
                    backgroundColor: isCompleted ? colors.success : '#e2e8f0',
                    margin: '3px 0',
                  }}
                />
              )}
            </div>

            {/* Step Content */}
            <div style={{ paddingBottom: isLast ? '0' : '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: isCurrent ? 800 : 700,
                    color: isCompleted ? colors.textPrimary : isCurrent ? colors.primary : colors.textSecondary,
                  }}
                >
                  {step.label}
                </span>
                {step.time && (
                  <span style={{ fontSize: '12px', color: colors.textMuted, fontWeight: 500 }}>
                    {step.time}
                  </span>
                )}
              </div>
              {step.sublabel && (
                <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
                  {step.sublabel}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// 4. EMPTY STATE
export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: string;
}> = ({ title, description, actionText, onAction, icon = '📭' }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        backgroundColor: colors.card,
        borderRadius: radii.lg,
        border: `1px solid ${colors.border}`,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '42px', marginBottom: '14px' }}>{icon}</div>
      <h3 style={{ fontSize: '17px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
        {title}
      </h3>
      <p style={{ fontSize: '13px', color: colors.textSecondary, maxWidth: '400px', marginTop: '6px', lineHeight: 1.5 }}>
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          style={{
            marginTop: '16px',
            padding: '9px 18px',
            backgroundColor: colors.primary,
            color: '#ffffff',
            borderRadius: radii.md,
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

// 5. ERROR STATE
export const ErrorState: React.FC<{
  message?: string;
  onRetry?: () => void;
}> = ({ message = "Something went wrong while loading today's transport information.", onRetry }) => {
  return (
    <div
      style={{
        padding: '36px 24px',
        backgroundColor: colors.dangerLight,
        borderRadius: radii.lg,
        border: `1px solid ${colors.dangerBorder}`,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '32px', marginBottom: '10px' }}>⚠️</div>
      <h4 style={{ fontSize: '16px', fontWeight: 700, color: colors.danger, margin: 0 }}>
        Unable to Load
      </h4>
      <p style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '6px' }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: '14px',
            padding: '8px 16px',
            backgroundColor: colors.danger,
            color: '#ffffff',
            borderRadius: radii.md,
            border: 'none',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
      )}
    </div>
  );
};
