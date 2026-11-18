import React, { useState } from 'react';
import { useRouter } from '../router/Router';
import { useTheme } from '../theme/ThemeContext';
import { radii, shadows } from '../theme/design-system';
import { StatusBadge, JourneyTimeline } from '../components/ui/SharedComponents';
import { RfidIcon } from '../components/ui/RfidIcon';
import { ApiClient } from '@school-transport-platform/client-sdk';
import {
  ArrowLeft,
  UserRound,
  BusFront,
  Route,
  MapPin,
  Phone,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

interface StudentProfilePageProps {
  apiClient: ApiClient;
}

export const StudentProfilePage: React.FC<StudentProfilePageProps> = ({ apiClient }) => {
  const { getParam, navigate } = useRouter();
  const { colors } = useTheme();
  const studentId = getParam('id') || 'c1111111-1111-1111-1111-111111111101';

  const [student] = useState({
    id: studentId,
    name: 'Aarav Sharma',
    admissionNumber: 'ADM-2024-001',
    className: 'Class 7-B',
    busNumber: 'Bus 12',
    busReg: 'UP-16-BT-9912',
    routeName: 'North Corridor Express',
    assignedStop: 'Sector 62 Metro Gate #2',
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
    { label: 'In Transit', sublabel: 'Bus 12 moving towards Oakridge Campus', time: '07:49 AM', status: 'current' as const },
    { label: 'School Arrival', sublabel: 'Oakridge Campus Terminus', time: '~07:58 AM', status: 'pending' as const },
  ];

  const history = [
    { date: 'Today, Morning', bus: 'Bus 12', boarding: '07:42 AM', exit: 'Pending (In Transit)', status: 'In Transit' },
    { date: 'Yesterday, Evening', bus: 'Bus 12', boarding: '03:15 PM', exit: '03:48 PM', status: 'Completed' },
    { date: 'Yesterday, Morning', bus: 'Bus 12', boarding: '07:40 AM', exit: '08:14 AM', status: 'Completed' },
    { date: '14 Nov 2026, Morning', bus: 'Bus 12', boarding: '07:44 AM', exit: '08:18 AM', status: 'Completed' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px' }}>
      {/* Back button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => navigate('/students')}
          style={{
            padding: '7px 12px',
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: radii.sm,
            fontSize: '12px',
            fontWeight: 600,
            color: colors.textPrimary,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: shadows.sm,
          }}
        >
          <ArrowLeft size={14} strokeWidth={2} />
          <span>Back to Students</span>
        </button>
      </div>

      {/* Main Student Card */}
      <div
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.lg,
          border: `1px solid ${colors.border}`,
          padding: '24px 28px',
          boxShadow: shadows.sm,
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
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: colors.primaryLight,
                border: `1px solid ${colors.primaryBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.primary,
              }}
            >
              <UserRound size={26} strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Transportation Profile
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: colors.textPrimary, margin: '2px 0 2px 0', letterSpacing: '-0.02em' }}>
                {student.name}
              </h1>
              <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                {student.className} &bull; Admission: {student.admissionNumber}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => navigate(`/journeys/${student.id}`)}
              style={{
                padding: '8px 14px',
                backgroundColor: colors.primary,
                color: colors.textWhite,
                borderRadius: radii.sm,
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Route size={14} strokeWidth={2} />
              <span>Journey Passport</span>
            </button>
          </div>
        </div>

        {/* 2-Column: Key Transit Details & Today's Journey */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Left: Core Assignment & Guardians */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Transit Route Assignment */}
            <div style={{ padding: '16px', backgroundColor: colors.bg, borderRadius: radii.md, border: `1px solid ${colors.borderLight}` }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: '8px' }}>
                Transport Assignment
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BusFront size={13} strokeWidth={1.8} color={colors.primary} />
                  <span>Assigned Bus: <strong style={{ color: colors.textPrimary }}>{student.busNumber}</strong> ({student.busReg})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Route size={13} strokeWidth={1.8} color={colors.primary} />
                  <span>Route: <strong style={{ color: colors.textPrimary }}>{student.routeName}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={13} strokeWidth={1.8} color={colors.primary} />
                  <span>Stop Area: <strong style={{ color: colors.primary }}>{student.assignedStop}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RfidIcon size={13} color={colors.primary} />
                  <span>RFID Card: <strong style={{ color: colors.textPrimary }}>{student.rfidCardId}</strong></span>
                </div>
              </div>
            </div>

            {/* Guardian Contacts */}
            <div style={{ padding: '16px', backgroundColor: colors.bg, borderRadius: radii.md, border: `1px solid ${colors.borderLight}` }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: '8px' }}>
                Authorized Guardians
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserRound size={13} strokeWidth={1.8} color={colors.primary} />
                  <span>Primary: <strong style={{ color: colors.textPrimary }}>{student.guardianName}</strong> ({student.guardianRelation})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={13} strokeWidth={1.8} color={colors.primary} />
                  <span>Phone: <strong style={{ color: colors.textPrimary }}>{student.guardianPhone}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Today's Journey Stepper */}
          <div style={{ padding: '16px', backgroundColor: colors.card, borderRadius: radii.md, border: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: colors.textPrimary, textTransform: 'uppercase' }}>
                Today's Transit Status
              </span>
              <StatusBadge type="info" label="On Bus 12" />
            </div>
            <JourneyTimeline steps={timelineSteps} />
          </div>
        </div>

        {/* Commute History Table */}
        <div style={{ paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: colors.textPrimary, textTransform: 'uppercase', marginBottom: '10px' }}>
            Past Commute Records
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {history.map((h, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  backgroundColor: colors.bg,
                  borderRadius: radii.sm,
                  border: `1px solid ${colors.borderLight}`,
                  fontSize: '12px',
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
