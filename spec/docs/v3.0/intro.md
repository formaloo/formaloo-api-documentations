This documentation covers the Formaloo public API.

## Getting started

Use the version shown in this reference when calling an endpoint.

Most public endpoints use the `v3.0` path. A small number of endpoints remain available on documented legacy paths for compatibility. When an endpoint in this reference uses a legacy path, use the exact path shown on that endpoint.

To call the API, you need:

- an **API Key** sent with the `x-api-key` header
- an **API Secret** from the dashboard
- an **Authorization Token** for endpoints that require authenticated access

## Getting your keys

You can manage your keys from the Formaloo dashboard:

- Sign in to [Formaloo Dashboard](https://dash.formaloo.net/u)
- Open your profile menu
- Select **API Key & Token**

The dashboard shows both:

- **API Key**: send this with the `x-api-key` header
- **API Secret**: use this to obtain an authorization token for protected endpoints

## Direct API access

If you are building a server-to-server integration, automation, or backend client, use your dashboard-issued API Key and API Secret.

### Step 1: Request an authorization token

Use your **API Secret** to request an **Authorization Token** from the documented authorization endpoint.

Request headers:

`x-api-key = {API Key}`

`Authorization = Basic {API Secret}`

Request body:

`grant_type=client_credentials`

Example:

```bash
curl --location --request POST 'https://api.formaloo.me/v3.0/oauth2/authorization-token/' \
--header 'x-api-key: {API Key}' \
--header 'Authorization: Basic {API Secret}' \
--form 'grant_type="client_credentials"'
```

Example response:

```json
{
  "authorization_token": "{Authorization Token}"
}
```

Use the **API Secret** exactly as shown in the dashboard for the `Basic` authorization header.

### Step 2: Call protected endpoints

Include your API Key in every request unless an endpoint explicitly documents a different requirement.

For authenticated endpoints, include:

```text
Authorization = JWT {Authorization Token}
x-api-key = {API Key}
```

Example:

```bash
curl 'https://api.formaloo.me/v3.0/forms/' \
--header 'x-api-key: {API Key}' \
--header 'Authorization: JWT {Authorization Token}'
```

Some endpoints are public and do not require the `Authorization` header. Always follow the requirements shown on the endpoint you are calling.

## End-user authentication

If you are building a public app, user portal, or any flow where your own users sign in, use the end-user authentication endpoints in this reference instead of the client-credentials flow above.

Typical end-user flow:

1. Request a login or redirect URL.
2. Complete the user sign-in flow and receive a session token or login confirmation.
3. Exchange that session token for an authorization token on the documented end-user authorization endpoint.
4. Use the returned authorization token with your `x-api-key` when calling protected end-user endpoints.

Some end-user authentication endpoints remain on documented legacy paths for compatibility. Follow the exact path shown on each endpoint page.

## Workspace-scoped requests

Some endpoints are scoped to a workspace. When an endpoint documents the `x-workspace` header, send the current workspace identifier for the workspace you want to act on.

In many integrations, a workspace-bound API key already identifies the workspace. If the endpoint description says the header is optional for your API key, you can omit it in that case.

## Client portal headers

Some public app or client portal endpoints may also document optional headers such as `x-scope` or `x-app-id`.

- `x-scope` is used on some login-enabled public app flows to identify the scope of the current portal experience.
- `x-app-id` is used on some public app form submission flows when the app provides a specific app identifier.

Only send these headers when the endpoint documentation for your scenario calls for them.

## Contributing

This repository combines generated public API specifications with manual endpoint descriptions. Contributions should improve the public contract and the consumer-facing documentation without adding internal implementation details.
