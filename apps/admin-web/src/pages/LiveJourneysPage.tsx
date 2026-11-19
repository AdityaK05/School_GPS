import React, { useState, useEffect } from 'react';
import { useRouter } from '../router/Router';
import { useTheme } from '../theme/ThemeContext';
import { radii, shadows } from '../theme/design-system';
import { StatusBadge } from '../components/ui/SharedComponents';
import { ApiClient } from '@school-transport-platform/client-sdk';
import {
  Search,
  ClipboardCheck,
  ArrowRight,
  BusFront,
  MapPin,
  School,
  Clock3,
  UserRound,
} from 'lucide-react';

interface LiveJourneysPageProps {
  apiClient: ApiClient;
}

interface JourneyListItem {
  id: string;
  tripId: string;
  student: {
    firstName: string;
    lastName: string;
    admissionNumber: string;
    className?: string;
    section?: string;
  };
  bus: { fleetNumber?: string; registrationNumber?: string } | null;
  route: { name: string } | null;
  state: string;
  boardingStatus: string;
  exitStatus: string;
  boardedAt?: string;
  location: { latitude: number; longitude: number; recordedAt: string } | null;
}

interface JourneyRow {
  id: string;
  tripId: string;
  studentName: string;
  className: string;
  admissionNumber: string;
  busNumber: string;
  routeName: string;
  currentLocation: string;
  destination: string;
  status: string;
  statusLabel: string;
  eta: string;
  boardedAt: string;
}

