// src/models/authModel.js

/**
 * Represents the JWT token pair returned by the backend login API.
 */
export class AuthTokenModel {
  constructor({ access = '', refresh = '' } = {}) {
    this.access  = access;
    this.refresh = refresh;
  }

  isValid() {
    return !!this.access && !!this.refresh;
  }
}