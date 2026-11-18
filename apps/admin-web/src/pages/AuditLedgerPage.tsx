import React, { useState } from 'react';
import { useRouter } from '../router/Router';
import { colors, radii, shadows } from '../theme/design-system';
import { StatusBadge } from '../components/ui/SharedComponents';
import { ApiClient } from '@school-transport-platform/client-sdk';

interface AuditLedgerPageProps {
  apiClient: ApiClient;
}

export const AuditLedgerPage: React.FC<AuditLedgerPageProps> = ({ apiClient }) => {
  const { navigate } = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const [logs] = useState([
    {
      id: 'evt_1092831',
      time: '08:14:22 AM',
      student: 'Aarav Sharma (Class 7-B)',
      action: 'Boarded Bus 12',
      verification: 'RFID Card Tap Verified',
      vehicle: 'Bus 12 (KA-01-EXP-9999)',
      location: 'Sector 62 Metro Gate #2',
      actor: 'Attendant: Sunita Devi',
      source: 'RFID_READER_BUS_42',
      idempotencyKey: 'idemp_8888-001',
    },
    {
      id: 'evt_1092830',
      time: '08:11:05 AM',
      student: 'Fleet Bus 12',
      action: 'Arrived at Stop #1',
      verification: 'PostGIS Geofence (50m)',
      vehicle: 'Bus 12 (KA-01-EXP-9999)',
      location: 'Sector 62 Metro Gate #2',
      actor: 'Automated GPS Engine',
      source: 'GPS_TELT_01',
      idempotencyKey: 'idemp_8888-000',
    },
    {
      id: 'evt_1092829',
      time: '08:08:50 AM',
      student: 'Diya Sharma (Class 2-B)',
      action: 'Boarded Bus 12',
      verification: 'RFID Card Tap Verified',
      vehicle: 'Bus 12 (KA-01-EXP-9999)',
      location: 'Shipra Sun City Gate #4',
      actor: 'Attendant: Sunita Devi',
      source: 'RFID_READER_BUS_42',
      idempotencyKey: 'idemp_8888-002',
    },
    {
      id: 'evt_1092828',
      time: '07:58:14 AM',
      student: 'Rohan Gupta (Class 8-C)',
      action: 'Safely Exited Bus 18',
      verification: 'Campus Gate Tap Verified',
      vehicle: 'Bus 18 (KA-01-EXP-8888)',
      location: 'Oakridge Campus Terminus',
      actor: 'Campus Terminal Bay #3',
      source: 'RFID_CAMPUS_BAY_03',
      idempotencyKey: 'idemp_8888-003',
    },
  ]);

  const filtered = logs.filter(
    (l) =>
      l.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.vehicle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px' }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Compliance &amp; Immutable Safety Ledger
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: colors.textPrimary, margin: '4px 0 2px 0', letterSpacing: '-0.02em' }}>
          Safety Audit Ledger
        </h1>
        <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0 }}>
          Human-readable chain of custody documenting every child scan, vehicle departure, and geofence verification.
        </p>
      </div>

      {/* Search Input */}
      <div
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.lg,
          padding: '14px 20px',
          border: `1px solid ${colors.border}`,
          boxShadow: shadows.card,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <span style={{ fontSize: '16px', color: colors.textMuted }}>🔍</span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter ledger by student, bus, action, or stop location..."
          style={{
            border: 'none',
            outline: 'none',
            width: '100%',
            fontSize: '14px',
            color: colors.textPrimary,
            backgroundColor: 'transparent',
          }}
        />
      </div>

      {/* Ledger Feed */}
      <div
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.lg,
          border: `1px solid ${colors.border}`,
          boxShadow: shadows.card,
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filtered.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => setSelectedEvent(item)}
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 1.5fr 1.2fr 1.5fr 1fr',
                padding: '16px 20px',
                borderBottom: idx === filtered.length - 1 ? 'none' : `1px solid ${colors.borderLight}`,
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div style={{ fontSize: '12px', fontWeight: 800, color: colors.textPrimary }}>
                {item.time}
              </div>

              <div>
                <strong style={{ fontSize: '14px', color: colors.textPrimary }}>{item.student}</strong>
                <div style={{ fontSize: '12px', color: colors.primary, fontWeight: 600 }}>{item.action}</div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: colors.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Vehicle</span>
                <div style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary }}>{item.vehicle}</div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: colors.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Location</span>
                <div style={{ fontSize: '13px', color: colors.textPrimary }}>{item.location}</div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <StatusBadge type="success" label="Verified" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Detail Modal */}
      {selectedEvent && (
        <div
          onClick={() => setSelectedEvent(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: radii.xl,
              padding: '28px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: shadows.lg,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
                Safety Event Details
              </h3>
              <button
                onClick={() => setSelectedEvent(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: colors.textMuted,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div><strong>Timestamp:</strong> {selectedEvent.time}</div>
              <div><strong>Target:</strong> {selectedEvent.student}</div>
              <div><strong>Event Action:</strong> {selectedEvent.action}</div>
              <div><strong>Verification Method:</strong> {selectedEvent.verification}</div>
              <div><strong>Vehicle:</strong> {selectedEvent.vehicle}</div>
              <div><strong>Location:</strong> {selectedEvent.location}</div>
              <div><strong>Verified By:</strong> {selectedEvent.actor}</div>
              <div style={{ paddingTop: '8px', borderTop: `1px solid ${colors.borderLight}`, fontSize: '11px', color: colors.textMuted, wordBreak: 'break-all' }}>
                Hardware Source: {selectedEvent.source} &bull; Idempotency: {selectedEvent.idempotencyKey}
              </div>
            </div>

            <button
              onClick={() => setSelectedEvent(null)}
              style={{
                alignSelf: 'flex-end',
                padding: '8px 16px',
                backgroundColor: colors.primary,
                color: '#ffffff',
                border: 'none',
                borderRadius: radii.md,
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
