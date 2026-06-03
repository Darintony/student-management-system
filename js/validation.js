/**
 * validation.js
 * Pure validation functions — no DOM side effects.
 * Each function returns { valid: boolean, message: string }
 */

'use strict';

const Validation = (() => {

  const COURSES = [
    'Computer Science', 'Information Technology', 'Business Administration',
    'Mechanical Engineering', 'Electrical Engineering', 'Civil Engineering',
    'Data Science', 'Psychology', 'Mathematics', 'Physics'
  ];

  const GENDERS = ['Male', 'Female', 'Other'];

  /** Validate Student ID format (non-empty, unique enforced externally) */
  function studentId(value) {
    if (!value || !value.trim()) return { valid: false, message: 'Student ID is required.' };
    return { valid: true, message: '' };
  }

  /** Full name: required, letters + spaces only */
  function fullName(value) {
    if (!value || !value.trim()) return { valid: false, message: 'Full name is required.' };
    if (!/^[a-zA-Z\s]+$/.test(value.trim())) return { valid: false, message: 'Name must contain only letters and spaces.' };
    if (value.trim().length < 2) return { valid: false, message: 'Name must be at least 2 characters.' };
    return { valid: true, message: '' };
  }

  /** Email: required, valid format */
  function email(value) {
    if (!value || !value.trim()) return { valid: false, message: 'Email address is required.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return { valid: false, message: 'Enter a valid email address.' };
    return { valid: true, message: '' };
  }

  /** Phone: required, exactly 10 digits */
  function phone(value) {
    if (!value || !value.trim()) return { valid: false, message: 'Phone number is required.' };
    if (!/^\d{10}$/.test(value.trim())) return { valid: false, message: 'Phone number must be exactly 10 digits.' };
    return { valid: true, message: '' };
  }

  /** Gender: must be one of allowed values */
  function gender(value) {
    if (!value || !GENDERS.includes(value)) return { valid: false, message: 'Please select a gender.' };
    return { valid: true, message: '' };
  }

  /** Date of birth: required, must be a past date */
  function dateOfBirth(value) {
    if (!value) return { valid: false, message: 'Date of birth is required.' };
    const dob = new Date(value);
    if (isNaN(dob.getTime())) return { valid: false, message: 'Enter a valid date.' };
    if (dob >= new Date()) return { valid: false, message: 'Date of birth must be in the past.' };
    return { valid: true, message: '' };
  }

  /** Course: must be one of the defined list */
  function course(value) {
    if (!value || !COURSES.includes(value)) return { valid: false, message: 'Please select a course.' };
    return { valid: true, message: '' };
  }

  /** Address: required, max 200 characters */
  function address(value) {
    if (!value || !value.trim()) return { valid: false, message: 'Address is required.' };
    if (value.trim().length > 200) return { valid: false, message: 'Address must not exceed 200 characters.' };
    return { valid: true, message: '' };
  }

  /**
   * Validate entire form data object.
   * Returns { valid: boolean, errors: { fieldId: message } }
   *
   * @param {Object} data - form field values
   * @param {Object} opts - { editingId: string|null } for uniqueness checks
   */
  function validateAll(data, opts = {}) {
    const errors = {};
    let valid = true;

    const checks = [
      ['studentId', studentId(data.studentId)],
      ['fullName',  fullName(data.fullName)],
      ['email',     email(data.email)],
      ['phone',     phone(data.phone)],
      ['gender',    gender(data.gender)],
      ['dob',       dateOfBirth(data.dob)],
      ['course',    course(data.course)],
      ['address',   address(data.address)],
    ];

    for (const [field, result] of checks) {
      if (!result.valid) {
        errors[field] = result.message;
        valid = false;
      }
    }

    // Uniqueness checks (require Storage to be loaded)
    if (typeof Storage !== 'undefined') {
      if (!errors.studentId) {
        const existing = Storage.getByStudentId(data.studentId);
        if (existing && existing.id !== opts.editingId) {
          errors.studentId = 'This Student ID is already taken.';
          valid = false;
        }
      }
      if (!errors.email) {
        const existing = Storage.getByEmail(data.email);
        if (existing && existing.id !== opts.editingId) {
          errors.email = 'This email is already registered.';
          valid = false;
        }
      }
    }

    return { valid, errors };
  }

  return {
    studentId, fullName, email, phone,
    gender, dateOfBirth, course, address,
    validateAll, COURSES, GENDERS
  };

})();
