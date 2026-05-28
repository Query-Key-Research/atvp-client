/**
 * @file AtvpClient.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AtvpClient } from '../src/AtvpClient.js';
import { HttpTransport } from '../src/HttpTransport.js';
import { AgentRegistration } from '../src/AgentRegistration.js';
import { CaseFlow } from '../src/CaseFlow.js';
import { EvidenceGate } from '../src/EvidenceGate.js';
import { FeedbackLoop } from '../src/FeedbackLoop.js';

describe('AtvpClient construction', () => {
  it('composes all sub-modules', () => {
    const client = new AtvpClient({ apiKey: 'k', baseUrl: 'https://example.com' });
    assert.ok(client.transport instanceof HttpTransport);
    assert.ok(client.agent instanceof AgentRegistration);
    assert.ok(client.cases instanceof CaseFlow);
    assert.ok(client.feedback instanceof FeedbackLoop);
    assert.strictEqual(client.evidence, EvidenceGate);
  });
});

describe('AtvpClient.bootstrap', () => {
  it('is a static method', () => {
    assert.strictEqual(typeof AtvpClient.bootstrap, 'function');
  });
});
