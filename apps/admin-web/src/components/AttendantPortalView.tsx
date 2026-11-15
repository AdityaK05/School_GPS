import React, { useState } from 'react';
import { InteractiveMap, MapMarker } from './InteractiveMap';

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
      id: 'std_001',
      name: 'Aarav Sharma',
      admission: 'ADM-2024-001',
      stop: 'Stop 1 - Green Valley',
      boardingStatus: 'BOARDED',
      exitStatus: 'PENDING',
    },
    {
      id: 'std_002',
      name: 'Diya Sharma',
      admission: 'ADM-2024-002',
      stop: 'Stop 2 - Sector 62 Gate',
      boardingStatus: 'PENDING',
      exitStatus: 'PENDING',
    },
    {
      id: 'std_003',
      name: 'Rohan Mehra',
      admission: 'ADM-2024-003',
      stop: 'Stop 3 - School Campus',
      boardingStatus: 'PENDING',
      exitStatus: 'PENDING',
    },
  ]);

  const simulateScan = (type: 'board_aarav' | 'board_diya' | 'wrong_bus' | 'exit_aarav') => {
    const time = new Date().toLocaleTimeString();
    if (type === 'board_aarav') {
      setOnboardCount((c) => Math.min(3, c + 1));
      setManifest((prev) =>
        prev.map((s) => (s.id === 'std_001' ? { ...s, boardingStatus: 'BOARDED' } : s))
      );
      setLastScanResult({
        status: 'SUCCESS',
        title: 'RFID Boarding Verified',
        message: 'Aarav Sharma successfully boarded Bus 12.',
        studentName: 'Aarav Sharma (ADM-2024-001)',
        time,
      });
    } else if (type === 'board_diya') {
      setOnboardCount((c) => Math.min(3, c + 1));
      setManifest((prev) =>
        prev.map((s) => (s.id === 'std_002' ? { ...s, boardingStatus: 'BOARDED' } : s))
      );
      setLastScanResult({
        status: 'SUCCESS',
        title: 'RFID Boarding Verified',
        message: 'Diya Sharma successfully boarded Bus 12 at Sector 62 Stop.',
        studentName: 'Diya Sharma (ADM-2024-002)',
        time,
      });
    } else if (type === 'wrong_bus') {
      setLastScanResult({
        status: 'WRONG_BUS',
        title: '⚠ SAFETY EXCEPTION: WRONG BUS',
        message: 'Interception! Student Kabir Patel is assigned to Bus 04, NOT Bus 12.',
        studentName: 'Kabir Patel (ADM-2024-089)',
        time,
      });
    } else if (type === 'exit_aarav') {
      setOnboardCount((c) => Math.max(0, c - 1));
      setManifest((prev) =>
        prev.map((s) => (s.id === 'std_001' ? { ...s, exitStatus: 'EXITED' } : s))
      );
      setLastScanResult({
        status: 'EXIT',
        title: 'Safe Exit Recorded',
        message: 'Aarav Sharma scanned out at Terminus - School Campus.',
        studentName: 'Aarav Sharma (ADM-2024-001)',
        time,
      });
    }
  };

  const busMarker: MapMarker[] = [
    {
      id: 'bus_attendant',
      label: 'Bus 12 (KA-01-EXP-9999)',
      latitude: 12.9716,
      longitude: 77.5946,
      type: 'bus',
      speed: 38,
      isLive: true,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            In-Bus Attendant Console
          </span>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff', margin: '4px 0 0 0', letterSpacing: '-0.02em' }}>
            Trip Manifest & RFID Boarding Scanner
          </h2>
          <p style={{ fontSize: '14px', color: '#71717a', margin: '4px 0 0 0' }}>
            Interactive terminal for attendant NFC/RFID scans, offline queue, and passenger accounting.
          </p>
        </div>

        {/* Live Passenger Counter */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ padding: '10px 18px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '12px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: '#6ee7b7', textTransform: 'uppercase', fontWeight: 600 }}>Onboard Now</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#34d399' }}>{onboardCount} / 3</div>
          </div>
          <div style={{ padding: '10px 18px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: '#a1a1aa', textTransform: 'uppercase', fontWeight: 600 }}>Queue Status</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>0 Pending</div>
          </div>
        </div>
      </div>

      {/* RFID Scan Simulation Control Bar */}
      <div
        style={{
          padding: '18px 24px',
          borderRadius: '16px',
          backgroundColor: '#0c121e',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
          RFID Card Tap Hardware Simulator
        </span>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 14px 0' }}>
          Click to simulate hardware RFID card reader inputs directly into the deterministic safety state machine:
        </p>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => simulateScan('board_aarav')}
            style={{
              padding: '10px 16px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              color: '#34d399',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            💳 Tap: Board Aarav (Stop 1)
          </button>

          <button
            onClick={() => simulateScan('board_diya')}
            style={{
              padding: '10px 16px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid #38bdf8',
              color: '#38bdf8',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            💳 Tap: Board Diya (Stop 2)
          </button>

          <button
            onClick={() => simulateScan('wrong_bus')}
            style={{
              padding: '10px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              color: '#f87171',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            🚨 Tap: Wrong Bus Test (Kabir)
          </button>

          <button
            onClick={() => simulateScan('exit_aarav')}
            style={{
              padding: '10px 16px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid #f59e0b',
              color: '#fbbf24',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            🏁 Tap: Safe Exit Terminus (Aarav)
          </button>
        </div>
      </div>

      {/* Immediate Visual Scan Feedback Banner */}
      <div
        style={{
          padding: '18px 24px',
          borderRadius: '16px',
          backgroundColor:
            lastScanResult.status === 'WRONG_BUS'
              ? 'rgba(239, 68, 68, 0.15)'
              : lastScanResult.status === 'SUCCESS'
              ? 'rgba(16, 185, 129, 0.12)'
              : 'rgba(56, 189, 248, 0.12)',
          border:
            lastScanResult.status === 'WRONG_BUS'
              ? '1px solid #ef4444'
              : lastScanResult.status === 'SUCCESS'
              ? '1px solid #10b981'
              : '1px solid #38bdf8',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color:
                lastScanResult.status === 'WRONG_BUS'
                  ? '#f87171'
                  : lastScanResult.status === 'SUCCESS'
                  ? '#34d399'
                  : '#38bdf8',
            }}
          >
            {lastScanResult.title}
          </div>
          <div style={{ fontSize: '13px', color: '#f1f5f9', marginTop: '2px' }}>
            {lastScanResult.message}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            Target: <strong>{lastScanResult.studentName}</strong> • Verified at {lastScanResult.time}
          </div>
        </div>

        <div style={{ fontSize: '32px' }}>
          {lastScanResult.status === 'WRONG_BUS' ? '🚫' : lastScanResult.status === 'SUCCESS' ? '✅' : '🚪'}
        </div>
      </div>

      {/* Live Map */}
      <InteractiveMap markers={busMarker} height="360px" />

      {/* Trip Passenger Manifest Table */}
      <div
        style={{
          backgroundColor: '#0c121e',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', margin: 0 }}>
            Active Trip Passenger Manifest
          </h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', color: '#71717a' }}>
              <th style={{ padding: '12px 20px' }}>Student</th>
              <th style={{ padding: '12px 20px' }}>Admission</th>
              <th style={{ padding: '12px 20px' }}>Assigned Stop</th>
              <th style={{ padding: '12px 20px' }}>Boarding Status</th>
              <th style={{ padding: '12px 20px' }}>Exit Status</th>
            </tr>
          </thead>
          <tbody>
            {manifest.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.02)', color: '#f8fafc' }}>
                <td style={{ padding: '12px 20px', fontWeight: 600 }}>{s.name}</td>
                <td style={{ padding: '12px 20px', color: '#94a3b8' }}>{s.admission}</td>
                <td style={{ padding: '12px 20px' }}>{s.stop}</td>
                <td style={{ padding: '12px 20px' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: s.boardingStatus === 'BOARDED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      color: s.boardingStatus === 'BOARDED' ? '#34d399' : '#94a3b8',
                    }}
                  >
                    {s.boardingStatus}
                  </span>
                </td>
                <td style={{ padding: '12px 20px' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: s.exitStatus === 'EXITED' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      color: s.exitStatus === 'EXITED' ? '#38bdf8' : '#64748b',
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
  );
};
