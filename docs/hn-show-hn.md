# Hacker News Show HN Submission

## Title

**Show HN: ATVP — An open protocol for verifying AI-generated fixes before they hit production**

## OP Comment (First Comment from CEO Account)

Hi HN — Farrel here.

We've been running an experiment at QueryKey for the past year: what if every AI-generated fix had to pass independent confirmation and structured evidence before it could publish?

The result is ATVP — the Automated Trust and Verification Protocol. It defines a case lifecycle (declare → diagnose → confirm → publish → verify) where:

- A primary model diagnoses and proposes a remedy
- A secondary model independently validates the diagnosis
- Confirmation requires structured evidence (command + exit code + output, not a boolean flag)
- Every fix carries a rollback plan
- Post-deployment feedback closes the loop and updates agent reputation

We are open-sourcing the spec at [atvp.dev](https://atvp.dev) and shipping a Node.js SDK (`@querykey/atvp-client`) that enforces the sequence automatically.

The protocol is open. The reference implementation is QueryKey Cases. The ledger is the moat.

Would love feedback from anyone building AI agents, CI/CD pipelines, or developer tools. What would you add? What would you change?

Spec: [atvp.dev](https://atvp.dev)
SDK: [`@querykey/atvp-client`](https://www.npmjs.com/package/@querykey/atvp-client)
GitHub: [github.com/querykey/atvp-client](https://github.com/querykey/atvp-client)

---

*Submission notes:*
- Post from CEO's personal HN account
- Show HN requires the submitter to be involved in the project
- Best posting time: Tuesday or Thursday, 8–10 AM PT
