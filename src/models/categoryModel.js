// src/models/categoryModel.js

export class Category {
  constructor({
    id = null,
    name = '',
    icon = '',
  } = {}) {
    this.id = id;
    this.name = name;
    this.icon = icon;
  }
}

/**
 * Convert API response to Category model
 */
export function categoryFromJson(json) {
  console.log('[CategoryModel] categoryFromJson() →', json);

  return new Category({
    id: json?.id ?? null,
    name: json?.name ?? '',
    icon: json?.icon ?? '',
  });
}

/**
 * Convert Category model to API request body
 */
export function categoryToJson(category) {
  const data = {
    name: category.name,
    icon: category.icon,
  };

  console.log('[CategoryModel] categoryToJson() →', data);

  return data;
}