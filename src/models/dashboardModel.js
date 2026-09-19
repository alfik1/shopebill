// src/models/dashboardModel.js

// ==========================================================
// HELPERS
// ==========================================================

const toNumber = (value, fallback = 0) => {

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};


const round2 = (value) => Math.round(value * 100) / 100;


// Arrays count as their length, anything else as a number

const toCount = (value) =>
  Array.isArray(value)
    ? value.length
    : toNumber(value, 0);


// First key that exists on the source

const pick = (source, keys) => {

  for (const key of keys) {

    if (
      source?.[key] !== undefined &&
      source?.[key] !== null
    ) {
      return source[key];
    }
  }

  return undefined;
};


// { data: {...} } or { data: [...] } -> inner value

const unwrap = (raw) =>
  raw &&
  typeof raw === 'object' &&
  !Array.isArray(raw) &&
  raw.data &&
  typeof raw.data === 'object'
    ? raw.data
    : raw;


const isNumeric = (value) =>
  (typeof value === 'number' && Number.isFinite(value)) ||
  (typeof value === 'string' &&
    value.trim() !== '' &&
    Number.isFinite(Number(value)));


// ==========================================================
// SUMMARY CARDS
// ==========================================================

export const summaryFromApi = (raw) => {

  console.log(
    '[DashboardModel] summaryFromApi input:',
    raw
  );

  const source = unwrap(raw) || {};

  const employees = pick(source, [
    'employees',
    'total_employees',
    'active_employees',
    'employees_count',
    'staff_count',
    'total_staff',
  ]);

  const summary = {

    totalSales: round2(
      toNumber(
        pick(source, [
          'total_sales',
          'totalSales',
          'sales_total',
          'total_revenue',
          'revenue',
          'sales',
        ]),
        0
      )
    ),

    totalProducts: toCount(
      pick(source, [
        'total_products',
        'products_count',
        'product_count',
        'totalProducts',
        'products',
      ])
    ),

    // null when the API does not send it, the view falls back

    employees:
      employees === undefined
        ? null
        : toCount(employees),

    todaysBills: toCount(
      pick(source, [
        'todays_bills',
        'today_bills',
        'bills_today',
        'today_bills_count',
        'todays_bills_count',
        'total_bills_today',
        'bills',
      ])
    ),
  };

  console.log(
    '[DashboardModel] summaryFromApi output:',
    summary,
    '| response keys:',
    Object.keys(source)
  );

  return summary;
};


// ==========================================================
// WEEKLY SALES
// -> [{ day, value, percent }]
// ==========================================================

const parseDate = (value) => {

  const text = String(value);

  // YYYY-MM-DD is read as local time so the weekday is not shifted

  return new Date(
    text.length === 10
      ? `${text}T00:00:00`
      : text
  );
};


const dayLabel = (item, index) => {

  const label =
    item?.day ??
    item?.label ??
    item?.name ??
    item?.weekday;

  if (label) {
    return String(label);
  }

  const dateValue = item?.date ?? item?.created_at;

  if (dateValue) {

    const date = parseDate(dateValue);

    if (!Number.isNaN(date.getTime())) {

      return date.toLocaleDateString('en-US', {
        weekday: 'short',
      });
    }

    return String(dateValue).slice(0, 10);
  }

  return String(index + 1);
};


const itemValue = (item) =>
  toNumber(
    item?.value ??
      item?.total ??
      item?.sales ??
      item?.amount ??
      item?.total_sales ??
      item?.revenue,
    0
  );


export const weeklySalesFromApi = (raw) => {

  console.log(
    '[DashboardModel] weeklySalesFromApi input:',
    raw
  );

  const source = unwrap(raw);

  const listKeys = [
    'results',
    'weekly_sales',
    'sales',
    'days',
    'data',
  ];

  let list = [];

  if (Array.isArray(source)) {

    list = source;

  } else if (source && typeof source === 'object') {

    const key = listKeys.find(
      (k) => Array.isArray(source[k])
    );

    if (key) {

      list = source[key];

    } else if (
      Array.isArray(source.labels) &&
      Array.isArray(source.values)
    ) {

      list = source.labels.map((label, index) => ({
        label,
        value: source.values[index],
      }));

    } else {

      // { Sun: 40, Mon: 65, ... }

      list = Object.entries(source)
        .filter(([, value]) => isNumeric(value))
        .map(([label, value]) => ({ label, value }));
    }
  }

  const days = list.map((item, index) => ({
    day: dayLabel(item, index),
    value: itemValue(item),
  }));

  const max = Math.max(0, ...days.map((d) => d.value));

  const result = days.map((d) => ({
    ...d,
    percent:
      max > 0
        ? Math.round((d.value / max) * 1000) / 10
        : 0,
  }));

  console.log(
    '[DashboardModel] weeklySalesFromApi output:',
    result
  );

  return result;
};


// ==========================================================
// TOP PRODUCTS
// ==========================================================

export const topProductFromApi = (raw) => {

  const category = raw?.category;

  const categoryName =
    category && typeof category === 'object'
      ? category.name || ''
      : raw?.category_name ??
        (category === undefined || category === null
          ? ''
          : String(category));

  return {

    ...raw,

    id:
      raw?.id ??
      raw?.product_id ??
      raw?.sku ??
      null,

    name: raw?.name ?? raw?.product_name ?? '',

    category: categoryName,

    stock: toNumber(
      raw?.stock_qty ??
        raw?.stock ??
        raw?.quantity,
      0
    ),

    price: toNumber(raw?.price, 0),
  };
};


export const topProductsFromApi = (raw) => {

  console.log(
    '[DashboardModel] topProductsFromApi input:',
    raw
  );

  const source = unwrap(raw);

  const listKeys = [
    'results',
    'top_products',
    'products',
    'items',
    'data',
  ];

  let list = [];

  if (Array.isArray(source)) {

    list = source;

  } else if (source && typeof source === 'object') {

    const key = listKeys.find(
      (k) => Array.isArray(source[k])
    );

    if (key) {

      list = source[key];

    } else {

      console.warn(
        '[DashboardModel] No product list found. Response keys:',
        Object.keys(source)
      );
    }
  }

  const products = list.map(topProductFromApi);

  console.log(
    '[DashboardModel] topProductsFromApi output:',
    products
  );

  return products;
};