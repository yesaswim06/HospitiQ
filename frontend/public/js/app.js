/* ==========================================================================
   HOSPITIQ — HEALTHCARE COMMAND CENTER APPLICATION LOGIC (SIH 2026)
   ========================================================================== */

const DEFAULT_DOCTORS = [
  { id: 'doc-1', name: 'Dr. Sunita Rao', department: 'Cardiology', specialization: 'Interventional Cardiology', room: 'OPD Room #104', status: 'Busy', patientsWaiting: 2, currentPatient: 'A-024 (Ramesh Verma)', phone: '+91 98111 22233', email: 'doctor@hospitiq.org' },
  { id: 'doc-2', name: 'Dr. Vikram Malhotra', department: 'General Medicine', specialization: 'Internal Medicine', room: 'OPD Room #108', status: 'Available', patientsWaiting: 2, currentPatient: 'EM-501 (Sanjay Dutt)', phone: '+91 98222 33344', email: 'vikram@hospitiq.org' },
  { id: 'doc-3', name: 'Dr. Ananya Reddy', department: 'Orthopedics', specialization: 'Orthopedic Surgery', room: 'OPD Room #201', status: 'Available', patientsWaiting: 1, currentPatient: 'None', phone: '+91 98333 44455', email: 'ananya@hospitiq.org' },
  { id: 'doc-4', name: 'Dr. Hrishikesh Deshmukh', department: 'Pediatrics', specialization: 'Pediatric Care & Child Health', room: 'OPD Room #105', status: 'Available', patientsWaiting: 1, currentPatient: 'None', phone: '+91 98444 55566', email: 'hrishi@hospitiq.org' },
  { id: 'doc-5', name: 'Dr. Priya Patel', department: 'Neurology', specialization: 'Neurology & Stroke Triage', room: 'OPD Room #304', status: 'Available', patientsWaiting: 1, currentPatient: 'None', phone: '+91 98555 66677', email: 'priya@hospitiq.org' },
  { id: 'doc-6', name: 'Dr. Suresh Menon', department: 'Dermatology', specialization: 'Clinical Dermatology', room: 'OPD Room #110', status: 'Available', patientsWaiting: 1, currentPatient: 'None', phone: '+91 98666 77788', email: 'suresh@hospitiq.org' },
  { id: 'doc-7', name: 'Dr. Meera Nambiar', department: 'ENT', specialization: 'Otolaryngology (ENT)', room: 'OPD Room #115', status: 'Available', patientsWaiting: 1, currentPatient: 'None', phone: '+91 98777 88899', email: 'meera@hospitiq.org' },
  { id: 'doc-8', name: 'Dr. Rajesh Sharma', department: 'Cardiology', specialization: 'Cardiac Electrophysiology', room: 'OPD Room #102', status: 'Available', patientsWaiting: 0, currentPatient: 'None', phone: '+91 98888 99900', email: 'admin@hospitiq.org' }
];

const appState = {
  currentUser: null,
  activeView: 'dashboard',
  activePublicPage: 'home',
  theme: localStorage.getItem('hospitiq_theme') || 'dark',
  bedWardFilter: 'all',

  stats: null,
  capacity: null,
  queue: [],
  doctors: [...DEFAULT_DOCTORS],
  beds: [],
  departments: [],
  patients: [],
  admissions: [],
  insights: [],
  alerts: [],

  charts: {}
};

// --- DOM Initializer ---
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initClock();
  initLandingPage();
  initPublicRouting();
  initPublicScrollspy();
  initAuth();
  initNavigation();
  initMobileDrawer();
  initModals();
  initSearchAndFilters();
  initEmergencyMode();
  initExportHandlers();
  initNotifDropdown();

  checkDirectUrlAccess();
  lucide.createIcons();
});

// --- Public Page Navigation & Browser History (Forward / Backward) ---
function initPublicRouting() {
  window.addEventListener('popstate', (e) => {
    const hash = window.location.hash.replace('#', '') || 'home';
    switchPublicPage(hash, false);
  });

  const initialHash = window.location.hash.replace('#', '');
  if (initialHash) {
    switchPublicPage(initialHash, false);
  }
}

function initPublicScrollspy() {
  window.addEventListener('scroll', () => {
    const homeView = document.getElementById('public-view-home');
    if (!homeView || !homeView.classList.contains('active')) return;

    const scrollPos = window.scrollY + 200;

    const sections = [
      { id: 'heroSection', name: 'home' },
      { id: 'servicesSection', name: 'services' },
      { id: 'featuresSection', name: 'features' },
      { id: 'footerSection', name: 'contact' }
    ];

    let currentSection = 'home';
    for (let sec of sections) {
      const el = document.getElementById(sec.id);
      if (el) {
        const top = el.offsetTop;
        const height = el.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          currentSection = sec.name;
        }
      }
    }

    document.querySelectorAll('.landing-nav-item').forEach(item => {
      const href = item.getAttribute('href')?.replace('#', '');
      item.classList.toggle('active', href === currentSection);
    });
  });
}

