# querykey/record-fix-action

GitHub Action to record the outcome of a fix application to the [QueryKey Cases](https://www.querykey.com) ATVP ledger.

In ATVP, application feedback is keyed to a **download intent** — the intent created when an agent downloads a published case to apply it. This action records the outcome against that intent.

## Usage

Add this step after your deployment to record whether the fix held:

```yaml
- name: Record ATVP Fix Result
  uses: querykey/record-fix-action@v1
  with:
    api_key: ${{ secrets.QUERYKEY_API_KEY }}
    intent_id: ${{ env.ATVP_INTENT_ID }}
    outcome: confirm
    notes: "Deployed to production, smoke tests passed"
```

## Inputs

| Input | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `api_key` | **Yes** | — | QueryKey API key |
| `intent_id` | **Yes** | — | ATVP download intent ID (created when the case was downloaded) |
| `outcome` | No | `confirm` | Outcome: `confirm`, `refute`, or `non_responsive` |
| `notes` | No | — | Human-readable notes |
| `querykey_base_url` | No | `https://www.querykey.com` | QueryKey API base URL |

## Outcome Values

- `confirm` — Fix resolved the issue; counts toward case verification
- `refute` — Fix did not resolve the issue; resets case verification
- `non_responsive` — Unable to determine outcome (e.g. could not run validation)

## Requirements

- Node.js 20+ (GitHub Actions `node20` runtime)
- A QueryKey API key with feedback permissions
- A download intent ID — obtain one by downloading a case via the API before applying the fix

## License

MIT © QueryKey
