/**
 * student.js
 * Handles:
 *  - Registration form (add + edit)
 *  - Student list rendering + search/filter
 *  - View modal
 *  - Delete confirmation
 *  - Photo upload
 */

'use strict';

/* ═══════════════════════════════════════════
   SHARED STATE
═══════════════════════════════════════════ */
let editingId    = null;
let currentPhoto = null; // base64 string or null

/* ═══════════════════════════════════════════
   PHOTO UPLOAD
═══════════════════════════════════════════ */
function initPhotoZone() {
  const zone  = document.getElementById('photoZone');
  const input = document.getElementById('photoInput');
  if (!zone || !input) return;

  zone.addEventListener('click', () => input.click());

  // Drag & drop
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) processPhotoFile(file);
  });

  input.addEventListener('change', () => {
    if (input.files[0]) processPhotoFile(input.files[0]);
  });
}

function processPhotoFile(file) {
  if (!file.type.startsWith('image/')) {
    toast('Invalid File', 'Please upload an image file (JPG, PNG, WebP).', 'warning');
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    toast('File Too Large', 'Please choose an image under 2 MB.', 'warning');
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    currentPhoto = e.target.result;
    renderPhotoPreview(currentPhoto);
  };
  reader.readAsDataURL(file);
}

function renderPhotoPreview(src) {
  const zone = document.getElementById('photoZone');
  if (!zone) return;
  if (src) {
    zone.innerHTML = `
      <img src="${src}" alt="Student photo preview">
      <button type="button" class="photo-remove" id="photoRemoveBtn" title="Remove photo">✕</button>`;
    document.getElementById('photoRemoveBtn').addEventListener('click', e => {
      e.stopPropagation();
      currentPhoto = null;
      renderPhotoPreview(null);
    });
  } else {
    zone.innerHTML = `
      <div class="photo-placeholder">
        <span class="photo-icon">📷</span>
        <span>Click or drag & drop<br>to upload photo</span>
        <span class="photo-hint">JPG, PNG, WebP · Max 2 MB</span>
      </div>`;
  }
}

/* ═══════════════════════════════════════════
   STUDENT ID
═══════════════════════════════════════════ */
function regenStudentId() {
  if (editingId) return; // Don't change ID while editing
  const input = document.getElementById('fStudentId');
  if (input) input.value = Storage.generateStudentId();
}

/* ═══════════════════════════════════════════
   FORM — ERROR DISPLAY
═══════════════════════════════════════════ */
function clearFormErrors() {
  document.querySelectorAll('.ferr').forEach(el => el.textContent = '');
  document.querySelectorAll('.fcontrol').forEach(el => el.classList.remove('is-error'));
}

function showFormErrors(errors) {
  // Map field keys to DOM ids
  const fieldMap = {
    studentId: { err: 'e-studentId', input: 'fStudentId' },
    fullName:  { err: 'e-fullName',  input: 'fFullName'  },
    email:     { err: 'e-email',     input: 'fEmail'     },
    phone:     { err: 'e-phone',     input: 'fPhone'     },
    gender:    { err: 'e-gender',    input: 'fGender'    },
    dob:       { err: 'e-dob',       input: 'fDob'       },
    course:    { err: 'e-course',    input: 'fCourse'    },
    address:   { err: 'e-address',   input: 'fAddress'   },
  };
  for (const [field, msg] of Object.entries(errors)) {
    const map = fieldMap[field];
    if (!map) continue;
    const errEl   = document.getElementById(map.err);
    const inputEl = document.getElementById(map.input);
    if (errEl)   errEl.textContent = msg;
    if (inputEl) inputEl.classList.add('is-error');
  }
}

/* ═══════════════════════════════════════════
   FORM — READ VALUES
═══════════════════════════════════════════ */
function readFormData() {
  return {
    studentId: (document.getElementById('fStudentId')?.value || '').trim(),
    fullName:  (document.getElementById('fFullName')?.value  || '').trim(),
    email:     (document.getElementById('fEmail')?.value     || '').trim(),
    phone:     (document.getElementById('fPhone')?.value     || '').trim(),
    gender:    (document.getElementById('fGender')?.value    || ''),
    dob:       (document.getElementById('fDob')?.value       || ''),
    course:    (document.getElementById('fCourse')?.value    || ''),
    address:   (document.getElementById('fAddress')?.value   || '').trim(),
  };
}

