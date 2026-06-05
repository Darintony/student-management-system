/**
 * common.js
 * Shared utilities used across all pages:
 *  - HTML escaping
 *  - Avatar helpers
 *  - Toast notification system
 *  - Modal open/close
 *  - Active nav link highlight
 *  - Sidebar toggle (mobile)
 */

'use strict';

/* ─────────────────────────────────────────
   HTML ESCAPING
───────────────────────────────────────── */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ─────────────────────────────────────────
   AVATAR HELPERS
───────────────────────────────────────── */
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#2563eb,#60a5fa)',
  'linear-gradient(135deg,#7c3aed,#a78bfa)',
  'linear-gradient(135deg,#db2777,#f472b6)',
  'linear-gradient(135deg,#059669,#34d399)',
  'linear-gradient(135deg,#d97706,#fbbf24)',
  'linear-gradient(135deg,#0284c7,#38bdf8)',
];

function avatarGrad(name) {
  const n = (name && name.length) ? name : '?';
  return AVATAR_GRADIENTS[n.charCodeAt(0) % AVATAR_GRADIENTS.length];
}

function initials(name) {
  return (name || '?')
    .trim()
    .split(/\s+/)
    .map(p => p[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
}

/**
 * Returns an <img> or a <div> avatar HTML string.
 * @param {Object} student
 * @param {number} size - px
 * @param {string} radius - CSS border-radius
 */
function avatarHTML(student, size = 34, radius = '8px') {
  const s = student || {};
  if (s.photo) {
    return `<img src="${esc(s.photo)}" alt="${esc(s.name)}" style="width:${size}px;height:${size}px;border-radius:${radius};object-fit:cover;border:2px solid var(--border);display:block;">`;
  }
  const grad = avatarGrad(s.name);
  const init = initials(s.name);
  const fs   = Math.round(size * 0.37);
  return `<div style="width:${size}px;height:${size}px;border-radius:${radius};background:${grad};display:flex;align-items:center;justify-content:center;font-size:${fs}px;font-weight:800;color:#fff;flex-shrink:0;">${esc(init)}</div>`;
}

function genderBadgeHTML(g) {
  const map = {
    Male:   'badge-male',
    Female: 'badge-female',
    Other:  'badge-other',
  };
  return `<span class="badge ${map[g] || 'badge-other'}">${esc(g)}</span>`;
}

/* ─────────────────────────────────────────
   TOAST NOTIFICATIONS  (top-left)
───────────────────────────────────────── */
(function initToasts() {
  if (document.getElementById('toastWrap')) return;
  const wrap = document.createElement('div');
  wrap.id = 'toastWrap';
  wrap.className = 'toast-wrap';
  document.body.appendChild(wrap);
})();

/**
 * Show a toast.
 * @param {string} title
 * @param {string} msg
 * @param {'success'|'error'|'warning'|'info'} type
 */
function toast(title, msg, type = 'info') {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const wrap  = document.getElementById('toastWrap');
  if (!wrap) return;

  const key = `${type}|${title}|${msg}`;
  const existing = Array.from(wrap.children).find(el => el.dataset.toastKey === key);

  if (existing) {
    clearTimeout(existing._timer);
    existing.classList.remove('toast-out');
    existing._timer = setTimeout(() => dismissToast(existing), 4500);
    wrap.appendChild(existing);
    return;
  }

  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.dataset.toastKey = key;
  el.setAttribute('role', 'alert');
  el.innerHTML = `
    <div class="toast-icon-wrap">${icons[type] || icons.info}</div>
    <div class="toast-body">
      <div class="toast-title">${esc(title)}</div>
      <div class="toast-msg">${esc(msg)}</div>
    </div>
    <button class="toast-close" aria-label="Dismiss">✕</button>
  `;

  el.querySelector('.toast-close').addEventListener('click', () => dismissToast(el));
  wrap.appendChild(el);

  // Auto-dismiss after 4.5 s
  const timer = setTimeout(() => dismissToast(el), 4500);
  el._timer = timer;
}

function dismissToast(el) {
  if (!el || !el.parentElement) return;
  clearTimeout(el._timer);
  el.classList.add('toast-out');
  setTimeout(() => el.remove(), 300);
}

/* ─────────────────────────────────────────
   MODAL HELPERS
───────────────────────────────────────── */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

/** Close modal when clicking the backdrop */
document.addEventListener('click', e => {
  if (e.target.classList.contains('overlay')) {
    e.target.classList.remove('open');
  }
});

/** Close modals on Escape */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.overlay.open').forEach(el => el.classList.remove('open'));
  }
});

/* ─────────────────────────────────────────
   SIDEBAR TOGGLE (mobile)
───────────────────────────────────────── */
function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
  document.getElementById('sbBackdrop')?.classList.toggle('open');
}

function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sbBackdrop')?.classList.remove('open');
}

/* ─────────────────────────────────────────
   ACTIVE NAV HIGHLIGHT
───────────────────────────────────────── */
(function highlightNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = (link.getAttribute('href') || '').split('/').pop();
    if (href === page) link.classList.add('active');
    else link.classList.remove('active');
  });
})();

/* ─────────────────────────────────────────
   STUDENT COUNT BADGE in sidebar
───────────────────────────────────────── */
function updateNavBadge() {
  const badge = document.getElementById('navCount');
  if (badge && typeof Storage !== 'undefined') {
    badge.textContent = Storage.count();
  }
}

/* ─────────────────────────────────────────
   DATE FORMATTING
───────────────────────────────────────── */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

/* ─────────────────────────────────────────
   QUICK SEARCH (topbar → redirect to students.html)
───────────────────────────────────────── */
function initQuickSearch() {
  const input = document.getElementById('quickSearchInput');
  if (!input) return;
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && input.value.trim()) {
      const q = encodeURIComponent(input.value.trim());
      window.location.href = `students.html?q=${q}`;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updateNavBadge();
  initQuickSearch();
});
