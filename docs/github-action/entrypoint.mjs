#!/usr/bin/env node
/**
 * @file entrypoint.mjs
 * @description GitHub Action entrypoint for recording ATVP fix outcomes.
 * Uses @querykey-research/atvp-client to send feedback to the Cases ledger.
 *
 * Feedback is keyed to a download intent, not a case ID.
 * The intent ID is created when an agent downloads a published case to apply it.
 */

import { AtvpClient } from '@querykey-research/atvp-client';

// Must match FeedbackLoop.recordDownloadFeedback's validOutcomes in the SDK.
// "non_responsive" is excluded: the server detects that state automatically
// on deadline timeout — it is not a caller-reported outcome.
const VALID_OUTCOMES = ['confirm', 'refute', 'derive', 'rollback'];

async function main() {
  const apiKey = process.env.INPUT_API_KEY;
  const intentId = process.env.INPUT_INTENT_ID;
  const outcome = process.env.INPUT_OUTCOME || 'confirm';
  const notes = process.env.INPUT_NOTES || '';
  const baseUrl = process.env.INPUT_QUERYKEY_BASE_URL || 'https://www.querykey.com';

  if (!apiKey) {
    console.error('::error::Input api_key is required');
    process.exit(1);
  }
  if (!intentId) {
    console.error('::error::Input intent_id is required (the download intent ID, not the case ID)');
    process.exit(1);
  }
  if (!VALID_OUTCOMES.includes(outcome)) {
    console.error(`::error::Input outcome must be one of: ${VALID_OUTCOMES.join(', ')} — got "${outcome}"`);
    process.exit(1);
  }

  const client = new AtvpClient({ apiKey, baseUrl });

  try {
    const feedback = await client.feedback.recordDownloadFeedback(intentId, outcome, notes || undefined);
    console.log(`::notice::ATVP feedback recorded for intent ${intentId}: ${outcome}`);
    console.log(JSON.stringify(feedback, null, 2));
  } catch (err) {
    console.error(`::error::Failed to record ATVP feedback: ${err.message}`);
    process.exit(1);
  }
}

main();
