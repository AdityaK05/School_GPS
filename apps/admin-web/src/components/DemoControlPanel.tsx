import React, { useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { radii, shadows } from '../theme/design-system';
import { RfidIcon } from './ui/RfidIcon';
import {
  Sliders,
  Play,
  CheckCheck,
  Navigation,
  MapPin,
  TriangleAlert,
  Radio,
  RotateCcw,
  X,
  ShieldCheck,
  Check,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const DEMO_TOKEN =
  sessionStorage.getItem('aegis_access_token') ||
  (import.meta.env.DEV
    ? 'test-token:22222222-2222-2222-2222-222222222222:SCHOOL_ADMIN:11111111-1111-1111-1111-111111111111'
    : '');

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
  const { colors, isDark } = useTheme();
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

  const generateUuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

  const handleStartTrip = () => {
    executeApi('Start Trip', '/api/v1/trips/88888888-8888-8888-8888-888888888801/start', 'POST');
  };

  const handleMoveBus = (waypointIdx: number) => {
    const coords = [
      { lat: 28.6280, lng: 77.3649, speed: 38 },
      { lat: 28.6320, lng: 77.3680, speed: 44 },
      { lat: 28.6360, lng: 77.3715, speed: 32 },
      { lat: 28.6410, lng: 77.3780, speed: 41 },
      { lat: 28.6495, lng: 77.3890, speed: 0 },
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

  const handleReachStop = () => {
    executeApi('Reach Stop (Sector 62)', '/api/v1/journey-events', 'POST', {
      tripId: '88888888-8888-8888-8888-888888888801',
      busId: '66666666-6666-6666-6666-666666666612',
      stopId: 's1111111-1111-1111-1111-111111111101',
      eventType: 'BUS_REACHED_STOP',
      eventTimestamp: new Date().toISOString(),
      idempotencyKey: generateUuid(),
      source: 'GPS',
      deviceId: 'GPS-BUS-12-TELT',
    });
  };

  const handleSimulateBoardingAarav = () => {
    executeApi('RFID Boarding: Aarav', '/api/v1/rfid/scan', 'POST', {
      readerHardwareId: 'RFID-BUS-12-GATE',
      cardId: 'CARD-AARAV-01',
      scanTimestamp: new Date().toISOString(),
      idempotencyKey: generateUuid(),
    });
  };

  const handleSimulateExitAarav = () => {
    executeApi('RFID Exit: Aarav', '/api/v1/journey-events', 'POST', {
      tripId: '88888888-8888-8888-8888-888888888801',
      busId: '66666666-6666-6666-6666-666666666612',
      studentId: 'c1111111-1111-1111-1111-111111111101',
      stopId: 's1111111-1111-1111-1111-111111111104',
      eventType: 'STUDENT_EXIT',
      eventTimestamp: new Date().toISOString(),
      idempotencyKey: generateUuid(),
      source: 'RFID',
      deviceId: 'RFID-BUS-12-GATE',
    });
  };

  const handleWrongBusTest = () => {
    executeApi('Wrong Bus Scan: Kabir on Bus 12', '/api/v1/rfid/scan', 'POST', {
      readerHardwareId: 'RFID-BUS-12-GATE',
      cardId: 'CARD-KABIR-99',
      scanTimestamp: new Date().toISOString(),
      idempotencyKey: generateUuid(),
    });
  };

  const handleMissingExitTest = () => {
    executeApi('Check Missing Exit Grace Period', '/api/v1/trips/88888888-8888-8888-8888-888888888801/check-grace-period', 'POST', {
      currentTimeMs: Date.now() + 6 * 60 * 1000,
    });
  };

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

  const handleGpsRecovered = () => {
    executeApi('Simulate GPS Recovered', '/api/v1/gps/events', 'POST', {
      deviceId: 'GPS-BUS-12-TELT',
      latitude: 28.6360,
      longitude: 77.3715,
      speed: 38,
      recordedAt: new Date().toISOString(),
    });
  };

  const handleCompleteTrip = () => {
    executeApi('Complete Trip', '/api/v1/trips/88888888-8888-8888-8888-888888888801/complete', 'POST');
  };

  const handleResetDemo = () => {
    executeApi('Reset Demo to Clean State', '/api/v1/trips/88888888-8888-8888-8888-888888888801/start', 'POST');
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: 'min(92vw, 380px)',
        backgroundColor: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: radii.lg,
        boxShadow: isDark
          ? '0 20px 45px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4)'
          : '0 20px 45px rgba(15, 23, 42, 0.16), 0 4px 12px rgba(15, 23, 42, 0.06)',
        zIndex: 9999,
        color: colors.textPrimary,
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

      {/* Header (Section 6 & 37: Calm, Professional) */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: colors.sidebar,
          borderBottom: `1px solid ${colors.sidebarBorder}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={16} strokeWidth={2.2} color="#ffffff" />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Demo Operator Console</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Real Event Pipeline &amp; Safety Engine</div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#cbd5e1',
            cursor: 'pointer',
            padding: '2px 4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Close demo panel"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      {/* Scenario Indicator */}
      <div
        style={{
          padding: '9px 16px',
          backgroundColor: colors.primaryLight,
          borderBottom: `1px solid ${colors.primaryBorder}`,
          fontSize: '11px',
          color: colors.primary,
        }}
      >
        Scenario: <strong style={{ color: colors.textPrimary }}>Bus 12 (North Corridor)</strong> &bull; Student: <strong style={{ color: colors.primary }}>Aarav Sharma</strong>
      </div>

      {/* Action Buttons Grid */}
      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
        {/* Step 1: Trip Controls */}
        <div style={{ fontSize: '10px', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          1. Trip Lifecycle
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            onClick={handleStartTrip}
            disabled={!!loadingAction}
            style={{
              padding: '8px 10px',
              borderRadius: radii.sm,
              backgroundColor: colors.successLight,
              border: `1px solid ${colors.successBorder}`,
              color: colors.success,
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Play size={12} strokeWidth={2.4} />
            <span>Start Trip</span>
          </button>

          <button
            onClick={handleCompleteTrip}
            disabled={!!loadingAction}
            style={{
              padding: '8px 10px',
              borderRadius: radii.sm,
              backgroundColor: colors.bg,
              border: `1px solid ${colors.border}`,
              color: colors.textSecondary,
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <CheckCheck size={12} strokeWidth={2.2} />
            <span>Complete Trip</span>
          </button>
        </div>

        {/* Step 2: Bus Movement & Stops */}
        <div style={{ fontSize: '10px', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>
          2. Bus Telematics &amp; Stops
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            onClick={() => handleMoveBus(1)}
            disabled={!!loadingAction}
            style={{
              padding: '8px 10px',
              borderRadius: radii.sm,
              backgroundColor: colors.bg,
              border: `1px solid ${colors.border}`,
              color: colors.primary,
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Navigation size={12} strokeWidth={2} />
            <span>Move Bus</span>
          </button>

          <button
            onClick={handleReachStop}
            disabled={!!loadingAction}
            style={{
              padding: '8px 10px',
              borderRadius: radii.sm,
              backgroundColor: colors.bg,
              border: `1px solid ${colors.border}`,
              color: colors.primary,
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <MapPin size={12} strokeWidth={2} />
            <span>Reach Stop #1</span>
          </button>
        </div>

        {/* Step 3: RFID Scans (Boarding & Exit) */}
        <div style={{ fontSize: '10px', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>
          3. Student RFID Scans
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            onClick={handleSimulateBoardingAarav}
            disabled={!!loadingAction}
            style={{
              padding: '8px 10px',
              borderRadius: radii.sm,
              backgroundColor: colors.successLight,
              border: `1px solid ${colors.successBorder}`,
              color: colors.success,
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <RfidIcon size={14} color={colors.success} />
            <span>Board Aarav</span>
          </button>

          <button
            onClick={handleSimulateExitAarav}
            disabled={!!loadingAction}
            style={{
              padding: '8px 10px',
              borderRadius: radii.sm,
              backgroundColor: colors.successLight,
              border: `1px solid ${colors.successBorder}`,
              color: colors.success,
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <RfidIcon size={14} color={colors.success} />
            <span>Exit Aarav</span>
          </button>
        </div>

        {/* Step 4: Safety Exceptions Showcase */}
        <div style={{ fontSize: '10px', fontWeight: 700, color: colors.danger, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>
          4. Safety Exceptions (Key Pitch Value)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            onClick={handleWrongBusTest}
            disabled={!!loadingAction}
            title="Kabir scans on Bus 12 instead of assigned Bus 08"
            style={{
              padding: '8px 10px',
              borderRadius: radii.sm,
              backgroundColor: colors.dangerLight,
              border: `1px solid ${colors.dangerBorder}`,
              color: colors.danger,
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
            }}
          >
            <TriangleAlert size={12} strokeWidth={2.4} />
            <span>Wrong Bus</span>
          </button>

          <button
            onClick={handleMissingExitTest}
            disabled={!!loadingAction}
            title="Checks grace period when student remains onboard past stop"
            style={{
              padding: '8px 10px',
              borderRadius: radii.sm,
              backgroundColor: colors.warningLight,
              border: `1px solid ${colors.warningBorder}`,
              color: colors.warning,
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
            }}
          >
            <TriangleAlert size={12} strokeWidth={2.4} />
            <span>Missing Exit</span>
          </button>
        </div>

        {/* Step 5: GPS Resilience */}
        <div style={{ fontSize: '10px', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>
          5. GPS Resilience
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            onClick={handleGpsOffline}
            disabled={!!loadingAction}
            style={{
              padding: '8px 10px',
              borderRadius: radii.sm,
              backgroundColor: colors.warningLight,
              border: `1px solid ${colors.warningBorder}`,
              color: colors.warning,
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
            }}
          >
            <Radio size={12} strokeWidth={2} />
            <span>GPS Stale (&gt;60s)</span>
          </button>

          <button
            onClick={handleGpsRecovered}
            disabled={!!loadingAction}
            style={{
              padding: '8px 10px',
              borderRadius: radii.sm,
              backgroundColor: colors.successLight,
              border: `1px solid ${colors.successBorder}`,
              color: colors.success,
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
            }}
          >
            <Radio size={12} strokeWidth={2} />
            <span>GPS Recovered</span>
          </button>
        </div>

        {/* Reset Demo Button */}
        <button
          onClick={handleResetDemo}
          disabled={!!loadingAction}
          style={{
            marginTop: '6px',
            padding: '9px',
            borderRadius: radii.sm,
            backgroundColor: colors.bg,
            border: `1px solid ${colors.border}`,
            color: colors.textSecondary,
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <RotateCcw size={12} strokeWidth={2} />
          <span>Reset Demo to Initial State</span>
        </button>
      </div>

      {/* Live Event Output Log */}
      {lastLog && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: lastLog.type === 'error' ? colors.dangerLight : colors.successLight,
            borderTop: `1px solid ${lastLog.type === 'error' ? colors.dangerBorder : colors.successBorder}`,
            fontSize: '11px',
            color: lastLog.type === 'error' ? colors.danger : colors.success,
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
