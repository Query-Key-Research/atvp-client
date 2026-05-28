/**
 * @file HttpTransport.js
 * @description Low-level HTTP client for the Cases API.
 * All other SDK modules compose this layer.
 */

/**
 * Standard error shape for all ATVP SDK failures.
 */
export class AtvpError extends Error {
  constructor(message, { status, step, body } = {}) {
    super(message);
    this.name = 'AtvpError';
    this.status = status ?? 0;
    this.step = step ?? 'unknown';
    this.body = body ?? null;
  }
}

/**
 * Minimal, dependency-free HTTP transport for the Cases REST API.
 */
export class HttpTransport {
  /**
   * @param {Object} opts
   * @param {string} opts.apiKey      — QueryKey API key
   * @param {string} opts.baseUrl     — e.g. 'https://www.querykey.com'
   * @param {number} [opts.timeout]   — request timeout in ms (default 30000)
   */
  constructor({ apiKey, baseUrl, timeout = 30000 }) {
    if (!apiKey) throw new AtvpError('apiKey is required');
    if (!baseUrl) throw new AtvpError('baseUrl is required');
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.timeout = timeout;
  }

  /**
   * Perform an HTTP request.
   * @param {string} method   — GET, POST, PUT, PATCH, DELETE
   * @param {string} path     — API path (e.g. '/api/v1/cases')
   * @param {Object} [body]   — JSON-serialisable payload
   * @returns {Promise<Object>} parsed JSON response
   */
  async request(method, path, body = undefined) {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const fetchOpts = {
      method,
      headers,
      signal: controller.signal,
    };

    if (body !== undefined) {
      fetchOpts.body = JSON.stringify(body);
    }

    try {
      const res = await fetch(url, fetchOpts);
      const text = await res.text();
      const parsed = text ? JSON.parse(text) : {};

      if (!res.ok) {
        throw new AtvpError(
          parsed.message || `HTTP ${res.status} on ${method} ${path}`,
          { status: res.status, body: parsed }
        );
      }
      return parsed;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new AtvpError(`Request timeout after ${this.timeout}ms: ${method} ${path}`, { step: 'timeout' });
      }
      if (err instanceof AtvpError) throw err;
      throw new AtvpError(`Network error: ${err.message}`, { step: 'network' });
    } finally {
      clearTimeout(timer);
    }
  }

  /** Convenience wrappers */
  get(path)    { return this.request('GET', path); }
  post(path, b){ return this.request('POST', path, b); }
  put(path, b) { return this.request('PUT', path, b); }
  patch(path, b){ return this.request('PATCH', path, b); }
  del(path)    { return this.request('DELETE', path); }
}
