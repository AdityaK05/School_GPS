import React from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { BusFront, Home, School, Check, CircleAlert, Clock3 } from 'lucide-react';

export interface JourneyStopItem {
  id: string;
  name: string;
  time?: string;
  status: 'passed' | 'current' | 'upcoming' | 'skipped' | 'attention';
  studentsCount?: number;
  isBoardingStop?: boolean;
  isExitStop?: boolean;
}

interface JourneyLineProps {
  originName?: string;
  destinationName?: string;
  stops: JourneyStopItem[];
  busNumber?: string;
  currentStopIndex?: number;
  orientation?: 'vertical' | 'horizontal';
}

export const JourneyLine: React.FC<JourneyLineProps> = ({
  originName = 'Home',
  destinationName = 'School Campus',
  stops,
  busNumber = 'Bus 12',
  orientation = 'vertical',
}) => {
  const { colors } = useTheme();

  if (orientation === 'horizontal') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', overflowX: 'auto', padding: '16px 0' }}>
        {/* Origin */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: colors.successLight,
              border: `2px solid ${colors.success}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.success,
            }}
          >
            <Home size={15} strokeWidth={2} />
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: colors.textPrimary, marginTop: '6px' }}>{originName}</span>
        </div>

        {/* Stops */}
        {stops.map((stop, idx) => {
          const isCurrent = stop.status === 'current';
          const isPassed = stop.status === 'passed';
          const isAttention = stop.status === 'attention';

          return (
            <React.Fragment key={stop.id}>
              {/* Connector line */}
              <div
                style={{
                  flex: 1,
                  height: '3px',
                  backgroundColor: isPassed ? colors.primary : colors.border,
                  minWidth: '40px',
                  position: 'relative',
                }}
              >
                {isCurrent && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-16px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: colors.primary,
                      color: colors.textWhite,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <BusFront size={11} strokeWidth={2.2} />
                    <span>{busNumber}</span>
                  </div>
                )}
              </div>

              {/* Stop node */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '90px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: isPassed
                      ? colors.successLight
                      : isAttention
                      ? colors.dangerLight
                      : isCurrent
                      ? colors.primaryLight
                      : colors.card,
                    border: `2px solid ${
                      isPassed ? colors.success : isAttention ? colors.danger : isCurrent ? colors.primary : colors.border
                    }`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isPassed ? colors.success : isAttention ? colors.danger : isCurrent ? colors.primary : colors.textMuted,
                  }}
                >
                  {isPassed ? (
                    <Check size={14} strokeWidth={2.4} />
                  ) : isAttention ? (
                    <CircleAlert size={14} strokeWidth={2.2} />
                  ) : (
                    <span style={{ fontSize: '11px', fontWeight: 700 }}>{idx + 1}</span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? colors.primary : colors.textPrimary,
                    marginTop: '6px',
                    textAlign: 'center',
                    maxWidth: '85px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={stop.name}
                >
                  {stop.name}
                </span>
                {stop.time && (
                  <span style={{ fontSize: '10px', color: colors.textMuted }}>{stop.time}</span>
                )}
              </div>
            </React.Fragment>
          );
        })}

        {/* Terminus Connector */}
        <div style={{ flex: 1, height: '3px', backgroundColor: colors.border, minWidth: '40px' }} />

        {/* Terminus School */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: colors.card,
              border: `2px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.textMuted,
            }}
          >
            <School size={15} strokeWidth={2} />
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: colors.textPrimary, marginTop: '6px' }}>{destinationName}</span>
        </div>
      </div>
    );
  }

  // Vertical (Standard Signature Layout)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', padding: '6px 0' }}>
      {/* 1. Origin Node */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', position: 'relative' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: colors.successLight,
              border: `2px solid ${colors.success}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.success,
              flexShrink: 0,
            }}
          >
            <Home size={14} strokeWidth={2} />
          </div>
          <div style={{ width: '2px', height: '32px', backgroundColor: colors.borderHover }} />
        </div>
        <div style={{ paddingTop: '4px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>{originName}</div>
          <div style={{ fontSize: '11px', color: colors.textMuted }}>Scheduled start of transit</div>
        </div>
      </div>

      {/* 2. Middle Corridor Stops */}
      {stops.map((stop, index) => {
        const isCurrent = stop.status === 'current';
        const isPassed = stop.status === 'passed';
        const isAttention = stop.status === 'attention';

        return (
          <div key={stop.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {isCurrent ? (
                // Bus Marker on Route
                <div
                  style={{
                    padding: '4px 10px',
                    borderRadius: '16px',
                    backgroundColor: colors.primary,
                    color: colors.textWhite,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                    transform: 'translateX(0)',
                    zIndex: 2,
                  }}
                >
                  <BusFront size={13} strokeWidth={2.2} />
                  <span>{busNumber}</span>
                </div>
              ) : (
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: isPassed
                      ? colors.successLight
                      : isAttention
                      ? colors.dangerLight
                      : colors.card,
                    border: `2px solid ${
                      isPassed ? colors.success : isAttention ? colors.danger : colors.border
                    }`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isPassed ? colors.success : isAttention ? colors.danger : colors.textMuted,
                    flexShrink: 0,
                  }}
                >
                  {isPassed ? (
                    <Check size={12} strokeWidth={2.4} />
                  ) : isAttention ? (
                    <CircleAlert size={12} strokeWidth={2.2} />
                  ) : (
                    <span style={{ fontSize: '10px', fontWeight: 600 }}>{index + 1}</span>
                  )}
                </div>
              )}

              <div
                style={{
                  width: '2px',
                  height: isCurrent ? '34px' : '32px',
                  backgroundColor: isPassed ? colors.primary : colors.borderHover,
                }}
              />
            </div>

            <div style={{ paddingTop: '2px', paddingBottom: '12px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: isCurrent ? 700 : 600,
                    color: isCurrent ? colors.primary : colors.textPrimary,
                  }}
                >
                  {stop.name}
                </span>
                {stop.time && (
                  <span style={{ fontSize: '11px', color: colors.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock3 size={11} strokeWidth={1.8} />
                    {stop.time}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '2px' }}>
                {isCurrent
                  ? 'Bus approaching stop area'
                  : isPassed
                  ? 'Departed stop safely'
                  : isAttention
                  ? 'Exit not recorded at stop'
                  : 'Designated corridor stop'}
              </div>
            </div>
          </div>
        );
      })}

      {/* 3. Destination Node */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: colors.card,
              border: `2px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.textMuted,
              flexShrink: 0,
            }}
          >
            <School size={14} strokeWidth={2} />
          </div>
        </div>
        <div style={{ paddingTop: '4px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>{destinationName}</div>
          <div style={{ fontSize: '11px', color: colors.textMuted }}>Terminus destination</div>
        </div>
      </div>
    </div>
  );
};
