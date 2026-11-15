import React, { useState } from 'react';
import { JourneyException } from '@school-transport-platform/shared-types';

export interface ExceptionCenterProps {
  exceptions: JourneyException[];
  onResolve: (exceptionId: string, reason: string) => Promise<void>;
}

export const ExceptionCenterView: React.FC<ExceptionCenterProps> = ({ exceptions, onResolve }) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = exceptions.filter((e) => {
    if (filterType !== 'ALL' && e.type !== filterType) return false;
    return true;
  });

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingId || reason.trim().length < 5) return;
    setIsSubmitting(true);
    try {
      await onResolve(resolvingId, reason);
      setResolvingId(null);
      setReason('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#ffffff', letterSpacing: '-0.03em', margin: 0 }}>
            Safety Exceptions
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#71717a', marginTop: '6px' }}>
            Triaging anomalies, missing drop-offs, wrong bus intercepts, and attendant overrides.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              fontSize: '0.8rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Categories</option>
            <option value="WRONG_BUS">Wrong Bus (Critical)</option>
            <option value="EXIT_MISSING">Exit Missing (Critical)</option>
            <option value="WRONG_STOP_EXIT">Wrong Stop Exit</option>
            <option value="BOARDING_MISSING">Boarding Missing</option>
            <option value="GPS_UNAVAILABLE">GPS Unavailable</option>
            <option value="DUPLICATE_SCAN">Duplicate Scan</option>
            <option value="MANUAL_ATTENDANCE_OVERRIDE">Manual Override</option>
          </select>
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
              <th style={{ padding: '16px 22px', fontWeight: 500 }}>SEVERITY</th>
              <th style={{ padding: '16px 22px', fontWeight: 500 }}>EXCEPTION TYPE</th>
              <th style={{ padding: '16px 22px', fontWeight: 500 }}>DETAILS</th>
              <th style={{ padding: '16px 22px', fontWeight: 500 }}>STATUS</th>
              <th style={{ padding: '16px 22px', fontWeight: 500 }}>RECORDED AT</th>
              <th style={{ padding: '16px 22px', fontWeight: 500, textAlign: 'right' }}>RESOLUTION</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: '#52525b', fontSize: '0.875rem' }}>
                  Zero safety exceptions currently flagged.
                </td>
              </tr>
            ) : (
              filtered.map((exc) => {
                const sevBg =
                  exc.severity === 'CRITICAL'
                    ? 'rgba(239, 68, 68, 0.1)'
                    : exc.severity === 'WARNING'
                    ? 'rgba(245, 158, 11, 0.1)'
                    : 'rgba(59, 130, 246, 0.1)';
                const sevColor =
                  exc.severity === 'CRITICAL' ? '#f87171' : exc.severity === 'WARNING' ? '#fbbf24' : '#60a5fa';
                const sevBorder =
                  exc.severity === 'CRITICAL'
                    ? 'rgba(239, 68, 68, 0.25)'
                    : exc.severity === 'WARNING'
                    ? 'rgba(245, 158, 11, 0.25)'
                    : 'rgba(59, 130, 246, 0.25)';

                return (
                  <tr
                    key={exc.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      fontSize: '0.875rem',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '18px 22px' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: sevBg,
                          color: sevColor,
                          border: `1px solid ${sevBorder}`,
                        }}
                      >
                        {exc.severity}
                      </span>
                    </td>
                    <td style={{ padding: '18px 22px', fontWeight: 500, color: '#ffffff' }}>
                      {exc.type}
                    </td>
                    <td style={{ padding: '18px 22px', color: '#a1a1aa' }}>
                      {exc.description || 'Deterministic rule trigger'}
                    </td>
                    <td style={{ padding: '18px 22px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            backgroundColor: exc.status === 'OPEN' ? '#ef4444' : '#10b981',
                          }}
                        />
                        <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>{exc.status}</span>
                      </div>
                    </td>
                    <td style={{ padding: '18px 22px', color: '#71717a', fontSize: '0.8rem' }}>
                      {new Date(exc.createdAt).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '18px 22px', textAlign: 'right' }}>
                      {exc.status === 'OPEN' ? (
                        <button
                          onClick={() => setResolvingId(exc.id)}
                          style={{
                            padding: '6px 14px',
                            backgroundColor: 'rgba(255, 255, 255, 0.04)',
                            color: '#ffffff',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          Resolve
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#52525b' }}>Resolved</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Resolution Dialog */}
      {resolvingId && (
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
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            }}
          >
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
              Resolve Safety Exception
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#71717a', marginTop: '6px' }}>
              Document verified physical resolution for permanent compliance audit trail.
            </p>

            <form onSubmit={handleResolveSubmit} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 500, color: '#71717a' }}>
                  Resolution Reason (Min 5 chars)
                </label>
                <textarea
                  placeholder="e.g. Verified student safely transferred to guardian at front gate."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    marginTop: '6px',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setResolvingId(null)}
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
                  disabled={isSubmitting || reason.trim().length < 5}
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
                  {isSubmitting ? 'Recording...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
