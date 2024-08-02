This is the documentations for using **Formaloo**'s REST APIs. You can use Formaloo's REST API by getting your *API Key* and *Secret Key* from your panel, and by using this documentation.

<br>
<br>

# Get started with the API

## Getting your Keys

In order to use Formaloo's REST API, first you need to get your API Key and Secret Key form your dashboard. Follow these steps to get your keys:

- Login (or signup) in [Formaloo's dashboard](https://dash.formaloo.net/u).
- Click on the profile icon on the top right corner of the dashboard.
- Choose the **API Key & Token** item from the list.

<br>

**API Key:** This key is used to identify your application and the integration you're using. You have to include it in all requests, with the header `x-api-key`

**Secret Key:** You will need this key to acquire the Authorization Tokens, sent in all requests. Please note that the Authorization Token has a short lifetime and will be expired after 30 seconds, but the **Secret Key** will not be expired and can be used to acquire as many Authorization Tokens as you want.

<br>

## Get Authorization Token

The next step is to use your **Secret Key** to acquire an **Authorization Token.** In order to do so, you have to simply send a post requests to the following endpoint: `https://api.formaloo.me/v3.0/oauth2/authorization-token/`

Your request should contain this header and body:

**Header:**

`Authorization = Basic {Secret Key}`

**Body (form-data):**

`grant_type=client_credentials`

<br>

**Example (cURL)**

``` json
curl 'https://api.formaloo.net/v3.0/oauth2/authorization-token/' \
--header 'Authorization: Basic {Secret Key}' \
--form 'grant_type="client_credentials"'
```

<br>


**Example (Python)**

``` json
import requests

url = "https://api.formaloo.me/v3.0/oauth2/authorization-token/"

payload={'grant_type': 'client_credentials'}
headers = {
  'Authorization': f'Basic {secret_key}' 
}

response = requests.post(
    url, 
    headers=headers, 
    data=payload
)

if response.status==200:
	authorization_token = response.json().get('authorization_token')
```

<br>

**Response**

``` json
{
    "authorization_token": "{Authorization Token}"
}
```

<br>

If your **Secret Key** is valid and you’re sending the request properly, you will receive an **Authorization Token** in the response, which you can use to call the API before it expires and needs to be refreshed.

<br>

## Call Formaloo’s API

In this step, you have a valid **API Key** and an active **Authorization Token.** All you need to do now is to include each in the proper header to authenticate your API call:

<br>

**Header:**

``` json
Authorization = JWT {Authorization Token}
x-api-key = {API Key}
```

<br>

Please note that all the APIs (except the authorization API) need the `x-api-key` header, while some (e.g. submitting a form) don’t need the `Authorization` header. Refer to the  API documentation to see which endpoints don’t need the `Authorization` header.

<br>

**Request Example (cURL):**

``` json

curl 'https://api.formaloo.me/v3.0/forms/' \
--header 'x-api-key: {API Key}' \
--header 'Authorization: JWT {Authorization Token}'
```

<br>

**Request Example (Python):**

``` json
import requests

url = "https://api.formaloo.me/v3.0/forms/"

headers = {
  'x-api-key': f'{api_key}',
  'Authorization': f'JWT {authorization_token}'
}

response = requests.get(
    url, 
    headers=headers
)
```

<br>
<br>

# Contribution
You can make this documentation better and more complete by helping us in writing this document. You can visit our [API documentation's GitHub repository](https://github.com/formaloo/formaloo-api-documentations) and add/edit the description for any of the endpoints.