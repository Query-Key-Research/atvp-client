/**
 * @file AtvpClient.js
 * @description Main entry point for the ATVP SDK.
 * Composes HttpTransport, AgentRegistration, CaseFlow, EvidenceGate, and FeedbackLoop.
 *
 * Usage:
 *   import { AtvpClient } from '@querykey/atvp-client';
 *   const client = new AtvpClient({ apiKey, baseUrl });
 *   const { caseId } = await client.submitVerifiedFix({ ... });
 */

import { HttpTransport } from './HttpTransport.js';
import { AgentRegistration } from './AgentRegistration.js';
import { CaseFlow } from './CaseFlow.js';
import { EvidenceGate } from './EvidenceGate.js';
import { FeedbackLoop } from './FeedbackLoop.js';

/**
 * Primary ATVP client. Wraps all protocol operations in a single
 * typed interface.
 */
export class AtvpClient {
  /**
   * @param {Object} opts
   * @param {string} opts.apiKey     — QueryKey API key (or agent key)
   * @param {string} opts.baseUrl    — e.g. 'https://www.querykey.com'
   * @param {number} [opts.timeout]  — request timeout in ms (default 30000)
   */
  constructor({ apiKey, baseUrl, timeout = 30000 }) {
    this.transport = new HttpTransport({ apiKey, baseUrl, timeout });
    this.agent = new AgentRegistration(this.transport);
    this.cases = new CaseFlow(this.transport);
    this.feedback = new FeedbackLoop(this.transport);
    this.evidence = EvidenceGate;
  }

  /**
   * Bootstrap the platform manifest (no auth required).
   * Static helper — does not require an apiKey.
   *
   * @param {string} baseUrl
   * @returns {Promise<Object>} platform manifest
   */
  static async bootstrap(baseUrl) {
    return AgentRegistration.bootstrap(baseUrl);
  }

  /**
   * Convenience: run a command, capture output as evidence, then
   * submit a verified fix in one shot.
   *
   * @param {Object} opts
   * @param {Object} opts.caseData     — fields for case creation
   * @param {Object} opts.remedyData   — fields for case update
   * @param {string} opts.verifyCommand — shell command to run for evidence
   * @param {string} [opts.confirmReason]
   * @returns {Promise<Object>} { caseId, published, case }
   */
  async submitVerifiedFixWithCommand({ caseData, remedyData, verifyCommand, confirmReason }) {
    const evidence = await EvidenceGate.capture(verifyCommand);
    return this.cases.submitVerifiedFix({ caseData, remedyData, evidence, confirmReason });
  }

  /**
   * Health probe: check if the Cases API is reachable.
   * @returns {Promise<boolean>}
   */
  async isHealthy() {
    try {
      await this.transport.get('/api/v1/cases');
      return true;
    } catch {
      return false;
    }
  }
}
