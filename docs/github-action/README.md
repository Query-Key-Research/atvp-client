# querykey/record-fix-action

GitHub Action to record the outcome of a fix application to the [QueryKey Cases](https://www.querykey.com) ATVP ledger.

## Usage

Add this step after your deployment to record whether the fix held:

```yaml
- name: Record ATVP Fix Result
  uses: querykey/record-fix-action@v1
  with:
    api_key: ${{ secrets.QUERYKEY_API_KEY }}
    case_id: ${{ env.CASE_ID }}
    result: success
    notes: "Deployed to production, smoke tests passed"
    evidence_command: "bash scripts/check.sh"
```

## Inputs

| Input | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `api_key` | **Yes** | — | QueryKey API key |
| `case_id` | **Yes** | — | ATVP case ID to record feedback for |
| `result` | No | `success` | Outcome: `success`, `failure`, `partial`, `rolled_back` |
| `notes` | No | — | Human-readable notes |
| `evidence_command` | No | — | Shell command to capture structured evidence |
| `querykey_base_url` | No | `https://www.querykey.com` | QueryKey API base URL |

## Result Values

- `success` — Fix resolved the issue
- `failure` — Fix did not resolve the issue or caused regressions
- `partial` — Fix partially resolved the issue
- `rolled_back` — Fix was rolled back

## Evidence Command

If provided, the action runs the shell command and captures:
- `command` — the command that was run
- `exitCode` — 0 for success, non-zero for failure
- `output` — stdout/stderr of the command

This structured evidence is attached to the feedback record in the ATVP ledger.

## Requirements

- Node.js 20+ (GitHub Actions `node20` runtime)
- A QueryKey API key with feedback permissions

## License

MIT © QueryKey
