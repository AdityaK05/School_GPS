import React, { useState } from 'react';
import { useRouter } from '../router/Router';
import { useTheme } from '../theme/ThemeContext';
import { radii, shadows } from '../theme/design-system';
import { StatusBadge } from '../components/ui/SharedComponents';
import { ApiClient } from '@school-transport-platform/client-sdk';
import { SunMedium, Sunset, CircleCheck, TriangleAlert, UsersRound, GraduationCap, Check } from 'lucide-react';

interface AttendancePageProps {
  apiClient: ApiClient;
}

export const AttendancePage: React.FC<AttendancePageProps> = ({ apiClient }) => {
  const { navigate } = useRouter();
  const { colors, isDark } = useTheme();
  const [session, setSession] = useState<'MORNING' | 'AFTERNOON'>('MORNING');

  const [classes] = useState([
    { name: 'Class 7-B', total: 32, boarded: 32, exited: 0, status: '100% Accounted' },
    { name: 'Class 5-A', total: 28, boarded: 28, exited: 0, status: '100% Accounted' },
    { name: 'Class 2-B', total: 30, boarded: 30, exited: 0, status: '100% Accounted' },
    { name: 'Class 8-C', total: 34, boarded: 34, exited: 34, status: 'Arrived at School' },
    { name: 'Class 6-A', total: 26, boarded: 25, exited: 0, status: '1 Needs Attention' },
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UsersRound size={15} strokeWidth={2} />
            Daily Passenger Ledger
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: colors.textPrimary, margin: '4px 0 2px 0', letterSpacing: '-0.02em' }}>
            Attendance &amp; Accountability
          </h1>
          <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0 }}>
            Authoritative count of enrolled passengers boarded, in transit, and safely exited.
          </p>
        </div>

        {/* Morning vs Afternoon Switcher */}
        <div style={{ display: 'flex', backgroundColor: colors.canvasBg, padding: '4px', borderRadius: radii.md, border: `1px solid ${colors.borderLight}` }}>
          <button
            onClick={() => setSession('MORNING')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: radii.sm,
              border: 'none',
              backgroundColor: session === 'MORNING' ? colors.card : 'transparent',
              color: session === 'MORNING' ? colors.primary : colors.textSecondary,
              boxShadow: session === 'MORNING' ? shadows.sm : 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <SunMedium size={14} strokeWidth={2} />
            Morning Pickup
          </button>
          <button
            onClick={() => setSession('AFTERNOON')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: radii.sm,
              border: 'none',
              backgroundColor: session === 'AFTERNOON' ? colors.card : 'transparent',
              color: session === 'AFTERNOON' ? colors.primary : colors.textSecondary,
              boxShadow: session === 'AFTERNOON' ? shadows.sm : 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Sunset size={14} strokeWidth={2} />
            Afternoon Drop
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div style={{ padding: '20px 24px', backgroundColor: colors.card, borderRadius: radii.lg, border: `1px solid ${colors.border}`, boxShadow: shadows.card }}>
          <div style={{ fontSize: '12px', color: colors.textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>Total Enrolled Today</div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: colors.textPrimary, marginTop: '4px' }}>428</div>
          <div style={{ fontSize: '12px', color: colors.success, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CircleCheck size={13} strokeWidth={2} />
            100% Transport Roster Active
          </div>
        </div>

        <div style={{ padding: '20px 24px', backgroundColor: colors.card, borderRadius: radii.lg, border: `1px solid ${colors.border}`, boxShadow: shadows.card }}>
          <div style={{ fontSize: '12px', color: colors.textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>Morning Boarding Verified</div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: colors.success, marginTop: '4px' }}>428 / 428</div>
          <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>RFID Hardware Scanned</div>
        </div>

        <div style={{ padding: '20px 24px', backgroundColor: colors.card, borderRadius: radii.lg, border: `1px solid ${colors.border}`, boxShadow: shadows.card }}>
          <div style={{ fontSize: '12px', color: colors.textSecondary, fontWeight: 700, textTransform: 'uppercase' }}>Afternoon Exit Status</div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: colors.primary, marginTop: '4px' }}>426 / 428</div>
          <div style={{ fontSize: '12px', color: colors.warning, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TriangleAlert size={13} strokeWidth={2} />
            2 Need Attention
          </div>
        </div>
      </div>

      {/* Roster Accountability by Class */}
      <div
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.lg,
          border: `1px solid ${colors.border}`,
          boxShadow: shadows.card,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: colors.textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GraduationCap size={18} strokeWidth={2} color={colors.primary} />
            Accountability by Academic Grade &amp; Section
          </h3>
          <span style={{ fontSize: '12px', color: colors.textSecondary }}>5 Sections Reporting</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {classes.map((cls, idx) => (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr 1fr',
                padding: '16px 20px',
                borderBottom: idx === classes.length - 1 ? 'none' : `1px solid ${colors.borderLight}`,
                alignItems: 'center',
              }}
            >
              <div>
                <strong style={{ fontSize: '15px', color: colors.textPrimary }}>{cls.name}</strong>
                <div style={{ fontSize: '12px', color: colors.textSecondary }}>{cls.total} Students Registered</div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: colors.textMuted, textTransform: 'uppercase', fontWeight: 700 }}>Boarded</span>
                <div style={{ fontSize: '15px', fontWeight: 800, color: colors.success }}>{cls.boarded} / {cls.total}</div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: colors.textMuted, textTransform: 'uppercase', fontWeight: 700 }}>Exited</span>
                <div style={{ fontSize: '15px', fontWeight: 800, color: colors.textPrimary }}>{cls.exited} / {cls.total}</div>
              </div>

              <div>
                <StatusBadge
                  type={cls.status.includes('Attention') ? 'danger' : 'success'}
                  label={cls.status}
                />
              </div>

              <div style={{ textAlign: 'right' }}>
                <button
                  onClick={() => navigate('/students')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: radii.md,
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.canvasBg,
                    color: colors.primary,
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  View Roster
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
