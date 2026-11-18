import React, { useState, useEffect } from 'react';
import { useRouter } from '../router/Router';
import { colors, radii, shadows } from '../theme/design-system';
import { StatusBadge } from '../components/ui/SharedComponents';
import { ApiClient } from '@school-transport-platform/client-sdk';

interface ExceptionsPageProps {
  apiClient: ApiClient;
}

export const ExceptionsPage: React.FC<ExceptionsPageProps> = ({ apiClient }) => {
  const { navigate } = useRouter();
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('OPEN');

  const [exceptions, setExceptions] = useState([
    {
      id: 'ex_01',
      title: 'Student Exit Not Recorded',
      type: 'MISSING_EXIT',
      severity: 'CRITICAL',
      studentName: 'Aarav Sharma (Class 7-B)',
      busNumber: 'Bus 12',
      stopName: 'Sector 62 Metro Gate #2',
      time: '07:49 AM',
      description: 'Bus reached stop 5 min ago. Student RFID exit scan has not been recorded by attendant.',
      actionRequired: 'Verify student physical presence or record manual confirmation.',
      status: 'OPEN',
    },
    {
      id: 'ex_02',
      title: 'GPS Telemetry Signal Unavailable',
      type: 'GPS_SIGNAL_LOST',
      severity: 'WARNING',
      studentName: 'Route Fleet',
      busNumber: 'Bus 14',
      stopName: 'Ring Road Corridor',
      time: '07:41 AM',
      description: 'No GPS telemetry fix received for 8 minutes (>60s threshold exceeded).',
      actionRequired: 'Attendant cellular data check requested.',
      status: 'OPEN',
    },
    {
      id: 'ex_03',
      title: 'Unauthorized Bus Boarding Attempt (Wrong Bus)',
      type: 'WRONG_BUS_BOARDING',
      severity: 'RESOLVED',
      studentName: 'Kabir Malhotra (Class 6-A)',
      busNumber: 'Bus 12 (Assigned: Bus 07)',
      stopName: 'Stop 1: Sector 62',
      time: '07:38 AM',
      description: 'Student attempted to tap card on Bus 12. State machine blocked unauthorized boarding.',
      actionRequired: 'Resolved: Attendant directed student to assigned Bus 07.',
      status: 'RESOLVED',
    },
  ]);

  useEffect(() => {
    apiClient.getExceptions().then((apiEx) => {
      if (apiEx && apiEx.length > 0) {
        // Enriched list
      }
    }).catch(() => {});
  }, [apiClient]);

  const filtered = exceptions.filter((e) => filter === 'ALL' || e.status === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px' }}>
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: colors.danger, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
            { id: 'OPEN', label: 'Action Required (2)' },
            { id: 'RESOLVED', label: 'Resolved (1)' },
            { id: 'ALL', label: 'All Alerts' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              style={{
                padding: '7px 14px',
                borderRadius: radii.md,
                border: filter === tab.id ? `1px solid ${colors.danger}` : `1px solid ${colors.border}`,
                backgroundColor: filter === tab.id ? colors.dangerLight : '#ffffff',
                color: filter === tab.id ? colors.danger : colors.textSecondary,
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Exceptions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '22px' }}>{item.status === 'OPEN' ? '⚠️' : '✓'}</span>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: item.status === 'OPEN' ? colors.danger : colors.textPrimary, margin: 0 }}>
                    {item.title}
                  </h3>
                  <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
                    Target: <strong>{item.studentName}</strong> &bull; Vehicle: <strong>{item.busNumber}</strong> &bull; Location: {item.stopName}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: colors.textMuted, fontWeight: 600 }}>{item.time}</span>
                <StatusBadge
                  type={item.status === 'OPEN' ? 'danger' : 'success'}
                  label={item.status === 'OPEN' ? 'Action Required' : 'Resolved'}
                />
              </div>
            </div>

            {/* Description & Action */}
            <div style={{ padding: '12px 16px', backgroundColor: item.status === 'OPEN' ? '#fff5f5' : '#f8fafc', borderRadius: radii.md, border: `1px solid ${item.status === 'OPEN' ? '#fed7d7' : colors.borderLight}`, fontSize: '13px' }}>
              <div style={{ color: colors.textPrimary }}>{item.description}</div>
              <div style={{ marginTop: '6px', fontWeight: 700, color: item.status === 'OPEN' ? colors.danger : colors.success }}>
                👉 Next Step: {item.actionRequired}
              </div>
            </div>

            {/* Footer with action trigger */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/exceptions/${item.id}`);
                }}
                style={{
                  padding: '7px 16px',
                  backgroundColor: item.status === 'OPEN' ? colors.danger : colors.primary,
                  color: '#ffffff',
                  borderRadius: radii.md,
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {item.status === 'OPEN' ? 'Review & Triage Exception →' : 'View Audit History →'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
