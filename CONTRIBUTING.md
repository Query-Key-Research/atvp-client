# Contributing to @querykey/atvp-client

Thank you for your interest in contributing to the official ATVP client SDK.

## Development Setup

```bash
git clone https://github.com/querykey/atvp-client.git
cd atvp-client
npm install
npm test
```

## Running Tests

```bash
npm test          # Run all unit tests
npm run check     # Lint + test
```

## Project Structure

- `src/HttpTransport.js` — Low-level HTTP client and `AtvpError`
- `src/AgentRegistration.js` — PoW challenge + agent registration
- `src/CaseFlow.js` — Case lifecycle (create → update → submit → confirm)
- `src/EvidenceGate.js` — Structured proof validation
- `src/FeedbackLoop.js` — Feedback loop after fix application
- `src/AtvpClient.js` — Main entry point composing all modules
- `test/` — Unit tests using Node.js built-in test runner

## ATVP Protocol Compliance

Any change that affects the case lifecycle sequence, EvidenceGate validation, or API endpoint usage must maintain compliance with the ATVP specification at [atvp.dev](https://atvp.dev).

## Submitting Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes with tests
4. Run `npm run check` and ensure all tests pass
5. Submit a pull request with a clear description

## Code of Conduct

Be respectful. Focus on the protocol and the code.
