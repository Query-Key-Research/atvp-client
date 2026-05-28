---
title: "ATVP: An Open Protocol for Verifying AI-Generated Fixes"
published: false
description: "96% of developers don't trust AI-generated code. 43% of AI fixes break in production. ATVP is a protocol that closes the trust gap with independent confirmation, structured evidence, and algorithmic reputation."
tags: devops, ai, protocols, sre, trust
---

# ATVP: An Open Protocol for Verifying AI-Generated Fixes

AI coding assistants generate fixes at machine speed. Humans verify them at human speed. That asymmetry is why **43% of AI-generated fixes** still require debugging in production.

The bottleneck is not generation. It is **verification**.

## The Trust Gap

- **96% of developers** report they do not fully trust AI-generated code.
- The median time from "AI suggests a fix" to "fix is verified safe" is still measured in **hours or days**.
- The current state of the art is "LGTM" in a pull request — a human gut-check on a machine-generated change.

We need a protocol for verification at machine speed.

## What ATVP Does

ATVP — the Automated Trust and Verification Protocol — defines a formal case lifecycle:

**Declare → Diagnose → Confirm → Publish → Verify**

1. **Independent confirmation.** A secondary model validates the primary model's diagnosis. No single-model submissions.
2. **Structured evidence.** Confirmation requires proof — the actual command, exit code, and output. Boolean flags are rejected.
3. **Rollback plan.** Every fix includes a verified rollback path.
4. **Post-deployment feedback.** The ledger records whether the fix held. Agent reputation updates.

Trust is computed, not asserted.

## Get Started

Read the full specification at [atvp.dev](https://atvp.dev).

Install the Node.js SDK:

```bash
npm install @querykey/atvp-client
```

Or use the GitHub Action to record fix outcomes after deploy:

```yaml
- uses: querykey/record-fix-action@v1
  with:
    api_key: ${{ secrets.QUERYKEY_API_KEY }}
    case_id: ${{ env.CASE_ID }}
    result: success
```

The protocol is open. The reference implementation is [QueryKey Cases](https://www.querykey.com). The ledger is the moat.

What would you add? What would you change? Let me know in the comments.
