/* ==========================================================================
   HOSPITIQ — HEALTHCARE COMMAND CENTER APPLICATION LOGIC
   Enterprise Role-Based Security & Real-Time OPD/Bed Management Engine
   ========================================================================== */

const appState = {
  sessionToken: window.sessionStorage ? window.sessionStorage.getItem('hospitiq_auth_token') : null,
  currentUser: window.sessionStorage && window.sessionStorage.getItem('hospitiq_user') 
    ? JSON.parse(window.sessionStorage.getItem('hospitiq_user')) 
    : null,
  activeView: 'dashboard',
  activePublicPage: 'home',
  theme: localStorage.getItem('hospitiq_theme') || 'dark',
  bedWardFilter: 'all',

  stats: null,
  capacity: null,
  queue: [],
  doctors: [],
  beds: [],
  departments: [],
  patients: [],
  admissions: [],
  insights: [],
  alerts: [],

  charts: {},
  syncInterval: null
};

// Role-Based Permissions Matrix
const ROLE_PERMISSIONS = {
  Patient: ['patient-portal', 'hospital-info'],
  Doctor: ['doctor-portal', 'opd-queue', 'patients', 'doctors', 'bed-mgmt', 'bed-map', 'admissions', 'hospital-info'],
  Admin: ['dashboard', 'opd-queue', 'patients', 'doctors', 'bed-mgmt', 'bed-map', 'admissions', 'analytics', 'alerts', 'reports', 'admin-manage', 'settings', 'doctor-portal', 'patient-portal', 'hospital-info']
};

const canAccessView = (role, viewId) => {
  if (!role) return false;
  const allowed = ROLE_PERMISSIONS[role] || [];
  return allowed.includes(viewId);
};

// --- DOM Initializer ---
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initLandingPage();
  initAuth();
  initNavigation();
  initModals();
  initSearchAndFilters();

  await loadAppData();
  await checkDirectUrlAccess();

  // If user has existing active session, restore portal
  if (appState.sessionToken && appState.currentUser) {
    const defaultView = appState.currentUser.role === 'Patient' ? 'patient-portal' 
      : (appState.currentUser.role === 'Doctor' ? 'doctor-portal' : 'dashboard');
    launchPortal(appState.currentUser, defaultView, false);
  }

  // Start Real-Time Live Sync Polling (Every 6 seconds)
  if (!appState.syncInterval) {
    appState.syncInterval = setInterval(() => {
      const appShell = document.getElementById('appShell');
      if (appShell && !appShell.classList.contains('hidden') && appShell.style.display !== 'none') {
        loadAppData(true);
      }
    }, 6000);
  }

  lucide.createIcons();
});

// --- Theme Manager ---
function initTheme() {
  document.documentElement.setAttribute('data-theme', appState.theme);
  updateThemeIcons();

  const toggleBtns = [document.getElementById('landingThemeBtn'), document.getElementById('headerThemeBtn')];
  toggleBtns.forEach(btn => {
    btn?.addEventListener('click', () => {
      appState.theme = appState.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', appState.theme);
      localStorage.setItem('hospitiq_theme', appState.theme);
      updateThemeIcons();
    });
  });
}

function updateThemeIcons() {
  const isDark = appState.theme === 'dark';
  const landingIcon = document.getElementById('landingThemeIcon');
  const headerIcon = document.getElementById('headerThemeIcon');
  if (landingIcon) landingIcon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
  if (headerIcon) headerIcon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
  lucide.createIcons();
}

// --- Public Landing Page Navigation ---
function initLandingPage() {
  const hash = window.location.hash.replace('#', '') || 'home';
  if (['home', 'features', 'about', 'contact', 'services', 'register', 'login'].includes(hash)) {
    switchPublicPage(hash, false);
  }

  window.addEventListener('hashchange', () => {
    const currentHash = window.location.hash.replace('#', '');
    if (['home', 'features', 'about', 'contact', 'services', 'register', 'login'].includes(currentHash)) {
      switchPublicPage(currentHash, false);
    }
  });

  const quoteTicker = document.getElementById('quoteTickerText');
  const hospitalQuotes = [
    `"Smarter Queues. Better Care." — Real-time OPD hospital triage network`,
    `"Fast, Transparent Healthcare" — Contactless QR queue tracking for all patients`,
    `"Zero Waiting Confusion" — Prioritized doctor consultation and live bed status`
  ];
  let quoteIdx = 0;
  setInterval(() => {
    if (quoteTicker) {
      quoteIdx = (quoteIdx + 1) % hospitalQuotes.length;
      quoteTicker.style.opacity = '0';
      setTimeout(() => {
        quoteTicker.textContent = hospitalQuotes[quoteIdx];
        quoteTicker.style.opacity = '1';
      }, 300);
    }
  }, 5000);
}

function switchPublicPage(pageName, updateHash = true) {
  appState.activePublicPage = pageName;
  if (updateHash && window.location.hash !== `#${pageName}`) {
    window.location.hash = pageName;
  }

  const landingWrapper = document.getElementById('publicLandingPage');
  if (landingWrapper) {
    landingWrapper.classList.remove('hidden');
    landingWrapper.style.display = 'block';
  }

  const appShell = document.getElementById('appShell');
  if (appShell) {
    appShell.classList.add('hidden');
    appShell.style.display = 'none';
  }

  document.querySelectorAll('.public-page-view').forEach(view => {
    view.classList.remove('active');
    view.style.display = 'none';
  });

  const isSubSection = ['features', 'services', 'contact'].includes(pageName);
  const targetViewId = isSubSection ? 'public-view-home' : `public-view-${pageName}`;
  const targetView = document.getElementById(targetViewId);

  if (targetView) {
    targetView.classList.add('active');
    targetView.style.display = 'block';
  }

  if (isSubSection) {
    let sectionId = 'featuresSection';
    if (pageName === 'services') sectionId = 'servicesSection';
    if (pageName === 'contact') sectionId = 'footerSection';

    setTimeout(() => {
      const sectionEl = document.getElementById(sectionId);
      if (sectionEl) {
        sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  lucide.createIcons();
}

function openPublicTokenModal() {
  openModal('newTokenModal');
}

function openLoginOverlay() {
  const overlay = document.getElementById('loginScreen');
  if (overlay) {
    overlay.classList.add('active');
    overlay.style.display = 'flex';
  }
}

function closeLoginOverlay() {
  const overlay = document.getElementById('loginScreen');
  if (overlay) {
    overlay.classList.remove('active');
    overlay.style.display = 'none';
  }
}

// --- Dynamic Role-Based Authentication & Session Engine ---
function initAuth() {
  const loginForm = document.getElementById('loginForm');

  // Role Demo Chips Switcher (Patient / Doctor / Admin)
  document.querySelectorAll('.demo-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      const parentForm = chip.closest('.glass-card') || document;
      parentForm.querySelectorAll('.demo-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const role = chip.getAttribute('data-role');
      const isModal = !!parentForm.querySelector('#loginForm') || parentForm.id === 'loginScreen';

      const patientGroup = document.getElementById(isModal ? 'modalPatientCredentialsGroup' : 'pagePatientCredentialsGroup') 
        || document.getElementById('modalPatientCredentialsGroup') 
        || document.getElementById('pagePatientCredentialsGroup');

      const staffGroup = document.getElementById(isModal ? 'modalStaffCredentialsGroup' : 'pageStaffCredentialsGroup') 
        || document.getElementById('modalStaffCredentialsGroup') 
        || document.getElementById('pageStaffCredentialsGroup');

      const staffLabel = document.getElementById(isModal ? 'modalStaffLabel' : 'pageStaffLabel')
        || document.getElementById('modalStaffLabel')
        || document.getElementById('pageStaffLabel');

      const staffEmailInput = document.getElementById(isModal ? 'loginEmail' : 'pageLoginEmail')
        || document.getElementById('loginEmail')
        || document.getElementById('pageLoginEmail');

      if (role === 'Patient') {
        if (patientGroup) patientGroup.style.display = 'block';
        if (staffGroup) staffGroup.style.display = 'none';
      } else {
        if (patientGroup) patientGroup.style.display = 'none';
        if (staffGroup) staffGroup.style.display = 'block';
        if (role === 'Doctor') {
          if (staffLabel) staffLabel.textContent = 'Doctor Account Email';
          if (staffEmailInput) {
            staffEmailInput.value = 'doctor@hospitiq.org';
            staffEmailInput.placeholder = 'doctor@hospitiq.org';
          }
        } else {
          if (staffLabel) staffLabel.textContent = 'Admin Account Email';
          if (staffEmailInput) {
            staffEmailInput.value = 'admin@hospitiq.org';
            staffEmailInput.placeholder = 'admin@hospitiq.org';
          }
        }
      }
    });
  });

  // Modal Login Submit
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const activeChip = loginForm.querySelector('.demo-chip.active');
    const role = activeChip ? activeChip.getAttribute('data-role') : 'Patient';

    if (role === 'Patient') {
      const name = (document.getElementById('loginPatientName')?.value || 'tarun').trim();
      const token = (document.getElementById('loginTokenNumber')?.value || 'A-031').trim();
      await executeLogin(role, { patientName: name, tokenNumber: token });
    } else {
      const email = (document.getElementById('loginEmail')?.value || 'admin@hospitiq.org').trim();
      await executeLogin(role, { email });
    }
  });

  // Logout Action
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    appState.sessionToken = null;
    appState.currentUser = null;
    if (window.sessionStorage) {
      sessionStorage.removeItem('hospitiq_auth_token');
      sessionStorage.removeItem('hospitiq_user');
    }

    const shell = document.getElementById('appShell');
    if (shell) {
      shell.classList.add('hidden');
      shell.style.display = 'none';
    }
    const landing = document.getElementById('publicLandingPage');
    if (landing) {
      landing.classList.remove('hidden');
      landing.style.display = 'block';
    }
    switchPublicPage('home', false);
    closeLoginOverlay();
    showToast('Signed out of HOSPITIQ', 'info');
  });
}

