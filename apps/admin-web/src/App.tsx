import React from 'react';
import { ApiClient } from '@school-transport-platform/client-sdk';
import { RouterProvider, useRouter } from './router/Router';
import { ThemeProvider } from './theme/ThemeContext';
import { AdminLayout } from './components/layout/AdminLayout';
import { DemoControlPanel } from './components/DemoControlPanel';

// Flagship Multi-Page Screens
import { OverviewPage } from './pages/OverviewPage';
import { LiveJourneysPage } from './pages/LiveJourneysPage';
import { JourneyDetailPage } from './pages/JourneyDetailPage';
import { LiveFleetPage } from './pages/LiveFleetPage';
import { BusCockpitPage } from './pages/BusCockpitPage';
import { StudentsDirectoryPage } from './pages/StudentsDirectoryPage';
import { StudentProfilePage } from './pages/StudentProfilePage';
import { RoutesPage } from './pages/RoutesPage';
import { ExceptionsPage } from './pages/ExceptionsPage';
import { ExceptionDetailPage } from './pages/ExceptionDetailPage';
import { AttendancePage } from './pages/AttendancePage';
import { AuditLedgerPage } from './pages/AuditLedgerPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

// Mobile-First Apps matching Design Reference
import { ParentAppView } from './pages/ParentAppView';
import { AttendantAppView } from './pages/AttendantAppView';
import { MobileAdminView } from './pages/MobileAdminView';

const apiBaseUrl =
  (import.meta.env?.VITE_API_BASE_URL as string) ||
  'https://school-gps-api.onrender.com';

const authToken =
  sessionStorage.getItem('aegis_access_token') ||
  (import.meta.env.DEV
    ? 'test-token:22222222-2222-2222-2222-222222222222:SCHOOL_ADMIN:11111111-1111-1111-1111-111111111111'
    : '');

const apiClient = new ApiClient({
  baseUrl: apiBaseUrl,
  getToken: () => authToken,
});

const AppRoutes: React.FC = () => {
  const { pathname, persona, showDemoPanel, setShowDemoPanel } = useRouter();

  // 1. DEDICATED PARENT APPLICATION (/parent or persona === 'parent')
  if (persona === 'parent' || pathname.startsWith('/parent')) {
    return (
      <>
        <ParentAppView apiClient={apiClient} />
        <DemoControlPanel isOpen={showDemoPanel} onClose={() => setShowDemoPanel(false)} />
      </>
    );
  }

  // 2. DEDICATED ATTENDANT SCANNER APPLICATION (/attendant or persona === 'attendant')
  if (persona === 'attendant' || pathname.startsWith('/attendant')) {
    return (
      <>
        <AttendantAppView apiClient={apiClient} />
        <DemoControlPanel isOpen={showDemoPanel} onClose={() => setShowDemoPanel(false)} />
      </>
    );
  }

  // 3. MOBILE ADMIN APPLICATION PREVIEW (/mobile or persona === 'mobile_preview')
  if (persona === 'mobile_preview' || pathname.startsWith('/mobile')) {
    return (
      <>
        <MobileAdminView />
        <DemoControlPanel isOpen={showDemoPanel} onClose={() => setShowDemoPanel(false)} />
      </>
    );
  }

  // 4. ADMIN WEB MULTI-PAGE APPLICATION (Wrapped in Midnight Navy Sidebar Layout)
  const renderAdminPage = () => {
    // 03 — Journey Passport / Detail: /journeys/:id
    if (pathname.startsWith('/journeys/') && pathname !== '/journeys') {
      return <JourneyDetailPage apiClient={apiClient} />;
    }
    // 02 — Live Journeys: /journeys
    if (pathname === '/journeys') {
      return <LiveJourneysPage apiClient={apiClient} />;
    }

    // 05 — Bus Cockpit: /buses/:id
    if (pathname.startsWith('/buses/') && pathname !== '/buses') {
      return <BusCockpitPage apiClient={apiClient} />;
    }
    // 04 — Live Fleet: /buses
    if (pathname === '/buses') {
      return <LiveFleetPage apiClient={apiClient} />;
    }

    // 07 — Student Profile: /students/:id
    if (pathname.startsWith('/students/') && pathname !== '/students') {
      return <StudentProfilePage apiClient={apiClient} />;
    }
    // 06 — Students Directory: /students
    if (pathname === '/students') {
      return <StudentsDirectoryPage apiClient={apiClient} />;
    }

    // 08 — Routes & Stops: /routes and /routes/:id
    if (pathname.startsWith('/routes')) {
      return <RoutesPage apiClient={apiClient} />;
    }

    // 10 — Exception Detail: /exceptions/:id
    if (pathname.startsWith('/exceptions/') && pathname !== '/exceptions') {
      return <ExceptionDetailPage apiClient={apiClient} />;
    }
    // 09 — Safety Exceptions: /exceptions
    if (pathname === '/exceptions') {
      return <ExceptionsPage apiClient={apiClient} />;
    }

    // 11 — Attendance & Accountability: /attendance
    if (pathname === '/attendance') {
      return <AttendancePage apiClient={apiClient} />;
    }

    // 12 — Safety Audit Ledger: /audit
    if (pathname === '/audit') {
      return <AuditLedgerPage apiClient={apiClient} />;
    }

    // 13 — Reports: /reports
    if (pathname === '/reports') {
      return <ReportsPage apiClient={apiClient} />;
    }

    // 14 — Settings: /settings
    if (pathname === '/settings') {
      return <SettingsPage apiClient={apiClient} />;
    }

    // 01 — Overview: /
    return <OverviewPage apiClient={apiClient} />;
  };

  return (
    <AdminLayout openExceptionsCount={1}>
      {renderAdminPage()}
      <DemoControlPanel isOpen={showDemoPanel} onClose={() => setShowDemoPanel(false)} />
    </AdminLayout>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <RouterProvider>
        <AppRoutes />
      </RouterProvider>
    </ThemeProvider>
  );
};

export default App;
