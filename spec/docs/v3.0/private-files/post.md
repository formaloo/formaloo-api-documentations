
Use this endpoint to get a permenant url to access a file. The normal url for the files are private and need authentication to be accessed, but the url given in this endpoint is accessible anywhere without any authenrication.

Please be extremely carefull in using this endpoint, as the url you will get should not be shared publicly.

Only the workspace owner can access this endpoint.

**Request Eaxmple**
```
curl --location --request POST 'https://api.formaloo.me/v3.0/private-files/' \
--header 'x-api-key: {API Key}' \
--header 'Authorization: JWT {Auth Token}' \
--header 'Content-Type: application/json' \
--header 'x-workspace: ztOWWXs1' \
--data-raw '{
    "file_path": "https://api.formaloo.me/media/form/dkvLqOHL/file/czkpO3MF/czkpO3MF49875fe9-957e-4abb-a447-aee7fcbf3623.png"
}'
```

**Response Eaxmple**
```
{
    "status": 200,
    "errors": {
        "general_errors": [],
        "form_errors": {}
    },
    "data": {
        "file": "https://s3.amazonaws.com/formaloo-en/s/2025/3/10/czkpO3MF49875fe9-957e-4abb-a447-aee7fcbf3623.png"
    }
}
```
