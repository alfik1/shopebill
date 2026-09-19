// src/controllers/employeeController.js

import { API_ENDPOINTS } from '../constants/apiConstants';
import { authFetch } from '../services/apiService';

import {
  fromApi,
  fromApiList,
  toApiPayload,
} from '../models/employeeModel';


// ==========================================================
// HELPERS
// ==========================================================

// Never print passwords in the console

const maskPayload = (payload) =>
  payload && payload.password
    ? { ...payload, password: '***' }
    : payload;


// Django REST Framework errors look like:
// { "email": ["..."] } or { "detail": "..." }

const buildErrorMessage = (data, status, fallback) => {

  if (data && typeof data === 'object') {

    if (data.detail) {
      return data.detail;
    }

    if (data.message) {
      return data.message;
    }

    const parts = Object.entries(data).map(
      ([field, value]) =>
        `${field}: ${
          Array.isArray(value)
            ? value.join(', ')
            : value
        }`
    );

    if (parts.length > 0) {
      return parts.join(' | ');
    }
  }

  if (typeof data === 'string' && data) {
    return data;
  }

  return `${fallback} (${status})`;
};


// ==========================================================
// REQUEST HELPER
// ==========================================================

const request = async (
  label,
  url,
  { method = 'GET', payload } = {}
) => {

  console.log('==============================================');
  console.log(`[EmployeeController] ${label} START`);
  console.log('[EmployeeController] Method:', method);
  console.log('[EmployeeController] URL:', url);

  if (payload) {
    console.log(
      '[EmployeeController] Body:',
      maskPayload(payload)
    );
  }


  try {

    const options = { method };

    if (payload) {

      options.headers = {
        'Content-Type': 'application/json',
      };

      options.body = JSON.stringify(payload);
    }


    const response = await authFetch(url, options);

    console.log(
      '[EmployeeController] Status:',
      response.status
    );


    // DELETE returns no body, so read as text first

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
      '[EmployeeController] Response:',
      data
    );


    if (!response.ok) {

      throw new Error(
        buildErrorMessage(
          data,
          response.status,
          `${label} failed`
        )
      );
    }

    return data;

  } catch (error) {

    console.error(
      `[EmployeeController] ${label} ERROR:`,
      error
    );

    throw error;

  } finally {

    console.log(
      `[EmployeeController] ${label} END`
    );

    console.log('==============================================');
  }
};


// ==========================================================
// LIST EMPLOYEES
// GET /api/employees/
// ==========================================================

export const getEmployees = async () => {

  const data = await request(
    'GET EMPLOYEES',
    API_ENDPOINTS.EMPLOYEES.LIST
  );

  return fromApiList(data);
};


// ==========================================================
// CREATE EMPLOYEE
// POST /api/employees/
// ==========================================================

export const addEmployee = async (input) => {

  const data = await request(
    'CREATE EMPLOYEE',
    API_ENDPOINTS.EMPLOYEES.LIST,
    {
      method: 'POST',
      payload: toApiPayload({
        is_active: true,
        ...input,
      }),
    }
  );

  return fromApi(data);
};


// ==========================================================
// UPDATE EMPLOYEE
// PATCH /api/employees/{id}/
// ==========================================================

export const updateEmployee = async (id, input) => {

  const data = await request(
    'UPDATE EMPLOYEE',
    API_ENDPOINTS.EMPLOYEES.DETAIL(id),
    {
      method: 'PATCH',
      payload: toApiPayload(input),
    }
  );

  return fromApi(data);
};


// ==========================================================
// DEACTIVATE EMPLOYEE
// DELETE /api/employees/{id}/
// ==========================================================

export const deleteEmployee = async (id) => {

  await request(
    'DEACTIVATE EMPLOYEE',
    API_ENDPOINTS.EMPLOYEES.DETAIL(id),
    {
      method: 'DELETE',
    }
  );

  return true;
};