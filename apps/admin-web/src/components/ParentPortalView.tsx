import React, { useState } from 'react';
import { InteractiveMap, MapMarker } from './InteractiveMap';
import { JourneyState } from '@school-transport-platform/shared-types';

export const ParentPortalView: React.FC = () => {
  const [selectedChild, setSelectedChild] = useState<'aarav' | 'diya'>('aarav');
  const [activeTab, setActiveTab] = useState<'tracking' | 'history' | 'notifications'>('tracking');

  const childrenData = {
    aarav: {
      name: 'Aarav Sharma',
      admission: 'ADM-2024-001',
      className: 'Grade 5-A',
      busNumber: 'Bus 12 (KA-01-EXP-9999)',
      driver: 'Rajesh Kumar (+91 98765 43210)',
      routeName: 'North Corridor Express',
      stopName: 'Sector 62 Metro Gate #2',
      etaMinutes: 12,
      state: 'ONBOARD' as JourneyState,
      safetyStatus: 'VERIFIED' as const,
      speed: 42,
      location: { latitude: 12.9716, longitude: 77.5946, isLive: true },
    },
    diya: {
      name: 'Diya Sharma',
      admission: 'ADM-2024-002',
      className: 'Grade 2-B',
      busNumber: 'Bus 08 (KA-01-EXP-8888)',
      driver: 'Sunil Verma (+91 98765 12345)',
      routeName: 'East Wing Shuttle',
      stopName: 'Park Avenue Block B',
      etaMinutes: 24,
      state: 'EXPECTED' as JourneyState,
      safetyStatus: 'VERIFIED' as const,
      speed: 0,
      location: { latitude: 12.9650, longitude: 77.5850, isLive: true },
    },
  };

  const current = childrenData[selectedChild];

  const mapMarkers: MapMarker[] = [
    {
      id: `bus_${selectedChild}`,
      label: current.busNumber,
      latitude: current.location.latitude,
      longitude: current.location.longitude,
      type: 'bus',
      speed: current.speed,
      isLive: current.location.isLive,
    },
  ];

  const steps = [
    { state: 'EXPECTED', label: 'Scheduled' },
    { state: 'BOARDED', label: 'Boarded' },
    { state: 'ONBOARD', label: 'In Transit' },
    { state: 'EXIT_PENDING', label: 'At Stop' },
    { state: 'EXIT_RECORDED', label: 'Exited' },
    { state: 'COMPLETED', label: 'Completed' },
  ];

  const stepIndex = steps.findIndex((s) => s.state === current.state);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Top Header & Child Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Aegis Parent Guardian Portal
          </span>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff', margin: '4px 0 0 0', letterSpacing: '-0.02em' }}>
            Live Student Transit Tracking
          </h2>
          <p style={{ fontSize: '14px', color: '#71717a', margin: '4px 0 0 0' }}>
            Real-time child whereabouts, 60s GPS telematics, and RFID boarding verification.
          </p>
        </div>

        {/* Multi-Child Switcher Buttons */}
        <div style={{ display: 'flex', gap: '10px', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '6px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <button
            onClick={() => setSelectedChild('aarav')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: selectedChild === 'aarav' ? '1px solid #38bdf8' : 'none',
              backgroundColor: selectedChild === 'aarav' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: selectedChild === 'aarav' ? '#38bdf8' : '#a1a1aa',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>👦</span> Aarav (Grade 5)
          </button>
          <button
            onClick={() => setSelectedChild('diya')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: selectedChild === 'diya' ? '1px solid #38bdf8' : 'none',
              backgroundColor: selectedChild === 'diya' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: selectedChild === 'diya' ? '#38bdf8' : '#a1a1aa',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>👧</span> Diya (Grade 2)
          </button>
        </div>
      </div>

      {/* Hero Child Telematics Card */}
      <div
        style={{
          padding: '24px',
          borderRadius: '16px',
          backgroundColor: '#0c121e',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
        }}
      >
        <div>
          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Enrolled Student</span>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>{current.name}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{current.admission} • {current.className}</div>
        </div>

        <div>
          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Assigned Transport</span>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>{current.busNumber}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Driver: {current.driver}</div>
        </div>

        <div>
          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Assigned Stop</span>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>{current.stopName}</div>
          <div style={{ fontSize: '12px', color: '#10b981', marginTop: '2px', fontWeight: 600 }}>Estimated Arrival: ~{current.etaMinutes} min</div>
        </div>

        <div>
          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Safety Verification</span>
          <div style={{ marginTop: '4px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid #10b981',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              VERIFIED ONBOARD
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>Telemetry: Live GPS (Speed: {current.speed} km/h)</div>
        </div>
      </div>

      {/* Interactive Live Map for Child's Bus */}
      <InteractiveMap markers={mapMarkers} height="420px" />

      {/* Journey Progression Bar */}
      <div
        style={{
          padding: '20px 24px',
          borderRadius: '16px',
          backgroundColor: '#0c121e',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Active Commute Pipeline</span>
          <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600 }}>
            Current Status: <strong>{steps[stepIndex]?.label || current.state}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {steps.map((st, i) => {
            const isDone = i <= stepIndex;
            const isCurrent = i === stepIndex;
            return (
              <div
                key={st.state}
                style={{
                  flex: 1,
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: isCurrent ? '#38bdf8' : isDone ? '#10b981' : '#1e293b',
                  transition: 'background-color 0.3s ease',
                }}
                title={st.label}
              />
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: '#64748b' }}>
          <span>Scheduled Pickup</span>
          <span style={{ color: '#38bdf8', fontWeight: 600 }}>In Transit Corridor</span>
          <span>School Arrival</span>
        </div>
      </div>
    </div>
  );
};
