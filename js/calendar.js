// ─── Calendar State ───────────────────────────────────────────────
// Tracks the currently displayed month/year (mutable, not persisted).
const calState = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(), // 0-indexed
};

// ─── Calendar Render ──────────────────────────────────────────────

function renderCalendar() {
  const { year, month } = calState;
  const label = new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const labelEl = document.getElementById('currentMonthLabel');
  if (labelEl) labelEl.textContent = label;

  const grid = document.getElementById('calendarGrid');
  if (!grid) return;

  // ── Day column headers
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let html = dayNames.map(d => `<div class="cal-header">${d}</div>`).join('');

  // ── Leading empty cells for days before the 1st
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  for (let i = 0; i < firstDay; i++) {
    html += `<div class="cal-day cal-day-empty"></div>`;
  }

  // ── Day cells
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = formatDate(new Date());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const dateStr = formatDate(d);
    const isSunday = d.getDay() === 0;
    const isToday = dateStr === todayStr;
    const isPast = d < today;

    const classes = [
      'cal-day',
      isSunday ? 'cal-sunday' : '',
      isToday  ? 'cal-today'  : '',
      isPast   ? 'cal-past'   : '',
    ].filter(Boolean).join(' ');

    // Shift badges only appear on Sundays
    let badgesHtml = '';
    if (isSunday) {
      const assignment = getAssignment(dateStr);
      const memberA = assignment.A ? getMemberById(assignment.A) : null;
      const memberB = assignment.B ? getMemberById(assignment.B) : null;
      if (memberA) {
        badgesHtml += `<span class="shift-badge badge-a">${memberA.name.split(' ')[0]}</span>`;
      }
      if (memberB) {
        badgesHtml += `<span class="shift-badge badge-b">${memberB.name.split(' ')[0]}</span>`;
      }
    }

    const clickAttr = isSunday
      ? `data-date="${dateStr}" style="cursor:pointer" title="Click to manage this shift"`
      : '';

    html += `
      <div class="${classes}" ${clickAttr}>
        <span class="cal-day-num">${day}</span>
        <div class="cal-badges">${badgesHtml}</div>
      </div>`;
  }

  grid.innerHTML = html;

  // ── Attach click handlers to Sunday cells
  grid.querySelectorAll('[data-date]').forEach(cell => {
    cell.addEventListener('click', () => openShiftModal(cell.dataset.date));
  });
}

// ─── Shift Detail Modal ───────────────────────────────────────────

function openShiftModal(dateStr) {
  const modal = document.getElementById('shiftModal');
  const title = document.getElementById('modalTitle');
  const body  = document.getElementById('modalBody');
  if (!modal || !title || !body) return;

  const d = parseDate(dateStr);
  const label = d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  title.textContent = label;

  const assignment = getAssignment(dateStr);
  const memberA = assignment.A ? getMemberById(assignment.A) : null;
  const memberB = assignment.B ? getMemberById(assignment.B) : null;
  const allMembers = getState().members;

  const isOverriddenA = getState().overrides[dateStr]?.A !== undefined;
  const isOverriddenB = getState().overrides[dateStr]?.B !== undefined;

  const buildOptions = (group, currentId) => {
    const opts = allMembers
      .filter(m => m.group === group)
      .sort((a, b) => a.order - b.order)
      .map(m => `<option value="${m.id}" ${currentId === m.id ? 'selected' : ''}>${m.name}</option>`)
      .join('');
    return `<option value="">— Override assignment —</option>${opts}<option value="none">Remove assignment</option>`;
  };

  body.innerHTML = `
    <div class="modal-shift-section">
      <div class="modal-group-label badge-a-label">Group A</div>
      <div class="modal-shift-current">
        ${memberA ? memberA.name : '<em style="color:var(--text-muted);font-style:italic;font-size:14px">No assignment</em>'}
        ${isOverriddenA ? '<span class="override-tag">Override</span>' : ''}
      </div>
      <div class="modal-shift-actions">
        <select id="overrideSelectA" class="select-input">${buildOptions('A', assignment.A)}</select>
        ${isOverriddenA ? `<button class="btn btn-outline btn-sm" onclick="removeOverride('${dateStr}','A'); renderAll(); openShiftModal('${dateStr}');">Restore default</button>` : ''}
      </div>
    </div>
    <div class="modal-shift-section">
      <div class="modal-group-label badge-b-label">Group B</div>
      <div class="modal-shift-current">
        ${memberB ? memberB.name : '<em style="color:var(--text-muted);font-style:italic;font-size:14px">No assignment</em>'}
        ${isOverriddenB ? '<span class="override-tag">Override</span>' : ''}
      </div>
      <div class="modal-shift-actions">
        <select id="overrideSelectB" class="select-input">${buildOptions('B', assignment.B)}</select>
        ${isOverriddenB ? `<button class="btn btn-outline btn-sm" onclick="removeOverride('${dateStr}','B'); renderAll(); openShiftModal('${dateStr}');">Restore default</button>` : ''}
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-outline" onclick="document.getElementById('shiftModal').classList.remove('active')">Cancel</button>
      <button class="btn btn-primary" onclick="saveShiftOverrides('${dateStr}')">Save Changes</button>
    </div>
  `;

  modal.classList.add('active');
}

// ─── Save Override From Modal ─────────────────────────────────────

function saveShiftOverrides(dateStr) {
  const selA = document.getElementById('overrideSelectA')?.value;
  const selB = document.getElementById('overrideSelectB')?.value;

  // Apply Group A override
  if (selA === 'none') {
    overrideShift(dateStr, 'A', null);
  } else if (selA && selA !== '') {
    overrideShift(dateStr, 'A', selA);
  }

  // Apply Group B override
  if (selB === 'none') {
    overrideShift(dateStr, 'B', null);
  } else if (selB && selB !== '') {
    overrideShift(dateStr, 'B', selB);
  }

  document.getElementById('shiftModal').classList.remove('active');
  renderAll();
}
