// src/models/exchangeModel.js

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const asArray = (v) => (Array.isArray(v) ? v : []);

// ---------- source bill (paid bill being exchanged) ----------

export const sourceItemFromApi = (raw) => ({
  id: raw?.id,
  name: raw?.product_name ?? raw?.product_detail?.name ?? '',
  barcode: raw?.barcode ?? '',
  qty: toNumber(raw?.qty, 0),
  returnedQty: toNumber(raw?.returned_qty, 0),
  returnableQty: toNumber(raw?.returnable_qty, 0),
  returnableAmount: toNumber(raw?.returnable_amount, 0),
  unitPrice: toNumber(raw?.unit_price, 0),
  lineTotal: toNumber(raw?.line_total, 0),
});

export const sourceBillFromApi = (raw) => ({
  id: raw?.id,
  billNo: raw?.bill_no ?? raw?.number ?? raw?.id,
  customerName: raw?.customer_name ?? '',
  customerPhone: raw?.customer_phone ?? '',
  total: toNumber(raw?.total, 0),
  paidAt: raw?.paid_at ?? raw?.created_at ?? '',
  items: asArray(raw?.items).map(sourceItemFromApi),
});

export const sourceBillListFromApi = (data) => {
  const list = Array.isArray(data) ? data : asArray(data?.results);
  return list.map(sourceBillFromApi);
};

// ---------- exchange ----------

export const returnLineFromApi = (raw) => ({
  id: raw?.id,
  name: raw?.product_name ?? '',
  barcode: raw?.barcode ?? '',
  qty: toNumber(raw?.qty, 0),
  credited: toNumber(raw?.credited_amount, 0),
  returnableQty: toNumber(raw?.returnable_qty, 0),
  isReturnable: raw?.is_returnable !== false,
});

export const replacementLineFromApi = (raw) => ({
  id: raw?.id,
  name: raw?.product_name ?? raw?.product_detail?.name ?? '',
  barcode: raw?.barcode ?? '',
  qty: toNumber(raw?.qty, 1),
  unitPrice: toNumber(raw?.unit_price, 0),
  discount: toNumber(raw?.discount, 0),
  lineTotal: toNumber(raw?.line_total, 0),
});

export const exchangeFromApi = (data) => {
  const raw = data?.exchange || data;
  const bill = raw?.replacement_bill || {};

  return {
    id: raw?.id,
    exchangeNo: raw?.exchange_no ?? '',
    status: String(raw?.status ?? 'draft').toLowerCase(),
    originalBillId: raw?.original_bill,
    originalBillNo: raw?.original_bill_no ?? '',
    returns: asArray(raw?.returns).map(returnLineFromApi),
    replacements: asArray(bill?.items).map(replacementLineFromApi),
    returnedTotal: toNumber(raw?.returned_total, 0),
    replacementTotal: toNumber(raw?.replacement_total, 0),
    creditApplied: toNumber(raw?.credit_applied, 0),
    difference: toNumber(raw?.difference, 0),
    direction: raw?.settlement_direction ?? 'none',
    refunds: asArray(raw?.refunds),
    payments: asArray(bill?.payments),
    completedAt: raw?.completed_at ?? '',
    createdAt: raw?.created_at ?? '',
  };
};

export const exchangeListFromApi = (data) => {
  const list = Array.isArray(data) ? data : asArray(data?.results);
  return list.map(exchangeFromApi);
};

// ---------- UI -> API ----------

export const toSettlementsPayload = (settlements) =>
  settlements
    .filter((s) => toNumber(s.amount, 0) > 0)
    .map((s) => {
      const entry = {
        method: s.method,
        amount: toNumber(s.amount, 0).toFixed(2),
      };
      if (s.reference && s.reference.trim()) {
        entry.reference = s.reference.trim().slice(0, 120);
      }
      return entry;
    });