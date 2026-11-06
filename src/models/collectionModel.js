// src/models/collectionModel.js
//
// API: GET /api/mobile/collection/?period=today|date|month
//
// root:
//   period, start_date, end_date, total_collection, bill_count, gross_profit
//   payment_breakdown[]    : method, amount, percent
//   category_collection[]  : category_id, category, qty, amount,
//                            gross_profit, percent_of_collection
//   bills[]                : id, bill_no, paid_at, category, item_count,
//                            payment_method, total, cost, gross_profit

const toNumber = (value, fallback = 0) => {

  if (value === null || value === undefined) return fallback;

  const n = Number(value);

  return Number.isFinite(n) ? n : fallback;
};

const toInt = (value, fallback = 0) =>
  Math.trunc(toNumber(value, fallback));

const asArray = (value) =>
  Array.isArray(value) ? value : [];


// ==========================================================
// API -> RAW MODEL
// ==========================================================

export const collectionResponseFromApi = (json) => {

  console.log('[CollectionModel] input:', json);

  const paymentBreakdown = asArray(json?.payment_breakdown).map((item) => ({
    method: String(item?.method ?? ''),
    amount: toNumber(item?.amount),
    percent: toNumber(item?.percent),
  }));

  const categoryCollection = asArray(json?.category_collection).map((item) => ({
    categoryId: toInt(item?.category_id),
    category: String(item?.category ?? ''),
    qty: toInt(item?.qty),
    amount: toNumber(item?.amount),
    grossProfit: toNumber(item?.gross_profit),
    percentOfCollection: toNumber(item?.percent_of_collection),
  }));

  const bills = asArray(json?.bills).map((item) => ({
    id: toInt(item?.id),
    billNo: String(item?.bill_no ?? ''),
    paidAt: item?.paid_at ? new Date(item.paid_at) : null,
    category: String(item?.category ?? ''),
    itemCount: toInt(item?.item_count),
    paymentMethod: String(item?.payment_method ?? ''),
    total: toNumber(item?.total),
    cost: toNumber(item?.cost),
    grossProfit: toNumber(item?.gross_profit),
  }));

  const result = {
    period: String(json?.period ?? 'today'),
    startDate: json?.start_date ?? '',
    endDate: json?.end_date ?? '',
    totalCollection: toNumber(json?.total_collection),
    billCount: toInt(json?.bill_count),
    grossProfit: toNumber(json?.gross_profit),
    paymentBreakdown,
    categoryCollection,
    bills,
  };

  console.log('[CollectionModel] output:', result);

  return result;
};


// ------------------------------------------------------------
// Payment amount by method (case-insensitive)
// ------------------------------------------------------------
export const paymentAmountFor = (paymentBreakdown, method) =>
  paymentBreakdown
    .filter((item) => item.method.toLowerCase() === method.toLowerCase())
    .reduce((sum, item) => sum + item.amount, 0);