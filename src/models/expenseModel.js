// src/models/expenseModel.js
//
// Request bodies (from Postman, exact):
//   category : { name }
//   expense  : { category: <id>, amount: "20.00", note, occurred_on: "YYYY-MM-DD" }
//
// Response fields are not confirmed yet, so reads use likely names.
// Check the console / debug panel to confirm.

// ==========================================================
// HELPERS
// ==========================================================

const toNumber = (value, fallback = 0) => {

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};


// First key that has a real value
const pick = (obj, keys, fallback = '') => {

  if (!obj || typeof obj !== 'object') {
    return fallback;
  }

  for (const key of keys) {

    const value = obj[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      return value;
    }
  }

  return fallback;
};


// Value can be a string or an object like { id, name }
const toText = (value) => {

  if (value && typeof value === 'object') {
    return String(value.name || value.title || '');
  }

  return value === undefined || value === null
    ? ''
    : String(value);
};


const LIST_KEYS = ['results', 'expenses', 'categories', 'items', 'data'];

const findList = (data, keys = LIST_KEYS) => {

  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === 'object') {

    const key = keys.find((k) => Array.isArray(data[k]));

    if (key) {

      console.log('[ExpenseModel] List found under key:', key);

      return data[key];
    }

    if (data.data && typeof data.data === 'object') {
      return findList(data.data, keys);
    }
  }

  console.warn('[ExpenseModel] No list found in response:', data);

  return [];
};


// ==========================================================
// CATEGORY
// ==========================================================

export const fromApiCategory = (raw) => {

  let active = true;

  if (raw?.is_active !== undefined) {
    active = Boolean(raw.is_active);
  } else if (raw?.active !== undefined) {
    active = Boolean(raw.active);
  }

  return {
    id: pick(raw, ['id', 'category_id']),
    name: toText(pick(raw, ['name', 'title'])),
    active,
  };
};

export const fromApiCategoryList = (data) => {

  console.log('[ExpenseModel] fromApiCategoryList input:', data);

  const list = findList(data).map(fromApiCategory);

  console.log('[ExpenseModel] Categories mapped:', list.length);

  return list;
};


// ==========================================================
// EXPENSE
// ==========================================================

export const fromApiExpense = (raw) => {

  const category = raw?.category;

  const categoryIsObject = category && typeof category === 'object';

  return {

    id: pick(raw, ['id', 'expense_id']),

    categoryId: categoryIsObject
      ? (category.id ?? '')
      : (category ?? raw?.category_id ?? ''),

    categoryName: toText(
      pick(
        raw,
        ['category_name', 'category_title'],
        categoryIsObject ? category.name : ''
      )
    ),

    amount: toNumber(pick(raw, ['amount', 'total', 'value']), 0),

    note: toText(pick(raw, ['note', 'notes', 'description'])),

    date: String(
      pick(raw, ['occurred_on', 'date', 'expense_date', 'created_at'])
    ),
  };
};

export const fromApiExpenseList = (data) => {

  console.log('[ExpenseModel] fromApiExpenseList input:', data);

  const rows = findList(data).map(fromApiExpense);

  console.log('[ExpenseModel] Expenses mapped:', rows.length);

  if (rows[0]) {
    console.log('[ExpenseModel] First expense output:', rows[0]);
  }

  return rows;
};


// ==========================================================
// SUMMARY
// ==========================================================

export const fromApiSummary = (data) => {

  console.log('[ExpenseModel] fromApiSummary input:', data);

  const source =
    data && typeof data === 'object' && !Array.isArray(data)
      ? { ...data, ...(data.summary || {}) }
      : {};

  const totalRaw = pick(
    source,
    ['total', 'total_amount', 'total_expense', 'total_expenses', 'grand_total', 'amount'],
    null
  );

  const countRaw = pick(
    source,
    ['count', 'expense_count', 'entries', 'total_entries'],
    null
  );

  const listKey = [
    'by_category',
    'category_totals',
    'category_breakdown',
    'categories',
    'breakdown',
  ].find((k) => Array.isArray(source[k]));

  const byCategory = listKey
    ? source[listKey].map((item) => ({
        name: toText(
          pick(item, ['category_name', 'category', 'name'])
        ),
        amount: toNumber(
          pick(item, ['total', 'amount', 'total_amount'])
        ),
        count: toNumber(pick(item, ['count', 'entries'])),
      }))
    : [];

  const result = {
    total: totalRaw === null ? null : toNumber(totalRaw),
    count: countRaw === null ? null : toNumber(countRaw),
    byCategory,
    raw: data,
  };

  console.log('[ExpenseModel] fromApiSummary output:', result);

  return result;
};


// ==========================================================
// UI -> API
// Only fields that are provided are sent (safe for PATCH)
// ==========================================================

export const toApiExpensePayload = (input = {}) => {

  const payload = {};

  if (input.categoryId !== undefined && input.categoryId !== '') {
    payload.category = Number(input.categoryId);
  }

  if (input.amount !== undefined && input.amount !== '') {
    payload.amount = toNumber(input.amount).toFixed(2);
  }

  if (input.note !== undefined) {
    payload.note = String(input.note).trim();
  }

  if (input.date !== undefined && input.date !== '') {
    payload.occurred_on = input.date;
  }

  console.log('[ExpenseModel] toApiExpensePayload output:', payload);

  return payload;
};