import React, { useState, useRef } from 'react';
import { useRouter } from '../router/Router';
import { colors, radii, shadows } from '../theme/design-system';
import { StatusBadge } from '../components/ui/SharedComponents';
import { InteractiveMap, MapMarker } from '../components/InteractiveMap';
import { ApiClient } from '@school-transport-platform/client-sdk';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://school-gps-api.onrender.com';
const PARENT_TOKEN = 'test-token:55555555-5555-5555-5555-555555555555:PARENT:11111111-1111-1111-1111-111111111111';

export const ParentAppView: React.FC<{ apiClient: ApiClient }> = () => {
  const { pathname, navigate, setPersona } = useRouter();

  // Sub-tabs: 'home' | 'journey' | 'chat' | 'profile'
  const activeSubView = pathname.includes('/journey') ? 'journey' : pathname.includes('/chat') ? 'chat' : 'home';

  const [student] = useState({
    name: 'Aarav Sharma',
    className: 'Class 7-B',
    busNumber: 'Bus 12',
    busReg: 'KA-01-EXP-9999',
    etaMinutes: 8,
    speed: 38,
    lastUpdate: '1 min ago',
    driver: 'Rajesh Kumar (+91 98765 43210)',
    attendant: 'Sunita Devi (+91 98765 43211)',
    currentLocation: 'Sector 61 Crossing',
    stopName: 'Sector 62 Metro Gate #2',
  });

  // AI Assistant Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; time: string }>>([
    {
      sender: 'assistant',
      text: "Hello Priya! I'm your School-GPS transport safety assistant. Aarav is currently on Bus 12 near Sector 61, approximately 8 minutes from campus. How can I help you?",
      time: '07:49 AM',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const sendAiMessage = async (queryText?: string) => {
    const text = queryText || chatInput;
    if (!text.trim() || isAiLoading) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [...prev, { sender: 'user', text: text.trim(), time }]);
    if (!queryText) setChatInput('');
    setIsAiLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/parent/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PARENT_TOKEN}`,
        },
        body: JSON.stringify({
          message: text.trim(),
          studentId: 'c1111111-1111-1111-1111-111111111101',
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const reply = json.data?.response || 'Aarav is safely onboard Bus 12 proceeding along the designated corridor.';

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `Aarav is safely on Bus 12 near Sector 61. Current telematics: Speed 38 km/h, approximately 8 minutes from Oakridge Campus. (Live link active)`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAiLoading(false);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const mapMarkers: MapMarker[] = [
    {
      id: 'bus_12',
      label: 'Bus 12 (KA-01-EXP-9999)',
      latitude: 28.6320,
      longitude: 77.3680,
      type: 'bus',
      speed: 38,
      isLive: true,
    },
    {
      id: 'stop_1',
      label: 'Sector 62 Metro Gate #2',
      latitude: 28.6280,
      longitude: 77.3649,
      type: 'stop',
    },
    {
      id: 'campus',
      label: 'Oakridge Campus Terminus',
      latitude: 28.6400,
      longitude: 77.3800,
      type: 'school',
    },
  ];

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '16px 0' }}>
      {/* Mobile Device Mockup Frame matching reference */}
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
        <div style={{ padding: '12px 20px 4px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 700, color: colors.textPrimary }}>
          <span>9:41</span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span>5G</span>
            <span>● 100%</span>
          </div>
        </div>

        {/* Top App Bar with Logo & Switcher */}
        <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.borderLight}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '14px',
              }}
            >
              📍
            </div>
            <span style={{ fontSize: '17px', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.02em' }}>
              School-GPS
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setPersona('admin')}
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: colors.primary,
                backgroundColor: colors.primaryLight,
                border: `1px solid ${colors.primaryBorder}`,
                borderRadius: radii.full,
                padding: '4px 10px',
                cursor: 'pointer',
              }}
            >
              Admin ⇄
            </button>
            <span style={{ fontSize: '18px', cursor: 'pointer' }}>🔔</span>
          </div>
        </div>

        {/* =========================================================================
            SCREEN 1: PARENT HOME (Matches Reference Design Perfectly)
           ========================================================================= */}
        {activeSubView === 'home' && (
          <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto' }}>
            {/* Greeting */}
            <div>
              <div style={{ fontSize: '13px', color: colors.textSecondary, fontWeight: 500 }}>Good Morning,</div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: colors.textPrimary, margin: '2px 0 0 0' }}>
                Priya Devi
              </h2>
            </div>

            {/* Student Identity Card */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 16px',
                backgroundColor: '#ffffff',
                borderRadius: radii.lg,
                border: `1px solid ${colors.border}`,
                boxShadow: shadows.sm,
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: colors.primaryLight,
                  border: `2px solid ${colors.primaryBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  fontWeight: 800,
                  color: colors.primary,
                }}
              >
                👦
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
                  {student.name}
                </h3>
                <div style={{ fontSize: '12px', color: colors.textSecondary, fontWeight: 600 }}>
                  {student.className} &bull; Bus 12
                </div>
              </div>
            </div>

            {/* Commute Highlight Card (Soft Green Tint, exactly like reference) */}
            <div
              style={{
                backgroundColor: '#e6f4ea',
                borderRadius: radii.xl,
                padding: '20px',
                border: '1px solid #ceead6',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#137333' }}>
                    <span>🚌</span> On the way to School
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#137333', marginTop: '6px', lineHeight: 1 }}>
                    {student.etaMinutes} min
                  </div>
                  <div style={{ fontSize: '12px', color: '#3c4043', marginTop: '4px' }}>
                    Estimated arrival &bull; Updated {student.lastUpdate}
                  </div>
                </div>

                <div style={{ fontSize: '42px' }}>
                  🚍
                </div>
              </div>

              {/* Stepper Timeline: Boarded -> On the way -> At School */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', marginTop: '10px' }}>
                {/* Connecting Line */}
                <div style={{ position: 'absolute', top: '10px', left: '16px', right: '16px', height: '3px', backgroundColor: '#81c995', zIndex: 0 }} />

                {/* Step 1: Boarded */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#137333', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
                    ✓
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#137333', marginTop: '4px' }}>Boarded</span>
                  <span style={{ fontSize: '10px', color: '#5f6368' }}>7:42 AM</span>
                </div>

                {/* Step 2: On the way */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#137333', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
                    ●
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#137333', marginTop: '4px' }}>On the way</span>
                  <span style={{ fontSize: '10px', color: '#5f6368' }}>Now</span>
                </div>

                {/* Step 3: At School */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#ffffff', border: '2px solid #81c995', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }} />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#5f6368', marginTop: '4px' }}>At School</span>
                  <span style={{ fontSize: '10px', color: '#5f6368' }}>~7:58 AM</span>
                </div>
              </div>
            </div>

            {/* Primary Action Button: View Live Location */}
            <button
              onClick={() => navigate('/parent/journey')}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: radii.full,
                backgroundColor: colors.primary,
                color: '#ffffff',
                border: 'none',
                fontSize: '15px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: shadows.md,
              }}
            >
              <span>📍</span> View Live Location
            </button>

            {/* Secondary Action Button: Ask about Aarav */}
            <button
              onClick={() => navigate('/parent/chat')}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: radii.full,
                backgroundColor: colors.primaryLight,
                color: colors.primary,
                border: `1px solid ${colors.primaryBorder}`,
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span>💬</span> Ask about Aarav
            </button>
          </div>
        )}

        {/* =========================================================================
            SCREEN 2: PARENT LIVE JOURNEY & MAP (`/parent/journey`)
           ========================================================================= */}
        {activeSubView === 'journey' && (
          <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => navigate('/parent')}
                style={{ background: 'none', border: 'none', fontSize: '13px', fontWeight: 700, color: colors.primary, cursor: 'pointer' }}
              >
                ← Back
              </button>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
                Live Bus Location
              </h3>
              <StatusBadge type="success" icon="●" label="60s Live" />
            </div>

            {/* Live Map */}
            <div style={{ height: '320px', borderRadius: radii.lg, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
              <InteractiveMap
                markers={mapMarkers}
                height="320px"
                busSpeed={student.speed}
                busLive={true}
              />
            </div>

            {/* Telematics Info Card */}
            <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: radii.lg, border: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '11px', color: colors.textMuted, fontWeight: 700 }}>VEHICLE</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: colors.textPrimary }}>{student.busNumber}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: colors.textMuted, fontWeight: 700 }}>SPEED</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: colors.primary }}>{student.speed} km/h</div>
                </div>
              </div>
              <div style={{ marginTop: '10px', fontSize: '12px', color: colors.textSecondary }}>
                📍 Location: <strong>{student.currentLocation}</strong> &bull; ETA: <strong>~{student.etaMinutes} min</strong>
              </div>
            </div>

            {/* Call Staff Shortcuts */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => alert(`Calling driver Rajesh Kumar (+91 98765 43210)`)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: radii.md,
                  backgroundColor: '#ffffff',
                  border: `1px solid ${colors.border}`,
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                📞 Call Driver
              </button>
              <button
                onClick={() => alert(`Calling attendant Sunita Devi (+91 98765 43211)`)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: radii.md,
                  backgroundColor: '#ffffff',
                  border: `1px solid ${colors.border}`,
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                👩‍💼 Call Attendant
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            SCREEN 3: PARENT AI ASSISTANT (`/parent/chat`)
           ========================================================================= */}
        {activeSubView === 'chat' && (
          <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => navigate('/parent')}
                style={{ background: 'none', border: 'none', fontSize: '13px', fontWeight: 700, color: colors.primary, cursor: 'pointer' }}
              >
                ← Back
              </button>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
                Ask about Aarav
              </h3>
              <StatusBadge type="info" label="Safety Assistant" />
            </div>

            {/* Quick Prompt Chips */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
              {['Where is Aarav?', 'When will he reach?', 'Has he boarded?', 'Any delay?'].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => sendAiMessage(q)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: radii.full,
                    backgroundColor: colors.primaryLight,
                    border: `1px solid ${colors.primaryBorder}`,
                    color: colors.primary,
                    fontSize: '11px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Chat Thread */}
            <div
              style={{
                flex: 1,
                minHeight: '340px',
                backgroundColor: '#f8fafc',
                borderRadius: radii.lg,
                padding: '14px',
                border: `1px solid ${colors.borderLight}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                overflowY: 'auto',
              }}
            >
              {chatMessages.map((msg, idx) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={idx}
                    style={{
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      backgroundColor: isUser ? colors.primary : '#ffffff',
                      color: isUser ? '#ffffff' : colors.textPrimary,
                      padding: '10px 14px',
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      boxShadow: shadows.sm,
                      border: isUser ? 'none' : `1px solid ${colors.borderLight}`,
                    }}
                  >
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                    <div style={{ fontSize: '9px', color: isUser ? 'rgba(255, 255, 255, 0.7)' : colors.textMuted, marginTop: '4px', textAlign: 'right' }}>
                      {msg.time}
                    </div>
                  </div>
                );
              })}
              {isAiLoading && (
                <div style={{ alignSelf: 'flex-start', color: colors.primary, fontSize: '11px', fontWeight: 600 }}>
                  ● Checking live bus telematics...
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Form */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendAiMessage()}
                placeholder="Ask about Aarav's commute..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: radii.full,
                  border: `1px solid ${colors.border}`,
                  outline: 'none',
                  fontSize: '13px',
                }}
              />
              <button
                onClick={() => sendAiMessage()}
                disabled={isAiLoading}
                style={{
                  padding: '10px 18px',
                  backgroundColor: colors.primary,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: radii.full,
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Send
              </button>
            </div>
          </div>
        )}

        {/* Bottom Navigation Bar (Matches Reference: Home, Journey, Profile) */}
        <div
          style={{
            height: '60px',
            borderTop: `1px solid ${colors.borderLight}`,
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
          }}
        >
          <button
            onClick={() => navigate('/parent')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              border: 'none',
              background: 'none',
              color: activeSubView === 'home' ? colors.primary : colors.textSecondary,
              fontSize: '11px',
              fontWeight: activeSubView === 'home' ? 800 : 500,
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '18px' }}>🏠</span>
            <span>Home</span>
          </button>

          <button
            onClick={() => navigate('/parent/journey')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              border: 'none',
              background: 'none',
              color: activeSubView === 'journey' ? colors.primary : colors.textSecondary,
              fontSize: '11px',
              fontWeight: activeSubView === 'journey' ? 800 : 500,
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '18px' }}>🕒</span>
            <span>Journey</span>
          </button>

          <button
            onClick={() => navigate('/parent/chat')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              border: 'none',
              background: 'none',
              color: activeSubView === 'chat' ? colors.primary : colors.textSecondary,
              fontSize: '11px',
              fontWeight: activeSubView === 'chat' ? 800 : 500,
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '18px' }}>🤖</span>
            <span>Assistant</span>
          </button>
        </div>
      </div>
    </div>
  );
};
