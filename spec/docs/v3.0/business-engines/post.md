Creates an engine owned by the workspace. The caller must be a workspace admin (`owner` or `admin`) and the workspace must have the AI feature.

`service` is one of `openai`, `bedrock`, `gemini`, `vertex`. `jev` is rejected.

`settings` is required. It is stored encrypted. The response includes the keys only, each set to `null`.

`is_default` is optional. `true` makes this engine the workspace default and clears `is_default` on the workspace's other engines. It does not change the system default.

When an AI request does not pass an engine id, routing uses this default if the workspace AI setting is on. Otherwise it uses the prompt template's engine, then the system default.

## Credential keys

| Provider | Keys |
| --- | --- |
| OpenAI | `API_KEY` |
| Gemini | `API_KEY` |
| Vertex AI | `SERVICE_ACCOUNT_JSON_DATA` (service-account JSON; the project is its `project_id`), `LOCATION` |
| Bedrock | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` |

```json
{
  "title": "Acme OpenAI",
  "service": "openai",
  "model": "gpt-4.1",
  "settings": {
    "API_KEY": "sk-example"
  }
}
```

```json
{
  "title": "Acme Bedrock",
  "service": "bedrock",
  "model": "anthropic.claude-sonnet-4",
  "settings": {
    "AWS_ACCESS_KEY_ID": "AKIA_EXAMPLE",
    "AWS_SECRET_ACCESS_KEY": "secret-example",
    "AWS_REGION": "eu-central-1"
  }
}
```

```json
{
  "title": "Acme Vertex",
  "service": "vertex",
  "model": "gemini-2.5-pro",
  "settings": {
    "SERVICE_ACCOUNT_JSON_DATA": {
      "type": "service_account",
      "project_id": "example-project"
    },
    "LOCATION": "us-central1"
  }
}
```

After the engine is saved, test it with `POST /v3.0/business-engines/{id}/test/`.

A successful response looks like:

```json
{
  "id": 42,
  "title": "Acme OpenAI",
  "service": "openai",
  "model": "gpt-4.1",
  "is_default": false,
  "settings": {
    "API_KEY": null
  }
}
```
