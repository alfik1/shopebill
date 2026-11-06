// src/controllers/collectionController.js

import {
  API_ENDPOINTS,
  STORAGE_KEYS,
} from '../constants/apiConstants';

import {
  collectionResponseFromApi,
  paymentAmountFor,
} from '../models/collectionModel';

export class CollectionError extends Error {}


// ------------------------------------------------------------
// Date helpers
// date  = 'YYYY-MM-DD'   month = 'YYYY-MM'   (from the inputs)
// ------------------------------------------------------------

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const formatDisplayDate = (value) => {

  const [y, m, d] = String(value).split('-').map(Number);

  if (!y || !m || !d) return String(value);

  return `${MONTHS_SHORT[m - 1]} ${d}, ${y}`;
};

export const formatDisplayMonth = (value) => {

  const [y, m] = String(value).split('-').map(Number);

  if (!y || !m) return String(value);

  return `${MONTHS_FULL[m - 1]} ${y}`;
};

export const formatBillDateTime = (date) => {

  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '-';
  }

  let hour = date.getHours() % 12;
  hour = hour === 0 ? 12 : hour;

  const period = date.getHours() >= 12 ? 'PM' : 'AM';

  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}, ${hour}:${minute} ${period}`;
};


// ------------------------------------------------------------
// Category -> icon
// ------------------------------------------------------------
const iconForCategory = (name) => {

  const value = String(name || '').toLowerCase();

  if (value.includes('jean') || value.includes('pant')) return '👖';
  if (value.includes('cap')) return '🧢';
  if (value.includes('inner')) return '🩲';
  if (value.includes('shirt') || value.includes('sleev')) return '👕';

  return '📦';
};


// ------------------------------------------------------------
// Payment method label
// ------------------------------------------------------------
const formatPaymentMethod = (method) => {

  const value = String(method || '').toLowerCase();

  switch (value) {
    case 'upi': return 'UPI';
    case 'cash': return 'Cash';
    case 'card': return 'Card';
    case 'mixed': return 'Mixed';
    default:
      if (!method) return 'Unknown';
      return method[0].toUpperCase() + method.slice(1);
  }
};


// ------------------------------------------------------------
// Payment breakdown rows: always UPI + Cash, then any other
// method the API sends (card, mixed, ...)
// ------------------------------------------------------------
const buildPaymentRows = (breakdown, total) => {

  const rows = {};

  ['upi', 'cash'].forEach((key) => {
    rows[key] = { key, label: formatPaymentMethod(key), amount: 0, percent: 0 };
  });

  breakdown.forEach((item) => {

    const key = item.method.toLowerCase() || 'other';

    rows[key] = rows[key] || {
      key,
      label: formatPaymentMethod(item.method),
      amount: 0,
      percent: 0,
    };

    rows[key].amount += item.amount;

    rows[key].percent += item.percent;
  });

  return Object.values(rows).map((row) => ({
    ...row,
    // use API percent, fall back to our own calculation
    percent:
      row.percent > 0
        ? Math.round(row.percent)
        : total > 0
          ? Math.round((row.amount / total) * 100)
          : 0,
  }));
};


// ------------------------------------------------------------
// Map categories / bills
// ------------------------------------------------------------
const mapCategories = (categories) =>
  categories.map((item) => ({
    categoryId: item.categoryId,
    name: item.category || 'Unknown',
    unitsSold: item.qty,
    saleAmount: item.amount,
    profit: item.grossProfit,
    percentOfCollection: item.percentOfCollection,
    icon: iconForCategory(item.category),
  }));

const mapBills = (bills) =>
  bills.map((item) => ({
    id: item.id,
    itemName: item.category || 'Unknown',
    billId: item.billNo || '-',
    dateTime: item.paidAt,
    quantity: item.itemCount <= 0 ? 1 : item.itemCount,
    paymentMode: formatPaymentMethod(item.paymentMethod),
    total: item.total,
    cost: item.cost,
    profit: item.grossProfit,
    icon: iconForCategory(item.category),
  }));


// ------------------------------------------------------------
// GET COLLECTION
// GET /api/mobile/collection/?period=today|date|month[&date=][&month=]
// ------------------------------------------------------------
export const getCollection = async (
  { period = 'today', date, month } = {}
) => {

  const params = new URLSearchParams({ period });

  if (period === 'date' && date) {
    params.append('date', date);
  }

  if (period === 'month' && month) {
    params.append('month', month);
  }

  const url = `${API_ENDPOINTS.COLLECTION.LIST}?${params.toString()}`;

  console.log('========================================');
  console.log('[CollectionController] GET COLLECTION');
  console.log('[CollectionController] URL:', url);

  try {

    const headers = {};

    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('[CollectionController] No access token found');
    }

    const response = await fetch(url, { method: 'GET', headers });

    console.log('[CollectionController] Status:', response.status);

    const text = await response.text();

    console.log('[CollectionController] Body:', text);

    if (!response.ok) {
      throw new CollectionError(
        `Failed to load collection (${response.status})`
      );
    }

    let json;

    try {
      json = JSON.parse(text);
    } catch (e) {
      console.error('[CollectionController] JSON decode error:', e);
      throw new CollectionError('Invalid collection response.');
    }

    const raw = collectionResponseFromApi(json);

    let filterLabel = 'Today';

    if (period === 'date' && date) {
      filterLabel = formatDisplayDate(date);
    }

    if (period === 'month' && month) {
      filterLabel = formatDisplayMonth(month);
    }

    const result = {
      period,
      filterLabel,
      totalCollection: raw.totalCollection,
      upiTotal: paymentAmountFor(raw.paymentBreakdown, 'upi'),
      cashTotal: paymentAmountFor(raw.paymentBreakdown, 'cash'),
      totalProfit: raw.grossProfit,
      billCount: raw.billCount,
      paymentRows: buildPaymentRows(raw.paymentBreakdown, raw.totalCollection),
      categories: mapCategories(raw.categoryCollection),
      bills: mapBills(raw.bills),
    };

    console.log('[CollectionController] Result:', result);

    return result;

  } catch (error) {

    console.error('[CollectionController] ERROR:', error);

    if (error instanceof CollectionError) {
      throw error;
    }

    throw new CollectionError('Unable to load collection.');

  } finally {

    console.log('========================================');
  }
};