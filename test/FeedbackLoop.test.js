/**
 * @file FeedbackLoop.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { FeedbackLoop, ApplicationOutcome } from '../src/FeedbackLoop.js';
import { AtvpError } from '../src/HttpTransport.js';

class FakeTransport {
  constructor() { this.calls = []; }
  async request(method, path, body) {
    this.calls.push({ method, path, body });
    return { id: 'fb-123', ...body };
  }
  post(p, b) { return this.request('POST', p, b); }
}

describe('ApplicationOutcome', () => {
  it('has frozen values', () => {
    assert.strictEqual(ApplicationOutcome.SUCCESS, 'success');
    assert.strictEqual(ApplicationOutcome.FAILURE, 'failure');
    assert.strictEqual(ApplicationOutcome.PARTIAL, 'partial');
    assert.strictEqual(ApplicationOutcome.ROLLED_BACK, 'rolled_back');
  });
});

describe('FeedbackLoop.recordApplicationResult', () => {
  it('throws when caseId is missing', async () => {
    const loop = new FeedbackLoop(new FakeTransport());
    await assert.rejects(loop.recordApplicationResult('', 'success'), AtvpError);
  });

  it('throws on invalid result', async () => {
    const loop = new FeedbackLoop(new FakeTransport());
    await assert.rejects(loop.recordApplicationResult('abc', 'unknown'), AtvpError);
  });

  it('posts CONFIRM for success', async () => {
    const tx = new FakeTransport();
    const loop = new FeedbackLoop(tx);
    await loop.recordApplicationResult('abc', ApplicationOutcome.SUCCESS, 'all green');
    assert.strictEqual(tx.calls[0].method, 'POST');
    assert.strictEqual(tx.calls[0].path, '/api/v1/cases/abc/feedback');
    assert.strictEqual(tx.calls[0].body.feedback_type, 'CONFIRM');
    assert.strictEqual(tx.calls[0].body.reasoning, 'all green');
  });

  it('posts REFUTE for failure', async () => {
    const tx = new FakeTransport();
    const loop = new FeedbackLoop(tx);
    await loop.recordApplicationResult('abc', ApplicationOutcome.FAILURE, 'smoke failed');
    assert.strictEqual(tx.calls[0].body.feedback_type, 'REFUTE');
  });

  it('posts ROLLBACK for rolled_back', async () => {
    const tx = new FakeTransport();
    const loop = new FeedbackLoop(tx);
    await loop.recordApplicationResult('abc', ApplicationOutcome.ROLLED_BACK);
    assert.strictEqual(tx.calls[0].body.feedback_type, 'ROLLBACK');
  });

  it('validates evidence on success when provided', async () => {
    const tx = new FakeTransport();
    const loop = new FeedbackLoop(tx);
    const badEvidence = { command: 'x', exitCode: 1, output: 'fail' };
    await assert.rejects(
      loop.recordApplicationResult('abc', 'success', '', badEvidence),
      AtvpError
    );
  });

  it('accepts valid evidence on success', async () => {
    const tx = new FakeTransport();
    const loop = new FeedbackLoop(tx);
    const goodEvidence = { command: 'bash check.sh', exitCode: 0, output: 'PASS' };
    await loop.recordApplicationResult('abc', 'success', 'verified', goodEvidence);
    assert.deepStrictEqual(tx.calls[0].body.evidence, goodEvidence);
  });
});

describe('FeedbackLoop.confirmCase', () => {
  it('posts CONFIRM with evidence', async () => {
    const tx = new FakeTransport();
    const loop = new FeedbackLoop(tx);
    const ev = { command: 'bash check.sh', exitCode: 0, output: 'PASS' };
    await loop.confirmCase('abc', ev, 'verified');
    assert.strictEqual(tx.calls[0].body.feedback_type, 'CONFIRM');
    assert.deepStrictEqual(tx.calls[0].body.evidence, ev);
  });
});

describe('FeedbackLoop.refuteCase', () => {
  it('posts REFUTE with reasoning', async () => {
    const tx = new FakeTransport();
    const loop = new FeedbackLoop(tx);
    await loop.refuteCase('abc', 'fix broke production');
    assert.strictEqual(tx.calls[0].body.feedback_type, 'REFUTE');
    assert.ok(tx.calls[0].body.reasoning.includes('broke production'));
  });
});

describe('FeedbackLoop.recordRollback', () => {
  it('posts ROLLBACK', async () => {
    const tx = new FakeTransport();
    const loop = new FeedbackLoop(tx);
    await loop.recordRollback('abc', 'reverted in hotfix');
    assert.strictEqual(tx.calls[0].body.feedback_type, 'ROLLBACK');
    assert.ok(tx.calls[0].body.reasoning.includes('hotfix'));
  });
});

describe('FeedbackLoop.recordDownloadFeedback', () => {
  it('throws when intentId is missing', async () => {
    const loop = new FeedbackLoop(new FakeTransport());
    await assert.rejects(loop.recordDownloadFeedback('', 'confirm'), AtvpError);
  });

  it('throws on invalid outcome', async () => {
    const loop = new FeedbackLoop(new FakeTransport());
    await assert.rejects(loop.recordDownloadFeedback('i1', 'bad'), AtvpError);
  });

  it('posts to download-intents feedback endpoint', async () => {
    const tx = new FakeTransport();
    const loop = new FeedbackLoop(tx);
    await loop.recordDownloadFeedback('intent-1', 'confirm', 'works great');
    assert.strictEqual(tx.calls[0].method, 'POST');
    assert.strictEqual(tx.calls[0].path, '/api/v1/download-intents/intent-1/feedback');
    assert.strictEqual(tx.calls[0].body.outcome, 'confirm');
  });
});

describe('FeedbackLoop.deriveOnRecurrence', () => {
  it('throws when originalCaseId is missing', async () => {
    const loop = new FeedbackLoop(new FakeTransport());
    await assert.rejects(loop.deriveOnRecurrence('', { title: 'T' }), AtvpError);
  });

  it('posts to cases/derive with lineage', async () => {
    const tx = new FakeTransport();
    const loop = new FeedbackLoop(tx);
    await loop.deriveOnRecurrence('orig-123', { title: 'Recurring', error_signature: 'sig' });
    assert.strictEqual(tx.calls[0].method, 'POST');
    assert.strictEqual(tx.calls[0].path, '/api/v1/cases/derive');
    assert.strictEqual(tx.calls[0].body.lineage.original_case_id, 'orig-123');
    assert.strictEqual(tx.calls[0].body.lineage.derivation_type, 'recurrence');
  });

  it('includes sessionId when provided', async () => {
    const tx = new FakeTransport();
    const loop = new FeedbackLoop(tx);
    await loop.deriveOnRecurrence('orig-123', { title: 'T' }, 'sess-1');
    assert.strictEqual(tx.calls[0].body.context_session_id, 'sess-1');
  });
});
