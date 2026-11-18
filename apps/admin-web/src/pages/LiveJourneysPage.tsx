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

export const LiveJourneysPage: React.FC<LiveJourneysPageProps> = ({ apiClient }) => {
  const { navigate } = useRouter();
  const { colors } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BOARDED' | 'ONBOARD' | 'COMPLETED'>('ALL');

  const [journeys] = useState([
    {
      id: 'c1111111-1111-1111-1111-111111111101',
      studentName: 'Aarav Sharma',
      className: 'Class 7-B',
      admissionNumber: 'ADM-2024-001',
      busNumber: 'Bus 12',
      busReg: 'UP-16-BT-9912',
      currentLocation: 'Sector 61 Crossing',
      currentStop: 'Sector 62 Metro Gate #2',
      nextStop: 'Fortis Hospital Crossing',
      destination: 'Oakridge Campus',
      status: 'ONBOARD',
      statusLabel: 'On the way',
      eta: '8 min',
      boardedAt: '07:42 AM',
      driver: 'Rajesh Kumar',
    },
    {
      id: 'c1111111-1111-1111-1111-111111111102',
      studentName: 'Diya Sharma',
      className: 'Class 2-B',
      admissionNumber: 'ADM-2024-002',
      busNumber: 'Bus 12',
      busReg: 'UP-16-BT-9912',
      currentLocation: 'Sector 62 Corridor',
      currentStop: 'Shipra Sun City Gate #4',
      nextStop: 'Indirapuram Habitat Centre',
      destination: 'Oakridge Campus',
      status: 'BOARDED',
      statusLabel: 'Boarded',
      eta: '14 min',
      boardedAt: '07:48 AM',
      driver: 'Rajesh Kumar',
    },
    {
      id: 'c1111111-1111-1111-1111-111111111104',
      studentName: 'Ananya Verma',
      className: 'Class 5-A',
      admissionNumber: 'ADM-2024-004',
      busNumber: 'Bus 14',
      busReg: 'UP-16-BT-9908',
      currentLocation: 'Ring Road Corridor',
      currentStop: 'Vaishali Metro Station',
      nextStop: 'Anand Vihar Flyover',
      destination: 'Oakridge Campus',
      status: 'ONBOARD',
      statusLabel: 'On the way',
      eta: '11 min',
      boardedAt: '07:35 AM',
      driver: 'Amit Singh',
    },
    {
      id: 'c1111111-1111-1111-1111-111111111105',
      studentName: 'Rohan Gupta',
      className: 'Class 8-C',
      admissionNumber: 'ADM-2024-005',
      busNumber: 'Bus 08',
      busReg: 'UP-16-BT-9904',
      currentLocation: 'Campus Gate #1',
      currentStop: 'Oakridge Campus Terminus',
      nextStop: 'Completed',
      destination: 'Oakridge Campus',
      status: 'COMPLETED',
      statusLabel: 'Arrived at School',
      eta: 'Arrived',
      boardedAt: '07:20 AM',
      driver: 'Manoj Kumar',
    },
  ]);

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
            { id: 'BOARDED', label: 'Boarded' },
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map((j) => (
          <div
            key={j.id}
            onClick={() => navigate(`/journeys/${j.id}`)}
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
                <span style={{ fontSize: '9px', color: colors.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Boarded Stop</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: colors.textPrimary, marginTop: '1px' }}>{j.currentStop}</span>
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
              <span>Boarded at: <strong>{j.boardedAt}</strong> &bull; Driver: {j.driver}</span>
              <span style={{ fontWeight: 700, color: colors.primary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>View Journey Passport</span>
                <ArrowRight size={12} strokeWidth={2} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
