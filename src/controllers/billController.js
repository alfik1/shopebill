// src/controllers/billController.js

import { API_ENDPOINTS } from '../constants/apiConstants';
import { authFetch } from '../services/apiService';

import {
  billFromApi,
  toCreatePayload,
  toScanPayload,
  toQtyPayload,
  toPayPayload,
} from '../models/billModel';


// ==========================================================
// HELPERS
// ==========================================================

// Django REST Framework errors look like:
// { "barcode": ["..."] } or { "detail": "..." }

const buildErrorMessage = (data, status, fallback) => {

  if (data && typeof data === 'object') {

    if (data.detail) {
      return data.detail;
    }

    if (data.message) {
      return data.message;
    }

    const parts = Object.entries(data).map(
      ([field, value]) =>
        `${field}: ${
          Array.isArray(value)
            ? value.join(', ')
            : value
        }`
    );

    if (parts.length > 0) {
      return parts.join(' | ');
    }
  }

  if (typeof data === 'string' && data) {
    return data;
  }

  return `${fallback} (${status})`;
};


const parseBody = (text) => {

  if (!text) {
    return null;
  }

  try {

    return JSON.parse(text);

  } catch (error) {

    return text;
  }
};


// ==========================================================
// REQUEST HELPER
// ==========================================================

const request = async (
  label,
  url,
  { method = 'GET', payload } = {}
) => {

  console.log('==============================================');
  console.log(`[BillController] ${label} START`);
  console.log('[BillController] Method:', method);
  console.log('[BillController] URL:', url);

  if (payload) {
    console.log('[BillController] Body:', payload);
  }


  try {

    const options = { method };

    if (payload) {

      options.headers = {
        'Content-Type': 'application/json',
      };

      options.body = JSON.stringify(payload);
    }


    const response = await authFetch(url, options);

    console.log(
      '[BillController] Status:',
      response.status
    );

    const data = parseBody(await response.text());

    console.log(
      '[BillController] Response:',
      data
    );


    if (!response.ok) {

      throw new Error(
        buildErrorMessage(
          data,
          response.status,
          `${label} failed`
        )
      );
    }

    return data;

  } catch (error) {

    console.error(
      `[BillController] ${label} ERROR:`,
      error
    );

    throw error;

  } finally {

    console.log(`[BillController] ${label} END`);

    console.log('==============================================');
  }
};


// ==========================================================
// CREATE DRAFT BILL
// POST /api/bills/
// ==========================================================

export const createBill = async (input) => {

  const data = await request(
    'CREATE BILL',
    API_ENDPOINTS.BILLS.LIST,
    {
      method: 'POST',
      payload: toCreatePayload(input),
    }
  );

  return billFromApi(data);
};


// ==========================================================
// GET BILL DETAIL
// GET /api/bills/{id}/
// ==========================================================

export const getBill = async (billId) => {

  const data = await request(
    'GET BILL',
    API_ENDPOINTS.BILLS.DETAIL(billId)
  );

  return billFromApi(data);
};


// ==========================================================
// SCAN ITEM INTO BILL
// POST /api/bills/{id}/items/scan/
// Returns the refreshed bill (items + totals)
// ==========================================================

export const scanItem = async (billId, barcode, qty = 1) => {

  await request(
    'SCAN ITEM',
    API_ENDPOINTS.BILLS.ITEMS.SCAN(billId),
    {
      method: 'POST',
      payload: toScanPayload(barcode, qty),
    }
  );

  return getBill(billId);
};


// ==========================================================
// UPDATE ITEM QUANTITY
// PATCH /api/bills/{id}/items/{itemId}/
// Returns the refreshed bill (items + totals)
// ==========================================================

export const updateItemQty = async (billId, itemId, qty) => {

  await request(
    'UPDATE ITEM QTY',
    API_ENDPOINTS.BILLS.ITEMS.DETAIL(billId, itemId),
    {
      method: 'PATCH',
      payload: toQtyPayload(qty),
    }
  );

  return getBill(billId);
};


