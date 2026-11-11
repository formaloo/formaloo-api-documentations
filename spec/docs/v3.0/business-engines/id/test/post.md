Sends a prompt through an engine this workspace owns. The caller must be a workspace admin (`owner` or `admin`) and the workspace must have the AI feature.

The engine must already be saved. This call does not create or update it. System engines and another workspace's engines are `404`. A caller who is not an admin, or whose workspace lacks the AI feature, is `403`. A missing `prompt` is `400`.

The prompt is placed in the `business-engine-test` template. That template tells the model to refuse dangerous requests and responses.

The HTTP response is the AI request `slug` and `delivery_id`. It does not include the model text. The model text, or the sanitised provider error, is published on `ai_request.updated` and `ai_request.updated_signal`, the same signal as other AI requests. Match that event with `delivery_id`. The event also includes the usual fields (`prompt_template`, `user`, and token counts).

On success the signal `status` is `completed` and `ai_response` is the model text. On failure `status` is `failed` and `ai_response` is the provider error with credential values and fragments of those values removed. The test request is stored on the workspace and counted as private-engine usage.

`delivery_id` is optional. It is the id used for websocket delivery.

```json
{
  "prompt": "Reply with the word ready.",
  "delivery_id": "example-delivery-1"
}
```

```json
{
  "slug": "a1b2c3d4",
  "delivery_id": "example-delivery-1"
}
```

Success signal:

```json
{
  "event_type": "ai_response",
  "data": {
    "ai_request": "a1b2c3d4",
    "status": "completed",
    "ai_response": "ready",
    "delivery_id": "example-delivery-1",
    "business": "acme"
  }
}
```

Failure signal:

```json
{
  "event_type": "ai_response",
  "data": {
    "ai_request": "a1b2c3d4",
    "status": "failed",
    "ai_response": "Incorrect API key provided: [redacted]",
    "delivery_id": "example-delivery-1",
    "business": "acme"
  }
}
```
