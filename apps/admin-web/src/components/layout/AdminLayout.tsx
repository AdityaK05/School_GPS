import React, { useState } from 'react';
import { useRouter } from '../../router/Router';
import { useTheme } from '../../theme/ThemeContext';
import { radii, shadows } from '../../theme/design-system';
import {
  House,
  Route,
  BusFront,
  UsersRound,
  Map,
  Bell,
  ClipboardCheck,
  ShieldCheck,
  ChartNoAxesCombined,
  Settings2,
  UserRound,
  UserCheck,
  Sliders,
  Sun,
  Moon,
  Menu,
  X,
  Shield,
  Smartphone,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  schoolName?: string;
  openExceptionsCount?: number;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  schoolName = 'Oakridge International School',
  openExceptionsCount = 0,
}) => {
  const { pathname, navigate, setPersona, showDemoPanel, setShowDemoPanel } = useRouter();
  const { colors, theme, toggleTheme, isDark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Exact navigation structure requested in Section 6
  const navItems = [
    { path: '/', label: 'Home', icon: House },
    { path: '/journeys', label: 'Journeys', icon: Route },
    { path: '/buses', label: 'Buses', icon: BusFront },
    { path: '/students', label: 'Students', icon: UsersRound },
    { path: '/routes', label: 'Routes', icon: Map },
    { path: '/exceptions', label: 'Alerts', icon: Bell, badge: openExceptionsCount > 0 ? openExceptionsCount : undefined },
    { path: '/attendance', label: 'Attendance', icon: ClipboardCheck },
    { path: '/audit', label: 'Safety Ledger', icon: ShieldCheck },
    { path: '/reports', label: 'Reports', icon: ChartNoAxesCombined },
    { path: '/settings', label: 'Settings', icon: Settings2 },
  ];

  const isNavActive = (itemPath: string) => {
    if (itemPath === '/') return pathname === '/';
    return pathname.startsWith(itemPath);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.bg, color: colors.textPrimary }}>
      {/* 1. DESKTOP MIDNIGHT NAVY / CALM SIDEBAR */}
      <aside
        className="admin-sidebar"
        style={{
          width: '240px',
          backgroundColor: colors.sidebar,
          color: colors.sidebarText,
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 40,
          padding: '20px 14px',
          borderRight: `1px solid ${colors.sidebarBorder}`,
          boxShadow: isDark ? '2px 0 16px rgba(0, 0, 0, 0.4)' : '2px 0 10px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 20px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src="/logo.png"
              alt="School-GPS Logo"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: radii.md,
                objectFit: 'contain',
                backgroundColor: '#ffffff',
                padding: '2px',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
              }}
            />
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                School-GPS
              </div>
              <div style={{ fontSize: '10px', color: colors.sidebarTextMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Safety &amp; Accountability
              </div>
            </div>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: radii.sm,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: `1px solid ${colors.sidebarBorder}`,
              color: colors.sidebarText,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            {isDark ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
          </button>
        </div>

        {/* Main Navigation Items */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
          {navItems.map((item) => {
            const active = isNavActive(item.path);
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: radii.sm,
                  border: 'none',
                  backgroundColor: active ? colors.sidebarActive : 'transparent',
                  color: active ? colors.sidebarActiveText : colors.sidebarText,
                  fontSize: '13px',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.15s ease, color 0.15s ease',
                  width: '100%',
                  borderLeft: active ? `3px solid ${colors.primary}` : '3px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '1px 6px',
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

        {/* Divider */}
        <div style={{ height: '1px', backgroundColor: colors.sidebarBorder, margin: '12px 0 10px 0' }} />

        {/* DEMO Section (Section 6 & 37) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div
            style={{
              fontSize: '10px',
              color: colors.sidebarTextMuted,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              paddingLeft: '10px',
              marginBottom: '2px',
            }}
          >
            Demo
          </div>

          <button
            onClick={() => setPersona('parent')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: '8px 12px',
              borderRadius: radii.sm,
              border: 'none',
              backgroundColor: 'transparent',
              color: colors.sidebarText,
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <UserRound size={15} strokeWidth={1.8} />
            <span>Parent view</span>
          </button>

          <button
            onClick={() => setPersona('attendant')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: '8px 12px',
              borderRadius: radii.sm,
              border: 'none',
              backgroundColor: 'transparent',
              color: colors.sidebarText,
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <UserCheck size={15} strokeWidth={1.8} />
            <span>Attendant view</span>
          </button>

          <button
            onClick={() => setShowDemoPanel(!showDemoPanel)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: '8px 12px',
              borderRadius: radii.sm,
              border: `1px solid ${colors.sidebarBorder}`,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: colors.sidebarText,
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              marginTop: '4px',
            }}
          >
            <Sliders size={15} strokeWidth={2} />
            <span>Demo mode</span>
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
          borderBottom: `1px solid ${colors.sidebarBorder}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src="/logo.png"
            alt="School-GPS Logo"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: radii.sm,
              objectFit: 'contain',
              backgroundColor: '#ffffff',
              padding: '2px',
            }}
          />
          <span style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>School-GPS</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={toggleTheme}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: radii.sm,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
          </button>

          <button
            onClick={() => setShowDemoPanel(!showDemoPanel)}
            style={{
              padding: '6px 10px',
              borderRadius: radii.sm,
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              border: 'none',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Sliders size={13} strokeWidth={2} />
            <span>Demo</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              padding: '6px',
              borderRadius: radii.sm,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            aria-label="Open mobile menu"
          >
            {mobileMenuOpen ? <X size={18} strokeWidth={2} /> : <Menu size={18} strokeWidth={2} />}
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
            gap: '4px',
            borderBottom: `1px solid ${colors.sidebarBorder}`,
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto',
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item.path);
            return (
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
                  backgroundColor: active ? colors.sidebarActive : 'transparent',
                  color: active ? colors.sidebarActiveText : colors.sidebarText,
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: active ? 700 : 500,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${colors.sidebarBorder}` }}>
            <button
              onClick={() => {
                setPersona('parent');
                setMobileMenuOpen(false);
              }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: radii.sm,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <UserRound size={14} strokeWidth={1.8} />
              <span>Parent View</span>
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
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <UserCheck size={14} strokeWidth={1.8} />
              <span>Attendant View</span>
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
          padding: '32px 36px 60px 36px',
          boxSizing: 'border-box',
          transition: 'background-color 0.2s',
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
          height: '58px',
          backgroundColor: colors.card,
          borderTop: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 40,
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.04)',
        }}
      >
        {[
          { path: '/', label: 'Home', icon: House },
          { path: '/journeys', label: 'Journeys', icon: Route },
          { path: '/buses', label: 'Buses', icon: BusFront },
          { path: '/students', label: 'Students', icon: UsersRound },
          { path: '/exceptions', label: 'Alerts', icon: Bell },
        ].map((item) => {
          const active = isNavActive(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                border: 'none',
                backgroundColor: 'transparent',
                color: active ? colors.primary : colors.textSecondary,
                fontSize: '11px',
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
