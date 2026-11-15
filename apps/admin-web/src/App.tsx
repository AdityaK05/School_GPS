import React, { useState, useEffect } from 'react';
import { ApiClient } from '@school-transport-platform/client-sdk';
import { Student, JourneyException, AuditLog } from '@school-transport-platform/shared-types';
import { DashboardOverview, OverviewMetrics } from './components/DashboardOverview';
import { LiveFleetView, LiveBusItem } from './components/LiveFleetView';
import { JourneyMonitorView, JourneyMonitorProps } from './components/JourneyMonitorView';
import { StudentTransportView } from './components/StudentTransportView';
import { ExceptionCenterView } from './components/ExceptionCenterView';
import { AuditLogView } from './components/AuditLogView';
import { ParentPortalView } from './components/ParentPortalView';
import { AttendantPortalView } from './components/AttendantPortalView';
import { DemoControlPanel } from './components/DemoControlPanel';

type Tab = 'overview' | 'fleet' | 'trips' | 'students' | 'exceptions' | 'audit';
type PortalMode = 'admin' | 'parent' | 'attendant';

export const App: React.FC = () => {
  const [portalMode, setPortalMode] = useState<PortalMode>('admin');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showDemoPanel, setShowDemoPanel] = useState<boolean>(false);
  const [schoolId, setSchoolId] = useState<string>('11111111-1111-1111-1111-111111111111');
  const [authToken, setAuthToken] = useState<string>(
    'test-token:22222222-2222-2222-2222-222222222222:SCHOOL_ADMIN:11111111-1111-1111-1111-111111111111'
  );

  const [metrics, setMetrics] = useState<OverviewMetrics>({
    activeBuses: 0,
    totalStudents: 0,
    studentsOnboard: 0,
    openExceptions: 0,
    gpsOnlineCount: 0,
    gpsStaleCount: 0,
  });

  const [buses, setBuses] = useState<LiveBusItem[]>([]);
  const [journeyStates, setJourneyStates] = useState<JourneyMonitorProps['states']>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [exceptions, setExceptions] = useState<JourneyException[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const apiBaseUrl =
    (import.meta.env?.VITE_API_BASE_URL as string) ||
    'https://school-gps-api.onrender.com';

  const apiClient = new ApiClient({
    baseUrl: apiBaseUrl,
    getToken: () => authToken,
  });

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [overview, busList, studentList, exceptionList, auditList] = await Promise.all([
        apiClient.getDashboardOverview().catch(() => null),
        apiClient.listBuses().catch(() => []),
        apiClient.getStudents().catch(() => []),
        apiClient.getExceptions().catch(() => []),
        apiClient.getAuditLogs().catch(() => []),
      ]);

      if (overview) {
        setMetrics({
          activeBuses: overview.activeBuses ?? 0,
          totalStudents: overview.totalStudents ?? 0,
          studentsOnboard: (overview as any).studentsOnboard ?? 0,
          openExceptions: overview.openExceptions ?? 0,
          gpsOnlineCount: (overview as any).gpsOnlineCount ?? 0,
          gpsStaleCount: (overview as any).gpsStaleCount ?? 0,
        });
      }

      if (busList && busList.length > 0) {
        setBuses(
          busList.map((b) => ({
            busId: b.id,
            fleetNumber: b.fleetNumber || 'BUS-01',
            registrationNumber: b.registrationNumber,
            lastRecordedAt: b.updatedAt,
          }))
        );
      }

      if (studentList) setStudents(studentList);
      if (exceptionList) setExceptions(exceptionList);
      if (auditList) setAuditLogs(auditList);
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [schoolId]);

  const handleAssignRoute = async (studentId: string, routeId: string, stopId: string) => {
    await apiClient.assignStudentRoute({
      studentId,
      routeId,
      stopId,
      effectiveFrom: new Date().toISOString().split('T')[0],
    });
    await refreshData();
  };

  const handleAssignCard = async (studentId: string, cardId: string) => {
    await apiClient.assignStudentCard(studentId, cardId);
    await refreshData();
  };

  const handleResolveException = async (exceptionId: string, reason: string) => {
    await apiClient.resolveException(exceptionId, reason);
    await refreshData();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#09090b',
        color: '#f4f4f5',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Flagship Minimalist Header */}
      <header
        style={{
          backgroundColor: 'rgba(9, 9, 11, 0.8)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '16px 36px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Brand Mark & Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z"
                stroke="url(#brandGrad)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 8L16 10.5V14.5L12 17L8 14.5V10.5L12 8Z"
                fill="url(#brandGrad)"
                fillOpacity="0.15"
                stroke="url(#brandGrad)"
                strokeWidth="1.5"
              />
              <defs>
                <linearGradient id="brandGrad" x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#38bdf8" />
                  <stop offset="1" stopColor="#818cf8" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 600, letterSpacing: '-0.025em', color: '#ffffff' }}>
              Aegis
            </span>
            <span
              style={{
                fontSize: '0.675rem',
                fontWeight: 600,
                color: '#71717a',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Fleet Safety OS
            </span>
          </div>
        </div>

        {/* Global Controls & Status */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Universal Persona / Portal Switcher */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
              padding: '3px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <button
              onClick={() => setPortalMode('admin')}
              style={{
                padding: '6px 14px',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: portalMode === 'admin' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                color: portalMode === 'admin' ? '#ffffff' : '#71717a',
                fontWeight: portalMode === 'admin' ? 600 : 400,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              🛡️ Admin Ops
            </button>
            <button
              onClick={() => setPortalMode('parent')}
              style={{
                padding: '6px 14px',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: portalMode === 'parent' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                color: portalMode === 'parent' ? '#38bdf8' : '#71717a',
                fontWeight: portalMode === 'parent' ? 600 : 400,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              👨‍👩‍👧 Parent View
            </button>
            <button
              onClick={() => setPortalMode('attendant')}
              style={{
                padding: '6px 14px',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: portalMode === 'attendant' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                color: portalMode === 'attendant' ? '#34d399' : '#71717a',
                fontWeight: portalMode === 'attendant' ? 600 : 400,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              🚌 Attendant Scanner
            </button>
          </div>

          {/* Live System Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
              }}
            />
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#a1a1aa', letterSpacing: '0.01em' }}>
              Telemetry Active
            </span>
          </div>

          {/* Refresh / Sync Button */}
          <button
            onClick={refreshData}
            disabled={isLoading}
            style={{
              padding: '7px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              color: '#e4e4e7',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)')}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: isLoading ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.4s ease',
              }}
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            {isLoading ? 'Syncing...' : 'Sync'}
          </button>

          {/* Operator Console Trigger Pill */}
          <button
            onClick={() => setShowDemoPanel(!showDemoPanel)}
            style={{
              padding: '7px 14px',
              backgroundColor: showDemoPanel ? 'rgba(56, 189, 248, 0.2)' : 'rgba(56, 189, 248, 0.08)',
              color: '#38bdf8',
              border: `1px solid ${showDemoPanel ? '#38bdf8' : 'rgba(56, 189, 248, 0.3)'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
            title="Open Demo Operator Control Panel"
          >
            <span>🎛️</span>
            <span>Demo Console</span>
          </button>

          {/* Admin Avatar */}
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#f4f4f5',
              cursor: 'default',
            }}
            title="School Transport Administrator"
          >
            AD
          </div>
        </div>
      </header>

      {/* Main Content & Navigation Container */}
      <main
        style={{
          flex: 1,
          padding: '40px 36px 64px 36px',
          maxWidth: '1280px',
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {portalMode === 'parent' && <ParentPortalView />}

        {portalMode === 'attendant' && <AttendantPortalView />}

        {portalMode === 'admin' && (
          <>
            {/* Floating Minimalist Segment Tabs */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '40px' }}>
              <nav
                style={{
                  display: 'flex',
                  gap: '4px',
                  padding: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                }}
              >
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'fleet', label: 'Fleet & Map' },
                  { id: 'trips', label: 'Trips & Manifest' },
                  { id: 'students', label: 'Students' },
                  { id: 'exceptions', label: 'Safety Exceptions' },
                  { id: 'audit', label: 'Audit Log' },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as Tab)}
                      style={{
                        padding: '8px 18px',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                        color: isActive ? '#ffffff' : '#71717a',
                        fontWeight: isActive ? 600 : 400,
                        fontSize: '0.825rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.color = '#d4d4d8';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.color = '#71717a';
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab View Canvas */}
            <div style={{ flex: 1 }}>
              {activeTab === 'overview' && <DashboardOverview metrics={metrics} />}
              {activeTab === 'fleet' && <LiveFleetView buses={buses} />}
              {activeTab === 'trips' && <JourneyMonitorView states={journeyStates} />}
              {activeTab === 'students' && (
                <StudentTransportView
                  students={students}
                  onAssignRoute={handleAssignRoute}
                  onAssignCard={handleAssignCard}
                />
              )}
              {activeTab === 'exceptions' && (
                <ExceptionCenterView exceptions={exceptions} onResolve={handleResolveException} />
              )}
              {activeTab === 'audit' && <AuditLogView logs={auditLogs} />}
            </div>
          </>
        )}
      </main>

      {/* Quiet Flagship Footer */}
      <footer
        style={{
          padding: '24px 36px',
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
          color: '#52525b',
          maxWidth: '1280px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <span>Aegis Fleet Platform &bull; Student Safety &amp; Accountability</span>
        <span>Telemetry Sync Active &bull; Zero Compromise</span>
      </footer>

      {/* Floating Demo Operator Control Panel */}
      <DemoControlPanel
        isOpen={showDemoPanel}
        onClose={() => setShowDemoPanel(false)}
        onActionComplete={refreshData}
      />
    </div>
  );
};
