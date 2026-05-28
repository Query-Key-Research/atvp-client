/**
 * @file AgentRegistration.js
 * @description ATVP agent registration with Proof-of-Work (PoW) challenge.
 * Enforces the gate sequence: AUTH → POW → SIGNATURE → QUOTA.
 */

import { AtvpError } from './HttpTransport.js';

/**
 * Handles ATVP agent registration: fetching a PoW challenge,
 * solving it, and registering the agent with a signed response.
 */
export class AgentRegistration {
  /**
   * @param {HttpTransport} transport
   */
  constructor(transport) {
    this.transport = transport;
  }

  /**
   * Fetch a PoW challenge from the Cases API.
   * @returns {Promise<Object>} challenge — { challenge_id, nonce, difficulty, prefix }
   */
  async fetchChallenge() {
    return this.transport.get('/api/v1/registration/challenge');
  }

  /**
   * Solve a simple PoW challenge: find a suffix such that
   * SHA-256(prefix + suffix) starts with `difficulty` zero bits.
   * @param {Object} challenge
   * @param {string} challenge.prefix
   * @param {number} challenge.difficulty  — number of leading zero hex chars
   * @returns {Promise<Object>} { suffix, hash }
   */
  async solveChallenge({ prefix, difficulty }) {
    const targetZeros = '0'.repeat(difficulty);
    const encoder = new TextEncoder();
    let suffix = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const candidate = suffix.toString(16).padStart(8, '0');
      const data = encoder.encode(prefix + candidate);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      if (hashHex.startsWith(targetZeros)) {
        return { suffix: candidate, hash: hashHex };
      }
      suffix += 1;

      // Safety valve: if this takes more than ~2^24 iterations, something is wrong
      if (suffix > 16_777_216) {
        throw new AtvpError('PoW challenge exceeded safety iteration limit', { step: 'pow' });
      }
    }
  }

  /**
   * Complete agent registration.
   * @param {Object} opts
   * @param {string} opts.publicKey     — agent's public key (hex)
   * @param {string} opts.signature     — signed challenge response (hex)
   * @param {string} [opts.environment] — e.g. 'production', 'staging'
   * @param {string} [opts.domain]      — e.g. 'forge', 'sentry'
   * @returns {Promise<Object>} registered agent — { agent_id, api_key, ... }
   */
  async register({ publicKey, signature, environment = 'production', domain = 'generic' }) {
    if (!publicKey) throw new AtvpError('publicKey is required', { step: 'signature' });
    if (!signature) throw new AtvpError('signature is required', { step: 'signature' });

    const challenge = await this.fetchChallenge();
    const solution = await this.solveChallenge(challenge);

    const payload = {
      challenge_id: challenge.challenge_id,
      nonce: challenge.nonce,
      difficulty: challenge.difficulty,
      prefix: challenge.prefix,
      suffix: solution.suffix,
      hash: solution.hash,
      public_key: publicKey,
      signature,
      environment,
      domain,
    };

    return this.transport.post('/api/v1/registration/agent', payload);
  }

  /**
   * Bootstrap call — fetch platform manifest and schema (no auth required).
   * This is the first call a new agent makes before registration.
   * @param {HttpTransport} bareTransport  — HttpTransport with no apiKey, or empty string key
   * @returns {Promise<Object>} manifest
   */
  static async bootstrap(baseUrl) {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/v1/bootstrap/start`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new AtvpError(`Bootstrap failed: HTTP ${res.status}`, { status: res.status, body: text });
    }
    return res.json();
  }
}
