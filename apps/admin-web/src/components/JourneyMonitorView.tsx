import React from 'react';
import { JourneyState } from '@school-transport-platform/shared-types';

export interface JourneyMonitorProps {
  states: Array<{
    studentId: string;
    studentName: string;
    tripId: string;
    state: JourneyState;
    lastEventTimestamp?: string;
  }>;
}

const PIPELINE_COLUMNS: Array<{ state: JourneyState; label: string; color: string }> = [
  { state: 'EXPECTED', label: 'Expected', color: '#94a3b8' },
  { state: 'BOARDED', label: 'Boarded', color: '#38bdf8' },
  { state: 'ONBOARD', label: 'In Transit', color: '#818cf8' },
  { state: 'EXIT_PENDING', label: 'Approaching Stop', color: '#fbbf24' },
  { state: 'EXIT_RECORDED', label: 'Exit Scanned', color: '#34d399' },
  { state: 'COMPLETED', label: 'Completed', color: '#10b981' },
];

export const JourneyMonitorView: React.FC<JourneyMonitorProps> = ({ states }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#ffffff', letterSpacing: '-0.03em', margin: 0 }}>
          Journey Pipeline
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#71717a', marginTop: '6px' }}>
          Live state machine progression across active student journeys and routes.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px' }}>
        {PIPELINE_COLUMNS.map((col) => {
          const colStudents = states.filter((s) => s.state === col.state);
          return (
            <div
              key={col.state}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                padding: '20px 18px',
                minHeight: '440px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '18px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: col.color }} />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#ffffff' }}>
                    {col.label}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: '#71717a',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  }}
                >
                  {colStudents.length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {colStudents.length === 0 ? (
                  <div style={{ padding: '36px 8px', textAlign: 'center', color: '#52525b', fontSize: '0.75rem' }}>
                    None active
                  </div>
                ) : (
                  colStudents.map((s) => (
                    <div
                      key={s.studentId}
                      style={{
                        padding: '14px',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#ffffff' }}>{s.studentName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '4px' }}>
                        ID: {s.studentId.substring(0, 8)}
                      </div>
                      {s.lastEventTimestamp && (
                        <div style={{ fontSize: '0.7rem', color: '#a1a1aa', marginTop: '8px' }}>
                          {new Date(s.lastEventTimestamp).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
