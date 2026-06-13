// ─── Date Utilities ───────────────────────────────────────────────

/**
 * Returns 'YYYY-MM-DD' string for a given Date object.
 * Uses local time (no timezone shift).
 */
function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Parse 'YYYY-MM-DD' string into a Date without timezone shift.
 */
function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Return a new Date n days after date.
 */
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/**
 * Get all Sunday date strings in a given month.
 * @param {number} year
 * @param {number} month  0-indexed
 */
function getSundaysInMonth(year, month) {
  const sundays = [];
  const d = new Date(year, month, 1);
  // Advance to first Sunday
  while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
  while (d.getMonth() === month) {
    sundays.push(formatDate(new Date(d)));
    d.setDate(d.getDate() + 7);
  }
  return sundays;
}

/**
 * Get the next `count` Sundays starting from fromDate (or today).
 * The starting Sunday is included.
 */
function getUpcomingSundays(count, fromDate) {
  const sundays = [];
  const d = fromDate ? new Date(fromDate) : new Date();
  d.setHours(0, 0, 0, 0);
  // Advance to the next Sunday (or stay if today is Sunday)
  while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
  for (let i = 0; i < count; i++) {
    sundays.push(formatDate(new Date(d)));
    d.setDate(d.getDate() + 7);
  }
  return sundays;
}

/**
 * Get the most recent `count` Sundays up to and including today, in ascending order.
 */
function getPastSundays(count) {
  const sundays = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  // Walk back to most recent Sunday
  while (d.getDay() !== 0) d.setDate(d.getDate() - 1);
  for (let i = 0; i < count; i++) {
    sundays.push(formatDate(new Date(d)));
    d.setDate(d.getDate() - 7);
  }
  return sundays.reverse(); // ascending order
}

// ─── Member Helpers ───────────────────────────────────────────────

function getMemberById(id) {
  return getState().members.find(m => m.id === id) || null;
}

function getGroupMembers(group) {
  return getState().members
    .filter(m => m.group === group)
    .sort((a, b) => a.order - b.order);
}

// ─── Core Rotation Logic ──────────────────────────────────────────

/**
 * Returns the 0-based index of dateStr within a group's rotation cycle.
 * Returns a negative number if dateStr is before the group's rotation start.
 */
function getSundayIndexForGroup(dateStr, group) {
  const s = getState();
  const startStr = group === 'A' ? s.rotationStartA : s.rotationStartB;
  const start = parseDate(startStr);

  // Advance start to the nearest Sunday on or after the configured start date
  while (start.getDay() !== 0) start.setDate(start.getDate() + 1);

  const target = parseDate(dateStr);
  const diffMs = target - start;
  return Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
}

/**
 * Returns the 0-based global Sunday index since whichever group started first.
 * Used by the alternating rotation mode.
 */
function getGlobalSundayIndex(dateStr) {
  const s = getState();
  const startA = parseDate(s.rotationStartA);
  const startB = parseDate(s.rotationStartB);

  // Find the earlier of the two effective start Sundays
  while (startA.getDay() !== 0) startA.setDate(startA.getDate() + 1);
  while (startB.getDay() !== 0) startB.setDate(startB.getDate() + 1);

  const earlier = startA <= startB ? startA : startB;
  const target = parseDate(dateStr);
  return Math.round((target - earlier) / (7 * 24 * 60 * 60 * 1000));
}

/**
 * Computes the rotation assignment for a given Sunday.
 * Returns { A: memberId|null, B: memberId|null }.
 *
 * - 'concurrent': both groups rotate independently every Sunday
 * - 'alternating': groups alternate Sundays (even global index → A, odd → B)
 *
 * Overrides stored in state.overrides take precedence over computed values.
 */
