import React, { useState } from 'react';
import { useRouter } from '../router/Router';
import { colors, radii, shadows } from '../theme/design-system';
import { StatusBadge, JourneyTimeline } from '../components/ui/SharedComponents';
import { ApiClient } from '@school-transport-platform/client-sdk';

interface StudentProfilePageProps {
  apiClient: ApiClient;
}

export const StudentProfilePage: React.FC<StudentProfilePageProps> = ({ apiClient }) => {
  const { getParam, navigate } = useRouter();
  const studentId = getParam('id') || 'c1111111-1111-1111-1111-111111111101';

  const [student] = useState({
    id: studentId,
    name: 'Aarav Sharma',
    admissionNumber: 'ADM-2024-001',
    className: 'Class 7-B',
    busNumber: 'Bus 12',
    busReg: 'KA-01-EXP-9999',
    routeName: 'North Corridor Express',
    assignedStop: 'Stop 1: Sector 62 Metro Gate #2',
    rfidCardId: 'CARD-AARAV-01',
    rfidStatus: 'ACTIVE',
    todayStatus: 'BOARDED',
    guardianName: 'Priya Devi',
    guardianRelation: 'Mother',
    guardianPhone: '+91 98765 43210',
    emergencyContact: '+91 98765 43211 (Father)',
    activeExceptions: [] as any[],
  });

  const timelineSteps = [
    { label: 'Expected at Stop', sublabel: 'Sector 62 Metro Gate #2', time: '07:35 AM', status: 'completed' as const },
    { label: 'Boarded Bus 12', sublabel: 'RFID Card Verified by hardware scanner', time: '07:42 AM', status: 'completed' as const },
    { label: 'In Transit', sublabel: 'Bus 12 moving towards Oakridge Campus (Speed: 38 km/h)', time: '07:49 AM', status: 'current' as const },
    { label: 'School Arrival', sublabel: 'Oakridge Campus Terminus', time: '~07:58 AM', status: 'pending' as const },
  ];

  const history = [
    { date: 'Today, Morning', bus: 'Bus 12', boarding: '07:42 AM', exit: 'Pending (In Transit)', status: 'In Transit' },
    { date: 'Yesterday, Evening', bus: 'Bus 12', boarding: '03:15 PM', exit: '03:48 PM', status: 'Completed' },
    { date: 'Yesterday, Morning', bus: 'Bus 12', boarding: '07:40 AM', exit: '08:14 AM', status: 'Completed' },
    { date: '14 Nov 2026, Morning', bus: 'Bus 12', boarding: '07:44 AM', exit: '08:18 AM', status: 'Completed' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px' }}>
      {/* Back button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => navigate('/students')}
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
          ← Back to Students
        </button>
        <span style={{ fontSize: '13px', color: colors.textMuted }}>/</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: colors.textSecondary }}>Student Profile</span>
      </div>

      {/* Main Student Card */}
      <div
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          border: `1px solid ${colors.border}`,
          padding: '28px 32px',
          boxShadow: shadows.md,
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Profile Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', paddingBottom: '20px', borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: colors.primaryLight,
                border: `2px solid ${colors.primaryBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '26px',
                fontWeight: 800,
                color: colors.primary,
              }}
            >
              A
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: colors.primary, textTransform: 'uppercase' }}>
                Student Transportation Profile
              </div>
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: colors.textPrimary, margin: '2px 0 2px 0' }}>
                {student.name}
              </h1>
              <div style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary }}>
                {student.className} &bull; Admission: {student.admissionNumber}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => navigate(`/journeys/${student.id}`)}
              style={{
                padding: '9px 16px',
                backgroundColor: colors.primary,
                color: '#ffffff',
                borderRadius: radii.md,
                border: 'none',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🗺️ Live Journey Passport
            </button>
          </div>
        </div>

        {/* 2-Column: Key Transit Details & Today's Journey */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Left: Core Assignment & Guardians */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Transit Route Assignment */}
            <div style={{ padding: '18px', backgroundColor: '#f8fafc', borderRadius: radii.lg, border: `1px solid ${colors.borderLight}` }}>
              <h4 style={{ fontSize: '12px', fontWeight: 800, color: colors.textSecondary, textTransform: 'uppercase', margin: '0 0 10px 0' }}>
                Transport Assignment
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div>🚌 Assigned Bus: <strong style={{ color: colors.textPrimary }}>{student.busNumber}</strong> ({student.busReg})</div>
                <div>🛣️ Corridor: <strong style={{ color: colors.textPrimary }}>{student.routeName}</strong></div>
                <div>🚏 Designated Stop: <strong style={{ color: colors.primary }}>{student.assignedStop}</strong></div>
                <div>💳 RFID Card Token: <strong style={{ color: colors.textPrimary }}>{student.rfidCardId}</strong> (Active)</div>
              </div>
            </div>

            {/* Guardian Contacts */}
            <div style={{ padding: '18px', backgroundColor: '#f8fafc', borderRadius: radii.lg, border: `1px solid ${colors.borderLight}` }}>
              <h4 style={{ fontSize: '12px', fontWeight: 800, color: colors.textSecondary, textTransform: 'uppercase', margin: '0 0 10px 0' }}>
                Authorized Guardians
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div>👩 Primary: <strong style={{ color: colors.textPrimary }}>{student.guardianName}</strong> ({student.guardianRelation})</div>
                <div>📞 Phone: <strong style={{ color: colors.textPrimary }}>{student.guardianPhone}</strong></div>
                <div>🚨 Emergency: <span style={{ color: colors.textSecondary }}>{student.emergencyContact}</span></div>
              </div>
            </div>
          </div>

          {/* Right: Today's Journey Stepper */}
          <div style={{ padding: '20px', backgroundColor: '#ffffff', borderRadius: radii.lg, border: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 800, color: colors.textPrimary, textTransform: 'uppercase', margin: 0 }}>
                Today's Commute Status
              </h4>
              <StatusBadge type="info" icon="●" label="Boarded (On Bus 12)" />
            </div>
            <JourneyTimeline steps={timelineSteps} />
          </div>
        </div>

        {/* Commute History Table */}
        <div style={{ paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}>
          <h4 style={{ fontSize: '13px', fontWeight: 800, color: colors.textPrimary, textTransform: 'uppercase', margin: '0 0 12px 0' }}>
            Past Commute Records
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.map((h, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: radii.md,
                  border: `1px solid ${colors.borderLight}`,
                  fontSize: '13px',
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, color: colors.textPrimary }}>{h.date}</span>
                  <span style={{ color: colors.textSecondary, marginLeft: '12px' }}>{h.bus} &bull; Boarded: {h.boarding} &bull; Exited: {h.exit}</span>
                </div>
                <StatusBadge type={h.status === 'Completed' ? 'success' : 'info'} label={h.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
