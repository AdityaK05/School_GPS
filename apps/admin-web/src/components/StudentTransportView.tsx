import React, { useState } from 'react';
import { Student } from '@school-transport-platform/shared-types';

export interface StudentTransportProps {
  students: Student[];
  onAssignRoute: (studentId: string, routeId: string, stopId: string) => Promise<void>;
  onAssignCard: (studentId: string, cardId: string) => Promise<void>;
}

export const StudentTransportView: React.FC<StudentTransportProps> = ({ students, onAssignCard }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [cardInput, setCardInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = students.filter(
    (s) =>
      s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !cardInput) return;
    setIsSubmitting(true);
    try {
      await onAssignCard(selectedStudent.id, cardInput);
      setSelectedStudent(null);
      setCardInput('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#ffffff', letterSpacing: '-0.03em', margin: 0 }}>
            Students &amp; Credentials
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#71717a', marginTop: '6px' }}>
            Roster management, physical RFID token binding, and route stop assignments.
          </p>
        </div>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              fontSize: '0.825rem',
              outline: 'none',
              width: '260px',
              transition: 'border-color 0.15s ease',
            }}
          />
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.015)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                color: '#71717a',
                fontSize: '0.75rem',
                letterSpacing: '0.04em',
              }}
            >
              <th style={{ padding: '16px 22px', fontWeight: 500 }}>ADMISSION #</th>
              <th style={{ padding: '16px 22px', fontWeight: 500 }}>STUDENT NAME</th>
              <th style={{ padding: '16px 22px', fontWeight: 500 }}>CLASS</th>
              <th style={{ padding: '16px 22px', fontWeight: 500 }}>RFID TOKEN</th>
              <th style={{ padding: '16px 22px', fontWeight: 500 }}>STATUS</th>
              <th style={{ padding: '16px 22px', fontWeight: 500, textAlign: 'right' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: '#52525b', fontSize: '0.875rem' }}>
                  No students found matching your search.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr
                  key={s.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    fontSize: '0.875rem',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <td style={{ padding: '18px 22px', fontFamily: 'monospace', color: '#71717a' }}>
                    {s.admissionNumber}
                  </td>
                  <td style={{ padding: '18px 22px', fontWeight: 500, color: '#ffffff' }}>
                    {s.firstName} {s.lastName}
                  </td>
                  <td style={{ padding: '18px 22px', color: '#a1a1aa' }}>
                    {s.className || 'Grade 5'} - {s.section || 'A'}
                  </td>
                  <td style={{ padding: '18px 22px' }}>
                    {s.rfidCardId ? (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(16, 185, 129, 0.08)',
                          color: '#34d399',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                        }}
                      >
                        {s.rfidCardId}
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          color: '#71717a',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                        }}
                      >
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '18px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                      <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>Active</span>
                    </div>
                  </td>
                  <td style={{ padding: '18px 22px', textAlign: 'right' }}>
                    <button
                      onClick={() => setSelectedStudent(s)}
                      style={{
                        padding: '6px 14px',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)')}
                    >
                      {s.rfidCardId ? 'Reassign' : 'Pair Card'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modern Modal / Drawer for Card Pairing */}
      {selectedStudent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            style={{
              backgroundColor: '#121215',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '28px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            }}
          >
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
              Pair RFID Token
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#71717a', marginTop: '6px' }}>
              Assign physical card UID to{' '}
              <strong style={{ color: '#ffffff' }}>
                {selectedStudent.firstName} {selectedStudent.lastName}
              </strong>.
            </p>

            <form onSubmit={handleCardSubmit} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 500, color: '#71717a' }}>
                  Card Token UID
                </label>
                <input
                  type="text"
                  placeholder="e.g. CARD-AARAV-7788"
                  value={cardInput}
                  onChange={(e) => setCardInput(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    marginTop: '6px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    color: '#71717a',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !cardInput}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ffffff',
                    color: '#09090b',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
