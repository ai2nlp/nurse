// ─── Email Schedule ───────────────────────────────────────────────

async function emailSchedule() {
  const { data: { user } } = await getSupabaseClient().auth.getUser();
  if (!user) { alert('Please sign in first.'); return; }

  const btn = document.getElementById('emailScheduleBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

  const sundays = getUpcomingSundays(52);
  const rows = sundays.map(dateStr => {
    const assignment = getAssignment(dateStr);
    const d = parseDate(dateStr);
    const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const memberA = assignment.A ? (getMemberById(assignment.A)?.name || '—') : '—';
    const memberB = assignment.B ? (getMemberById(assignment.B)?.name || '—') : '—';
    return `<tr>
      <td style="padding:5px 10px;border:1px solid #ddd;white-space:nowrap;color:#444">${label}</td>
      <td style="padding:5px 10px;border:1px solid #ddd;color:#4338ca;font-weight:600">${memberA}</td>
      <td style="padding:5px 10px;border:1px solid #ddd;color:#065f46;font-weight:600">${memberB}</td>
    </tr>`;
  }).join('');

  const scheduleHtml = `
    <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px">
      <thead>
        <tr style="background:#f0f0f0">
          <th style="padding:8px 10px;border:1px solid #ddd;text-align:left">Date</th>
          <th style="padding:8px 10px;border:1px solid #ddd;text-align:left;color:#4338ca">Group A</th>
          <th style="padding:8px 10px;border:1px solid #ddd;text-align:left;color:#065f46">Group B</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email:      user.email,
      schedule_html: scheduleHtml,
    });
    alert(`Schedule sent to ${user.email}`);
  } catch (err) {
    console.error('EmailJS error:', err);
    alert('Failed to send. Please try again.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '✉ Email'; }
  }
}

// ─── CSV Export ───────────────────────────────────────────────────

/**
 * Generates a CSV file of the full year's Sunday rotation schedule
 * and triggers a browser download.
 */
function exportCSV() {
  const sundays = getUpcomingSundays(52); // ~1 full year of Sundays
  const rows = [['Date', 'Day', 'Group A', 'Group B']];

  sundays.forEach(dateStr => {
    const assignment = getAssignment(dateStr);
    const d = parseDate(dateStr);
    const label = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const memberA = assignment.A ? (getMemberById(assignment.A)?.name || '') : '';
    const memberB = assignment.B ? (getMemberById(assignment.B)?.name || '') : '';
    rows.push([dateStr, label, memberA, memberB]);
  });

  // Escape fields and join into CSV text
  const csv = rows
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  // Trigger download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `nurse-shift-schedule-${formatDate(new Date())}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── PDF / Print Export ───────────────────────────────────────────

/**
 * Opens a clean print-optimised page in a new tab and triggers the browser's
 * print dialog, which the user can save as a PDF.
 */
function exportPDF() {
  const sundays = getUpcomingSundays(52);
  const s = getState();

  const tableRows = sundays.map(dateStr => {
    const assignment = getAssignment(dateStr);
    const d = parseDate(dateStr);
    const label = d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const memberA = assignment.A ? (getMemberById(assignment.A)?.name || '—') : '—';
    const memberB = assignment.B ? (getMemberById(assignment.B)?.name || '—') : '—';
    return `<tr><td>${label}</td><td class="col-a">${memberA}</td><td class="col-b">${memberB}</td></tr>`;
  }).join('');

  const trackLabel = s.rotationTrack === 'concurrent'
    ? 'Concurrent (both groups work every Sunday)'
    : 'Alternating (groups alternate each Sunday)';

  const generatedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Group roster summaries for the header
  const groupANames = getGroupMembers('A').map((m, i) => `${i + 1}. ${m.name}`).join('<br>');
  const groupBNames = getGroupMembers('B').map((m, i) => `${i + 1}. ${m.name}`).join('<br>');

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    alert('Pop-up was blocked. Please allow pop-ups for this site and try again.');
    return;
  }

  printWindow.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NurseShift — Schedule Export</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      color: #111;
      background: #fff;
      padding: 20px;
    }

    .header {
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #333;
    }

    h1 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 4px;
      letter-spacing: -0.3px;
    }

    .subtitle {
      color: #555;
      font-size: 12px;
      margin-bottom: 10px;
    }

    .rosters {
      display: flex;
      gap: 32px;
      margin-bottom: 16px;
      padding: 12px;
      background: #f8f8f8;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
    }

    .roster-group {
      flex: 1;
    }

    .roster-title {
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 6px;
    }

    .roster-title.col-a { color: #4338ca; }
    .roster-title.col-b { color: #065f46; }

    .roster-names {
      font-size: 10px;
      color: #333;
      line-height: 1.7;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }

    thead {
      background: #f0f0f0;
    }

    th, td {
      padding: 6px 10px;
      border: 1px solid #ddd;
      text-align: left;
      vertical-align: middle;
    }

    th {
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #333;
    }

    th.col-a { color: #4338ca; }
    th.col-b { color: #065f46; }

    .col-a { color: #4338ca; font-weight: 600; }
    .col-b { color: #065f46; font-weight: 600; }

    tr:nth-child(even) td { background: #fafafa; }
    tr:hover td { background: #f0f4ff; }

    td:first-child { color: #444; white-space: nowrap; }

    .no-assign { color: #999; font-style: italic; }

    .footer {
      margin-top: 14px;
      font-size: 10px;
      color: #888;
      text-align: right;
    }

    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
      @page { margin: 12mm; size: A4 portrait; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚕ NurseShift — Sunday Rotation Schedule</h1>
    <div class="subtitle">
      Generated: ${generatedDate} &nbsp;·&nbsp; Mode: ${trackLabel}
    </div>
  </div>

  <div class="rosters">
    <div class="roster-group">
      <div class="roster-title col-a">Group A (${getGroupMembers('A').length} members)</div>
      <div class="roster-names">${groupANames}</div>
    </div>
    <div class="roster-group">
      <div class="roster-title col-b">Group B (${getGroupMembers('B').length} members)</div>
      <div class="roster-names">${groupBNames}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th class="col-a">Group A — On Shift</th>
        <th class="col-b">Group B — On Shift</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows.replace(/—/g, '<span class="no-assign">—</span>')}
    </tbody>
  </table>

  <div class="footer">NurseShift · Printed ${generatedDate}</div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 400);
    });
  <\/script>
</body>
</html>
  `);

  printWindow.document.close();
}
