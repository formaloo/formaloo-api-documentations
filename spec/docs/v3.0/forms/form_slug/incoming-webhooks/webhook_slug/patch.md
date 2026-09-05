Partially updates an incoming webhook configuration.

Mappings can be saved only after a sample payload has been captured. Each mapping key is a destination form field slug and each value is an RFC 6901 JSON Pointer that must resolve against the captured sample.

Activation requires a captured sample and a valid mapping. The `update_or_create` action also requires a unique identifier field. If that field's uniqueness is later disabled while the webhook is inactive, make it unique again before reactivation.

Changing to Bearer-token or API-key authentication without supplying `auth_secret` generates a replacement secret. The new value is returned once as `generated_auth_secret`.

```json
{
  "mapping": {
    "name-field-slug": "/contact/name",
    "email-field-slug": "/contact/email"
  },
  "identifier_field": "email-field-slug",
  "active": true
}
```
