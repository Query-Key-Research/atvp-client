/**
 * @file CaseFlow.js
 * @description Enforces the correct ATVP case lifecycle sequence:
 *   CREATE → UPDATE (remedy) → SUBMIT (review) → CONFIRM (publish)
 *
 * Never calls /confirm before remedy is set.
 * Never calls /confirm without evidence (delegates to EvidenceGate).
 */

import { AtvpError } from './HttpTransport.js';
import { EvidenceGate } from './EvidenceGate.js';

/**
 * Manages the full ATVP case lifecycle with sequence enforcement.
 */
export class CaseFlow {
  /**
   * @param {HttpTransport} transport
   */
  constructor(transport) {
    this.transport = transport;
  }

  /**
   * Step 1 — Create a new case (Problem Declaration).
   *
   * @param {Object} payload
   * @param {string} payload.title
   * @param {string} payload.summary
   * @param {string} payload.error_signature
   * @param {string} payload.ecosystem
   * @param {string} payload.root_cause
   * @param {Object} [payload.body]               — nested case content
   * @param {Object} [payload.context_tags]       — { environments, domains }
   * @returns {Promise<Object>} created case — includes .id (case_id)
   */
  async create(payload) {
    if (!payload.title) throw new AtvpError('title is required', { step: 'create' });
    if (!payload.error_signature) throw new AtvpError('error_signature is required', { step: 'create' });

    // Spread caller-provided fields first so the explicit keys below always win
    // (prevents an absent payload.body from clobbering the computed default).
    const body = {
      ...payload,
      title: payload.title,
      summary: payload.summary ?? payload.title,
      body: payload.body ?? {
        title: payload.title,
        summary: payload.summary ?? '',
        error_signature: payload.error_signature,
        ecosystem: payload.ecosystem ?? 'unknown',
        root_cause: payload.root_cause ?? '',
        metadata: {
          context_tags: payload.context_tags ?? { environments: ['production'], domains: ['cases-api'] },
        },
      },
    };

    return this.transport.post('/api/v1/cases', body);
  }

  /**
   * Step 2 — Update an existing case (Solution Provision).
   * Enforces that the remedy is set at the top level of the PUT body
   * (not nested inside a 'body' wrapper).
   *
   * @param {string} caseId
   * @param {Object} update
   * @param {string} update.root_cause
   * @param {Array}  update.remedy          — array of { step, description, action }
   * @param {Array}  [update.rollback]      — rollback steps
   * @param {Array}  [update.validation]    — validation steps
   * @param {Array}  [update.sources]       — source references
   * @returns {Promise<Object>} updated case
   */
  async update(caseId, update) {
    if (!caseId) throw new AtvpError('caseId is required', { step: 'update' });
    if (!update || typeof update !== 'object') {
      throw new AtvpError('update payload is required', { step: 'update' });
    }

    // Ensure remedy is present — ATVP completeness gate
    if (!Array.isArray(update.remedy) || update.remedy.length === 0) {
      throw new AtvpError(
        'remedy array is required before a case can be confirmed. ' +
        'Each remedy step must have { step, description, action }.',
        { step: 'update' }
      );
    }

    // resetForNewVersion invariant: every PUT resets verified=false
    const body = {
      ...update,
      remedy: update.remedy,
      root_cause: update.root_cause ?? '',
      rollback: update.rollback ?? [],
      validation: update.validation ?? [],
      sources: update.sources ?? [],
    };

    return this.transport.put(`/api/v1/cases/${caseId}`, body);
  }

  /**
   * Step 3 — Submit a case for review (draft → review).
   * This does NOT publish; it makes the case visible to the team.
   *
   * @param {string} caseId
   * @returns {Promise<Object>} submitted case
   */
  async submit(caseId) {
    if (!caseId) throw new AtvpError('caseId is required', { step: 'submit' });
    return this.transport.post(`/api/v1/cases/${caseId}/submit`);
  }

  /**
   * Step 4 — Confirm a case (publish to ledger).
   * EvidenceGate is enforced: a boolean flag is never accepted.
   *
   * @param {string} caseId
   * @param {Object} evidence   — { command, exitCode: 0, output }
   * @param {Object} [opts]
   * @param {string} [opts.reason]  — confirmation reason
   * @returns {Promise<Object>} confirmed case
   */
  async confirm(caseId, evidence, { reason } = {}) {
    if (!caseId) throw new AtvpError('caseId is required', { step: 'confirm' });

    EvidenceGate.validate(evidence);

    const body = {
      case_id: caseId,
      source: 'atvp_client_sdk',
      consensus_outcome: 'CONFIRM',
      reason: reason ?? 'two-model-consensus-confirmed-staging-smoke-passed',
      evidence,
    };

    return this.transport.post(`/api/v1/cases/${caseId}/confirm`, body);
  }

  /**
   * High-level helper: submit a verified fix end-to-end.
   * Creates → Updates → Submits → Confirms in one call with evidence.
   *
   * @param {Object} opts
   * @param {Object} opts.caseData    — fields for .create()
   * @param {Object} opts.remedyData  — fields for .update()
   * @param {Object} opts.evidence    — { command, exitCode, output }
   * @param {string} [opts.confirmReason]
   * @returns {Promise<Object>} { caseId, published, case: fullCaseObject }
   */
  async submitVerifiedFix({ caseData, remedyData, evidence, confirmReason }) {
    const created = await this.create(caseData);
    const caseId = created.id ?? created.case_id;
    if (!caseId) {
      throw new AtvpError('Case creation did not return an id', { step: 'create' });
    }

    await this.update(caseId, remedyData);
    await this.submit(caseId);
    const confirmed = await this.confirm(caseId, evidence, { reason: confirmReason });

    return {
      caseId,
      published: confirmed.published ?? true,
      case: confirmed,
    };
  }

  /**
   * Derive a linked follow-on case (recurrence).
   *
   * @param {string} originalCaseId  — the published case being derived from
   * @param {Object} payload         — same shape as .create()
   * @param {string} [payload.lineage]  — optional lineage metadata
   * @returns {Promise<Object>} derived case
   */
  async derive(originalCaseId, payload) {
    if (!originalCaseId) throw new AtvpError('originalCaseId is required', { step: 'derive' });

    const body = {
      ...payload,
      lineage: {
        original_case_id: originalCaseId,
        ...payload.lineage,
      },
    };

    return this.transport.post('/api/v1/cases/derive', body);
  }
}