export const LiveJourneysPage: React.FC<LiveJourneysPageProps> = ({ apiClient }) => {
  const { navigate } = useRouter();
  const { colors } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'EXPECTED' | 'ONBOARD' | 'COMPLETED'>('ALL');

  const [journeys, setJourneys] = useState<JourneyRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiClient.listJourneys()
      .then((items) => {
        if (!active) return;
        const rows = (items as JourneyListItem[]).map((item) => {
          const status = item.exitStatus === 'EXITED'
            ? 'COMPLETED'
            : item.boardingStatus === 'BOARDED'
              ? 'ONBOARD'
              : item.state === 'EXPECTED' || item.state === 'BOARDING_PENDING'
                ? 'EXPECTED'
                : item.state;
          return {
            id: item.id,
            tripId: item.tripId,
            studentName: `${item.student.firstName} ${item.student.lastName}`.trim(),
            className: [item.student.className, item.student.section].filter(Boolean).join('-') || 'Class not set',
            admissionNumber: item.student.admissionNumber,
            busNumber: item.bus?.fleetNumber || item.bus?.registrationNumber || 'Bus unassigned',
            routeName: item.route?.name || 'Route not assigned',
            currentLocation: item.location
              ? `${item.location.latitude.toFixed(5)}, ${item.location.longitude.toFixed(5)}`
              : 'No GPS fix available',
            destination: item.route?.name || 'Destination not configured',
            status,
            statusLabel: status === 'COMPLETED'
              ? 'Exit recorded'
              : status === 'ONBOARD'
                ? 'Boarding recorded'
                : status.replaceAll('_', ' ').toLowerCase(),
            eta: 'Unavailable',
            boardedAt: item.boardedAt ? new Date(item.boardedAt).toLocaleString() : 'Not recorded',
          };
        });
        setJourneys(rows);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : 'Journey data could not be loaded.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [apiClient]);

  const filtered = journeys.filter((j) => {
    const matchesSearch =
      j.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Accountability Pipeline
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: colors.textPrimary, margin: '4px 0 2px 0', letterSpacing: '-0.02em' }}>
            Live Student Journeys
          </h1>
          <p style={{ fontSize: '13px', color: colors.textSecondary, margin: 0 }}>
            Know where every student is on their journey to campus.
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
            placeholder="Search student name, class, or bus..."
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

        {/* Status Filter Buttons */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'ALL', label: 'All Active' },
            { id: 'ONBOARD', label: 'On Route' },
            { id: 'EXPECTED', label: 'Awaiting boarding' },
            { id: 'COMPLETED', label: 'Arrived' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              style={{
                padding: '5px 10px',
                borderRadius: radii.sm,
                border: statusFilter === tab.id ? `1px solid ${colors.primary}` : `1px solid ${colors.border}`,
                backgroundColor: statusFilter === tab.id ? colors.primaryLight : colors.card,
                color: statusFilter === tab.id ? colors.primary : colors.textSecondary,
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Journeys List */}
      {loadError && (
        <div role="alert" style={{ padding: 14, borderRadius: radii.md, border: `1px solid ${colors.dangerBorder}`, background: colors.dangerLight, color: colors.danger }}>
          Journey records could not be loaded: {loadError}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {isLoading && <p role="status" style={{ color: colors.textSecondary }}>Loading journey records…</p>}
        {filtered.map((j) => (
          <div
            key={j.id}
            onClick={() => navigate(`/journeys/${j.tripId}`)}
            style={{
              backgroundColor: colors.card,
              borderRadius: radii.md,
              border: `1px solid ${colors.border}`,
              padding: '16px 20px',
              boxShadow: shadows.sm,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              cursor: 'pointer',
              transition: 'border-color 0.15s ease',
            }}
          >
            {/* Row 1: Student info & Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                  <div style={{ fontSize: '15px', fontWeight: 800, color: colors.textPrimary }}>
                    {j.studentName}
                  </div>
                  <div style={{ fontSize: '11px', color: colors.textSecondary }}>
                    {j.className} &bull; Admission: {j.admissionNumber}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: colors.primary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock3 size={12} strokeWidth={2} />
                  <span>ETA: {j.eta}</span>
                </span>
                <StatusBadge
                  type={j.status === 'COMPLETED' ? 'success' : j.status === 'ONBOARD' ? 'info' : 'neutral'}
                  label={j.statusLabel}
                />
              </div>
            </div>

            {/* Row 2: Commute Corridor Path (Student -> Bus -> Location -> Next -> Destination) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                backgroundColor: colors.bg,
                borderRadius: radii.sm,
                border: `1px solid ${colors.borderLight}`,
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '9px', color: colors.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Assigned Bus</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                  <BusFront size={12} strokeWidth={2} color={colors.primary} />
                  <span>{j.busNumber}</span>
                </span>
              </div>

              <div style={{ color: colors.textMuted, fontSize: '12px' }}>&rarr;</div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '9px', color: colors.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Assigned Route</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: colors.textPrimary, marginTop: '1px' }}>{j.routeName}</span>
              </div>

              <div style={{ color: colors.textMuted, fontSize: '12px' }}>&rarr;</div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '9px', color: colors.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Current Position</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: colors.primary, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                  <MapPin size={11} strokeWidth={2} />
                  <span>{j.currentLocation}</span>
                </span>
              </div>

              <div style={{ color: colors.textMuted, fontSize: '12px' }}>&rarr;</div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '9px', color: colors.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Destination</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: colors.success, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                  <School size={12} strokeWidth={2} />
                  <span>{j.destination}</span>
                </span>
              </div>
            </div>

            {/* Row 3: Footer details & Passport trigger */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: colors.textSecondary }}>
              <span>Boarding event: <strong>{j.boardedAt}</strong> &bull; ETA: unavailable</span>
              <span style={{ fontWeight: 700, color: colors.primary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>View Journey Passport</span>
                <ArrowRight size={12} strokeWidth={2} />
              </span>
            </div>
          </div>
        ))}
        {!isLoading && !loadError && filtered.length === 0 && (
          <p style={{ padding: 24, textAlign: 'center', color: colors.textSecondary }}>
            No journey records match this filter. A GPS location or bus arrival does not by itself confirm a student exit.
          </p>
        )}
      </div>
    </div>
  );
};
