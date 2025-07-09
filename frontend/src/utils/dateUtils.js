// ChurchConnect DBMS - Date Utilities
// Date manipulation and formatting utilities

import { DATE_FORMATS } from './constants';

/**
 * Format a date to a readable string
 * @param {Date|string} date - The date to format
 * @param {string} format - The format string
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, format = DATE_FORMATS.DISPLAY) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';

  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  switch (format) {
    case DATE_FORMATS.FULL:
      options.month = 'long';
      break;
    case DATE_FORMATS.SHORT:
      options.month = 'numeric';
      break;
    case DATE_FORMATS.INPUT:
      return dateObj.toISOString().split('T')[0];
    default:
      break;
  }

  return dateObj.toLocaleDateString('en-US', options);
};

/**
 * Calculate age from date of birth
 * @param {Date|string} dateOfBirth - Date of birth
 * @returns {number} - Age in years
 */
export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return 0;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  if (isNaN(birthDate.getTime())) return 0;
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Get age bracket for a given date of birth
 * @param {Date|string} dateOfBirth - Date of birth
 * @returns {string} - Age bracket
 */
export const getAgeBracket = (dateOfBirth) => {
  const age = calculateAge(dateOfBirth);
  
  if (age < 18) return '0-17';
  if (age >= 18 && age <= 25) return '18-25';
  if (age >= 26 && age <= 40) return '26-40';
  if (age >= 41 && age <= 60) return '41-60';
  return '60+';
};

/**
 * Check if a date is in the past
 * @param {Date|string} date - Date to check
 * @returns {boolean} - True if date is in the past
 */
export const isPastDate = (date) => {
  if (!date) return false;
  const dateObj = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dateObj < today;
};

/**
 * Check if a date is in the future
 * @param {Date|string} date - Date to check
 * @returns {boolean} - True if date is in the future
 */
export const isFutureDate = (date) => {
  if (!date) return false;
  const dateObj = new Date(date);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return dateObj > today;
};

/**
 * Check if a date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean} - True if date is today
 */
export const isToday = (date) => {
  if (!date) return false;
  const dateObj = new Date(date);
  const today = new Date();
  
  return dateObj.getDate() === today.getDate() &&
         dateObj.getMonth() === today.getMonth() &&
         dateObj.getFullYear() === today.getFullYear();
};

/**
 * Get relative time string (e.g., "2 days ago", "in 3 hours")
 * @param {Date|string} date - Date to compare
 * @returns {string} - Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);
  
  if (diffInSeconds < 0) {
    // Future date
    const absDiff = Math.abs(diffInSeconds);
    if (absDiff < 60) return 'in a few seconds';
    if (absDiff < 3600) return `in ${Math.floor(absDiff / 60)} minutes`;
    if (absDiff < 86400) return `in ${Math.floor(absDiff / 3600)} hours`;
    if (absDiff < 2592000) return `in ${Math.floor(absDiff / 86400)} days`;
    return formatDate(date);
  }
  
  // Past date
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDate(date);
};

/**
 * Get start and end dates for a given period
 * @param {string} period - Period type (week, month, quarter, year)
 * @param {Date} referenceDate - Reference date (defaults to today)
 * @returns {Object} - Object with start and end dates
 */
export const getPeriodDates = (period, referenceDate = new Date()) => {
  const date = new Date(referenceDate);
  const start = new Date(date);
  const end = new Date(date);
  
  switch (period) {
    case 'week':
      start.setDate(date.getDate() - date.getDay());
      end.setDate(start.getDate() + 6);
      break;
    case 'month':
      start.setDate(1);
      end.setMonth(start.getMonth() + 1);
      end.setDate(0);
      break;
    case 'quarter':
      const quarter = Math.floor(date.getMonth() / 3);
      start.setMonth(quarter * 3);
      start.setDate(1);
      end.setMonth(start.getMonth() + 3);
      end.setDate(0);
      break;
    case 'year':
      start.setMonth(0);
      start.setDate(1);
      end.setMonth(11);
      end.setDate(31);
      break;
    default:
      return { start: date, end: date };
  }
  
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

/**
 * Format a date range for display
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {string} - Formatted date range
 */
export const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';
  
  const startFormatted = formatDate(start);
  const endFormatted = formatDate(end);
  
  if (startFormatted === endFormatted) {
    return startFormatted;
  }
  
  return `${startFormatted} - ${endFormatted}`;
};

/**
 * Get days between two dates
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {number} - Number of days between dates
 */
export const getDaysBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  
  const diffInTime = end.getTime() - start.getTime();
  return Math.ceil(diffInTime / (1000 * 3600 * 24));
};

/**
 * Get the next occurrence of a specific day of the week
 * @param {number} dayOfWeek - Day of week (0 = Sunday, 6 = Saturday)
 * @param {Date} fromDate - Starting date (defaults to today)
 * @returns {Date} - Next occurrence of the specified day
 */
export const getNextDayOfWeek = (dayOfWeek, fromDate = new Date()) => {
  const date = new Date(fromDate);
  const currentDay = date.getDay();
  const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
  
  if (daysUntilTarget === 0) {
    // If today is the target day, return next week
    date.setDate(date.getDate() + 7);
  } else {
    date.setDate(date.getDate() + daysUntilTarget);
  }
  
  return date;
};

/**
 * Convert a date to ISO string for API requests
 * @param {Date|string} date - Date to convert
 * @returns {string} - ISO string or empty string if invalid
 */
export const toISOString = (date) => {
  if (!date) return '';
  const dateObj = new Date(date);
  return isNaN(dateObj.getTime()) ? '' : dateObj.toISOString();
};

/**
 * Parse a date string safely
 * @param {string} dateString - Date string to parse
 * @returns {Date|null} - Parsed date or null if invalid
 */
export const parseDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Check if a year is a leap year
 * @param {number} year - Year to check
 * @returns {boolean} - True if leap year
 */
export const isLeapYear = (year) => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

/**
 * Get the number of days in a month
 * @param {number} month - Month (0-11)
 * @param {number} year - Year
 * @returns {number} - Number of days in the month
 */
export const getDaysInMonth = (month, year) => {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 1 && isLeapYear(year)) {
    return 29;
  }
  return daysInMonth[month];
};

/**
 * Get month name from month number
 * @param {number} month - Month number (0-11)
 * @param {boolean} short - Whether to return short name
 * @returns {string} - Month name
 */
export const getMonthName = (month, short = false) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const shortMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  return short ? shortMonths[month] : months[month];
};

/**
 * Get day name from day number
 * @param {number} day - Day number (0-6, 0 = Sunday)
 * @param {boolean} short - Whether to return short name
 * @returns {string} - Day name
 */
export const getDayName = (day, short = false) => {
  const days = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];
  
  const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return short ? shortDays[day] : days[day];
};

export default {
  formatDate,
  calculateAge,
  getAgeBracket,
  isPastDate,
  isFutureDate,
  isToday,
  getRelativeTime,
  getPeriodDates,
  formatDateRange,
  getDaysBetween,
  getNextDayOfWeek,
  toISOString,
  parseDate,
  isLeapYear,
  getDaysInMonth,
  getMonthName,
  getDayName
};