function switchPublicPage(pageName, pushHistory = true) {
  appState.activePublicPage = pageName;

  document.querySelectorAll('.public-page-view').forEach(view => {
    view.classList.remove('active');
    view.style.display = '';
  });

  if (pageName === 'about') {
    const el = document.getElementById('public-view-about');
    if (el) { el.classList.add('active'); el.style.display = 'block'; }
    if (pushHistory && window.location.hash !== '#about') {
      window.history.pushState({ page: 'about' }, 'HOSPITIQ', '#about');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (pageName === 'login') {
    const el = document.getElementById('public-view-login');
    if (el) { el.classList.add('active'); el.style.display = 'block'; }
    if (pushHistory && window.location.hash !== '#login') {
      window.history.pushState({ page: 'login' }, 'HOSPITIQ', '#login');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (pageName === 'register') {
    const el = document.getElementById('public-view-register');
    if (el) { el.classList.add('active'); el.style.display = 'block'; }
    if (pushHistory && window.location.hash !== '#register') {
      window.history.pushState({ page: 'register' }, 'HOSPITIQ', '#register');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    const el = document.getElementById('public-view-home');
    if (el) { el.classList.add('active'); el.style.display = 'block'; }
    if (pushHistory && window.location.hash !== '#home' && window.location.hash !== '') {
      window.history.pushState({ page: 'home' }, 'HOSPITIQ', '#home');
    }

    if (pageName === 'home') window.scrollTo({ top: 0, behavior: 'smooth' });
    if (pageName === 'services') document.getElementById('servicesSection')?.scrollIntoView({ behavior: 'smooth' });
    if (pageName === 'features') document.getElementById('featuresSection')?.scrollIntoView({ behavior: 'smooth' });
    if (pageName === 'contact') document.getElementById('footerSection')?.scrollIntoView({ behavior: 'smooth' });
  }

  document.querySelectorAll('.landing-nav-item').forEach(item => {
    const href = item.getAttribute('href')?.replace('#', '');
    item.classList.toggle('active', href === pageName);
  });

  lucide.createIcons();
}

async function handlePublicRegisterSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('regName')?.value || 'New User';
  const email = document.getElementById('regEmail')?.value || 'user@hospitiq.org';
  const role = document.getElementById('regRole')?.value || 'Patient';

  showToast(`Account registered successfully for ${name}!`, 'success');

  const user = { name, email, role, id: `usr-reg-${Date.now()}` };
  const targetView = role === 'Patient' ? 'patient-portal' : (role === 'Doctor' ? 'doctor-portal' : 'dashboard');
  launchPortal(user, targetView);
}

async function handlePublicPageLogin(e) {
  e.preventDefault();
  const emailEl = document.getElementById('pageLoginEmail');
  const email = emailEl ? emailEl.value : 'admin@hospitiq.org';
  const tokenNum = document.getElementById('pageLoginTokenNumber')?.value || 'A-031';
  const activeChip = document.querySelector('#public-view-login .demo-chip.active');
  const role = activeChip ? activeChip.getAttribute('data-role') : 'Admin';

  const user = { 
    name: role === 'Patient' ? 'Ramesh Verma' : (role === 'Doctor' ? 'Dr. Sunita Rao' : 'Dr. Rajesh Sharma'), 
    role, 
    tokenNumber: tokenNum 
  };
  const targetView = role === 'Patient' ? 'patient-portal' : (role === 'Doctor' ? 'doctor-portal' : 'dashboard');
  launchPortal(user, targetView);
}

// --- URL Parameter Direct Access ---
async function checkDirectUrlAccess() {
  const urlParams = new URLSearchParams(window.location.search);
  const tokenParam = urlParams.get('token') || urlParams.get('t');
  const roleParam = urlParams.get('role');

  if (tokenParam) {
    const user = { id: 'usr-pt', name: 'Ramesh Verma', role: 'Patient', tokenNumber: tokenParam };
    launchPortal(user, 'patient-portal');
    await loadPatientTokenData(tokenParam);
  } else if (roleParam) {
    const roleName = roleParam.charAt(0).toUpperCase() + roleParam.slice(1);
    const defaultView = roleName === 'Patient' ? 'patient-portal' : (roleName === 'Doctor' ? 'doctor-portal' : 'dashboard');
    launchPortal({ id: 'usr-direct', name: `Demo ${roleName}`, role: roleName }, defaultView);
  }
}

// --- Theme Switcher & Minimal Mode ---
function initTheme() {
  setTheme(appState.theme);
  const themeBtn = document.getElementById('themeToggleBtn');
  const landingThemeBtn = document.getElementById('landingThemeBtn');

  const toggle = () => {
    const nextTheme = appState.theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  themeBtn?.addEventListener('click', toggle);
  landingThemeBtn?.addEventListener('click', toggle);
}

function toggleAppTheme() {
  const nextTheme = appState.theme === 'dark' ? 'light' : 'dark';
  setTheme(nextTheme);
  showToast(`Switched theme to ${nextTheme.toUpperCase()}`, 'info');
}

function setTheme(theme) {
  appState.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('hospitiq_theme', theme);

  const themeIcon = document.getElementById('themeIcon');
  const landingThemeIcon = document.getElementById('landingThemeIcon');
  const themeLabelText = document.getElementById('themeLabelText');

  if (theme === 'light') {
    themeIcon?.setAttribute('data-lucide', 'sun');
    landingThemeIcon?.setAttribute('data-lucide', 'sun');
    if (themeLabelText) themeLabelText.textContent = 'Light';
  } else {
    themeIcon?.setAttribute('data-lucide', 'moon');
    landingThemeIcon?.setAttribute('data-lucide', 'moon');
    if (themeLabelText) themeLabelText.textContent = 'Dark';
  }

  lucide.createIcons();
}

// --- Live Clock ---
function initClock() {
  const clockEl = document.getElementById('liveTimeClock');
  function update() {
    const now = new Date();
    if (clockEl) clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  update();
  setInterval(update, 1000);
}

// --- Landing Page Controls & Dynamic Quote ---
function initLandingPage() {
  const quotes = [
    '"Smarter Queues. Better Care." — HOSPITIQ SIH 2026 Operational Vision',
    '"Connecting Patient OPD Registration, Queue Dispatching & Available Beds in Real Time"',
    '"Reducing OPD Waiting Times by 40% across Hospital Facilities in India"',
    '"Bridging Patients and Lifesaving Care with Zero Waiting Chaos"',
    '"Empowering Doctors & Administrators with AI-Driven Hospital Intelligence"'
  ];

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  const tickerEl = document.getElementById('quoteTickerText');
  if (tickerEl) tickerEl.textContent = randomQuote;
}

function openLoginOverlay() {
  const loginScreen = document.getElementById('loginScreen');
  if (loginScreen) {
    loginScreen.classList.add('active');
    loginScreen.style.display = 'flex';
  }
}

function closeLoginOverlay() {
  const loginScreen = document.getElementById('loginScreen');
  if (loginScreen) {
    loginScreen.classList.remove('active');
    loginScreen.style.display = 'none';
  }
}

function openPublicTokenModal() {
  openNewTokenModal();
}

// --- Notification Dropdown Toggle ---
function initNotifDropdown() {
  const bellBtn = document.getElementById('notifBellBtn');
  const dropdown = document.getElementById('notifDropdown');
  const clearBtn = document.getElementById('clearNotifBtn');

  bellBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown?.classList.toggle('hidden');
  });

  clearBtn?.addEventListener('click', () => {
    appState.alerts.forEach(a => a.resolved = true);
    renderInsightsAndAlerts();
    dropdown?.classList.add('hidden');
    showToast('Notifications cleared', 'info');
  });

  document.addEventListener('click', (e) => {
    if (dropdown && !dropdown.contains(e.target) && !bellBtn.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  });
}

// --- Authentication & 3 Role Handling ---
function initAuth() {
  const loginForm = document.getElementById('loginForm');

  document.querySelectorAll('.demo-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      const parentForm = chip.closest('.glass-card') || document;
      parentForm.querySelectorAll('.demo-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const role = chip.getAttribute('data-role');
      const emailEl = parentForm.querySelector('#loginEmail, #pageLoginEmail') || document.getElementById('loginEmail') || document.getElementById('pageLoginEmail');
      const tokenGroup = parentForm.querySelector('#loginTokenGroup, #pageLoginTokenGroup') || document.getElementById('loginTokenGroup') || document.getElementById('pageLoginTokenGroup');

      if (emailEl) {
        if (role === 'Patient') emailEl.value = 'patient@hospitiq.org';
        else if (role === 'Doctor') emailEl.value = 'doctor@hospitiq.org';
        else emailEl.value = 'admin@hospitiq.org';
      }
      if (tokenGroup) {
        tokenGroup.style.display = role === 'Patient' ? 'block' : 'none';
      }
    });
  });

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailEl = document.getElementById('loginEmail');
    const email = emailEl ? emailEl.value : 'admin@hospitiq.org';
    const tokenNum = document.getElementById('loginTokenNumber')?.value || 'A-031';
    const activeChip = loginForm.querySelector('.demo-chip.active');
    const role = activeChip ? activeChip.getAttribute('data-role') : 'Admin';

    const user = { 
      name: role === 'Patient' ? 'Ramesh Verma' : (role === 'Doctor' ? 'Dr. Sunita Rao' : 'Dr. Rajesh Sharma'), 
      role, 
      tokenNumber: tokenNum 
    };
    const targetView = role === 'Patient' ? 'patient-portal' : (role === 'Doctor' ? 'doctor-portal' : 'dashboard');
    launchPortal(user, targetView);
  });

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    appState.currentUser = null;
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

function launchPortal(user, defaultView) {
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

  applyRolePermissions(user);
  loadAppData();
  switchView(defaultView);
  showToast(`Welcome to HOSPITIQ ${user.role} Portal!`, 'success');
  lucide.createIcons();
}

function applyRolePermissions(user) {
  document.getElementById('userNameLabel').textContent = user.name;
  document.getElementById('userRoleBadge').textContent = user.role;
  document.getElementById('userAvatar').textContent = user.name.charAt(0);
  const greetingEl = document.getElementById('dashGreetingTitle');
  if (greetingEl) greetingEl.textContent = `Good Morning, ${user.name.split(' ')[1] || user.name}`;

  const isPatient = user.role === 'Patient';
  const isDoctor = user.role === 'Doctor';
  const isAdmin = user.role === 'Admin' || user.role === 'Hospital Management';

  document.querySelectorAll('.role-label-patient, .patient-role-link').forEach(el => el.style.display = isPatient || isAdmin ? '' : 'none');
  document.querySelectorAll('.role-label-doctor, .doctor-role-link').forEach(el => el.style.display = isDoctor || isAdmin ? '' : 'none');
  document.querySelectorAll('.role-label-admin, .admin-role-link').forEach(el => el.style.display = isAdmin ? '' : 'none');
  document.querySelectorAll('.admin-only-link, .admin-only-btn').forEach(el => el.style.display = isAdmin ? '' : 'none');
}

// --- Doctor Status Update Handler ---
async function updateMyDoctorStatus(status) {
  const docId = appState.currentUser?.id || 'doc-1';
  const res = await api.updateDoctorStatus(docId, status);
  if (res.success) {
    showToast(`Doctor status updated to ${status}`, 'success');
    await loadAppData();
  }
}

// --- Mobile Drawer Handlers ---
function initMobileDrawer() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  const hamburger = document.getElementById('mobileHamburger');

  const openDrawer = () => {
    sidebar.classList.add('mobile-open');
    backdrop.classList.add('active');
  };

  const closeDrawer = () => {
    sidebar.classList.remove('mobile-open');
    backdrop.classList.remove('active');
  };

  hamburger?.addEventListener('click', openDrawer);
  backdrop?.addEventListener('click', closeDrawer);
}

function saveCustomDoctorLocally(doc) {
  try {
    const existing = JSON.parse(localStorage.getItem('hospitiq_custom_doctors') || '[]');
    if (!existing.some(d => d.id === doc.id || (d.email && doc.email && d.email === doc.email))) {
      existing.unshift(doc);
      localStorage.setItem('hospitiq_custom_doctors', JSON.stringify(existing));
    }
  } catch (e) {
    console.error('Error saving doctor locally:', e);
  }
}

function getCustomDoctorsLocally() {
  try {
    return JSON.parse(localStorage.getItem('hospitiq_custom_doctors') || '[]');
  } catch (e) {
    return [];
  }
}

function saveCustomTokenLocally(token) {
  try {
    const existing = JSON.parse(localStorage.getItem('hospitiq_custom_tokens') || '[]');
    if (!existing.some(t => t.id === token.id || t.tokenNumber === token.tokenNumber)) {
      existing.unshift(token);
      localStorage.setItem('hospitiq_custom_tokens', JSON.stringify(existing));
    }
  } catch (e) {
    console.error('Error saving token locally:', e);
  }
}

function getCustomTokensLocally() {
  try {
    return JSON.parse(localStorage.getItem('hospitiq_custom_tokens') || '[]');
  } catch (e) {
    return [];
  }
}

// --- Data Fetching & Sync ---
async function loadAppData() {
  try {
    const [statsRes, capacityRes, queueRes, docsRes, bedsRes, deptsRes, patientsRes, insightsRes] = await Promise.all([
      api.getStats(),
      api.getCapacity(),
      api.getQueue(),
      api.getDoctors(),
      api.getBeds(),
      api.getDepartments(),
      api.getPatients(),
      api.getInsights()
    ]);

    if (statsRes.success) appState.stats = statsRes;
    if (capacityRes.success) appState.capacity = capacityRes;
    if (queueRes.success) appState.queue = queueRes.queue;
    if (docsRes.success && Array.isArray(docsRes.doctors) && docsRes.doctors.length > 0) {
      appState.doctors = docsRes.doctors;
    } else if (!appState.doctors || appState.doctors.length === 0) {
      appState.doctors = [...DEFAULT_DOCTORS];
    }

    // Merge locally saved doctors
    const customDocs = getCustomDoctorsLocally();
    customDocs.forEach(cd => {
      if (!appState.doctors.some(d => d.id === cd.id || (d.email && cd.email && d.email === cd.email))) {
        appState.doctors.unshift(cd);
      }
    });

    // Merge locally saved tokens
    const customTokens = getCustomTokensLocally();
    customTokens.forEach(ct => {
      if (!appState.queue.some(q => q.id === ct.id || q.tokenNumber === ct.tokenNumber)) {
        appState.queue.unshift(ct);
      }
    });

    if (bedsRes.success) appState.beds = bedsRes.beds;
    if (deptsRes.success) appState.departments = deptsRes.departments;
    if (patientsRes.success) appState.patients = patientsRes.patients;
    if (insightsRes.success) {
      appState.insights = insightsRes.insights;
      appState.alerts = insightsRes.alerts;
    }

    renderAllViews();

    if (appState.currentUser && appState.currentUser.tokenNumber) {
      await loadPatientTokenData(appState.currentUser.tokenNumber);
    }
  } catch (err) {
    console.error('Error loading HOSPITIQ data:', err);
  }
}

// --- Navigation ---
function initNavigation() {
  const sidebar = document.getElementById('sidebar');
  const collapseBtn = document.getElementById('sidebarCollapseBtn');

  collapseBtn?.addEventListener('click', () => sidebar.classList.toggle('collapsed'));

  document.querySelectorAll('.side-link').forEach(btn => {
    btn.addEventListener('click', () => {
      switchView(btn.getAttribute('data-view'));
      sidebar.classList.remove('mobile-open');
      document.getElementById('sidebarBackdrop')?.classList.remove('active');
    });
  });
}

function switchView(viewId) {
  appState.activeView = viewId;

  document.querySelectorAll('.side-link').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-view') === viewId);
  });

  document.querySelectorAll('.view-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `view-${viewId}`);
  });

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
  populateDoctorOptions();
  updateSidebarBadges();
}

