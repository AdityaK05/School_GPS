import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { Bus, GPSLocation } from '@school-transport-platform/shared-types';

interface LiveFleetPageProps {
  apiClient: ApiClient;
}

export const LiveFleetPage: React.FC<LiveFleetPageProps> = ({ apiClient }) => {
  const { navigate } = useRouter();
  const { colors } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');

  type FleetBus = Bus & { latestLocation?: GPSLocation | null };
  type FleetTrip = { busId: string; routeName: string; status: string; boardedCount: number; exitedCount: number };
  type FleetRow = FleetBus & {
    routeName: string;
    tripInProgress: boolean;
    studentsOnboard: number;
    lastUpdate: string;
  };
  const [buses, setBuses] = useState<FleetRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([apiClient.listBuses(), apiClient.listTrips()])
      .then(([busItems, tripItems]) => {
        if (!active) return;
        const trips = tripItems as FleetTrip[];
        const now = Date.now();
        setBuses((busItems as FleetBus[]).map((bus) => {
          const trip = trips.find((candidate) =>
            candidate.busId === bus.id && ['STARTED', 'IN_PROGRESS'].includes(candidate.status)
          );
          const recordedAt = bus.latestLocation?.recordedAt;
          const ageSeconds = recordedAt ? Math.max(0, Math.floor((now - new Date(recordedAt).getTime()) / 1000)) : null;
          return {
            ...bus,
            routeName: trip?.routeName || 'No active trip',
            tripInProgress: Boolean(trip),
            studentsOnboard: trip ? Math.max(0, trip.boardedCount - trip.exitedCount) : 0,
            lastUpdate: ageSeconds === null ? 'No GPS update recorded' : `GPS update ${ageSeconds}s ago`,
          };
        }));
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : 'Fleet data could not be loaded.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [apiClient]);

  const filtered = buses.filter(
    (b) =>
      (b.fleetNumber || b.busNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.registrationNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
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

      {loadError && (
        <div role="alert" style={{ padding: 14, borderRadius: radii.md, border: `1px solid ${colors.dangerBorder}`, background: colors.dangerLight, color: colors.danger }}>
          Fleet data could not be loaded: {loadError}
        </div>
      )}
      {/* Buses Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '18px',
        }}
      >
        {isLoading && <p role="status" style={{ color: colors.textSecondary }}>Loading fleet data…</p>}
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
                      {bus.fleetNumber || bus.busNumber || 'Bus'}
                    </h2>
                    <div style={{ fontSize: '11px', color: colors.textSecondary }}>
                      {bus.registrationNumber || 'Registration not recorded'}
                    </div>
                  </div>
                </div>

                <StatusBadge
                  type={bus.tripInProgress ? 'info' : bus.status === 'ACTIVE' ? 'neutral' : 'warning'}
                  label={bus.tripInProgress ? 'Trip in progress' : bus.status}
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
                  <span>
                    {bus.latestLocation
                      ? `GPS: ${bus.latestLocation.latitude.toFixed(5)}, ${bus.latestLocation.longitude.toFixed(5)}`
                      : 'No GPS location available'}
                  </span>
                </div>
              </div>

              {/* Student Capacity (Section 26: "28 / 32 students onboard") */}
              <div style={{ marginTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  <span style={{ color: colors.textSecondary }}>Onboard</span>
                  <span style={{ color: colors.textPrimary, fontWeight: 700 }}>{bus.studentsOnboard} / {bus.capacity} confirmed onboard</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: colors.borderLight, borderRadius: radii.full, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${bus.capacity > 0 ? Math.min(100, (bus.studentsOnboard / bus.capacity) * 100) : 0}%`,
                      height: '100%',
                      backgroundColor: colors.success,
                      borderRadius: radii.full,
                    }}
                  />
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
        {!isLoading && !loadError && filtered.length === 0 && (
          <p style={{ padding: 24, textAlign: 'center', color: colors.textSecondary }}>No buses match this search.</p>
        )}
      </div>
    </div>
  );
};
