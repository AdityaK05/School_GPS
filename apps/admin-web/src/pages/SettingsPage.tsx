import React, { useState } from 'react';
import { colors, radii, shadows } from '../theme/design-system';
import { ApiClient } from '@school-transport-platform/client-sdk';

interface SettingsPageProps {
  apiClient: ApiClient;
}

export const SettingsPage: React.FC<SettingsPageProps> = () => {
  const [activeTab, setActiveTab] = useState<'SCHOOL' | 'USERS' | 'DEVICES' | 'SAFETY'>('SCHOOL');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px' }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Platform Configuration
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: colors.textPrimary, margin: '4px 0 2px 0', letterSpacing: '-0.02em' }}>
          System Settings
        </h1>
        <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0 }}>
          Manage school institution details, user authorization roles, hardware devices, and safety parameters.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '8px' }}>
        {[
          { id: 'SCHOOL', label: '🏫 School Profile' },
          { id: 'USERS', label: '👥 Users & Roles' },
          { id: 'DEVICES', label: '📡 Hardware Devices' },
          { id: 'SAFETY', label: '🛡️ Safety Rules' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '8px 16px',
              borderRadius: radii.md,
              border: 'none',
              backgroundColor: activeTab === tab.id ? colors.primaryLight : 'transparent',
              color: activeTab === tab.id ? colors.primary : colors.textSecondary,
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: School Profile */}
      {activeTab === 'SCHOOL' && (
        <div style={{ backgroundColor: colors.card, borderRadius: radii.xl, border: `1px solid ${colors.border}`, padding: '28px', boxShadow: shadows.card, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
            Institutional Profile
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                School Name
              </label>
              <input
                type="text"
                defaultValue="Oakridge International School"
                style={{ width: '100%', padding: '10px 12px', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: '13px', color: colors.textPrimary }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                School Code
              </label>
              <input
                type="text"
                defaultValue="OAK-NOIDA-01"
                disabled
                style={{ width: '100%', padding: '10px 12px', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: '13px', backgroundColor: '#f8fafc', color: colors.textMuted }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                Timezone
              </label>
              <input
                type="text"
                defaultValue="Asia/Kolkata (IST +05:30)"
                disabled
                style={{ width: '100%', padding: '10px 12px', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: '13px', backgroundColor: '#f8fafc', color: colors.textMuted }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                Campus Contact Number
              </label>
              <input
                type="text"
                defaultValue="+91 120 456 7890"
                style={{ width: '100%', padding: '10px 12px', borderRadius: radii.md, border: `1px solid ${colors.border}`, fontSize: '13px', color: colors.textPrimary }}
              />
            </div>
          </div>
          <button
            onClick={() => alert('School profile settings saved successfully.')}
            style={{
              alignSelf: 'flex-start',
              padding: '9px 20px',
              backgroundColor: colors.primary,
              color: '#ffffff',
              borderRadius: radii.md,
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: '8px',
            }}
          >
            Save Changes
          </button>
        </div>
      )}

      {/* Tab 2: Users & Roles */}
      {activeTab === 'USERS' && (
        <div style={{ backgroundColor: colors.card, borderRadius: radii.xl, border: `1px solid ${colors.border}`, padding: '28px', boxShadow: shadows.card, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
            Role-Based Access Control (RBAC)
          </h3>
          <p style={{ fontSize: '13px', color: colors.textSecondary, margin: 0 }}>
            Strict multi-tenant role enforcement for administrative operations, attendant terminals, and guardians.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            {[
              { role: 'School Administrator', users: '3 Users', desc: 'Full transport management, route design, exception resolution, and audit logs.' },
              { role: 'Transport Manager', users: '5 Users', desc: 'Fleet dispatching, driver scheduling, and live journey monitoring.' },
              { role: 'Bus Attendant', users: '18 Users', desc: 'In-bus NFC/RFID passenger scanning, offline boarding manifest sync.' },
              { role: 'Parent / Guardian', users: '428 Registered', desc: 'Read-only live transit whereabouts for authorized children only.' },
            ].map((r, i) => (
              <div key={i} style={{ padding: '14px 18px', backgroundColor: '#f8fafc', borderRadius: radii.md, border: `1px solid ${colors.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: colors.textPrimary }}>{r.role}</div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>{r.desc}</div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: colors.primary, backgroundColor: colors.primaryLight, padding: '4px 10px', borderRadius: radii.full }}>
                  {r.users}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Hardware Devices */}
      {activeTab === 'DEVICES' && (
        <div style={{ backgroundColor: colors.card, borderRadius: radii.xl, border: `1px solid ${colors.border}`, padding: '28px', boxShadow: shadows.card, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
            Assigned GPS &amp; RFID Hardware
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ padding: '14px 18px', backgroundColor: '#f8fafc', borderRadius: radii.md, border: `1px solid ${colors.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>GPS Telematics Tracker: GPS_TELT_01</div>
                <div style={{ fontSize: '11px', color: colors.textSecondary }}>Assigned: Bus 12 &bull; Protocol: Teltonika FMB920 &bull; Interval: 15s</div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: colors.success }}>● Online (12 Sats)</span>
            </div>
            <div style={{ padding: '14px 18px', backgroundColor: '#f8fafc', borderRadius: radii.md, border: `1px solid ${colors.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>RFID Hardware Reader: RFID_READER_BUS_42</div>
                <div style={{ fontSize: '11px', color: colors.textSecondary }}>Assigned: Bus 12 Door Reader &bull; Protocol: ISO/IEC 14443 Type A (13.56MHz)</div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: colors.success }}>● Operational</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Safety Rules */}
      {activeTab === 'SAFETY' && (
        <div style={{ backgroundColor: colors.card, borderRadius: radii.xl, border: `1px solid ${colors.border}`, padding: '28px', boxShadow: shadows.card, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
            Deterministic Safety Thresholds
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '14px 18px', backgroundColor: '#f8fafc', borderRadius: radii.md, border: `1px solid ${colors.borderLight}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>GPS Freshness Gate</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: colors.primary }}>60 seconds</span>
              </div>
              <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>
                If no telemetry fix is ingested for over 60 seconds, vehicles are immediately flagged as stale on parent and admin screens.
              </div>
            </div>

            <div style={{ padding: '14px 18px', backgroundColor: '#f8fafc', borderRadius: radii.md, border: `1px solid ${colors.borderLight}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>PostGIS Geofence Arrival Buffer</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: colors.primary }}>50 meters</span>
              </div>
              <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>
                Stops are automatically evaluated as reached when vehicle telematics enters the 50m tolerance perimeter.
              </div>
            </div>

            <div style={{ padding: '14px 18px', backgroundColor: '#f8fafc', borderRadius: radii.md, border: `1px solid ${colors.borderLight}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>Missing Exit Grace Period</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: colors.danger }}>5 minutes</span>
              </div>
              <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>
                If a bus departs a stop and a designated student has not scanned out, an exception alert is dispatched immediately.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
