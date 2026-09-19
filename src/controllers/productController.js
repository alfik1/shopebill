// src/controllers/productController.js

import {
  API_ENDPOINTS,
  STORAGE_KEYS,
} from '../constants/apiConstants';

import {
  fromApi,
  fromApiList,
  toApiPayload,
} from '../models/productModel';


// ==========================================================
// REQUEST HELPER
// ==========================================================

const request = async (label, url, options = {}) => {

  console.log('========================================');
  console.log(`[ProductController] ${label} START`);

  const method = options.method || 'GET';

  console.log('[ProductController] Method:', method);
  console.log('[ProductController] URL:', url);

  if (options.body) {
    console.log(
      '[ProductController] Body:',
      options.body
    );
  }


  try {

    const headers = {};

    const token = localStorage.getItem(
      STORAGE_KEYS.ACCESS_TOKEN
    );

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn(
        '[ProductController] No access token found'
      );
    }

    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }


    const response = await fetch(url, {
      ...options,
      method,
      headers,
    });

    console.log(
      '[ProductController] Status:',
      response.status
    );


    // DELETE returns no body (204), so read as text first

    const text = await response.text();

    let data = null;

    if (text) {

      try {

        data = JSON.parse(text);

      } catch (parseError) {

        data = text;
      }
    }

    console.log(
      '[ProductController] Response:',
      data
    );


    if (!response.ok) {

      const message =
        data?.detail ||
        data?.message ||
        (data && typeof data === 'object'
          ? JSON.stringify(data)
          : data) ||
        `Request failed (${response.status})`;

      throw new Error(message);
    }

    return data;

  } catch (error) {

    console.error(
      `[ProductController] ${label} ERROR:`,
      error
    );

    throw error;

  } finally {

    console.log(
      `[ProductController] ${label} END`
    );

    console.log('========================================');
  }
};


// ==========================================================
// LIST PRODUCTS
// GET /api/products/?search=&category=
// ==========================================================

export const getProducts = async (
  { search = '', category = '' } = {}
) => {

  const params = new URLSearchParams();

  if (search) {
    params.append('search', search);
  }

  if (category) {
    params.append('category', category);
  }

  const query = params.toString();

  const url = query
    ? `${API_ENDPOINTS.PRODUCTS.LIST}?${query}`
    : API_ENDPOINTS.PRODUCTS.LIST;

  const data = await request(
    'GET PRODUCTS',
    url
  );

  return fromApiList(data);
};


// ==========================================================
// GET PRODUCT
// GET /api/products/{id}/
// ==========================================================

export const getProductById = async (id) => {

  const data = await request(
    'GET PRODUCT',
    API_ENDPOINTS.PRODUCTS.DETAIL(id)
  );

  return fromApi(data);
};


// ==========================================================
// LOOKUP BY BARCODE
// GET /api/products/barcode/{barcode}/
// ==========================================================

export const getProductByBarcode = async (barcode) => {

  const data = await request(
    'GET PRODUCT BY BARCODE',
    API_ENDPOINTS.PRODUCTS.BY_BARCODE(
      encodeURIComponent(barcode)
    )
  );

  return fromApi(data);
};


// ==========================================================
// LOOKUP BY SKU
// No SKU endpoint in the API, so uses
// GET /api/products/?search={sku} and matches sku exactly
// Returns null when not found
// ==========================================================

export const getProductBySku = async (sku) => {

  const wanted = String(sku || '').trim().toLowerCase();

  console.log(
    '[ProductController] getProductBySku:',
    wanted
  );

  if (!wanted) {
    return null;
  }

  const list = await getProducts({ search: wanted });

  const match = list.find(
    (product) =>
      String(product.sku || '').toLowerCase() === wanted
  );

  console.log(
    '[ProductController] SKU match:',
    match || null
  );

  return match || null;
};


// ==========================================================
// CREATE PRODUCT
// POST /api/products/
// ==========================================================

export const createProduct = async (input) => {

  const data = await request(
    'CREATE PRODUCT',
    API_ENDPOINTS.PRODUCTS.LIST,
    {
      method: 'POST',
      body: JSON.stringify(
        toApiPayload(input)
      ),
    }
  );

  return fromApi(data);
};


// ==========================================================
// ALIAS (AddProduct.jsx imports addProduct)
// ==========================================================

export const addProduct = createProduct;


// ==========================================================
// UPDATE PRODUCT
// PATCH /api/products/{id}/
// ==========================================================

export const updateProduct = async (id, input) => {

  const data = await request(
    'UPDATE PRODUCT',
    API_ENDPOINTS.PRODUCTS.DETAIL(id),
    {
      method: 'PATCH',
      body: JSON.stringify(
        toApiPayload(input)
      ),
    }
  );

  return fromApi(data);
};


// ==========================================================
// DELETE PRODUCT (soft delete)
// DELETE /api/products/{id}/
// ==========================================================

export const deleteProduct = async (id) => {

  await request(
    'DELETE PRODUCT',
    API_ENDPOINTS.PRODUCTS.DETAIL(id),
    {
      method: 'DELETE',
    }
  );

  return true;
};