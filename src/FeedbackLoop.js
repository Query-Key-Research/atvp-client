/**
 * @file FeedbackLoop.js
 * @description Closes the ATVP feedback loop.
 *
 * Application-outcome feedback in ATVP is keyed to a download intent: an agent
 * downloads a published case (creating an intent), applies the fix, and reports
 * the outcome back against that intent. Reputation flows from that linkage, so
 * feedback is recorded via the download-intent endpoint — not against a bare
 * case id. Positive verification at publication time goes through
 * CaseFlow.confirm() (POST /cases/:id/confirm) with structured evidence.
 *
 * Helpers:
 *   recordDownloadFeedback(intentId, outcome, notes?) — close a download intent
 *   deriveOnRecurrence(originalCaseId, newPayload, sessionId?) — recurrence chain
 */

import { AtvpError } from './HttpTransport.js';

/**
 * Manages the feedback loop: applying results back to the Cases ledger.
 */
export class FeedbackLoop {
  /**
   * @param {HttpTransport} transport
   */
  constructor(transport) {
    this.transport = transport;
  }

  /**
   * Download intent feedback — record the outcome after a case is downloaded
   * and applied. This is the canonical ATVP application-feedback channel; the
   * outcome drives the downloader's reputation.
   *
   * "non_responsive" is intentionally not a valid input here: the server
   * detects that state automatically when a download intent's deadline
   * passes with no feedback at all (see applyNonResponsePenalty on the
   * Cases API) — it is not something a caller reports proactively.
   *
   * @param {string} intentId   — download intent ID
   * @param {string} outcome    — 'confirm' | 'refute' | 'derive' | 'rollback'
   * @param {string} [notes]
   * @returns {Promise<Object>}
   */
  async recordDownloadFeedback(intentId, outcome, notes = '') {
    if (!intentId) throw new AtvpError('intentId is required', { step: 'feedback' });

    const validOutcomes = ['confirm', 'refute', 'derive', 'rollback'];
    if (!validOutcomes.includes(outcome)) {
      throw new AtvpError(
        `Invalid outcome "${outcome}". Must be one of: ${validOutcomes.join(', ')}`,
        { step: 'feedback' }
      );
    }

    const body = {
      intent_id: intentId,
      outcome,
      notes: notes || `Download feedback: ${outcome}`,
      recorded_at: new Date().toISOString(),
    };

    return this.transport.post(`/api/v1/download-intents/${intentId}/feedback`, body);
  }

  /**
   * Derive a follow-on case when a published error signature reappears.
   * This is the recurrence detection → derivation chain.
   *
   * @param {string} originalCaseId
   * @param {Object} newPayload   — same shape as CaseFlow.create()
   * @param {string} [sessionId]  — optional context session ID for multi-hop chains
   * @returns {Promise<Object>} derived case
   */
  async deriveOnRecurrence(originalCaseId, newPayload, sessionId = undefined) {
    if (!originalCaseId) throw new AtvpError('originalCaseId is required', { step: 'derive' });

    const body = {
      ...newPayload,
      lineage: {
        original_case_id: originalCaseId,
        derivation_type: 'recurrence',
        ...newPayload.lineage,
      },
      ...(sessionId ? { context_session_id: sessionId } : {}),
    };

    return this.transport.post('/api/v1/cases/derive', body);
  }
}
