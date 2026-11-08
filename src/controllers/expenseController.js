// src/controllers/expenseController.js

import {
  API_ENDPOINTS,
  STORAGE_KEYS,
} from '../constants/apiConstants';

import {
  fromApiCategory,
  fromApiCategoryList,
  fromApiExpense,
  fromApiExpenseList,
  fromApiSummary,
  toApiExpensePayload,
} from '../models/expenseModel';

import { flattenFields } from '../utils/debugFields';

// Safety limit when following the API's "next" pages
const MAX_PAGES = 100;


// ==========================================================
// REQUEST HELPER
// ==========================================================

const request = async (label, url, options = {}) => {

  console.log('========================================');
  console.log(`[ExpenseController] ${label} START`);

  const method = options.method || 'GET';

  console.log('[ExpenseController] Method:', method);
  console.log('[ExpenseController] URL:', url);

  if (options.body) {
    console.log('[ExpenseController] Body:', options.body);
  }

  try {

    const headers = {};

    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('[ExpenseController] No access token found');
    }

    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      method,
      headers,
    });

    console.log('[ExpenseController] Status:', response.status);

    // DELETE returns no body (204), so read as text first
    const text = await response.text();

    let data = null;

    if (text) {

      try {

        data = JSON.parse(text);

      } catch (parseError) {

        data = text;
      }
    }

    console.log('[ExpenseController] Response:', data);

    if (data && typeof data === 'object') {
      console.log('[ExpenseController] ALL FIELDS (path / type / value):');
      console.table(flattenFields(data));
    }

    if (!response.ok) {

      const message =
        data?.detail ||
        data?.message ||
        (data && typeof data === 'object'
          ? JSON.stringify(data)
          : data) ||
        `Request failed (${response.status})`;

      throw new Error(message);
    }

    return data;

  } catch (error) {

    console.error(`[ExpenseController] ${label} ERROR:`, error);

    throw error;

  } finally {

    console.log(`[ExpenseController] ${label} END`);
    console.log('========================================');
  }
};


// ==========================================================
// FILTER -> QUERY STRING
// period: 'month' (month=YYYY-MM)
//         'date'  (date=YYYY-MM-DD)
//         'range' (start_date & end_date)
// ==========================================================

const buildQuery = ({ period, month, date, startDate, endDate } = {}) => {

  const params = new URLSearchParams();

  if (period === 'date') {
    params.append('date', date);
  } else if (period === 'range') {
    params.append('start_date', startDate);
    params.append('end_date', endDate);
  } else {
    params.append('month', month);
  }

  return params.toString();
};


// "next" from the API is a full URL. Keep only its query string
// (?month=...&page=2) so the request always goes to our own base URL.
const nextSearch = (nextUrl) => {

  try {

    return new URL(nextUrl, window.location.origin).search;

  } catch (error) {

    console.warn('[ExpenseController] Could not read next URL:', nextUrl);

    return '';
  }
};


// ==========================================================
// CATEGORIES
// ==========================================================

// GET /api/mobile/expense-categories/
export const getExpenseCategories = async () => {

  const data = await request(
    'LIST EXPENSE CATEGORIES',
    API_ENDPOINTS.EXPENSES.CATEGORIES
  );

  return { items: fromApiCategoryList(data), raw: data };
};


// POST /api/mobile/expense-categories/   { name }
export const createExpenseCategory = async (name) => {

  const data = await request(
    'CREATE EXPENSE CATEGORY',
    API_ENDPOINTS.EXPENSES.CATEGORIES,
    {
      method: 'POST',
      body: JSON.stringify({ name: String(name).trim() }),
    }
  );

  return fromApiCategory(data);
};


// PATCH /api/mobile/expense-categories/{id}/   { name }
export const updateExpenseCategory = async (id, name) => {

  const data = await request(
    'UPDATE EXPENSE CATEGORY',
    API_ENDPOINTS.EXPENSES.CATEGORY_DETAIL(id),
    {
      method: 'PATCH',
      body: JSON.stringify({ name: String(name).trim() }),
    }
  );

  return fromApiCategory(data);
};


// DELETE /api/mobile/expense-categories/{id}/   (deactivates)
export const deactivateExpenseCategory = async (id) => {

  await request(
    'DEACTIVATE EXPENSE CATEGORY',
    API_ENDPOINTS.EXPENSES.CATEGORY_DETAIL(id),
    { method: 'DELETE' }
  );

  return true;
};


// ==========================================================
// EXPENSES
// ==========================================================

// GET /api/mobile/expenses/?month= | ?date= | ?start_date=&end_date=
// Loads EVERY page (follows "next") so totals and category
// cards are always for the whole period.
export const getExpenses = async (filter) => {

  let url = `${API_ENDPOINTS.EXPENSES.LIST}?${buildQuery(filter)}`;

  const rows = [];

  const seen = new Set();

  let firstRaw = null;

  let pages = 0;

  while (url && pages < MAX_PAGES) {

    pages += 1;

    const data = await request(`LIST EXPENSES (page ${pages})`, url);

    if (pages === 1) {
      firstRaw = data;
    }

    const batch = fromApiExpenseList(data);

    let added = 0;

    batch.forEach((row) => {

      const key = String(row.id);

      if (seen.has(key)) return;

      seen.add(key);

      rows.push(row);

      added += 1;
    });

    const next = data && typeof data === 'object' ? data.next : null;

    // stop when there is no next page, or a page added nothing new
    if (!next || added === 0) break;

    const search = nextSearch(next);

    url = search ? `${API_ENDPOINTS.EXPENSES.LIST}${search}` : null;
  }

  console.log(
    '[ExpenseController] Expenses loaded:',
    rows.length,
    'rows from',
    pages,
    'page(s)'
  );

  return { rows, raw: firstRaw, pages };
};


// GET /api/mobile/expenses/summary/?month= | ?date= | ?start_date=&end_date=
export const getExpenseSummary = async (filter) => {

  const data = await request(
    'EXPENSE SUMMARY',
    `${API_ENDPOINTS.EXPENSES.SUMMARY}?${buildQuery(filter)}`
  );

  return fromApiSummary(data);
};


// POST /api/mobile/expenses/
export const addExpense = async (input) => {

  const data = await request(
    'ADD EXPENSE',
    API_ENDPOINTS.EXPENSES.LIST,
    {
      method: 'POST',
      body: JSON.stringify(toApiExpensePayload(input)),
    }
  );

  return fromApiExpense(data);
};


// PATCH /api/mobile/expenses/{id}/
export const updateExpense = async (id, input) => {

  const data = await request(
    'UPDATE EXPENSE',
    API_ENDPOINTS.EXPENSES.DETAIL(id),
    {
      method: 'PATCH',
      body: JSON.stringify(toApiExpensePayload(input)),
    }
  );

  return fromApiExpense(data);
};


// DELETE /api/mobile/expenses/{id}/
export const deleteExpense = async (id) => {

  await request(
    'DELETE EXPENSE',
    API_ENDPOINTS.EXPENSES.DETAIL(id),
    { method: 'DELETE' }
  );

  return true;
};