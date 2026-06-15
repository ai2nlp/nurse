// ─── Supabase Auth Module ─────────────────────────────────────────

let _client = null;
let _authMode = 'login';

function getSupabaseClient() {
  if (!_client) {
    _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _client;
}

async function initAuth() {
  const client = getSupabaseClient();

  const { data: { session } } = await client.auth.getSession();
  _applyAuthState(session?.user ?? null);

  client.auth.onAuthStateChange((_event, session) => {
    _applyAuthState(session?.user ?? null);
  });

  document.getElementById('authForm')?.addEventListener('submit', _handleSubmit);
}

function _applyAuthState(user) {
  const overlay    = document.getElementById('authModal');
  const sidebarUser = document.getElementById('sidebarUser');
  const emailEl    = document.getElementById('sidebarUserEmail');

  if (user) {
    overlay?.classList.remove('active');
    if (emailEl) emailEl.textContent = user.email;
    if (sidebarUser) sidebarUser.style.display = 'flex';

    if (!window._nurseBooted) {
      window._nurseBooted = true;
      init();
    }
  } else {
    overlay?.classList.add('active');
    if (sidebarUser) sidebarUser.style.display = 'none';
    window._nurseBooted = false;
  }
}

async function _handleSubmit(e) {
  e.preventDefault();
  const client   = getSupabaseClient();
  const email    = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const errEl    = document.getElementById('authError');
  const btnEl    = document.getElementById('authSubmitBtn');

  errEl.textContent  = '';
  errEl.style.color  = 'var(--danger)';
  btnEl.disabled     = true;
  const origLabel    = btnEl.textContent;
  btnEl.textContent  = 'Please wait…';

  let error, data;

  if (_authMode === 'signup') {
    ({ data, error } = await client.auth.signUp({ email, password }));
    if (!error && data?.user && !data.session) {
      errEl.style.color = '#10b981';
      errEl.textContent = 'Check your email to confirm your account.';
      btnEl.disabled    = false;
      btnEl.textContent = origLabel;
      return;
    }
  } else {
    ({ error } = await client.auth.signInWithPassword({ email, password }));
  }

  btnEl.disabled    = false;
  btnEl.textContent = origLabel;
  if (error) errEl.textContent = error.message;
}

function toggleAuthMode() {
  _authMode = _authMode === 'login' ? 'signup' : 'login';
  const isSignUp = _authMode === 'signup';

  document.getElementById('authModalTitle').textContent = isSignUp ? 'Create Account' : 'Sign In';
  document.getElementById('authSubmitBtn').textContent  = isSignUp ? 'Sign Up' : 'Sign In';
  document.getElementById('authError').textContent      = '';

  const switchEl = document.getElementById('authSwitchText');
  switchEl.innerHTML = isSignUp
    ? 'Already have an account? <a href="#" onclick="toggleAuthMode();return false;">Sign In</a>'
    : 'No account? <a href="#" onclick="toggleAuthMode();return false;">Sign Up</a>';
}

async function handleLogout() {
  await getSupabaseClient().auth.signOut();
  window._nurseBooted = false;
  location.reload();
}

// ─── Cloud Save / Load ────────────────────────────────────────────

async function saveTeamState() {
  const client = getSupabaseClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return;

  const s = getState();
  _setSyncStatus('Saving…');

  const { error } = await client.from('team_state').upsert({
    user_id:          user.id,
    members:          s.members,
    rotation_track:   s.rotationTrack,
    rotation_start_a: s.rotationStartA,
    rotation_start_b: s.rotationStartB,
    overrides:        s.overrides,
    updated_at:       new Date().toISOString(),
  }, { onConflict: 'user_id' });

  _setSyncStatus(error ? 'Save failed' : 'Saved ✓', !!error);
}

async function loadTeamState() {
  const client = getSupabaseClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return;

  _setSyncStatus('Loading…');

  const { data, error } = await client
    .from('team_state')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    _setSyncStatus(error.code === 'PGRST116' ? 'No saved data' : 'Load failed', true);
    return;
  }

  setState({
    members:       data.members,
    rotationTrack: data.rotation_track,
    rotationStartA: data.rotation_start_a,
    rotationStartB: data.rotation_start_b,
    overrides:     data.overrides || {},
  });
  renderAll();
  _setSyncStatus('Loaded ✓');
}

function _setSyncStatus(msg, isError = false) {
  const el = document.getElementById('syncStatus');
  if (!el) return;
  el.textContent  = msg;
  el.style.color  = isError ? 'var(--danger)' : '#10b981';
  el.style.opacity = '1';
  clearTimeout(el._timeout);
  el._timeout = setTimeout(() => { el.style.opacity = '0'; }, 3000);
}

document.addEventListener('DOMContentLoaded', initAuth);