// --- Patient Portal Render & QR Code Generator ---
async function loadPatientTokenData(tokenNumber) {
  try {
    const res = await api.getPatientToken(tokenNumber);
    if (res.success) {
      const pt = res.patientToken;
      document.getElementById('ptTokenNum').textContent = pt.tokenNumber;
      document.getElementById('ptName').textContent = `Patient: ${pt.patientName} (Age: ${pt.age}, ${pt.gender})`;
      document.getElementById('ptDept').textContent = pt.department;
      document.getElementById('ptDoctor').textContent = pt.doctor;
      document.getElementById('ptRoom').textContent = pt.room || 'OPD Room #104';
      document.getElementById('ptWaitTime').innerHTML = `${pt.waitTime} <span class="unit">Mins</span>`;
      document.getElementById('ptAheadCount').innerHTML = `0${pt.patientsAhead || 3} <span class="unit">Patients</span>`;
      document.getElementById('ptStatus').textContent = pt.status;

      const directUrl = `${window.location.origin}/?token=${pt.tokenNumber}`;
      document.getElementById('ptDirectUrl').textContent = directUrl;

      const qrContainer = document.getElementById('ptQrCodeContainer');
      if (qrContainer) {
        qrContainer.innerHTML = '';
        new QRCode(qrContainer, {
          text: directUrl,
          width: 140,
          height: 140,
          colorDark: '#0ea5e9',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.H
        });
      }
    }
  } catch (err) {
    console.error('Error loading patient token:', err);
  }
}