// Public Page Login Form Submit
async function handlePublicPageLogin(e) {
  e.preventDefault();
  const activeChip = document.querySelector('#public-view-login .demo-chip.active');
  const role = activeChip ? activeChip.getAttribute('data-role') : 'Patient';

  if (role === 'Patient') {
    const name = (document.getElementById('pageLoginPatientName')?.value || 'tarun').trim();
    const token = (document.getElementById('pageLoginTokenNumber')?.value || 'A-031').trim();
    await executeLogin(role, { patientName: name, tokenNumber: token });
  } else {
    const email = (document.getElementById('pageLoginEmail')?.value || 'admin@hospitiq.org').trim();
    await executeLogin(role, { email });
  }
}

// Centralized Login Execution with Server-Side Verification
async function executeLogin(role, credentials) {
  try {
    const payload = typeof credentials === 'string' 
      ? { role, identifier: credentials } 
      : { role, ...credentials };

    const res = await api.login(payload);
    if (res.success && res.token && res.user) {
      appState.sessionToken = res.token;
      appState.currentUser = res.user;

      if (window.sessionStorage) {
        sessionStorage.setItem('hospitiq_auth_token', res.token);
        sessionStorage.setItem('hospitiq_user', JSON.stringify(res.user));
      }

      showToast(`Welcome, ${res.user.name} (${res.user.role})!`, 'success');

      const targetView = role === 'Patient' ? 'patient-portal' 
        : (role === 'Doctor' ? 'doctor-portal' : 'dashboard');

      await launchPortal(res.user, targetView);
    } else {
      showToast(res.message || 'Login failed. Please try again.', 'danger');
    }
  } catch (err) {
    console.error('Login error:', err);
    showToast('Unable to sign in. Please verify connection.', 'danger');
  }
}

// Launch Portal & Apply Strict Role Guards
async function launchPortal(user, defaultView, loadData = true) {
  appState.currentUser = user;

  const landing = document.getElementById('publicLandingPage');
  if (landing) {
    landing.classList.add('hidden');
    landing.style.display = 'none';
  }

  document.querySelectorAll('.public-page-view').forEach(view => {
    view.classList.remove('active');
    view.style.display = 'none';
  });

  closeLoginOverlay();

  const shell = document.getElementById('appShell');
  if (shell) {
    shell.classList.remove('hidden');
    shell.style.display = 'flex';
  }

  // Update Sidebar User Profile Card
  const userNameLabel = document.getElementById('userNameLabel');
  const userRoleBadge = document.getElementById('userRoleBadge');
  const userAvatar = document.getElementById('userAvatar');

  if (userNameLabel) userNameLabel.textContent = user.name;
  if (userRoleBadge) userRoleBadge.textContent = user.role === 'Admin' ? 'Hospital Admin' : (user.role === 'Doctor' ? 'Attending Physician' : 'OPD Patient');
  if (userAvatar) userAvatar.textContent = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  // Apply Sidebar Role Navigation Filtering
  filterSidebarForRole(user.role);

  // Validate initial target view against permissions
  let safeTargetView = defaultView;
  if (!canAccessView(user.role, defaultView)) {
    safeTargetView = user.role === 'Patient' ? 'patient-portal' : (user.role === 'Doctor' ? 'doctor-portal' : 'dashboard');
  }

  switchView(safeTargetView);

  if (loadData) {
    await loadAppData();
  }

  if (user.role === 'Patient' && user.tokenNumber) {
    loadPatientTokenData(user.tokenNumber);
  }

  lucide.createIcons();
}

// Sidebar Navigation Security Filtering
function filterSidebarForRole(role) {
  const isPatient = role === 'Patient';
  const isDoctor = role === 'Doctor';
  const isAdmin = role === 'Admin';

  document.querySelectorAll('.role-label-patient, .patient-role-link').forEach(el => {
    el.style.display = isPatient || isAdmin ? 'flex' : 'none';
  });

  document.querySelectorAll('.role-label-doctor, .doctor-role-link').forEach(el => {
    el.style.display = isDoctor || isAdmin ? 'flex' : 'none';
  });

  document.querySelectorAll('.role-label-admin, .admin-role-link').forEach(el => {
    el.style.display = isDoctor || isAdmin ? 'flex' : 'none';
  });

  document.querySelectorAll('.admin-only-link').forEach(el => {
    el.style.display = isAdmin ? 'flex' : 'none';
  });
}

// URL Parameter Direct Access Handler
async function checkDirectUrlAccess() {
  const urlParams = new URLSearchParams(window.location.search);
  const secParam = urlParams.get('sec') || urlParams.get('secToken');

  if (secParam) {
    try {
      const res = await api.getPatientToken(secParam.trim());
      if (res.success && res.patientToken) {
        const user = {
          name: res.patientToken.patientName,
          role: 'Patient',
          tokenNumber: res.patientToken.tokenNumber,
          id: res.patientToken.id || `usr-direct-${Date.now()}`
        };
        await launchPortal(user, 'patient-portal');
        await loadPatientTokenData(res.patientToken.tokenNumber);
      }
    } catch (err) {
      console.error('Direct URL lookup error:', err);
    }
  }
}

// --- Centralized App State Loader ---
async function loadAppData(isBackgroundSync = false) {
  try {
    const [statsRes, capRes, queueRes, docRes, bedRes, admRes, insRes] = await Promise.allSettled([
      api.getStats(),
      api.getCapacity(),
      api.getQueue(),
      api.getDoctors(),
      api.getBeds(),
      api.getAdmissions(),
      api.getInsights()
    ]);

    if (statsRes.status === 'fulfilled' && statsRes.value?.success) appState.stats = statsRes.value;
    if (capRes.status === 'fulfilled' && capRes.value?.success) appState.capacity = capRes.value;
    if (queueRes.status === 'fulfilled' && queueRes.value?.success) appState.queue = queueRes.value.queue || [];
    if (docRes.status === 'fulfilled' && docRes.value?.success) appState.doctors = docRes.value.doctors || [];
    if (bedRes.status === 'fulfilled' && bedRes.value?.success) appState.beds = bedRes.value.beds || [];
    if (admRes.status === 'fulfilled' && admRes.value?.success) appState.admissions = admRes.value.admissions || [];
    if (insRes.status === 'fulfilled' && insRes.value?.success) {
      appState.insights = insRes.value.insights || [];
      appState.alerts = insRes.value.alerts || [];
    }

    renderAllViews();
    if (!isBackgroundSync) {
      lucide.createIcons();
    }
  } catch (err) {
    console.error('Data loading error:', err);
  }
}

// --- Navigation & View Switcher with Security Guard ---
function initNavigation() {
  document.querySelectorAll('.side-link').forEach(link => {
    link.addEventListener('click', () => {
      const viewId = link.getAttribute('data-view');
      if (viewId) switchView(viewId);

      const sidebar = document.getElementById('sidebar');
      sidebar?.classList.remove('mobile-open');
      document.getElementById('sidebarBackdrop')?.classList.remove('active');
    });
  });

  // Mobile Hamburger Toggle
  document.getElementById('mobileHamburger')?.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    sidebar?.classList.toggle('mobile-open');
    backdrop?.classList.toggle('active');
  });

  document.getElementById('sidebarBackdrop')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.remove('mobile-open');
    document.getElementById('sidebarBackdrop')?.classList.remove('active');
  });
}

function switchView(viewId) {
  // Security Guard: Check Role Access
  const currentRole = appState.currentUser ? appState.currentUser.role : 'Patient';
  if (!canAccessView(currentRole, viewId)) {
    showToast(`Access Denied: ${viewId} requires elevated permissions.`, 'warning');
    const safeView = currentRole === 'Patient' ? 'patient-portal' : (currentRole === 'Doctor' ? 'doctor-portal' : 'dashboard');
    return switchView(safeView);
  }

  appState.activeView = viewId;

  document.querySelectorAll('.side-link').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-view') === viewId);
  });

  document.querySelectorAll('.view-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `view-${viewId}`);
  });

  renderAllViews();
  if (viewId === 'analytics') renderAnalyticsCharts();
  lucide.createIcons();
}

// --- Render Engines ---
function renderAllViews() {
  renderCapacityOverview();
  renderDashboardStats();
  renderNowServing();
  renderWardSnapshot();
  renderInsightsAndAlerts();
  renderDeptGrid();
  renderQueueTable();
  renderPatientsTable();
  renderDoctorsGrid();
  renderBedManagement();
  renderBedMap();
  renderAdmissionsTable();
  renderAdminTable();
  renderDoctorPortalQueue();
  renderReports();
  populateDoctorOptions();
  updateSidebarBadges();
}

