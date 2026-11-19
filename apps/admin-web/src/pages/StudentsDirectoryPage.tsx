import React, { useEffect, useState } from 'react';
import { useRouter } from '../router/Router';
import { useTheme } from '../theme/ThemeContext';
import { radii, shadows } from '../theme/design-system';
import { StatusBadge } from '../components/ui/SharedComponents';
import { RfidIcon } from '../components/ui/RfidIcon';
import { ApiClient } from '@school-transport-platform/client-sdk';
import { Student } from '@school-transport-platform/shared-types';
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
  type StudentRecord = Student & {
    assignment?: { routeId: string; stopId: string };
  };
  type StudentRow = {
    id: string;
    name: string;
    admission: string;
    className: string;
    busNumber: string;
    routeName: string;
    stopName: string;
    todayStatus: string;
    todayStatusLabel: string;
  };
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiClient.getStudents(),
      apiClient.listRoutes(),
      apiClient.listTrips(),
      apiClient.listJourneys(),
      apiClient.listStops(),
    ])
      .then(([studentItems, routeItems, tripItems, journeyItems, stopItems]) => {
        if (!active) return;
        const routes = routeItems as Array<{ id: string; name: string }>;
        const trips = tripItems as Array<{ busId: string; routeId: string; busFleetNumber?: string; status: string }>;
        const journeys = journeyItems as Array<{ student: Student; state: string; bus: { fleetNumber?: string } | null }>;
        const stops = stopItems as Array<{ id: string; name: string }>;
        setStudents((studentItems as StudentRecord[]).map((student) => {
          const route = routes.find((candidate) => candidate.id === student.assignment?.routeId);
          const stop = stops.find((candidate) => candidate.id === student.assignment?.stopId);
          const trip = trips.find((candidate) => candidate.routeId === route?.id && ['STARTED', 'IN_PROGRESS'].includes(candidate.status));
          const journey = journeys.find((candidate) => candidate.student.id === student.id);
          const status = journey?.state || 'EXPECTED';
          return {
            id: student.id,
            name: `${student.firstName} ${student.lastName}`.trim(),
            admission: student.admissionNumber,
            className: [student.className, student.section].filter(Boolean).join('-') || 'Class not set',
            busNumber: trip?.busFleetNumber || 'No active trip',
            routeName: route?.name || 'Route not assigned',
            stopName: stop?.name || 'Stop not assigned',
            todayStatus: status,
            todayStatusLabel: status.replaceAll('_', ' ').toLowerCase(),
          };
        }));
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : 'Student records could not be loaded.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [apiClient]);

  const gradeOptions = ['ALL', ...new Set(students.map((student) => student.className).filter((value) => value !== 'Class not set'))];

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
          {gradeOptions.map((g) => (
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
      {loadError && (
        <div role="alert" style={{ padding: 14, borderRadius: radii.md, border: `1px solid ${colors.dangerBorder}`, background: colors.dangerLight, color: colors.danger }}>
          Student records could not be loaded: {loadError}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {isLoading && <p role="status" style={{ color: colors.textSecondary }}>Loading student records…</p>}
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
                type={s.todayStatus === 'COMPLETED' || s.todayStatus === 'EXIT_RECORDED' ? 'success' : s.todayStatus === 'BOARDED' || s.todayStatus === 'ONBOARD' ? 'info' : 'neutral'}
                label={s.todayStatusLabel}
              />

              <div style={{ color: colors.primary, display: 'flex', alignItems: 'center' }}>
                <ArrowRight size={14} strokeWidth={2} />
              </div>
            </div>
          </div>
        ))}
        {!isLoading && !loadError && filtered.length === 0 && (
          <p style={{ padding: 24, textAlign: 'center', color: colors.textSecondary }}>No student records match this search.</p>
        )}
      </div>
    </div>
  );
};
