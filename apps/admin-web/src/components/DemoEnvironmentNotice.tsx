import React from 'react';
import { isLocalDemoMode } from '../demo-mode';

export const DemoEnvironmentNotice: React.FC = () => {
  if (!isLocalDemoMode) return null;

  return (
    <div
      role="status"
      style={{
        padding: '10px 14px',
        border: '1px solid #d97706',
        borderRadius: 10,
        background: '#fffbeb',
        color: '#78350f',
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1.45,
      }}
    >
      DEMO MODE — Sample records and simulated events are for preview only. No live GPS/RFID is connected; do not use this view for safety decisions.
    </div>
  );
};