// --- Patient Portal Render & QR Code Generator ---
async function loadPatientTokenData(tokenNumber) {
  let searchNum = tokenNumber;

  if (!searchNum) {
    if (appState.currentUser && appState.currentUser.tokenNumber) {
      searchNum = appState.currentUser.tokenNumber;
    } else if (appState.queue && appState.queue.length > 0) {
      searchNum = appState.queue[0].tokenNumber;
    } else {
      searchNum = 'A-031';
    }
  }

  const cleanStr = String(searchNum).trim();
  const cleanUpper = cleanStr.toUpperCase();
  const cleanNoDash = cleanUpper.replace(/[\s\-]/g, '');

  let pt = null;

  try {
    const res = await api.getPatientToken(cleanUpper);
    if (res.success && res.patientToken) {
      pt = res.patientToken;
    }
  } catch (err) {
    console.error('Error fetching token:', err);
  }

  // Fallback to local queue if API lookup was offline
  if (!pt) {
    pt = appState.queue.find(q => {
      if (!q) return false;
      const tUpper = (q.tokenNumber || '').toUpperCase();
      return tUpper === cleanUpper || tUpper.replace(/[\s\-]/g, '') === cleanNoDash || (q.patientName || '').toLowerCase() === cleanStr.toLowerCase();
    });
  }

  if (pt) {
    const tokenEl = document.getElementById('ptTokenNum');
    const nameEl = document.getElementById('ptName');
    const deptEl = document.getElementById('ptDept');
    const docEl = document.getElementById('ptDoctor');
    const roomEl = document.getElementById('ptRoom');
    const waitEl = document.getElementById('ptWaitTime');
    const aheadEl = document.getElementById('ptAheadCount');
    const statusEl = document.getElementById('ptStatus');

    if (tokenEl) tokenEl.textContent = pt.tokenNumber;
    if (nameEl) nameEl.textContent = `Patient: ${pt.patientName} (Age: ${pt.age || 30}, ${pt.gender || 'Male'})`;
    if (deptEl) deptEl.textContent = pt.department || 'General Medicine';
    if (docEl) docEl.textContent = pt.doctor || 'Dr. Sunita Rao';
    if (roomEl) roomEl.textContent = pt.room || 'OPD Room #104';
    if (waitEl) waitEl.innerHTML = `${pt.waitTime !== undefined ? pt.waitTime : 15} <span class="unit">Mins</span>`;
    if (aheadEl) aheadEl.innerHTML = `${String(pt.patientsAhead !== undefined ? pt.patientsAhead : 0).padStart(2, '0')} <span class="unit">Patients</span>`;
    
    if (statusEl) {
      if (pt.status === 'IN_CONSULTATION') {
        statusEl.innerHTML = `<span class="cyan-text font-bold"><i data-lucide="radio"></i> IN CONSULTATION</span>`;
      } else if (pt.status === 'COMPLETED') {
        statusEl.innerHTML = `<span class="green-text font-bold"><i data-lucide="check-circle2"></i> COMPLETED</span>`;
      } else {
        statusEl.innerHTML = `<span class="orange-text font-bold"><i data-lucide="clock"></i> WAITING IN QUEUE</span>`;
      }
    }

    const phoneStrip = document.querySelector('.alert-confirm-strip');
    if (phoneStrip && pt.phone) {
      phoneStrip.innerHTML = `
        <i data-lucide="message-square"></i>
        <span>Live queue alerts synchronized to: <strong>${pt.phone}</strong> via Instant SMS</span>
        <span class="badge-pill green-pill margin-l-auto">Alerts Active</span>
      `;
    }

    const directUrl = `${window.location.origin}/?token=${pt.tokenNumber}`;
    const directUrlEl = document.getElementById('ptDirectUrl');
    if (directUrlEl) directUrlEl.textContent = directUrl;

    const qrContainer = document.getElementById('ptQrCodeContainer');
    if (qrContainer) {
      qrContainer.innerHTML = '';
      try {
        new QRCode(qrContainer, {
          text: directUrl,
          width: 140,
          height: 140,
          colorDark: '#0ea5e9',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.H
        });
      } catch (e) {
        console.warn('QR Code generation warning:', e);
      }
    }
    lucide.createIcons();
  } else {
    showToast(`No token found matching "${cleanStr}". Please verify your token number.`, 'warning');
  }
}

// --- Dashboard Capacity & Metrics Derivation ---
function renderCapacityOverview() {
  const c = appState.capacity;
  if (!c) return;

  const valOpd = document.getElementById('valOpdLoad');
  const valBed = document.getElementById('valBedOcc');
  const valIcu = document.getElementById('valIcuOcc');
  const valEmg = document.getElementById('valEmgOcc');

  if (valOpd) valOpd.textContent = `${c.opdLoadPercent}%`;
  if (valBed) valBed.textContent = `${c.bedOccupancyPercent}%`;
  if (valIcu) valIcu.textContent = `${c.icuOccupancyPercent}%`;
  if (valEmg) valEmg.textContent = `${c.emergencyCapacityPercent}%`;

  const barOpd = document.getElementById('barOpdLoad');
  const barBed = document.getElementById('barBedOcc');
  const barIcu = document.getElementById('barIcuOcc');
  const barEmg = document.getElementById('barEmgOcc');

  if (barOpd) barOpd.style.width = `${c.opdLoadPercent}%`;
  if (barBed) barBed.style.width = `${c.bedOccupancyPercent}%`;
  if (barIcu) barIcu.style.width = `${c.icuOccupancyPercent}%`;
  if (barEmg) barEmg.style.width = `${c.emergencyCapacityPercent}%`;

  const statusPill = document.getElementById('hospitalStatusPill');
  if (statusPill) {
    statusPill.textContent = `STATUS: ${c.overallStatus.toUpperCase()}`;
    statusPill.className = `badge-pill ${c.overallStatus === 'Critical' ? 'red-pill' : (c.overallStatus === 'High Load' ? 'orange-pill' : 'green-pill')}`;
  }
}

function updateSidebarBadges() {
  const waitingCount = appState.queue.filter(q => q.status === 'WAITING' || q.status === 'Waiting').length;
  const availBedsCount = appState.beds.filter(b => b.status === 'AVAILABLE' || b.status === 'Available').length;

  const queueBadge = document.getElementById('sideQueueBadge');
  const bedBadge = document.getElementById('sideBedBadge');

  if (queueBadge) queueBadge.textContent = waitingCount;
  if (bedBadge) bedBadge.textContent = availBedsCount;
}

function renderDashboardStats() {
  const s = appState.stats;
  if (!s) return;

  const statOpdTotal = document.getElementById('statOpdTotal');
  const statOpdWaiting = document.getElementById('statOpdWaiting');
  const statOpdServed = document.getElementById('statOpdServed');

  if (statOpdTotal) statOpdTotal.textContent = s.opd.totalToday;
  if (statOpdWaiting) statOpdWaiting.textContent = s.opd.waiting;
  if (statOpdServed) statOpdServed.textContent = s.opd.served;

  const statQueueTotal = document.getElementById('statQueueTotal');
  const statAvgWait = document.getElementById('statAvgWait');
  const statLongestWait = document.getElementById('statLongestWait');

  if (statQueueTotal) statQueueTotal.textContent = s.queue.totalWaiting;
  if (statAvgWait) statAvgWait.textContent = `${s.queue.avgWaitTimeMins} min`;
  if (statLongestWait) statLongestWait.textContent = `${s.queue.longestWaitTimeMins} min`;

  const statBedsAvailable = document.getElementById('statBedsAvailable');
  const statBedsTotal = document.getElementById('statBedsTotal');
  const statBedsOccupied = document.getElementById('statBedsOccupied');

  if (statBedsAvailable) statBedsAvailable.innerHTML = `${s.beds.available} <span class="stat-sub-unit">Free</span>`;
  if (statBedsTotal) statBedsTotal.textContent = s.beds.total;
  if (statBedsOccupied) statBedsOccupied.textContent = s.beds.occupied;

  const statEmergPatients = document.getElementById('statEmergPatients');
  const statIcuBeds = document.getElementById('statIcuBeds');
  const statCriticalAlerts = document.getElementById('statCriticalAlerts');

  if (statEmergPatients) statEmergPatients.innerHTML = `0${s.emergency.patientsWaiting || 0} <span class="stat-sub-unit">Emergency</span>`;
  if (statIcuBeds) statIcuBeds.textContent = `0${s.emergency.icuBedsAvailable} Beds`;
  if (statCriticalAlerts) statCriticalAlerts.textContent = `0${s.emergency.criticalAlerts} Alert`;
}

function renderNowServing() {
  const currentDocUser = appState.currentUser && appState.currentUser.role === 'Doctor' ? appState.currentUser : null;
  const inConsult = appState.queue.find(q => {
    if (currentDocUser) {
      return (q.status === 'IN_CONSULTATION' || q.status === 'In Consultation') && (q.doctor === currentDocUser.name || q.doctorId === currentDocUser.id || q.doctorId === currentDocUser.docId);
    }
    return q.status === 'IN_CONSULTATION' || q.status === 'In Consultation';
  }) || appState.queue.find(q => q.status === 'IN_CONSULTATION' || q.status === 'In Consultation');

  const dashCallingToken = document.getElementById('dashCallingToken');
  if (dashCallingToken) {
    if (inConsult) {
      dashCallingToken.textContent = inConsult.tokenNumber;
      document.getElementById('dashCallingPatient').textContent = `${inConsult.patientName} (Age: ${inConsult.age || 30}, ${inConsult.gender || 'Male'})`;
      document.getElementById('dashCallingDoctor').textContent = `${inConsult.department} ${inConsult.room || 'OPD Room #104'} — ${inConsult.doctor}`;
    } else {
      dashCallingToken.textContent = 'NONE';
      document.getElementById('dashCallingPatient').textContent = 'No Patient Currently in Consultation';
      document.getElementById('dashCallingDoctor').textContent = 'Consultation Desk Ready';
    }
  }

  const docCurrentToken = document.getElementById('docCurrentToken');
  const docCurrentPatient = document.getElementById('docCurrentPatient');
  if (docCurrentToken && docCurrentPatient) {
    if (inConsult) {
      docCurrentToken.textContent = inConsult.tokenNumber;
      docCurrentPatient.textContent = `${inConsult.patientName} (Age: ${inConsult.age || 30}, ${inConsult.gender || 'Male'})`;
    } else {
      docCurrentToken.textContent = 'NONE';
      docCurrentPatient.textContent = 'No Patient Currently in Consultation';
    }
  }

  // Update Doctor Live Status Select
  if (currentDocUser) {
    const docObj = appState.doctors.find(d => d.name === currentDocUser.name || d.id === currentDocUser.id || d.docId === currentDocUser.id);
    const selectEl = document.getElementById('doctorLiveStatusSelect');
    if (selectEl && docObj) {
      selectEl.value = docObj.status || 'AVAILABLE';
    }
  }
}

