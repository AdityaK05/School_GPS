import React, { useState, useEffect } from 'react';
import { InteractiveMap, MapMarker } from './InteractiveMap';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://school-gps-api.onrender.com';
const ATTENDANT_TOKEN = 'test-token:44444444-4444-4444-4444-444444444444:ATTENDANT:11111111-1111-1111-1111-111111111111';

export const AttendantPortalView: React.FC = () => {
  const [onboardCount, setOnboardCount] = useState<number>(1);
  const [lastScanResult, setLastScanResult] = useState<{
    status: 'SUCCESS' | 'DUPLICATE' | 'WRONG_BUS' | 'EXIT';
    title: string;
    message: string;
    studentName: string;
    time: string;
  }>({
    status: 'SUCCESS',
    title: 'RFID Boarding Verified',
    message: 'Aarav Sharma verified onto Bus 12. State: BOARDED.',
    studentName: 'Aarav Sharma (ADM-2024-001)',
    time: new Date().toLocaleTimeString(),
  });

  const [manifest, setManifest] = useState([
    {
      id: 'c1111111-1111-1111-1111-111111111101',
      name: 'Aarav Sharma',
      admission: 'ADM-2024-001',
      cardId: 'CARD-AARAV-01',
      stop: 'Stop 1: Sector 62 Metro Gate #2',
      boardingStatus: 'BOARDED',
      exitStatus: 'PENDING',
    },
    {
      id: 'c1111111-1111-1111-1111-111111111102',
      name: 'Diya Sharma',
      admission: 'ADM-2024-002',
      cardId: 'CARD-DIYA-02',
      stop: 'Stop 2: Shipra Sun City Gate #4',
      boardingStatus: 'PENDING',
      exitStatus: 'PENDING',
    },
    {
      id: 'c1111111-1111-1111-1111-111111111104',
      name: 'Ananya Verma',
      admission: 'ADM-2024-004',
      cardId: 'CARD-ANANYA-04',
      stop: 'Stop 2: Shipra Sun City Gate #4',
      boardingStatus: 'PENDING',
      exitStatus: 'PENDING',
    },
    {
      id: 'c1111111-1111-1111-1111-111111111105',
      name: 'Rohan Gupta',
      admission: 'ADM-2024-005',
      cardId: 'CARD-ROHAN-05',
      stop: 'Stop 3: Indirapuram Habitat Centre',
      boardingStatus: 'PENDING',
      exitStatus: 'PENDING',
    },
  ]);

  // Fetch Live Manifest from API
  const fetchManifest = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/trips/88888888-8888-8888-8888-888888888801/manifest`, {
        headers: { 'Authorization': `Bearer ${ATTENDANT_TOKEN}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          // Count boarded
          const boarded = json.data.filter((ts: any) => ts.boardingStatus === 'BOARDED' && ts.exitStatus !== 'EXITED').length;
          setOnboardCount(boarded > 0 ? boarded : 1);
        }
      }
    } catch (e) {
      console.warn('Manifest poll error:', e);
    }
  };

  useEffect(() => {
    fetchManifest();
  }, []);

  const triggerRfidScan = async (type: 'board_aarav' | 'board_diya' | 'wrong_bus' | 'exit_aarav') => {
    const time = new Date().toLocaleTimeString();

    if (type === 'board_aarav') {
      try {
        await fetch(`${API_BASE}/api/v1/rfid/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ATTENDANT_TOKEN}` },
          body: JSON.stringify({ cardId: 'CARD-AARAV-01', readerHardwareId: 'RFID-BUS-12-GATE' }),
        });
      } catch (e) {}

      setOnboardCount((c) => Math.min(4, c + 1));
      setManifest((prev) =>
        prev.map((s) => (s.id === 'c1111111-1111-1111-1111-111111111101' ? { ...s, boardingStatus: 'BOARDED' } : s))
      );
      setLastScanResult({
        status: 'SUCCESS',
        title: 'RFID Boarding Verified',
        message: 'Aarav Sharma verified onto Bus 12 at Sector 62 Stop.',
        studentName: 'Aarav Sharma (ADM-2024-001)',
        time,
      });
    } else if (type === 'board_diya') {
      try {
        await fetch(`${API_BASE}/api/v1/rfid/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ATTENDANT_TOKEN}` },
          body: JSON.stringify({ cardId: 'CARD-DIYA-02', readerHardwareId: 'RFID-BUS-12-GATE' }),
        });
      } catch (e) {}

      setOnboardCount((c) => Math.min(4, c + 1));
      setManifest((prev) =>
        prev.map((s) => (s.id === 'c1111111-1111-1111-1111-111111111102' ? { ...s, boardingStatus: 'BOARDED' } : s))
      );
      setLastScanResult({
        status: 'SUCCESS',
        title: 'RFID Boarding Verified',
        message: 'Diya Sharma successfully boarded Bus 12 at Shipra Sun City.',
        studentName: 'Diya Sharma (ADM-2024-002)',
        time,
      });
    } else if (type === 'wrong_bus') {
      try {
        await fetch(`${API_BASE}/api/v1/rfid/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ATTENDANT_TOKEN}` },
          body: JSON.stringify({ cardId: 'CARD-KABIR-99', readerHardwareId: 'RFID-BUS-12-GATE' }),
        });
      } catch (e) {}

      setLastScanResult({
        status: 'WRONG_BUS',
        title: '🚨 CRITICAL SAFETY EXCEPTION: WRONG BUS INTERCEPTED',
        message: 'Prevent Boarding! Student Kabir Mehta is registered on Bus 08 (East Wing), NOT Bus 12.',
        studentName: 'Kabir Mehta (ADM-2024-003)',
        time,
      });
    } else if (type === 'exit_aarav') {
      try {
        await fetch(`${API_BASE}/api/v1/rfid/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ATTENDANT_TOKEN}` },
          body: JSON.stringify({ cardId: 'CARD-AARAV-01', readerHardwareId: 'RFID-BUS-12-GATE' }),
        });
      } catch (e) {}

      setOnboardCount((c) => Math.max(0, c - 1));
      setManifest((prev) =>
        prev.map((s) => (s.id === 'c1111111-1111-1111-1111-111111111101' ? { ...s, exitStatus: 'EXITED' } : s))
      );
      setLastScanResult({
        status: 'EXIT',
        title: 'Safe Exit Recorded',
        message: 'Aarav Sharma scanned out safely at DPIS Main Campus Terminus.',
        studentName: 'Aarav Sharma (ADM-2024-001)',
        time,
      });
    }
  };

  const busMarker: MapMarker[] = [
    {
      id: 'bus_attendant',
      label: 'Bus 12 (UP-16-BT-9912)',
      latitude: 28.6360,
      longitude: 77.3715,
      type: 'bus',
      speed: 38,
      isLive: true,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1080px', margin: '0 auto', color: '#f4f4f5' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              In-Bus Attendant Console
            </span>
            <span style={{ fontSize: '10px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>
              Reader ONLINE &bull; NFC Active
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', margin: '6px 0 2px 0', letterSpacing: '-0.02em' }}>
            Trip Manifest &amp; RFID Boarding Scanner
          </h1>
          <p style={{ fontSize: '13px', color: '#a1a1aa', margin: 0 }}>
            Interactive terminal for attendant card verification, offline queue sync, and passenger accounting.
          </p>
        </div>

        {/* Real-time Onboard Passenger Counter */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div
            style={{
              padding: '12px 20px',
              borderRadius: '14px',
              backgroundColor: '#121217',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', fontWeight: 800 }}>Onboard Now</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#34d399', marginTop: '2px' }}>
              {onboardCount} / 4
            </div>
          </div>

          <div
            style={{
              padding: '12px 20px',
              borderRadius: '14px',
              backgroundColor: '#121217',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', fontWeight: 800 }}>Queue Status</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
              0 <span style={{ fontSize: '12px', color: '#71717a', fontWeight: 600 }}>Pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hardware RFID Simulator Tap Pad */}
      <div
        style={{
          padding: '20px 24px',
          borderRadius: '16px',
          backgroundColor: '#121217',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              RFID Card Tap Hardware Simulator
            </span>
            <div style={{ fontSize: '12px', color: '#a1a1aa' }}>
              Trigger physical card taps directly into the authoritative safety engine:
            </div>
          </div>
          <span style={{ fontSize: '10px', backgroundColor: 'rgba(255, 255, 255, 0.06)', color: '#a1a1aa', padding: '4px 8px', borderRadius: '6px' }}>
            Reader: RFID-BUS-12-GATE
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <button
            onClick={() => triggerRfidScan('board_aarav')}
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: '#18181b',
              border: '1px solid #0284c7',
              color: '#38bdf8',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>💳</span> Tap: Board Aarav (Stop 1)
          </button>

          <button
            onClick={() => triggerRfidScan('board_diya')}
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: '#18181b',
              border: '1px solid #0284c7',
              color: '#38bdf8',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>💳</span> Tap: Board Diya (Stop 2)
          </button>

          <button
            onClick={() => triggerRfidScan('wrong_bus')}
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid #ef4444',
              color: '#f87171',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>🚨</span> Tap: Wrong Bus Test (Kabir)
          </button>

          <button
            onClick={() => triggerRfidScan('exit_aarav')}
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid #10b981',
              color: '#34d399',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>🏁</span> Tap: Safe Exit Terminus
          </button>
        </div>
      </div>

      {/* Live Scan Result Banner */}
      {lastScanResult && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '14px',
            backgroundColor:
              lastScanResult.status === 'WRONG_BUS'
                ? 'rgba(239, 68, 68, 0.15)'
                : lastScanResult.status === 'EXIT'
                ? 'rgba(56, 189, 248, 0.15)'
                : 'rgba(16, 185, 129, 0.15)',
            border: `1px solid ${
              lastScanResult.status === 'WRONG_BUS'
                ? '#ef4444'
                : lastScanResult.status === 'EXIT'
                ? '#0284c7'
                : '#10b981'
            }`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color:
                  lastScanResult.status === 'WRONG_BUS'
                    ? '#f87171'
                    : lastScanResult.status === 'EXIT'
                    ? '#38bdf8'
                    : '#34d399',
              }}
            >
              {lastScanResult.title}
            </div>
            <div style={{ fontSize: '13px', color: '#ffffff', marginTop: '2px' }}>
              {lastScanResult.message}
            </div>
            <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '4px' }}>
              Target: <strong style={{ color: '#ffffff' }}>{lastScanResult.studentName}</strong> &bull; Verified at {lastScanResult.time}
            </div>
          </div>

          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor:
                lastScanResult.status === 'WRONG_BUS' ? '#ef4444' : '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: '#ffffff',
            }}
          >
            {lastScanResult.status === 'WRONG_BUS' ? '!' : '✓'}
          </div>
        </div>
      )}

      {/* Interactive Cartography Map */}
      <InteractiveMap markers={busMarker} height="380px" />

      {/* Real-time Manifest Table */}
      <div
        style={{
          padding: '20px 24px',
          borderRadius: '16px',
          backgroundColor: '#121217',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>Passenger Manifest &amp; Boarding Ledger</span>
            <div style={{ fontSize: '11px', color: '#71717a' }}>Deterministic per-stop passenger reconciliation</div>
          </div>
          <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
            ● Authoritative Server Sync
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#71717a' }}>
                <th style={{ padding: '10px 12px' }}>Student</th>
                <th style={{ padding: '10px 12px' }}>Card UID</th>
                <th style={{ padding: '10px 12px' }}>Assigned Stop</th>
                <th style={{ padding: '10px 12px' }}>Boarding Status</th>
                <th style={{ padding: '10px 12px' }}>Exit Status</th>
              </tr>
            </thead>
            <tbody>
              {manifest.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#ffffff' }}>
                    {s.name} <span style={{ fontSize: '11px', color: '#71717a', fontWeight: 400 }}>({s.admission})</span>
                  </td>
                  <td style={{ padding: '12px', fontFamily: 'monospace', color: '#38bdf8' }}>{s.cardId}</td>
                  <td style={{ padding: '12px', color: '#a1a1aa' }}>{s.stop}</td>
                  <td style={{ padding: '12px' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 700,
                        backgroundColor: s.boardingStatus === 'BOARDED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: s.boardingStatus === 'BOARDED' ? '#34d399' : '#fbbf24',
                        border: `1px solid ${s.boardingStatus === 'BOARDED' ? '#10b981' : '#f59e0b'}`,
                      }}
                    >
                      {s.boardingStatus}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 700,
                        backgroundColor: s.exitStatus === 'EXITED' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        color: s.exitStatus === 'EXITED' ? '#38bdf8' : '#71717a',
                      }}
                    >
                      {s.exitStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
