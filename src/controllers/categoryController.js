// src/controllers/categoryController.js

import { API_ENDPOINTS } from '../constants/apiConstants';
import { authFetch } from '../services/apiService';


// ==========================================================
// GET CATEGORIES
// ==========================================================

export async function getCategories() {
  console.log('==============================================');
  console.log('[CategoryController] GET CATEGORIES START');
  console.log(
    '[CategoryController] URL:',
    API_ENDPOINTS.CATEGORIES.LIST
  );

  try {
    const response = await authFetch(
      API_ENDPOINTS.CATEGORIES.LIST,
      {
        method: 'GET',
      }
    );

    console.log(
      '[CategoryController] GET status:',
      response.status
    );

    const responseText = await response.text();

    console.log(
      '[CategoryController] GET raw response:',
      responseText
    );

    if (!response.ok) {
      console.error(
        '[CategoryController] GET failed:',
        response.status,
        responseText
      );

      throw new Error(
        `Failed to fetch categories: ${response.status}`
      );
    }

    let json = [];

    try {
      json = responseText
        ? JSON.parse(responseText)
        : [];
    } catch (error) {
      console.error(
        '[CategoryController] JSON parse error:',
        error
      );

      throw new Error(
        'Invalid category API response'
      );
    }

    console.log(
      '[CategoryController] GET parsed response:',
      json
    );


    // Django REST Framework can return:
    //
    // [
    //   {...},
    //   {...}
    // ]
    //
    // OR:
    //
    // {
    //   "results": [...]
    // }

    let categories = [];

    if (Array.isArray(json)) {
      categories = json;
    } else if (Array.isArray(json.results)) {
      categories = json.results;
    } else {
      console.warn(
        '[CategoryController] Unknown response format:',
        json
      );
    }

    console.log(
      '[CategoryController] Final categories:',
      categories
    );

    console.log(
      '[CategoryController] Category count:',
      categories.length
    );

    console.log(
      '[CategoryController] GET CATEGORIES END'
    );

    console.log('==============================================');

    return categories;

  } catch (error) {
    console.error(
      '[CategoryController] GET CATEGORIES ERROR:',
      error
    );

    throw error;
  }
}


// ==========================================================
// CREATE CATEGORY
// ==========================================================

export async function createCategory(name, icon) {
  console.log('==============================================');
  console.log('[CategoryController] CREATE CATEGORY START');

  console.log(
    '[CategoryController] Name:',
    name
  );

  console.log(
    '[CategoryController] Icon:',
    icon
  );

  console.log(
    '[CategoryController] URL:',
    API_ENDPOINTS.CATEGORIES.LIST
  );


  // --------------------------------------------------------
  // Request body
  // --------------------------------------------------------

  const body = {
    name: name.trim(),
    icon: icon.trim(),
  };

  console.log(
    '[CategoryController] POST body:',
    body
  );

  console.log(
    '[CategoryController] POST JSON:',
    JSON.stringify(body)
  );


  try {
    const response = await authFetch(
      API_ENDPOINTS.CATEGORIES.LIST,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    console.log(
      '[CategoryController] POST status:',
      response.status
    );


    const responseText =
      await response.text();

    console.log(
      '[CategoryController] POST raw response:',
      responseText
    );


    let json = {};

    try {
      json = responseText
        ? JSON.parse(responseText)
        : {};
    } catch (error) {
      console.error(
        '[CategoryController] POST JSON parse error:',
        error
      );
    }


    console.log(
      '[CategoryController] POST parsed response:',
      json
    );


    if (!response.ok) {
      console.error(
        '[CategoryController] CREATE CATEGORY FAILED:',
        json
      );


      let errorMessage =
        'Failed to create category';


      if (json?.detail) {
        errorMessage = json.detail;
      } else if (json?.message) {
        errorMessage = json.message;
      } else if (json?.name) {
        if (Array.isArray(json.name)) {
          errorMessage = json.name.join(', ');
        } else {
          errorMessage = json.name;
        }
      }


      throw new Error(errorMessage);
    }


    console.log(
      '[CategoryController] Category created successfully:',
      json
    );

    console.log(
      '[CategoryController] New category ID:',
      json?.id
    );


    console.log(
      '[CategoryController] CREATE CATEGORY END'
    );

    console.log('==============================================');


    return json;

  } catch (error) {

    console.error(
      '[CategoryController] CREATE CATEGORY ERROR:',
      error
    );

    throw error;
  }
}