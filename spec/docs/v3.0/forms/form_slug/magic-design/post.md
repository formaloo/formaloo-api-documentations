# Magic submit

You can use this endpoint to get suggestions for a new form theme. How it works is that you send the user's request in the body to the form maker service.

``` json
{
    "input_text": "I want my form to have a professional look and use the McDonald branding."
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

Meanwhile, the AI service will use the user input along with the form data to try and extract the theme design data for the form. When the response is ready, it will be sent back on the websocket connection:

```
{
    "ai_request": "2pk3y1r2",
    "prompt_template": "mkf4rgy4",
    "status": "completed",
    "ai_response": {
        "title": "McDonald's Customer Satisfaction Survey",
        "form_type": "simple",
        "text_color": "{\"r\":255,\"g\":255,\"b\":255,\"a\":1}",
        "button_color": "{\"r\":255,\"g\":0,\"b\":0,\"a\":1}",
        "theme_color": null,
        "field_color": "{\"r\":230,\"g\":230,\"b\":230,\"a\":1}",
        "background_color": "{\"r\":255,\"g\":180,\"b\":0,\"a\":1}",
        "border_color": "{\"r\":255,\"g\":255,\"b\":255,\"a\":0.3}",
        "submit_text_color": "{\"r\":255,\"g\":255,\"b\":255,\"a\":1}",
        "logo_position": "center",
        "show_title": true,
        "theme_config": {
            "form_layout": "center",
            "modern_view": true,
            "background_image": {},
            "customized_texts": {
            "start_btn": "Let's Go!",
            "continue_btn": "Next Step"
            },
            "display_welcome_page": true,
            "field_background_color": "{\"r\":255,\"g\":255,\"b\":255,\"a\":0.8}",
            "font_size": "large",
            "fullwidth_theme": false
        }
    }
}
```

You can use the data for creating/updating a theme.
Note that the websocket connection will close the connection after the response is returned, wether the `status` is `completed` or `failed`.