// --- Admissions Table Render ---
function renderAdmissionsTable() {
  const tbody = document.getElementById('admissionsTableBody');
  if (!tbody) return;

  const admittedBeds = appState.beds.filter(b => b.status === 'Occupied');

  tbody.innerHTML = admittedBeds.map((b, idx) => `
    <tr>
      <td><span class="font-mono">ADM-10${idx + 1}</span></td>
      <td><strong>${b.patient || 'Ramesh Verma'}</strong></td>
      <td>${b.ward}</td>
      <td><strong class="font-mono cyan-text">${b.bedNumber}</strong></td>
      <td>${b.doctor || 'Dr. S. Sharma'}</td>
      <td>Acute Observation / Cardiac Monitoring</td>
      <td>${b.admissionDate || '2026-08-19'}</td>
      <td><span class="badge-pill green-pill">Admitted</span></td>
      <td>
        <button class="glass-btn small-btn danger-btn" onclick="triggerDischargeWorkflow('${b.id}')"><i data-lucide="log-out"></i> Discharge</button>
      </td>
    </tr>
  `).join('');

  lucide.createIcons();
}

// --- Doctor Portal Render ---
function renderDoctorPortalQueue() {
  const tbody = document.getElementById('doctorQueueBody');
  if (!tbody) return;

  const docQueue = appState.queue.filter(q => q.status === 'Waiting');

  tbody.innerHTML = docQueue.map(q => {
    let priorityPill = q.priority === 'Emergency' ? 'red-pill' : (q.priority === 'High' ? 'orange-pill' : 'blue-pill');

    return `
      <tr>
        <td><strong class="font-mono gradient-text">${q.tokenNumber}</strong></td>
        <td><strong>${q.patientName}</strong> (${q.age}, ${q.gender})</td>
        <td><span class="badge-pill ${priorityPill}">${q.priority}</span></td>
        <td>
          <div class="triage-vitals-pills">
            <span class="vitals-chip"><i data-lucide="heart"></i> 76 bpm</span>
            <span class="vitals-chip"><i data-lucide="activity"></i> 120/80</span>
          </div>
        </td>
        <td><strong>${q.waitTime} mins</strong></td>
        <td>
          <button class="action-btn glow-btn small-btn" onclick="callPatientToken('${q.doctorId}')"><i data-lucide="bell"></i> Call Patient</button>
        </td>
      </tr>
    `;
  }).join('');

  lucide.createIcons();
}

function renderCapacityOverview() {
  const c = appState.capacity;
  if (!c) return;

  document.getElementById('valOpdLoad').textContent = `${c.opdLoadPercent}%`;
  document.getElementById('valBedOcc').textContent = `${c.bedOccupancyPercent}%`;
  document.getElementById('valIcuOcc').textContent = `${c.icuOccupancyPercent}%`;
  document.getElementById('valEmgOcc').textContent = `${c.emergencyCapacityPercent}%`;

  document.getElementById('barOpdLoad').style.width = `${c.opdLoadPercent}%`;
  document.getElementById('barBedOcc').style.width = `${c.bedOccupancyPercent}%`;
  document.getElementById('barIcuOcc').style.width = `${c.icuOccupancyPercent}%`;
  document.getElementById('barEmgOcc').style.width = `${c.emergencyCapacityPercent}%`;

  const statusPill = document.getElementById('hospitalStatusPill');
  if (statusPill) {
    statusPill.textContent = `STATUS: ${c.overallStatus.toUpperCase()}`;
    statusPill.className = `badge-pill ${c.overallStatus === 'Critical' ? 'red-pill' : (c.overallStatus === 'High Load' ? 'orange-pill' : 'green-pill')}`;
  }
}

function updateSidebarBadges() {
  const waitingCount = appState.queue.filter(q => q.status === 'Waiting').length;
  const availBedsCount = appState.beds.filter(b => b.status === 'Available').length;

  const queueBadge = document.getElementById('sideQueueBadge');
  const bedBadge = document.getElementById('sideBedBadge');

  if (queueBadge) queueBadge.textContent = waitingCount;
  if (bedBadge) bedBadge.textContent = availBedsCount;
}

function renderDashboardStats() {
  const s = appState.stats;
  if (!s) return;

  document.getElementById('statOpdTotal').textContent = s.opd.totalToday;
  document.getElementById('statOpdWaiting').textContent = s.opd.waiting;
  document.getElementById('statOpdServed').textContent = s.opd.served;

  document.getElementById('statQueueTotal').textContent = s.queue.totalWaiting;
  document.getElementById('statAvgWait').textContent = `${s.queue.avgWaitTimeMins} min`;
  document.getElementById('statLongestWait').textContent = `${s.queue.longestWaitTimeMins} min`;

  document.getElementById('statBedsAvailable').innerHTML = `${s.beds.available} <span class="stat-sub-unit">Free</span>`;
  document.getElementById('statBedsTotal').textContent = s.beds.total;
  document.getElementById('statBedsOccupied').textContent = s.beds.occupied;

  document.getElementById('statEmergPatients').innerHTML = `0${s.emergency.patients} <span class="stat-sub-unit">Emergency</span>`;
  document.getElementById('statIcuBeds').textContent = `0${s.emergency.icuBedsAvailable} Beds`;
  document.getElementById('statCriticalAlerts').textContent = `0${s.emergency.criticalAlerts} Alert`;
}

function renderNowServing() {
  const inConsult = appState.queue.find(q => q.status === 'In Consultation') || appState.queue[0];
  if (!inConsult) return;

  const dashCallingToken = document.getElementById('dashCallingToken');
  if (dashCallingToken) {
    dashCallingToken.textContent = inConsult.tokenNumber;
    document.getElementById('dashCallingPatient').textContent = `${inConsult.patientName} (Age: ${inConsult.age}, ${inConsult.gender})`;
    document.getElementById('dashCallingDoctor').textContent = `${inConsult.department} OPD Room #104 — ${inConsult.doctor}`;
  }
}

function renderWardSnapshot() {
  const container = document.getElementById('wardSnapshotContainer');
  if (!container) return;

  const wards = ['General Ward', 'ICU', 'Emergency', 'Private Ward'];
  container.innerHTML = wards.map(ward => {
    const total = appState.beds.filter(b => b.ward === ward).length;
    const avail = appState.beds.filter(b => b.ward === ward && b.status === 'Available').length;

    return `
      <div class="ward-mini-card">
        <div class="ward-mini-title">
          <span>${ward}</span>
          <span class="sub-text">${total} Beds</span>
        </div>
        <div class="ward-mini-count">${avail} <span class="sub-text">Free</span></div>
        <span class="badge-pill ${avail > 0 ? 'green-pill' : 'red-pill'}">${avail > 0 ? 'Admissions Open' : 'FULL'}</span>
      </div>
    `;
  }).join('');
}