function getAssignment(dateStr) {
  const s = getState();
  const override = s.overrides[dateStr] || {};

  const membersA = getGroupMembers('A');
  const membersB = getGroupMembers('B');

  let assignedA = null;
  let assignedB = null;

  if (s.rotationTrack === 'concurrent') {
    // Both groups work every Sunday; each group cycles through its own members
    const idxA = getSundayIndexForGroup(dateStr, 'A');
    const idxB = getSundayIndexForGroup(dateStr, 'B');

    if (idxA >= 0 && membersA.length > 0) {
      assignedA = membersA[idxA % membersA.length].id;
    }
    if (idxB >= 0 && membersB.length > 0) {
      assignedB = membersB[idxB % membersB.length].id;
    }
  } else {
    // Alternating: even global Sunday index → Group A works, odd → Group B works
    const globalIdx = getGlobalSundayIndex(dateStr);

    if (globalIdx < 0) {
      // Before both rotation starts — no assignment
    } else if (globalIdx % 2 === 0) {
      // Even index → Group A works this Sunday
      const idxA = getSundayIndexForGroup(dateStr, 'A');
      if (idxA >= 0 && membersA.length > 0) {
        const groupSundayNum = Math.floor(globalIdx / 2);
        assignedA = membersA[groupSundayNum % membersA.length].id;
      }
    } else {
      // Odd index → Group B works this Sunday
      const idxB = getSundayIndexForGroup(dateStr, 'B');
      if (idxB >= 0 && membersB.length > 0) {
        const groupSundayNum = Math.floor((globalIdx + 1) / 2);
        assignedB = membersB[groupSundayNum % membersB.length].id;
      }
    }
  }

  return {
    A: override.A !== undefined ? override.A : assignedA,
    B: override.B !== undefined ? override.B : assignedB,
  };
}

// ─── Override Management ──────────────────────────────────────────

/**
 * Manually override a group's assignment on a specific date.
 * Pass memberId = null to remove the assignment for that group.
 */
function overrideShift(dateStr, group, memberId) {
  const s = getState();
  const overrides = { ...s.overrides };
  if (!overrides[dateStr]) overrides[dateStr] = {};
  overrides[dateStr][group] = memberId;
  setState({ overrides });
}

/**
 * Remove an override for a specific group on a date,
 * restoring the computed rotation assignment.
 */
function removeOverride(dateStr, group) {
  const s = getState();
  const overrides = { ...s.overrides };
  if (overrides[dateStr]) {
    delete overrides[dateStr][group];
    if (Object.keys(overrides[dateStr]).length === 0) {
      delete overrides[dateStr];
    }
  }
  setState({ overrides });
}

/**
 * Swap assignments between two (date, group) pairs.
 */
function swapShifts(date1, group1, date2, group2) {
  const assign1 = getAssignment(date1);
  const assign2 = getAssignment(date2);
  const member1 = assign1[group1];
  const member2 = assign2[group2];
  overrideShift(date1, group1, member2);
  overrideShift(date2, group2, member1);
}

// ─── Member Shift History ─────────────────────────────────────────

/**
 * Returns the date string of the most recent Sunday (up to 1 year ago)
 * on which this member was assigned, or null if none found.
 */
function getLastShiftDate(memberId) {
  const past = getPastSundays(52);
  for (let i = past.length - 1; i >= 0; i--) {
    const a = getAssignment(past[i]);
    if (a.A === memberId || a.B === memberId) return past[i];
  }
  return null;
}

/**
 * Returns the date string of the next Sunday (up to 1 year ahead)
 * on which this member is assigned, or null if none found.
 */
function getNextShiftDate(memberId) {
  const upcoming = getUpcomingSundays(52);
  for (const d of upcoming) {
    const a = getAssignment(d);
    if (a.A === memberId || a.B === memberId) return d;
  }
  return null;
}

/**
 * Returns the number of days elapsed since dateStr (positive = past).
 */
function getDaysSince(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = parseDate(dateStr);
  return Math.round((today - d) / (24 * 60 * 60 * 1000));
}

/**
 * Returns the number of days until dateStr (positive = future).
 */
function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = parseDate(dateStr);
  return Math.round((d - today) / (24 * 60 * 60 * 1000));
}
