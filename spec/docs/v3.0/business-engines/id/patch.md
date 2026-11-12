Updates an engine this workspace owns. The caller must be a workspace admin (`owner` or `admin`) and the workspace must have the AI feature. Another workspace's engine, or a system engine, is `404`.

Send only the fields to change.

`service`, when sent, is one of `openai`, `bedrock`, `gemini`, `vertex`. `jev` is rejected.

`settings`, when sent, replaces the stored JSON. Omit `settings` to leave the stored credentials unchanged. Values are encrypted at rest. The response includes the keys only, each set to `null`. Re-enter every credential when rotating a key.

`is_default: true` makes this engine the workspace default and clears `is_default` on the workspace's other engines. `is_default: false` clears it. Neither change touches the system default. An AI request that does not name an engine uses that default only while the workspace AI setting is on. Otherwise it uses the prompt template's engine, then the system default.

After replacing credentials, test the engine with `POST /v3.0/business-engines/{id}/test/`.

Credential keys:

| Provider | Keys |
| --- | --- |
| OpenAI | `API_KEY` |
| Gemini | `API_KEY` |
| Vertex AI | `SERVICE_ACCOUNT_JSON_DATA`, `LOCATION` |
| Bedrock | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` |

```json
{
  "is_default": true
}
```

```json
{
  "settings": {
    "API_KEY": "sk-example-rotated"
  }
}
```
