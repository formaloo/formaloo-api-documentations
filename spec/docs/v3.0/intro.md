This documentation covers the Formaloo public API.

## Getting started

Use the version shown in this reference when calling an endpoint.

Most public endpoints use the `v3.0` path. A small number of endpoints remain available on documented legacy paths for compatibility. When an endpoint in this reference uses a legacy path, use the exact path shown on that endpoint.

To call the API, you need:

- an **API Key** sent with the `x-api-key` header
- an **Authorization Token** for endpoints that require authenticated access

## Getting your keys

You can manage your keys from the Formaloo dashboard:

- Sign in to [Formaloo Dashboard](https://dash.formaloo.net/u)
- Open your profile menu
- Select **API Key & Token**

## Getting an Authorization Token

Use your **Secret Key** to request an **Authorization Token** from the documented authorization endpoint.

Request headers:

`Authorization = Basic {Secret Key}`

Request body:

`grant_type=client_credentials`

Example:

```bash
curl --location --request POST 'https://api.formaloo.me/v3.0/oauth2/authorization-token/' \
--header 'Authorization: Basic {Secret Key}' \
--form 'grant_type="client_credentials"'
```

Example response:

```json
{
  "authorization_token": "{Authorization Token}"
}
```

## Calling the API

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

## Contributing

This repository combines generated public API specifications with manual endpoint descriptions. Contributions should improve the public contract and the consumer-facing documentation without adding internal implementation details.
