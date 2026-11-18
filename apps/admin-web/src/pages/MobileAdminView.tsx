import React, { useState } from 'react';
import { useRouter } from '../router/Router';
import { useTheme } from '../theme/ThemeContext';
import { radii, shadows } from '../theme/design-system';
import logoImg from '../assets/logo.png';
import { StatusBadge } from '../components/ui/SharedComponents';
import {
  Navigation,
  Bell,
  UsersRound,
  BusFront,
  CircleCheck,
  TriangleAlert,
  ChevronRight,
  ArrowRight,
  House,
  LayoutGrid,
} from 'lucide-react';

export const MobileAdminView: React.FC = () => {
  const { navigate, setPersona } = useRouter();
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'home' | 'buses' | 'students' | 'more'>('home');

  const buses = [
    { id: '1', name: 'Bus 12', route: 'Sector 62 → Oakridge', status: 'On Route', type: 'info' as const },
    { id: '2', name: 'Bus 14', route: 'Vaishali → Oakridge', status: 'On Route', type: 'info' as const },
    { id: '3', name: 'Bus 18', route: 'Indirapuram → Oakridge', status: 'At School', type: 'success' as const },
  ];

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', minHeight: '100vh', backgroundColor: colors.canvasBg, padding: '16px 0' }}>
      {/* Phone Frame matching reference screen 3 */}
      <div
        style={{
          width: '100%',
          maxWidth: '414px',
          minHeight: '844px',
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          boxShadow: isDark
            ? '0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)'
            : '0 20px 40px -10px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Status Bar */}
        <div style={{ padding: '12px 20px 4px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 700, color: colors.textPrimary }}>
          <span>9:41</span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '11px', color: colors.textSecondary }}>
            <span>5G</span>
            <span>● 100%</span>
          </div>
        </div>

        {/* Top Header */}
        <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.borderLight}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src={logoImg}
              alt="School-GPS Logo"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                objectFit: 'contain',
                backgroundColor: '#ffffff',
                border: `1px solid ${colors.borderLight}`,
                padding: '2px',
              }}
            />
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
            <button
              onClick={() => navigate('/exceptions')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: colors.textSecondary,
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
              }}
            >
              <Bell size={18} strokeWidth={2} />
            </button>
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
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5',
                borderRadius: radii.lg,
                padding: '14px 10px',
                textAlign: 'center',
                border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0'}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <UsersRound size={18} strokeWidth={2} color={colors.success} />
              <div style={{ fontSize: '20px', fontWeight: 800, color: colors.textPrimary, marginTop: '4px' }}>
                428
              </div>
              <div style={{ fontSize: '11px', color: colors.textSecondary, fontWeight: 600 }}>
                Students
              </div>
            </div>

            {/* Blue Pill: 18 Buses */}
            <div
              style={{
                backgroundColor: isDark ? 'rgba(37, 99, 235, 0.12)' : '#eff6ff',
                borderRadius: radii.lg,
                padding: '14px 10px',
                textAlign: 'center',
                border: `1px solid ${isDark ? 'rgba(37, 99, 235, 0.3)' : '#bfdbfe'}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <BusFront size={18} strokeWidth={2} color={colors.primary} />
              <div style={{ fontSize: '20px', fontWeight: 800, color: colors.textPrimary, marginTop: '4px' }}>
                18
              </div>
              <div style={{ fontSize: '11px', color: colors.textSecondary, fontWeight: 600 }}>
                Buses
              </div>
            </div>

            {/* Purple Pill: 428 Accounted */}
            <div
              style={{
                backgroundColor: isDark ? 'rgba(139, 92, 246, 0.12)' : '#f5f3ff',
                borderRadius: radii.lg,
                padding: '14px 10px',
                textAlign: 'center',
                border: `1px solid ${isDark ? 'rgba(139, 92, 246, 0.3)' : '#ddd6fe'}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <CircleCheck size={18} strokeWidth={2} color="#8b5cf6" />
              <div style={{ fontSize: '20px', fontWeight: 800, color: colors.textPrimary, marginTop: '4px' }}>
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
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                <span>View All</span>
                <ArrowRight size={13} strokeWidth={2} />
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
                    backgroundColor: colors.card,
                    border: `1px solid ${colors.border}`,
                    boxShadow: shadows.sm,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: radii.md,
                        backgroundColor: colors.primaryLight,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.primary,
                        flexShrink: 0,
                      }}
                    >
                      <BusFront size={18} strokeWidth={2} />
                    </div>
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
                    <ChevronRight size={15} strokeWidth={2} color={colors.textMuted} />
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
              backgroundColor: colors.warningLight,
              borderRadius: radii.xl,
              border: `1px solid ${colors.warningBorder}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TriangleAlert size={18} strokeWidth={2} color={colors.warning} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: colors.warning }}>
                  1 Student Needs Attention
                </div>
                <div style={{ fontSize: '11px', color: colors.textSecondary }}>
                  Missing exit scan at Sector 62 Stop
                </div>
              </div>
            </div>
            <ChevronRight size={16} strokeWidth={2} color={colors.warning} />
          </div>

          {/* Role Switching for Mobile */}
          <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
            <button
              onClick={() => setPersona('parent')}
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '12px',
                borderRadius: radii.md,
                backgroundColor: colors.canvasBg,
                border: `1px solid ${colors.border}`,
                color: colors.textPrimary,
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <UsersRound size={14} strokeWidth={2} color={colors.primary} />
              Parent App
            </button>
            <button
              onClick={() => setPersona('attendant')}
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '12px',
                borderRadius: radii.md,
                backgroundColor: colors.canvasBg,
                border: `1px solid ${colors.border}`,
                color: colors.textPrimary,
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <BusFront size={14} strokeWidth={2} color={colors.primary} />
              Attendant App
            </button>
          </div>
        </div>

        {/* Bottom Nav Bar (Matches Reference: Home, Buses, Students, More) */}
        <div
          style={{
            height: '60px',
            borderTop: `1px solid ${colors.borderLight}`,
            backgroundColor: colors.card,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
          }}
        >
          {[
            { id: 'home', label: 'Home', icon: House, path: '/' },
            { id: 'buses', label: 'Buses', icon: BusFront, path: '/buses' },
            { id: 'students', label: 'Students', icon: UsersRound, path: '/students' },
            { id: 'more', label: 'More', icon: LayoutGrid, path: '/settings' },
          ].map((item) => {
            const IconComp = item.icon;
            const isActive = activeTab === item.id;
            return (
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
                  gap: '3px',
                  border: 'none',
                  background: 'none',
                  color: isActive ? colors.primary : colors.textSecondary,
                  fontSize: '11px',
                  fontWeight: isActive ? 800 : 500,
                  cursor: 'pointer',
                }}
              >
                <IconComp size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
