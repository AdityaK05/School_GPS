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
    <div style={{ padding: '16px', background: '#1e293b', color: '#fff', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{busNumber} - {routeName}</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ padding: '4px 8px', borderRadius: '4px', background: isOnline ? '#10b981' : '#f59e0b', fontSize: '12px', fontWeight: 'bold' }}>
            {isOnline ? 'ONLINE' : 'OFFLINE QUEUE'}
          </span>
          <span style={{ padding: '4px 8px', borderRadius: '4px', background: gpsFresh ? '#0ea5e9' : '#ef4444', fontSize: '12px', fontWeight: 'bold' }}>
            {gpsFresh ? 'GPS LIVE (<60s)' : 'GPS STALE'}
          </span>
        </div>
      </div>
      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>CURRENT STOP</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{currentStopName}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>ONBOARD</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#38bdf8' }}>{onboardCount} / {totalExpected}</div>
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

  const bgColors = {
    SUCCESS: '#059669',
    DUPLICATE: '#d97706',
    WRONG_BUS: '#dc2626',
    ERROR: '#e11d48',
  };

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: bgColors[feedback.type],
        color: '#ffffff',
        borderRadius: '12px',
        textAlign: 'center',
        margin: '16px 0',
      }}
    >
      <div style={{ fontSize: '24px', fontWeight: '800' }}>{feedback.message}</div>
      {feedback.newState && <div style={{ fontSize: '16px', marginTop: '6px' }}>State: {feedback.newState}</div>}
      <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>{feedback.timestamp}</div>
    </div>
  );
};

export interface TouchScanTriggerProps {
  onScan: () => void;
  disabled?: boolean;
}

export const TouchScanTrigger: React.FC<TouchScanTriggerProps> = ({ onScan, disabled }) => {
  return (
    <button
      onClick={onScan}
      disabled={disabled}
      style={{
        width: '100%',
        minHeight: '64px', // Min 48px touch target rule
        padding: '16px',
        fontSize: '20px',
        fontWeight: 'bold',
        backgroundColor: '#2563eb',
        color: '#fff',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
      }}
    >
      TAP TO SCAN RFID CARD
    </button>
  );
};

export interface ManifestStudentItem {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  expectedStopName: string;
  boardingStatus: 'PENDING' | 'BOARDED' | 'ABSENT';
  exitStatus: 'PENDING' | 'EXITED';
}

export interface ManifestListProps {
  students: ManifestStudentItem[];
  onManualOverride: (studentId: string, action: 'BOARD' | 'EXIT') => void;
}

export const ManifestList: React.FC<ManifestListProps> = ({ students, onManualOverride }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '8px 0' }}>Student Manifest ({students.length})</h3>
      {students.map((student) => (
        <div
          key={student.studentId}
          style={{
            padding: '12px',
            backgroundColor: '#1e293b',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{student.studentName}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              {student.admissionNumber} • {student.expectedStopName}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {student.boardingStatus === 'PENDING' ? (
              <button
                onClick={() => onManualOverride(student.studentId, 'BOARD')}
                style={{
                  minHeight: '48px',
                  padding: '8px 12px',
                  backgroundColor: '#059669',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Mark Board
              </button>
            ) : student.exitStatus === 'PENDING' ? (
              <button
                onClick={() => onManualOverride(student.studentId, 'EXIT')}
                style={{
                  minHeight: '48px',
                  padding: '8px 12px',
                  backgroundColor: '#d97706',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Mark Exit
              </button>
            ) : (
              <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '13px' }}>Completed</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

