/**
 * @file HttpTransport.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { HttpTransport, AtvpError } from '../src/HttpTransport.js';

describe('HttpTransport', () => {
  it('throws when apiKey is missing', () => {
    assert.throws(() => new HttpTransport({ baseUrl: 'https://example.com' }), AtvpError);
  });

  it('throws when baseUrl is missing', () => {
    assert.throws(() => new HttpTransport({ apiKey: 'test' }), AtvpError);
  });

  it('strips trailing slash from baseUrl', () => {
    const t = new HttpTransport({ apiKey: 'k', baseUrl: 'https://example.com/' });
    assert.strictEqual(t.baseUrl, 'https://example.com');
  });

  it('uses default timeout of 30000', () => {
    const t = new HttpTransport({ apiKey: 'k', baseUrl: 'https://example.com' });
    assert.strictEqual(t.timeout, 30000);
  });
});
