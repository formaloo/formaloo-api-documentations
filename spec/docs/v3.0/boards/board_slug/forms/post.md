## Activate/Deactivate user field on boards

Please note that if the board does not have the `user_field` set on it, you cannot use this endpoint.
User should have edit access to the board and all the forms in the request body.

Example for request body:
```
[
    {
        "form": "U0D6enFH",
        "user_field_enabled": true
    },
    {
        "form": "QMfXqwGP",
        "user_field_enabled": false
    },
    {
        "form": "m8fLr193",
        "user_field_enabled": true
    },
    {
        "form": "05xGZrdrBsUteWH",
        "user_field_enabled": false
    }
]
```

Example of request response:

```
{
    "status": 201,
    "errors": {
        "general_errors": [],
        "form_errors": {}
    },
    "data": {
        "forms": [
            {
                "slug": "U0D6enFH",
                "has_user_field": true
            },
            {
                "slug": "QMfXqwGP",
                "has_user_field": false
            },
            {
                "slug": "m8fLr193",
                "has_user_field": true
            },
            {
                "slug": "05xGZrdrBsUteWH",
                "has_user_field": false
            }
        ]
    }
}
```

The forms on which the `has_user_field` is set to `true`, backend will ensure that they have a user field directed to the `user_form` of the board, and if they don't have it, it will be created. 

The forms on which the `has_user_field` is set to `false`, backend will ensure that they don't have a user field directed to the `user_form` of the board, and if they don have it, it will be deleted. 