function renderInsightsAndAlerts() {
  const container = document.getElementById('insightsListContainer');
  const fullList = document.getElementById('fullInsightsList');
  const alertsList = document.getElementById('fullAlertsList');
  const notifListMini = document.getElementById('notifMiniList');

  if (container) {
    container.innerHTML = appState.insights.map(ins => `
      <div class="insight-item priority-${ins.priority}">
        <i data-lucide="${ins.icon}"></i>
        <div>
          <strong>${ins.category}:</strong> ${ins.text}
        </div>
      </div>
    `).join('');
  }

  if (fullList) {
    fullList.innerHTML = appState.insights.map(ins => `
      <div class="insight-item priority-${ins.priority}">
        <i data-lucide="${ins.icon}"></i>
        <div>
          <strong>${ins.category}:</strong> ${ins.text}
        </div>
      </div>
    `).join('');
  }

  if (alertsList) {
    alertsList.innerHTML = appState.alerts.map(alt => `
      <div class="insight-item ${alt.resolved ? '' : 'priority-critical'}">
        <i data-lucide="bell"></i>
        <div style="flex:1;">
          <strong>${alt.title}</strong> — ${alt.message}
          <div class="sub-text margin-t-xs">${alt.time} ${alt.resolved ? '(Resolved)' : ''}</div>
        </div>
        ${!alt.resolved ? `<button class="glass-btn small-btn" onclick="resolveAlert('${alt.id}')">Resolve</button>` : ''}
      </div>
    `).join('');
  }

  if (notifListMini) {
    const unread = appState.alerts.filter(a => !a.resolved);
    document.getElementById('notifCount').textContent = unread.length;
    notifListMini.innerHTML = unread.map(a => `
      <div class="notif-mini-item margin-b-sm">
        <strong>${a.title}</strong><br>
        <span class="sub-text">${a.message}</span>
      </div>
    `).join('');
  }

  lucide.createIcons();
}

async function resolveAlert(alertId) {
  const res = await api.resolveAlert(alertId);
  if (res.success) {
    showToast('Alert resolved', 'success');
    await loadAppData();
  }
}

