# Submit a form

Submit through the form **display slug** path: `POST /v3.0/form-displays/slug/{slug}/submit/`. There is no address-based submit path. If you only have a public form address, resolve it first with `GET /v3.0/form-displays/address/{address}/` and use the returned display slug here.

Send a `post` request containing a map from each field to an acceptable value for it. For example for a number field, `3319` is an acceptable value while a text (e.g. `"john doe"`) is not accepted. For choice, dropdown, and multiple-select fields, send the choice slug. A `choice_fetch` answer is an object with `label` and `value`.

## Live form UI

Load the definition with `GET /v3.0/form-displays/slug/{slug}/` or, when you only have an address, `GET /v3.0/form-displays/address/{address}/`. Post answers to this slug path. The body is flat: field keys at the top level, not nested under `data`.

Send `x-api-key`. `Authorization` is not required for a public submit. The hosted form client does not send cookies unless that call explicitly enables credentials.

Ordinary public submit does not validate or store answers for `meta` (including a page break), `oembed`, `success_page`, `ai_box`, or `profile_data`. A body key for one of those types is not stored as an answer, and that key alone is not a field error. A `read_only` field is included in validation when the caller can edit the form or a logic `set` targeted it; otherwise it is left out the same way. When the form has logic, fields the submit traversal did not reach are left out of validation and are not stored from the body.

Formula variables are recomputed from slug-keyed operands. A number sent for a formula variable does not replace that result.

`submitter_referer_address` in the body is discarded. The stored referer is the HTTP `Referer` header.

`submit_by_alias` stores alias-keyed answers under field slugs. Submit-time logic reads the body by field slug before that remap, so alias keys are not what emails, PDFs, Slack, webhooks, or the ending-page jump see. A renderer that needs those behaviors sends slug keys and leaves `submit_by_alias` unset.

Field errors are `errors.form_errors`, keyed by the body identifier (the alias when `submit_by_alias` is true).

The created row includes `success_page`. Render that object. If `success_page.description` contains `{% block AI %}...{% endblock %}`, the inner text is a result slug. Read it with `GET /v3.0/custom-prompt-results/{slug}/` on the server this reference publishes. The hosted form client polls a configured AI base URL instead, default `https://ai-api.formaloo.me`, at `/v1/custom-prompt-results/{slug}/`. That client base URL is not this operation's server.

When the display payload has `portal_user_form` and the request already has a scope, `x-scope` must be that object's slug. A different scope is rejected. Do not send `x-scope` when `portal_user_form` is absent. On this public payload, `login_enabled` and `signup_enabled` are the stored settings, not the admin user-form effective flags.

The hosted form client uploads a respondent file first with `POST /v3.0/files/?id={fieldSlug}` and the same `x-api-key`, then submits the returned file slug. Custom integrations must verify stored-file submission support against the deployed submit API.

## Submitting with Field Slugs

By default, request body keys must be **field slugs** (not titles, and not aliases unless `submit_by_alias` is true). Field slugs are auto-generated and cannot be controlled by users. This approach requires retrieving the form, mapping your fields with respective field slugs, and then submitting the data, which reduces reusability of integrations.

The mapping should look something like this:

``` json
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

``` json
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

## Submitting with Field Aliases

To simplify integrations and improve reusability, you can submit forms using field aliases instead of slugs. This makes the request body more readable and easier to maintain across different integrations.

Example submission using aliases:

``` json
{
    "country_of_destination": "Canada",
    "case_type": "Immigration",
    "full_name": "Sarah Johnson",
    "job_title": "Software Engineer",
    "email": "sarah.johnson@techcorp.com",
    "nationality": "United States",
    "accepted_terms": "yes",
    "submit_by_alias": true
}
```

### Requirements for Submitting with Aliases

To submit a form using field aliases, you must:

1. **Assign an alias to each field**: All fields in your form must have an alias configured. Fields without aliases cannot be submitted using this method and will be left empty.

2. **Set the `submit_by_alias` flag**: Include `"submit_by_alias": true` in your request body.

3. **Use aliases instead of slugs**: Send field aliases as keys in your request body instead of field slugs.

4. **Do not mix aliases and slugs**: You cannot use both aliases and slugs in the same request. Choose one method per submission.

Alias submit stores the answers. It does not make submit-time logic read those alias keys. See "Live form UI" above.

## Authorization and Authentication

In order to submit a form using this endpoint, you do not usually need to send an `Authorization` header. You should send the `x-api-key` header to identify your application.

This endpoint is designed for public submission scenarios, including:

- normal public forms with no login requirement
- forms embedded inside a client portal or public app
- login-enabled forms where the user is submitting through the public form flow

If your app or portal provides an app identifier, you may also send `x-app-id`. This header is optional and is only relevant in client portal or public app contexts.

If you need to create rows through an authenticated private API flow instead of the public submission flow, use the authenticated row-creation endpoint.

## Notes

When submitting with slugs, use the field's slug, not its title. When submitting with aliases, use the field's alias with `submit_by_alias` set to `true`.

Although our service accepts most content types, like `form-data`, it's highly recommended to use `application/json` since it guarantees the correct format of values for the more complex fields (e.g. Matrix fields).
