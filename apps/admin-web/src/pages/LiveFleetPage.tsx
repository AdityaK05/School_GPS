import React, { useState } from 'react';
import { useRouter } from '../router/Router';
import { useTheme } from '../theme/ThemeContext';
import { radii, shadows } from '../theme/design-system';
import { StatusBadge } from '../components/ui/SharedComponents';
import { ApiClient } from '@school-transport-platform/client-sdk';
import {
  BusFront,
  Search,
  Map,
  ArrowRight,
  MapPin,
  Clock3,
  Phone,
  UserCheck,
} from 'lucide-react';

interface LiveFleetPageProps {
  apiClient: ApiClient;
}

export const LiveFleetPage: React.FC<LiveFleetPageProps> = ({ apiClient }) => {
  const { navigate } = useRouter();
  const { colors } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');

  const [buses] = useState([
    {
      id: '88888888-8888-8888-8888-888888888801',
      busNumber: 'BUS 12',
      registrationNumber: 'UP-16-BT-9912',
      routeName: 'Sector 62 → Oakridge Campus',
      status: 'ON_ROUTE',
      statusLabel: 'On route',
      currentStop: 'Sector 62 Metro Gate #2',
      studentsOnboard: 28,
      capacity: 32,
      lastUpdate: 'Updated 32 sec ago',
      driver: 'Rajesh Kumar (+91 98765 43210)',
      attendant: 'Sunita Devi (+91 98765 43211)',
      speed: 38,
    },
    {
      id: 'bus_14',
      busNumber: 'BUS 14',
      registrationNumber: 'UP-16-BT-9908',
      routeName: 'Vaishali Metro → Oakridge Campus',
      status: 'ON_ROUTE',
      statusLabel: 'On route',
      currentStop: 'Anand Vihar Crossing',
      studentsOnboard: 24,
      capacity: 30,
      lastUpdate: 'Updated 20 sec ago',
      driver: 'Amit Singh (+91 98765 43212)',
      attendant: 'Rekha Sharma (+91 98765 43213)',
      speed: 34,
    },
    {
      id: 'bus_18',
      busNumber: 'BUS 18',
      registrationNumber: 'UP-16-BT-9904',
      routeName: 'Noida City Centre → Oakridge Campus',
      status: 'AT_SCHOOL',
      statusLabel: 'At school',
      currentStop: 'Campus Terminus Bay #3',
      studentsOnboard: 32,
      capacity: 32,
      lastUpdate: 'Updated 1 min ago',
      driver: 'Manoj Kumar (+91 98765 43214)',
      attendant: 'Pooja Rani (+91 98765 43215)',
      speed: 0,
    },
  ]);

  const filtered = buses.filter(
    (b) =>
      b.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.routeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px' }}>
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Transport Fleet
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: colors.textPrimary, margin: '4px 0 2px 0', letterSpacing: '-0.02em' }}>
            Buses
          </h1>
          <p style={{ fontSize: '13px', color: colors.textSecondary, margin: 0 }}>
            Active buses, onboard passenger counts, and route progress.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => navigate('/routes')}
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
            <Map size={14} strokeWidth={2} />
            <span>Routes</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div
        style={{
          backgroundColor: colors.card,
          borderRadius: radii.md,
          padding: '12px 16px',
          border: `1px solid ${colors.border}`,
          boxShadow: shadows.sm,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <Search size={16} strokeWidth={2} color={colors.textMuted} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search bus number, registration, or route..."
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

      {/* Buses Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '18px',
        }}
      >
        {filtered.map((bus) => (
          <div
            key={bus.id}
            onClick={() => navigate(`/buses/${bus.id}`)}
            style={{
              backgroundColor: colors.card,
              borderRadius: radii.md,
              border: `1px solid ${colors.border}`,
              padding: '20px',
              boxShadow: shadows.sm,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'border-color 0.15s ease',
            }}
          >
            <div>
              {/* Top Row: Bus Identity & Status (Section 26) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: radii.sm,
                      backgroundColor: colors.primaryLight,
                      border: `1px solid ${colors.primaryBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.primary,
                    }}
                  >
                    <BusFront size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '17px', fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
                      {bus.busNumber}
                    </h2>
                    <div style={{ fontSize: '11px', color: colors.textSecondary }}>
                      {bus.registrationNumber}
                    </div>
                  </div>
                </div>

                <StatusBadge
                  type={bus.status === 'AT_SCHOOL' ? 'success' : 'info'}
                  label={bus.statusLabel}
                />
              </div>

              {/* Route */}
              <div style={{ marginTop: '14px', padding: '10px 12px', backgroundColor: colors.bg, borderRadius: radii.sm, border: `1px solid ${colors.borderLight}` }}>
                <div style={{ fontSize: '10px', color: colors.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Route</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary, marginTop: '2px' }}>
                  {bus.routeName}
                </div>
                <div style={{ fontSize: '11px', color: colors.primary, fontWeight: 600, marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={11} strokeWidth={2} />
                  <span>Current Stop: {bus.currentStop}</span>
                </div>
              </div>

              {/* Student Capacity (Section 26: "28 / 32 students onboard") */}
              <div style={{ marginTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  <span style={{ color: colors.textSecondary }}>Onboard</span>
                  <span style={{ color: colors.textPrimary, fontWeight: 700 }}>{bus.studentsOnboard} / {bus.capacity} students onboard</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: colors.borderLight, borderRadius: radii.full, overflow: 'hidden' }}>
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

              {/* Personnel contacts */}
              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px', color: colors.textSecondary }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Phone size={11} strokeWidth={1.8} color={colors.textMuted} />
                  <span>Driver: <strong style={{ color: colors.textPrimary }}>{bus.driver}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <UserCheck size={11} strokeWidth={1.8} color={colors.textMuted} />
                  <span>Attendant: <strong style={{ color: colors.textPrimary }}>{bus.attendant}</strong></span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: colors.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock3 size={11} strokeWidth={2} />
                <span>{bus.lastUpdate}</span>
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: colors.primary, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span>Bus Details</span>
                <ArrowRight size={12} strokeWidth={2} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
