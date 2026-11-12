Ends the current Login as session. No body. Send the same portal authorization JWT used for other portal calls, plus `x-scope`.

On success, drop that token and leave the portal view. Only that portal session is revoked. The owner's Formaloo tab is a different token on a different origin and stays signed in. The same JWT then fails portal requests.

A normal portal login receives `403`.

## Example response (`201`)

```json
{
  "status": 201,
  "errors": {
    "general_errors": [],
    "form_errors": {}
  },
  "data": {
    "impersonation": {
      "ended": true
    }
  }
}
```
