/**
 * @file FeedbackLoop.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { FeedbackLoop } from '../src/FeedbackLoop.js';
import { AtvpError } from '../src/HttpTransport.js';

class FakeTransport {
  constructor() { this.calls = []; }
  async request(method, path, body) {
    this.calls.push({ method, path, body });
    return { id: 'fb-123', ...body };
  }
  post(p, b) { return this.request('POST', p, b); }
}

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