/* ═══════════════════════════════════════════
   FORM — SUBMIT
═══════════════════════════════════════════ */
function submitForm() {
  clearFormErrors();
  const data   = readFormData();
  const result = Validation.validateAll(data, { editingId });

  if (!result.valid) {
    showFormErrors(result.errors);
    toast('Validation Error', 'Please fix the highlighted fields.', 'error');
    return;
  }

  const record = {
    id:        editingId || Date.now().toString(),
    studentId: data.studentId,
    name:      data.fullName,
    email:     data.email,
    phone:     data.phone,
    gender:    data.gender,
    dob:       data.dob,
    course:    data.course,
    address:   data.address,
    photo:     currentPhoto,
    createdAt: editingId
      ? (Storage.getById(editingId) || {}).createdAt
      : new Date().toISOString(),
  };

  if (editingId) {
    Storage.update(editingId, record);
    toast('Student Updated', `${data.fullName}'s record has been updated.`, 'success');
  } else {
    Storage.insert(record);
    toast('Student Registered', `${data.fullName} enrolled successfully.`, 'success');
  }

  clearForm();
  updateNavBadge();

  // Redirect to list after a brief delay so toast is visible
  setTimeout(() => { window.location.href = 'students.html'; }, 800);
}

/* ═══════════════════════════════════════════
   FORM — CLEAR / RESET
═══════════════════════════════════════════ */
function clearForm() {
  const form = document.getElementById('studentForm');
  if (form) form.reset();
  clearFormErrors();
  editingId    = null;
  currentPhoto = null;
  renderPhotoPreview(null);
  const photoInput = document.getElementById('photoInput');
  if (photoInput) photoInput.value = '';
  updateAddrCount();
  regenStudentId();

  // Reset heading & button
  setFormMode('add');
}

function setFormMode(mode, studentName = '') {
  const heading = document.getElementById('formHeading');
  const sub     = document.getElementById('formSubheading');
  const btnTxt  = document.getElementById('submitBtnTxt');
  if (mode === 'edit') {
    if (heading) heading.textContent = 'Edit Student Record';
    if (sub)     sub.textContent     = `Editing record for ${studentName}`;
    if (btnTxt)  btnTxt.textContent  = '✦ Update Student';
  } else {
    if (heading) heading.textContent = 'Register New Student';
    if (sub)     sub.textContent     = 'Fill in all fields to enrol a student';
    if (btnTxt)  btnTxt.textContent  = '✦ Register Student';
  }
}

/* ═══════════════════════════════════════════
   ADDRESS CHARACTER COUNTER
═══════════════════════════════════════════ */
function updateAddrCount() {
  const area  = document.getElementById('fAddress');
  const count = document.getElementById('addrCount');
  if (!area || !count) return;
  const len = area.value.length;
  count.textContent = `${len} / 200`;
  count.className   = 'char-count' + (len > 170 ? ' warn' : '');
}

/* ═══════════════════════════════════════════
   LOAD EDIT DATA (called from students.html)
═══════════════════════════════════════════ */
function loadEditStudent(id) {
  const s = Storage.getById(id);
  if (!s) { toast('Not Found', 'Student record not found.', 'error'); return; }

  editingId    = id;
  currentPhoto = s.photo || null;

  document.getElementById('fStudentId').value = s.studentId;
  document.getElementById('fFullName').value  = s.name;
  document.getElementById('fEmail').value     = s.email;
  document.getElementById('fPhone').value     = s.phone;
  document.getElementById('fGender').value    = s.gender;
  document.getElementById('fDob').value       = s.dob;
  document.getElementById('fCourse').value    = s.course;
  document.getElementById('fAddress').value   = s.address;
  updateAddrCount();
  renderPhotoPreview(currentPhoto);
  setFormMode('edit', s.name);
}

