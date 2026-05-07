# Magic submit

You can use this endpoint to get suggestions for filling a form based on a text. How it works is that you send the user's text in the body to the form maker service.

``` json
{
    "input_text": "My name is John doe, and I currently work as a sales manager at the Silly Company."
}
```

In response, the form maker service returns an slug for your ai request, and a delivery_id for connecting to the websocket.

``` json
{
    "status": 200,
    "errors": {
        "general_errors": [],
        "form_errors": {}
    },
    "data": {
        "magic_submit": {
            "slug": "fd2ksfx6",
            "delivery_id": "1e285a0d-c56f-4a23-8ba4-4eff5a5049d7"
        }
    }
}
```

After this, you should use the delivery id to connect to the websocket service by sending a request, like this:

```
{{ws_server}}/ws/delivery/?delivery_id={{delivery_id}}
```

Meanwhile, the AI service will use the user input along with the form data to try and extract the data that can be submitted to the form. When the response is ready, it will be sent back on the websocket connection:

```
{
    "ai_request": "2pk3y1r2",
    "prompt_template": "mkf4rgy4",
    "status": "completed",
    "ai_response": {
        "hJNus0YZ": "Jon Doe",
        "ReeKN15q": "Sales manager",
        "0R9LkTzh": true,
        "ZJysuDZK": "Silly company",
        "Lceku7he": null
    }
}
```

The slugs in the `ai_responses` are the slugs of the form fields. You can use these values to fill the form for the user.
Note that the websocket connection will close the connection after the response is returned, wether the `status` is `completed` or `failed`.
