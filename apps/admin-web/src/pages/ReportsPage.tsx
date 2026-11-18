import React from 'react';
import { colors, radii, shadows } from '../theme/design-system';
import { ApiClient } from '@school-transport-platform/client-sdk';

interface ReportsPageProps {
  apiClient: ApiClient;
}

export const ReportsPage: React.FC<ReportsPageProps> = () => {
  const reports = [
    {
      title: 'Daily Boarding & Exit Audit Report',
      description: 'Complete passenger manifest of morning boardings, exit confirmations, and attendance counts across all routes.',
      icon: '📋',
      lastGenerated: 'Today, 08:30 AM',
    },
    {
      title: 'Student Journey History Report',
      description: 'Individual child commute timeline archives including timestamps, designated stops, and attendant logs.',
      icon: '👦',
      lastGenerated: 'Yesterday, 04:00 PM',
    },
    {
      title: 'Safety Exceptions & Incidents Log',
      description: 'Comprehensive log of all open and resolved exceptions, missing exit warnings, and wrong-bus attempts.',
      icon: '⚠️',
      lastGenerated: 'Today, 08:00 AM',
    },
    {
      title: 'Fleet Punctuality & Route Performance',
      description: 'Average dwell times, corridor transit durations, and stop arrival variance for operational review.',
      icon: '🚌',
      lastGenerated: '14 Nov 2026',
    },
    {
      title: 'Hardware Telematics & RFID Health Report',
      description: 'Device uptime, battery status, cellular signal strength, and 60-second telemetry compliance.',
      icon: '📡',
      lastGenerated: 'Today, 07:00 AM',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px' }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Compliance &amp; Operational Records
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: colors.textPrimary, margin: '4px 0 2px 0', letterSpacing: '-0.02em' }}>
          Transport Reports
        </h1>
        <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0 }}>
          Clean, human-readable summary documents for school principals, transport boards, and parents.
        </p>
      </div>

      {/* Reports Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {reports.map((r, i) => (
          <div
            key={i}
            style={{
              backgroundColor: colors.card,
              borderRadius: radii.lg,
              border: `1px solid ${colors.border}`,
              padding: '22px 24px',
              boxShadow: shadows.card,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', maxWidth: '650px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: radii.md,
                  backgroundColor: colors.primaryLight,
                  border: `1px solid ${colors.primaryBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  flexShrink: 0,
                }}
              >
                {r.icon}
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
                  {r.title}
                </h3>
                <p style={{ fontSize: '13px', color: colors.textSecondary, margin: '4px 0 0 0', lineHeight: 1.4 }}>
                  {r.description}
                </p>
                <div style={{ fontSize: '11px', color: colors.textMuted, marginTop: '6px' }}>
                  Last Generated: {r.lastGenerated}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => alert(`Generating ${r.title}... Download started.`)}
                style={{
                  padding: '9px 18px',
                  backgroundColor: colors.primary,
                  color: '#ffffff',
                  borderRadius: radii.md,
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: shadows.sm,
                }}
              >
                Export CSV / PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
