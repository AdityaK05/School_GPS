import React, { useState } from 'react';
import { useRouter } from '../router/Router';
import { colors, radii, shadows } from '../theme/design-system';
import { ApiClient } from '@school-transport-platform/client-sdk';

export const AttendantAppView: React.FC<{ apiClient: ApiClient }> = () => {
  const { setPersona } = useRouter();

  const [tripStarted, setTripStarted] = useState(true);
  const [boardedCount, setBoardedCount] = useState(28);
  const [totalExpected] = useState(32);
  const [showManifest, setShowManifest] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const [lastScan, setLastScan] = useState<{
    status: 'SUCCESS' | 'WRONG_BUS' | 'EXIT';
    title: string;
    studentName: string;
    time: string;
  }>({
    status: 'SUCCESS',
    title: 'RFID Boarding Verified',
    studentName: 'Aarav Sharma (Class 7-B)',
    time: '07:42 AM',
  });

  const [students, setStudents] = useState([
    { id: '1', name: 'Aarav Sharma', class: 'Class 7-B', stop: 'Sector 62 Metro', status: 'BOARDED' },
    { id: '2', name: 'Diya Sharma', class: 'Class 2-B', stop: 'Shipra Sun City', status: 'BOARDED' },
    { id: '3', name: 'Ananya Verma', class: 'Class 5-A', stop: 'Fortis Hospital', status: 'BOARDED' },
    { id: '4', name: 'Rohan Gupta', class: 'Class 8-C', stop: 'Habitat Centre', status: 'PENDING' },
    { id: '5', name: 'Kavita Singh', class: 'Class 6-B', stop: 'Habitat Centre', status: 'PENDING' },
  ]);

  const handleRfidScan = (studentName: string, isWrongBus = false) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isWrongBus) {
      setLastScan({
        status: 'WRONG_BUS',
        title: '⚠️ WRONG BUS ATTEMPT',
        studentName: 'Kabir Malhotra (Assigned: Bus 07)',
        time,
      });
    } else {
      setBoardedCount((prev) => Math.min(totalExpected, prev + 1));
      setLastScan({
        status: 'SUCCESS',
        title: '✓ RFID Boarding Verified',
        studentName,
        time,
      });
    }
  };

  const handleRecordExit = (studentName: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setBoardedCount((prev) => Math.max(0, prev - 1));
    setLastScan({
      status: 'EXIT',
      title: '✓ Safe Terminus Exit Recorded',
      studentName,
      time,
    });
    setShowExitModal(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '16px 0' }}>
      {/* Phone Frame matching reference */}
      <div
        style={{
          width: '100%',
          maxWidth: '414px',
          minHeight: '844px',
          backgroundColor: '#ffffff',
          borderRadius: radii.xl,
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* iOS Status Bar */}
        <div style={{ padding: '12px 20px 4px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 700, color: '#ffffff', backgroundColor: '#0f4c3a' }}>
          <span>9:41</span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span>5G</span>
            <span>● 100%</span>
          </div>
        </div>

        {/* Top Header Banner (Deep Green, matching reference screen 2) */}
        <div
          style={{
            backgroundColor: '#0f4c3a',
            padding: '16px 20px',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setPersona('admin')}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                fontSize: '18px',
                cursor: 'pointer',
              }}
            >
              ←
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  padding: '3px 10px',
                  borderRadius: radii.full,
                  color: '#a7f3d0',
                }}
              >
                ● Trip Active
              </span>
              <button
                onClick={() => setPersona('admin')}
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: '#ffffff',
                  color: '#0f4c3a',
                  border: 'none',
                  borderRadius: radii.full,
                  padding: '3px 8px',
                  cursor: 'pointer',
                }}
              >
                Admin ⇄
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: radii.md,
                backgroundColor: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}
            >
              🚌
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Bus 12
              </h2>
              <div style={{ fontSize: '13px', color: '#a7f3d0', fontWeight: 600 }}>
                Sector 62 → Oakridge Campus
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          {/* Passenger Boarding Progress Card */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: radii.xl,
              padding: '18px 20px',
              border: `1px solid ${colors.border}`,
              boxShadow: shadows.sm,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '22px', color: colors.success }}>👥</span>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: colors.textPrimary, lineHeight: 1 }}>
                  {boardedCount} / {totalExpected}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: colors.textSecondary, marginTop: '2px' }}>
                  Students Boarded
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: radii.full, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${(boardedCount / totalExpected) * 100}%`,
                  height: '100%',
                  backgroundColor: '#10b981',
                  borderRadius: radii.full,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          {/* Large Central RFID Scan Action Card (Exactly matching Reference) */}
          <div
            onClick={() => handleRfidScan('Aarav Sharma')}
            style={{
              backgroundColor: '#eff6ff',
              borderRadius: radii.xl,
              border: '2px dashed #93c5fd',
              padding: '36px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.15s ease',
              boxShadow: shadows.sm,
            }}
          >
            <div style={{ fontSize: '56px', color: colors.primary, marginBottom: '8px' }}>
              📶
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: colors.textPrimary }}>
              Scan Student
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: colors.primary, marginTop: '4px' }}>
              (Tap RFID Card to Board)
            </div>
          </div>

          {/* Quick Hardware Simulator Buttons for Demo */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => handleRfidScan('Diya Sharma')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: radii.md,
                backgroundColor: '#ffffff',
                border: `1px solid ${colors.border}`,
                fontSize: '11px',
                fontWeight: 700,
                color: colors.primary,
                cursor: 'pointer',
              }}
            >
              + Scan Diya
            </button>
            <button
              onClick={() => handleRfidScan('Kabir Malhotra', true)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: radii.md,
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                fontSize: '11px',
                fontWeight: 700,
                color: colors.danger,
                cursor: 'pointer',
              }}
            >
              ⚠️ Wrong Bus Test
            </button>
          </div>

          {/* Immediate Scan Feedback Banner */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: lastScan.status === 'WRONG_BUS' ? '#fef2f2' : '#ecfdf5',
              borderRadius: radii.lg,
              border: `1px solid ${lastScan.status === 'WRONG_BUS' ? '#fecaca' : '#a7f3d0'}`,
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 800, color: lastScan.status === 'WRONG_BUS' ? colors.danger : colors.success }}>
              {lastScan.title}
            </div>
            <div style={{ fontSize: '12px', color: colors.textPrimary, marginTop: '2px' }}>
              {lastScan.studentName} &bull; {lastScan.time}
            </div>
          </div>

          {/* 2 Bottom Buttons: View List (32) and Record Exit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              onClick={() => setShowManifest(!showManifest)}
              style={{
                padding: '16px',
                borderRadius: radii.lg,
                backgroundColor: '#ffffff',
                border: `1px solid ${colors.border}`,
                boxShadow: shadows.sm,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '20px' }}>📋</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: colors.textPrimary }}>View List</span>
              <span style={{ fontSize: '11px', color: colors.textSecondary }}>({totalExpected})</span>
            </button>

            <button
              onClick={() => setShowExitModal(true)}
              style={{
                padding: '16px',
                borderRadius: radii.lg,
                backgroundColor: '#ffffff',
                border: `1px solid ${colors.border}`,
                boxShadow: shadows.sm,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '20px' }}>🏫</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: colors.textPrimary }}>Record Exit</span>
              <span style={{ fontSize: '11px', color: colors.textSecondary }}>Terminus Drop</span>
            </button>
          </div>

          {/* End Trip Button (Red button matching reference) */}
          <button
            onClick={() => {
              if (confirm('Complete and end trip for Bus 12?')) {
                setTripStarted(false);
                alert('Trip completed! All passenger exits accounted.');
              }
            }}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: radii.lg,
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              fontSize: '15px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: shadows.sm,
              marginTop: 'auto',
            }}
          >
            <span>⏹</span> End Trip
          </button>
        </div>

        {/* Student Manifest Drawer / Modal */}
        {showManifest && (
          <div
            style={{
              position: 'absolute',
              top: '56px',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: '#ffffff',
              zIndex: 30,
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
                Bus 12 Passenger Manifest
              </h3>
              <button
                onClick={() => setShowManifest(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {students.map((st) => (
                <div
                  key={st.id}
                  style={{
                    padding: '12px 14px',
                    backgroundColor: '#f8fafc',
                    borderRadius: radii.md,
                    border: `1px solid ${colors.borderLight}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>{st.name}</div>
                    <div style={{ fontSize: '11px', color: colors.textSecondary }}>{st.class} &bull; {st.stop}</div>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: radii.full,
                      backgroundColor: st.status === 'BOARDED' ? colors.successLight : '#f1f5f9',
                      color: st.status === 'BOARDED' ? colors.success : colors.textSecondary,
                    }}
                  >
                    {st.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exit Modal */}
        {showExitModal && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <div style={{ backgroundColor: '#ffffff', borderRadius: radii.xl, padding: '24px', width: '100%', maxWidth: '340px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
                Record Safe Drop-off Exit
              </h3>
              <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>
                Select student exiting at current stop:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                <button
                  onClick={() => handleRecordExit('Aarav Sharma')}
                  style={{
                    padding: '10px',
                    borderRadius: radii.md,
                    backgroundColor: colors.successLight,
                    border: `1px solid ${colors.successBorder}`,
                    color: colors.success,
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  ✓ Exit Aarav Sharma
                </button>
                <button
                  onClick={() => handleRecordExit('Diya Sharma')}
                  style={{
                    padding: '10px',
                    borderRadius: radii.md,
                    backgroundColor: colors.successLight,
                    border: `1px solid ${colors.successBorder}`,
                    color: colors.success,
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  ✓ Exit Diya Sharma
                </button>
                <button
                  onClick={() => setShowExitModal(false)}
                  style={{
                    marginTop: '8px',
                    padding: '8px',
                    borderRadius: radii.md,
                    backgroundColor: '#f1f5f9',
                    border: 'none',
                    color: colors.textSecondary,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