function renderDeptGrid() {
  const dashGrid = document.getElementById('dashDeptGrid');
  const fullGrid = document.getElementById('deptFullGrid');

  const html = appState.departments.map(d => {
    let badgeClass = 'green-pill';
    if (d.status === 'Busy') badgeClass = 'orange-pill';
    if (d.status === 'Critical') badgeClass = 'red-pill';

    return `
      <div class="dept-card">
        <div class="dept-card-top">
          <span class="dept-name">${d.name}</span>
          <span class="badge-pill ${badgeClass}">${d.status}</span>
        </div>
        <div class="dept-stats-row">
          <div>
            <span class="sub-text">Queue</span>
            <div class="dept-stat-num">${d.currentQueue}</div>
          </div>
          <div>
            <span class="sub-text">Avg. Wait</span>
            <div class="dept-stat-num">${d.avgWaitMins}m</div>
          </div>
          <div>
            <span class="sub-text">Doctors</span>
            <div class="dept-stat-num">${d.doctorsAvailable}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (dashGrid) dashGrid.innerHTML = html;
  if (fullGrid) fullGrid.innerHTML = html;
}

function renderQueueTable() {
  const tbody = document.getElementById('queueTableBody');
  if (!tbody) return;

  const searchVal = (document.getElementById('queueSearchInput')?.value || document.getElementById('globalSearchInput')?.value || '').toLowerCase();
  const deptVal = document.getElementById('queueDeptFilter')?.value || 'all';
  const statusVal = document.getElementById('queueStatusFilter')?.value || 'all';

  const filtered = appState.queue.filter(q => {
    const matchesSearch = q.tokenNumber.toLowerCase().includes(searchVal) || q.patientName.toLowerCase().includes(searchVal) || q.doctor.toLowerCase().includes(searchVal);
    const matchesDept = deptVal === 'all' || q.department === deptVal;
    const matchesStatus = statusVal === 'all' || q.status === statusVal;
    return matchesSearch && matchesDept && matchesStatus;
  });

  tbody.innerHTML = filtered.map(q => {
    let statusPill = 'orange-pill';
    if (q.status === 'In Consultation') statusPill = 'cyan-pill';
    if (q.status === 'Completed') statusPill = 'green-pill';

    let priorityPill = q.priority === 'Emergency' ? 'red-pill' : (q.priority === 'High' ? 'orange-pill' : 'blue-pill');

    return `
      <tr>
        <td><strong class="font-mono gradient-text">${q.tokenNumber}</strong></td>
        <td><strong>${q.patientName}</strong> (${q.age}, ${q.gender})</td>
        <td>${q.department}</td>
        <td>${q.doctor}</td>
        <td><strong>${q.waitTime} mins</strong> (Est)</td>
        <td><span class="badge-pill ${priorityPill}">${q.priority}</span></td>
        <td><span class="badge-pill ${statusPill}">${q.status}</span></td>
        <td>
          <button class="glass-btn small-btn" onclick="callPatientToken('${q.doctorId}')"><i data-lucide="bell"></i> Call</button>
          <button class="glass-btn small-btn success-btn" onclick="updateTokenStatus('${q.id}', 'Completed')"><i data-lucide="check"></i> Done</button>
        </td>
      </tr>
    `;
  }).join('');

  lucide.createIcons();
}

async function callPatientToken(doctorId) {
  const res = await api.callNextToken(doctorId);
  if (res.success) {
    showToast(res.message, 'success');
    await loadAppData();
  } else {
    showToast(res.message, 'warning');
  }
}

async function updateTokenStatus(tokenId, status) {
  const res = await api.updateQueueStatus(tokenId, status);
  if (res.success) {
    showToast(`Token status updated to ${status}`, 'success');
    await loadAppData();
  }
}

function renderPatientsTable() {
  const tbody = document.getElementById('patientsTableBody');
  if (!tbody) return;

  tbody.innerHTML = appState.patients.map(p => `
    <tr>
      <td><span class="font-mono">${p.id}</span></td>
      <td><strong>${p.name}</strong></td>
      <td>${p.age} / ${p.gender}</td>
      <td>${p.phone}</td>
      <td>${p.department}</td>
      <td><strong class="font-mono">${p.token}</strong></td>
      <td><span class="badge-pill green-pill">${p.visitStatus}</span></td>
      <td>${p.registrationTime}</td>
    </tr>
  `).join('');
}

function renderDoctorsGrid() {
  const grid = document.getElementById('doctorsGrid');
  if (!grid) return;

  grid.innerHTML = appState.doctors.map(d => {
    let statusClass = 'green-pill';
    if (d.status === 'Busy') statusClass = 'orange-pill';
    if (d.status === 'Offline') statusClass = 'red-pill';

    return `
      <div class="glass-card doctor-card-full">
        <div>
          <div class="doc-avatar-row">
            <div class="doc-avatar-large">${d.name.split(' ').pop().charAt(0)}</div>
            <div>
              <h3>${d.name}</h3>
              <span class="sub-text">${d.specialization}</span>
            </div>
          </div>
          <div class="margin-b-sm">
            <span class="badge-pill ${statusClass}">${d.status}</span>
            <span class="sub-text margin-l-sm">${d.room}</span>
          </div>
          <div class="sub-text">
            <strong>Department:</strong> ${d.department}<br>
            <strong>Patients Waiting:</strong> ${d.patientsWaiting}<br>
            <strong>Now Seeing:</strong> ${d.currentPatient}
          </div>
        </div>
        <button class="action-btn glow-btn width-full margin-t-md" onclick="callPatientToken('${d.id}')">
          <i data-lucide="skip-forward"></i> Call Patient
        </button>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

function renderAdminTable() {
  const tbody = document.getElementById('adminDoctorsTableBody');
  if (!tbody) return;

  tbody.innerHTML = appState.doctors.map(d => `
    <tr>
      <td><span class="font-mono">${d.id}</span></td>
      <td><strong>${d.name}</strong></td>
      <td>${d.specialization}</td>
      <td>${d.department}</td>
      <td>${d.room}</td>
      <td>${d.email || `${d.name.toLowerCase().replace(/[^a-z]/g, '')}@hospitiq.org`}</td>
      <td><span class="badge-pill green-pill">${d.status}</span></td>
      <td>
        <button class="glass-btn small-btn" onclick="openEditDoctorModal('${d.id}')" title="Edit Doctor Profile"><i data-lucide="edit"></i> Edit</button>
        <button class="glass-btn small-btn danger-btn" onclick="deleteDoctorRecord('${d.id}')" title="Remove Doctor"><i data-lucide="trash-2"></i> Remove</button>
      </td>
    </tr>
  `).join('');

  lucide.createIcons();
}

function openEditDoctorModal(docId) {
  const doc = appState.doctors.find(d => d.id === docId);
  if (!doc) return;
  document.getElementById('editDocId').value = doc.id;
  document.getElementById('editDocName').value = doc.name;
  document.getElementById('editDocEmail').value = doc.email || `${doc.name.toLowerCase().replace(/[^a-z]/g, '')}@hospitiq.org`;
  document.getElementById('editDocSpec').value = doc.specialization;
  document.getElementById('editDocDept').value = doc.department;
  document.getElementById('editDocRoom').value = doc.room;
  document.getElementById('editDocPhone').value = doc.phone || '+91 98765 00000';

  document.getElementById('editDoctorModal')?.classList.add('active');
}

function handleEditDoctorSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('editDocId').value;
  const doc = appState.doctors.find(d => d.id === id);
  if (doc) {
    doc.name = document.getElementById('editDocName').value;
    doc.email = document.getElementById('editDocEmail').value;
    doc.specialization = document.getElementById('editDocSpec').value;
    doc.department = document.getElementById('editDocDept').value;
    doc.room = document.getElementById('editDocRoom').value;
    doc.phone = document.getElementById('editDocPhone').value;

    showToast(`Doctor profile for ${doc.name} updated successfully!`, 'success');
    renderAdminTable();
    closeModal('editDoctorModal');
  }
}

async function deleteDoctorRecord(docId) {
  if (confirm('Are you sure you want to remove this doctor from HOSPITIQ?')) {
    const res = await api.deleteDoctor(docId);
    if (res.success) {
      showToast(res.message, 'success');
      await loadAppData();
    }
  }
}

function renderBedManagement() {
  const progressGrid = document.getElementById('wardProgressGrid');
  const tbody = document.getElementById('bedMgmtTableBody');

  const wards = ['General Ward', 'ICU', 'Emergency', 'Private Ward', 'Semi-Private', 'Pediatric', 'Maternity'];

  if (progressGrid) {
    progressGrid.innerHTML = wards.map(ward => {
      const wardBeds = appState.beds.filter(b => b.ward === ward);
      const total = wardBeds.length;
      const occupied = wardBeds.filter(b => b.status === 'Occupied').length;
      const avail = total - occupied;
      const percent = total > 0 ? Math.round((occupied / total) * 100) : 0;

      let fillClass = 'var(--color-green)';
      if (percent >= 70) fillClass = 'var(--color-orange)';
      if (percent >= 90) fillClass = 'var(--color-red)';

      return `
        <div class="glass-card ward-progress-card">
          <div class="dept-card-top">
            <strong>${ward}</strong>
            <span class="sub-text">${avail} / ${total} Free</span>
          </div>
          <div class="stat-number margin-t-xs">${percent}% <span class="sub-text">Occupancy</span></div>
          <div class="progress-bar-bg">
            <div class="progress-fill-bar" style="width: ${percent}%; background: ${fillClass};"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  if (tbody) {
    tbody.innerHTML = appState.beds.map(b => `
      <tr>
        <td><strong class="font-mono">${b.bedNumber}</strong></td>
        <td>${b.ward}</td>
        <td><span class="badge-pill ${b.status === 'Available' ? 'green-pill' : (b.status === 'Occupied' ? 'red-pill' : 'orange-pill')}">${b.status}</span></td>
        <td>${b.patient || '—'}</td>
        <td>${b.doctor || '—'}</td>
        <td>${b.admissionDate || '—'}</td>
        <td>${b.features ? b.features.join(', ') : 'Standard'}</td>
        <td>
          <button class="glass-btn small-btn" onclick="openBedDetailsModal('${b.id}')"><i data-lucide="eye"></i> Details</button>
        </td>
      </tr>
    `).join('');
  }

  lucide.createIcons();
}

function renderBedMap() {
  const grid = document.getElementById('bedMapGrid');
  if (!grid) return;

  const filtered = appState.beds.filter(b => {
    return appState.bedWardFilter === 'all' || b.ward === appState.bedWardFilter;
  });

  grid.innerHTML = filtered.map(b => `
    <div class="bed-item-card state-${b.status}" onclick="openBedDetailsModal('${b.id}')">
      <div class="dept-card-top">
        <span class="bed-num">${b.bedNumber}</span>
        <span class="badge-pill ${b.status === 'Available' ? 'green-pill' : 'red-pill'}">${b.status}</span>
      </div>
      <div class="sub-text margin-t-xs">
        <strong>${b.ward}</strong><br>
        ${b.patient ? `Occupant: ${b.patient}` : 'Ready for Intake'}
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.ward-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ward-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.bedWardFilter = btn.getAttribute('data-ward');
      renderBedMap();
    });
  });
}

function openBedDetailsModal(bedId) {
  const bed = appState.beds.find(b => b.id === bedId || b.bedNumber === bedId);
  if (!bed) return;

  const modal = document.getElementById('bedDetailsModal');
  const content = document.getElementById('bedModalContent');

  content.innerHTML = `
    <div class="stat-top margin-b-md">
      <h2 class="font-mono">${bed.bedNumber} — ${bed.ward}</h2>
      <span class="badge-pill ${bed.status === 'Available' ? 'green-pill' : 'red-pill'}">${bed.status}</span>
    </div>
    <div class="form-group">
      <label>Current Patient</label>
      <input type="text" id="bedPatientInput" class="glass-input" value="${bed.patient || ''}" placeholder="None" />
    </div>
    <div class="form-group">
      <label>Attending Doctor</label>
      <input type="text" id="bedDoctorInput" class="glass-input" value="${bed.doctor || ''}" placeholder="Dr. S. Sharma" />
    </div>
    <div class="form-group">
      <label>Update Bed Status</label>
      <select id="bedStatusSelect" class="glass-input">
        <option value="Available" ${bed.status === 'Available' ? 'selected' : ''}>🟢 Available</option>
        <option value="Occupied" ${bed.status === 'Occupied' ? 'selected' : ''}>🔴 Occupied</option>
        <option value="Reserved" ${bed.status === 'Reserved' ? 'selected' : ''}>🟠 Reserved</option>
        <option value="Cleaning" ${bed.status === 'Cleaning' ? 'selected' : ''}>🔵 Cleaning / Maintenance</option>
      </select>
    </div>
    <div class="margin-t-md display-flex gap-md">
      <button class="action-btn glow-btn width-full" onclick="saveBedRecord('${bed.id}')"><i data-lucide="save"></i> Save Record</button>
      ${bed.status === 'Occupied' ? `<button class="glass-btn danger-btn width-full margin-t-sm" onclick="triggerDischargeWorkflow('${bed.id}')"><i data-lucide="log-out"></i> Discharge & Clean</button>` : ''}
    </div>
  `;

  modal.classList.add('active');
  lucide.createIcons();
}

async function triggerDischargeWorkflow(bedId) {
  const res = await api.dischargePatient(bedId);
  if (res.success) {
    showToast(res.message, 'success');
    document.getElementById('bedDetailsModal').classList.remove('active');
    await loadAppData();
  }
}

async function saveBedRecord(bedId) {
  const status = document.getElementById('bedStatusSelect').value;
  const patient = document.getElementById('bedPatientInput').value;
  const doctor = document.getElementById('bedDoctorInput').value;

  const res = await api.updateBed(bedId, { status, patient, doctor });
  if (res.success) {
    showToast(res.message, 'success');
    document.getElementById('bedDetailsModal').classList.remove('active');
    await loadAppData();
  }
}

// --- SMART BED RECOMMENDATION ENGINE ---
function openRecommendBedModal() {
  document.getElementById('recommendBedModal').classList.add('active');
  fetchRecommendedBeds();
}

async function fetchRecommendedBeds() {
  const ward = document.getElementById('recWardSelect').value;
  const requireVentilator = document.getElementById('recVentilatorCheck').checked;
  const requireOxygen = document.getElementById('recOxygenCheck').checked;

  const res = await api.recommendBed({ ward, requireVentilator, requireOxygen, priority: 'High' });
  const container = document.getElementById('recResultsContainer');

  if (res.success && res.recommendations.length > 0) {
    container.innerHTML = res.recommendations.map(rec => `
      <div class="rec-card margin-b-sm">
        <div>
          <strong class="font-mono">${rec.bedNumber}</strong> — ${rec.ward}
          <span class="badge-pill green-pill margin-l-sm">${rec.suitabilityScore}</span>
          <div class="sub-text margin-t-xs">${rec.recommendedNote}</div>
        </div>
        <button class="action-btn glow-btn small-btn" onclick="allocateRecommendedBed('${rec.bedId}')">
          <i data-lucide="check"></i> ALLOCATE
        </button>
      </div>
    `).join('');
  } else {
    container.innerHTML = '<div class="sub-text text-center padding-b-md">No available beds matching criteria in this ward.</div>';
  }

  lucide.createIcons();
}

async function allocateRecommendedBed(bedId) {
  const res = await api.allocateBed({
    bedId,
    patientName: 'Ramesh Verma (A-031)',
    diagnosis: 'Acute Cardiac Observation',
    doctorName: 'Dr. S. Sharma',
    priority: 'High'
  });

  if (res.success) {
    showToast(res.message, 'success');
    document.getElementById('recommendBedModal').classList.remove('active');
    await loadAppData();
  } else {
    showToast(res.message, 'danger');
  }
}

// --- EMERGENCY MODE INTAKE ---
function initEmergencyMode() {
  const triggerBtn = document.getElementById('triggerEmergencyModeBtn');
  triggerBtn?.addEventListener('click', async () => {
    const pName = prompt('🚨 EMERGENCY MODE INTAKE: Enter Emergency Patient Name / ID:', 'Critical Trauma Intake');
    if (pName) {
      const res = await api.createEmergencyIntake({ patientName: pName, age: 34, gender: 'Male' });
      if (res.success) {
        showToast(res.message, 'danger');
        await loadAppData();
      }
    }
  });
}

// --- ANALYTICS CHARTS ---
async function renderAnalyticsCharts() {
  const analyticsRes = await api.getAnalytics();
  if (!analyticsRes.success) return;

  const { opdHourly, deptBreakdown, bedOccupancyTrend } = analyticsRes;

  const ctx1 = document.getElementById('chartOpdHourly')?.getContext('2d');
  if (ctx1) {
    if (appState.charts.opdHourly) appState.charts.opdHourly.destroy();
    appState.charts.opdHourly = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: opdHourly.labels,
        datasets: [{ label: 'Patients Registered', data: opdHourly.values, backgroundColor: 'rgba(14, 165, 233, 0.6)', borderColor: '#0ea5e9', borderWidth: 2, borderRadius: 6 }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  const ctx2 = document.getElementById('chartDeptBreakdown')?.getContext('2d');
  if (ctx2) {
    if (appState.charts.deptShare) appState.charts.deptShare.destroy();
    appState.charts.deptShare = new Chart(ctx2, {
      type: 'doughnut',
      data: { labels: deptBreakdown.labels, datasets: [{ data: deptBreakdown.values, backgroundColor: ['#0ea5e9', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'] }] },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  const ctx3 = document.getElementById('chartBedTrend')?.getContext('2d');
  if (ctx3) {
    if (appState.charts.bedTrend) appState.charts.bedTrend.destroy();
    appState.charts.bedTrend = new Chart(ctx3, {
      type: 'line',
      data: {
        labels: bedOccupancyTrend.labels,
        datasets: [
          { label: 'ICU Occupancy %', data: bedOccupancyTrend.icu, borderColor: '#ef4444', tension: 0.3 },
          { label: 'General Ward %', data: bedOccupancyTrend.general, borderColor: '#10b981', tension: 0.3 },
          { label: 'Emergency Ward %', data: bedOccupancyTrend.emergency, borderColor: '#f59e0b', tension: 0.3 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
}

// --- REPORTS & EXPORT ---
function initExportHandlers() {
  document.getElementById('exportCsvBtn')?.addEventListener('click', () => {
    let csv = 'Token Number,Patient Name,Department,Doctor,Wait Time,Priority,Status\n';
    appState.queue.forEach(q => {
      csv += `${q.tokenNumber},"${q.patientName}",${q.department},"${q.doctor}",${q.waitTime},${q.priority},${q.status}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HOSPITIQ_OPD_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('Report CSV exported successfully!', 'success');
  });

  document.getElementById('printReportBtn')?.addEventListener('click', () => window.print());
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

// --- Modals ---
function initModals() {
  document.getElementById('openNewTokenModalBtn')?.addEventListener('click', () => openNewTokenModal());
  document.getElementById('openAddDoctorModalBtn')?.addEventListener('click', () => openModal('addDoctorModal'));
  document.getElementById('adminAddDoctorBtn')?.addEventListener('click', () => openModal('addDoctorModal'));

  document.getElementById('closeNewTokenModal')?.addEventListener('click', () => closeModal('newTokenModal'));
  document.getElementById('closeAddDoctorModal')?.addEventListener('click', () => closeModal('addDoctorModal'));
  document.getElementById('closeBedDetailsModal')?.addEventListener('click', () => closeModal('bedDetailsModal'));
  document.getElementById('closeRecommendBedModal')?.addEventListener('click', () => closeModal('recommendBedModal'));
  document.getElementById('closeEditDoctorModal')?.addEventListener('click', () => closeModal('editDoctorModal'));

  // Close modals on overlay backdrop click
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });

  document.getElementById('newTokenForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const doctorId = document.getElementById('inputDoctorSelect').value;
    const selectedDoc = appState.doctors.find(d => d.id === doctorId) || appState.doctors[0];

    const tokenData = {
      patientName: document.getElementById('inputPatientName').value,
      age: document.getElementById('inputPatientAge').value,
      gender: document.getElementById('inputPatientGender').value,
      phone: document.getElementById('inputPatientPhone').value,
      doctorId: doctorId,
      department: selectedDoc ? selectedDoc.department : '',
      priority: document.getElementById('inputPriority').value
    };

    let newToken = {
      id: `q-${Date.now()}`,
      tokenNumber: `A-${String(appState.queue.length + 105).padStart(3, '0')}`,
      patientName: tokenData.patientName,
      age: parseInt(tokenData.age) || 30,
      gender: tokenData.gender,
      phone: tokenData.phone || '+91 99000 11223',
      department: selectedDoc ? selectedDoc.department : 'General Medicine',
      doctor: selectedDoc ? selectedDoc.name : 'Dr. Sunita Rao',
      doctorId: selectedDoc ? selectedDoc.id : 'doc-1',
      waitTime: Math.round(((selectedDoc ? selectedDoc.patientsWaiting : 1) + 1) * 12),
      patientsAhead: selectedDoc ? selectedDoc.patientsWaiting : 1,
      room: selectedDoc ? selectedDoc.room : 'OPD Room #104',
      priority: tokenData.priority || 'Normal',
      status: 'Waiting',
      registrationTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      smsSent: true,
      whatsappSent: true
    };

    try {
      const res = await api.createToken(tokenData);
      if (res.success && res.token) {
        newToken = res.token;
      }
    } catch (err) {
      console.warn('API token creation warning:', err);
    }

    saveCustomTokenLocally(newToken);
    if (!appState.queue.some(q => q.id === newToken.id || q.tokenNumber === newToken.tokenNumber)) {
      appState.queue.unshift(newToken);
    }

    closeModal('newTokenModal');
    e.target.reset();

    showToast(`Patient ${newToken.patientName} (Token ${newToken.tokenNumber}) registered successfully!`, 'success');

    if (appState.currentUser && (appState.currentUser.role === 'Doctor' || appState.currentUser.role === 'Admin')) {
      renderDoctorQueueRoster();
      renderQueueTable();
      renderPatientsTable();
    } else {
      launchPortal({ id: 'usr-pt', name: newToken.patientName, role: 'Patient', tokenNumber: newToken.tokenNumber }, 'patient-portal');
    }
  });

  document.getElementById('addDoctorForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const docData = {
      name: document.getElementById('docNameInput').value,
      email: document.getElementById('docEmailInput')?.value,
      specialization: document.getElementById('docSpecInput').value,
      department: document.getElementById('docDeptInput').value,
      room: document.getElementById('docRoomInput').value,
      phone: document.getElementById('docPhoneInput').value
    };

    const formattedName = docData.name.startsWith('Dr.') ? docData.name : `Dr. ${docData.name}`;
    const formattedRoom = docData.room.includes('OPD Room') ? docData.room : `OPD Room #${docData.room}`;

    let newDoc = {
      id: `doc-${Date.now()}`,
      name: formattedName,
      specialization: docData.specialization || 'General Practice',
      department: docData.department || 'General Medicine',
      status: 'Available',
      patientsWaiting: 0,
      currentPatient: 'None',
      room: formattedRoom,
      phone: docData.phone || '+91 98000 00000',
      email: docData.email || `${docData.name.toLowerCase().replace(/[^a-z]/g, '')}@hospitiq.org`
    };

    try {
      const res = await api.addDoctor(docData);
      if (res.success && res.doctor) {
        newDoc = res.doctor;
      }
    } catch (err) {
      console.warn('API add doctor warning:', err);
    }

    saveCustomDoctorLocally(newDoc);
    if (!appState.doctors.some(d => d.id === newDoc.id || d.email === newDoc.email)) {
      appState.doctors.unshift(newDoc);
    }

    closeModal('addDoctorModal');
    e.target.reset();

    showToast(`Doctor ${newDoc.name} registered & added to roster! Login created for ${newDoc.email}`, 'success');

    populateDoctorOptions();
    renderDoctorsGrid();
    renderAdminTable();
  });
}

function openNewTokenModal(preselectDoctorId = null) {
  populateDoctorOptions();
  const select = document.getElementById('inputDoctorSelect');

  if (select && select.options.length > 0) {
    if (preselectDoctorId) {
      select.value = preselectDoctorId;
    } else if (appState.currentUser && appState.currentUser.role === 'Doctor') {
      const loggedDoc = appState.doctors.find(d => 
        (d.email && appState.currentUser.email && d.email === appState.currentUser.email) ||
        d.name.toLowerCase().includes('sunita') ||
        d.name.toLowerCase().includes(appState.currentUser.name.toLowerCase()) ||
        appState.currentUser.name.toLowerCase().includes(d.name.toLowerCase())
      );
      if (loggedDoc) {
        select.value = loggedDoc.id;
      } else if (select.options.length > 1) {
        select.selectedIndex = 1;
      }
    } else if (select.options.length > 1 && (!select.value || select.selectedIndex <= 0)) {
      select.selectedIndex = 1;
    }
  }

  openModal('newTokenModal');
}

function populateDoctorOptions() {
  const select = document.getElementById('inputDoctorSelect');
  if (!select) return;

  if (!appState.doctors || appState.doctors.length === 0) {
    select.innerHTML = '<option value="" disabled selected>No Doctors Available</option>';
    return;
  }

  const currentVal = select.value;
  const optionsHtml = appState.doctors.map(d => 
    `<option value="${d.id}">${d.name} (${d.department} — ${d.room || 'OPD Room'})</option>`
  ).join('');

  select.innerHTML = `<option value="" disabled>-- Select Attending Doctor & Room --</option>` + optionsHtml;

  if (currentVal && Array.from(select.options).some(opt => opt.value === currentVal)) {
    select.value = currentVal;
  }
}

function initSearchAndFilters() {
  const queueSearch = document.getElementById('queueSearchInput');
  const globalSearch = document.getElementById('globalSearchInput');
  const queueDept = document.getElementById('queueDeptFilter');
  const queueStatus = document.getElementById('queueStatusFilter');

  queueSearch?.addEventListener('input', renderQueueTable);
  globalSearch?.addEventListener('input', (e) => {
    if (appState.activeView !== 'opd-queue') switchView('opd-queue');
    renderQueueTable();
  });
  queueDept?.addEventListener('change', renderQueueTable);
  queueStatus?.addEventListener('change', renderQueueTable);
}

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
