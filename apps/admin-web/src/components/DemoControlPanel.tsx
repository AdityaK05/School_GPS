import React, { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://school-gps-api.onrender.com';
const DEMO_TOKEN = 'test-token:22222222-2222-2222-2222-222222222222:SCHOOL_ADMIN:11111111-1111-1111-1111-111111111111';

interface DemoControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onActionComplete?: (actionName: string, result: any) => void;
}

export const DemoControlPanel: React.FC<DemoControlPanelProps> = ({
  isOpen,
  onClose,
  onActionComplete,
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [lastLog, setLastLog] = useState<{ message: string; type: 'success' | 'error' | 'info'; timestamp: string } | null>(null);

  if (!isOpen) return null;

  const executeApi = async (actionName: string, endpoint: string, method: string, payload?: any) => {
    setLoadingAction(actionName);
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEMO_TOKEN}`,
        },
        body: payload ? JSON.stringify(payload) : undefined,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || `API error ${res.status}`);
      }

      const log = {
        message: `Action [${actionName}] executed successfully.`,
        type: 'success' as const,
        timestamp: new Date().toLocaleTimeString(),
      };
      setLastLog(log);
      if (onActionComplete) onActionComplete(actionName, data);
    } catch (err: any) {
      console.error(`Demo action [${actionName}] error:`, err);
      setLastLog({
        message: `Action [${actionName}] failed: ${err.message}`,
        type: 'error' as const,
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setLoadingAction(null);
    }
  };

  // Helper to generate RFC4122 compliant UUID v4 for API idempotency keys
  const generateUuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

  // 1. Start Trip
  const handleStartTrip = () => {
    executeApi('Start Trip', '/api/v1/trips/88888888-8888-8888-8888-888888888801/start', 'POST');
  };

  // 2. Move Bus (Next GPS Telemetry Point)
  const handleMoveBus = (waypointIdx: number) => {
    const coords = [
      { lat: 28.6280, lng: 77.3649, speed: 38 }, // Stop 1: Sector 62
      { lat: 28.6320, lng: 77.3680, speed: 44 }, // Mid-corridor
      { lat: 28.6360, lng: 77.3715, speed: 32 }, // Stop 2: Shipra Sun City
      { lat: 28.6410, lng: 77.3780, speed: 41 }, // Stop 3: Indirapuram
      { lat: 28.6495, lng: 77.3890, speed: 0 },  // Terminus: Campus
    ];
    const pt = coords[waypointIdx] || coords[1];

    executeApi('Move Bus GPS', '/api/v1/gps/events', 'POST', {
      deviceId: 'GPS-BUS-12-TELT',
      latitude: pt.lat,
      longitude: pt.lng,
      speed: pt.speed,
      heading: 84.0,
      recordedAt: new Date().toISOString(),
    });
  };

  // 3. Reach Stop (Sector 62 Metro)
  const handleReachStop = () => {
    executeApi('Reach Stop (Sector 62)', '/api/v1/journey-events', 'POST', {
      tripId: '88888888-8888-8888-8888-888888888801',
      busId: '66666666-6666-6666-6666-666666666612',
      stopId: 'b1111111-1111-1111-1111-111111111101',
      eventType: 'BUS_REACHED_STOP',
      eventTimestamp: new Date().toISOString(),
      idempotencyKey: generateUuid(),
      source: 'GPS',
      deviceId: 'GPS-BUS-12-TELT',
    });
  };

  // 4. Simulate Boarding (Aarav Sharma)
  const handleSimulateBoardingAarav = () => {
    executeApi('RFID Boarding: Aarav', '/api/v1/rfid/scan', 'POST', {
      cardId: 'CARD-AARAV-01',
      readerHardwareId: 'RFID-BUS-12-GATE',
      tripId: '88888888-8888-8888-8888-888888888801',
    });
  };

  // 5. Simulate Exit (Aarav Sharma)
  const handleSimulateExitAarav = () => {
    executeApi('RFID Exit: Aarav', '/api/v1/rfid/scan', 'POST', {
      cardId: 'CARD-AARAV-01',
      readerHardwareId: 'RFID-BUS-12-GATE',
      tripId: '88888888-8888-8888-8888-888888888801',
    });
  };

  // 6. Trigger Exception: WRONG_BUS (Kabir scans on Bus 12)
  const handleWrongBusTest = () => {
    executeApi('Trigger WRONG_BUS Exception', '/api/v1/rfid/scan', 'POST', {
      cardId: 'CARD-KABIR-99', // Kabir is assigned to Bus 08, not Bus 12!
      readerHardwareId: 'RFID-BUS-12-GATE',
      tripId: '88888888-8888-8888-8888-888888888801',
    });
  };

  // 7. Trigger Exception: EXIT_MISSING
  const handleMissingExitTest = () => {
    executeApi('Check Missing Exit Grace Period', '/api/v1/trips/88888888-8888-8888-8888-888888888801/check-grace-period', 'POST', {
      currentTimeMs: Date.now() + 6 * 60 * 1000, // 6 minutes in the future (> 5 min threshold)
    });
  };

  // 8. GPS Stale Simulation (>60s)
  const handleGpsOffline = () => {
    const staleTime = new Date(Date.now() - 120 * 1000).toISOString();
    executeApi('Simulate GPS Stale (>60s)', '/api/v1/gps/events', 'POST', {
      deviceId: 'GPS-BUS-12-TELT',
      latitude: 28.6320,
      longitude: 77.3680,
      speed: 0,
      recordedAt: staleTime,
    });
  };

  // 9. GPS Recovered
  const handleGpsRecovered = () => {
    executeApi('Simulate GPS Recovered', '/api/v1/gps/events', 'POST', {
      deviceId: 'GPS-BUS-12-TELT',
      latitude: 28.6360,
      longitude: 77.3715,
      speed: 38,
      recordedAt: new Date().toISOString(),
    });
  };

  // 10. Complete Trip
  const handleCompleteTrip = () => {
    executeApi('Complete Trip', '/api/v1/trips/88888888-8888-8888-8888-888888888801/complete', 'POST');
  };

  // 11. Reset Demo State
  const handleResetDemo = () => {
    // Re-starts trip and clears state
    executeApi('Reset Demo to Clean State', '/api/v1/trips/88888888-8888-8888-8888-888888888801/start', 'POST');
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: 'min(92vw, 380px)',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        boxShadow: '0 20px 45px rgba(15, 23, 42, 0.16), 0 4px 12px rgba(15, 23, 42, 0.06)',
        zIndex: 9999,
        color: '#0f172a',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        overflow: 'hidden',
        animation: 'slide-up 0.25s ease-out',
      }}
    >
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          padding: '14px 18px',
          backgroundColor: '#0d1938',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🎛️</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Demo Operator Control Panel</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Real Event Pipeline &amp; Deterministic Engine</div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#cbd5e1',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: '6px',
          }}
          aria-label="Close demo panel"
        >
          &times;
        </button>
      </div>

      {/* Scenario Indicator */}
      <div style={{ padding: '10px 18px', backgroundColor: '#eff6ff', borderBottom: '1px solid #dbeafe', fontSize: '11px', color: '#1e40af' }}>
        Scenario: <strong style={{ color: '#0f172a' }}>Bus 12 (North Corridor Express)</strong> &bull; Student: <strong style={{ color: '#2563eb' }}>Aarav Sharma</strong>
      </div>

      {/* Action Buttons Grid */}
      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
        {/* Step 1: Trip Controls */}
        <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          1. Trip Lifecycle
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            onClick={handleStartTrip}
            disabled={!!loadingAction}
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #059669',
              color: '#059669',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            ▶ Start Trip
          </button>

          <button
            onClick={handleCompleteTrip}
            disabled={!!loadingAction}
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#334155',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            ⏩ Complete Trip
          </button>
        </div>

        {/* Step 2: Bus Movement & Stops */}
        <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>
          2. Bus Telematics &amp; Stops
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            onClick={() => handleMoveBus(1)}
            disabled={!!loadingAction}
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#0284c7',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            📍 Move Bus
          </button>

          <button
            onClick={handleReachStop}
            disabled={!!loadingAction}
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#0284c7',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            🚌 Reach Stop #1
          </button>
        </div>

        {/* Step 3: RFID Scans (Boarding & Exit) */}
        <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>
          3. Student RFID Scans
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            onClick={handleSimulateBoardingAarav}
            disabled={!!loadingAction}
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #059669',
              color: '#059669',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            🪪 Board Aarav
          </button>

          <button
            onClick={handleSimulateExitAarav}
            disabled={!!loadingAction}
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #059669',
              color: '#059669',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            🪪 Exit Aarav
          </button>
        </div>

        {/* Step 4: Safety Exceptions Showcase */}
        <div style={{ fontSize: '10px', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>
          4. Safety Exceptions (Key Pitch Value)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            onClick={handleWrongBusTest}
            disabled={!!loadingAction}
            title="Kabir scans on Bus 12 instead of assigned Bus 08"
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              backgroundColor: '#fef2f2',
              border: '1px solid #dc2626',
              color: '#dc2626',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            ⚠ Wrong Bus
          </button>

          <button
            onClick={handleMissingExitTest}
            disabled={!!loadingAction}
            title="Checks grace period when student remains onboard past stop"
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              backgroundColor: '#fffbeb',
              border: '1px solid #d97706',
              color: '#d97706',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            ⚠ Missing Exit
          </button>
        </div>

        {/* Step 5: GPS Telemetry Resilience */}
        <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>
          5. GPS Resilience
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            onClick={handleGpsOffline}
            disabled={!!loadingAction}
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fcd34d',
              color: '#b45309',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            📡 GPS Stale (&gt;60s)
          </button>

          <button
            onClick={handleGpsRecovered}
            disabled={!!loadingAction}
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #6ee7b7',
              color: '#059669',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            📡 GPS Recovered
          </button>
        </div>

        {/* Reset Demo Button */}
        <button
          onClick={handleResetDemo}
          disabled={!!loadingAction}
          style={{
            marginTop: '6px',
            padding: '10px',
            borderRadius: '8px',
            backgroundColor: '#f1f5f9',
            border: '1px solid #cbd5e1',
            color: '#475569',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          🔄 Reset Demo to Initial State
        </button>
      </div>

      {/* Live Event Output Log */}
      {lastLog && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: lastLog.type === 'error' ? '#fef2f2' : '#ecfdf5',
            borderTop: `1px solid ${lastLog.type === 'error' ? '#fca5a5' : '#a7f3d0'}`,
            fontSize: '11px',
            color: lastLog.type === 'error' ? '#dc2626' : '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{lastLog.message}</span>
          <span style={{ fontSize: '9px', opacity: 0.7 }}>{lastLog.timestamp}</span>
        </div>
      )}
    </div>
  );
};
