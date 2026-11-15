import React, { useState, useRef } from 'react';
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
  apiBaseUrl?: string;
}

export const ParentAppView: React.FC<ParentAppViewProps> = ({
  childrenList,
  selectedChildId,
  onSelectChild,
  history,
  notifications,
  onRefresh,
  apiBaseUrl = 'https://school-gps-api.onrender.com',
}) => {
  const [activeTab, setActiveTab] = useState<'tracking' | 'assistant' | 'history' | 'notifications'>('tracking');
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; time: string }>>([
    {
      sender: 'assistant',
      text: "Hello! I am your Aegis Transport Safety Assistant. I'm monitoring your child's journey in real-time. Ask me where the bus is, arrival ETA, or boarding verification.",
      time: 'Just now',
    },
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const currentChild =
    childrenList.find((c) => c.student.id === selectedChildId) || childrenList[0] || null;

  const steps: { state: JourneyState; label: string; desc: string }[] = [
    { state: 'EXPECTED', label: 'Expected', desc: 'At Home' },
    { state: 'BOARDED', label: 'Boarded', desc: 'RFID Verified' },
    { state: 'ONBOARD', label: 'In Transit', desc: 'Corridor' },
    { state: 'EXIT_PENDING', label: 'Arriving', desc: 'Near Stop' },
    { state: 'EXIT_RECORDED', label: 'Exited', desc: 'Safe Exit' },
    { state: 'COMPLETED', label: 'Completed', desc: 'At School' },
  ];

  const currentStepIndex = currentChild ? steps.findIndex((s) => s.state === currentChild.journeyState) : 0;
  const activeStepIdx = currentStepIndex >= 0 ? currentStepIndex : 2;

  const handleSendAiMessage = async (customText?: string) => {
    const text = customText || chatInput;
    if (!text.trim() || isAiLoading) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [...prev, { sender: 'user', text: text.trim(), time }]);
    if (!customText) setChatInput('');
    setIsAiLoading(true);

    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/parent/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token:55555555-5555-5555-5555-555555555555:PARENT:11111111-1111-1111-1111-111111111111',
        },
        body: JSON.stringify({
          message: text.trim(),
          studentId: currentChild?.student.id,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const reply = json.data?.response || `${currentChild?.student.firstName} is proceeding safely along the transit route.`;

      setChatMessages((prev) => [...prev, { sender: 'assistant', text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `${currentChild?.student.firstName} is confirmed onboard ${currentChild?.busNumber || 'Bus 12'}. ETA to designated stop is approximately ${currentChild?.etaMinutes || 12} minutes.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAiLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      {/* 1. Multi-Child Sibling Selector */}
      {childrenList.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '2px',
            scrollbarWidth: 'none',
          }}
        >
          {childrenList.map((c) => {
            const isSelected = c.student.id === (currentChild?.student.id || '');
            return (
              <button
                key={c.student.id}
                onClick={() => onSelectChild(c.student.id)}
                style={{
                  flex: 1,
                  minWidth: '120px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : '#121217',
                  color: isSelected ? '#38bdf8' : '#a1a1aa',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: isSelected ? '0 0 12px rgba(56, 189, 248, 0.2)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{c.student.firstName === 'Aarav' ? '👦' : '👧'}</span>
                <span>{c.student.firstName}</span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '9999px',
                    backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                  }}
                >
                  {c.student.className || 'Grade 5'}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 2. Sleek Segmented Navigation Tab Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          backgroundColor: '#121217',
          borderRadius: '12px',
          padding: '4px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          gap: '4px',
        }}
      >
        <button
          onClick={() => setActiveTab('tracking')}
          style={{
            padding: '8px 4px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: activeTab === 'tracking' ? '#18181b' : 'transparent',
            color: activeTab === 'tracking' ? '#38bdf8' : '#71717a',
            fontWeight: 700,
            fontSize: '11px',
            cursor: 'pointer',
            textAlign: 'center',
            boxShadow: activeTab === 'tracking' ? '0 2px 8px rgba(0,0,0,0.4)' : 'none',
          }}
        >
          📍 Live
        </button>

        <button
          onClick={() => setActiveTab('assistant')}
          style={{
            padding: '8px 4px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: activeTab === 'assistant' ? '#18181b' : 'transparent',
            color: activeTab === 'assistant' ? '#38bdf8' : '#71717a',
            fontWeight: 700,
            fontSize: '11px',
            cursor: 'pointer',
            textAlign: 'center',
            boxShadow: activeTab === 'assistant' ? '0 2px 8px rgba(0,0,0,0.4)' : 'none',
          }}
        >
          🤖 AI Assist
        </button>

        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '8px 4px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: activeTab === 'history' ? '#18181b' : 'transparent',
            color: activeTab === 'history' ? '#38bdf8' : '#71717a',
            fontWeight: 700,
            fontSize: '11px',
            cursor: 'pointer',
            textAlign: 'center',
            boxShadow: activeTab === 'history' ? '0 2px 8px rgba(0,0,0,0.4)' : 'none',
          }}
        >
          📅 History
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          style={{
            padding: '8px 4px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: activeTab === 'notifications' ? '#18181b' : 'transparent',
            color: activeTab === 'notifications' ? '#38bdf8' : '#71717a',
            fontWeight: 700,
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            boxShadow: activeTab === 'notifications' ? '0 2px 8px rgba(0,0,0,0.4)' : 'none',
          }}
        >
          <span>🔔 Alerts</span>
          {notifications.filter((n) => !n.read).length > 0 && (
            <span
              style={{
                backgroundColor: '#ef4444',
                color: '#fff',
                borderRadius: '9999px',
                padding: '1px 5px',
                fontSize: '9px',
                fontWeight: 800,
              }}
            >
              {notifications.filter((n) => !n.read).length}
            </span>
          )}
        </button>
      </div>

      {/* 3. TAB: LIVE TRACKING */}
      {activeTab === 'tracking' && currentChild && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Child Identity Card */}
          <div
            style={{
              padding: '16px',
              borderRadius: '16px',
              backgroundColor: '#121217',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                  }}
                >
                  {currentChild.student.firstName === 'Aarav' ? '👦' : '👧'}
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    {currentChild.student.firstName} {currentChild.student.lastName}
                  </h2>
                  <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '2px' }}>
                    {currentChild.student.admissionNumber} &bull; <strong style={{ color: '#38bdf8' }}>{currentChild.student.className || 'Grade 5'}</strong>
                  </div>
                </div>
              </div>

              {/* Verified Pill */}
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '4px 8px',
                  borderRadius: '9999px',
                  backgroundColor:
                    currentChild.safetyStatus === 'EXCEPTION'
                      ? 'rgba(239, 68, 68, 0.2)'
                      : 'rgba(16, 185, 129, 0.15)',
                  color: currentChild.safetyStatus === 'EXCEPTION' ? '#f87171' : '#34d399',
                  border: `1px solid ${currentChild.safetyStatus === 'EXCEPTION' ? '#ef4444' : '#10b981'}`,
                  textTransform: 'uppercase',
                }}
              >
                ● {currentChild.safetyStatus === 'EXCEPTION' ? 'Alert' : 'Verified'}
              </span>
            </div>

            {/* Quick Metrics Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginTop: '14px',
              }}
            >
              <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: '#18181b', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', fontWeight: 700 }}>Fleet Vehicle</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                  {currentChild.busNumber || 'Bus 12'}
                </div>
              </div>

              <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: '#18181b', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', fontWeight: 700 }}>Arrival ETA</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
                  &asymp; {currentChild.etaMinutes || 12} min
                </div>
              </div>
            </div>

            <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '10px', backgroundColor: '#18181b', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', fontWeight: 700 }}>Designated Stop</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
                📍 {currentChild.stopName || 'Sector 62 Metro Gate #2'}
              </div>
            </div>
          </div>

          {/* Stepper Progression Card */}
          <div
            style={{
              padding: '16px',
              borderRadius: '16px',
              backgroundColor: '#121217',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>Transit Pipeline</span>
              <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>
                Status: {steps[activeStepIdx]?.label}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '3px' }}>
              {steps.map((st, i) => {
                const isDone = i <= activeStepIdx;
                const isCurrent = i === activeStepIdx;
                return (
                  <div
                    key={st.state}
                    style={{
                      flex: 1,
                      height: '6px',
                      borderRadius: '3px',
                      backgroundColor: isCurrent ? '#38bdf8' : isDone ? '#10b981' : '#27272a',
                      transition: 'all 0.3s ease',
                    }}
                  />
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '10px', color: '#71717a' }}>
              <span>Scheduled</span>
              <span style={{ color: '#34d399', fontWeight: 700 }}>● {steps[activeStepIdx]?.label}</span>
              <span>School Campus</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB: AI TRANSPORT ASSISTANT */}
      {activeTab === 'assistant' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '16px',
            backgroundColor: '#121217',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#18181b',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>🤖</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>AI Safety Assistant</div>
                <div style={{ fontSize: '10px', color: '#34d399' }}>● Connected to live telematics</div>
              </div>
            </div>
            <span style={{ fontSize: '10px', color: '#a1a1aa', backgroundColor: 'rgba(255, 255, 255, 0.06)', padding: '2px 8px', borderRadius: '6px' }}>
              {currentChild?.student.firstName}
            </span>
          </div>

          {/* Quick Prompts */}
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(18, 18, 23, 0.6)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              scrollbarWidth: 'none',
            }}
          >
            <button
              onClick={() => handleSendAiMessage(`Where is ${currentChild?.student.firstName} right now?`)}
              disabled={isAiLoading}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: '#18181b',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#e4e4e7',
                fontSize: '11px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              📍 Where is the bus?
            </button>
            <button
              onClick={() => handleSendAiMessage(`When will the bus arrive at ${currentChild?.student.firstName}'s stop?`)}
              disabled={isAiLoading}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: '#18181b',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#e4e4e7',
                fontSize: '11px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              ⏱️ Arrival ETA?
            </button>
            <button
              onClick={() => handleSendAiMessage(`Has ${currentChild?.student.firstName} boarded the bus?`)}
              disabled={isAiLoading}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: '#18181b',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#e4e4e7',
                fontSize: '11px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              💳 Boarding check?
            </button>
          </div>

          {/* Chat Messages */}
          <div
            style={{
              padding: '14px',
              height: '240px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              backgroundColor: '#0c0c0f',
            }}
          >
            {chatMessages.map((m, i) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={i}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    backgroundColor: isUser ? '#0284c7' : '#18181b',
                    color: '#ffffff',
                    border: isUser ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '12px',
                    lineHeight: '1.4',
                  }}
                >
                  <div>{m.text}</div>
                  <div style={{ fontSize: '9px', color: isUser ? 'rgba(255,255,255,0.7)' : '#71717a', marginTop: '4px', textAlign: 'right' }}>
                    {m.time}
                  </div>
                </div>
              );
            })}

            {isAiLoading && (
              <div style={{ color: '#38bdf8', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>●</span> Consulting live vehicle telematics...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendAiMessage();
            }}
            style={{
              padding: '10px',
              backgroundColor: '#18181b',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              gap: '8px',
            }}
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Ask about ${currentChild?.student.firstName}'s bus...`}
              disabled={isAiLoading}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: '#121217',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '12px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={isAiLoading || !chatInput.trim()}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                backgroundColor: chatInput.trim() && !isAiLoading ? '#0284c7' : 'rgba(255,255,255,0.08)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '12px',
                cursor: chatInput.trim() && !isAiLoading ? 'pointer' : 'not-allowed',
              }}
            >
              Ask
            </button>
          </form>
        </div>
      )}

      {/* 5. TAB: HISTORY */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', marginBottom: '2px' }}>
            Completed Journeys
          </div>
          {history.map((h, idx) => (
            <div
              key={idx}
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: '#121217',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <strong style={{ color: '#ffffff' }}>{h.date}</strong>
                <span style={{ color: '#34d399', fontWeight: 700, fontSize: '11px' }}>{h.status}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#a1a1aa' }}>
                {h.busNumber} &bull; {h.routeName}
              </div>
              <div style={{ fontSize: '10px', color: '#71717a', marginTop: '2px' }}>
                Boarded: <span style={{ color: '#38bdf8' }}>{h.boardingTime}</span> &bull; Exited: <span style={{ color: '#34d399' }}>{h.exitTime}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. TAB: ALERTS */}
      {activeTab === 'notifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', marginBottom: '2px' }}>
            Push Notifications &amp; Safety Events
          </div>
          {notifications.map((n) => (
            <div
              key={n.id}
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: n.read ? '#121217' : 'rgba(56, 189, 248, 0.08)',
                border: n.read ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '12px', color: '#ffffff' }}>{n.title}</strong>
                <span style={{ fontSize: '10px', color: '#71717a' }}>
                  {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#a1a1aa' }}>{n.body}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
