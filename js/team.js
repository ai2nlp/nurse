// ─── Team Module State ────────────────────────────────────────────
let editingMemberId = null;
let selectedGroupInModal = 'A';

// ─── Team Entry Point ─────────────────────────────────────────────

function renderTeam() {
  renderMemberList('A');
  renderMemberList('B');
}

// ─── Member List ──────────────────────────────────────────────────

function renderMemberList(group) {
  const listId   = group === 'A' ? 'groupAList'  : 'groupBList';
  const countId  = group === 'A' ? 'groupACount' : 'groupBCount';
  const list     = document.getElementById(listId);
  const countEl  = document.getElementById(countId);
  if (!list) return;

  const members = getGroupMembers(group);
  if (countEl) countEl.textContent = `${members.length} member${members.length !== 1 ? 's' : ''}`;

  list.innerHTML = members.map(m => `
    <li class="member-item glass-panel" draggable="true" data-id="${m.id}">
      <span class="drag-handle" title="Drag to reorder">⠿</span>
      <span class="member-name">${m.name}</span>
      <span class="member-order">Slot ${m.order + 1}</span>
      <div class="member-actions">
        <button class="btn btn-icon btn-sm" title="Edit member" onclick="openMemberModal('${m.id}')">✎</button>
        <button class="btn btn-icon btn-sm" title="Switch to Group ${m.group === 'A' ? 'B' : 'A'}" onclick="switchGroup('${m.id}')">⇄</button>
        <button class="btn btn-icon btn-sm btn-danger-icon" title="Delete member" onclick="deleteMember('${m.id}')">✕</button>
      </div>
    </li>
  `).join('');

  initDragDrop(list);
}

// ─── Drag & Drop Reordering ───────────────────────────────────────

function initDragDrop(list) {
  let dragging = null;

  list.querySelectorAll('.member-item').forEach(item => {
    item.addEventListener('dragstart', e => {
      dragging = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      // Firefox requires dataTransfer.setData for drag to work
      e.dataTransfer.setData('text/plain', item.dataset.id);
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      dragging = null;

      // Re-derive order from current DOM positions
      const groupAttr = list.dataset.group;
      const domItems = [...list.querySelectorAll('.member-item')];
      const s = getState();
      const members = s.members.map(m => ({ ...m })); // shallow clone array + objects

      // Reset order for members in this group based on DOM order
      const newOrder = {};
      domItems.forEach((el, idx) => { newOrder[el.dataset.id] = idx; });

      members.forEach(m => {
        if (m.group === groupAttr && newOrder[m.id] !== undefined) {
          m.order = newOrder[m.id];
        }
      });

      setState({ members });
      renderTeam();
    });

    item.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (!dragging || dragging === item) return;

      const rect = item.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY < midY) {
        list.insertBefore(dragging, item);
      } else {
        list.insertBefore(dragging, item.nextSibling);
      }
    });

    item.addEventListener('dragenter', e => {
      e.preventDefault();
    });
  });
}

// ─── Member Modal ─────────────────────────────────────────────────

function openMemberModal(memberId) {
  editingMemberId = memberId || null;
  const modal      = document.getElementById('memberModal');
  const title      = document.getElementById('memberModalTitle');
  const nameInput  = document.getElementById('memberNameInput');
  if (!modal || !nameInput) return;

  if (memberId) {
    const member = getMemberById(memberId);
    if (!member) return;
    title.textContent     = 'Edit Member';
    nameInput.value       = member.name;
    selectedGroupInModal  = member.group;
  } else {
    title.textContent     = 'Add Member';
    nameInput.value       = '';
    selectedGroupInModal  = 'A';
  }

  updateGroupBtns();
  modal.classList.add('active');
  // Defer focus slightly to let the modal animate in
  setTimeout(() => nameInput.focus(), 80);
}

function updateGroupBtns() {
  document.querySelectorAll('.group-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.group === selectedGroupInModal);
  });
}

// ─── Save Member ──────────────────────────────────────────────────

function saveMember() {
  const nameInput = document.getElementById('memberNameInput');
  if (!nameInput) return;
  const name = nameInput.value.trim();
  if (!name) {
    alert('Please enter a name.');
    nameInput.focus();
    return;
  }

  const s = getState();
  const members = s.members.map(m => ({ ...m })); // clone

  if (editingMemberId) {
    // Editing an existing member
    const idx = members.findIndex(m => m.id === editingMemberId);
    if (idx !== -1) {
      const oldGroup = members[idx].group;
      members[idx] = { ...members[idx], name, group: selectedGroupInModal };
      // If group changed, append to end of new group and compact old group
      if (oldGroup !== selectedGroupInModal) {
        const newGroupMembers = members.filter(m => m.group === selectedGroupInModal);
        members[idx].order = newGroupMembers.length - 1;
        compactGroupOrder(members, oldGroup);
        compactGroupOrder(members, selectedGroupInModal);
      }
    }
  } else {
    // Adding a new member
    const groupMembers = members.filter(m => m.group === selectedGroupInModal);
    members.push({
      id: Date.now().toString(),
      name,
      group: selectedGroupInModal,
      order: groupMembers.length, // append to end
    });
  }

  setState({ members });
  document.getElementById('memberModal').classList.remove('active');
  renderTeam();
}

/**
 * Normalise order values within a group so they are sequential from 0.
 */
function compactGroupOrder(members, group) {
  members
    .filter(m => m.group === group)
    .sort((a, b) => a.order - b.order)
    .forEach((m, idx) => { m.order = idx; });
}

// ─── Delete / Switch Group ────────────────────────────────────────

function deleteMember(id) {
  if (!confirm('Delete this member? Their shift history and overrides will remain in place.')) return;
  const s = getState();
  const members = s.members.filter(m => m.id !== id);
  // Compact remaining orders for both groups
  compactGroupOrder(members, 'A');
  compactGroupOrder(members, 'B');
  setState({ members });
  renderTeam();
  renderDashboard();
}

function switchGroup(id) {
  const s = getState();
  const members = s.members.map(m => ({ ...m }));
  const idx = members.findIndex(m => m.id === id);
  if (idx === -1) return;

  const oldGroup = members[idx].group;
  const newGroup = oldGroup === 'A' ? 'B' : 'A';
  members[idx].group = newGroup;

  // Append to end of destination group
  const destGroupMembers = members.filter((m, i) => m.group === newGroup && i !== idx);
  members[idx].order = destGroupMembers.length;

  // Compact both groups
  compactGroupOrder(members, oldGroup);
  compactGroupOrder(members, newGroup);

  setState({ members });
  renderTeam();
}
