import React from 'react';
import { AuditLog } from '@school-transport-platform/shared-types';

export const AuditLogView: React.FC<{ logs: AuditLog[] }> = ({ logs }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#ffffff', letterSpacing: '-0.03em', margin: 0 }}>
          Audit Ledger
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#71717a', marginTop: '6px' }}>
          Cryptographically immutable log of privileged administrative changes and overrides.
        </p>
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
              <th style={{ padding: '16px 22px', fontWeight: 500 }}>TIMESTAMP</th>
              <th style={{ padding: '16px 22px', fontWeight: 500 }}>ACTION</th>
              <th style={{ padding: '16px 22px', fontWeight: 500 }}>OPERATOR</th>
              <th style={{ padding: '16px 22px', fontWeight: 500 }}>TARGET ENTITY</th>
              <th style={{ padding: '16px 22px', fontWeight: 500 }}>REASON</th>
              <th style={{ padding: '16px 22px', fontWeight: 500 }}>STATE DIFF</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: '#52525b', fontSize: '0.875rem' }}>
                  No audit operations recorded.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    fontSize: '0.825rem',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <td style={{ padding: '18px 22px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#71717a' }}>
                    {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : '-'}
                  </td>
                  <td style={{ padding: '18px 22px', fontWeight: 500, color: '#ffffff' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '18px 22px', color: '#a1a1aa' }}>
                    {log.actorUserId || 'SYSTEM'}
                  </td>
                  <td style={{ padding: '18px 22px', color: '#71717a', fontFamily: 'monospace' }}>
                    {log.entityType} ({log.entityId ? log.entityId.substring(0, 8) : ''}...)
                  </td>
                  <td style={{ padding: '18px 22px', color: '#a1a1aa' }}>
                    {log.reason || '-'}
                  </td>
                  <td style={{ padding: '18px 22px', fontFamily: 'monospace', fontSize: '0.725rem' }}>
                    {log.before != null ? (
                      <div style={{ color: '#f87171' }}>- {JSON.stringify(log.before).substring(0, 45)}...</div>
                    ) : null}
                    {log.after != null ? (
                      <div style={{ color: '#34d399' }}>+ {JSON.stringify(log.after).substring(0, 45)}...</div>
                    ) : null}
                    {log.before == null && log.after == null ? <span style={{ color: '#52525b' }}>-</span> : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
