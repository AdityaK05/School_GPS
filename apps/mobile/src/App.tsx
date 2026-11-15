import React, { useState } from 'react';
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
  const [mode, setMode] = useState<'parent' | 'attendant'>('parent');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [gpsFresh, setGpsFresh] = useState<boolean>(true);
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0);

  // Attendant State
  const [feedback, setFeedback] = useState<ScanFeedback>({
    type: 'SUCCESS',
    message: 'NFC/RFID Scanner Active & Ready.',
    timestamp: new Date().toLocaleTimeString(),
  });

  const [students, setStudents] = useState<ManifestStudentItem[]>([
    {
      studentId: 'c1111111-1111-1111-1111-111111111101',
      studentName: 'Aarav Sharma',
      admissionNumber: 'ADM-2024-001',
      expectedStopName: 'Stop 1: Sector 62 Metro Gate #2',
      boardingStatus: 'BOARDED',
      exitStatus: 'PENDING',
    },
    {
      studentId: 'c1111111-1111-1111-1111-111111111102',
      studentName: 'Diya Sharma',
      admissionNumber: 'ADM-2024-002',
      expectedStopName: 'Stop 2: Shipra Sun City Gate #4',
      boardingStatus: 'PENDING',
      exitStatus: 'PENDING',
    },
    {
      studentId: 'c1111111-1111-1111-1111-111111111104',
      studentName: 'Ananya Verma',
      admissionNumber: 'ADM-2024-004',
      expectedStopName: 'Stop 2: Shipra Sun City Gate #4',
      boardingStatus: 'PENDING',
      exitStatus: 'PENDING',
    },
    {
      studentId: 'c1111111-1111-1111-1111-111111111105',
      studentName: 'Rohan Gupta',
      admissionNumber: 'ADM-2024-005',
      expectedStopName: 'Stop 3: Indirapuram Habitat Centre',
      boardingStatus: 'PENDING',
      exitStatus: 'PENDING',
    },
  ]);

  // Parent State (Multiple Children Support)
  const [childrenList, setChildrenList] = useState<ChildOverviewData[]>([
    {
      student: {
        id: 'c1111111-1111-1111-1111-111111111101',
        schoolId: '11111111-1111-1111-1111-111111111111',
        admissionNumber: 'ADM-2024-001',
        firstName: 'Aarav',
        lastName: 'Sharma',
        className: 'Grade 5',
        section: 'A',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      busNumber: 'Bus 12 (UP-16-BT-9912)',
      routeName: 'North Corridor Express',
      stopName: 'Sector 62 Metro Gate #2',
      journeyState: 'BOARDED',
      etaMinutes: 11,
      lastKnownLocation: {
        latitude: 28.6320,
        longitude: 77.3680,
        recordedAt: new Date().toISOString(),
        isLive: true,
      },
      safetyStatus: 'VERIFIED',
      activeExceptions: [],
    },
    {
      student: {
        id: 'c1111111-1111-1111-1111-111111111102',
        schoolId: '11111111-1111-1111-1111-111111111111',
        admissionNumber: 'ADM-2024-002',
        firstName: 'Diya',
        lastName: 'Sharma',
        className: 'Grade 2',
        section: 'B',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      busNumber: 'Bus 12 (UP-16-BT-9912)',
      routeName: 'North Corridor Express',
      stopName: 'Shipra Sun City Gate #4',
      journeyState: 'EXPECTED',
      etaMinutes: 20,
      lastKnownLocation: {
        latitude: 28.6320,
        longitude: 77.3680,
        recordedAt: new Date().toISOString(),
        isLive: true,
      },
      safetyStatus: 'VERIFIED',
      activeExceptions: [],
    },
  ]);

  const [selectedChildId, setSelectedChildId] = useState<string>('c1111111-1111-1111-1111-111111111101');

  const [history, setHistory] = useState<JourneyHistoryItem[]>([
    {
      date: 'Today, Morning',
      busNumber: 'Bus 12',
      routeName: 'North Corridor Express',
      boardingTime: '07:44 AM',
      exitTime: 'Pending',
      status: 'In Transit',
    },
    {
      date: 'Yesterday',
      busNumber: 'Bus 12',
      routeName: 'North Corridor Express',
      boardingTime: '07:42 AM',
      exitTime: '08:18 AM',
      status: 'Completed',
    },
  ]);

  const [notifications, setNotifications] = useState<ParentNotificationItem[]>([
    {
      id: 'notif_1',
      title: 'Bus Approaching Designated Stop',
      body: 'Bus 12 is within 1.5 km of Sector 62 Metro Gate #2 (ETA: ~11 min).',
      type: 'BUS_APPROACHING',
      timestamp: new Date().toISOString(),
      read: false,
    },
    {
      id: 'notif_2',
      title: 'RFID Boarding Verified',
      body: 'Aarav Sharma safely boarded Bus 12 via hardware card tap.',
      type: 'BOARDING',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      read: true,
    },
  ]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        minHeight: '100vh',
        backgroundColor: '#09090b',
        padding: '0',
        margin: '0',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          minHeight: '100vh',
          backgroundColor: '#09090b',
          color: '#f8fafc',
          fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 0 50px rgba(0, 0, 0, 0.8)',
          boxSizing: 'border-box',
        }}
      >
        {/* Mobile Status Bar Emulation */}
        <div
          style={{
            padding: '12px 18px 6px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: '#71717a',
            fontWeight: 700,
          }}
        >
          <span>9:41</span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span>5G</span>
            <span>● 100%</span>
          </div>
        </div>

        {/* Top Header & Role Switcher */}
        <header
          style={{
            padding: '12px 18px',
            backgroundColor: '#121217',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
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
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
              Aegis Mobile {mode === 'attendant' ? '• Attendant' : '• Guardian'}
            </span>
          </div>

          <button
            onClick={() => setMode(mode === 'attendant' ? 'parent' : 'attendant')}
            style={{
              padding: '6px 12px',
              backgroundColor: '#18181b',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {mode === 'attendant' ? 'Parent View' : 'Attendant'} ⇄
          </button>
        </header>

        {/* Main Content Body */}
        <main style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', boxSizing: 'border-box' }}>
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
                busNumber="BUS-12"
                routeName="North Corridor Express"
                currentStopName="Sector 62 Metro Gate #2"
                onboardCount={students.filter((s) => s.boardingStatus === 'BOARDED' && s.exitStatus !== 'EXITED').length}
                totalExpected={students.length}
                isOnline={isOnline}
                gpsFresh={gpsFresh}
              />

              {/* Real-time Scan Feedback Banner */}
              <ScanFeedbackCard feedback={feedback} />

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
                      timestamp: new Date().toLocaleTimeString(),
                    });
                  }}
                />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
