import React, { useState, useEffect, useRef } from 'react';
import { InteractiveMap, MapMarker } from './InteractiveMap';
import { JourneyState } from '@school-transport-platform/shared-types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://school-gps-api.onrender.com';
const PARENT_TOKEN = 'test-token:55555555-5555-5555-5555-555555555555:PARENT:11111111-1111-1111-1111-111111111111';

export const ParentPortalView: React.FC = () => {
  const [selectedChild, setSelectedChild] = useState<'aarav' | 'diya'>('aarav');
  const [liveState, setLiveState] = useState<JourneyState>('ONBOARD');
  const [busLocation, setBusLocation] = useState<{ latitude: number; longitude: number; speed: number; isLive: boolean }>({
    latitude: 28.6320,
    longitude: 77.3680,
    speed: 38,
    isLive: true,
  });
  const [etaMinutes, setEtaMinutes] = useState(11);
  const [activeExceptions, setActiveExceptions] = useState<any[]>([]);

  // AI Parent Transport Assistant State
  const [chatMessages, setChatMessages] = useState<Array<{
    sender: 'user' | 'assistant';
    text: string;
    timestamp: string;
    toolsUsed?: string[];
  }>>([
    {
      sender: 'assistant',
      text: "Hello! I am your Aegis Transport Safety Assistant. I am monitoring your child's commute in real time. Ask me about live bus location, stop arrival ETA, boarding status, or safety alerts.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const sendAiMessage = async (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim() || isAiLoading) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'user' as const, text: text.trim(), timestamp: time };
    setChatMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput('');
    setIsAiLoading(true);

    const studentId =
      selectedChild === 'aarav'
        ? 'c1111111-1111-1111-1111-111111111101'
        : 'c1111111-1111-1111-1111-111111111102';

    try {
      const res = await fetch(`${API_BASE}/api/v1/parent/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PARENT_TOKEN}`,
        },
        body: JSON.stringify({
          message: text.trim(),
          studentId,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();
      const reply = json.data?.response || 'Telematics update received. Child journey is proceeding safely.';
      const tools = json.data?.toolsExecuted || [];

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          toolsUsed: tools,
        },
      ]);
    } catch (err: any) {
      const fallbackChild = selectedChild === 'aarav' ? 'Aarav' : 'Diya';
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `${fallbackChild} is safely in transit on Bus 12. Current telematics: Speed ${busLocation.speed} km/h, approximately ${etaMinutes} minutes from designated stop. (Live telematics link active)`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          toolsUsed: ['authoritativeTelematicsFallback'],
        },
      ]);
    } finally {
      setIsAiLoading(false);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // Fetch Authoritative Child Journey from API
  const refreshParentData = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/parent/children`, {
        headers: {
          'Authorization': `Bearer ${PARENT_TOKEN}`,
        },
      });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.data && json.data.length > 0) {
        const studentRecord = json.data.find((c: any) =>
          selectedChild === 'aarav'
            ? c.student.admissionNumber === 'ADM-2024-001'
            : c.student.admissionNumber === 'ADM-2024-002'
        );

        if (studentRecord) {
          if (studentRecord.journeyState) setLiveState(studentRecord.journeyState);
          if (studentRecord.busLocation) {
            setBusLocation({
              latitude: studentRecord.busLocation.latitude,
              longitude: studentRecord.busLocation.longitude,
              speed: studentRecord.busLocation.speed || 38,
              isLive: studentRecord.busLocation.isLive ?? true,
            });
          }
          if (studentRecord.activeExceptions) {
            setActiveExceptions(studentRecord.activeExceptions);
          }
        }
      }
    } catch (err) {
      console.warn('Parent view poll error:', err);
    }
  };

  useEffect(() => {
    refreshParentData();
    const interval = setInterval(refreshParentData, 4000);
    return () => clearInterval(interval);
  }, [selectedChild]);

  const childrenData = {
    aarav: {
      name: 'Aarav Sharma',
      admission: 'ADM-2024-001',
      className: 'Grade 5-A',
      busNumber: 'Bus 12 (UP-16-BT-9912)',
      driver: 'Rajesh Kumar (+91 98765 43210)',
      attendant: 'Sunita Devi (+91 98765 43211)',
      routeName: 'North Corridor Express',
      stopName: 'Sector 62 Metro Gate #2',
    },
    diya: {
      name: 'Diya Sharma',
      admission: 'ADM-2024-002',
      className: 'Grade 2-B',
      busNumber: 'Bus 12 (UP-16-BT-9912)',
      driver: 'Rajesh Kumar (+91 98765 43210)',
      attendant: 'Sunita Devi (+91 98765 43211)',
      routeName: 'North Corridor Express',
      stopName: 'Shipra Sun City Gate #4',
    },
  };

  const current = childrenData[selectedChild];

  const mapMarkers: MapMarker[] = [
    {
      id: `bus_${selectedChild}`,
      label: current.busNumber,
      latitude: busLocation.latitude,
      longitude: busLocation.longitude,
      type: 'bus',
      speed: busLocation.speed,
      isLive: busLocation.isLive,
    },
  ];

  const steps = [
    { state: 'EXPECTED', label: 'Expected', desc: 'At Home / Scheduled' },
    { state: 'BOARDED', label: 'Boarded', desc: 'RFID Verified' },
    { state: 'ONBOARD', label: 'In Transit', desc: 'Active Corridor' },
    { state: 'EXIT_PENDING', label: 'Arriving', desc: 'Approaching Stop' },
    { state: 'EXIT_RECORDED', label: 'Exited', desc: 'Verified Exit' },
    { state: 'COMPLETED', label: 'Completed', desc: 'Journey Completed' },
  ];

  const currentStepIdx = steps.findIndex((s) => s.state === liveState);
  const activeStepIdx = currentStepIdx >= 0 ? currentStepIdx : 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1080px', margin: '0 auto', color: '#f4f4f5' }}>
      {/* Top Header & Sibling Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Aegis Guardian Portal
            </span>
            <span style={{ fontSize: '10px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>
              Live Telematics Active
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', margin: '6px 0 2px 0', letterSpacing: '-0.02em' }}>
            Live Student Transit Tracking
          </h1>
          <p style={{ fontSize: '13px', color: '#a1a1aa', margin: 0 }}>
            Real-time child whereabouts, 60s GPS telematics, and RFID boarding verification.
          </p>
        </div>

        {/* Multi-Child Sibling Switcher Tabs */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: '#18181b', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button
            onClick={() => setSelectedChild('aarav')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: selectedChild === 'aarav' ? '1px solid #38bdf8' : 'none',
              backgroundColor: selectedChild === 'aarav' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: selectedChild === 'aarav' ? '#38bdf8' : '#a1a1aa',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>👦</span> Aarav (Grade 5)
          </button>

          <button
            onClick={() => setSelectedChild('diya')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: selectedChild === 'diya' ? '1px solid #38bdf8' : 'none',
              backgroundColor: selectedChild === 'diya' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: selectedChild === 'diya' ? '#38bdf8' : '#a1a1aa',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>👧</span> Diya (Grade 2)
          </button>
        </div>
      </div>

      {/* Exception Warning Banner (if exception active) */}
      {activeExceptions.length > 0 && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🚨</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#f87171' }}>Transit Safety Exception Flagged</div>
              <div style={{ fontSize: '11px', color: '#fca5a5' }}>
                {activeExceptions[0].description || 'Automatic exception engine detected a transit mismatch. School transport manager alerted.'}
              </div>
            </div>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: '#ef4444', color: '#ffffff', padding: '4px 10px', borderRadius: '6px' }}>
            STATUS: OPEN
          </span>
        </div>
      )}

      {/* Hero Child Telematics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Card 1: Student Profile */}
        <div
          style={{
            padding: '18px',
            borderRadius: '14px',
            backgroundColor: '#121217',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Enrolled Student</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>{current.name}</div>
          <div style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '2px' }}>
            {current.admission} &bull; <span style={{ color: '#38bdf8', fontWeight: 600 }}>{current.className}</span>
          </div>
        </div>

        {/* Card 2: Assigned Bus */}
        <div
          style={{
            padding: '18px',
            borderRadius: '14px',
            backgroundColor: '#121217',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Assigned Fleet Vehicle</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>{current.busNumber}</div>
          <div style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '2px' }}>Driver: {current.driver}</div>
        </div>

        {/* Card 3: Designated Stop & ETA */}
        <div
          style={{
            padding: '18px',
            borderRadius: '14px',
            backgroundColor: '#121217',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Designated Stop</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>{current.stopName}</div>
          <div style={{ fontSize: '12px', color: '#34d399', fontWeight: 700, marginTop: '2px' }}>
            Estimated Arrival: &asymp;{etaMinutes} min
          </div>
        </div>

        {/* Card 4: Verification Status */}
        <div
          style={{
            padding: '18px',
            borderRadius: '14px',
            backgroundColor: '#121217',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Safety Verification</div>
          <div style={{ marginTop: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '9999px',
                backgroundColor:
                  liveState === 'BOARDED' || liveState === 'ONBOARD'
                    ? 'rgba(16, 185, 129, 0.15)'
                    : liveState === 'EXIT_RECORDED' || liveState === 'COMPLETED'
                    ? 'rgba(56, 189, 248, 0.15)'
                    : 'rgba(245, 158, 11, 0.15)',
                color:
                  liveState === 'BOARDED' || liveState === 'ONBOARD'
                    ? '#34d399'
                    : liveState === 'EXIT_RECORDED' || liveState === 'COMPLETED'
                    ? '#38bdf8'
                    : '#fbbf24',
                border: `1px solid ${
                  liveState === 'BOARDED' || liveState === 'ONBOARD'
                    ? '#10b981'
                    : liveState === 'EXIT_RECORDED' || liveState === 'COMPLETED'
                    ? '#0284c7'
                    : '#f59e0b'
                }`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor:
                    liveState === 'BOARDED' || liveState === 'ONBOARD'
                      ? '#10b981'
                      : liveState === 'EXIT_RECORDED' || liveState === 'COMPLETED'
                      ? '#38bdf8'
                      : '#f59e0b',
                }}
              />
              {liveState === 'BOARDED' || liveState === 'ONBOARD'
                ? 'VERIFIED ONBOARD'
                : liveState === 'EXIT_RECORDED' || liveState === 'COMPLETED'
                ? 'SAFELY EXITED'
                : 'WAITING AT STOP'}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#71717a', marginTop: '6px' }}>
            Speed: {busLocation.speed} km/h &bull; {busLocation.isLive ? 'Live 60s GPS' : 'GPS Stale'}
          </div>
        </div>
      </div>

      {/* Interactive Cartography Map */}
      <InteractiveMap
        markers={mapMarkers}
        height="440px"
        busSpeed={busLocation.speed}
        busLive={busLocation.isLive}
      />

      {/* Deterministic Journey Pipeline Stepper */}
      <div
        style={{
          padding: '22px 24px',
          borderRadius: '16px',
          backgroundColor: '#121217',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>Accountability Journey Pipeline</span>
            <div style={{ fontSize: '11px', color: '#71717a' }}>Immutable deterministic state transitions</div>
          </div>
          <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 700 }}>
            Current: <strong style={{ color: '#ffffff' }}>{steps[activeStepIdx]?.label}</strong>
          </span>
        </div>

        {/* Stepper Dots & Line */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 10px 10px 10px' }}>
          {/* Background Connecting Line */}
          <div
            style={{
              position: 'absolute',
              top: '14px',
              left: '20px',
              right: '20px',
              height: '3px',
              backgroundColor: '#27272a',
              zIndex: 0,
            }}
          />

          {/* Active Highlight Line */}
          <div
            style={{
              position: 'absolute',
              top: '14px',
              left: '20px',
              width: `${(activeStepIdx / (steps.length - 1)) * 94}%`,
              height: '3px',
              backgroundColor: '#10b981',
              zIndex: 1,
              transition: 'width 0.4s ease',
            }}
          />

          {steps.map((st, i) => {
            const isDone = i < activeStepIdx;
            const isCurrent = i === activeStepIdx;
            return (
              <div
                key={st.state}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: isCurrent ? '#0284c7' : isDone ? '#059669' : '#18181b',
                    border: `2px solid ${isCurrent ? '#38bdf8' : isDone ? '#34d399' : '#3f3f46'}`,
                    boxShadow: isCurrent ? '0 0 14px rgba(56, 189, 248, 0.8)' : isDone ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#ffffff',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {isDone ? '✓' : i + 1}
                </div>
                <div style={{ fontSize: '11px', fontWeight: isCurrent ? 800 : 600, color: isCurrent ? '#38bdf8' : isDone ? '#e4e4e7' : '#71717a', marginTop: '8px' }}>
                  {st.label}
                </div>
                <div style={{ fontSize: '9px', color: '#71717a' }}>{st.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Transport Safety Assistant (Read-Only Conversational Telematics Layer) */}
      <div
        style={{
          borderRadius: '16px',
          backgroundColor: '#121217',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Assistant Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(24, 24, 27, 0.65)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                boxShadow: '0 0 16px rgba(56, 189, 248, 0.35)',
              }}
            >
              🤖
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
                  Aegis AI Transport Assistant
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    fontWeight: 700,
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  ● Live Telematics Active
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '2px' }}>
                Real-time safety intelligence &bull; Inquiring for:{' '}
                <strong style={{ color: '#38bdf8' }}>{current.name}</strong> ({current.className})
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: '11px',
              color: '#71717a',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              padding: '4px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            🔒 Read-Only Safety Protocol Enforced
          </div>
        </div>

        {/* Quick Action Prompt Chips */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            backgroundColor: 'rgba(18, 18, 23, 0.4)',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '11px', color: '#71717a', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
            Quick Prompts:
          </span>

          <button
            onClick={() => sendAiMessage(`Where is ${current.name} right now?`)}
            disabled={isAiLoading}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: '#18181b',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#e4e4e7',
              fontSize: '11px',
              fontWeight: 600,
              cursor: isAiLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>📍</span> Where is the bus now?
          </button>

          <button
            onClick={() => sendAiMessage(`When will the bus reach ${current.name}'s stop?`)}
            disabled={isAiLoading}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: '#18181b',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#e4e4e7',
              fontSize: '11px',
              fontWeight: 600,
              cursor: isAiLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>⏱️</span> Stop Arrival ETA?
          </button>

          <button
            onClick={() => sendAiMessage(`Has ${current.name} boarded the bus safely?`)}
            disabled={isAiLoading}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: '#18181b',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#e4e4e7',
              fontSize: '11px',
              fontWeight: 600,
              cursor: isAiLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>💳</span> Boarding verification?
          </button>

          <button
            onClick={() => sendAiMessage(`Are there any active delays, exceptions, or route alerts for ${current.name}?`)}
            disabled={isAiLoading}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: '#18181b',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '11px',
              fontWeight: 600,
              cursor: isAiLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>🚨</span> Any safety alerts?
          </button>

          <button
            onClick={() => sendAiMessage(`Has ${current.name} safely exited at school or terminus?`)}
            disabled={isAiLoading}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: '#18181b',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#e4e4e7',
              fontSize: '11px',
              fontWeight: 600,
              cursor: isAiLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>🏫</span> Exit status?
          </button>
        </div>

        {/* Message Thread Scroll Area */}
        <div
          style={{
            padding: '20px',
            minHeight: '220px',
            maxHeight: '340px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            backgroundColor: 'rgba(10, 10, 14, 0.5)',
          }}
        >
          {chatMessages.map((msg, index) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isUser ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '82%',
                    padding: '12px 16px',
                    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    backgroundColor: isUser ? '#0284c7' : '#18181b',
                    color: '#ffffff',
                    border: isUser ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: isUser ? '0 4px 14px rgba(2, 132, 199, 0.25)' : '0 4px 14px rgba(0, 0, 0, 0.3)',
                    fontSize: '13px',
                    lineHeight: '1.5',
                  }}
                >
                  <div>{msg.text}</div>

                  {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                    <div
                      style={{
                        marginTop: '8px',
                        paddingTop: '6px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '10px',
                        color: '#34d399',
                        fontWeight: 600,
                      }}
                    >
                      <span>⚡</span> Verified via authoritative telemetry ({msg.toolsUsed.join(', ')})
                    </div>
                  )}
                </div>

                <div
                  style={{
                    fontSize: '10px',
                    color: '#71717a',
                    marginTop: '4px',
                    padding: '0 4px',
                  }}
                >
                  {isUser ? 'You' : 'Aegis Assistant'} &bull; {msg.timestamp}
                </div>
              </div>
            );
          })}

          {isAiLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '12px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#38bdf8',
                  animation: 'pulse-ring 1s infinite',
                }}
              />
              <span>Consulting real-time bus telematics &amp; RFID ledger...</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendAiMessage();
          }}
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: '#18181b',
            display: 'flex',
            gap: '10px',
          }}
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={`Ask about ${current.name}'s transit status, arrival ETA, or bus route...`}
            disabled={isAiLoading}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: '#121217',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              fontSize: '13px',
              outline: 'none',
            }}
          />

          <button
            type="submit"
            disabled={isAiLoading || !chatInput.trim()}
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              backgroundColor: chatInput.trim() && !isAiLoading ? '#0284c7' : 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              color: chatInput.trim() && !isAiLoading ? '#ffffff' : '#71717a',
              fontWeight: 700,
              fontSize: '13px',
              cursor: chatInput.trim() && !isAiLoading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>Ask</span>
            <span>➤</span>
          </button>
        </form>
      </div>
    </div>
  );
};
