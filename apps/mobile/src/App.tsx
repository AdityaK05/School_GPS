import React, { useState, useEffect } from 'react';
import {
  TripHeaderCard,
  ScanFeedbackCard,
  ManifestList,
  ManifestStudentItem,
} from './components/attendant/AttendantScreens';
import {
  ParentAppView,
  ChildOverviewData,
  JourneyHistoryItem,
  ParentNotificationItem,
} from './components/parent/ParentScreens';
import { ScanFeedback } from './services/attendant.service';

export const App: React.FC = () => {
  const [mode, setMode] = useState<'attendant' | 'parent'>('parent');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [gpsFresh, setGpsFresh] = useState<boolean>(true);
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0);

  // Attendant State
  const [feedback, setFeedback] = useState<ScanFeedback>({
    type: 'SUCCESS',
    message: 'System Ready. Scan Student RFID Card.',
    timestamp: new Date().toISOString(),
  });

  const [students, setStudents] = useState<ManifestStudentItem[]>([
    {
      studentId: 'std_001',
      studentName: 'Aarav Sharma',
      admissionNumber: 'ADM-2024-001',
      expectedStopName: 'Main Gate Stop #2',
      boardingStatus: 'BOARDED',
      exitStatus: 'PENDING',
    },
    {
      studentId: 'std_002',
      studentName: 'Diya Sharma',
      admissionNumber: 'ADM-2024-002',
      expectedStopName: 'Sector 62 Metro',
      boardingStatus: 'PENDING',
      exitStatus: 'PENDING',
    },
  ]);

  // Parent State (Multiple Children Support)
  const [childrenList, setChildrenList] = useState<ChildOverviewData[]>([
    {
      student: {
        id: 'std_001',
        schoolId: 'sch_001',
        admissionNumber: 'ADM-2024-001',
        firstName: 'Aarav',
        lastName: 'Sharma',
        className: 'Grade 5',
        section: 'A',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      busNumber: 'Bus 12 (KA-01-EXP-9999)',
      routeName: 'North Corridor Express',
      stopName: 'Sector 62 Metro Gate #2',
      journeyState: 'ONBOARD',
      etaMinutes: 12,
      lastKnownLocation: {
        latitude: 12.9716,
        longitude: 77.5946,
        recordedAt: new Date().toISOString(),
        isLive: true,
      },
      safetyStatus: 'VERIFIED',
      activeExceptions: [],
    },
    {
      student: {
        id: 'std_002',
        schoolId: 'sch_001',
        admissionNumber: 'ADM-2024-002',
        firstName: 'Diya',
        lastName: 'Sharma',
        className: 'Grade 2',
        section: 'B',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      busNumber: 'Bus 08 (KA-01-EXP-8888)',
      routeName: 'East Wing Shuttle',
      stopName: 'Park Avenue Block B',
      journeyState: 'EXPECTED',
      etaMinutes: 25,
      lastKnownLocation: {
        latitude: 12.9812,
        longitude: 77.6045,
        recordedAt: new Date().toISOString(),
        isLive: true,
      },
      safetyStatus: 'VERIFIED',
      activeExceptions: [],
    },
  ]);

  const [selectedChildId, setSelectedChildId] = useState<string>('std_001');

  const [history, setHistory] = useState<JourneyHistoryItem[]>([
    {
      date: '15 Nov 2026',
      busNumber: 'Bus 12',
      routeName: 'North Corridor Express',
      boardingTime: '07:42 AM',
      exitTime: '08:19 AM',
      status: 'Completed',
    },
    {
      date: '14 Nov 2026',
      busNumber: 'Bus 12',
      routeName: 'North Corridor Express',
      boardingTime: '07:40 AM',
      exitTime: '08:18 AM',
      status: 'Completed',
    },
  ]);

  const [notifications, setNotifications] = useState<ParentNotificationItem[]>([
    {
      id: 'notif_1',
      title: 'Bus Approaching Stop',
      body: 'Bus 12 is within 2 km of Sector 62 Metro Gate #2 (ETA: 4 min).',
      type: 'BUS_APPROACHING',
      timestamp: new Date().toISOString(),
      read: false,
    },
    {
      id: 'notif_2',
      title: 'Boarding Confirmed',
      body: 'Aarav Sharma successfully boarded Bus 12 via verified RFID scan.',
      type: 'BOARDING',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: true,
    },
  ]);

  return (
    <div
      style={{
        maxWidth: '480px',
        margin: '0 auto',
        minHeight: '100vh',
        backgroundColor: '#09090b',
        color: '#f8fafc',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Mobile Status Header */}
      <header
        style={{
          padding: '14px 18px',
          backgroundColor: '#121215',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #27272a',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 8px #10b981',
            }}
          />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#f4f4f5' }}>
            {mode === 'attendant' ? 'Attendant Portal' : 'Parent Portal'}
          </span>
        </div>

        <button
          onClick={() => setMode(mode === 'attendant' ? 'parent' : 'attendant')}
          style={{
            padding: '5px 12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            color: '#a1a1aa',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Switch to {mode === 'attendant' ? 'Parent' : 'Attendant'}
        </button>
      </header>

      {/* Main Body */}
      <main style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {mode === 'parent' ? (
          <ParentAppView
            childrenList={childrenList}
            selectedChildId={selectedChildId}
            onSelectChild={setSelectedChildId}
            history={history}
            notifications={notifications}
            onRefresh={() => {}}
          />
        ) : (
          <>
            {/* Trip Header Status Card */}
            <TripHeaderCard
              busNumber="BUS-04"
              routeName="Morning Route North-1"
              currentStopName="Main Gate Stop #2"
              onboardCount={students.filter((s) => s.boardingStatus === 'BOARDED' && s.exitStatus !== 'EXITED').length}
              totalExpected={students.length}
              isOnline={isOnline}
              gpsFresh={gpsFresh}
            />

            {/* Real-time Scan Feedback Banner */}
            <ScanFeedbackCard feedback={feedback} />

            {/* Offline Queue Indicator & Action */}
            {!isOnline && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                  borderRadius: '8px',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  fontSize: '13px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>Offline Scans Queued: {pendingQueueCount}</span>
                <button
                  onClick={() => {
                    setIsOnline(true);
                    setPendingQueueCount(0);
                  }}
                  style={{
                    padding: '4px 10px',
                    backgroundColor: '#f59e0b',
                    color: '#000',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Sync Now
                </button>
              </div>
            )}

            {/* Student Manifest Roster */}
            <div style={{ flex: 1 }}>
              <ManifestList
                students={students}
                onManualOverride={(studentId: string, action: 'BOARD' | 'EXIT') => {
                  setStudents((prev) =>
                    prev.map((s) => {
                      if (s.studentId !== studentId) return s;
                      if (action === 'BOARD') return { ...s, boardingStatus: 'BOARDED' };
                      if (action === 'EXIT') return { ...s, exitStatus: 'EXITED' };
                      return s;
                    })
                  );
                  setFeedback({
                    type: 'SUCCESS',
                    message: `Manual Override: ${action} recorded for student ${studentId}`,
                    timestamp: new Date().toISOString(),
                  });
                }}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default App;
