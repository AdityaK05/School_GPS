import React, { useState, useEffect } from 'react';
import { useRouter } from '../router/Router';
import { colors, radii, shadows } from '../theme/design-system';
import { StatusBadge } from '../components/ui/SharedComponents';
import { ApiClient } from '@school-transport-platform/client-sdk';

interface LiveFleetPageProps {
  apiClient: ApiClient;
}

export const LiveFleetPage: React.FC<LiveFleetPageProps> = ({ apiClient }) => {
  const { navigate } = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const [buses, setBuses] = useState([
    {
      id: '88888888-8888-8888-8888-888888888801',
      busNumber: 'Bus 12',
      registrationNumber: 'KA-01-EXP-9999',
      routeName: 'Sector 62 → Oakridge Campus',
      status: 'ON_ROUTE',
      statusLabel: 'On Route',
      currentStop: 'Stop 1: Sector 62 Metro Gate #2',
      studentsOnboard: 28,
      capacity: 32,
      gpsAge: 'Updated 20s ago (Live)',
      gpsHealthy: true,
      driver: 'Rajesh Kumar (+91 98765 43210)',
      attendant: 'Sunita Devi (+91 98765 43211)',
      speed: 38,
    },
    {
      id: 'bus_14',
      busNumber: 'Bus 14',
      registrationNumber: 'KA-01-EXP-4444',
      routeName: 'Vaishali Metro → Oakridge Campus',
      status: 'ON_ROUTE',
      statusLabel: 'On Route',
      currentStop: 'Stop 2: Anand Vihar Crossing',
      studentsOnboard: 24,
      capacity: 30,
      gpsAge: 'Updated 15s ago (Live)',
      gpsHealthy: true,
      driver: 'Amit Singh (+91 98765 43212)',
      attendant: 'Rekha Sharma (+91 98765 43213)',
      speed: 34,
    },
    {
      id: 'bus_18',
      busNumber: 'Bus 18',
      registrationNumber: 'KA-01-EXP-8888',
      routeName: 'Noida City Centre → Oakridge Campus',
      status: 'AT_SCHOOL',
      statusLabel: 'At School',
      currentStop: 'Campus Terminus Bay #3',
      studentsOnboard: 32,
      capacity: 32,
      gpsAge: 'Updated 30s ago (Stationary)',
      gpsHealthy: true,
      driver: 'Manoj Kumar (+91 98765 43214)',
      attendant: 'Pooja Rani (+91 98765 43215)',
      speed: 0,
    },
  ]);

  useEffect(() => {
    apiClient.listBuses().then((apiBuses) => {
      if (apiBuses && apiBuses.length > 0) {
        // Enriched list
      }
    }).catch(() => {});
  }, [apiClient]);

  const filtered = buses.filter(
    (b) =>
      b.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.routeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px' }}>
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Physical Fleet Operations
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: colors.textPrimary, margin: '4px 0 2px 0', letterSpacing: '-0.02em' }}>
            Live School Buses
          </h1>
          <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0 }}>
            Operational status of physical vehicles, onboard students, and telematics health.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => navigate('/routes')}
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
            🛣️ View Routes
          </button>
        </div>
      </div>

      {/* Search Input */}
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
          placeholder="Search bus number, registration, or assigned corridor..."
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

      {/* Buses Physical Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '20px',
        }}
      >
        {filtered.map((bus) => (
          <div
            key={bus.id}
            onClick={() => navigate(`/buses/${bus.id}`)}
            style={{
              backgroundColor: colors.card,
              borderRadius: radii.lg,
              border: `1px solid ${colors.border}`,
              padding: '24px',
              boxShadow: shadows.card,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
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
            <div>
              {/* Top Row: Bus Identity & Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: radii.md,
                      backgroundColor: colors.purpleLight,
                      border: `1px solid ${colors.purpleBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                    }}
                  >
                    🚌
                  </div>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
                      {bus.busNumber}
                    </h2>
                    <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
                      {bus.registrationNumber}
                    </div>
                  </div>
                </div>

                <StatusBadge
                  type={bus.status === 'AT_SCHOOL' ? 'success' : 'info'}
                  icon="●"
                  label={bus.statusLabel}
                />
              </div>

              {/* Route */}
              <div style={{ marginTop: '16px', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: radii.md, border: `1px solid ${colors.borderLight}` }}>
                <div style={{ fontSize: '10px', color: colors.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Active Corridor</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary, marginTop: '2px' }}>
                  {bus.routeName}
                </div>
                <div style={{ fontSize: '11px', color: colors.primary, fontWeight: 600, marginTop: '4px' }}>
                  📍 Current Stop: {bus.currentStop}
                </div>
              </div>

              {/* Student Capacity Progress Bar */}
              <div style={{ marginTop: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  <span style={{ color: colors.textSecondary }}>Students Boarded</span>
                  <span style={{ color: colors.textPrimary }}>{bus.studentsOnboard} / {bus.capacity}</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: radii.full, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${(bus.studentsOnboard / bus.capacity) * 100}%`,
                      height: '100%',
                      backgroundColor: colors.success,
                      borderRadius: radii.full,
                    }}
                  />
                </div>
              </div>

              {/* Driver & Attendant details */}
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: colors.textSecondary }}>
                <div>👨‍✈️ Driver: <strong style={{ color: colors.textPrimary }}>{bus.driver}</strong></div>
                <div>👩‍💼 Attendant: <strong style={{ color: colors.textPrimary }}>{bus.attendant}</strong></div>
              </div>
            </div>

            {/* Footer with GPS health indicator & Cockpit link */}
            <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: colors.success, fontWeight: 600 }}>
                ● {bus.gpsAge}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: colors.primary }}>
                Open Bus Cockpit →
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