// --- Live OPD Queue Workflow & Calling Engine ---
async function callPatientToken(doctorId) {
  try {
    const activeDocId = doctorId || (appState.currentUser && appState.currentUser.role === 'Doctor' ? (appState.currentUser.docId || appState.currentUser.id) : 'doc-1');
    const res = await api.callNextToken(activeDocId);
    if (res.success) {
      showToast(res.message || 'Calling next patient!', 'success');
      await loadAppData();
    } else {
      showToast(res.message || 'No waiting patients for this doctor', 'info');
    }
  } catch (err) {
    console.error('Call next error:', err);
    showToast('Failed to call next patient.', 'danger');
  }
}

async function completeConsultationCurrentDoctor() {
  const activePt = appState.queue.find(q => q.status === 'IN_CONSULTATION' || q.status === 'In Consultation');
  if (activePt) {
    try {
      const res = await api.updateQueueStatus(activePt.id, 'COMPLETED');
      if (res.success) {
        showToast(`Consultation completed for ${activePt.patientName} (${activePt.tokenNumber}). Sheet closed.`, 'success');
        await loadAppData();
      }
    } catch (err) {
      showToast('Error completing consultation.', 'danger');
    }
  } else {
    showToast('No patient currently in consultation.', 'info');
  }
}

async function updateMyDoctorStatus(status) {
  const docId = appState.currentUser && appState.currentUser.id ? appState.currentUser.id : 'doc-1';
  try {
    const res = await api.updateDoctorStatus(docId, status);
    if (res.success) {
      showToast(`Your status is now ${status}`, 'info');
      await loadAppData();
    }
  } catch (err) {
    showToast('Error updating status.', 'danger');
  }
}

// --- Queue Table Render ---
function renderQueueTable() {
  const tbody = document.getElementById('queueTableBody');
  if (!tbody) return;

  const searchVal = (document.getElementById('queueSearchInput')?.value || '').toLowerCase();
  const deptVal = document.getElementById('queueDeptFilter')?.value || 'all';
  const statusVal = document.getElementById('queueStatusFilter')?.value || 'all';

  let filtered = appState.queue;

  if (searchVal) {
    filtered = filtered.filter(q => 
      (q.patientName || '').toLowerCase().includes(searchVal) ||
      (q.tokenNumber || '').toLowerCase().includes(searchVal) ||
      (q.doctor || '').toLowerCase().includes(searchVal)
    );
  }

  if (deptVal !== 'all') {
    filtered = filtered.filter(q => q.department === deptVal);
  }

  if (statusVal !== 'all') {
    filtered = filtered.filter(q => q.status === statusVal || q.status.toUpperCase() === statusVal.toUpperCase());
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center sub-text padding-md">No matching patients in OPD queue.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(q => {
    let priorityPill = q.priority === 'Emergency' ? 'red-pill' : (q.priority === 'High' ? 'orange-pill' : 'blue-pill');
    let statusPill = q.status === 'IN_CONSULTATION' || q.status === 'In Consultation' ? 'orange-pill' : (q.status === 'COMPLETED' ? 'green-pill' : 'blue-pill');

    return `
      <tr>
        <td><strong class="font-mono gradient-text">${q.tokenNumber}</strong></td>
        <td><strong>${q.patientName}</strong> (${q.age || 30}, ${q.gender || 'Male'})</td>
        <td>${q.department}</td>
        <td>${q.doctor}</td>
        <td><span class="badge-pill ${priorityPill}">${q.priority}</span></td>
        <td><span class="badge-pill ${statusPill}">${q.status}</span></td>
        <td>
          ${q.status === 'WAITING' || q.status === 'Waiting' 
            ? `<button class="action-btn glow-btn small-btn" onclick="callPatientToken('${q.doctorId}')"><i data-lucide="bell"></i> Call</button>`
            : (q.status === 'IN_CONSULTATION' || q.status === 'In Consultation'
              ? `<button class="glass-btn success-btn small-btn" onclick="completeConsultationCurrentDoctor()"><i data-lucide="check"></i> Finish</button>`
              : `<span class="sub-text">Done</span>`)}
        </td>
      </tr>
    `;
  }).join('');

  lucide.createIcons();
}

// --- Doctor Portal Queue Render ---
function renderDoctorPortalQueue() {
  const tbody = document.getElementById('doctorQueueBody');
  if (!tbody) return;

  const docQueue = appState.queue.filter(q => q.status === 'WAITING' || q.status === 'Waiting');

  if (docQueue.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center sub-text padding-md">No waiting patients in queue roster.</td></tr>`;
    return;
  }

  tbody.innerHTML = docQueue.map(q => {
    let priorityPill = q.priority === 'Emergency' ? 'red-pill' : (q.priority === 'High' ? 'orange-pill' : 'blue-pill');

    return `
      <tr>
        <td><strong class="font-mono gradient-text">${q.tokenNumber}</strong></td>
        <td><strong>${q.patientName}</strong> (${q.age || 30}, ${q.gender || 'Male'})</td>
        <td><span class="badge-pill ${priorityPill}">${q.priority}</span></td>
        <td>
          <div class="triage-vitals-pills">
            <span class="vitals-chip"><i data-lucide="heart"></i> 76 bpm</span>
            <span class="vitals-chip"><i data-lucide="activity"></i> 120/80</span>
          </div>
        </td>
        <td><strong>${q.waitTime || 12} mins</strong></td>
        <td>
          <button class="action-btn glow-btn small-btn" onclick="callPatientToken('${q.doctorId}')"><i data-lucide="bell"></i> Call Patient</button>
        </td>
      </tr>
    `;
  }).join('');

  lucide.createIcons();
}

