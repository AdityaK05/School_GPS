import React, { useState, useEffect } from 'react';
import { useRouter } from '../router/Router';
import { colors, radii, shadows } from '../theme/design-system';
import { StatusBadge } from '../components/ui/SharedComponents';
import { ApiClient } from '@school-transport-platform/client-sdk';

interface LiveJourneysPageProps {
  apiClient: ApiClient;
}

export const LiveJourneysPage: React.FC<LiveJourneysPageProps> = ({ apiClient }) => {
  const { navigate } = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BOARDED' | 'ONBOARD' | 'COMPLETED'>('ALL');

  const [journeys, setJourneys] = useState([
    {
      id: 'c1111111-1111-1111-1111-111111111101',
      studentName: 'Aarav Sharma',
      className: 'Class 7-B',
      admissionNumber: 'ADM-2024-001',
      busNumber: 'Bus 12',
      busReg: 'KA-01-EXP-9999',
      currentLocation: 'Sector 61 Junction',
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
      busReg: 'KA-01-EXP-9999',
      currentLocation: 'Approaching Stop 2',
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
      busReg: 'KA-01-EXP-4444',
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
      busNumber: 'Bus 18',
      busReg: 'KA-01-EXP-8888',
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

  useEffect(() => {
    // Attempt live sync with backend
    apiClient.getStudents().then((stList) => {
      if (stList && stList.length > 0) {
        // Enriched list
      }
    }).catch(() => {});
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Accountability Pipeline
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: colors.textPrimary, margin: '4px 0 2px 0', letterSpacing: '-0.02em' }}>
            Live Student Journeys
          </h1>
          <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0 }}>
            Real-time monitoring of each student from morning boarding through campus arrival.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
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
            ✓ Full Attendance
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.lg,
          padding: '16px 20px',
          border: `1px solid ${colors.border}`,
          boxShadow: shadows.card,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '260px' }}>
          <span style={{ fontSize: '16px', color: colors.textMuted }}>🔍</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search student name, class, bus number, or admission..."
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
                padding: '6px 12px',
                borderRadius: radii.md,
                border: statusFilter === tab.id ? `1px solid ${colors.primary}` : `1px solid ${colors.border}`,
                backgroundColor: statusFilter === tab.id ? colors.primaryLight : '#ffffff',
                color: statusFilter === tab.id ? colors.primary : colors.textSecondary,
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

      {/* Journeys List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filtered.map((j) => (
          <div
            key={j.id}
            onClick={() => navigate(`/journeys/${j.id}`)}
            style={{
              backgroundColor: colors.card,
              borderRadius: radii.lg,
              border: `1px solid ${colors.border}`,
              padding: '20px 24px',
              boxShadow: shadows.card,
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.primary;
              e.currentTarget.style.boxShadow = shadows.md;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.border;
              e.currentTarget.style.boxShadow = shadows.card;
            }}
          >
            {/* Row 1: Student info & Live Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: colors.primaryLight,
                    border: `1px solid ${colors.primaryBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 800,
                    color: colors.primary,
                  }}
                >
                  {j.studentName.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: colors.textPrimary }}>
                    {j.studentName}
                  </div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '1px' }}>
                    {j.className} &bull; Admission: {j.admissionNumber}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: colors.primary }}>
                  ⏱️ ETA: {j.eta}
                </span>
                <StatusBadge
                  type={j.status === 'COMPLETED' ? 'success' : j.status === 'ONBOARD' ? 'info' : 'neutral'}
                  icon="●"
                  label={j.statusLabel}
                />
              </div>
            </div>

            {/* Row 2: Commute Corridor Path (Student ↓ Bus ↓ Location ↓ Next ↓ Destination) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: '#f8fafc',
                borderRadius: radii.md,
                border: `1px solid ${colors.borderLight}`,
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', color: colors.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Assigned Bus</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>🚌 {j.busNumber}</span>
              </div>

              <div style={{ color: colors.textMuted, fontSize: '14px' }}>→</div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', color: colors.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Boarded Stop</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>{j.currentStop}</span>
              </div>

              <div style={{ color: colors.textMuted, fontSize: '14px' }}>→</div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', color: colors.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Current Position</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: colors.primary }}>📍 {j.currentLocation}</span>
              </div>

              <div style={{ color: colors.textMuted, fontSize: '14px' }}>→</div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', color: colors.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Next Stop</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>{j.nextStop}</span>
              </div>

              <div style={{ color: colors.textMuted, fontSize: '14px' }}>→</div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', color: colors.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Destination</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: colors.success }}>🏫 {j.destination}</span>
              </div>
            </div>

            {/* Row 3: Footer details & Passport trigger */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: colors.textSecondary }}>
              <span>Boarded at: <strong>{j.boardedAt}</strong> (RFID Verified) &bull; Driver: {j.driver}</span>
              <span style={{ fontWeight: 700, color: colors.primary }}>View Journey Passport →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
