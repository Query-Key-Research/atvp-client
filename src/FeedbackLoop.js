/**
 * @file FeedbackLoop.js
 * @description Closes the ATVP feedback loop.
 *
 * After a fix is applied (e.g. deployed to staging or production), the agent
 * reports back whether the application succeeded or failed. This updates
 * the case verification state, the trust ledger, and optionally triggers
 * reputation adjustments.
 *
 * High-level helpers:
 *   recordApplicationResult(caseId, 'success', notes?)
 *   recordApplicationResult(caseId, 'failure', notes?)
 *
 * Low-level helpers:
 *   confirmCase(caseId, evidence)     — positive verification
 *   refuteCase(caseId, reasoning)     — negative verification
 *   deriveOnRecurrence(originalCaseId, newPayload) — recurrence chain
 */

import { AtvpError } from './HttpTransport.js';
import { EvidenceGate } from './EvidenceGate.js';

/**
 * Feedback outcomes supported by the ATVP protocol.
 */
export const ApplicationOutcome = Object.freeze({
  SUCCESS: 'success',
  FAILURE: 'failure',
  PARTIAL: 'partial',
  ROLLED_BACK: 'rolled_back',
});

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
   * Record the result of applying a fix to a case.
   * This is the primary method for closing the feedback loop.
   *
   * @param {string} caseId
   * @param {string} result        — 'success' | 'failure' | 'partial' | 'rolled_back'
   * @param {string} [notes]       — human-readable notes about the outcome
   * @param {Object} [evidence]    — optional evidence for success confirmations
   * @returns {Promise<Object>} feedback record
   */
  async recordApplicationResult(caseId, result, notes = '', evidence = undefined) {
    if (!caseId) throw new AtvpError('caseId is required', { step: 'feedback' });
    if (!Object.values(ApplicationOutcome).includes(result)) {
      throw new AtvpError(
        `Invalid result "${result}". Must be one of: ${Object.values(ApplicationOutcome).join(', ')}`,
        { step: 'feedback' }
      );
    }

    const outcomeMap = {
      [ApplicationOutcome.SUCCESS]:    { feedback_type: 'CONFIRM',  outcome: 'FEEDBACK_OUTCOME' },
      [ApplicationOutcome.FAILURE]:      { feedback_type: 'REFUTE',   outcome: 'FEEDBACK_OUTCOME' },
      [ApplicationOutcome.PARTIAL]:      { feedback_type: 'REFUTE',   outcome: 'FEEDBACK_OUTCOME' },
      [ApplicationOutcome.ROLLED_BACK]:  { feedback_type: 'ROLLBACK', outcome: 'FEEDBACK_OUTCOME' },
    };

    const mapped = outcomeMap[result];

    // For success, require evidence if provided; skip if not (trusts caller)
    if (result === ApplicationOutcome.SUCCESS && evidence !== undefined) {
      EvidenceGate.validate(evidence);
    }

    const body = {
      case_id: caseId,
      feedback_type: mapped.feedback_type,
      outcome: mapped.outcome,
      reasoning: notes || `${result} — fix application recorded`,
      ownership: 'FEEDBACK_OWNERSHIP',
      ...(evidence ? { evidence } : {}),
    };

    return this.transport.post(`/api/v1/cases/${caseId}/feedback`, body);
  }

  /**
   * Confirm a case with structured evidence after a successful fix application.
   * Shortcut for recordApplicationResult with success + evidence.
   *
   * @param {string} caseId
   * @param {Object} evidence   — { command, exitCode: 0, output }
   * @param {string} [notes]
   * @returns {Promise<Object>}
   */
  async confirmCase(caseId, evidence, notes = '') {
    return this.recordApplicationResult(caseId, ApplicationOutcome.SUCCESS, notes, evidence);
  }

  /**
   * Refute a case when a fix fails.
   * Shortcut for recordApplicationResult with failure.
   *
   * @param {string} caseId
   * @param {string} reasoning  — why the fix failed
   * @returns {Promise<Object>}
   */
  async refuteCase(caseId, reasoning) {
    return this.recordApplicationResult(caseId, ApplicationOutcome.FAILURE, reasoning);
  }

  /**
   * Record that a fix was rolled back.
   *
   * @param {string} caseId
   * @param {string} [reasoning]
   * @returns {Promise<Object>}
   */
  async recordRollback(caseId, reasoning = 'Fix rolled back') {
    return this.recordApplicationResult(caseId, ApplicationOutcome.ROLLED_BACK, reasoning);
  }

  /**
   * Download intent feedback — record the outcome after a case is downloaded
   * and the 72-hour feedback window expires or is fulfilled early.
   *
   * @param {string} intentId   — download intent ID
   * @param {string} outcome    — 'confirm' | 'refute' | 'non_responsive'
   * @param {string} [notes]
   * @returns {Promise<Object>}
   */
  async recordDownloadFeedback(intentId, outcome, notes = '') {
    if (!intentId) throw new AtvpError('intentId is required', { step: 'feedback' });

    const validOutcomes = ['confirm', 'refute', 'non_responsive'];
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