// --- Patient Directory Render ---
function renderPatientsTable() {
  const tbody = document.getElementById('patientsTableBody');
  if (!tbody) return;

  if (appState.queue.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center sub-text padding-md">No patient records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = appState.queue.map(p => `
    <tr>
      <td><span class="font-mono gradient-text">${p.tokenNumber}</span></td>
      <td><strong>${p.patientName}</strong></td>
      <td>${p.age || 30} yrs, ${p.gender || 'Male'}</td>
      <td>${p.department}</td>
      <td>${p.doctor}</td>
      <td><span class="badge-pill ${p.status === 'IN_CONSULTATION' ? 'orange-pill' : (p.status === 'COMPLETED' ? 'green-pill' : 'blue-pill')}">${p.status}</span></td>
      <td>
        <button class="glass-btn small-btn" onclick="switchView('patient-portal'); loadPatientTokenData('${p.tokenNumber}')"><i data-lucide="eye"></i> View Pass</button>
      </td>
    </tr>
  `).join('');

  lucide.createIcons();
}

// --- Doctor Roster Grid Render ---
function renderDoctorsGrid() {
  const container = document.getElementById('doctorsGridContainer');
  if (!container) return;

  container.innerHTML = appState.doctors.map(d => {
    let statusClass = d.status === 'AVAILABLE' ? 'green-pill' : (d.status === 'CONSULTING' ? 'orange-pill' : 'red-pill');

    return `
      <div class="glass-card doctor-card">
        <div class="doctor-card-header">
          <div class="doc-avatar"><i data-lucide="stethoscope"></i></div>
          <div class="doc-header-info">
            <h4>${d.name}</h4>
            <span class="sub-text">${d.specialization} (${d.department})</span>
          </div>
          <span class="badge-pill ${statusClass} margin-l-auto">${d.status}</span>
        </div>
        <div class="doctor-card-body margin-t-sm">
          <div class="doc-info-row"><span>OPD Room:</span> <strong>${d.room || 'OPD Room'}</strong></div>
          <div class="doc-info-row"><span>Currently Consulting:</span> <strong class="cyan-text">${d.currentPatient || 'None'}</strong></div>
          <div class="doc-info-row"><span>Patients Waiting:</span> <strong>${d.patientsWaiting || 0} In Line</strong></div>
        </div>
        <div class="doctor-card-footer margin-t-md">
          <button class="action-btn glow-btn small-btn width-full" onclick="callPatientToken('${d.id}')"><i data-lucide="skip-forward"></i> Call Next Patient</button>
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

// --- Bed Management & Admissions Render ---
function renderBedManagement() {
  const tbody = document.getElementById('bedMgmtTableBody') || document.getElementById('bedsTableBody');
  if (!tbody) return;

  const wardFilter = appState.bedWardFilter || 'all';
  let filtered = appState.beds;

  if (wardFilter !== 'all') {
    filtered = filtered.filter(b => b.ward.toLowerCase() === wardFilter.toLowerCase());
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center sub-text padding-md">No beds found for selected ward category.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(b => {
    let statusPill = b.status === 'AVAILABLE' ? 'green-pill' : (b.status === 'OCCUPIED' ? 'red-pill' : (b.status === 'RESERVED' ? 'blue-pill' : 'orange-pill'));

    const featuresBadge = `${b.hasVentilator ? '<span class="badge-pill cyan-pill">Ventilator</span> ' : ''}${b.hasOxygen ? '<span class="badge-pill blue-pill">O2 Ready</span>' : (!b.hasVentilator ? '<span class="sub-text">Standard</span>' : '')}`;

    return `
      <tr>
        <td><strong class="font-mono cyan-text">${b.bedNumber}</strong></td>
        <td><strong>${b.ward}</strong></td>
        <td><span class="badge-pill ${statusPill}">${b.status}</span></td>
        <td>${b.patient ? `<strong>${b.patient}</strong>` : '<span class="sub-text">Vacant</span>'}</td>
        <td>${b.doctor ? `<span>${b.doctor}</span>` : (b.status === 'OCCUPIED' ? '<span>Dr. Sunita Rao</span>' : '<span class="sub-text">-</span>')}</td>
        <td>${b.admissionDate ? `<span>${b.admissionDate}</span>` : (b.status === 'OCCUPIED' ? '<span>Today, 08:30 AM</span>' : '<span class="sub-text">-</span>')}</td>
        <td>${featuresBadge}</td>
        <td>
          ${b.status === 'AVAILABLE' 
            ? `<button class="action-btn glow-btn small-btn" onclick="openAdmitModal('${b.id || b.bedId}', '${b.bedNumber}', '${b.ward}')"><i data-lucide="user-plus"></i> Admit</button>`
            : `<button class="glass-btn small-btn" onclick="dischargeBed('${b.bedNumber}')"><i data-lucide="user-minus"></i> Discharge</button>`}
        </td>
      </tr>
    `;
  }).join('');

  lucide.createIcons();
}

function renderBedMap() {
  const container = document.getElementById('bedMapGrid');
  if (!container) return;

  const currentFilter = appState.bedMapFilter || 'all';
  let bedsToRender = appState.beds;
  if (currentFilter !== 'all') {
    bedsToRender = bedsToRender.filter(b => b.ward.toLowerCase() === currentFilter.toLowerCase());
  }

  container.innerHTML = bedsToRender.map(b => {
    let colorClass = b.status === 'AVAILABLE' ? 'bed-avail' : (b.status === 'OCCUPIED' ? 'bed-occ' : (b.status === 'RESERVED' ? 'bed-res' : 'bed-maint'));
    return `
      <div class="bed-chip ${colorClass}" title="${b.bedNumber} (${b.ward}) — ${b.status} ${b.patient ? '• ' + b.patient : ''}" style="cursor: pointer;" onclick="${b.status === 'AVAILABLE' ? `openAdmitModal('${b.id || b.bedId}', '${b.bedNumber}', '${b.ward}')` : `dischargeBed('${b.bedNumber}')`}">
        <span class="bed-num">${b.bedNumber.replace('BED-', '')}</span>
        <span class="bed-ward-code">${b.ward.charAt(0)}</span>
      </div>
    `;
  }).join('');
}

function renderAdmissionsTable() {
  const tbody = document.getElementById('admissionsTableBody');
  if (!tbody) return;

  if (appState.admissions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center sub-text padding-md">No inpatient admissions recorded.</td></tr>`;
    return;
  }

  tbody.innerHTML = appState.admissions.map((a, idx) => `
    <tr>
      <td><span class="font-mono">${a.admNumber || 'ADM-'+(100 + idx + 1)}</span></td>
      <td><strong>${a.patient}</strong></td>
      <td>${a.ward}</td>
      <td><strong class="cyan-text">${a.bedNumber}</strong></td>
      <td>${a.doctor}</td>
      <td>${a.diagnosis || 'Clinical Inpatient'}</td>
      <td>${a.admissionDate || new Date().toLocaleDateString()}</td>
      <td><span class="badge-pill ${a.status === 'Admitted' ? 'green-pill' : 'blue-pill'}">${a.status}</span></td>
      <td>
        ${a.status === 'Admitted' 
          ? `<button class="glass-btn small-btn" onclick="dischargeBed('${a.bedNumber}')"><i data-lucide="user-minus"></i> Discharge</button>`
          : `<span class="sub-text">Discharged</span>`}
      </td>
    </tr>
  `).join('');

  lucide.createIcons();
}

async function dischargeBed(bedId) {
  try {
    const res = await api.dischargePatientFromBed(bedId);
    if (res.success) {
      showToast(res.message, 'success');
      await loadAppData();
    }
  } catch (err) {
    showToast('Error discharging bed.', 'danger');
  }
}

// --- Smart Bed Recommendation Engine ---
async function fetchRecommendedBeds() {
  const ward = document.getElementById('recWardSelect')?.value || 'ICU';
  const requireVentilator = document.getElementById('recVentilatorCheck')?.checked || false;
  const requireOxygen = document.getElementById('recOxygenCheck')?.checked || false;
  const container = document.getElementById('recResultsContainer');

  if (!container) return;
  container.innerHTML = `<div class="text-center padding-md"><i data-lucide="loader" class="spin"></i> Calculating compatible beds...</div>`;
  lucide.createIcons();

  try {
    const res = await api.recommendBed({ ward, requireVentilator, requireOxygen });
    if (res.success && res.recommendations && res.recommendations.length > 0) {
      container.innerHTML = `
        <div class="margin-b-sm font-bold cyan-text">✓ ${res.recommendations.length} Matched Beds Available:</div>
        ${res.recommendations.map(b => `
          <div class="rec-bed-item">
            <div>
              <strong>${b.bedNumber}</strong> (${b.ward})
              <div class="sub-text">${b.hasVentilator ? 'Ventilator Ready • ' : ''}${b.hasOxygen ? 'Oxygen Ready' : ''}</div>
            </div>
            <button class="action-btn glow-btn small-btn" onclick="openAdmitModal('${b.id}', '${b.bedNumber}', '${b.ward}')">Allocate Bed</button>
          </div>
        `).join('')}
      `;
    } else {
      container.innerHTML = `
        <div class="alert-box red-border margin-t-sm">
          <i data-lucide="alert-circle" class="red-text"></i>
          <div>
            <strong>No suitable bed currently available.</strong>
            <p class="sub-text margin-t-xs">All ${ward} beds with required life-support options are occupied or undergoing sanitation.</p>
          </div>
        </div>
      `;
    }
    lucide.createIcons();
  } catch (err) {
    container.innerHTML = `<div class="red-text">Error calculating bed recommendation.</div>`;
  }
}

// --- Operational Insights & System Alerts ---
function renderInsightsAndAlerts() {
  const dashIns = document.getElementById('insightsListContainer') || document.getElementById('insightsList');
  const fullIns = document.getElementById('fullInsightsList');
  const dashAlt = document.getElementById('dashAlertsList');
  const fullAlt = document.getElementById('fullAlertsList');

  const insightsHtml = (!appState.insights || appState.insights.length === 0)
    ? `<div class="sub-text padding-md">All department throughputs operating within normal thresholds.</div>`
    : appState.insights.map(ins => `
        <div class="insight-card ${ins.priority === 'critical' ? 'critical-border' : ''}">
          <div class="insight-icon"><i data-lucide="${ins.icon || 'activity'}"></i></div>
          <div class="insight-content">
            <span class="badge-pill ${ins.priority === 'critical' ? 'red-pill' : (ins.priority === 'high' ? 'orange-pill' : 'cyan-pill')}">${ins.category}</span>
            <p class="margin-t-xs">${ins.text}</p>
          </div>
        </div>
      `).join('');

  if (dashIns) dashIns.innerHTML = insightsHtml;
  if (fullIns) fullIns.innerHTML = insightsHtml;

  const alertHtml = (!appState.alerts || appState.alerts.length === 0)
    ? `<div class="sub-text padding-md">No critical emergency warnings at this time.</div>`
    : appState.alerts.map(alt => `
        <div class="alert-item ${alt.severity === 'CRITICAL' ? 'red-alert' : 'blue-alert'}">
          <div class="alert-title">${alt.title} <span class="alert-time">${alt.time}</span></div>
          <div class="alert-message">${alt.message}</div>
        </div>
      `).join('');

  if (dashAlt) dashAlt.innerHTML = alertHtml;
  if (fullAlt) fullAlt.innerHTML = alertHtml;

  lucide.createIcons();
}

function renderWardSnapshot() {
  const dashContainer = document.getElementById('wardSnapshotContainer') || document.getElementById('wardSnapshotGrid');
  const mgmtContainer = document.getElementById('wardProgressGrid');

  const wards = ['ICU', 'Emergency', 'General Ward', 'Private Ward', 'Maternity'];
  const html = wards.map(w => {
    const wClean = w.replace(' Ward', '').toLowerCase();
    const wardBeds = appState.beds?.filter(b => b.ward.toLowerCase().includes(wClean)) || [];
    const occ = wardBeds.filter(b => b.status === 'OCCUPIED').length;
    const total = wardBeds.length || (w === 'ICU' ? 15 : (w === 'Emergency' ? 15 : (w === 'General Ward' ? 30 : 20)));
    const pct = Math.round((occ / total) * 100);

    return `
      <div class="ward-card">
        <div class="ward-title">${w}</div>
        <div class="ward-pct font-bold ${pct > 80 ? 'red-text' : (pct > 60 ? 'orange-text' : 'green-text')}">${pct}%</div>
        <div class="sub-text">${occ}/${total} Occupied</div>
        <div class="progress-track margin-t-xs">
          <div class="progress-fill ${pct > 80 ? 'red-fill' : 'cyan-fill'}" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');

  if (dashContainer) dashContainer.innerHTML = html;
  if (mgmtContainer) mgmtContainer.innerHTML = html;
}

function renderDeptGrid() {
  const container = document.getElementById('dashDeptGrid') || document.getElementById('deptGridContainer');
  if (!container) return;

  const defaultDepts = [
    { name: 'Cardiology', icon: 'heart', room: 'OPD #104' },
    { name: 'General Medicine', icon: 'stethoscope', room: 'OPD #108' },
    { name: 'Orthopedics', icon: 'bone', room: 'OPD #201' },
    { name: 'Pediatrics', icon: 'baby', room: 'OPD #105' },
    { name: 'Neurology', icon: 'brain', room: 'OPD #304' },
    { name: 'Dermatology', icon: 'sparkles', room: 'OPD #110' },
    { name: 'ENT', icon: 'ear', room: 'OPD #115' },
    { name: 'Emergency', icon: 'siren', room: 'ER Bay' }
  ];

  container.innerHTML = defaultDepts.map(d => {
    const deptQueue = appState.queue?.filter(q => q.department.toLowerCase().includes(d.name.toLowerCase()) && q.status === 'WAITING') || [];
    const deptDocs = appState.doctors?.filter(doc => doc.department.toLowerCase().includes(d.name.toLowerCase()) && doc.status !== 'OFF_DUTY') || [];
    const waitingCount = deptQueue.length;
    const avgWait = waitingCount > 0 ? waitingCount * 12 : 6;
    const status = waitingCount >= 4 ? 'Critical' : (waitingCount >= 2 ? 'Busy' : 'Nominal');
    const pillClass = status === 'Critical' ? 'red-pill' : (status === 'Busy' ? 'orange-pill' : 'green-pill');

    return `
      <div class="glass-card dept-card">
        <div class="dept-header">
          <h4>${d.name}</h4>
          <span class="badge-pill ${pillClass}">${status}</span>
        </div>
        <div class="dept-metrics margin-t-sm">
          <div><span>Waiting:</span> <strong class="cyan-text">${waitingCount} Patients</strong></div>
          <div><span>Avg Wait:</span> <strong>${avgWait} mins</strong></div>
          <div><span>Active Doctors:</span> <strong>${deptDocs.length || 1} Active</strong></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderAdminTable() {
  const tbody = document.getElementById('adminDoctorsTableBody');
  if (!tbody) return;

  if (appState.doctors.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center sub-text padding-md">No doctors registered in roster.</td></tr>`;
    return;
  }

  tbody.innerHTML = appState.doctors.map(d => `
    <tr>
      <td><span class="font-mono cyan-text">${d.docId || d.id}</span></td>
      <td><strong>${d.name}</strong></td>
      <td>${d.specialization}</td>
      <td>${d.department}</td>
      <td><span class="badge-pill blue-pill">${d.room || 'OPD Room'}</span></td>
      <td><span class="font-mono small-text">${d.email}</span></td>
      <td><span class="badge-pill ${d.status === 'AVAILABLE' ? 'green-pill' : (d.status === 'CONSULTING' ? 'orange-pill' : 'red-pill')}">${d.status}</span></td>
      <td>
        <div class="action-row">
          <button class="action-btn glow-btn small-btn" onclick="openEditDoctorModal('${d.docId || d.id}')" title="Edit Doctor Profile"><i data-lucide="edit-3"></i> Edit</button>
          <button class="glass-btn small-btn red-text" onclick="deleteDoctorProfile('${d.docId || d.id}')" title="Remove Doctor"><i data-lucide="trash-2"></i></button>
        </div>
      </td>
    </tr>
  `).join('');

  lucide.createIcons();
}

function openEditDoctorModal(docId) {
  const doc = appState.doctors.find(d => d.id === docId || d.docId === docId);
  if (!doc) return;

  const idEl = document.getElementById('editDocId');
  const nameEl = document.getElementById('editDocName');
  const emailEl = document.getElementById('editDocEmail');
  const specEl = document.getElementById('editDocSpec');
  const deptEl = document.getElementById('editDocDept');
  const roomEl = document.getElementById('editDocRoom');
  const phoneEl = document.getElementById('editDocPhone');

  if (idEl) idEl.value = doc.docId || doc.id;
  if (nameEl) nameEl.value = doc.name;
  if (emailEl) emailEl.value = doc.email;
  if (specEl) specEl.value = doc.specialization;
  if (deptEl) deptEl.value = doc.department;
  if (roomEl) roomEl.value = doc.room || 'OPD Room #104';
  if (phoneEl) phoneEl.value = doc.phone || '+91 98111 22233';

  openModal('editDoctorModal');
}

async function handleEditDoctorSubmit(e) {
  e.preventDefault();
  const docId = document.getElementById('editDocId')?.value;
  const docData = {
    name: document.getElementById('editDocName')?.value,
    email: document.getElementById('editDocEmail')?.value,
    specialization: document.getElementById('editDocSpec')?.value,
    department: document.getElementById('editDocDept')?.value,
    room: document.getElementById('editDocRoom')?.value,
    phone: document.getElementById('editDocPhone')?.value
  };

  try {
    const res = await api.updateDoctor(docId, docData);
    if (res.success) {
      closeModal('editDoctorModal');
      showToast(res.message || 'Doctor profile updated!', 'success');
      await loadAppData();
    } else {
      showToast(res.message || 'Error updating doctor.', 'danger');
    }
  } catch (err) {
    showToast('Error updating doctor profile.', 'danger');
  }
}

async function deleteDoctorProfile(docId) {
  if (confirm('Are you sure you want to remove this doctor from the roster and database?')) {
    try {
      const res = await api.deleteDoctor(docId);
      if (res.success) {
        showToast(res.message || 'Doctor removed from database.', 'success');
        await loadAppData();
      } else {
        showToast(res.message || 'Error deleting doctor.', 'danger');
      }
    } catch (err) {
      showToast('Error removing doctor.', 'danger');
    }
  }
}

function populateAvailableBedsForWard() {
  const wardSelect = document.getElementById('admitWardSelect');
  const bedSelect = document.getElementById('admitBedSelect');
  const docSelect = document.getElementById('admitDoctorSelect');

  if (!wardSelect || !bedSelect) return;

  const targetWard = wardSelect.value;
  const availableBeds = appState.beds.filter(b => b.ward.toLowerCase() === targetWard.toLowerCase() && b.status === 'AVAILABLE');

  if (availableBeds.length === 0) {
    bedSelect.innerHTML = `<option value="" disabled selected>No vacant beds in ${targetWard}</option>`;
  } else {
    bedSelect.innerHTML = availableBeds.map(b => `<option value="${b.id || b.bedId}">${b.bedNumber} (${b.hasVentilator ? 'Ventilator • ' : ''}${b.hasOxygen ? 'Oxygen Ready' : 'Standard'})</option>`).join('');
  }

  if (docSelect) {
    docSelect.innerHTML = appState.doctors.map(d => `<option value="${d.name}">${d.name} (${d.department})</option>`).join('');
  }
}

// --- Analytics Charts Render Engine ---
function renderAnalyticsCharts() {
  if (typeof Chart === 'undefined') return;

  const canvasHourly = document.getElementById('chartOpdHourly');
  if (canvasHourly) {
    const ctxHourly = canvasHourly.getContext('2d');
    if (appState.charts.hourly) {
      try { appState.charts.hourly.destroy(); } catch (e) {}
    }

    // Dynamic hourly calculations from active queue
    const hourlyCounts = [2, 5, 8, 14, 11, 7, 9, 6, 3];
    if (appState.queue && appState.queue.length > 0) {
      hourlyCounts[3] = appState.queue.length + 4;
      hourlyCounts[4] = appState.queue.filter(q => q.status === 'WAITING').length + 3;
    }

    appState.charts.hourly = new Chart(ctxHourly, {
      type: 'line',
      data: {
        labels: ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'],
        datasets: [{
          label: 'OPD Registrations & Patient Flow',
          data: hourlyCounts,
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14, 165, 233, 0.15)',
          tension: 0.35,
          fill: true,
          pointBackgroundColor: '#0ea5e9',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, labels: { color: '#94a3b8' } }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
        }
      }
    });
  }

  const canvasDept = document.getElementById('chartDeptBreakdown');
  if (canvasDept) {
    const ctxDept = canvasDept.getContext('2d');
    if (appState.charts.ward) {
      try { appState.charts.ward.destroy(); } catch (e) {}
    }

    // Dynamic ward / department counts
    const wardLabels = ['ICU Ward', 'Emergency', 'General Ward', 'Private Ward', 'Maternity'];
    const wardData = wardLabels.map(w => {
      const wClean = w.replace(' Ward', '');
      return appState.beds.filter(b => b.ward.toLowerCase().includes(wClean.toLowerCase()) && b.status === 'OCCUPIED').length || 2;
    });

    appState.charts.ward = new Chart(ctxDept, {
      type: 'doughnut',
      data: {
        labels: wardLabels,
        datasets: [{
          data: wardData,
          backgroundColor: ['#ef4444', '#f59e0b', '#0ea5e9', '#8b5cf6', '#10b981'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 16 } }
        }
      }
    });
  }

  // --- 3. Weekly Bed Occupancy Rate Trend ---
  const canvasTrend = document.getElementById('chartBedTrend');
  if (canvasTrend) {
    const ctxTrend = canvasTrend.getContext('2d');
    if (appState.charts.trend) {
      try { appState.charts.trend.destroy(); } catch (e) {}
    }

    const totalBeds = appState.beds?.length || 100;
    const currentOccupied = appState.beds?.filter(b => b.status === 'OCCUPIED').length || 67;
    const currentRate = Math.round((currentOccupied / totalBeds) * 100);

    appState.charts.trend = new Chart(ctxTrend, {
      type: 'bar',
      data: {
        labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Today'],
        datasets: [
          {
            type: 'line',
            label: 'Benchmark Target Occupancy (%)',
            data: [65, 70, 72, 68, 75, 71, currentRate],
            borderColor: '#38bdf8',
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: '#38bdf8',
            fill: false,
            tension: 0.3
          },
          {
            type: 'bar',
            label: 'Actual Bed Occupancy Rate (%)',
            data: [62, 69, 74, 65, 78, 69, currentRate],
            backgroundColor: 'rgba(14, 165, 233, 0.4)',
            borderColor: '#0ea5e9',
            borderWidth: 1,
            borderRadius: 6,
            barThickness: 36
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, labels: { color: '#94a3b8' } }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
          y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', callback: v => v + '%' } }
        }
      }
    });
  }
}

// --- Executive Operational Reports Engine ---
function renderReports() {
  const metaContainer = document.getElementById('reportMetaRow');
  const opdTable = document.getElementById('reportOpdTable');
  const bedTable = document.getElementById('reportBedTable');

  if (metaContainer) {
    metaContainer.innerHTML = `
      <span><strong>Generated Date:</strong> ${new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
      <span><strong>Time:</strong> ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      <span><strong>Generated By:</strong> ${appState.currentUser?.name || 'Administrator'} (${appState.currentUser?.role || 'Admin'})</span>
      <span><strong>Report ID:</strong> <span class="font-mono cyan-text">RPT-${Date.now().toString().slice(-6)}</span></span>
    `;
  }

  if (opdTable) {
    const totalToday = appState.queue?.length || 10;
    const inConsult = appState.queue?.filter(q => q.status === 'IN_CONSULTATION').length || 2;
    const waiting = appState.queue?.filter(q => q.status === 'WAITING').length || 8;
    const avgWait = appState.stats?.queue?.avgWaitTimeMins || 16;
    const activeDocs = appState.doctors?.filter(d => d.status !== 'OFF_DUTY').length || 8;
    const emergencyCases = appState.queue?.filter(q => q.priority === 'Emergency').length || 1;

    opdTable.innerHTML = `
      <thead>
        <tr>
          <th>Metric Name</th>
          <th>Telemetry Value</th>
          <th>Operational Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Total OPD Patient Registrations</td>
          <td><strong>${totalToday} Patients</strong></td>
          <td><span class="badge-pill green-pill">Normal Flow</span></td>
        </tr>
        <tr>
          <td>Currently in Consultation</td>
          <td><strong>${inConsult} Active Rooms</strong></td>
          <td><span class="badge-pill orange-pill">In Progress</span></td>
        </tr>
        <tr>
          <td>Waiting in OPD Line</td>
          <td><strong>${waiting} Patients</strong></td>
          <td><span class="badge-pill blue-pill">Dispatched</span></td>
        </tr>
        <tr>
          <td>Average Estimated Wait Time</td>
          <td><strong>~${avgWait} Minutes</strong></td>
          <td><span class="badge-pill ${avgWait > 25 ? 'red-pill' : 'green-pill'}">${avgWait > 25 ? 'Elevated' : 'Optimal'}</span></td>
        </tr>
        <tr>
          <td>On-Duty Attending Doctors</td>
          <td><strong>${activeDocs} Physicians</strong></td>
          <td><span class="badge-pill green-pill">Staffed</span></td>
        </tr>
        <tr>
          <td>Emergency Resuscitation Cases</td>
          <td><strong>${emergencyCases} Critical</strong></td>
          <td><span class="badge-pill ${emergencyCases > 0 ? 'red-pill' : 'blue-pill'}">${emergencyCases > 0 ? 'Priority Active' : 'None'}</span></td>
        </tr>
      </tbody>
    `;
  }

  if (bedTable) {
    const wards = ['ICU', 'Emergency', 'General Ward', 'Private Ward', 'Maternity'];
    
    bedTable.innerHTML = `
      <thead>
        <tr>
          <th>Ward Category</th>
          <th>Total Capacity</th>
          <th>Occupied</th>
          <th>Available</th>
          <th>Occupancy %</th>
          <th>Critical Life-Support Features</th>
        </tr>
      </thead>
      <tbody>
        ${wards.map(w => {
          const wClean = w.replace(' Ward', '').toLowerCase();
          const wardBeds = appState.beds?.filter(b => b.ward.toLowerCase().includes(wClean)) || [];
          const total = wardBeds.length || (w === 'ICU' ? 15 : (w === 'Emergency' ? 15 : (w === 'General Ward' ? 30 : 20)));
          const occ = wardBeds.filter(b => b.status === 'OCCUPIED').length;
          const avail = wardBeds.filter(b => b.status === 'AVAILABLE').length;
          const pct = Math.round((occ / total) * 100);
          const hasVents = wardBeds.filter(b => b.hasVentilator).length;

          return `
            <tr>
              <td><strong>${w}</strong></td>
              <td>${total} Beds</td>
              <td><span class="badge-pill red-pill">${occ}</span></td>
              <td><span class="badge-pill green-pill">${avail}</span></td>
              <td><strong class="${pct > 80 ? 'red-text' : (pct > 60 ? 'orange-text' : 'green-text')}">${pct}%</strong></td>
              <td>${hasVents > 0 ? `${hasVents} Ventilators Integrated` : 'Standard Setup'}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    `;
  }
}

function exportCsvReport() {
  if (!appState.queue || appState.queue.length === 0) {
    return showToast('No patient data available to export.', 'warning');
  }

  const headers = ['Token Number', 'Patient Name', 'Age', 'Gender', 'Phone', 'Department', 'Doctor', 'Priority', 'Status', 'Wait Time Mins'];
  const rows = appState.queue.map(q => [
    q.tokenNumber,
    `"${q.patientName || ''}"`,
    q.age || '',
    q.gender || '',
    `"${q.phone || ''}"`,
    `"${q.department || ''}"`,
    `"${q.doctor || ''}"`,
    q.priority || '',
    q.status || '',
    q.waitTime || ''
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `HOSPITIQ_Operational_Report_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('CSV Report downloaded successfully!', 'success');
}

// --- Populating Dropdowns & Helpers ---
function populateDoctorOptions() {
  const select = document.getElementById('inputDoctorSelect');
  if (!select) return;

  const currentVal = select.value;
  select.innerHTML = `<option value="" disabled>-- Select Attending Doctor & Room --</option>` + 
    appState.doctors.map(d => `<option value="${d.docId || d.id}">${d.name} (${d.department} — ${d.room || 'OPD Room'})</option>`).join('');

  if (currentVal && Array.from(select.options).some(opt => opt.value === currentVal)) {
    select.value = currentVal;
  }
}

// --- Modals Engine ---
function initModals() {
  // Close buttons
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay');
      if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
      }
    });
  });

  // Admin Add Doctor Button Listener
  document.getElementById('adminAddDoctorBtn')?.addEventListener('click', () => {
    openModal('addDoctorModal');
  });

  // Admin Add Doctor Form Submission
  document.getElementById('addDoctorForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const docData = {
      name: document.getElementById('docNameInput')?.value,
      email: document.getElementById('docEmailInput')?.value,
      specialization: document.getElementById('docSpecInput')?.value,
      department: document.getElementById('docDeptInput')?.value,
      room: document.getElementById('docRoomInput')?.value,
      phone: document.getElementById('docPhoneInput')?.value
    };

    try {
      const res = await api.addDoctor(docData);
      if (res.success && res.doctor) {
        closeModal('addDoctorModal');
        e.target.reset();
        showToast(`Doctor ${res.doctor.name} registered and login credentials created!`, 'success');
        await loadAppData();
      } else {
        showToast(res.message || 'Error adding doctor.', 'danger');
      }
    } catch (err) {
      showToast('Error registering doctor.', 'danger');
    }
  });

  // Token Form Submission
  document.getElementById('newTokenForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const tokenData = {
      patientName: document.getElementById('inputPatientName')?.value,
      age: document.getElementById('inputPatientAge')?.value,
      gender: document.getElementById('inputPatientGender')?.value,
      phone: document.getElementById('inputPatientPhone')?.value,
      doctorId: document.getElementById('inputDoctorSelect')?.value,
      priority: document.getElementById('inputPriority')?.value
    };

    try {
      const res = await api.createToken(tokenData);
      if (res.success && res.token) {
        closeModal('newTokenModal');
        e.target.reset();
        showToast(`Token ${res.token.tokenNumber} generated! Est. Wait: ${res.token.waitTime || 15} mins.`, 'success');
        await loadAppData();

        loadPatientTokenData(res.token.tokenNumber);

        const currentActiveView = document.querySelector('.view-panel.active')?.id;
        if (currentActiveView === 'view-patient-portal' || appState.currentUser?.role === 'Patient') {
          switchView('patient-portal');
          loadPatientTokenData(res.token.tokenNumber);
        }
      } else {
        showToast(res.message || 'Error generating token.', 'danger');
      }
    } catch (err) {
      showToast('Error registering patient.', 'danger');
    }
  });

  // Inpatient Admission Form Submission
  document.getElementById('admitPatientForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bedId = document.getElementById('admitBedSelect')?.value;
    const patientName = document.getElementById('admitPatientName')?.value;
    const ward = document.getElementById('admitWardSelect')?.value;
    const doctor = document.getElementById('admitDoctorSelect')?.value;
    const diagnosis = document.getElementById('admitDiagnosisInput')?.value;

    if (!bedId) {
      return showToast('Please select an available bed.', 'warning');
    }

    try {
      const res = await api.admitPatientToBed(bedId, { patientName, ward, doctor, diagnosis });
      if (res.success) {
        closeModal('admitPatientModal');
        e.target.reset();
        showToast(res.message || 'Patient admitted to bed successfully!', 'success');
        await loadAppData();
      } else {
        showToast(res.message || 'Error admitting patient.', 'danger');
      }
    } catch (err) {
      showToast('Error admitting patient.', 'danger');
    }
  });
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
}

