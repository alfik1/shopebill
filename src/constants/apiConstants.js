// src/constants/apiConstants.js

// In production (Vercel), use relative URLs so requests go to
// https://shopebill.vercel.app/api/... and Vercel forwards them to the server.
// In local development, call the server directly.
export const BASE_URL = import.meta.env.DEV ? 'http://34.171.55.230' : '';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN:          `${BASE_URL}/api/auth/login/`,
    REFRESH:        `${BASE_URL}/api/auth/refresh/`,
    ME:             `${BASE_URL}/api/auth/me/`,
    UPDATE_PROFILE: `${BASE_URL}/api/auth/profile/`,
  },

  CATEGORIES: {
    LIST:   `${BASE_URL}/api/categories/`,
    DETAIL: (id) => `${BASE_URL}/api/categories/${id}/`,
  },

  PRODUCTS: {
    // GET (optional ?search=&category=) / POST
    LIST:        `${BASE_URL}/api/products/`,

    // GET / PATCH / DELETE (soft delete)
    DETAIL:      (id) => `${BASE_URL}/api/products/${id}/`,

    // GET
    BY_BARCODE:  (barcode) => `${BASE_URL}/api/products/barcode/${barcode}/`,
  },

  EMPLOYEES: {
    LIST:   `${BASE_URL}/api/employees/`,
    DETAIL: (id) => `${BASE_URL}/api/employees/${id}/`,
  },

  BILLS: {
    // GET (optional ?status=&search=) / POST (create draft bill)
    LIST:    `${BASE_URL}/api/bills/`,

    // GET
    DETAIL:  (id) => `${BASE_URL}/api/bills/${id}/`,

    // POST
    PAY:     (id) => `${BASE_URL}/api/bills/${id}/pay/`,

    // POST (cancel draft bill)
    CANCEL:  (id) => `${BASE_URL}/api/bills/${id}/cancel/`,

    // GET (PDF)
    RECEIPT: (id) => `${BASE_URL}/api/bills/${id}/receipt.pdf`,

    ITEMS: {
      LIST:   (billId) => `${BASE_URL}/api/bills/${billId}/items/`,

      // POST { barcode, qty }
      SCAN:   (billId) => `${BASE_URL}/api/bills/${billId}/items/scan/`,

      // PATCH { qty }
      DETAIL: (billId, itemId) =>
        `${BASE_URL}/api/bills/${billId}/items/${itemId}/`,
    },
  },

  DASHBOARD: {
    // GET
    SUMMARY:      `${BASE_URL}/api/dashboard/summary/`,

    // GET
    WEEKLY_SALES: `${BASE_URL}/api/dashboard/weekly-sales/`,

    // GET
    TOP_PRODUCTS: `${BASE_URL}/api/dashboard/top-products/`,
  },
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN:  'shopbill_access_token',
  REFRESH_TOKEN: 'shopbill_refresh_token',
  USER:          'shopbill_auth',
};