// src/models/productModel.js

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
// CATEGORY RESOLVER
// Handles: object { id, name } | id + category_name | name string
// ==========================================================

const resolveCategory = (raw) => {

  const category = raw?.category;

  if (category && typeof category === 'object') {

    return {
      id: category.id ?? null,
      name: category.name || '',
    };
  }


  if (raw?.category_name) {

    return {
      id: category ?? raw?.category_id ?? null,
      name: raw.category_name,
    };
  }


  return {
    id: raw?.category_id ?? null,
    name:
      category === undefined ||
      category === null
        ? ''
        : String(category),
  };
};


// ==========================================================
// API -> UI
// ==========================================================

export const fromApi = (raw) => {

  console.log(
    '[ProductModel] fromApi input:',
    raw
  );

  const category = resolveCategory(raw);

  const stock = toNumber(
    raw?.stock_qty ?? raw?.stock,
    0
  );

  const product = {

    ...raw,

    id: raw?.id,

    name: raw?.name || '',

    sku: raw?.sku || '',

    barcode: raw?.barcode || '',

    category: category.name,

    categoryId: category.id,

    size: raw?.size || '',

    price: toNumber(raw?.price, 0),

    stock,

    stock_qty: stock,
  };

  console.log(
    '[ProductModel] fromApi output:',
    product
  );

  return product;
};


export const fromApiList = (data) => {

  console.log(
    '[ProductModel] fromApiList input:',
    data
  );

  let list = [];

  const listKeys = ['results', 'data', 'products', 'items'];

  if (Array.isArray(data)) {

    list = data;

  } else if (data && typeof data === 'object') {

    const key = listKeys.find(
      (k) => Array.isArray(data[k])
    );

    if (key) {

      console.log(
        '[ProductModel] List found under key:',
        key
      );

      list = data[key];

    } else if (Array.isArray(data?.data?.results)) {

      console.log(
        '[ProductModel] List found under key: data.results'
      );

      list = data.data.results;

    } else {

      console.warn(
        '[ProductModel] No product list found. Response keys:',
        Object.keys(data),
        data
      );
    }

  } else {

    console.warn(
      '[ProductModel] Unexpected list response:',
      data
    );
  }

  console.log(
    '[ProductModel] fromApiList count:',
    list.length
  );

  return list.map(fromApi);
};


// ==========================================================
// UI -> API
// Only fields that are provided are sent (safe for PATCH)
// ==========================================================

export const toApiPayload = (input = {}) => {

  console.log(
    '[ProductModel] toApiPayload input:',
    input
  );

  const payload = {};


  if (input.name !== undefined) {
    payload.name = String(input.name).trim();
  }


  if (input.sku !== undefined) {
    payload.sku = String(input.sku).trim();
  }


  if (input.barcode) {
    payload.barcode = String(input.barcode).trim();
  }


  const category =
    input.categoryId ?? input.category;

  if (
    category !== undefined &&
    category !== null &&
    category !== ''
  ) {
    payload.category = category;
  }


  if (input.size !== undefined) {
    payload.size = input.size;
  }


  if (
    input.price !== undefined &&
    input.price !== ''
  ) {
    payload.price =
      toNumber(input.price).toFixed(2);
  }


  const stock =
    input.stock_qty ?? input.stock;

  if (
    stock !== undefined &&
    stock !== ''
  ) {
    payload.stock_qty = toNumber(stock);
  }


  console.log(
    '[ProductModel] toApiPayload output:',
    payload
  );

  return payload;
};