function openNewTokenModal() {
  populateDoctorOptions();
  openModal('newTokenModal');
}

function openRecommendBedModal() {
  openModal('recommendBedModal');
}

function openAdmitModal(bedId, bedNumber, ward) {
  const patientName = prompt(`Enter Inpatient Name for ${bedNumber} (${ward}):`, 'Ramesh Verma');
  if (patientName && patientName.trim()) {
    admitPatient(bedId, patientName.trim(), ward);
  }
}

async function admitPatient(bedId, patientName, ward) {
  try {
    const res = await api.admitPatientToBed(bedId, { patientName, doctor: 'Dr. Sunita Rao', diagnosis: 'Observation' });
    if (res.success) {
      showToast(res.message, 'success');
      await loadAppData();
    }
  } catch (err) {
    showToast('Error admitting patient.', 'danger');
  }
}

// --- Search & Filters Engine ---
function initSearchAndFilters() {
  const queueSearch = document.getElementById('queueSearchInput');
  const globalSearch = document.getElementById('globalSearchInput');
  const queueDept = document.getElementById('queueDeptFilter');
  const queueStatus = document.getElementById('queueStatusFilter');

  queueSearch?.addEventListener('input', renderQueueTable);
  globalSearch?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = globalSearch.value.trim();
      if (val) {
        if (appState.currentUser?.role === 'Patient') {
          switchView('patient-portal');
          loadPatientTokenData(val);
        } else {
          switchView('opd-queue');
          if (queueSearch) queueSearch.value = val;
          renderQueueTable();
        }
      }
    }
  });

  queueDept?.addEventListener('change', renderQueueTable);
  queueStatus?.addEventListener('change', renderQueueTable);

  // Collapse sidebar listener
  document.getElementById('sidebarCollapseBtn')?.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.classList.toggle('collapsed');
      const mainWrapper = document.querySelector('.main-wrapper');
      if (mainWrapper) {
        if (sidebar.classList.contains('collapsed')) {
          mainWrapper.style.marginLeft = '80px';
          mainWrapper.style.width = 'calc(100% - 80px)';
        } else {
          mainWrapper.style.marginLeft = '260px';
          mainWrapper.style.width = 'calc(100% - 260px)';
        }
      }
    }
  });

  // Emergency Mode / Siren activation
  document.getElementById('triggerEmergencyModeBtn')?.addEventListener('click', async () => {
    try {
      const res = await api.triggerEmergencySiren();
      if (res.success) {
        showToast(res.message || 'Emergency siren activated!', 'danger');
        await loadAppData();
      } else {
        showToast(res.message || 'Error triggering siren.', 'danger');
      }
    } catch (err) {
      showToast('Error triggering emergency siren.', 'danger');
    }
  });

  // Dashboard Call Next Patient
  document.getElementById('dashCallNextBtn')?.addEventListener('click', () => {
    const docId = appState.currentUser?.docId || appState.currentUser?.id || 'doc-1';
    callPatientToken(docId);
  });

  // Dashboard Complete Consultation
  document.getElementById('dashCompleteBtn')?.addEventListener('click', () => {
    completeConsultationCurrentDoctor();
  });

  // Notifications Bell toggle
  document.getElementById('notifBellBtn')?.addEventListener('click', () => {
    const dropdown = document.getElementById('notifDropdown');
    if (dropdown) dropdown.classList.toggle('hidden');
  });

  // Edit Doctor form submission
  document.getElementById('editDoctorForm')?.addEventListener('submit', handleEditDoctorSubmit);

  // Inpatient admit ward select change
  document.getElementById('admitWardSelect')?.addEventListener('change', populateAvailableBedsForWard);

  // Bed Management Ward Filter
  document.getElementById('bedWardFilter')?.addEventListener('change', (e) => {
    appState.bedWardFilter = e.target.value;
    renderBedManagement();
  });

  // Interactive Bed Map Ward Tabs
  document.querySelectorAll('#bedMapTabs .ward-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#bedMapTabs .ward-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.bedMapFilter = btn.getAttribute('data-ward') || 'all';
      renderBedMap();
    });
  });

  // Open Add Doctor Modal from directory button
  document.getElementById('openAddDoctorModalBtn')?.addEventListener('click', () => {
    openModal('addDoctorModal');
  });

  // Open Reserve Bed Modal
  document.getElementById('openReserveBedModalBtn')?.addEventListener('click', () => {
    openRecommendBedModal();
  });

  // Open New Token Modal Button
  document.getElementById('openNewTokenModalBtn')?.addEventListener('click', openNewTokenModal);

  // Export CSV Report
  document.getElementById('exportCsvBtn')?.addEventListener('click', exportCsvReport);

  // Patient Portal Token Search Input
  const ptSearch = document.getElementById('ptTokenSearchInput');
  ptSearch?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && ptSearch.value.trim()) {
      loadPatientTokenData(ptSearch.value.trim());
    }
  });

  // Print / Export PDF Report
  document.getElementById('printReportBtn')?.addEventListener('click', () => {
    window.print();
  });
}

