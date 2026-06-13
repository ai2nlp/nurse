// ─── Default Data ─────────────────────────────────────────────────
// 15 members: 8 in Group A, 7 in Group B, with realistic nurse names
const DEFAULT_MEMBERS = [
  { id: '1',  name: 'Alice Johnson',      group: 'A', order: 0 },
  { id: '2',  name: 'Maria Garcia',       group: 'A', order: 1 },
  { id: '3',  name: 'James Wilson',       group: 'A', order: 2 },
  { id: '4',  name: 'Sarah Davis',        group: 'A', order: 3 },
  { id: '5',  name: 'Linda Martinez',     group: 'A', order: 4 },
  { id: '6',  name: 'Robert Taylor',      group: 'A', order: 5 },
  { id: '7',  name: 'Jennifer Brown',     group: 'A', order: 6 },
  { id: '8',  name: 'Michael Lee',        group: 'A', order: 7 },
  { id: '9',  name: 'Patricia White',     group: 'B', order: 0 },
  { id: '10', name: 'David Harris',       group: 'B', order: 1 },
  { id: '11', name: 'Barbara Clark',      group: 'B', order: 2 },
  { id: '12', name: 'Christopher Lewis',  group: 'B', order: 3 },
  { id: '13', name: 'Susan Robinson',     group: 'B', order: 4 },
  { id: '14', name: 'Thomas Walker',      group: 'B', order: 5 },
  { id: '15', name: 'Jessica Hall',       group: 'B', order: 6 },
];

const DEFAULT_STATE = {
  members: DEFAULT_MEMBERS,
  rotationTrack: 'concurrent', // 'concurrent' | 'alternating'
  rotationStartA: '2026-01-04', // First Sunday of 2026
  rotationStartB: '2026-01-04',
  overrides: {}, // { 'YYYY-MM-DD': { A: memberId|null, B: memberId|null } }
};

let _state = null;

// ─── State Lifecycle ──────────────────────────────────────────────
function loadState() {
  try {
    const saved = localStorage.getItem('nurseshift_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults to handle new fields added in future versions
      _state = { ...DEFAULT_STATE, ...parsed };
      // Ensure members array is valid
      if (!Array.isArray(_state.members) || _state.members.length === 0) {
        _state.members = JSON.parse(JSON.stringify(DEFAULT_MEMBERS));
      }
      // Ensure overrides is an object
      if (typeof _state.overrides !== 'object' || _state.overrides === null) {
        _state.overrides = {};
      }
    } else {
      _state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  } catch (e) {
    console.warn('NurseShift: Failed to load state from localStorage, using defaults.', e);
    _state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
}

function saveState() {
  try {
    localStorage.setItem('nurseshift_state', JSON.stringify(_state));
  } catch (e) {
    console.warn('NurseShift: Failed to save state to localStorage.', e);
  }
}

function getState() {
  return _state;
}

function setState(updates) {
  _state = { ..._state, ...updates };
  saveState();
}

function clearAllData() {
  if (confirm('Reset all data to defaults? This cannot be undone.')) {
    localStorage.removeItem('nurseshift_state');
    loadState();
    renderAll();
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────
loadState();
