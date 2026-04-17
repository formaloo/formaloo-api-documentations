Start the end-user sign-in flow for a public app or portal.

Use this endpoint when your own users need to sign in before they can access protected app content or profile data.

## Sent data

The `originator` identifies the public app or board that is requesting sign-in. In most integrations, this is the same share address or public identifier you already use to load the app.

If your client portal uses scoped authentication, you may also send `x-scope` to identify the scope for this sign-in request. This header is optional and only applies to scope-aware public app flows.

## What happens next

After the user completes the sign-in flow, use the returned login confirmation data with the documented end-user login confirmation and authorization endpoints to obtain an authorization token for that end user.
