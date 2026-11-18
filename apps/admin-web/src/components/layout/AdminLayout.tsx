import React, { useState } from 'react';
import { useRouter } from '../../router/Router';
import { colors, radii, shadows } from '../../theme/design-system';

interface AdminLayoutProps {
  children: React.ReactNode;
  schoolName?: string;
  openExceptionsCount?: number;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  schoolName = 'Oakridge International',
  openExceptionsCount = 0,
}) => {
  const { pathname, navigate, persona, setPersona, showDemoPanel, setShowDemoPanel } = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/buses', label: 'Buses', icon: '🚌' },
    { path: '/students', label: 'Students', icon: '👥' },
    { path: '/journeys', label: 'Journeys', icon: '🗺️' },
    { path: '/exceptions', label: 'Alerts', icon: '🔔', badge: openExceptionsCount > 0 ? openExceptionsCount : undefined },
    { path: '/attendance', label: 'Attendance', icon: '✓' },
    { path: '/routes', label: 'Routes', icon: '🛣️' },
    { path: '/audit', label: 'Safety Ledger', icon: '📋' },
    { path: '/reports', label: 'Reports', icon: '📊' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  const isNavActive = (itemPath: string) => {
    if (itemPath === '/') return pathname === '/';
    return pathname.startsWith(itemPath);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.bg }}>
      {/* 1. DESKTOP MIDNIGHT NAVY SIDEBAR */}
      <aside
        className="admin-sidebar"
        style={{
          width: '240px',
          backgroundColor: colors.sidebar,
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 40,
          padding: '24px 16px',
          boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px 24px 8px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: radii.md,
              backgroundColor: colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)',
            }}
          >
            📍
          </div>
          <div>
            <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
              School-GPS
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
              Safety &amp; Accountability
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          {navItems.map((item) => {
            const active = isNavActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: radii.md,
                  border: 'none',
                  backgroundColor: active ? colors.sidebarActive : 'transparent',
                  color: active ? '#ffffff' : '#cbd5e1',
                  fontSize: '13px',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.15s ease',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = colors.sidebarHover;
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '16px' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: radii.full,
                      backgroundColor: colors.danger,
                      color: '#ffffff',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Sidebar: Persona Switcher & Demo Simulator Console Trigger */}
        <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Persona Switcher Quick Menu */}
          <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', paddingLeft: '8px' }}>
            Portals &amp; Views
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <button
              onClick={() => setPersona('parent')}
              style={{
                padding: '6px',
                borderRadius: radii.sm,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#cbd5e1',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              👨‍👩‍👧 Parent
            </button>
            <button
              onClick={() => setPersona('attendant')}
              style={{
                padding: '6px',
                borderRadius: radii.sm,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#cbd5e1',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🚌 Attendant
            </button>
          </div>

          <button
            onClick={() => setPersona('mobile_preview')}
            style={{
              padding: '7px',
              borderRadius: radii.sm,
              border: '1px solid rgba(56, 189, 248, 0.3)',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              color: '#38bdf8',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            📱 Mobile App Preview
          </button>

          {/* Demo Simulator Console Trigger */}
          <button
            onClick={() => setShowDemoPanel(!showDemoPanel)}
            style={{
              padding: '9px 12px',
              borderRadius: radii.md,
              border: 'none',
              backgroundColor: '#f59e0b',
              color: '#000000',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>🎛️</span>
            <span>Demo Console</span>
          </button>
        </div>
      </aside>

      {/* 2. MOBILE TOP HEADER (shown on screen < 900px) */}
      <header
        className="admin-mobile-header"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '56px',
          backgroundColor: colors.sidebar,
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 50,
          boxShadow: shadows.sm,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>📍</span>
          <span style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>School-GPS</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowDemoPanel(!showDemoPanel)}
            style={{
              padding: '5px 10px',
              borderRadius: radii.sm,
              backgroundColor: '#f59e0b',
              color: '#000000',
              border: 'none',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Demo
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              padding: '6px 10px',
              borderRadius: radii.sm,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            ☰
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: '56px',
            left: 0,
            right: 0,
            backgroundColor: colors.sidebar,
            zIndex: 49,
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setMobileMenuOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: radii.sm,
                backgroundColor: isNavActive(item.path) ? colors.sidebarActive : 'transparent',
                color: '#ffffff',
                border: 'none',
                fontSize: '14px',
                fontWeight: isNavActive(item.path) ? 700 : 500,
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <button
              onClick={() => {
                setPersona('parent');
                setMobileMenuOpen(false);
              }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: radii.sm,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              👨‍👩‍👧 Parent App
            </button>
            <button
              onClick={() => {
                setPersona('attendant');
                setMobileMenuOpen(false);
              }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: radii.sm,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              🚌 Attendant App
            </button>
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT CANVAS */}
      <main
        className="admin-main-content"
        style={{
          flex: 1,
          marginLeft: '240px',
          minHeight: '100vh',
          backgroundColor: colors.bg,
          padding: '32px 40px 60px 40px',
          boxSizing: 'border-box',
        }}
      >
        {children}
      </main>

      {/* 4. MOBILE BOTTOM NAVIGATION BAR (shown on screen < 900px) */}
      <nav
        className="admin-mobile-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60px',
          backgroundColor: '#ffffff',
          borderTop: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 40,
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
        }}
      >
        {[
          { path: '/', label: 'Home', icon: '🏠' },
          { path: '/buses', label: 'Buses', icon: '🚌' },
          { path: '/students', label: 'Students', icon: '👥' },
          { path: '/journeys', label: 'Journeys', icon: '🗺️' },
          { path: '/exceptions', label: 'Alerts', icon: '🔔' },
        ].map((item) => {
          const active = isNavActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                border: 'none',
                backgroundColor: 'transparent',
                color: active ? colors.primary : colors.textSecondary,
                fontSize: '11px',
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
