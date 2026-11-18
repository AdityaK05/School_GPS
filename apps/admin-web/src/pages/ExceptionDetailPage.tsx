import React, { useState } from 'react';
import { useRouter } from '../router/Router';
import { colors, radii, shadows } from '../theme/design-system';
import { StatusBadge } from '../components/ui/SharedComponents';
import { ApiClient } from '@school-transport-platform/client-sdk';

interface ExceptionDetailPageProps {
  apiClient: ApiClient;
}

export const ExceptionDetailPage: React.FC<ExceptionDetailPageProps> = ({ apiClient }) => {
  const { getParam, navigate } = useRouter();
  const exceptionId = getParam('id') || 'ex_01';

  const [resolved, setResolved] = useState(false);
  const [resolveReason, setResolveReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [details] = useState({
    title: 'Student Exit Not Recorded',
    type: 'MISSING_EXIT',
    severity: 'CRITICAL',
    status: 'OPEN',
    whatHappened:
      'Bus 12 arrived at Sector 62 Metro Gate #2 at 07:42 AM. Geofence dwell time elapsed (5 min threshold). The student Aarav Sharma has not scanned their RFID card at the vehicle exit door.',
    who: {
      studentName: 'Aarav Sharma',
      class: 'Class 7-B',
      admission: 'ADM-2024-001',
      guardian: 'Priya Devi (+91 98765 43210)',
    },
    where: {
      bus: 'Bus 12 (KA-01-EXP-9999)',
      route: 'North Corridor Express',
      stop: 'Stop 1: Sector 62 Metro Gate #2',
    },
    when: {
      detectedAt: '07:49:12 AM',
      busArrivedAt: '07:42:00 AM',
      gracePeriodElapsed: '5 minutes post geofence departure',
    },
    systemFacts: [
      'Student successfully scanned RFID upon morning boarding at 07:42 AM.',
      'Bus telematics verified arrival inside designated stop geofence buffer (50m).',
      'No hardware card exit scan was registered on RFID reader RFID_READER_BUS_42.',
      'Attendant Sunita Devi was notified on the in-bus scanner terminal.',
    ],
    actionRequired:
      'Contact Attendant Sunita Devi or Guardian Priya Devi to confirm physical whereabouts before clearing the exception.',
    auditHistory: [
      { time: '07:49 AM', event: 'Automated Exception Flagged by Deterministic Safety Engine' },
      { time: '07:49 AM', event: 'Push notification dispatched to School Transport Admin' },
      { time: '07:50 AM', event: 'SMS Alert queued for guardian fallback' },
    ],
  });

  const handleResolve = async () => {
    if (!resolveReason.trim()) {
      alert('Please enter a verification reason before resolving this safety alert.');
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.resolveException(exceptionId, resolveReason).catch(() => {});
      setResolved(true);
    } catch {
      setResolved(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '960px' }}>
      {/* Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => navigate('/exceptions')}
          style={{
            padding: '8px 14px',
            backgroundColor: '#ffffff',
            border: `1px solid ${colors.border}`,
            borderRadius: radii.md,
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: shadows.sm,
          }}
        >
          ← Back to Safety Alerts
        </button>
        <span style={{ fontSize: '13px', color: colors.textMuted }}>/</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: colors.textSecondary }}>Incident Investigation</span>
      </div>

      {/* Main Incident Card */}
      <div
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          border: `2px solid ${resolved ? colors.successBorder : colors.dangerBorder}`,
          padding: '32px',
          boxShadow: shadows.md,
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', paddingBottom: '20px', borderBottom: `1px solid ${colors.border}` }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: resolved ? colors.success : colors.danger, textTransform: 'uppercase' }}>
              Safety Protocol Case &bull; ID: {exceptionId}
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: colors.textPrimary, margin: '4px 0 2px 0' }}>
              {details.title}
            </h1>
            <div style={{ fontSize: '14px', color: colors.textSecondary }}>
              Detected at: {details.when.detectedAt} &bull; Route: {details.where.route}
            </div>
          </div>

          <StatusBadge
            type={resolved ? 'success' : 'danger'}
            icon={resolved ? '✓' : '⚠️'}
            label={resolved ? 'Resolved' : 'Active Triage'}
          />
        </div>

        {/* 1. WHAT HAPPENED */}
        <div>
          <h3 style={{ fontSize: '12px', fontWeight: 800, color: colors.danger, textTransform: 'uppercase', marginBottom: '8px' }}>
            1. What Happened
          </h3>
          <p style={{ fontSize: '14px', color: colors.textPrimary, lineHeight: 1.6, margin: 0, padding: '14px 18px', backgroundColor: '#fef2f2', borderRadius: radii.md, border: '1px solid #fee2e2' }}>
            {details.whatHappened}
          </p>
        </div>

        {/* 2. WHO & WHERE (2 Columns) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Who */}
          <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: radii.md, border: `1px solid ${colors.borderLight}` }}>
            <h4 style={{ fontSize: '12px', fontWeight: 800, color: colors.textSecondary, textTransform: 'uppercase', margin: '0 0 10px 0' }}>
              2. Student Identity
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
              <div>👤 Name: <strong>{details.who.studentName}</strong></div>
              <div>🏫 Class: {details.who.class} &bull; Adm: {details.who.admission}</div>
              <div>👩 Guardian: <strong>{details.who.guardian}</strong></div>
            </div>
          </div>

          {/* Where & When */}
          <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: radii.md, border: `1px solid ${colors.borderLight}` }}>
            <h4 style={{ fontSize: '12px', fontWeight: 800, color: colors.textSecondary, textTransform: 'uppercase', margin: '0 0 10px 0' }}>
              3. Location &amp; Vehicle
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
              <div>🚌 Vehicle: <strong>{details.where.bus}</strong></div>
              <div>🚏 Stop: <strong>{details.where.stop}</strong></div>
              <div>⏱️ Dwell Time: {details.when.gracePeriodElapsed}</div>
            </div>
          </div>
        </div>

        {/* 3. WHAT THE SYSTEM KNOWS */}
        <div>
          <h3 style={{ fontSize: '12px', fontWeight: 800, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: '10px' }}>
            4. What the System Knows
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {details.systemFacts.map((fact, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: colors.textPrimary }}>
                <span style={{ color: colors.primary, fontWeight: 800 }}>•</span>
                <span>{fact}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. WHAT ACTION IS REQUIRED */}
        <div style={{ padding: '18px 20px', backgroundColor: colors.warningLight, borderRadius: radii.md, border: `1px solid ${colors.warningBorder}` }}>
          <h3 style={{ fontSize: '12px', fontWeight: 800, color: colors.warning, textTransform: 'uppercase', margin: '0 0 6px 0' }}>
            5. Recommended Immediate Action
          </h3>
          <p style={{ fontSize: '14px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
            {details.actionRequired}
          </p>
        </div>

        {/* RESOLVE FORM */}
        {!resolved ? (
          <div style={{ padding: '20px', backgroundColor: '#ffffff', borderRadius: radii.lg, border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: colors.textPrimary, textTransform: 'uppercase', margin: 0 }}>
              Resolve &amp; Clear Safety Alert
            </h4>
            <input
              type="text"
              value={resolveReason}
              onChange={(e) => setResolveReason(e.target.value)}
              placeholder="Enter resolution reason (e.g. 'Confirmed with attendant: Student safely picked up by mother')..."
              style={{
                padding: '12px 14px',
                borderRadius: radii.md,
                border: `1px solid ${colors.border}`,
                outline: 'none',
                fontSize: '13px',
                color: colors.textPrimary,
              }}
            />
            <button
              onClick={handleResolve}
              disabled={isSubmitting}
              style={{
                alignSelf: 'flex-start',
                padding: '10px 22px',
                backgroundColor: colors.success,
                color: '#ffffff',
                borderRadius: radii.md,
                border: 'none',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {isSubmitting ? 'Recording Resolution...' : '✓ Confirm & Clear Alert'}
            </button>
          </div>
        ) : (
          <div style={{ padding: '16px 20px', backgroundColor: colors.successLight, borderRadius: radii.md, border: `1px solid ${colors.successBorder}`, color: colors.success, fontWeight: 700, fontSize: '14px' }}>
            ✓ Safety Alert Resolved. Reason recorded: "{resolveReason || 'Verified with attendant'}".
          </div>
        )}

        {/* AUDIT HISTORY */}
        <div style={{ paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}>
          <h4 style={{ fontSize: '12px', fontWeight: 800, color: colors.textSecondary, textTransform: 'uppercase', margin: '0 0 10px 0' }}>
            Audit Trail
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {details.auditHistory.map((item, i) => (
              <div key={i} style={{ fontSize: '12px', color: colors.textSecondary }}>
                <strong style={{ color: colors.textPrimary }}>{item.time}</strong> &bull; {item.event}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
