
export const BASE_URL = import.meta.env.DEV
  ? 'http://34.171.55.230'
  : '';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${BASE_URL}/api/auth/login/`,
    REFRESH: `${BASE_URL}/api/auth/refresh/`,
    ME: `${BASE_URL}/api/auth/me/`,
    UPDATE_PROFILE: `${BASE_URL}/api/auth/profile/`,
  },

  CATEGORIES: {
    LIST: `${BASE_URL}/api/categories/`,
    DETAIL: (id) => `${BASE_URL}/api/categories/${id}/`,
  },

  PRODUCTS: {
    LIST: `${BASE_URL}/api/products/`,
    DETAIL: (id) => `${BASE_URL}/api/products/${id}/`,
    BY_BARCODE: (barcode) =>
      `${BASE_URL}/api/products/barcode/${barcode}/`,
  },

  EMPLOYEES: {
    LIST: `${BASE_URL}/api/employees/`,
    DETAIL: (id) => `${BASE_URL}/api/employees/${id}/`,
  },

  BILLS: {
    LIST: `${BASE_URL}/api/bills/`,
    DETAIL: (id) => `${BASE_URL}/api/bills/${id}/`,
    PAY: (id) => `${BASE_URL}/api/bills/${id}/pay/`,
    CANCEL: (id) => `${BASE_URL}/api/bills/${id}/cancel/`,
    RECEIPT: (id) => `${BASE_URL}/api/bills/${id}/receipt.pdf`,

    ITEMS: {
      LIST: (billId) => `${BASE_URL}/api/bills/${billId}/items/`,
      SCAN: (billId) => `${BASE_URL}/api/bills/${billId}/items/scan/`,
      DETAIL: (billId, itemId) =>
        `${BASE_URL}/api/bills/${billId}/items/${itemId}/`,
    },
  },

  DASHBOARD: {
    SUMMARY: `${BASE_URL}/api/dashboard/summary/`,
    WEEKLY_SALES: `${BASE_URL}/api/dashboard/weekly-sales/`,
    TOP_PRODUCTS: `${BASE_URL}/api/dashboard/top-products/`,
  },
};
