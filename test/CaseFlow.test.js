/**
 * @file CaseFlow.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { CaseFlow } from '../src/CaseFlow.js';
import { AtvpError } from '../src/HttpTransport.js';

class FakeTransport {
  constructor() { this.calls = []; }
  async request(method, path, body) {
    this.calls.push({ method, path, body });
    return { id: 'test-case-123', ...body };
  }
  get(p)    { return this.request('GET', p); }
  post(p, b) { return this.request('POST', p, b); }
  put(p, b)  { return this.request('PUT', p, b); }
}

describe('CaseFlow.create', () => {
  it('throws when title is missing', async () => {
    const flow = new CaseFlow(new FakeTransport());
    await assert.rejects(flow.create({ error_signature: 'sig' }), AtvpError);
  });

  it('throws when error_signature is missing', async () => {
    const flow = new CaseFlow(new FakeTransport());
    await assert.rejects(flow.create({ title: 't' }), AtvpError);
  });

  it('posts to /api/v1/cases with body shape', async () => {
    const tx = new FakeTransport();
    const flow = new CaseFlow(tx);
    await flow.create({ title: 'T', error_signature: 'sig', ecosystem: 'forge' });
    assert.strictEqual(tx.calls[0].method, 'POST');
    assert.strictEqual(tx.calls[0].path, '/api/v1/cases');
    assert.strictEqual(tx.calls[0].body.title, 'T');
  });
});

describe('CaseFlow.update', () => {
  it('throws when caseId is missing', async () => {
    const flow = new CaseFlow(new FakeTransport());
    await assert.rejects(flow.update('', { remedy: [{ step: 1 }] }), AtvpError);
  });

  it('throws when remedy is empty', async () => {
    const flow = new CaseFlow(new FakeTransport());
    await assert.rejects(flow.update('abc', { remedy: [] }), AtvpError);
  });

  it('throws when remedy is not an array', async () => {
    const flow = new CaseFlow(new FakeTransport());
    await assert.rejects(flow.update('abc', { remedy: 'nope' }), AtvpError);
  });

  it('PUTs to /api/v1/cases/:id with top-level body', async () => {
    const tx = new FakeTransport();
    const flow = new CaseFlow(tx);
    await flow.update('abc', { remedy: [{ step: 1, description: 'fix', action: 'apply' }] });
    assert.strictEqual(tx.calls[0].method, 'PUT');
    assert.strictEqual(tx.calls[0].path, '/api/v1/cases/abc');
    assert.ok(Array.isArray(tx.calls[0].body.remedy));
  });
});

describe('CaseFlow.confirm', () => {
  it('throws when caseId is missing', async () => {
    const flow = new CaseFlow(new FakeTransport());
    await assert.rejects(flow.confirm('', { command: 'c', exitCode: 0, output: 'o' }), AtvpError);
  });

  it('throws when evidence has exitCode !== 0', async () => {
    const flow = new CaseFlow(new FakeTransport());
    await assert.rejects(
      flow.confirm('abc', { command: 'c', exitCode: 1, output: 'fail' }),
      AtvpError
    );
  });

  it('POSTs to /api/v1/cases/:id/confirm with evidence', async () => {
    const tx = new FakeTransport();
    const flow = new CaseFlow(tx);
    await flow.confirm('abc', { command: 'bash check.sh', exitCode: 0, output: 'PASS' });
    assert.strictEqual(tx.calls[0].method, 'POST');
    assert.strictEqual(tx.calls[0].path, '/api/v1/cases/abc/confirm');
    assert.strictEqual(tx.calls[0].body.evidence.exitCode, 0);
  });
});

describe('CaseFlow.submitVerifiedFix', () => {
  it('runs create → update → submit → confirm in sequence', async () => {
    const tx = new FakeTransport();
    const flow = new CaseFlow(tx);
    const result = await flow.submitVerifiedFix({
      caseData: { title: 'T', error_signature: 'sig' },
      remedyData: { remedy: [{ step: 1, description: 'fix', action: 'apply' }] },
      evidence: { command: 'c', exitCode: 0, output: 'ok' },
    });
    assert.strictEqual(tx.calls.length, 4);
    assert.strictEqual(tx.calls[0].method, 'POST'); // create
    assert.strictEqual(tx.calls[1].method, 'PUT');  // update
    assert.strictEqual(tx.calls[2].method, 'POST'); // submit
    assert.strictEqual(tx.calls[3].method, 'POST'); // confirm
    assert.strictEqual(result.caseId, 'test-case-123');
  });
});

describe('CaseFlow.derive', () => {
  it('throws when originalCaseId is missing', async () => {
    const flow = new CaseFlow(new FakeTransport());
    await assert.rejects(flow.derive('', { title: 'T' }), AtvpError);
  });

  it('POSTs to /api/v1/cases/derive with lineage', async () => {
    const tx = new FakeTransport();
    const flow = new CaseFlow(tx);
    await flow.derive('orig-123', { title: 'Derived', error_signature: 'sig' });
    assert.strictEqual(tx.calls[0].method, 'POST');
    assert.strictEqual(tx.calls[0].path, '/api/v1/cases/derive');
    assert.strictEqual(tx.calls[0].body.lineage.original_case_id, 'orig-123');
  });
});

