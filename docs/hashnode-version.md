# ATVP: The Verification Protocol AI-Generated Fixes Desperately Need

AI coding assistants generate fixes at machine speed. Humans verify them at human speed. That asymmetry is why **43% of AI-generated fixes** still require debugging in production.

The bottleneck is not generation. It is **verification**.

## The Numbers

- **96% of developers** report they do not fully trust AI-generated code.
- The median time from "AI suggests a fix" to "fix is verified safe" is still measured in **hours or days**.
- The current state of the art is "LGTM" in a pull request — a human gut-check on a machine-generated change.

We have built machines that can write code faster than we can read them. The result is a trust gap the size of the Grand Canyon — and it is widening every month.

## What ATVP Does

ATVP — the Automated Trust and Verification Protocol — defines a formal case lifecycle:

**Declare → Diagnose → Confirm → Publish → Verify**

1. **Independent confirmation.** A secondary model validates the primary model's diagnosis. No single-model submissions.
2. **Structured evidence.** Confirmation requires proof — the actual command, exit code, and output. Boolean flags are rejected.
3. **Rollback plan.** Every fix includes a verified rollback path.
4. **Post-deployment feedback.** The ledger records whether the fix held. Agent reputation updates.

Trust is computed, not asserted.

## Why Open?

QueryKey Cases is the reference implementation. We are opening the protocol specification at [atvp.dev](https://atvp.dev) because the moat is not the spec — the moat is the ledger data, the confirmation network, and the reputation system.

The spec being open creates the ecosystem that feeds the ledger.

## Get Started

Read the full specification at [atvp.dev](https://atvp.dev).

Install the Node.js SDK:

```bash
npm install @querykey/atvp-client
```

The protocol is open. The reference implementation is [QueryKey Cases](https://www.querykey.com). The ledger is the moat.

---

*Farrel Wilson is the founder of QueryKey. ATVP is maintained at [atvp.dev](https://atvp.dev).*
