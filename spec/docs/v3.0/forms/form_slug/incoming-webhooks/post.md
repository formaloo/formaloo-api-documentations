Creates an incoming webhook endpoint for a form. New webhooks are inactive until a sample payload is captured and a valid field mapping is saved.

Bearer-token authentication is used by default. If `auth_secret` is omitted for Bearer-token or API-key authentication, Formaloo generates one and returns it once as `generated_auth_secret`. Store that value immediately because subsequent responses redact it.

For API-key authentication, set `auth_header_name` to a non-reserved custom header such as `x-webhook-key`. Use `none` only when the sender cannot authenticate and exposure of the endpoint URL is an acceptable risk.

The mapping uses destination Formaloo field slugs as keys and RFC 6901 JSON Pointers as source values:

```json
{
  "title": "CRM contact sync",
  "action": "update_or_create",
  "identifier_field": "email-field-slug",
  "auth_type": "bearer_token"
}
```

Capture a sample before adding this mapping:

```json
{
  "mapping": {
    "name-field-slug": "/contact/name",
    "email-field-slug": "/contact/email"
  },
  "active": true
}
```

An `update_or_create` webhook can be activated only when its identifier field is unique.
