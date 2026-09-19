// src/models/userModel.js

/**
 * Represents a logged-in user of the ShopBilling system.
 */
export class UserModel {
  constructor({ id = null, name = '', email = '', role = '' } = {}) {
    this.id    = id;
    this.name  = name;
    this.email = email;
    this.role  = role;
  }

  /**
   * Returns display-friendly full label.
   */
  getDisplayName() {
    return this.name || this.email || 'User';
  }

  /**
   * Converts instance back to plain object for JSON storage.
   */
  toJSON() {
    return {
      id:    this.id,
      name:  this.name,
      email: this.email,
      role:  this.role,
    };
  }

  /**
   * Creates a UserModel from a plain JSON object (e.g. from localStorage).
   */
  static fromJSON(json) {
    return new UserModel(json);
  }
}