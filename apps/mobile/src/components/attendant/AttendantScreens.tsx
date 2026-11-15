import React from 'react';
import { ScanFeedback } from '../../services/attendant.service';

export interface TripHeaderProps {
  busNumber: string;
  routeName: string;
  currentStopName: string;
  onboardCount: number;
  totalExpected: number;
  isOnline: boolean;
  gpsFresh: boolean;
}

export const TripHeaderCard: React.FC<TripHeaderProps> = ({
  busNumber,
  routeName,
  currentStopName,
  onboardCount,
  totalExpected,
  isOnline,
  gpsFresh,
}) => {
  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: '#121217',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase' }}>Active Fleet Trip</span>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: '2px 0 0 0' }}>
            {busNumber} &bull; {routeName}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <span
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: isOnline ? '#34d399' : '#fbbf24',
              fontSize: '10px',
              fontWeight: 800,
              border: `1px solid ${isOnline ? '#10b981' : '#f59e0b'}`,
            }}
          >
            ● {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
          <span
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: gpsFresh ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: gpsFresh ? '#38bdf8' : '#f87171',
              fontSize: '10px',
              fontWeight: 800,
              border: `1px solid ${gpsFresh ? '#38bdf8' : '#ef4444'}`,
            }}
          >
            ● {gpsFresh ? 'GPS LIVE' : 'GPS STALE'}
          </span>
        </div>
      </div>

      <div
        style={{
          marginTop: '14px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
        }}
      >
        <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: '#18181b', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', fontWeight: 700 }}>Current Stop</div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>{currentStopName}</div>
        </div>

        <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: '#18181b', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'right' }}>
          <div style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', fontWeight: 700 }}>Onboard Count</div>
          <div style={{ fontSize: '16px', fontWeight: 900, color: '#34d399', marginTop: '2px' }}>
            {onboardCount} <span style={{ fontSize: '11px', color: '#71717a', fontWeight: 600 }}>/ {totalExpected}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export interface ScanFeedbackCardProps {
  feedback: ScanFeedback | null;
}

export const ScanFeedbackCard: React.FC<ScanFeedbackCardProps> = ({ feedback }) => {
  if (!feedback) return null;

  const isSuccess = feedback.type === 'SUCCESS';
  const isWrongBus = feedback.type === 'WRONG_BUS';
  const isDuplicate = feedback.type === 'DUPLICATE';

  const borderColor = isSuccess ? '#10b981' : isWrongBus ? '#ef4444' : isDuplicate ? '#f59e0b' : '#38bdf8';
  const bgColor = isSuccess
    ? 'rgba(16, 185, 129, 0.15)'
    : isWrongBus
    ? 'rgba(239, 68, 68, 0.15)'
    : isDuplicate
    ? 'rgba(245, 158, 11, 0.15)'
    : 'rgba(56, 189, 248, 0.15)';
  const textColor = isSuccess ? '#34d399' : isWrongBus ? '#f87171' : isDuplicate ? '#fbbf24' : '#38bdf8';

  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        color: '#ffffff',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <div>
        <div style={{ fontSize: '11px', fontWeight: 800, color: textColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {feedback.type} RFID SCAN RESULT
        </div>
        <div style={{ fontSize: '14px', fontWeight: 800, marginTop: '2px' }}>{feedback.message}</div>
        {feedback.newState && (
          <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px' }}>
            Updated State: <strong style={{ color: textColor }}>{feedback.newState}</strong>
          </div>
        )}
      </div>

      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: borderColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: 900,
        }}
      >
        {isSuccess ? '✓' : isWrongBus ? '!' : '●'}
      </div>
    </div>
  );
};

export interface ManifestStudentItem {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  expectedStopName: string;
  boardingStatus: string;
  exitStatus: string;
}

export interface ManifestListProps {
  students: ManifestStudentItem[];
  onManualOverride: (studentId: string, action: 'BOARD' | 'EXIT') => void;
}

export const ManifestList: React.FC<ManifestListProps> = ({ students, onManualOverride }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
        <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>Passenger Manifest</span>
        <span style={{ fontSize: '11px', color: '#71717a' }}>{students.length} Total Registered</span>
      </div>

      {students.map((st) => {
        const isBoarded = st.boardingStatus === 'BOARDED';
        const isExited = st.exitStatus === 'EXITED';

        return (
          <div
            key={st.studentId}
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              backgroundColor: '#121217',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>{st.studentName}</div>
              <div style={{ fontSize: '10px', color: '#71717a', marginTop: '2px' }}>
                {st.admissionNumber} &bull; {st.expectedStopName}
              </div>
              <div style={{ marginTop: '4px' }}>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: isExited
                      ? 'rgba(56, 189, 248, 0.15)'
                      : isBoarded
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(255, 255, 255, 0.06)',
                    color: isExited ? '#38bdf8' : isBoarded ? '#34d399' : '#71717a',
                    border: `1px solid ${isExited ? '#0284c7' : isBoarded ? '#10b981' : 'rgba(255, 255, 255, 0.1)'}`,
                  }}
                >
                  {isExited ? 'SAFELY EXITED' : isBoarded ? 'ONBOARD' : 'NOT BOARDED'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {!isBoarded && !isExited && (
                <button
                  onClick={() => onManualOverride(st.studentId, 'BOARD')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '11px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  Board
                </button>
              )}

              {isBoarded && !isExited && (
                <button
                  onClick={() => onManualOverride(st.studentId, 'EXIT')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '11px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
                  }}
                >
                  Exit
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
