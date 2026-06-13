// ─── Dashboard Entry Point ────────────────────────────────────────

function renderDashboard() {
  renderThisSunday();
  renderUpcoming();
  renderRestTracker();
}

// ─── This Sunday ──────────────────────────────────────────────────

/**
 * Returns the date string for the upcoming (or current) Sunday of this week.
 * If today is Sunday, returns today.
 */
function getThisSunday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = today.getDay();
  if (day === 0) return formatDate(today);
  // Advance to next Sunday
  const next = new Date(today);
  next.setDate(today.getDate() + (7 - day));
  return formatDate(next);
}

function renderThisSunday() {
  const container = document.getElementById('thisSundayGrid');
  if (!container) return;

  const thisSunday = getThisSunday();
  const assignment = getAssignment(thisSunday);
  const memberA = assignment.A ? getMemberById(assignment.A) : null;
  const memberB = assignment.B ? getMemberById(assignment.B) : null;

  const d = parseDate(thisSunday);
  const dateFormatted = d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  container.innerHTML = `
    ${memberA ? `
    <div class="shift-card shift-card-a glass-panel">
      <div class="shift-card-label">Group A</div>
      <div class="shift-card-name">${memberA.name}</div>
      <div class="shift-card-date">${dateFormatted}</div>
      <div class="shift-card-badge badge-a">On Shift</div>
    </div>` : `
    <div class="shift-card shift-card-empty glass-panel">
      <div class="shift-card-label">Group A</div>
      <div class="shift-card-name muted">No assignment</div>
      <div class="shift-card-date">${dateFormatted}</div>
    </div>`}
    ${memberB ? `
    <div class="shift-card shift-card-b glass-panel">
      <div class="shift-card-label">Group B</div>
      <div class="shift-card-name">${memberB.name}</div>
      <div class="shift-card-date">${dateFormatted}</div>
      <div class="shift-card-badge badge-b">On Shift</div>
    </div>` : `
    <div class="shift-card shift-card-empty glass-panel">
      <div class="shift-card-label">Group B</div>
      <div class="shift-card-name muted">No assignment</div>
      <div class="shift-card-date">${dateFormatted}</div>
    </div>`}
  `;
}

// ─── Upcoming Timeline ────────────────────────────────────────────

function renderUpcoming() {
  const container = document.getElementById('upcomingTimeline');
  if (!container) return;

  const thisSunday = getThisSunday();
  const sundays = getUpcomingSundays(8);

  container.innerHTML = sundays.map(dateStr => {
    const assignment = getAssignment(dateStr);
    const memberA = assignment.A ? getMemberById(assignment.A) : null;
    const memberB = assignment.B ? getMemberById(assignment.B) : null;
    const d = parseDate(dateStr);
    const label = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const isThisSunday = dateStr === thisSunday;

    return `
    <div class="timeline-item ${isThisSunday ? 'timeline-today' : ''}">
      <div class="timeline-date">${label}${isThisSunday ? ' <em style="font-size:10px;opacity:0.7">(this week)</em>' : ''}</div>
      <div class="timeline-assignments">
        ${memberA ? `<span class="timeline-badge badge-a">${memberA.name}</span>` : ''}
        ${memberB ? `<span class="timeline-badge badge-b">${memberB.name}</span>` : ''}
        ${!memberA && !memberB ? '<span class="text-muted" style="font-size:13px">No assignments</span>' : ''}
      </div>
    </div>`;
  }).join('');
}

// ─── Rest Tracker ─────────────────────────────────────────────────

function renderRestTracker() {
  const container = document.getElementById('restTrackerGrid');
  if (!container) return;

  const s = getState();
  // 15 weeks is a reasonable max for a 15-person rotation display
  const maxDays = 105;

  container.innerHTML = s.members.map(member => {
    const lastShift = getLastShiftDate(member.id);
    const nextShift = getNextShiftDate(member.id);
    const daysSince = lastShift !== null ? getDaysSince(lastShift) : null;
    const daysUntil = nextShift !== null ? getDaysUntil(nextShift) : null;

    // Progress bar represents how far into their rest period they are
    const progress = daysSince !== null
      ? Math.min(100, Math.max(0, (daysSince / maxDays) * 100))
      : 0;

    const groupClass = member.group === 'A' ? 'group-a' : 'group-b';

    let nextLabel = '—';
    if (nextShift) {
      if (daysUntil === 0) nextLabel = 'Today';
      else if (daysUntil === 1) nextLabel = 'Tomorrow';
      else if (daysUntil < 0) nextLabel = `${Math.abs(daysUntil)}d ago`;
      else nextLabel = `${daysUntil}d`;
    }

    return `
    <div class="rest-card glass-panel">
      <div class="rest-card-header">
        <span class="member-name">${member.name}</span>
        <span class="group-badge ${groupClass}">${member.group}</span>
      </div>
      <div class="rest-bar-container">
        <div class="rest-bar rest-bar-${member.group.toLowerCase()}" style="width: ${progress.toFixed(1)}%"></div>
      </div>
      <div class="rest-stats">
        <span class="rest-stat">${lastShift ? `Last: ${daysSince}d ago` : 'No past shifts'}</span>
        <span class="rest-stat">Next: ${nextLabel}</span>
      </div>
    </div>`;
  }).join('');
}
