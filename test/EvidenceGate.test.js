/**
 * @file EvidenceGate.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { EvidenceGate } from '../src/EvidenceGate.js';
import { AtvpError } from '../src/HttpTransport.js';

describe('EvidenceGate.validate', () => {
  it('rejects null evidence', () => {
    assert.throws(() => EvidenceGate.validate(null), AtvpError);
  });

  it('rejects undefined evidence', () => {
    assert.throws(() => EvidenceGate.validate(undefined), AtvpError);
  });

  it('rejects boolean evidence', () => {
    assert.throws(() => EvidenceGate.validate(true), AtvpError);
    assert.throws(() => EvidenceGate.validate(false), AtvpError);
  });

  it('rejects non-object evidence', () => {
    assert.throws(() => EvidenceGate.validate('string'), AtvpError);
    assert.throws(() => EvidenceGate.validate(42), AtvpError);
  });

  it('rejects missing command', () => {
    assert.throws(() => EvidenceGate.validate({ exitCode: 0, output: 'ok' }), AtvpError);
  });

  it('rejects empty command', () => {
    assert.throws(() => EvidenceGate.validate({ command: '', exitCode: 0, output: 'ok' }), AtvpError);
  });

  it('rejects non-number exitCode', () => {
    assert.throws(() => EvidenceGate.validate({ command: 'test', exitCode: '0', output: 'ok' }), AtvpError);
  });

  it('rejects non-zero exitCode', () => {
    assert.throws(() => EvidenceGate.validate({ command: 'test', exitCode: 1, output: 'fail' }), AtvpError);
  });

  it('rejects missing output', () => {
    assert.throws(() => EvidenceGate.validate({ command: 'test', exitCode: 0 }), AtvpError);
  });

  it('rejects empty output', () => {
    assert.throws(() => EvidenceGate.validate({ command: 'test', exitCode: 0, output: '' }), AtvpError);
  });

  it('accepts valid evidence', () => {
    const ev = { command: 'bash scripts/check.sh', exitCode: 0, output: 'PASS' };
    const result = EvidenceGate.validate(ev);
    assert.deepStrictEqual(result, ev);
  });
});

describe('EvidenceGate.capture', () => {
  it('captures a successful command', async () => {
    const ev = await EvidenceGate.capture('echo hello');
    assert.strictEqual(ev.command, 'echo hello');
    assert.strictEqual(ev.exitCode, 0);
    assert.ok(ev.output.includes('hello'));
  });

  it('captures a failing command with non-zero exitCode', async () => {
    const ev = await EvidenceGate.capture('false');
    assert.strictEqual(ev.command, 'false');
    assert.strictEqual(ev.exitCode, 1);
    assert.ok(typeof ev.output === 'string');
  });
});
