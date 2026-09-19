// src/models/historyModel.js

// ==========================================================
// HELPERS
// ==========================================================

const toNumber = (value, fallback = 0) => {

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};


const pad = (number) => String(number).padStart(2, '0');


// Local date as YYYY-MM-DD

const formatDate = (value) => {

  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(date.getDate())}`;
};


const capitalize = (value) =>
  value
    ? value.charAt(0).toUpperCase() + value.slice(1)
    : '';


// ==========================================================
// API -> UI
// ==========================================================

export const historyFromApi = (raw) => {

  const statusKey = String(raw?.status || '').toLowerCase();

  const itemsCount = toNumber(
    raw?.items_count ??
      raw?.item_count ??
      raw?.total_items ??
      (Array.isArray(raw?.items)
        ? raw.items.length
        : 0),
    0
  );

  const row = {

    id: raw?.id,

    number: raw?.bill_number ?? raw?.number ?? raw?.id,

    date: formatDate(raw?.created_at ?? raw?.date),

    customer: raw?.customer_name ?? '',

    items: itemsCount,

    amount: toNumber(
      raw?.total ??
        raw?.total_amount ??
        raw?.grand_total ??
        raw?.net_amount,
      0
    ),

    statusKey,

    status: capitalize(statusKey),
  };

  console.log(
    '[HistoryModel] historyFromApi output:',
    row
  );

  return row;
};


export const historyFromApiList = (data) => {

  console.log(
    '[HistoryModel] historyFromApiList input:',
    data
  );

  const listKeys = ['results', 'data', 'bills', 'items'];

  let list = [];

  if (Array.isArray(data)) {

    list = data;

  } else if (data && typeof data === 'object') {

    const key = listKeys.find(
      (k) => Array.isArray(data[k])
    );

    if (key) {

      console.log(
        '[HistoryModel] List found under key:',
        key
      );

      list = data[key];

    } else {

      console.warn(
        '[HistoryModel] No bill list found. Response keys:',
        Object.keys(data),
        data
      );
    }

  } else {

    console.warn(
      '[HistoryModel] Unexpected list response:',
      data
    );
  }

  console.log(
    '[HistoryModel] historyFromApiList count:',
    list.length
  );

  return list.map(historyFromApi);
};