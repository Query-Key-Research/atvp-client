#!/usr/bin/env node
/**
 * @file entrypoint.mjs
 * @description GitHub Action entrypoint for recording ATVP fix outcomes.
 * Uses @querykey/atvp-client to send feedback to the Cases ledger.
 */

import { AtvpClient } from '@querykey/atvp-client';

async function main() {
  const apiKey = process.env.INPUT_API_KEY;
  const caseId = process.env.INPUT_CASE_ID;
  const result = process.env.INPUT_RESULT || 'success';
  const notes = process.env.INPUT_NOTES || '';
  const evidenceCommand = process.env.INPUT_EVIDENCE_COMMAND || '';
  const baseUrl = process.env.INPUT_QUERYKEY_BASE_URL || 'https://www.querykey.com';

  if (!apiKey) {
    console.error('::error::Input api_key is required');
    process.exit(1);
  }
  if (!caseId) {
    console.error('::error::Input case_id is required');
    process.exit(1);
  }

  const client = new AtvpClient({ apiKey, baseUrl });

  let evidence;
  if (evidenceCommand) {
    const { execSync } = await import('node:child_process');
    try {
      const output = execSync(evidenceCommand, { encoding: 'utf-8', timeout: 120000 });
      evidence = { command: evidenceCommand, exitCode: 0, output: output.trim() };
    } catch (err) {
      evidence = { command: evidenceCommand, exitCode: err.status || 1, output: (err.stdout || err.stderr || err.message).trim() };
    }
  }

  try {
    const feedback = await client.feedback.recordApplicationResult(caseId, result, notes, evidence);
    console.log(`::notice::ATVP feedback recorded for case ${caseId}: ${result}`);
    console.log(JSON.stringify(feedback, null, 2));
  } catch (err) {
    console.error(`::error::Failed to record ATVP feedback: ${err.message}`);
    process.exit(1);
  }
}

main();