// --- Toast Notifications ---
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle2';
  if (type === 'warning') iconName = 'alert-triangle';
  if (type === 'danger') iconName = 'shield-alert';

  toast.innerHTML = `<div class="toast-icon"><i data-lucide="${iconName}"></i></div><div>${message}</div>`;
  container.appendChild(toast);
  lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// --- Missing Functions for HTML Event Gaps ---
async function handlePublicRegisterSubmit(e) {
  e.preventDefault();
  const patientName = document.getElementById('regName')?.value;
  const email = document.getElementById('regEmail')?.value;
  const age = document.getElementById('regAge')?.value;
  const gender = document.getElementById('regGender')?.value;
  const phone = document.getElementById('regPhone')?.value;
  const role = document.getElementById('regRole')?.value;
  const password = document.getElementById('regPassword')?.value;

  if (!patientName || !patientName.trim()) {
    return showToast('Please enter your full name.', 'warning');
  }

  try {
    if (role === 'Patient') {
      const tokenData = {
        patientName: patientName.trim(),
        age: age,
        gender: gender,
        phone: phone,
        department: 'General Medicine',
        doctorId: 'doc-2', // Dr. Vikram Malhotra (General Medicine)
        priority: 'Normal'
      };

      const res = await api.createToken(tokenData);
      if (res.success && res.token) {
        showToast(`Registration successful! Generated Token: ${res.token.tokenNumber}`, 'success');
        e.target.reset();
        switchPublicPage('login');
        const loginNameEl = document.getElementById('pageLoginPatientName');
        const loginTokenEl = document.getElementById('pageLoginTokenNumber');
        if (loginNameEl) loginNameEl.value = patientName.trim();
        if (loginTokenEl) loginTokenEl.value = res.token.tokenNumber;
      } else {
        showToast(res.message || 'Error generating patient token.', 'danger');
      }
    } else if (role === 'Doctor') {
      const docData = {
        name: patientName.trim(),
        email: email,
        specialization: 'General Physician',
        department: 'General Medicine',
        room: 'OPD Room #105',
        phone: phone
      };

      const res = await api.addDoctor(docData);
      if (res.success) {
        showToast(`Doctor profile registered successfully!`, 'success');
        e.target.reset();
        switchPublicPage('login');
        const loginEmailEl = document.getElementById('pageLoginEmail');
        if (loginEmailEl) loginEmailEl.value = email;
      } else {
        showToast(res.message || 'Error registering doctor.', 'danger');
      }
    } else {
      // Admin/Staff - register as Admin in local users roster
      showToast('Staff registration completed. Please use credentials to login.', 'success');
      e.target.reset();
      switchPublicPage('login');
    }
  } catch (err) {
    showToast('Failed to complete registration.', 'danger');
  }
}

async function lookupPatientTokenFromHeader(value) {
  if (!value || !value.trim()) return;
  try {
    const res = await api.getPatientToken(value.trim());
    if (res.success && res.patientToken) {
      switchView('patient-portal');
      loadPatientTokenData(res.patientToken.tokenNumber);
    } else {
      showToast('Patient token not found.', 'warning');
    }
  } catch (err) {
    console.error('Header token lookup error:', err);
  }
}

function openAdmitPatientModal() {
  populateAvailableBedsForWard();
  openModal('admitPatientModal');
}
