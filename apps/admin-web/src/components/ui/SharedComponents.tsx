import React from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { radii, shadows } from '../../theme/design-system';
import {
  CircleCheck,
  BusFront,
  TriangleAlert,
  CircleAlert,
  Check,
  UsersRound,
  ArrowRight,
  ShieldCheck,
  Clock3,
} from 'lucide-react';

// 1. HERO STUDENT ACCOUNTABILITY & TOP METRIC CARDS
export const SafetyPulse: React.FC<{
  accountedStudents: number;
  totalStudents: number;
  activeBuses: number;
  totalBuses: number;
  criticalIssues: number;
  attentionStudentName?: string;
  attentionDetail?: string;
  onReviewAttention?: () => void;
}> = ({
  accountedStudents,
  totalStudents,
  activeBuses,
  totalBuses,
  criticalIssues,
  attentionStudentName = 'Aarav Sharma',
  attentionDetail = 'Bus 12 · Sector 62 · Exit not recorded',
  onReviewAttention,
}) => {
  const { colors } = useTheme();
  const percentage = totalStudents > 0 ? Math.round((accountedStudents / totalStudents) * 100) : 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* 3 Metric Cards with Student Accountability as Hero */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          width: '100%',
        }}
      >
        {/* HERO CARD: STUDENTS ACCOUNTED */}
        <div
          style={{
            backgroundColor: colors.card,
            borderRadius: radii.lg,
            padding: '20px 22px',
            border: `1px solid ${colors.border}`,
            boxShadow: shadows.sm,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle brand indicator line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              backgroundColor: colors.success,
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Students
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: radii.sm,
                backgroundColor: colors.successLight,
                color: colors.success,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CircleCheck size={18} strokeWidth={2} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span
                style={{
                  fontSize: '32px',
                  fontWeight: 800,
                  color: colors.textPrimary,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                }}
              >
                {accountedStudents}
              </span>
              <span style={{ fontSize: '18px', fontWeight: 600, color: colors.textMuted }}>
                / {totalStudents}
              </span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary, marginTop: '4px' }}>
              Students accounted
            </div>
          </div>

          {/* Subtle Progress Bar */}
          <div>
            <div
              style={{
                width: '100%',
                height: '5px',
                borderRadius: radii.full,
                backgroundColor: colors.borderLight,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${percentage}%`,
                  height: '100%',
                  backgroundColor: criticalIssues > 0 ? colors.warning : colors.success,
                  borderRadius: radii.full,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            <div style={{ fontSize: '11px', color: criticalIssues > 0 ? colors.warning : colors.success, marginTop: '6px', fontWeight: 600 }}>
              {criticalIssues > 0 ? `${criticalIssues} student needs attention` : 'All scheduled students accounted'}
            </div>
          </div>
        </div>

        {/* BUSES REPORTING */}
        <div
          style={{
            backgroundColor: colors.card,
            borderRadius: radii.lg,
            padding: '20px 22px',
            border: `1px solid ${colors.border}`,
            boxShadow: shadows.sm,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Buses
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: radii.sm,
                backgroundColor: colors.primaryLight,
                color: colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BusFront size={18} strokeWidth={2} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span
                style={{
                  fontSize: '32px',
                  fontWeight: 800,
                  color: colors.textPrimary,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                }}
              >
                {activeBuses}
              </span>
              <span style={{ fontSize: '18px', fontWeight: 600, color: colors.textMuted }}>
                / {totalBuses}
              </span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary, marginTop: '4px' }}>
              Reporting
            </div>
          </div>

          <div style={{ fontSize: '11px', color: colors.textMuted, fontWeight: 500 }}>
            All active on transit corridors
          </div>
        </div>

        {/* ATTENTION REQUIRED */}
        <div
          style={{
            backgroundColor: criticalIssues > 0 ? colors.warningLight : colors.card,
            borderRadius: radii.lg,
            padding: '20px 22px',
            border: `1px solid ${criticalIssues > 0 ? colors.warningBorder : colors.border}`,
            boxShadow: shadows.sm,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: criticalIssues > 0 ? colors.warning : colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Attention
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: radii.sm,
                backgroundColor: criticalIssues > 0 ? 'rgba(217, 119, 6, 0.16)' : colors.badgeBg,
                color: criticalIssues > 0 ? colors.warning : colors.textMuted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {criticalIssues > 0 ? (
                <TriangleAlert size={18} strokeWidth={2} />
              ) : (
                <ShieldCheck size={18} strokeWidth={2} />
              )}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span
                style={{
                  fontSize: '32px',
                  fontWeight: 800,
                  color: criticalIssues > 0 ? colors.warning : colors.textPrimary,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                }}
              >
                {criticalIssues}
              </span>
            </div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: criticalIssues > 0 ? colors.warning : colors.textSecondary,
                marginTop: '4px',
              }}
            >
              {criticalIssues === 0 ? 'All clear' : 'Needs review'}
            </div>
          </div>

          <div style={{ fontSize: '11px', color: criticalIssues > 0 ? colors.warning : colors.textMuted, fontWeight: 500 }}>
            {criticalIssues > 0 ? 'Exit not recorded' : 'No open safety alerts'}
          </div>
        </div>
      </div>

      {/* 2. PROMINENT "ATTENTION REQUIRED" CALLOUT CARD */}
      {criticalIssues > 0 && (
        <div
          style={{
            backgroundColor: colors.warningLight,
            border: `1px solid ${colors.warningBorder}`,
            borderRadius: radii.md,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: colors.warning,
                color: colors.textWhite,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <TriangleAlert size={16} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>
                {criticalIssues} student needs attention &bull; <strong style={{ color: colors.warning }}>{attentionStudentName}</strong>
              </div>
              <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
                {attentionDetail}
              </div>
            </div>
          </div>

          {onReviewAttention && (
            <button
              onClick={onReviewAttention}
              style={{
                padding: '6px 14px',
                borderRadius: radii.sm,
                backgroundColor: colors.warning,
                color: colors.textWhite,
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'opacity 0.2s',
              }}
            >
              <span>Review</span>
              <ArrowRight size={14} strokeWidth={2} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// 2. STATUS BADGE
export const StatusBadge: React.FC<{
  type: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  icon?: React.ReactNode;
  label: string;
}> = ({ type, icon, label }) => {
  const { colors } = useTheme();

  const configs = {
    success: { bg: colors.successLight, text: colors.success, border: colors.successBorder },
    warning: { bg: colors.warningLight, text: colors.warning, border: colors.warningBorder },
    danger: { bg: colors.dangerLight, text: colors.danger, border: colors.dangerBorder },
    info: { bg: colors.primaryLight, text: colors.primary, border: colors.primaryBorder },
    neutral: { bg: colors.badgeBg, text: colors.textSecondary, border: colors.border },
  };
  const cfg = configs[type] || configs.neutral;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 9px',
        borderRadius: radii.full,
        backgroundColor: cfg.bg,
        color: cfg.text,
        border: `1px solid ${cfg.border}`,
        fontSize: '11px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      <span>{label}</span>
    </span>
  );
};

// 3. JOURNEY TIMELINE (VERTICAL STEPPER)
export interface TimelineStep {
  label: string;
  sublabel?: string;
  time?: string;
  status: 'completed' | 'current' | 'pending';
}

export const JourneyTimeline: React.FC<{ steps: TimelineStep[] }> = ({ steps }) => {
  const { colors } = useTheme();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', position: 'relative' }}>
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        const isCompleted = step.status === 'completed';
        const isCurrent = step.status === 'current';

        return (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              minHeight: isLast ? 'auto' : '48px',
            }}
          >
            {/* Indicator node & connecting bar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: isCompleted ? colors.success : isCurrent ? colors.primary : colors.card,
                  color: isCompleted || isCurrent ? colors.textWhite : colors.textMuted,
                  border: isCompleted || isCurrent ? 'none' : `2px solid ${colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  boxShadow: isCurrent ? `0 0 0 3px ${colors.primaryLight}` : 'none',
                  zIndex: 2,
                }}
              >
                {isCompleted ? (
                  <Check size={12} strokeWidth={2.4} />
                ) : isCurrent ? (
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: colors.textWhite }} />
                ) : (
                  idx + 1
                )}
              </div>
              {!isLast && (
                <div
                  style={{
                    width: '2px',
                    flex: 1,
                    minHeight: '24px',
                    backgroundColor: isCompleted ? colors.success : colors.borderHover,
                    margin: '2px 0',
                  }}
                />
              )}
            </div>

            {/* Step text */}
            <div style={{ paddingBottom: isLast ? '0' : '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: isCurrent ? 700 : 600,
                    color: isCompleted || isCurrent ? colors.textPrimary : colors.textSecondary,
                  }}
                >
                  {step.label}
                </span>
                {step.time && (
                  <span style={{ fontSize: '11px', color: colors.textMuted, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Clock3 size={11} strokeWidth={1.8} />
                    {step.time}
                  </span>
                )}
              </div>
              {step.sublabel && (
                <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '2px' }}>
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
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}> = ({ icon, title, description, actionText, onAction }) => {
  const { colors } = useTheme();

  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        backgroundColor: colors.card,
        borderRadius: radii.md,
        border: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: colors.primaryLight,
          color: colors.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '12px',
        }}
      >
        {icon || <UsersRound size={22} strokeWidth={1.8} />}
      </div>
      <h3 style={{ fontSize: '15px', fontWeight: 700, color: colors.textPrimary, margin: '0 0 6px 0' }}>
        {title}
      </h3>
      <p style={{ fontSize: '13px', color: colors.textSecondary, margin: '0 0 16px 0', maxWidth: '380px' }}>
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          style={{
            padding: '8px 16px',
            borderRadius: radii.sm,
            backgroundColor: colors.primary,
            color: colors.textWhite,
            border: 'none',
            fontSize: '12px',
            fontWeight: 600,
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
  title?: string;
  message: string;
  onRetry?: () => void;
}> = ({ title = 'Failed to load transit data', message, onRetry }) => {
  const { colors } = useTheme();

  return (
    <div
      style={{
        padding: '32px 20px',
        textAlign: 'center',
        backgroundColor: colors.dangerLight,
        borderRadius: radii.md,
        border: `1px solid ${colors.dangerBorder}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ color: colors.danger, marginBottom: '8px' }}>
        <CircleAlert size={28} strokeWidth={2} />
      </div>
      <h3 style={{ fontSize: '14px', fontWeight: 700, color: colors.danger, margin: '0 0 4px 0' }}>
        {title}
      </h3>
      <p style={{ fontSize: '12px', color: colors.textSecondary, margin: '0 0 14px 0', maxWidth: '380px' }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '6px 14px',
            borderRadius: radii.sm,
            backgroundColor: colors.danger,
            color: colors.textWhite,
            border: 'none',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
};
