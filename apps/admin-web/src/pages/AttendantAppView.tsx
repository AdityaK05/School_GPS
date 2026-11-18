import React, { useState } from 'react';
import { useRouter } from '../router/Router';
import { useTheme } from '../theme/ThemeContext';
import { radii, shadows } from '../theme/design-system';
import { StatusBadge } from '../components/ui/SharedComponents';
import { RfidIcon } from '../components/ui/RfidIcon';
import { ApiClient } from '@school-transport-platform/client-sdk';
import {
  BusFront,
  UsersRound,
  Play,
  Square,
  ClipboardList,
  School,
  TriangleAlert,
  Check,
  CircleCheck,
  ArrowLeft,
  Wifi,
  WifiOff,
  X,
  MapPin,
  Clock3,
} from 'lucide-react';

export const AttendantAppView: React.FC<{ apiClient: ApiClient }> = () => {
  const { setPersona } = useRouter();
  const { colors, isDark } = useTheme();

  const [tripStarted, setTripStarted] = useState(true);
  const [boardedCount, setBoardedCount] = useState(28);
  const [totalExpected] = useState(32);
  const [showManifest, setShowManifest] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  const [lastScan, setLastScan] = useState<{
    status: 'SUCCESS' | 'WRONG_BUS' | 'ALREADY_BOARDED' | 'EXIT';
    title: string;
    studentName: string;
    detail: string;
    time: string;
  }>({
    status: 'SUCCESS',
    title: 'AARAV SHARMA',
    studentName: 'Class 7-B',
    detail: 'Boarded · Sector 62 Metro Gate #2',
    time: '07:42 AM',
  });

  const [students, setStudents] = useState([
    { id: '1', name: 'Aarav Sharma', class: 'Class 7-B', stop: 'Sector 62 Metro', status: 'BOARDED' },
    { id: '2', name: 'Diya Sharma', class: 'Class 2-B', stop: 'Shipra Sun City', status: 'BOARDED' },
    { id: '3', name: 'Ananya Verma', class: 'Class 5-A', stop: 'Fortis Hospital', status: 'BOARDED' },
    { id: '4', name: 'Rohan Gupta', class: 'Class 8-C', stop: 'Habitat Centre', status: 'PENDING' },
    { id: '5', name: 'Kavita Singh', class: 'Class 6-B', stop: 'Habitat Centre', status: 'PENDING' },
  ]);

  const handleRfidScan = (studentName: string, mode: 'normal' | 'wrong_bus' | 'duplicate' = 'normal') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (mode === 'wrong_bus') {
      // Section 31: Wrong Bus UI
      setLastScan({
        status: 'WRONG_BUS',
        title: 'WRONG BUS',
        studentName: 'Kabir Mehta',
        detail: 'Assigned to BUS 14 · Current bus: BUS 12',
        time,
      });
      return;
    }

    if (mode === 'duplicate') {
      // Section 32: Duplicate Scan UI
      setLastScan({
        status: 'ALREADY_BOARDED',
        title: 'ALREADY BOARDED',
        studentName: 'Aarav Sharma',
        detail: 'Initial board recorded at 07:42 AM',
        time,
      });
      return;
    }

    // Success Boarding
    setBoardedCount((prev) => Math.min(totalExpected, prev + 1));
    setLastScan({
      status: 'SUCCESS',
      title: studentName.toUpperCase(),
      studentName: 'Class 7-B',
      detail: 'Boarded · Verified onto Bus 12',
      time,
    });
  };

  const handleRecordExit = (studentName: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setBoardedCount((prev) => Math.max(0, prev - 1));
    setLastScan({
      status: 'EXIT',
      title: studentName.toUpperCase(),
      studentName: 'Class 7-B',
      detail: 'Exit recorded · Safely departed at stop area',
      time,
    });
    setShowExitModal(false);
  };

  const toggleOffline = () => {
    if (isOffline) {
      setIsOffline(false);
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 3000);
    } else {
      setIsOffline(true);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        minHeight: '100vh',
        backgroundColor: colors.bg,
        padding: '20px 16px 80px 16px',
        boxSizing: 'border-box',
      }}
    >
      {/* Phone Canvas Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          boxShadow: shadows.md,
          border: `1px solid ${colors.border}`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          minHeight: '760px',
        }}
      >
        {/* Section 34: Offline / Online Status Banner */}
        {isOffline ? (
          <div
            style={{
              padding: '8px 16px',
              backgroundColor: colors.warning,
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <WifiOff size={14} strokeWidth={2.2} />
              <span>Offline &bull; Scans saving securely to this device</span>
            </div>
            <button
              onClick={toggleOffline}
              style={{
                background: 'none',
                border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: '4px',
                color: '#ffffff',
                fontSize: '10px',
                padding: '2px 6px',
                cursor: 'pointer',
              }}
            >
              Go Online
            </button>
          </div>
        ) : justSynced ? (
          <div
            style={{
              padding: '8px 16px',
              backgroundColor: colors.success,
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Check size={14} strokeWidth={2.4} />
            <span>Synced &bull; All scans uploaded successfully</span>
          </div>
        ) : null}

        {/* Top Header Banner (Deep Emerald Green) */}
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
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <ArrowLeft size={16} strokeWidth={2} />
              <span>Admin</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={toggleOffline}
                title="Toggle online/offline simulation"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  borderRadius: radii.full,
                  color: '#ffffff',
                  padding: '3px 8px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
              >
                {isOffline ? <WifiOff size={11} /> : <Wifi size={11} />}
                <span>{isOffline ? 'Offline' : 'Online'}</span>
              </button>

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
                {tripStarted ? '● Trip Active' : 'Trip Scheduled'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: radii.sm,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <BusFront size={22} strokeWidth={2} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                BUS 12
              </h2>
              <div style={{ fontSize: '12px', color: '#a7f3d0', fontWeight: 500 }}>
                Sector 62 &rarr; Oakridge Campus
              </div>
            </div>
          </div>
        </div>

        {/* If trip not started: Section 29 Start Trip state */}
        {!tripStarted ? (
          <div style={{ flex: 1, padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: colors.successLight,
                color: colors.success,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BusFront size={32} strokeWidth={2} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
                Morning Transit: Bus 12
              </h3>
              <p style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '4px' }}>
                Ready to commence student pickup along corridor
              </p>
            </div>
            <button
              onClick={() => setTripStarted(true)}
              style={{
                marginTop: '12px',
                width: '100%',
                padding: '16px',
                borderRadius: radii.md,
                backgroundColor: colors.success,
                color: colors.textWhite,
                border: 'none',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Play size={18} strokeWidth={2.4} />
              <span>START TRIP</span>
            </button>
          </div>
        ) : (
          /* Trip Active: Scan and Manifest workflow */
          <div style={{ flex: 1, padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
            {/* Passenger Boarding Progress Card */}
            <div
              style={{
                backgroundColor: colors.card,
                borderRadius: radii.lg,
                padding: '16px 18px',
                border: `1px solid ${colors.border}`,
                boxShadow: shadows.sm,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: radii.sm,
                      backgroundColor: colors.primaryLight,
                      color: colors.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <UsersRound size={16} strokeWidth={2} />
                  </div>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: colors.textPrimary, lineHeight: 1 }}>
                      {boardedCount} / {totalExpected}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: colors.textSecondary, marginTop: '2px' }}>
                      Students Boarded
                    </div>
                  </div>
                </div>
                <StatusBadge type="success" label="Active" />
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', height: '6px', backgroundColor: colors.borderLight, borderRadius: radii.full, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${(boardedCount / totalExpected) * 100}%`,
                    height: '100%',
                    backgroundColor: colors.success,
                    borderRadius: radii.full,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            {/* Large Central RFID Scan Action Card (Section 29 & 30: Custom RFID SVG, NO EMOJIS) */}
            <div
              onClick={() => handleRfidScan('Aarav Sharma', 'normal')}
              style={{
                backgroundColor: isDark ? 'rgba(37, 99, 235, 0.1)' : '#eff6ff',
                borderRadius: radii.lg,
                border: `2px dashed ${colors.primaryBorder}`,
                padding: '32px 20px',
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
              <div style={{ color: colors.primary, marginBottom: '10px' }}>
                <RfidIcon size={48} strokeWidth={1.8} color={colors.primary} />
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: colors.textPrimary }}>
                SCAN STUDENT
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: colors.primary, marginTop: '4px' }}>
                Tap Student RFID Card
              </div>
            </div>

            {/* Quick Testing Triggers for Hardware Edge Cases */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => handleRfidScan('Diya Sharma', 'normal')}
                style={{
                  flex: 1,
                  padding: '7px',
                  borderRadius: radii.sm,
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                  fontSize: '11px',
                  fontWeight: 600,
                  color: colors.textPrimary,
                  cursor: 'pointer',
                }}
              >
                Scan Diya
              </button>
              <button
                onClick={() => handleRfidScan('Kabir Mehta', 'wrong_bus')}
                style={{
                  flex: 1,
                  padding: '7px',
                  borderRadius: radii.sm,
                  backgroundColor: colors.dangerLight,
                  border: `1px solid ${colors.dangerBorder}`,
                  fontSize: '11px',
                  fontWeight: 700,
                  color: colors.danger,
                  cursor: 'pointer',
                }}
              >
                Test Wrong Bus
              </button>
              <button
                onClick={() => handleRfidScan('Aarav Sharma', 'duplicate')}
                style={{
                  flex: 1,
                  padding: '7px',
                  borderRadius: radii.sm,
                  backgroundColor: colors.warningLight,
                  border: `1px solid ${colors.warningBorder}`,
                  fontSize: '11px',
                  fontWeight: 700,
                  color: colors.warning,
                  cursor: 'pointer',
                }}
              >
                Test Duplicate
              </button>
            </div>

            {/* Immediate Scan Feedback Banner (Section 31 & 32) */}
            <div
              style={{
                padding: '12px 16px',
                backgroundColor:
                  lastScan.status === 'WRONG_BUS'
                    ? colors.dangerLight
                    : lastScan.status === 'ALREADY_BOARDED'
                    ? colors.warningLight
                    : colors.successLight,
                borderRadius: radii.md,
                border: `1px solid ${
                  lastScan.status === 'WRONG_BUS'
                    ? colors.dangerBorder
                    : lastScan.status === 'ALREADY_BOARDED'
                    ? colors.warningBorder
                    : colors.successBorder
                }`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {lastScan.status === 'WRONG_BUS' ? (
                    <TriangleAlert size={16} strokeWidth={2.4} color={colors.danger} />
                  ) : lastScan.status === 'ALREADY_BOARDED' ? (
                    <TriangleAlert size={16} strokeWidth={2.4} color={colors.warning} />
                  ) : (
                    <Check size={16} strokeWidth={2.4} color={colors.success} />
                  )}
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color:
                        lastScan.status === 'WRONG_BUS'
                          ? colors.danger
                          : lastScan.status === 'ALREADY_BOARDED'
                          ? colors.warning
                          : colors.success,
                    }}
                  >
                    {lastScan.title}
                  </span>
                </div>
                <span style={{ fontSize: '10px', color: colors.textMuted }}>{lastScan.time}</span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: colors.textPrimary, marginTop: '4px' }}>
                {lastScan.studentName}
              </div>
              <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '1px' }}>
                {lastScan.detail}
              </div>
            </div>

            {/* Secondary Actions: View List & Record Exit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={() => setShowManifest(!showManifest)}
                style={{
                  padding: '12px',
                  borderRadius: radii.md,
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                  boxShadow: shadows.sm,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  color: colors.textPrimary,
                }}
              >
                <ClipboardList size={16} strokeWidth={2} color={colors.primary} />
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Manifest ({totalExpected})</span>
              </button>

              <button
                onClick={() => setShowExitModal(true)}
                style={{
                  padding: '12px',
                  borderRadius: radii.md,
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                  boxShadow: shadows.sm,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  color: colors.textPrimary,
                }}
              >
                <School size={16} strokeWidth={2} color={colors.success} />
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Record Exit</span>
              </button>
            </div>

            {/* End Trip Button */}
            <button
              onClick={() => {
                if (confirm('Complete and end trip for Bus 12?')) {
                  setTripStarted(false);
                }
              }}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: radii.md,
                backgroundColor: colors.danger,
                color: colors.textWhite,
                border: 'none',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: shadows.sm,
                marginTop: 'auto',
              }}
            >
              <Square size={14} strokeWidth={2.4} fill="currentColor" />
              <span>END TRIP</span>
            </button>
          </div>
        )}

        {/* Student Manifest Drawer / Modal */}
        {showManifest && (
          <div
            style={{
              position: 'absolute',
              top: '56px',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: colors.card,
              zIndex: 30,
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
                Bus 12 Passenger Manifest
              </h3>
              <button
                onClick={() => setShowManifest(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted }}
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {students.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: colors.bg,
                    borderRadius: radii.sm,
                    border: `1px solid ${colors.borderLight}`,
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>{s.name}</div>
                    <div style={{ fontSize: '11px', color: colors.textSecondary }}>{s.class} &bull; {s.stop}</div>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: s.status === 'BOARDED' ? colors.success : colors.textMuted,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {s.status === 'BOARDED' ? (
                      <>
                        <Check size={12} strokeWidth={2.5} />
                        Boarded
                      </>
                    ) : (
                      'Pending'
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 33: Record Exit Modal (Do not automatically mark as safe) */}
        {showExitModal && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 40,
              display: 'flex',
              alignItems: 'flex-end',
            }}
          >
            <div
              style={{
                width: '100%',
                backgroundColor: colors.card,
                borderRadius: '16px 16px 0 0',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
                    SECTOR 62 METRO
                  </h3>
                  <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
                    Bus has arrived &bull; Record passenger exit
                  </div>
                </div>
                <button
                  onClick={() => setShowExitModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted }}
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>

              <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                Students expected to exit at this stop area:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    backgroundColor: colors.bg,
                    borderRadius: radii.sm,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>Aarav Sharma</div>
                    <div style={{ fontSize: '11px', color: colors.textMuted }}>Class 7-B &bull; Sector 62 Metro Gate #2</div>
                  </div>
                  <button
                    onClick={() => handleRecordExit('Aarav Sharma')}
                    style={{
                      padding: '8px 14px',
                      borderRadius: radii.sm,
                      backgroundColor: colors.success,
                      color: colors.textWhite,
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    RECORD EXIT
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
