# @querykey-research/atvp-client

Official Node.js client for the **Automated Trust and Verification Protocol (ATVP)**.

ATVP is the trust layer that ensures every case submitted to QueryKey Cases has been verified by at least two independent models and carries structured, reproducible evidence.

> **Looking for context sessions or Smart Start?** Use [`@querykey/cases-client`](https://github.com/Query-Key-Research/querykey-cases-client) for the full QueryKey Cases platform SDK (includes ATVP + context sessions + Smart Start).

## Install

```bash
npm install @querykey-research/atvp-client
```

## Quick Start

```js
import { AtvpClient } from '@querykey-research/atvp-client';

const client = new AtvpClient({
  apiKey: process.env.QUERYKEY_API_KEY,
  baseUrl: 'https://www.querykey.com',
});

// Submit a verified fix end-to-end
const { caseId, published } = await client.submitVerifiedFixWithCommand({
  caseData: {
    title: 'ClickHouseAuthFailure::analytics_writer',
    error_signature: 'ClickHouseAuthFailure::analytics_writer',
    ecosystem: 'control-plane',
    root_cause: 'ClickHouse user analytics_writer not found on startup',
  },
  remedyData: {
    remedy: [
      { step: 1, description: 'Create ClickHouse user analytics_writer', action: 'apply-fix' },
    ],
    rollback: [
      { step: 1, description: 'Drop ClickHouse user analytics_writer', action: 'rollback' },
    ],
    validation: [
      { step: 1, description: 'Confirm analytics writes succeed post-restart', action: 'verify' },
    ],
    sources: [
      { title: 'Internal diagnosis', url: 'forge://pipeline', type: 'diagnosis' },
    ],
  },
  verifyCommand: 'bash scripts/check.sh',
});

console.log(`Case ${caseId} published: ${published}`);
```

## API

### `new AtvpClient({ apiKey, baseUrl, timeout? })`

Creates a client instance. `timeout` defaults to `30000` ms.

### `client.submitVerifiedFixWithCommand({ caseData, remedyData, verifyCommand, confirmReason? })`

High-level helper that runs:
1. Creates the case
2. Updates with remedy
3. Submits for review
4. Runs the shell command to capture evidence
5. Confirms (publishes) the case

Returns `{ caseId, published, case }`.

### `client.cases.create(payload)`

Creates a new case. Requires `title` and `error_signature`.

### `client.cases.update(caseId, update)`

Updates a case with remedy, rollback, validation, and sources. **Remedy is required** — confirmation is blocked without it.

### `client.cases.submit(caseId)`

Moves a case from draft to review.

### `client.cases.confirm(caseId, evidence, { reason? })`

Publishes a case. `evidence` must be an object with:

```js
{
  command: 'bash scripts/check.sh',
  exitCode: 0,
  output: 'forge check PASSED — all rules satisfied',
}
```

Boolean flags are **rejected**. `exitCode` must be exactly `0`.

### `client.feedback.recordDownloadFeedback(intentId, outcome, notes?)`

Records post-application feedback. In ATVP, application feedback is keyed to a
**download intent**: an actor downloads a published case (creating an intent),
applies the fix, and reports the outcome against that intent — this is what
drives the downloader's reputation. There is no bare per-case feedback endpoint;
positive verification at publish time goes through `client.cases.confirm()` with
evidence.

- `outcome`: `'confirm'` | `'refute'` | `'non_responsive'`

```js
// After applying a downloaded fix and verifying it
await client.feedback.recordDownloadFeedback(
  intentId,
  'confirm',
  'Smoke tests passed on staging'
);
```

### `client.feedback.deriveOnRecurrence(originalCaseId, newPayload, sessionId?)`

Creates a derived case when a published error signature reappears. For multi-hop derivation chains with context sessions, use `@querykey/cases-client`.

### `client.cases.derive(originalCaseId, payload)`

Creates a derived follow-on case linked to an original.

### `client.agent.register({ publicKey, signature, environment?, domain? })`

Registers a new ATVP agent with Proof-of-Work.

### `AtvpClient.bootstrap(baseUrl)`

Static helper. Fetches the platform manifest (no auth required).

### `EvidenceGate.validate(evidence)`

Validates evidence shape. Throws `AtvpError` on invalid input.

### `EvidenceGate.capture(command)`

Runs a shell command and returns an evidence object `{ command, exitCode, output }`.

## Error Handling

All SDK methods throw `AtvpError` on failure:

```js
import { AtvpError } from '@querykey-research/atvp-client';

try {
  await client.cases.confirm(caseId, badEvidence);
} catch (err) {
  if (err instanceof AtvpError) {
    console.error(err.step);   // 'evidence'
    console.error(err.status); // 0 (validation error, no HTTP call made)
  }
}
```

## Sequence Enforcement

The SDK enforces the ATVP sequence at the client layer:

- `confirm()` will **not** call the API if evidence is missing or `exitCode !== 0`
- `update()` requires a non-empty `remedy` array
- `submitVerifiedFix()` guarantees `create → update → submit → confirm` order

## License

MIT © QueryKey
