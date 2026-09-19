// src/models/employeeModel.js

// ==========================================================
// HELPERS
// ==========================================================

const toBoolean = (value, fallback = true) => {

  if (value === undefined || value === null) {
    return fallback;
  }

  return Boolean(value);
};


// ==========================================================
// API -> UI
// ==========================================================

export const fromApi = (raw) => {

  console.log(
    '[EmployeeModel] fromApi input:',
    raw
  );

  const employee = {

    ...raw,

    id: raw?.id,

    name: raw?.name || '',

    username: raw?.username || '',

    email: raw?.email || '',

    phone: raw?.phone || '',

    role: raw?.role || '',

    is_active: toBoolean(raw?.is_active, true),
  };

  console.log(
    '[EmployeeModel] fromApi output:',
    employee
  );

  return employee;
};


export const fromApiList = (data) => {

  console.log(
    '[EmployeeModel] fromApiList input:',
    data
  );

  const listKeys = ['results', 'data', 'employees', 'items'];

  let list = [];

  if (Array.isArray(data)) {

    list = data;

  } else if (data && typeof data === 'object') {

    const key = listKeys.find(
      (k) => Array.isArray(data[k])
    );

    if (key) {

      console.log(
        '[EmployeeModel] List found under key:',
        key
      );

      list = data[key];

    } else {

      console.warn(
        '[EmployeeModel] No employee list found. Response keys:',
        Object.keys(data),
        data
      );
    }

  } else {

    console.warn(
      '[EmployeeModel] Unexpected list response:',
      data
    );
  }

  console.log(
    '[EmployeeModel] fromApiList count:',
    list.length
  );

  return list.map(fromApi);
};


// ==========================================================
// UI -> API
// Only fields that are provided are sent (safe for PATCH)
// ==========================================================

export const toApiPayload = (input = {}) => {

  const payload = {};

  ['name', 'email', 'username', 'phone', 'role'].forEach(
    (key) => {

      if (input[key] !== undefined) {
        payload[key] = String(input[key]).trim();
      }
    }
  );


  // Password is sent as typed and only when provided

  if (input.password) {
    payload.password = input.password;
  }


  if (input.is_active !== undefined) {
    payload.is_active = Boolean(input.is_active);
  }


  console.log(
    '[EmployeeModel] toApiPayload output:',
    payload.password
      ? { ...payload, password: '***' }
      : payload
  );

  return payload;
};