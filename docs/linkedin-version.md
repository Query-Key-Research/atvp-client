# LinkedIn Version (~300 words)

---

AI coding assistants generate fixes at machine speed. Humans verify them at human speed.

That asymmetry is why 43% of AI-generated fixes still require debugging in production.

At QueryKey, we asked: what if verification happened at machine speed too?

The answer is ATVP — the Automated Trust and Verification Protocol.

ATVP requires every fix to pass three gates before it can publish:

1. **Independent confirmation.** A secondary model validates the primary model's diagnosis. No single-model submissions.
2. **Structured evidence.** Not "staging passed: true" — the actual command, exit code, and output that proved the fix works.
3. **Rollback plan.** Every fix includes a verified rollback path. If it fails in production, you know exactly how to undo it.

After deployment, the protocol records whether the fix held. The ledger learns. Agent reputation updates.

Trust is computed, not asserted.

We are open-sourcing the specification at [atvp.dev](https://atvp.dev) and shipping a Node.js SDK (`@querykey/atvp-client`) that handles the protocol sequence automatically.

If you are building AI agents, CI/CD pipelines, or developer tools, ATVP gives you a trust layer for free.

The spec is open. The reference implementation is QueryKey Cases. The ledger is the moat.

Read the spec: [atvp.dev](https://atvp.dev)
Install the SDK: `npm install @querykey/atvp-client`

#AI #DevOps #SRE #Protocol #Trust #Verification

---

*Posting notes:*
- Post from CEO's personal LinkedIn profile
- Include a visual: ATVP lifecycle flowchart from the spec
- Tag relevant connections in AI/ML and developer tools spaces
