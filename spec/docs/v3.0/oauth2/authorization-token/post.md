Create an authorization token for your Formaloo API client.

Use this endpoint when your integration needs to call protected API endpoints on behalf of your application.

## Required headers

- `x-api-key`: your API Key from the Formaloo dashboard
- `Authorization: Basic {API Secret}`: your API Secret from the Formaloo dashboard

## Required body

Send:

`grant_type=client_credentials`

## Response

The response includes an authorization token that you can use on later requests:

`Authorization: JWT {Authorization Token}`
