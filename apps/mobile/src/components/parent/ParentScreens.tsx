import React, { useState } from 'react';
import { JourneyState, Student } from '@school-transport-platform/shared-types';

export interface ChildOverviewData {
  student: Student;
  busNumber?: string;
  routeName?: string;
  stopName?: string;
  journeyState: JourneyState;
  etaMinutes?: number;
  lastKnownLocation?: {
    latitude: number;
    longitude: number;
    recordedAt: string;
    isLive: boolean;
  };
  safetyStatus: 'VERIFIED' | 'WARNING' | 'EXCEPTION';
  activeExceptions: Array<{ id: string; type: string; description: string; severity: string }>;
}

export interface JourneyHistoryItem {
  date: string;
  busNumber: string;
  routeName: string;
  boardingTime?: string;
  exitTime?: string;
  status: string;
  exceptionText?: string;
}

export interface ParentNotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  timestamp: string;
  read: boolean;
}

interface ParentAppViewProps {
  childrenList: ChildOverviewData[];
  selectedChildId: string;
  onSelectChild: (studentId: string) => void;
  history: JourneyHistoryItem[];
  notifications: ParentNotificationItem[];
  onRefresh: () => void;
}

export const ParentAppView: React.FC<ParentAppViewProps> = ({
  childrenList,
  selectedChildId,
  onSelectChild,
  history,
  notifications,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'tracking' | 'history' | 'notifications'>('tracking');

  const currentChild =
    childrenList.find((c) => c.student.id === selectedChildId) || childrenList[0] || null;

  const steps: { state: JourneyState; label: string }[] = [
    { state: 'EXPECTED', label: 'Scheduled' },
    { state: 'BOARDED', label: 'Boarded' },
    { state: 'ONBOARD', label: 'In Transit' },
    { state: 'EXIT_PENDING', label: 'At Stop' },
    { state: 'EXIT_RECORDED', label: 'Exited' },
    { state: 'COMPLETED', label: 'Done' },
  ];

  const currentStepIndex = currentChild ? steps.findIndex((s) => s.state === currentChild.journeyState) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. Multi-Child Selector */}
      {childrenList.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {childrenList.map((c) => {
            const isSelected = c.student.id === (currentChild?.student.id || '');
            return (
              <button
                key={c.student.id}
                onClick={() => onSelectChild(c.student.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: isSelected ? '1px solid #38bdf8' : '1px solid #334155',
                  backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : '#1e293b',
                  color: isSelected ? '#38bdf8' : '#94a3b8',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{c.student.firstName}</span>
                {c.safetyStatus === 'EXCEPTION' && (
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 2. Top Parent Sub-navigation */}
      <div
        style={{
          display: 'flex',
          backgroundColor: '#1e293b',
          borderRadius: '10px',
          padding: '4px',
          border: '1px solid #334155',
        }}
      >
        <button
          onClick={() => setActiveTab('tracking')}
          style={{
            flex: 1,
            padding: '8px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: activeTab === 'tracking' ? '#0f172a' : 'transparent',
            color: activeTab === 'tracking' ? '#ffffff' : '#94a3b8',
            fontWeight: 600,
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          Live Tracking
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            flex: 1,
            padding: '8px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: activeTab === 'history' ? '#0f172a' : 'transparent',
            color: activeTab === 'history' ? '#ffffff' : '#94a3b8',
            fontWeight: 600,
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          History
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          style={{
            flex: 1,
            padding: '8px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: activeTab === 'notifications' ? '#0f172a' : 'transparent',
            color: activeTab === 'notifications' ? '#ffffff' : '#94a3b8',
            fontWeight: 600,
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          Alerts
          {notifications.filter((n) => !n.read).length > 0 && (
            <span
              style={{
                backgroundColor: '#ef4444',
                color: '#fff',
                borderRadius: '9999px',
                padding: '1px 5px',
                fontSize: '10px',
              }}
            >
              {notifications.filter((n) => !n.read).length}
            </span>
          )}
        </button>
      </div>

      {/* 3. Tab: Live Tracking */}
      {activeTab === 'tracking' && currentChild && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Greeting & Status Banner */}
          <div
            style={{
              padding: '18px',
              borderRadius: '16px',
              backgroundColor: '#1e293b',
              border:
                currentChild.safetyStatus === 'EXCEPTION'
                  ? '1px solid #7f1d1d'
                  : currentChild.safetyStatus === 'WARNING'
                  ? '1px solid #78350f'
                  : '1px solid #334155',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Good Morning
                </span>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', margin: '2px 0 0 0' }}>
                  {currentChild.student.firstName} {currentChild.student.lastName}
                </h2>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Admission: {currentChild.student.admissionNumber} &bull; {currentChild.student.className || 'Grade 5'}
                </div>
              </div>

              {/* Safety Status Pill */}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  backgroundColor:
                    currentChild.safetyStatus === 'EXCEPTION'
                      ? 'rgba(239, 68, 68, 0.2)'
                      : currentChild.safetyStatus === 'WARNING'
                      ? 'rgba(245, 158, 11, 0.2)'
                      : 'rgba(16, 185, 129, 0.2)',
                  color:
                    currentChild.safetyStatus === 'EXCEPTION'
                      ? '#f87171'
                      : currentChild.safetyStatus === 'WARNING'
                      ? '#fbbf24'
                      : '#34d399',
                  border:
                    currentChild.safetyStatus === 'EXCEPTION'
                      ? '1px solid #ef4444'
                      : currentChild.safetyStatus === 'WARNING'
                      ? '1px solid #f59e0b'
                      : '1px solid #10b981',
                }}
              >
                {currentChild.safetyStatus === 'EXCEPTION'
                  ? '⚠ SAFETY EXCEPTION'
                  : currentChild.safetyStatus === 'WARNING'
                  ? 'GPS STALE'
                  : 'VERIFIED'}
              </span>
            </div>

            {/* Active Exception Alert Box */}
            {currentChild.activeExceptions.length > 0 && (
              <div
                style={{
                  marginTop: '14px',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f87171' }}>
                  {currentChild.activeExceptions[0].type}
                </div>
                <div style={{ fontSize: '11px', color: '#fca5a5', marginTop: '2px' }}>
                  {currentChild.activeExceptions[0].description}
                </div>
              </div>
            )}

            {/* Transport Details Card */}
            <div
              style={{
                marginTop: '16px',
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Assigned Vehicle</span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#38bdf8' }}>
                    {currentChild.busNumber || 'Bus KA-01-EXP-9999'}
                  </div>
                </div>
                {currentChild.etaMinutes !== undefined && (
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Estimated Arrival</span>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#10b981' }}>
                      ~{currentChild.etaMinutes} min
                    </div>
                  </div>
                )}
              </div>

              <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                Route: <strong style={{ color: '#fff' }}>{currentChild.routeName || 'North Corridor Express'}</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                Assigned Stop:{' '}
                <strong style={{ color: '#fff' }}>{currentChild.stopName || 'Sector 62 Metro Gate #2'}</strong>
              </div>

              {/* GPS Freshness Indicator */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '8px',
                  borderTop: '1px solid #1e293b',
                  fontSize: '11px',
                }}
              >
                <span style={{ color: '#94a3b8' }}>Telemetry:</span>
                {currentChild.lastKnownLocation ? (
                  currentChild.lastKnownLocation.isLive ? (
                    <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                      Live GPS (&le;60s)
                    </span>
                  ) : (
                    <span style={{ color: '#fbbf24' }}>
                      GPS Unavailable &bull; Last seen{' '}
                      {new Date(currentChild.lastKnownLocation.recordedAt).toLocaleTimeString()}
                    </span>
                  )
                ) : (
                  <span style={{ color: '#64748b' }}>Waiting for vehicle dispatch</span>
                )}
              </div>
            </div>

            {/* Journey Pipeline Progression */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                Journey Progression
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {steps.map((st, i) => {
                  const isDone = i <= currentStepIndex;
                  const isCurrent = i === currentStepIndex;
                  return (
                    <div
                      key={st.state}
                      style={{
                        flex: 1,
                        height: '6px',
                        borderRadius: '3px',
                        backgroundColor: isCurrent ? '#38bdf8' : isDone ? '#10b981' : '#334155',
                      }}
                      title={st.label}
                    />
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: '#64748b' }}>
                <span>{steps[0].label}</span>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                  ● {steps[currentStepIndex]?.label || currentChild.journeyState}
                </span>
                <span>{steps[steps.length - 1].label}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Tab: Journey History */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
            Historical Transit Records
          </div>
          {history.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              No completed journeys recorded yet for this student.
            </div>
          ) : (
            history.map((h, idx) => (
              <div
                key={idx}
                style={{
                  padding: '14px',
                  backgroundColor: '#1e293b',
                  borderRadius: '12px',
                  border: '1px solid #334155',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <strong style={{ color: '#f8fafc' }}>{h.date}</strong>
                  <span style={{ color: '#34d399', fontWeight: 600, fontSize: '12px' }}>{h.status}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {h.busNumber} &bull; {h.routeName}
                </div>
                <div style={{ fontSize: '11px', color: '#cbd5e1', display: 'flex', gap: '12px', marginTop: '4px' }}>
                  <span>Boarded: {h.boardingTime || '-'}</span>
                  <span>Exited: {h.exitTime || '-'}</span>
                </div>
                {h.exceptionText && (
                  <div style={{ fontSize: '11px', color: '#f87171', marginTop: '2px' }}>
                    Note: {h.exceptionText}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 5. Tab: Notifications */}
      {activeTab === 'notifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
            Push Alerts &amp; School Notices
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              Zero unread transport notifications.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: '14px',
                  backgroundColor: n.read ? '#1e293b' : 'rgba(56, 189, 248, 0.08)',
                  borderRadius: '12px',
                  border: n.read ? '1px solid #334155' : '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '13px', color: '#f8fafc' }}>{n.title}</strong>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>
                    {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1' }}>{n.body}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
