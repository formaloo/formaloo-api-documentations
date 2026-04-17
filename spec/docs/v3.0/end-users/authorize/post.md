Exchange an end-user session token for an authorization token.

Use this endpoint after the end user has completed the login flow and you have received a valid session token.

## Required headers

- `x-api-key`: your API Key
- `Authorization`: the end-user session token returned by the login flow

## Response

The response includes an authorization token that you can send on later protected requests for that signed-in end user.
