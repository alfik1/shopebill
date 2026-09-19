// src/models/profileModel.js

/**
 * Represents the logged-in user's profile.
 * GET  /api/auth/me/
 * PATCH /api/auth/profile/
 */
export class ProfileModel {
  constructor({ id = null, name = '', email = '', role = '', phone = '' } = {}) {
    this.id    = id;
    this.name  = name;
    this.email = email;
    this.role  = role;
    this.phone = phone;
  }

  /**
   * Get initials for avatar (max 2 chars).
   */
  getInitials() {
    if (!this.name) return 'AD';
    return this.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  static fromJSON(json) {
    return new ProfileModel(json);
  }

  toJSON() {
    return {
      id:    this.id,
      name:  this.name,
      email: this.email,
      role:  this.role,
      phone: this.phone,
    };
  }
}