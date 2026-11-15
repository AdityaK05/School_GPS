import React from 'react';

export interface OverviewMetrics {
  activeBuses: number;
  totalStudents: number;
  studentsOnboard: number;
  openExceptions: number;
  gpsOnlineCount: number;
  gpsStaleCount: number;
}

export const DashboardOverview: React.FC<{ metrics: OverviewMetrics }> = ({ metrics }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
      {/* Title Header */}
      <div>
        <h2
          style={{
            fontSize: '1.75rem',
            fontWeight: 600,
            color: '#ffffff',
            letterSpacing: '-0.03em',
            margin: 0,
          }}
        >
          Operations Overview
        </h2>
        <p
          style={{
            fontSize: '0.875rem',
            color: '#71717a',
            marginTop: '6px',
            lineHeight: 1.5,
          }}
        >
          Live vehicle telematics, passenger accountability manifests, and automated safety enforcement.
        </p>
      </div>

      {/* Primary KPI Grid (Flagship Minimalist Glass Cards) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Card 1: Active Buses */}
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '26px 24px',
            transition: 'border-color 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#71717a' }}>
              Active Buses
            </span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#71717a"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <circle cx="7" cy="18" r="2" />
              <circle cx="17" cy="18" r="2" />
              <path d="M6 12h12" />
            </svg>
          </div>
          <div
            style={{
              marginTop: '16px',
              fontSize: '2.5rem',
              fontWeight: 600,
              color: '#ffffff',
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}
          >
            {metrics.activeBuses}
          </div>
          <div
            style={{
              marginTop: '10px',
              fontSize: '0.75rem',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span>Vehicles on active transit</span>
          </div>
        </div>

        {/* Card 2: Total Students */}
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '26px 24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#71717a' }}>
              Total Students
            </span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#71717a"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div
            style={{
              marginTop: '16px',
              fontSize: '2.5rem',
              fontWeight: 600,
              color: '#ffffff',
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}
          >
            {metrics.totalStudents}
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#71717a' }}>
            Enrolled transport roster
          </div>
        </div>

        {/* Card 3: Students Onboard */}
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '26px 24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#71717a' }}>
              Students Onboard
            </span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#71717a"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div
            style={{
              marginTop: '16px',
              fontSize: '2.5rem',
              fontWeight: 600,
              color: '#34d399',
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}
          >
            {metrics.studentsOnboard}
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#71717a' }}>
            Confirmed via RFID tap
          </div>
        </div>

        {/* Card 4: Safety Exceptions */}
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: metrics.openExceptions > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
            padding: '26px 24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#71717a' }}>
              Safety Exceptions
            </span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={metrics.openExceptions > 0 ? '#f87171' : '#71717a'}
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div
            style={{
              marginTop: '16px',
              fontSize: '2.5rem',
              fontWeight: 600,
              color: metrics.openExceptions > 0 ? '#f87171' : '#ffffff',
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}
          >
            {metrics.openExceptions}
          </div>
          <div
            style={{
              marginTop: '10px',
              fontSize: '0.75rem',
              color: metrics.openExceptions > 0 ? '#f87171' : '#71717a',
            }}
          >
            {metrics.openExceptions > 0 ? 'Action required in triage' : 'Zero safety exceptions'}
          </div>
        </div>
      </div>

      {/* Secondary Status & Telematics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px',
        }}
      >
        {/* GPS Telematics Status */}
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '28px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', margin: 0, letterSpacing: '-0.01em' }}>
                Telemetry &amp; GPS Freshness
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#71717a', marginTop: '4px', margin: 0 }}>
                Continuous vehicle polling with 60s freshness gate
              </p>
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                padding: '4px 10px',
                borderRadius: '9999px',
                backgroundColor: metrics.gpsStaleCount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.08)',
                color: metrics.gpsStaleCount > 0 ? '#f87171' : '#34d399',
                border: metrics.gpsStaleCount > 0 ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              {metrics.gpsStaleCount > 0 ? `${metrics.gpsStaleCount} Delayed` : 'Healthy (<60s)'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.015)',
                borderRadius: '12px',
                padding: '18px 20px',
                border: '1px solid rgba(255, 255, 255, 0.04)',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#71717a' }}>LIVE TRACKING</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 600, color: '#10b981', marginTop: '6px' }}>
                {metrics.gpsOnlineCount}
              </div>
            </div>
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.015)',
                borderRadius: '12px',
                padding: '18px 20px',
                border: '1px solid rgba(255, 255, 255, 0.04)',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#71717a' }}>STALE TELEMETRY</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 600, color: metrics.gpsStaleCount > 0 ? '#ef4444' : '#52525b', marginTop: '6px' }}>
                {metrics.gpsStaleCount}
              </div>
            </div>
          </div>
        </div>

        {/* Real-Time Safety Rules Status */}
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '28px',
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff', margin: 0, letterSpacing: '-0.01em' }}>
              Safety Enforcement Engine
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#71717a', marginTop: '4px', margin: 0 }}>
              Deterministic real-time verification rules
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { label: 'Wrong Bus Interception', detail: 'Real-time card cross-check' },
              { label: 'Missing Exit at Terminus', detail: '5-minute grace period trigger' },
              { label: 'Dual-Clock Ingestion', detail: 'Device vs server timestamp audit' },
              { label: 'Append-Only Ledger', detail: 'Cryptographic immutable events' },
            ].map((rule, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: idx < 3 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8125rem', color: '#e4e4e7', fontWeight: 500 }}>{rule.label}</div>
                  <div style={{ fontSize: '0.725rem', color: '#52525b', marginTop: '2px' }}>{rule.detail}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                  <span style={{ color: '#10b981', fontWeight: 500, fontSize: '0.75rem' }}>Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
