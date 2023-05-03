# Submit a form

You can use this endpoint to submit a form. In order to do so, you should send a `post` request, containing a map from each field to an acceptable value for it. For example for a number field, `3319` is an acceptable value while a text (e.g. `"john doe"`) is not accepted. For the choice fields, you should send the desired choice's slug, and so on.

The mapping should look something like this:

```json
{
    "{short_text_field_slug}": "some short text",
    "{long_text_field_slug}": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    "{number_field_slug}": 50,
    "{yes_no_field_slug}": "no",
    "{boolean_field_slug}": false,
    "{choice_field_slug}": "{choice_1_slug}",
    "{multiple_select_field_slug}": [
        "{choice_3_slug}",
        "{choice_4_slug}"
    ],
    "{matrix_field_slug}": {
        "{group_1_slug}": "{choice_3_slug}",
        "{group_2_slug}": "{choice_2_slug}",
        "{group_3_slug}": "{choice_1_slug}"
    },
    "{time_field_slug}": "12:12:00",
    "{date_field_slug}": "1991-02-10",
    "{website_field_slug}": "http://www.google.com",
    "{phone_field_slug}": "+1-123-4567",
    "{email_field_slug}": "me@example.com"
}
```

Which with real values, looks like the following:

```json
{
    "rzkxaWgNY7": "some short text",
    "9Yyju0CAEf": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    "EqQAWBKdVA": 50,
    "HbyBQV04yU": "no",
    "KU6uPpZJkg": false,
    "Lb2J7AksMg": "choice_x8dNpnG1pV",
    "NPLtzA9eYc": [
        "choice_epvJJU5U5r",
        "choice_AsDazGzYYm"
    ],
    "BdIjoxh0Wz": {
        "group_bifpolzsZD": "choice_G8wRAk99XI",
        "group_eyF2bD68pE": "choice_G8wRAk99XI",
        "group_ktwpEWntIY": "choice_G8wRAk99XI"
    },
    "RzPA9X0nF5": 2319,
    "Sx4Z3GG28L": "12:12:00",
    "tuMqjNtSiE": "1991-02-10",
    "hHdVmLX7yz": "http://www.google.com",
    "ZpYvS3330a": "+1-123-4567",
    "6Qr5btT9ad": "me@example.com"
}
```

## Authorization and Authentication

In order to submit a form using this endpoint, you don't have to send an `Authorization` header, but you should send the `x-api-key` header to identify your application.

## Notes

Please make sure to use the fields' slug, not their title.

Although our service accepts most content types, like `form-data`, it's highly recommended to use `application/json` since it guarantees the correct format of values for the more complex fields (e.g. Matrix fields).
