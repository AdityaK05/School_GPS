import React, { useState, useRef } from 'react';
import { useRouter } from '../router/Router';
import { useTheme } from '../theme/ThemeContext';
import { radii, shadows } from '../theme/design-system';
import logoImg from '../assets/logo.png';
import { StatusBadge } from '../components/ui/SharedComponents';
import { InteractiveMap, MapMarker } from '../components/InteractiveMap';
import { JourneyLine } from '../components/ui/JourneyLine';
import { ApiClient } from '@school-transport-platform/client-sdk';
import {
  House,
  Route,
  UserRound,
  BusFront,
  Navigation,
  MessageSquare,
  Bell,
  Phone,
  UserCheck,
  ArrowLeft,
  Check,
  Send,
  Sparkles,
  Shield,
  Clock3,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://school-gps-api.onrender.com';
const PARENT_TOKEN =
  sessionStorage.getItem('aegis_access_token') ||
  (import.meta.env.DEV
    ? 'test-token:55555555-5555-5555-5555-555555555555:PARENT:11111111-1111-1111-1111-111111111111'
    : '');

export const ParentAppView: React.FC<{ apiClient: ApiClient }> = () => {
  const { pathname, navigate, setPersona } = useRouter();
  const { colors, isDark } = useTheme();

  // Sub-tabs: 'home' | 'journey' | 'chat' | 'profile'
  const activeSubView = pathname.includes('/journey') ? 'journey' : pathname.includes('/chat') ? 'chat' : 'home';

  const [student] = useState({
    name: 'Aarav Sharma',
    className: 'Class 7-B',
    busNumber: 'Bus 12',
    busReg: 'UP-16-BT-9912',
    etaMinutes: 8,
    speed: 38,
    lastUpdate: '32 sec ago',
    driver: 'Rajesh Kumar (+91 98765 43210)',
    attendant: 'Sunita Devi (+91 98765 43211)',
    currentLocation: 'Sector 62 Metro Gate #2',
    stopName: 'Sector 62 Metro Gate #2',
  });

  // AI Assistant Chat State (Section 35: Natural, trustworthy, grounded)
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; time: string }>>([
    {
      sender: 'assistant',
      text: "Hello Priya! Aarav is currently on Bus 12 near Sector 62, approximately 8 minutes from campus. How can I help you?",
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
          text: `Aarav is on Bus 12 near Sector 62. Current status: In transit, approximately 8 minutes from campus.`,
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
      label: 'Bus 12 (UP-16-BT-9912)',
      latitude: 28.6320,
      longitude: 77.3680,
      type: 'bus',
      status: 'On route',
    },
  ];

  const corridorStops = [
    { id: '1', name: 'Sector 62 Metro Gate #2', time: '07:42 AM', status: 'passed' as const },
    { id: '2', name: 'Shipra Sun City Gate #4', time: '07:49 AM', status: 'current' as const },
    { id: '3', name: 'Indirapuram Habitat Centre', time: '~07:54 AM', status: 'upcoming' as const },
  ];

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
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
          border: `1px solid ${colors.border}`,
          boxShadow: shadows.md,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '740px',
          position: 'relative',
        }}
      >
        {/* Top App Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${colors.borderLight}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.card,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src={logoImg}
              alt="School-GPS Logo"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                objectFit: 'contain',
                backgroundColor: '#ffffff',
                border: `1px solid ${colors.borderLight}`,
                padding: '2px',
              }}
            />
            <span style={{ fontSize: '16px', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.02em' }}>
              School-GPS
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setPersona('admin')}
              style={{
                padding: '4px 8px',
                borderRadius: radii.sm,
                backgroundColor: colors.badgeBg,
                border: `1px solid ${colors.border}`,
                color: colors.textSecondary,
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Admin &rarr;
            </button>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: colors.badgeBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.textSecondary,
                cursor: 'pointer',
              }}
            >
              <Bell size={16} strokeWidth={2} />
            </div>
          </div>
        </div>

        {/* =========================================================================
            SCREEN 1: PARENT HOME VIEW (`/parent`) (Matches Design Reference)
           ========================================================================= */}
        {activeSubView === 'home' && (
          <div style={{ flex: 1, padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
            {/* Greeting */}
            <div>
              <div style={{ fontSize: '13px', color: colors.textSecondary, fontWeight: 500 }}>
                Good Morning,
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: colors.textPrimary, margin: '2px 0 0 0', letterSpacing: '-0.02em' }}>
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
                backgroundColor: colors.card,
                borderRadius: radii.lg,
                border: `1px solid ${colors.border}`,
                boxShadow: shadows.sm,
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: colors.primaryLight,
                  border: `2px solid ${colors.primaryBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.primary,
                }}
              >
                <UserRound size={22} strokeWidth={2} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
                  {student.name}
                </h3>
                <div style={{ fontSize: '12px', color: colors.textSecondary, fontWeight: 500, marginTop: '2px' }}>
                  {student.className} &bull; {student.busNumber}
                </div>
              </div>
            </div>

            {/* Commute Highlight Card (Section 28: Soft Green, Trustworthy) */}
            <div
              style={{
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#e6f4ea',
                borderRadius: radii.lg,
                padding: '18px 20px',
                border: `1px solid ${isDark ? '#065f46' : '#ceead6'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#137333' }}>
                    <BusFront size={16} strokeWidth={2.2} />
                    <span>On the way to school</span>
                  </div>
                  <div style={{ fontSize: '30px', fontWeight: 800, color: '#137333', marginTop: '6px', lineHeight: 1 }}>
                    {student.etaMinutes} min
                  </div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>
                    Estimated arrival &bull; Updated {student.lastUpdate}
                  </div>
                </div>

                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: radii.md,
                    backgroundColor: 'rgba(19, 115, 51, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#137333',
                  }}
                >
                  <BusFront size={26} strokeWidth={2} />
                </div>
              </div>

              {/* Stepper Timeline: Boarded -> On the way -> At School */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', marginTop: '6px' }}>
                <div style={{ position: 'absolute', top: '10px', left: '16px', right: '16px', height: '2px', backgroundColor: '#81c995', zIndex: 0 }} />

                {/* Step 1 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#137333', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={12} strokeWidth={2.6} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#137333', marginTop: '4px' }}>Boarded</span>
                  <span style={{ fontSize: '10px', color: colors.textSecondary }}>7:42 AM</span>
                </div>

                {/* Step 2 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#137333', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ffffff' }} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#137333', marginTop: '4px' }}>On the way</span>
                  <span style={{ fontSize: '10px', color: colors.textSecondary }}>Now</span>
                </div>

                {/* Step 3 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: colors.card, border: '2px solid #81c995', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: colors.textMuted, marginTop: '4px' }}>At School</span>
                  <span style={{ fontSize: '10px', color: colors.textMuted }}>~7:58 AM</span>
                </div>
              </div>
            </div>

            {/* Primary Action Button: View Live Location */}
            <button
              onClick={() => navigate('/parent/journey')}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: radii.md,
                backgroundColor: colors.primary,
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
              }}
            >
              <Navigation size={16} strokeWidth={2} />
              <span>View Live Location</span>
            </button>

            {/* Secondary Action Button: Ask about Aarav */}
            <button
              onClick={() => navigate('/parent/chat')}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: radii.md,
                backgroundColor: colors.primaryLight,
                color: colors.primary,
                border: `1px solid ${colors.primaryBorder}`,
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <MessageSquare size={16} strokeWidth={2} />
              <span>Ask about Aarav</span>
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
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: colors.primary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ArrowLeft size={14} strokeWidth={2} />
                <span>Back</span>
              </button>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
                Live Location
              </h3>
              <StatusBadge type="success" label="Live" />
            </div>

            {/* Map */}
            <div style={{ height: '300px', borderRadius: radii.md, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
              <InteractiveMap
                markers={mapMarkers}
                height="300px"
                busSpeed={student.speed}
                busLive={true}
                lastUpdatedText={`Updated ${student.lastUpdate}`}
              />
            </div>

            {/* Signature Journey Line Visualizer */}
            <div style={{ backgroundColor: colors.bg, borderRadius: radii.md, padding: '16px', border: `1px solid ${colors.borderLight}` }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: '8px' }}>
                Corridor Progress
              </div>
              <JourneyLine
                originName="Home (Sector 62)"
                destinationName="Oakridge Campus"
                stops={corridorStops}
                busNumber="Bus 12"
              />
            </div>

            {/* Personnel Contact Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ padding: '10px 12px', backgroundColor: colors.card, border: `1px solid ${colors.border}`, borderRadius: radii.sm }}>
                <div style={{ fontSize: '10px', color: colors.textMuted, fontWeight: 600 }}>Driver</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: colors.textPrimary, marginTop: '2px' }}>Rajesh Kumar</div>
                <a href="tel:+919876543210" style={{ fontSize: '11px', color: colors.primary, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <Phone size={11} strokeWidth={2} />
                  <span>Call Driver</span>
                </a>
              </div>
              <div style={{ padding: '10px 12px', backgroundColor: colors.card, border: `1px solid ${colors.border}`, borderRadius: radii.sm }}>
                <div style={{ fontSize: '10px', color: colors.textMuted, fontWeight: 600 }}>Attendant</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: colors.textPrimary, marginTop: '2px' }}>Sunita Devi</div>
                <a href="tel:+919876543211" style={{ fontSize: '11px', color: colors.primary, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <UserCheck size={11} strokeWidth={2} />
                  <span>Call Attendant</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SCREEN 3: PARENT AI CHAT (`/parent/chat`) (Section 35: Clean, No Jargon)
           ========================================================================= */}
        {activeSubView === 'chat' && (
          <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => navigate('/parent')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: colors.primary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ArrowLeft size={14} strokeWidth={2} />
                <span>Back</span>
              </button>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: colors.textPrimary, margin: 0, textAlign: 'center' }}>
                  Ask about Aarav
                </h3>
                <div style={{ fontSize: '10px', color: colors.textMuted, textAlign: 'center' }}>
                  Verified transport data
                </div>
              </div>
              <div style={{ width: '40px' }} />
            </div>

            {/* Suggested Question Chips (Section 35) */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
              {['Where is Aarav?', 'Has he boarded?', 'When will he reach?', 'Any delay?'].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => sendAiMessage(q)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: radii.full,
                    backgroundColor: colors.primaryLight,
                    border: `1px solid ${colors.primaryBorder}`,
                    color: colors.primary,
                    fontSize: '11px',
                    fontWeight: 600,
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
                backgroundColor: colors.bg,
                borderRadius: radii.md,
                padding: '14px',
                border: `1px solid ${colors.borderLight}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
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
                      backgroundColor: isUser ? colors.primary : colors.card,
                      color: isUser ? colors.textWhite : colors.textPrimary,
                      padding: '10px 14px',
                      borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      boxShadow: shadows.sm,
                      border: isUser ? 'none' : `1px solid ${colors.border}`,
                    }}
                  >
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                    <div
                      style={{
                        fontSize: '9px',
                        color: isUser ? 'rgba(255, 255, 255, 0.75)' : colors.textMuted,
                        marginTop: '4px',
                        textAlign: 'right',
                      }}
                    >
                      {msg.time}
                    </div>
                  </div>
                );
              })}
              {isAiLoading && (
                <div style={{ alignSelf: 'flex-start', color: colors.primary, fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={12} strokeWidth={2} />
                  <span>Checking live commute data...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendAiMessage()}
                placeholder="Ask about Aarav's trip..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: radii.full,
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.card,
                  color: colors.textPrimary,
                  outline: 'none',
                  fontSize: '13px',
                }}
              />
              <button
                onClick={() => sendAiMessage()}
                disabled={isAiLoading}
                style={{
                  padding: '10px 16px',
                  backgroundColor: colors.primary,
                  color: colors.textWhite,
                  border: 'none',
                  borderRadius: radii.full,
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Send size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}

        {/* Bottom Tab Bar (Home, Journey, Ask Assistant) */}
        <div
          style={{
            height: '56px',
            borderTop: `1px solid ${colors.borderLight}`,
            backgroundColor: colors.card,
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
              fontWeight: activeSubView === 'home' ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            <House size={18} strokeWidth={activeSubView === 'home' ? 2.2 : 1.8} />
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
              fontWeight: activeSubView === 'journey' ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            <Route size={18} strokeWidth={activeSubView === 'journey' ? 2.2 : 1.8} />
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
              fontWeight: activeSubView === 'chat' ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            <MessageSquare size={18} strokeWidth={activeSubView === 'chat' ? 2.2 : 1.8} />
            <span>Ask</span>
          </button>
        </div>
      </div>
    </div>
  );
};
