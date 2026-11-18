import React, { useState } from 'react';
import { useRouter } from '../router/Router';
import { useTheme } from '../theme/ThemeContext';
import { radii, shadows } from '../theme/design-system';
import { StatusBadge } from '../components/ui/SharedComponents';
import { RfidIcon } from '../components/ui/RfidIcon';
import { ApiClient } from '@school-transport-platform/client-sdk';
import {
  Search,
  UsersRound,
  BusFront,
  ArrowRight,
  UserRound,
  Check,
  MapPin,
  ClipboardCheck,
} from 'lucide-react';

interface StudentsDirectoryPageProps {
  apiClient: ApiClient;
}

export const StudentsDirectoryPage: React.FC<StudentsDirectoryPageProps> = ({ apiClient }) => {
  const { navigate } = useRouter();
  const { colors } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');

  const [students] = useState([
    {
      id: 'c1111111-1111-1111-1111-111111111101',
      name: 'Aarav Sharma',
      admission: 'ADM-2024-001',
      className: 'Class 7-B',
      busNumber: 'Bus 12',
      routeName: 'North Corridor Express',
      stopName: 'Sector 62 Metro Gate #2',
      rfidStatus: 'ACTIVE',
      cardId: 'CARD-AARAV-01',
      todayStatus: 'BOARDED',
      todayStatusLabel: 'Boarded (Bus 12)',
      guardian: 'Priya Devi (+91 98765 43210)',
    },
    {
      id: 'c1111111-1111-1111-1111-111111111102',
      name: 'Diya Sharma',
      admission: 'ADM-2024-002',
      className: 'Class 2-B',
      busNumber: 'Bus 12',
      routeName: 'North Corridor Express',
      stopName: 'Shipra Sun City Gate #4',
      rfidStatus: 'ACTIVE',
      cardId: 'CARD-DIYA-02',
      todayStatus: 'BOARDED',
      todayStatusLabel: 'Boarded (Bus 12)',
      guardian: 'Priya Devi (+91 98765 43210)',
    },
    {
      id: 'c1111111-1111-1111-1111-111111111104',
      name: 'Ananya Verma',
      admission: 'ADM-2024-004',
      className: 'Class 5-A',
      busNumber: 'Bus 14',
      routeName: 'Vaishali Corridor',
      stopName: 'Vaishali Metro Station',
      rfidStatus: 'ACTIVE',
      cardId: 'CARD-ANANYA-04',
      todayStatus: 'ONBOARD',
      todayStatusLabel: 'On the way',
      guardian: 'Vikram Verma (+91 98765 43216)',
    },
    {
      id: 'c1111111-1111-1111-1111-111111111105',
      name: 'Rohan Gupta',
      admission: 'ADM-2024-005',
      className: 'Class 8-C',
      busNumber: 'Bus 18',
      routeName: 'Indirapuram Express',
      stopName: 'Indirapuram Habitat Centre',
      rfidStatus: 'ACTIVE',
      cardId: 'CARD-ROHAN-05',
      todayStatus: 'COMPLETED',
      todayStatusLabel: 'At school',
      guardian: 'Meera Gupta (+91 98765 43218)',
    },
    {
      id: 'c1111111-1111-1111-1111-111111111103',
      name: 'Kabir Mehta',
      admission: 'ADM-2024-003',
      className: 'Class 6-A',
      busNumber: 'Bus 08',
      routeName: 'East Ring Road Corridor',
      stopName: 'Preet Vihar Crossing',
      rfidStatus: 'ACTIVE',
      cardId: 'CARD-KABIR-03',
      todayStatus: 'EXPECTED',
      todayStatusLabel: 'Scheduled / At Stop',
      guardian: 'Sanjay Mehta (+91 98765 43219)',
    },
  ]);

  const filtered = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.admission.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.className.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === 'ALL' || s.className.startsWith(gradeFilter);
    return matchesSearch && matchesGrade;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Roster &amp; Student Safety
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: colors.textPrimary, margin: '4px 0 2px 0', letterSpacing: '-0.02em' }}>
            Students
          </h1>
          <p style={{ fontSize: '13px', color: colors.textSecondary, margin: 0 }}>
            Transit profiles, assigned buses, and student scan status.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => navigate('/attendance')}
            style={{
              padding: '7px 14px',
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: radii.sm,
              color: colors.textPrimary,
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: shadows.sm,
            }}
          >
            <ClipboardCheck size={14} strokeWidth={2} />
            <span>Attendance Ledger</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.md,
          padding: '12px 16px',
          border: `1px solid ${colors.border}`,
          boxShadow: shadows.sm,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '240px' }}>
          <Search size={16} strokeWidth={2} color={colors.textMuted} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student, class, or admission..."
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: '13px',
              color: colors.textPrimary,
              backgroundColor: 'transparent',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {['ALL', 'Class 7', 'Class 2', 'Class 5', 'Class 8'].map((g) => (
            <button
              key={g}
              onClick={() => setGradeFilter(g)}
              style={{
                padding: '5px 10px',
                borderRadius: radii.sm,
                border: gradeFilter === g ? `1px solid ${colors.primary}` : `1px solid ${colors.border}`,
                backgroundColor: gradeFilter === g ? colors.primaryLight : colors.card,
                color: gradeFilter === g ? colors.primary : colors.textSecondary,
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Students List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.map((s) => (
          <div
            key={s.id}
            onClick={() => navigate(`/students/${s.id}`)}
            style={{
              backgroundColor: colors.card,
              borderRadius: radii.md,
              border: `1px solid ${colors.border}`,
              padding: '14px 18px',
              boxShadow: shadows.sm,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              flexWrap: 'wrap',
              gap: '12px',
              transition: 'border-color 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: colors.primaryLight,
                  border: `1px solid ${colors.primaryBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.primary,
                }}
              >
                <UserRound size={18} strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: colors.textPrimary }}>
                  {s.name}
                </div>
                <div style={{ fontSize: '11px', color: colors.textSecondary }}>
                  {s.className} &bull; Admission: {s.admission}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: colors.textPrimary, fontWeight: 600 }}>
                <BusFront size={14} strokeWidth={2} color={colors.primary} />
                <span>{s.busNumber}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: colors.textSecondary }}>
                <MapPin size={13} strokeWidth={1.8} color={colors.textMuted} />
                <span>{s.stopName}</span>
              </div>

              <StatusBadge
                type={s.todayStatus === 'COMPLETED' ? 'success' : s.todayStatus === 'BOARDED' ? 'info' : 'neutral'}
                label={s.todayStatusLabel}
              />

              <div style={{ color: colors.primary, display: 'flex', alignItems: 'center' }}>
                <ArrowRight size={14} strokeWidth={2} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
