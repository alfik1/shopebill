// src/models/billModel.js

// ==========================================================
// HELPERS
// ==========================================================

const toNumber = (value, fallback = 0) => {

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};


// ==========================================================
// API -> UI : BILL ITEM
// ==========================================================

export const itemFromApi = (raw) => {

  const product =
    raw?.product && typeof raw.product === 'object'
      ? raw.product
      : {};

  const qty = toNumber(
    raw?.qty ?? raw?.quantity,
    1
  );

  const unitPrice = toNumber(
    raw?.unit_price ??
      raw?.price ??
      raw?.product_price ??
      product.price,
    0
  );

  const lineTotal = toNumber(
    raw?.line_total ??
      raw?.total ??
      raw?.subtotal,
    unitPrice * qty
  );

  return {

    ...raw,

    id: raw?.id,

    name:
      raw?.product_name ??
      raw?.name ??
      product.name ??
      '',

    sku:
      raw?.product_sku ??
      raw?.sku ??
      product.sku ??
      '',

    barcode:
      raw?.barcode ??
      raw?.product_barcode ??
      product.barcode ??
      '',

    qty,

    unitPrice,

    lineTotal,
  };
};


// ==========================================================
// API -> UI : BILL
// ==========================================================

export const billFromApi = (raw) => {

  console.log(
    '[BillModel] billFromApi input:',
    raw
  );

  const rawItems = Array.isArray(raw?.items)
    ? raw.items
    : Array.isArray(raw?.bill_items)
      ? raw.bill_items
      : [];

  const items = rawItems.map(itemFromApi);

  const computedSubtotal = items.reduce(
    (sum, item) => sum + item.lineTotal,
    0
  );

  const subtotal = toNumber(
    raw?.subtotal ?? raw?.sub_total,
    computedSubtotal
  );

  const discount = toNumber(raw?.discount, 0);

  const total = toNumber(
    raw?.total ??
      raw?.total_amount ??
      raw?.grand_total ??
      raw?.net_amount,
    Math.max(subtotal - discount, 0)
  );

  const bill = {

    ...raw,

    id: raw?.id,

    number:
      raw?.bill_number ??
      raw?.number ??
      raw?.id,

    customerName: raw?.customer_name ?? '',

    customerPhone: raw?.customer_phone ?? '',

    discount,

    subtotal,

    total,

    status: String(raw?.status || 'draft').toLowerCase(),

    createdAt: raw?.created_at ?? raw?.date ?? '',

    items,
  };

  console.log(
    '[BillModel] billFromApi output:',
    bill
  );

  return bill;
};


// ==========================================================
// UI -> API
// ==========================================================

// POST /api/bills/

export const toCreatePayload = ({
  customerName = '',
  customerPhone = '',
  discount = 0,
} = {}) => {

  const payload = {
    customer_name: String(customerName).trim(),
    customer_phone: String(customerPhone).trim(),
    discount: toNumber(discount, 0).toFixed(2),
  };

  console.log(
    '[BillModel] toCreatePayload:',
    payload
  );

  return payload;
};


// POST /api/bills/{id}/items/scan/

export const toScanPayload = (barcode, qty = 1) => {

  const payload = {
    barcode: String(barcode).trim(),
    qty: toNumber(qty, 1),
  };

  console.log(
    '[BillModel] toScanPayload:',
    payload
  );

  return payload;
};


// PATCH /api/bills/{id}/items/{itemId}/

export const toQtyPayload = (qty) => {

  const payload = {
    qty: toNumber(qty, 1),
  };

  console.log(
    '[BillModel] toQtyPayload:',
    payload
  );

  return payload;
};


// POST /api/bills/{id}/pay/

export const toPayPayload = ({
  method = 'cash',
  amount = 0,
  reference = '',
} = {}) => {

  const payload = {
    method: String(method).toLowerCase(),
    amount: toNumber(amount, 0).toFixed(2),
    reference: String(reference || '').trim(),
  };

  console.log(
    '[BillModel] toPayPayload:',
    payload
  );

  return payload;
};