/**
 * storage.js
 * All LocalStorage read/write operations for EduTech Pro
 */

'use strict';

const STORE_KEY = 'EduTech_students';

const Storage = (() => {

  /** Return all students array */
  function getAll() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  /** Find one student by internal id */
  function getById(id) {
    return getAll().find(s => s.id === id) || null;
  }

  /** Find one student by studentId field */
  function getByStudentId(sid) {
    return getAll().find(s => s.studentId === sid) || null;
  }

  /** Find one student by email (case-insensitive) */
  function getByEmail(email) {
    return getAll().find(s => s.email.toLowerCase() === email.toLowerCase()) || null;
  }

  /** Insert a new student record (prepends so newest appears first) */
  function insert(record) {
    const all = getAll();
    all.unshift(record);
    _persist(all);
    return record;
  }

  /** Update an existing student record by id */
  function update(id, data) {
    const all = getAll();
    const idx = all.findIndex(s => s.id === id);
    if (idx === -1) return false;
    all[idx] = { ...all[idx], ...data };
    _persist(all);
    return all[idx];
  }

  /** Remove a student by id */
  function remove(id) {
    const all = getAll();
    const idx = all.findIndex(s => s.id === id);
    if (idx === -1) return false;
    const removed = all.splice(idx, 1)[0];
    _persist(all);
    return removed;
  }

  /** Count total students */
  function count() {
    return getAll().length;
  }

  /** Return counts grouped by gender */
  function countByGender() {
    return getAll().reduce((acc, s) => {
      acc[s.gender] = (acc[s.gender] || 0) + 1;
      return acc;
    }, {});
  }

  /** Return counts grouped by course */
  function countByCourse() {
    return getAll().reduce((acc, s) => {
      acc[s.course] = (acc[s.course] || 0) + 1;
      return acc;
    }, {});
  }

  /** Generate a unique Student ID in format STU-XXXX */
  function generateStudentId() {
    const all = getAll();
    const existing = new Set(all.map(s => s.studentId));
    let id;
    do {
      id = 'STU-' + String(Math.floor(1000 + Math.random() * 9000));
    } while (existing.has(id));
    return id;
  }

  /** Clear all student records (use with caution) */
  function clearAll() {
    localStorage.removeItem(STORE_KEY);
  }

  /** Private: write array back to localStorage */
  function _persist(arr) {
    localStorage.setItem(STORE_KEY, JSON.stringify(arr));
  }

  return {
    getAll, getById, getByStudentId, getByEmail,
    insert, update, remove,
    count, countByGender, countByCourse,
    generateStudentId, clearAll
  };

})();
