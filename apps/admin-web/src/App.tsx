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
import { DemoEnvironmentNotice } from './components/DemoEnvironmentNotice';
import { PreviewDemoApiClient } from './demo-api-client';
import { isLocalDemoMode, isVercelPreviewDemoMode } from './demo-mode';

const apiBaseUrl =
  (import.meta.env?.VITE_API_BASE_URL as string) ||
  '';

const authToken =
  sessionStorage.getItem('aegis_access_token') ||
  (import.meta.env.DEV && !isVercelPreviewDemoMode
    ? 'test-token:22222222-2222-2222-2222-222222222222:SCHOOL_ADMIN:11111111-1111-1111-1111-111111111111'
    : '');

const apiClient = isVercelPreviewDemoMode
  ? new PreviewDemoApiClient({ baseUrl: '' })
  : new ApiClient({
      baseUrl: apiBaseUrl,
      getToken: () => authToken,
    });

const AdminSignIn: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your school account email and password.');
      return;
    }
    if (!supabaseUrl || !anonKey) {
      setError('Authentication is not configured. Set the public Supabase URL and publishable key.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: anonKey },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const result = await response.json() as {
        access_token?: string;
        msg?: string;
        message?: string;
        error_description?: string;
      };
      if (!response.ok || !result.access_token) {
        throw new Error(result.error_description || result.msg || result.message || 'Sign-in failed. Check your credentials.');
      }
      sessionStorage.setItem('aegis_access_token', result.access_token);
      window.location.reload();
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : 'Sign-in could not be completed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ maxWidth: 420, margin: '12vh auto', padding: 28, fontFamily: 'sans-serif', color: '#0f172a' }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ color: '#2563eb', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          School Transport Operations
        </p>
        <h1 style={{ margin: '6px 0', fontSize: 28 }}>Sign in</h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>Use your authorized school account to access operational data.</p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
        <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600 }}>
          Email
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            style={{ padding: 12, border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14 }}
          />
        </label>
        <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600 }}>
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={{ padding: 12, border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14 }}
          />
        </label>
        {error && <p role="alert" style={{ color: '#b91c1c', fontSize: 13, margin: 0 }}>{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{ padding: 12, border: 0, borderRadius: 8, background: '#1d4ed8', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
        >
          {isSubmitting ? 'Signing in…' : 'Sign in securely'}
        </button>
      </form>
    </main>
  );
};

const AppRoutes: React.FC = () => {
  const { pathname, persona, showDemoPanel, setShowDemoPanel } = useRouter();

  if (!authToken && !isLocalDemoMode) {
    return <AdminSignIn />;
  }

  const unavailableInProduction =
    pathname === '/attendance' ||
    pathname === '/audit' ||
    pathname === '/reports' ||
    pathname === '/settings' ||
    (pathname.startsWith('/journeys/') && pathname !== '/journeys') ||
    (pathname.startsWith('/buses/') && pathname !== '/buses') ||
    (pathname.startsWith('/students/') && pathname !== '/students') ||
    (pathname.startsWith('/exceptions/') && pathname !== '/exceptions') ||
    pathname.startsWith('/parent') ||
    pathname.startsWith('/attendant') ||
    pathname.startsWith('/mobile') ||
    persona === 'parent' ||
    persona === 'attendant' ||
    persona === 'mobile_preview';
  if (!isLocalDemoMode && unavailableInProduction) {
    return (
      <main style={{ maxWidth: 640, margin: '12vh auto', padding: 28, fontFamily: 'sans-serif' }}>
        <h1>Workflow not enabled</h1>
        <p>This workflow is not connected to verified production data yet. Sample records are disabled here.</p>
        <button onClick={() => window.history.back()}>Return to the previous page</button>
      </main>
    );
  }

  // 1. DEDICATED PARENT APPLICATION (/parent or persona === 'parent')
  if (persona === 'parent' || pathname.startsWith('/parent')) {
    return (
      <>
        <DemoEnvironmentNotice />
        <ParentAppView apiClient={apiClient} />
        {isLocalDemoMode && <DemoControlPanel isOpen={showDemoPanel} onClose={() => setShowDemoPanel(false)} />}
      </>
    );
  }

  // 2. DEDICATED ATTENDANT SCANNER APPLICATION (/attendant or persona === 'attendant')
  if (persona === 'attendant' || pathname.startsWith('/attendant')) {
    return (
      <>
        <DemoEnvironmentNotice />
        <AttendantAppView apiClient={apiClient} />
        <DemoControlPanel isOpen={showDemoPanel} onClose={() => setShowDemoPanel(false)} />
      </>
    );
  }

  // 3. MOBILE ADMIN APPLICATION PREVIEW (/mobile or persona === 'mobile_preview')
  if (persona === 'mobile_preview' || pathname.startsWith('/mobile')) {
    return (
      <>
        <DemoEnvironmentNotice />
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
    <AdminLayout>
      {!isLocalDemoMode && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <button
            onClick={() => {
              sessionStorage.removeItem('aegis_access_token');
              window.location.reload();
            }}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
          >
            Sign out
          </button>
        </div>
      )}
      {renderAdminPage()}
      {isLocalDemoMode && <DemoControlPanel isOpen={showDemoPanel} onClose={() => setShowDemoPanel(false)} />}
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
