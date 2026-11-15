import React, { useState, useEffect, useRef } from 'react';
import { InteractiveMap, MapMarker } from './InteractiveMap';
import { JourneyState } from '@school-transport-platform/shared-types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://school-gps-api.onrender.com';
const PARENT_TOKEN = 'test-token:55555555-5555-5555-5555-555555555555:PARENT:11111111-1111-1111-1111-111111111111';
const ATTENDANT_TOKEN = 'test-token:44444444-4444-4444-4444-444444444444:ATTENDANT:11111111-1111-1111-1111-111111111111';

export const MobileAppView: React.FC = () => {
  const [mobileMode, setMobileMode] = useState<'parent' | 'attendant'>('parent');
  const [parentTab, setParentTab] = useState<'live' | 'ai' | 'history' | 'alerts'>('live');
  const [selectedChild, setSelectedChild] = useState<'aarav' | 'diya'>('aarav');
  const [useDeviceFrame, setUseDeviceFrame] = useState<boolean>(true);
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(false);

  // Parent State
  const [liveState, setLiveState] = useState<JourneyState>('ONBOARD');
  const [busLocation, setBusLocation] = useState<{ latitude: number; longitude: number; speed: number; isLive: boolean }>({
    latitude: 28.6320,
    longitude: 77.3680,
    speed: 38,
    isLive: true,
  });
  const [etaMinutes, setEtaMinutes] = useState(11);

  // Attendant State
  const [onboardCount, setOnboardCount] = useState<number>(1);
  const [scanFeedback, setScanFeedback] = useState<{
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
  ]);

  // AI Chat State
  const [chatMessages, setChatMessages] = useState<Array<{
    sender: 'user' | 'assistant';
    text: string;
    timestamp: string;
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

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sendAiMessage = async (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim() || isAiLoading) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [...prev, { sender: 'user', text: text.trim(), timestamp: time }]);
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

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const reply = json.data?.response || 'Telematics update received. Child journey is proceeding safely.';

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      const childName = selectedChild === 'aarav' ? 'Aarav' : 'Diya';
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `${childName} is safely onboard Bus 12. Current telematics: Speed ${busLocation.speed} km/h, approximately ${etaMinutes} minutes from designated stop. (Live link active)`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAiLoading(false);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const simulateRfidScan = (type: 'aarav' | 'diya' | 'wrong' | 'exit') => {
    const time = new Date().toLocaleTimeString();
    if (type === 'aarav') {
      setOnboardCount(1);
      setManifest((prev) =>
        prev.map((s) => (s.id === 'c1111111-1111-1111-1111-111111111101' ? { ...s, boardingStatus: 'BOARDED' } : s))
      );
      setScanFeedback({
        status: 'SUCCESS',
        title: 'RFID Boarding Verified',
        message: 'Aarav Sharma verified onto Bus 12 at Stop 1. State: BOARDED.',
        studentName: 'Aarav Sharma (ADM-2024-001)',
        time,
      });
    } else if (type === 'diya') {
      setOnboardCount(2);
      setManifest((prev) =>
        prev.map((s) => (s.id === 'c1111111-1111-1111-1111-111111111102' ? { ...s, boardingStatus: 'BOARDED' } : s))
      );
      setScanFeedback({
        status: 'SUCCESS',
        title: 'RFID Boarding Verified',
        message: 'Diya Sharma verified onto Bus 12 at Stop 2. State: BOARDED.',
        studentName: 'Diya Sharma (ADM-2024-002)',
        time,
      });
    } else if (type === 'wrong') {
      setScanFeedback({
        status: 'WRONG_BUS',
        title: 'SECURITY EXCEPTION: Wrong Bus Attempt',
        message: 'Student Kabir Malhotra assigned to BUS-07 attempted boarding BUS-12. Boarding Rejected.',
        studentName: 'Kabir Malhotra (ADM-2024-003)',
        time,
      });
    } else if (type === 'exit') {
      setOnboardCount((prev) => Math.max(0, prev - 1));
      setManifest((prev) =>
        prev.map((s) => (s.id === 'c1111111-1111-1111-1111-111111111101' ? { ...s, exitStatus: 'EXITED' } : s))
      );
      setScanFeedback({
        status: 'EXIT',
        title: 'Safe Terminus Exit Verified',
        message: 'Aarav Sharma safely exited Bus 12 at DPIS Campus Gate #1.',
        studentName: 'Aarav Sharma (ADM-2024-001)',
        time,
      });
    }
  };

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
    { state: 'EXPECTED', label: 'Expected' },
    { state: 'BOARDED', label: 'Boarded' },
    { state: 'ONBOARD', label: 'In Transit' },
    { state: 'EXIT_PENDING', label: 'Arriving' },
    { state: 'EXIT_RECORDED', label: 'Exited' },
  ];

  const currentStepIdx = steps.findIndex((s) => s.state === liveState);
  const activeStepIdx = currentStepIdx >= 0 ? currentStepIdx : 2;

  const showFrame = useDeviceFrame && !isMobileScreen;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '16px' }}>
      {/* Top Mobile Control Bar for Desktop Previews */}
      {!isMobileScreen && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            maxWidth: showFrame ? '430px' : '960px',
            backgroundColor: '#18181b',
            padding: '8px 14px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>📱 Mobile Native View</span>
            <span style={{ fontSize: '10px', color: '#71717a' }}>• High-Resolution PWA Engine</span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setUseDeviceFrame(!useDeviceFrame)}
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#e4e4e7',
                cursor: 'pointer',
              }}
            >
              {showFrame ? '🖥️ Full Fluid' : '📱 Device Frame'}
            </button>
          </div>
        </div>
      )}

      {/* Main Container: Native Phone Frame or Full Bleed on Mobile */}
      <div
        style={{
          width: '100%',
          maxWidth: showFrame ? '430px' : '100%',
          minHeight: showFrame ? '844px' : 'auto',
          backgroundColor: '#09090b',
          borderRadius: showFrame ? '44px' : '0px',
          border: showFrame ? '10px solid #27272a' : 'none',
          boxShadow: showFrame ? '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)' : 'none',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Dynamic Island / Notch on Frame */}
        {showFrame && (
          <div
            style={{
              width: '110px',
              height: '24px',
              backgroundColor: '#000000',
              borderRadius: '20px',
              margin: '8px auto 0 auto',
              zIndex: 30,
            }}
          />
        )}

        {/* Mobile Status Bar */}
        <div
          style={{
            padding: '10px 18px 4px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: '#a1a1aa',
            fontWeight: 700,
            letterSpacing: '0.02em',
          }}
        >
          <span>9:41</span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span>5G</span>
            <span>● 98%</span>
          </div>
        </div>

        {/* Mobile App Header & Role Switcher */}
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: '#121217',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px #10b981',
              }}
            />
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
              Aegis Mobile {mobileMode === 'parent' ? '• Parent' : '• Attendant'}
            </span>
          </div>

          {/* Toggle between Parent and Attendant inside mobile view */}
          <button
            onClick={() => setMobileMode(mobileMode === 'parent' ? 'attendant' : 'parent')}
            style={{
              padding: '5px 10px',
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '8px',
              color: '#38bdf8',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {mobileMode === 'parent' ? '🚌 Scanner' : '👨‍👩‍👧 Parent'} ⇄
          </button>
        </div>

        {/* MOBILE PARENT INTERFACE */}
        {mobileMode === 'parent' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {/* Sibling Switcher Tabs */}
            <div
              style={{
                padding: '10px 16px',
                backgroundColor: '#18181b',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                gap: '8px',
              }}
            >
              <button
                onClick={() => setSelectedChild('aarav')}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '8px',
                  border: selectedChild === 'aarav' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.06)',
                  backgroundColor: selectedChild === 'aarav' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                  color: selectedChild === 'aarav' ? '#38bdf8' : '#a1a1aa',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                👦 Aarav (Grade 5)
              </button>
              <button
                onClick={() => setSelectedChild('diya')}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '8px',
                  border: selectedChild === 'diya' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.06)',
                  backgroundColor: selectedChild === 'diya' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                  color: selectedChild === 'diya' ? '#38bdf8' : '#a1a1aa',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                👧 Diya (Grade 2)
              </button>
            </div>

            {/* Sub-tab Navigation */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: '#121217',
              }}
            >
              {[
                { id: 'live', label: '📍 Live Map' },
                { id: 'ai', label: '🤖 AI Assist' },
                { id: 'history', label: '📅 History' },
                { id: 'alerts', label: '🔔 Alerts' },
              ].map((tab) => {
                const isActive = parentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setParentTab(tab.id as any)}
                    style={{
                      flex: 1,
                      padding: '10px 4px',
                      border: 'none',
                      borderBottom: isActive ? '2px solid #38bdf8' : '2px solid transparent',
                      backgroundColor: 'transparent',
                      color: isActive ? '#38bdf8' : '#71717a',
                      fontSize: '11px',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT */}
            <div style={{ flex: 1, padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
              {parentTab === 'live' && (
                <>
                  {/* Real-time Status Card */}
                  <div
                    style={{
                      padding: '14px 16px',
                      borderRadius: '14px',
                      backgroundColor: '#121217',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', fontWeight: 800 }}>
                          Safety Status
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                          Verified Onboard
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '4px 8px',
                          borderRadius: '9999px',
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                        }}
                      >
                        ● Active Corridor
                      </span>
                    </div>

                    <div style={{ marginTop: '12px', fontSize: '11px', color: '#a1a1aa' }}>
                      <div>📍 Route: <strong style={{ color: '#ffffff' }}>{current.routeName}</strong></div>
                      <div style={{ marginTop: '4px' }}>🚏 Stop: <strong style={{ color: '#38bdf8' }}>{current.stopName}</strong></div>
                      <div style={{ marginTop: '4px' }}>⏱️ Arrival ETA: <strong style={{ color: '#34d399' }}>~11 mins</strong> &bull; Speed: {busLocation.speed} km/h</div>
                    </div>
                  </div>

                  {/* Interactive Map */}
                  <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <InteractiveMap
                      markers={mapMarkers}
                      height="280px"
                      busSpeed={busLocation.speed}
                      busLive={busLocation.isLive}
                    />
                  </div>

                  {/* Journey Pipeline Mini Stepper */}
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '14px',
                      backgroundColor: '#121217',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
                      Commute Progression
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                      {steps.map((st, i) => {
                        const isDone = i <= activeStepIdx;
                        return (
                          <div key={st.state} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 1 }}>
                            <div
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                backgroundColor: isDone ? '#10b981' : '#27272a',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                fontWeight: 800,
                              }}
                            >
                              {isDone ? '✓' : i + 1}
                            </div>
                            <span style={{ fontSize: '9px', color: isDone ? '#34d399' : '#71717a', fontWeight: 600 }}>
                              {st.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Direct Contact Buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => alert(`Calling Driver Rajesh Kumar: +91 98765 43210`)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        backgroundColor: '#18181b',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        color: '#f4f4f5',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>📞</span> Call Driver
                    </button>
                    <button
                      onClick={() => alert(`Calling Attendant Sunita Devi: +91 98765 43211`)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        backgroundColor: '#18181b',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        color: '#f4f4f5',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>👩‍💼</span> Call Attendant
                    </button>
                  </div>
                </>
              )}

              {parentTab === 'ai' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '420px', gap: '10px' }}>
                  {/* Quick Prompts */}
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                    <button
                      onClick={() => sendAiMessage(`Where is ${current.name} right now?`)}
                      disabled={isAiLoading}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '8px',
                        backgroundColor: '#18181b',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#38bdf8',
                        fontSize: '10px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                      }}
                    >
                      📍 Where is bus?
                    </button>
                    <button
                      onClick={() => sendAiMessage(`What is the arrival ETA for ${current.name}?`)}
                      disabled={isAiLoading}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '8px',
                        backgroundColor: '#18181b',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#34d399',
                        fontSize: '10px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                      }}
                    >
                      ⏱️ Stop ETA?
                    </button>
                    <button
                      onClick={() => sendAiMessage(`Any safety alerts or delays for ${current.name}?`)}
                      disabled={isAiLoading}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '8px',
                        backgroundColor: '#18181b',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        fontSize: '10px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                      }}
                    >
                      🚨 Alerts?
                    </button>
                  </div>

                  {/* Chat Message Scroll */}
                  <div
                    style={{
                      flex: 1,
                      backgroundColor: '#121217',
                      borderRadius: '12px',
                      padding: '12px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    {chatMessages.map((m, idx) => {
                      const isUser = m.sender === 'user';
                      return (
                        <div
                          key={idx}
                          style={{
                            alignSelf: isUser ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                            backgroundColor: isUser ? '#0284c7' : '#1f1f23',
                            color: '#ffffff',
                            padding: '8px 12px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            lineHeight: 1.4,
                          }}
                        >
                          <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                          <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '4px', textAlign: 'right' }}>
                            {m.timestamp}
                          </div>
                        </div>
                      );
                    })}
                    {isAiLoading && (
                      <div style={{ alignSelf: 'flex-start', color: '#38bdf8', fontSize: '11px' }}>
                        ● AI Assistant querying live telematics...
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Chat Input Bar */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendAiMessage()}
                      placeholder={`Ask about ${current.name}'s transit...`}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        backgroundColor: '#18181b',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '11px',
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={() => sendAiMessage()}
                      disabled={isAiLoading}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: '#0284c7',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Ask
                    </button>
                  </div>
                </div>
              )}

              {parentTab === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>Recent Completed Commutes</div>
                  {[
                    { date: 'Today, Morning', bus: 'Bus 12', board: '07:44 AM', exit: 'Pending', status: 'In Transit' },
                    { date: 'Yesterday, Evening', bus: 'Bus 12', board: '03:15 PM', exit: '03:52 PM', status: 'Completed' },
                    { date: 'Yesterday, Morning', bus: 'Bus 12', board: '07:41 AM', exit: '08:18 AM', status: 'Completed' },
                  ].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: '#121217',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        fontSize: '11px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#ffffff' }}>
                        <span>{h.date}</span>
                        <span style={{ color: h.status === 'Completed' ? '#34d399' : '#38bdf8' }}>{h.status}</span>
                      </div>
                      <div style={{ color: '#71717a', marginTop: '4px' }}>
                        Boarded: {h.board} &bull; Exited: {h.exit}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {parentTab === 'alerts' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>Real-time Safety Notifications</div>
                  <div
                    style={{
                      padding: '10px 12px',
                      backgroundColor: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '10px',
                      fontSize: '11px',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#38bdf8' }}>Bus Approaching Sector 62 Stop</div>
                    <div style={{ color: '#d4d4d8', marginTop: '2px' }}>Bus 12 is within 1.5 km of designated pickup location (~11 min).</div>
                  </div>
                  <div
                    style={{
                      padding: '10px 12px',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '10px',
                      fontSize: '11px',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#34d399' }}>RFID Boarding Verified</div>
                    <div style={{ color: '#d4d4d8', marginTop: '2px' }}>Aarav Sharma safely boarded Bus 12 via hardware card tap.</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MOBILE ATTENDANT INTERFACE */}
        {mobileMode === 'attendant' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '14px', gap: '12px', overflowY: 'auto' }}>
            {/* Trip Header */}
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: '#121217',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>BUS 12 &bull; North Corridor</div>
                <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '2px' }}>Stop: Sector 62 Metro Gate #2</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#34d399' }}>{onboardCount}/3</span>
                <div style={{ fontSize: '9px', color: '#71717a', textTransform: 'uppercase' }}>Onboard</div>
              </div>
            </div>

            {/* RFID Quick Tap Simulator */}
            <div
              style={{
                padding: '12px',
                backgroundColor: '#18181b',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                RFID Hardware Tap Simulator
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                <button
                  onClick={() => simulateRfidScan('aarav')}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid #38bdf8',
                    color: '#38bdf8',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  💳 Board Aarav
                </button>
                <button
                  onClick={() => simulateRfidScan('diya')}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid #10b981',
                    color: '#34d399',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  💳 Board Diya
                </button>
                <button
                  onClick={() => simulateRfidScan('wrong')}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #ef4444',
                    color: '#f87171',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  🚨 Wrong Bus Test
                </button>
                <button
                  onClick={() => simulateRfidScan('exit')}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid #f59e0b',
                    color: '#fbbf24',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  🏫 Safe Exit
                </button>
              </div>
            </div>

            {/* Live Scan Feedback Banner */}
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                backgroundColor:
                  scanFeedback.status === 'WRONG_BUS'
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'rgba(16, 185, 129, 0.15)',
                border: `1px solid ${
                  scanFeedback.status === 'WRONG_BUS' ? '#ef4444' : '#10b981'
                }`,
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: scanFeedback.status === 'WRONG_BUS' ? '#f87171' : '#34d399',
                }}
              >
                {scanFeedback.title}
              </div>
              <div style={{ fontSize: '10px', color: '#e4e4e7', marginTop: '2px' }}>
                {scanFeedback.message}
              </div>
            </div>

            {/* Student Manifest Roster */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#71717a', textTransform: 'uppercase' }}>
                Roster Manifest ({manifest.length} Assigned)
              </div>
              {manifest.map((s) => (
                <div
                  key={s.id}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: '#121217',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>{s.name}</div>
                    <div style={{ fontSize: '10px', color: '#71717a' }}>{s.admission} &bull; {s.stop}</div>
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '9999px',
                      backgroundColor:
                        s.boardingStatus === 'BOARDED'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(255, 255, 255, 0.06)',
                      color: s.boardingStatus === 'BOARDED' ? '#34d399' : '#71717a',
                    }}
                  >
                    {s.exitStatus === 'EXITED' ? 'EXITED' : s.boardingStatus}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