// ==========================================================
// UPDATE ITEM DISCOUNT
// PATCH /api/bills/{id}/items/{itemId}/
// This endpoint's serializer requires qty in the body even
// when only discount is changing, so the item's current qty
// is sent alongside it.
// Returns the refreshed bill (items + totals)
// ==========================================================

export const updateItemDiscount = async (billId, itemId, discount, qty) => {

  await request(
    'UPDATE ITEM DISCOUNT',
    API_ENDPOINTS.BILLS.ITEMS.DETAIL(billId, itemId),
    {
      method: 'PATCH',
      payload: {
        qty: Number(qty),
        discount: Number(discount || 0).toFixed(2),
      },
    }
  );

  return getBill(billId);
};


// ==========================================================
// PAY BILL
// POST /api/bills/{id}/pay/
// Returns the refreshed bill, or null if refresh failed
// ==========================================================

export const payBill = async (billId, input) => {

  await request(
    'PAY BILL',
    API_ENDPOINTS.BILLS.PAY(billId),
    {
      method: 'POST',
      payload: toPayPayload(input),
    }
  );

  // Payment already succeeded, a failed refresh must not look like a failed payment

  try {

    return await getBill(billId);

  } catch (error) {

    console.warn(
      '[BillController] Bill refresh after payment failed:',
      error
    );

    return null;
  }
};


// ==========================================================
// CANCEL DRAFT BILL
// POST /api/bills/{id}/cancel/
// ==========================================================

export const cancelBill = async (billId) => {

  await request(
    'CANCEL BILL',
    API_ENDPOINTS.BILLS.CANCEL(billId),
    {
      method: 'POST',
    }
  );

  return true;
};


// ==========================================================
// DOWNLOAD RECEIPT PDF
// GET /api/bills/{id}/receipt.pdf
// ==========================================================

export const downloadReceipt = async (billId) => {

  const url = API_ENDPOINTS.BILLS.RECEIPT(billId);

  console.log('==============================================');
  console.log('[BillController] DOWNLOAD RECEIPT START');
  console.log('[BillController] URL:', url);

  try {

    const response = await authFetch(url, {
      method: 'GET',
    });

    console.log(
      '[BillController] Status:',
      response.status
    );

    if (!response.ok) {

      const data = parseBody(await response.text());

      throw new Error(
        buildErrorMessage(
          data,
          response.status,
          'Receipt download failed'
        )
      );
    }


    const blob = await response.blob();

    console.log(
      '[BillController] Receipt size:',
      blob.size
    );

    const objectUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = objectUrl;

    link.download = `receipt-${billId}.pdf`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    setTimeout(
      () => URL.revokeObjectURL(objectUrl),
      10000
    );

    return true;

  } catch (error) {

    console.error(
      '[BillController] DOWNLOAD RECEIPT ERROR:',
      error
    );

    throw error;

  } finally {

    console.log('[BillController] DOWNLOAD RECEIPT END');

    console.log('==============================================');
  }
};


// ==========================================================
// SEARCH EXISTING CUSTOMERS
// GET /api/bills/?search={query}
// Extracts unique { name, phone } pairs from matching bills
// ==========================================================

export const searchCustomers = async (query) => {

  const text = String(query || '').trim();

  if (!text) {
    return [];
  }

  const url = `${API_ENDPOINTS.BILLS.LIST}?search=${encodeURIComponent(text)}`;

  const data = await request(
    'SEARCH CUSTOMERS',
    url
  );

  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.results)
      ? data.results
      : [];

  const bills = list.map(billFromApi);

  const seen = new Set();

  const customers = [];

  bills.forEach((b) => {

    const name = b.customerName || '';

    const phone = b.customerPhone || '';

    if (!name && !phone) {
      return;
    }

    const key = `${name.toLowerCase()}|${phone}`;

    if (seen.has(key)) {
      return;
    }

    seen.add(key);

    customers.push({ name, phone });
  });

  console.log(
    '[BillController] SEARCH CUSTOMERS result:',
    customers
  );

  return customers;
};