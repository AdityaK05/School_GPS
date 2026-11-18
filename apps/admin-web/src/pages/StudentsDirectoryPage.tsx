import React, { useState, useEffect } from 'react';
import { useRouter } from '../router/Router';
import { colors, radii, shadows } from '../theme/design-system';
import { StatusBadge } from '../components/ui/SharedComponents';
import { ApiClient } from '@school-transport-platform/client-sdk';

interface StudentsDirectoryPageProps {
  apiClient: ApiClient;
}

export const StudentsDirectoryPage: React.FC<StudentsDirectoryPageProps> = ({ apiClient }) => {
  const { navigate } = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');

  const [students, setStudents] = useState([
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
      todayStatusLabel: 'Boarded (On Bus 12)',
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
      todayStatusLabel: 'Boarded (On Bus 12)',
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
      todayStatusLabel: 'In Transit',
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
      todayStatusLabel: 'Arrived at School',
      guardian: 'Meera Gupta (+91 98765 43218)',
    },
    {
      id: 'c1111111-1111-1111-1111-111111111103',
      name: 'Kabir Malhotra',
      admission: 'ADM-2024-003',
      className: 'Class 6-A',
      busNumber: 'Bus 07',
      routeName: 'East Ring Road Corridor',
      stopName: 'Preet Vihar Crossing',
      rfidStatus: 'ACTIVE',
      cardId: 'CARD-KABIR-03',
      todayStatus: 'EXPECTED',
      todayStatusLabel: 'Scheduled / At Stop',
      guardian: 'Sanjay Malhotra (+91 98765 43219)',
    },
  ]);

  useEffect(() => {
    apiClient.getStudents().then((stList) => {
      if (stList && stList.length > 0) {
        // Enriched list
      }
    }).catch(() => {});
  }, [apiClient]);

  const filtered = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.admission.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.stopName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Enrolled Passenger Roster
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: colors.textPrimary, margin: '4px 0 2px 0', letterSpacing: '-0.02em' }}>
            Students Directory
          </h1>
          <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0 }}>
            Assigned school buses, pickup stops, hardware RFID card links, and live accountability.
          </p>
        </div>

        <button
          onClick={() => navigate('/attendance')}
          style={{
            padding: '8px 16px',
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: radii.md,
            color: colors.textPrimary,
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: shadows.sm,
          }}
        >
          ✓ Accountability Ledger
        </button>
      </div>

      {/* Search Bar */}
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
          placeholder="Search by student name, admission number, assigned stop, or bus..."
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

      {/* Clean List / Table Hybrid */}
      <div
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.lg,
          border: `1px solid ${colors.border}`,
          boxShadow: shadows.card,
          overflow: 'hidden',
        }}
      >
        {/* Table Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.6fr 1.2fr 1.6fr 1.2fr 1fr',
            padding: '14px 20px',
            backgroundColor: '#f8fafc',
            borderBottom: `1px solid ${colors.border}`,
            fontSize: '11px',
            fontWeight: 800,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          <div>Student Name &amp; Class</div>
          <div>Assigned Vehicle</div>
          <div>Pickup / Drop Stop</div>
          <div>Today's Commute</div>
          <div style={{ textAlign: 'right' }}>Action</div>
        </div>

        {/* Student Rows */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filtered.map((s, idx) => (
            <div
              key={s.id}
              onClick={() => navigate(`/students/${s.id}`)}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.6fr 1.2fr 1.6fr 1.2fr 1fr',
                padding: '16px 20px',
                borderBottom: idx === filtered.length - 1 ? 'none' : `1px solid ${colors.borderLight}`,
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {/* Student Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: colors.primaryLight,
                    border: `1px solid ${colors.primaryBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: 800,
                    color: colors.primary,
                  }}
                >
                  {s.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: colors.textPrimary }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '1px' }}>
                    {s.className} &bull; {s.admission}
                  </div>
                </div>
              </div>

              {/* Bus */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>
                  🚌 {s.busNumber}
                </div>
                <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '2px' }}>
                  {s.routeName}
                </div>
              </div>

              {/* Stop */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>
                  {s.stopName}
                </div>
                <div style={{ fontSize: '11px', color: colors.textMuted, marginTop: '2px' }}>
                  RFID: {s.cardId}
                </div>
              </div>

              {/* Today's Commute Status */}
              <div>
                <StatusBadge
                  type={s.todayStatus === 'COMPLETED' ? 'success' : s.todayStatus === 'BOARDED' ? 'info' : 'neutral'}
                  icon="●"
                  label={s.todayStatusLabel}
                />
              </div>

              {/* View Profile Link */}
              <div style={{ textAlign: 'right', fontSize: '12px', fontWeight: 700, color: colors.primary }}>
                View Profile →
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
