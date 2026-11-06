// src/utils/debugFields.js
// Walks any API response and lists every field: path, type, sample value.
// Arrays: reports the length and walks the FIRST item only.

export const flattenFields = (value, path = 'root', out = []) => {

  if (Array.isArray(value)) {

    out.push({
      path: `${path}[]`,
      type: 'array',
      value: `length ${value.length}`,
    });

    if (value.length > 0) {
      flattenFields(value[0], `${path}[0]`, out);
    }

  } else if (value && typeof value === 'object') {

    const keys = Object.keys(value);

    if (keys.length === 0) {
      out.push({ path, type: 'object', value: '{}' });
    }

    keys.forEach((key) => {
      flattenFields(value[key], `${path}.${key}`, out);
    });

  } else {

    out.push({
      path,
      type: value === null ? 'null' : typeof value,
      value: String(value),
    });
  }

  return out;
};