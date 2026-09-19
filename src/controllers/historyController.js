// src/controllers/historyController.js

import { API_ENDPOINTS } from '../constants/apiConstants';
import { authFetch } from '../services/apiService';
import { historyFromApiList } from '../models/historyModel';


// ==========================================================
// GET BILLING HISTORY
// GET /api/bills/?status=&search=
// ==========================================================

export const getHistory = async (
  { status = '', search = '' } = {}
) => {

  console.log('==============================================');
  console.log('[HistoryController] GET HISTORY START');

  const params = new URLSearchParams();

  if (status) {
    params.append('status', status);
  }

  if (search) {
    params.append('search', search);
  }

  const query = params.toString();

  const url = query
    ? `${API_ENDPOINTS.BILLS.LIST}?${query}`
    : API_ENDPOINTS.BILLS.LIST;

  console.log('[HistoryController] URL:', url);


  try {

    const response = await authFetch(url, {
      method: 'GET',
    });

    console.log(
      '[HistoryController] Status:',
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
      '[HistoryController] Response:',
      data
    );


    if (!response.ok) {

      const message =
        data?.detail ||
        data?.message ||
        `Failed to fetch history (${response.status})`;

      throw new Error(message);
    }

    return historyFromApiList(data);

  } catch (error) {

    console.error(
      '[HistoryController] GET HISTORY ERROR:',
      error
    );

    throw error;

  } finally {

    console.log('[HistoryController] GET HISTORY END');

    console.log('==============================================');
  }
};