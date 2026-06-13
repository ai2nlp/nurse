// ─── Navigation ───────────────────────────────────────────────────

/**
 * Switch the active view and render its content.
 * @param {string} view  One of: 'dashboard' | 'calendar' | 'team' | 'settings'
 */
function navigate(view) {
  // Hide all views and deactivate all nav links
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  // Activate the target view
  const viewEl = document.getElementById(`view-${view}`);
  if (viewEl) viewEl.classList.add('active');

  // Highlight the corresponding nav link
  const linkEl = document.querySelector(`[data-view="${view}"]`);
  if (linkEl) linkEl.classList.add('active');

  // Render the view's content
  switch (view) {
    case 'dashboard': renderDashboard(); break;
    case 'calendar':  renderCalendar();  break;
    case 'team':      renderTeam();      break;
    case 'settings':  renderSettings();  break;
    default:
      console.warn(`NurseShift: unknown view "${view}"`);
  }

  // Close the mobile sidebar after navigation
  document.getElementById('sidebar')?.classList.remove('open');
}

/**
 * Re-render whichever view is currently active.
 * Called after any state mutation that affects the UI.
 */
function renderAll() {
  const active = document.querySelector('.view.active');
  if (!active) return;
  const view = active.id.replace('view-', '');
  navigate(view);
}

// ─── Settings Renderer ────────────────────────────────────────────

function renderSettings() {
  const s = getState();
  const trackSelect = document.getElementById('rotationTrackSelect');
  const startA      = document.getElementById('groupAStartDate');
  const startB      = document.getElementById('groupBStartDate');

  if (trackSelect) trackSelect.value = s.rotationTrack;
  if (startA)      startA.value      = s.rotationStartA;
  if (startB)      startB.value      = s.rotationStartB;
}

// ─── Track Toggle Sync ────────────────────────────────────────────

function updateTrackToggle() {
  const s      = getState();
  const toggle = document.getElementById('trackToggle');
  const label  = document.getElementById('trackLabel');
  if (toggle) toggle.checked = s.rotationTrack === 'alternating';
  if (label)  label.textContent = s.rotationTrack === 'concurrent' ? 'Concurrent' : 'Alternating';
}

// ─── Initialise App ───────────────────────────────────────────────

function init() {

  // ── Nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      navigate(link.dataset.view);
    });
  });

  // ── Calendar month navigation
  document.getElementById('prevMonth')?.addEventListener('click', () => {
    calState.month--;
    if (calState.month < 0) {
      calState.month = 11;
      calState.year--;
    }
    renderCalendar();
  });

  document.getElementById('nextMonth')?.addEventListener('click', () => {
    calState.month++;
    if (calState.month > 11) {
      calState.month = 0;
      calState.year++;
    }
    renderCalendar();
  });

  // ── Shift modal close
  document.getElementById('modalClose')?.addEventListener('click', () => {
    document.getElementById('shiftModal')?.classList.remove('active');
  });

  // ── Member modal controls
  document.getElementById('memberModalClose')?.addEventListener('click', () => {
    document.getElementById('memberModal')?.classList.remove('active');
  });

  document.getElementById('memberModalCancel')?.addEventListener('click', () => {
    document.getElementById('memberModal')?.classList.remove('active');
  });

  document.getElementById('memberModalSave')?.addEventListener('click', saveMember);

  // ── Close any modal when clicking the overlay backdrop
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  });

  // ── Escape key closes open modals
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(overlay => {
        overlay.classList.remove('active');
      });
    }
  });

  // ── Add member button
  document.getElementById('addMemberBtn')?.addEventListener('click', () => {
    openMemberModal(null);
  });

  // ── Group toggle buttons in the member modal
  document.querySelectorAll('.group-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedGroupInModal = btn.dataset.group;
      updateGroupBtns();
    });
  });

  // ── Save on Enter in the name input
  document.getElementById('memberNameInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') saveMember();
  });

  // ── Settings: rotation track select
  document.getElementById('rotationTrackSelect')?.addEventListener('change', e => {
    setState({ rotationTrack: e.target.value });
    updateTrackToggle();
  });

  // ── Settings: start date inputs
  document.getElementById('groupAStartDate')?.addEventListener('change', e => {
    setState({ rotationStartA: e.target.value });
  });

  document.getElementById('groupBStartDate')?.addEventListener('change', e => {
    setState({ rotationStartB: e.target.value });
  });

  // ── Sidebar track toggle (pill switch)
  document.getElementById('trackToggle')?.addEventListener('change', e => {
    const track = e.target.checked ? 'alternating' : 'concurrent';
    setState({ rotationTrack: track });
    document.getElementById('trackLabel').textContent =
      track === 'concurrent' ? 'Concurrent' : 'Alternating';
    // Keep the settings select in sync if it's visible
    const trackSelect = document.getElementById('rotationTrackSelect');
    if (trackSelect) trackSelect.value = track;
  });

  // ── Mobile: sidebar hamburger toggle
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
  });

  // ── Mobile: tap outside open sidebar to close it
  document.addEventListener('click', e => {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    if (
      sidebar?.classList.contains('open') &&
      !sidebar.contains(e.target) &&
      !toggleBtn?.contains(e.target)
    ) {
      sidebar.classList.remove('open');
    }
  });

  // ── Sync toggle UI to persisted state and navigate to dashboard
  updateTrackToggle();
  navigate('dashboard');
}

// ─── Bootstrap ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
