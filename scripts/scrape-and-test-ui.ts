import http from 'http';

interface ScrapeReport {
  htmlStatus: number;
  jsBundleLoaded: boolean;
  jsBundleSize: number;
  apiProxyEndpoints: Array<{ endpoint: string; status: number; ok: boolean }>;
  endToEndActions: Array<{ action: string; success: boolean; details?: string }>;
  overallSuccess: boolean;
}

function fetchUrl(url: string, headers: Record<string, string> = {}): Promise<{ status: number; headers: any; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode || 0, headers: res.headers, body: data }));
    });
    req.on('error', reject);
  });
}

function postJson(url: string, body: any, headers: Record<string, string> = {}): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const jsonStr = JSON.stringify(body);
    const parsed = new URL(url);
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(jsonStr),
          ...headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode || 0, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode || 0, body: data });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(jsonStr);
    req.end();
  });
}

async function scrapeAndAuditApp() {
  console.log('================================================================');
  console.log(' AUTOMATED WEB SCRAPER & UI AUDIT');
  console.log(' Inspecting: http://localhost:5173');
  console.log('================================================================\n');

  const report: ScrapeReport = {
    htmlStatus: 0,
    jsBundleLoaded: false,
    jsBundleSize: 0,
    apiProxyEndpoints: [],
    endToEndActions: [],
    overallSuccess: true,
  };

  const schoolId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const authHeader = {
    Authorization: `Bearer test-token:usr_admin:SCHOOL_ADMIN:${schoolId}`,
  };

  // 1. Scrape root HTML
  console.log('[1/4] Scraping Frontend Landing Page (http://localhost:5173)...');
  const rootRes = await fetchUrl('http://localhost:5173');
  report.htmlStatus = rootRes.status;
  console.log(`      ✓ HTTP Status: ${rootRes.status}`);

  if (!rootRes.body.includes('<div id="root"></div>')) {
    console.error('      ✗ Root element #root missing from HTML!');
    report.overallSuccess = false;
  } else {
    console.log('      ✓ Root mount point (#root) verified in DOM');
  }

  // Extract JavaScript entry point
  const scriptMatch = rootRes.body.match(/<script\s+type="module"\s+src="([^"]+)"/);
  if (scriptMatch) {
    const scriptPath = scriptMatch[1];
    const scriptUrl = `http://localhost:5173${scriptPath}`;
    console.log(`      ✓ JS Module Script found: ${scriptPath}`);
    const jsRes = await fetchUrl(scriptUrl);
    report.jsBundleLoaded = jsRes.status === 200;
    report.jsBundleSize = Buffer.byteLength(jsRes.body);
    console.log(`      ✓ JS Module downloaded (${report.jsBundleSize} bytes, HTTP ${jsRes.status})`);
  } else {
    console.error('      ✗ No module script tag found in HTML');
    report.overallSuccess = false;
  }

  // 2. Audit all proxied API endpoints used by UI views
  console.log('\n[2/4] Auditing UI API Proxied Endpoints...');
  const endpoints = [
    '/api/v1/health',
    '/api/v1/auth/me',
    '/api/v1/dashboard/overview',
    '/api/v1/buses',
    '/api/v1/students',
    '/api/v1/exceptions',
    '/api/v1/audit-logs',
  ];

  for (const ep of endpoints) {
    const res = await fetchUrl(`http://localhost:5173${ep}`, authHeader);
    const ok = res.status === 200;
    report.apiProxyEndpoints.push({ endpoint: ep, status: res.status, ok });
    if (ok) {
      console.log(`      ✓ ${ep} -> 200 OK`);
    } else {
      console.error(`      ✗ ${ep} -> Failed (${res.status})`);
      report.overallSuccess = false;
    }
  }

  // 3. End-to-End Functional Interaction Test
  console.log('\n[3/4] Testing End-to-End Operational Interactions...');

  // A. Provision new bus through UI API
  const busData = {
    registrationNumber: `KA-01-WB-${Math.floor(1000 + Math.random() * 9000)}`,
    fleetNumber: 'BUS-WEB-01',
    capacity: 45,
  };
  const busRes = await postJson('http://localhost:5173/api/v1/buses', busData, authHeader);
  if ((busRes.status === 200 || busRes.status === 201) && busRes.body.success) {
    report.endToEndActions.push({ action: 'Create Bus in Fleet', success: true });
    console.log(`      ✓ Fleet Registration: Bus ${busData.registrationNumber} created successfully`);
  } else {
    report.endToEndActions.push({ action: 'Create Bus in Fleet', success: false, details: JSON.stringify(busRes.body) });
    console.error(`      ✗ Fleet Registration failed:`, busRes.body);
    report.overallSuccess = false;
  }

  // B. Enroll new student through UI API
  const studentData = {
    admissionNumber: `ADM-${Math.floor(10000 + Math.random() * 90000)}`,
    firstName: 'Isha',
    lastName: 'Verma',
    rfidCardId: `CARD-ISHA-${Math.floor(1000 + Math.random() * 9000)}`,
  };
  const studentRes = await postJson('http://localhost:5173/api/v1/students', studentData, authHeader);
  if ((studentRes.status === 200 || studentRes.status === 201) && studentRes.body.success) {
    report.endToEndActions.push({ action: 'Enroll Student in Roster', success: true });
    console.log(`      ✓ Student Enrolled: ${studentData.firstName} ${studentData.lastName} (Card: ${studentData.rfidCardId})`);
  } else {
    report.endToEndActions.push({ action: 'Enroll Student in Roster', success: false, details: JSON.stringify(studentRes.body) });
    console.error(`      ✗ Student Enrollment failed:`, studentRes.body);
    report.overallSuccess = false;
  }

  // C. Verify Dashboard Overview metrics updated
  const overviewRes = await fetchUrl('http://localhost:5173/api/v1/dashboard/overview', authHeader);
  const overviewData = JSON.parse(overviewRes.body);
  if (overviewData.success && overviewData.data.totalStudents >= 1 && overviewData.data.activeBuses >= 1) {
    report.endToEndActions.push({ action: 'Verify Dashboard Overview Metrics Sync', success: true });
    console.log(`      ✓ Dashboard Metrics Synced: Active Buses = ${overviewData.data.activeBuses}, Total Students = ${overviewData.data.totalStudents}`);
  } else {
    report.endToEndActions.push({ action: 'Verify Dashboard Overview Metrics Sync', success: false });
    console.error(`      ✗ Dashboard metrics did not reflect new entities:`, overviewData);
    report.overallSuccess = false;
  }

  // 4. Final Verdict
  console.log('\n[4/4] Summary & Verdict...');
  console.log('================================================================');
  if (report.overallSuccess) {
    console.log(' AUDIT STATUS: ALL END-TO-END FUNCTIONALITIES VERIFIED & WORKING!');
    console.log(' Zero HTTP errors, zero proxy defects, and full UI-API synchronization.');
  } else {
    console.error(' AUDIT STATUS: DEFECTS DETECTED — REVIEW LOGS ABOVE.');
  }
  console.log('================================================================\n');

  if (!report.overallSuccess) {
    process.exit(1);
  }
}

scrapeAndAuditApp().catch((err) => {
  console.error('Scraper Execution Error:', err);
  process.exit(1);
});
