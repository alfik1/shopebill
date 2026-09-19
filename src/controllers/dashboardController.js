// src/controllers/dashboardController.js

import { API_ENDPOINTS } from '../constants/apiConstants';
import { authFetch } from '../services/apiService';

import {
  summaryFromApi,
  weeklySalesFromApi,
  topProductsFromApi,
} from '../models/dashboardModel';


// ==========================================================
// GET HELPER
// ==========================================================

const get = async (label, url) => {

  console.log('==============================================');
  console.log(`[DashboardController] ${label} START`);
  console.log('[DashboardController] URL:', url);

  try {

    const response = await authFetch(url, {
      method: 'GET',
    });

    console.log(
      '[DashboardController] Status:',
      response.status
    );

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
      '[DashboardController] Response:',
      data
    );


    if (!response.ok) {

      const message =
        data?.detail ||
        data?.message ||
        `${label} failed (${response.status})`;

      throw new Error(message);
    }

    return data;

  } catch (error) {

    console.error(
      `[DashboardController] ${label} ERROR:`,
      error
    );

    throw error;

  } finally {

    console.log(`[DashboardController] ${label} END`);

    console.log('==============================================');
  }
};


// ==========================================================
// SUMMARY CARDS
// GET /api/dashboard/summary/
// ==========================================================

export const getDashboardSummary = async () => {

  const data = await get(
    'GET SUMMARY',
    API_ENDPOINTS.DASHBOARD.SUMMARY
  );

  return summaryFromApi(data);
};


// ==========================================================
// WEEKLY SALES
// GET /api/dashboard/weekly-sales/
// ==========================================================

export const getWeeklySales = async () => {

  const data = await get(
    'GET WEEKLY SALES',
    API_ENDPOINTS.DASHBOARD.WEEKLY_SALES
  );

  return weeklySalesFromApi(data);
};


// ==========================================================
// TOP PRODUCTS
// GET /api/dashboard/top-products/
// ==========================================================

export const getTopProducts = async () => {

  const data = await get(
    'GET TOP PRODUCTS',
    API_ENDPOINTS.DASHBOARD.TOP_PRODUCTS
  );

  return topProductsFromApi(data);
};