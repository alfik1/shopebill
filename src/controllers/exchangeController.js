// src/controllers/exchangeController.js

import { API_ENDPOINTS } from '../constants/apiConstants';
import { authFetch } from '../services/apiService';
import {
  sourceBillFromApi,
  sourceBillListFromApi,
  exchangeFromApi,
  exchangeListFromApi,
  toSettlementsPayload,
} from '../models/exchangeModel';

export class ExchangeError extends Error {
  constructor(message, code = '', exchange = null) {
    super(message);
    this.code = code;
    this.exchange = exchange;
  }
}

const parseBody = (text) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
};

const buildMessage = (data, status, label) => {
  if (data && typeof data === 'object') {
    if (data.detail) return data.detail;
    const parts = Object.entries(data)
      .filter(([k]) => k !== 'exchange' && k !== 'code')
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
    if (parts.length) return parts.join(' | ');
  }
  if (typeof data === 'string' && data) return data;
  return `${label} failed (${status})`;
};

const request = async (label, url, { method = 'GET', payload } = {}) => {
  console.log(`[ExchangeController] ${label}`, method, url, payload || '');

  const options = { method };
  if (payload !== undefined) options.body = JSON.stringify(payload);

  const response = await authFetch(url, options);
  const data = parseBody(await response.text());

  console.log(`[ExchangeController] ${label} status`, response.status, data);

  if (!response.ok) {
    throw new ExchangeError(
      buildMessage(data, response.status, label),
      data?.code || '',
      data?.exchange ? exchangeFromApi(data.exchange) : null
    );
  }

  return data;
};

// ---------- source bills ----------

export const searchSourceBills = async (search) => {
  const data = await request('SEARCH BILLS', API_ENDPOINTS.EXCHANGES.SOURCE_BILLS(search));
  return sourceBillListFromApi(data);
};

export const getSourceBill = async (id) => {
  const data = await request('GET BILL', API_ENDPOINTS.EXCHANGES.SOURCE_BILL(id));
  return sourceBillFromApi(data);
};

// ---------- exchange ----------

export const createExchange = async (originalBillId) => {
  const data = await request('CREATE', API_ENDPOINTS.EXCHANGES.LIST, {
    method: 'POST',
    payload: { original_bill: originalBillId },
  });
  return exchangeFromApi(data);
};

export const getExchange = async (id) =>
  exchangeFromApi(await request('GET', API_ENDPOINTS.EXCHANGES.DETAIL(id)));

export const listExchanges = async (status = '') => {
  const url = status
    ? `${API_ENDPOINTS.EXCHANGES.LIST}?status=${encodeURIComponent(status)}`
    : API_ENDPOINTS.EXCHANGES.LIST;
  return exchangeListFromApi(await request('LIST', url));
};

export const scanReturn = async (id, barcode, qty = 1) =>
  exchangeFromApi(
    await request('SCAN RETURN', API_ENDPOINTS.EXCHANGES.RETURN_SCAN(id), {
      method: 'POST',
      payload: { barcode: String(barcode).trim(), qty },
    })
  );

export const setReturnQty = async (id, itemId, qty) =>
  exchangeFromApi(
    await request('RETURN QTY', API_ENDPOINTS.EXCHANGES.RETURN_ITEM(id, itemId), {
      method: 'PATCH',
      payload: { qty },
    })
  );

export const removeReturn = async (id, itemId) =>
  exchangeFromApi(
    await request('REMOVE RETURN', API_ENDPOINTS.EXCHANGES.RETURN_ITEM(id, itemId), {
      method: 'DELETE',
    })
  );

export const scanReplacement = async (id, barcode, qty = 1) =>
  exchangeFromApi(
    await request('SCAN REPLACEMENT', API_ENDPOINTS.EXCHANGES.REPLACEMENT_SCAN(id), {
      method: 'POST',
      payload: { barcode: String(barcode).trim(), qty },
    })
  );

export const updateReplacement = async (id, itemId, { qty, discount }) => {
  const payload = {};
  if (qty !== undefined) payload.qty = qty;
  if (discount !== undefined) payload.discount = Number(discount || 0).toFixed(2);

  return exchangeFromApi(
    await request('UPDATE REPLACEMENT', API_ENDPOINTS.EXCHANGES.REPLACEMENT_ITEM(id, itemId), {
      method: 'PATCH',
      payload,
    })
  );
};

export const removeReplacement = async (id, itemId) =>
  exchangeFromApi(
    await request('REMOVE REPLACEMENT', API_ENDPOINTS.EXCHANGES.REPLACEMENT_ITEM(id, itemId), {
      method: 'DELETE',
    })
  );

export const completeExchange = async (id, expectedDifference, settlements) =>
  exchangeFromApi(
    await request('COMPLETE', API_ENDPOINTS.EXCHANGES.COMPLETE(id), {
      method: 'POST',
      payload: {
        expected_difference: Number(expectedDifference).toFixed(2),
        settlements: toSettlementsPayload(settlements),
      },
    })
  );

export const cancelExchange = async (id) =>
  exchangeFromApi(
    await request('CANCEL', API_ENDPOINTS.EXCHANGES.CANCEL(id), {
      method: 'POST',
      payload: {},
    })
  );

export const downloadExchangeReceipt = async (id) => {
  const response = await authFetch(API_ENDPOINTS.EXCHANGES.RECEIPT(id), { method: 'GET' });

  if (!response.ok) {
    throw new ExchangeError(`Receipt download failed (${response.status})`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `exchange-${id}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};