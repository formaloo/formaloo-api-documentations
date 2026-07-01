# Magic submit

You can use this endpoint to get suggestions for a new form theme. How it works is that you send the user's request in the body to the form maker service.

``` json
{
    "input_text": "I want my form to have a professional look and use the McDonald branding."
}
```

Optionally, you can send an exiting theme's slug as well, so the AI has its data and works by updating that theme's data instead of creating a new set of settings from scratch. This helps for having minor changes on a theme you already have.

``` json
{
    "input_text": "I want my form to have a professional look and use the McDonald branding.",
    "theme": "{THEME_SLUG}"
}
```

Also, if you already have sent a request and this one is a follow up request to have additional updated on the AI suggested theme, you can send the `conversation_id` so the AI has the context of the previous conversations and suggestions:

``` json
{
    "input_text": "I want my form to have a professional look and use the McDonald branding.",
    "conversation": "{CONVERSATION_ID}"
}
```

or

``` json
{
    "input_text": "I want my form to have a professional look and use the McDonald branding.",
    "conversation": "{CONVERSATION_ID}",
    "theme": "{THEME_SLUG}"
}
```

In response, the form maker service returns an slug for your ai request and the conversation id you can use for follow up requests.

``` json
{
    "status": 200,
    "errors": {
        "general_errors": [],
        "form_errors": {}
    },
    "data": {
        "magic_submit": {
            "slug": "request_id",
            "conversation": "conversation_id",
            "delivery_id": null
        }
    }
}
```

After this, you should connect to the websocket service by sending a request, like this, with standard auth headers.

```
{{ws_server}}/ws/workspace/
```

Meanwhile, the AI service will use the user input along with the form data to try and extract the theme design data for the form. When the response is ready, it will be sent back on the websocket connection:

```
{
    "ai_request": "request_id",
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
