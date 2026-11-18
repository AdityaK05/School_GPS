import React from 'react';
import { useTheme } from '../theme/ThemeContext';
import { radii, shadows } from '../theme/design-system';
import { ApiClient } from '@school-transport-platform/client-sdk';
import {
  ChartNoAxesCombined,
  ClipboardCheck,
  UsersRound,
  TriangleAlert,
  BusFront,
  Radio,
  Download,
} from 'lucide-react';

interface ReportsPageProps {
  apiClient: ApiClient;
}

export const ReportsPage: React.FC<ReportsPageProps> = () => {
  const { colors, isDark } = useTheme();

  const reports = [
    {
      title: 'Daily Boarding & Exit Audit Report',
      description: 'Complete passenger manifest of morning boardings, exit confirmations, and attendance counts across all routes.',
      icon: ClipboardCheck,
      lastGenerated: 'Today, 08:30 AM',
    },
    {
      title: 'Student Journey History Report',
      description: 'Individual child commute timeline archives including timestamps, designated stops, and attendant logs.',
      icon: UsersRound,
      lastGenerated: 'Yesterday, 04:00 PM',
    },
    {
      title: 'Safety Exceptions & Incidents Log',
      description: 'Comprehensive log of all open and resolved exceptions, missing exit warnings, and wrong-bus attempts.',
      icon: TriangleAlert,
      lastGenerated: 'Today, 08:00 AM',
    },
    {
      title: 'Fleet Punctuality & Route Performance',
      description: 'Average dwell times, corridor transit durations, and stop arrival variance for operational review.',
      icon: BusFront,
      lastGenerated: '14 Nov 2026',
    },
    {
      title: 'Hardware Telematics & RFID Health Report',
      description: 'Device uptime, battery status, cellular signal strength, and 60-second telemetry compliance.',
      icon: Radio,
      lastGenerated: 'Today, 07:00 AM',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px' }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ChartNoAxesCombined size={15} strokeWidth={2} />
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
        {reports.map((r, i) => {
          const IconComp = r.icon;
          return (
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
                    flexShrink: 0,
                  }}
                >
                  <IconComp size={22} strokeWidth={2} color={colors.primary} />
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
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 18px',
                    backgroundColor: colors.primary,
                    color: '#ffffff',
                    borderRadius: radii.md,
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: shadows.sm,
                    transition: 'opacity 0.15s ease',
                  }}
                >
                  <Download size={14} strokeWidth={2} />
                  Export CSV / PDF
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