/* ═══════════════════════════════════════════
   STUDENT LIST RENDERING
═══════════════════════════════════════════ */
function renderStudentTable(list) {
  const tbody = document.getElementById('tblBody');
  if (!tbody) return;

  if (!list.length) {
    const allCount = Storage.count();
    tbody.innerHTML = `
      <tr><td colspan="8">
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-title">${allCount ? 'No matching students found' : 'No students registered yet'}</div>
          <div class="empty-sub">${allCount ? 'Try adjusting your search or filters.' : 'Click "Add Student" to register the first one.'}</div>
          ${!allCount ? `<a href="index.html" class="btn btn-primary" style="margin-top:12px">➕ Register First Student</a>` : ''}
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(s => `
    <tr>
      <td>${avatarHTML(s, 36, '9px')}</td>
      <td><strong class="sid-cell">${esc(s.studentId)}</strong></td>
      <td><span class="name-cell">${esc(s.name)}</span></td>
      <td class="dim-cell">${esc(s.email)}</td>
      <td class="dim-cell">${esc(s.phone)}</td>
      <td>${genderBadgeHTML(s.gender)}</td>
      <td class="dim-cell course-cell">${esc(s.course)}</td>
      <td>
        <div class="act-row">
          <button class="btn btn-icon btn-view"   title="View"   data-id="${esc(s.id)}">👁</button>
          <button class="btn btn-icon btn-edit"   title="Edit"   data-id="${esc(s.id)}">✎</button>
          <button class="btn btn-icon btn-delete" title="Delete" data-id="${esc(s.id)}">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');

  // Attach action listeners
  tbody.querySelectorAll('.btn-view').forEach(btn =>
    btn.addEventListener('click', () => openViewModal(btn.dataset.id)));
  tbody.querySelectorAll('.btn-edit').forEach(btn =>
    btn.addEventListener('click', () => redirectToEdit(btn.dataset.id)));
  tbody.querySelectorAll('.btn-delete').forEach(btn =>
    btn.addEventListener('click', () => openDeleteConfirm(btn.dataset.id)));
}

/* ═══════════════════════════════════════════
   SEARCH & FILTER
═══════════════════════════════════════════ */
function applyFilters() {
  const q      = (document.getElementById('listSearch')?.value || '').toLowerCase();
  const gender = document.getElementById('fltGender')?.value  || '';
  const course = document.getElementById('fltCourse')?.value  || '';

  const all      = Storage.getAll();
  const filtered = all.filter(s => {
    const mQ = !q || [s.studentId, s.name, s.email, s.course].some(v => (v||'').toLowerCase().includes(q));
    const mG = !gender || s.gender === gender;
    const mC = !course  || s.course === course;
    return mQ && mG && mC;
  });

  renderStudentTable(filtered);

  const info = document.getElementById('resultsInfo');
  if (info) info.textContent = `Showing ${filtered.length} of ${all.length} student${all.length !== 1 ? 's' : ''}`;
}

/* ═══════════════════════════════════════════
   VIEW MODAL
═══════════════════════════════════════════ */
function openViewModal(id) {
  const s = Storage.getById(id);
  if (!s) return;

  const photoEl = s.photo
    ? `<img src="${esc(s.photo)}" class="detail-photo" alt="${esc(s.name)}">`
    : `<div class="detail-avatar" style="background:${avatarGrad(s.name)}">${esc(initials(s.name))}</div>`;

  document.getElementById('viewModalBody').innerHTML = `
    <div class="detail-hero">
      ${photoEl}
      <div class="detail-hero-info">
        <h3>${esc(s.name)}</h3>
        <p>${esc(s.studentId)} &nbsp;·&nbsp; ${esc(s.course)}</p>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
          <span class="badge badge-active">● Active</span>
          ${genderBadgeHTML(s.gender)}
        </div>
      </div>
    </div>
    <div class="detail-grid">
      <div class="df"><div class="df-label">Student ID</div><div class="df-value">${esc(s.studentId)}</div></div>
      <div class="df"><div class="df-label">Full Name</div><div class="df-value">${esc(s.name)}</div></div>
      <div class="df"><div class="df-label">Email Address</div><div class="df-value" style="font-size:13px;word-break:break-all">${esc(s.email)}</div></div>
      <div class="df"><div class="df-label">Phone Number</div><div class="df-value">${esc(s.phone)}</div></div>
      <div class="df"><div class="df-label">Gender</div><div class="df-value">${genderBadgeHTML(s.gender)}</div></div>
      <div class="df"><div class="df-label">Date of Birth</div><div class="df-value">${formatDate(s.dob)}</div></div>
      <div class="df df-full"><div class="df-label">Course</div><div class="df-value">${esc(s.course)}</div></div>
      <div class="df df-full"><div class="df-label">Address</div><div class="df-value df-value--light">${esc(s.address)}</div></div>
    </div>
  `;
  openModal('viewOverlay');
}

/* ═══════════════════════════════════════════
   EDIT — redirect to index.html?edit=id
═══════════════════════════════════════════ */
function redirectToEdit(id) {
  window.location.href = `index.html?edit=${encodeURIComponent(id)}`;
}

/* ═══════════════════════════════════════════
   DELETE CONFIRM MODAL
═══════════════════════════════════════════ */
function openDeleteConfirm(id) {
  const s = Storage.getById(id);
  if (!s) return;
  const sub = document.getElementById('delConfirmSub');
  if (sub) sub.textContent = `Are you sure you want to permanently delete the record for "${s.name}" (${s.studentId})? This action cannot be undone.`;
  const btn = document.getElementById('delConfirmBtn');
  if (btn) {
    btn.onclick = () => {
      Storage.remove(id);
      closeModal('delOverlay');
      updateNavBadge();
      applyFilters();
      toast('Student Deleted', `${s.name}'s record has been removed.`, 'error');
    };
  }
  openModal('delOverlay');
}

/* ═══════════════════════════════════════════
   PAGE INIT
═══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  const page = location.pathname.split('/').pop() || 'index.html';

  // ── Registration form page (index.html) ──
  if (page === 'index.html' || page === '') {
    initPhotoZone();
    renderPhotoPreview(null);
    regenStudentId();
    updateAddrCount();

    document.getElementById('fAddress')?.addEventListener('input', updateAddrCount);
    document.getElementById('submitBtn')?.addEventListener('click', submitForm);
    document.getElementById('clearBtn')?.addEventListener('click', clearForm);
    document.getElementById('regenBtn')?.addEventListener('click', regenStudentId);

    // Real-time validation clear on input
    ['fStudentId','fFullName','fEmail','fPhone','fGender','fDob','fCourse','fAddress'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => {
        const errId = 'e-' + id.replace(/^f/, '').replace(/^(.)/, c => c.toLowerCase());
        // map
        const errMap = {
          fStudentId: 'e-studentId', fFullName: 'e-fullName', fEmail: 'e-email',
          fPhone: 'e-phone', fGender: 'e-gender', fDob: 'e-dob',
          fCourse: 'e-course', fAddress: 'e-address'
        };
        const errEl   = document.getElementById(errMap[id]);
        const inputEl = document.getElementById(id);
        if (errEl)   errEl.textContent = '';
        if (inputEl) inputEl.classList.remove('is-error');
      });
    });

    // Check for ?edit= query param
    const params = new URLSearchParams(location.search);
    const editId = params.get('edit');
    if (editId) loadEditStudent(editId);
  }

  // ── Student list page (students.html) ──
  if (page === 'students.html') {
    // Pre-fill search from ?q= param
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) {
      const searchEl = document.getElementById('listSearch');
      if (searchEl) searchEl.value = q;
    }

    applyFilters();

    document.getElementById('listSearch')?.addEventListener('input', applyFilters);
    document.getElementById('fltGender')?.addEventListener('change', applyFilters);
    document.getElementById('fltCourse')?.addEventListener('change', applyFilters);
  }
});
