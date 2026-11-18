import React, { useState } from 'react';
import { useRouter } from '../router/Router';
import { colors, radii, shadows } from '../theme/design-system';
import { StatusBadge } from '../components/ui/SharedComponents';

export const MobileAdminView: React.FC = () => {
  const { navigate, setPersona } = useRouter();
  const [activeTab, setActiveTab] = useState<'home' | 'buses' | 'students' | 'more'>('home');

  const buses = [
    { id: '1', name: 'Bus 12', route: 'Sector 62 → Oakridge', status: 'On Route', type: 'info' as const },
    { id: '2', name: 'Bus 14', route: 'Vaishali → Oakridge', status: 'On Route', type: 'info' as const },
    { id: '3', name: 'Bus 18', route: 'Indirapuram → Oakridge', status: 'At School', type: 'success' as const },
  ];

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '16px 0' }}>
      {/* Phone Frame matching reference screen 3 */}
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
        {/* Status Bar */}
        <div style={{ padding: '12px 20px 4px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 700, color: colors.textPrimary }}>
          <span>9:41</span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span>5G</span>
            <span>● 100%</span>
          </div>
        </div>

        {/* Top Header */}
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
              Web Ops ⇄
            </button>
            <span style={{ fontSize: '18px', cursor: 'pointer' }}>🔔</span>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          {/* Greeting */}
          <div>
            <div style={{ fontSize: '13px', color: colors.textSecondary, fontWeight: 500 }}>Good Morning,</div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: colors.textPrimary, margin: '2px 0 0 0' }}>
              Admin
            </h2>
          </div>

          {/* 3 Metric Pills matching reference screen 3 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {/* Green Pill: 428 Students */}
            <div
              style={{
                backgroundColor: '#ecfdf5',
                borderRadius: radii.lg,
                padding: '14px 10px',
                textAlign: 'center',
                border: '1px solid #a7f3d0',
              }}
            >
              <div style={{ fontSize: '20px' }}>👥</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: colors.textPrimary, marginTop: '2px' }}>
                428
              </div>
              <div style={{ fontSize: '11px', color: colors.textSecondary, fontWeight: 600 }}>
                Students
              </div>
            </div>

            {/* Blue Pill: 18 Buses */}
            <div
              style={{
                backgroundColor: '#eff6ff',
                borderRadius: radii.lg,
                padding: '14px 10px',
                textAlign: 'center',
                border: '1px solid #bfdbfe',
              }}
            >
              <div style={{ fontSize: '20px' }}>🚌</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: colors.textPrimary, marginTop: '2px' }}>
                18
              </div>
              <div style={{ fontSize: '11px', color: colors.textSecondary, fontWeight: 600 }}>
                Buses
              </div>
            </div>

            {/* Purple Pill: 428 Accounted */}
            <div
              style={{
                backgroundColor: '#f5f3ff',
                borderRadius: radii.lg,
                padding: '14px 10px',
                textAlign: 'center',
                border: '1px solid #ddd6fe',
              }}
            >
              <div style={{ fontSize: '20px' }}>✓</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: colors.textPrimary, marginTop: '2px' }}>
                428
              </div>
              <div style={{ fontSize: '11px', color: colors.textSecondary, fontWeight: 600 }}>
                Accounted
              </div>
            </div>
          </div>

          {/* Section: Live Buses */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
                Live Buses
              </h3>
              <button
                onClick={() => navigate('/buses')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: colors.primary,
                  cursor: 'pointer',
                }}
              >
                View All →
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {buses.map((b) => (
                <div
                  key={b.id}
                  onClick={() => navigate('/buses')}
                  style={{
                    padding: '14px 16px',
                    borderRadius: radii.lg,
                    backgroundColor: '#ffffff',
                    border: `1px solid ${colors.border}`,
                    boxShadow: shadows.sm,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '22px' }}>🚌</span>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: colors.textPrimary }}>
                        {b.name}
                      </div>
                      <div style={{ fontSize: '11px', color: colors.textSecondary }}>
                        {b.route}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <StatusBadge type={b.type} icon="●" label={b.status} />
                    <span style={{ color: colors.textMuted, fontSize: '14px' }}>›</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Amber Warning Banner: 1 Student Needs Attention */}
          <div
            onClick={() => navigate('/exceptions')}
            style={{
              padding: '16px 18px',
              backgroundColor: '#fffbeb',
              borderRadius: radii.xl,
              border: '1px solid #fde68a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>⚠️</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#92400e' }}>
                  1 Student Needs Attention
                </div>
                <div style={{ fontSize: '11px', color: '#b45309' }}>
                  Missing exit scan at Sector 62 Stop
                </div>
              </div>
            </div>
            <span style={{ fontSize: '16px', color: '#92400e', fontWeight: 700 }}>›</span>
          </div>

          {/* Role Switching for Mobile */}
          <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
            <button
              onClick={() => setPersona('parent')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: radii.md,
                backgroundColor: '#f8fafc',
                border: `1px solid ${colors.border}`,
                color: colors.textPrimary,
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              👨‍👩‍👧 Parent App
            </button>
            <button
              onClick={() => setPersona('attendant')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: radii.md,
                backgroundColor: '#f8fafc',
                border: `1px solid ${colors.border}`,
                color: colors.textPrimary,
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🚌 Attendant App
            </button>
          </div>
        </div>

        {/* Bottom Nav Bar (Matches Reference: Home, Buses, Students, More) */}
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
          {[
            { id: 'home', label: 'Home', icon: '🏠', path: '/' },
            { id: 'buses', label: 'Buses', icon: '🚌', path: '/buses' },
            { id: 'students', label: 'Students', icon: '👥', path: '/students' },
            { id: 'more', label: 'More', icon: '▦', path: '/settings' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                navigate(item.path);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                border: 'none',
                background: 'none',
                color: activeTab === item.id ? colors.primary : colors.textSecondary,
                fontSize: '11px',
                fontWeight: activeTab === item.id ? 800 : 500,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
