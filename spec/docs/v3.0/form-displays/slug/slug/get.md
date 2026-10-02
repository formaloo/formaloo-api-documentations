Returns the public form definition for a live renderer. Fetch this on each load. Do not bake `fields_list`, choice lists, or labels into the client.

The response envelope's form object is `data.form`. Render `fields_list` in order and look up each field by slug in `fields`.

## Renderer

These steps are browser interaction. They do not replace server validation, stored calculations, or submit actions.

Pages come from `fields_list`. A `meta` field with `sub_type` `page_break` splits a classic form. `theme.form_type` `simple` is that classic layout. `multi_step` is one question at a time and does not use page breaks as pages. The hosted renderer checks the current page's visible fields before moving on, and skips a classic page whose fields are all hidden.

`show` and `hide` change which fields are on screen. Hidden fields are not rendered and are not part of that page check. `disable` is not applied when the API decides which fields a submit reached, and the hosted action switch does not implement it. A lookup with `sync_with_linked_rows` is rendered read-only. That is separate from `disable`.

The hosted client checks field rules in the browser before submit. If submit validation fails, the response includes `errors.form_errors` and the row is not saved.

Titles, descriptions, and the ending page may contain `@alias` or `{{alias}}`. Replacing those tokens changes display text only. Formula variables may show a client preview. Submit recomputes them; a preview is not the stored value.

Apply `theme` from this payload: colors, `theme_config.form_layout`, and `theme_config.field_width`. `theme.form_type` selects classic versus one-question-at-a-time.

After a successful submit, render `success_page` from that response, including its description after answer piping. Do not keep showing a page chosen only in the browser when the response includes `success_page`.

`active` and the max-submit counters are excluded from this payload. Submit enforces them.

`portal_user_form`, when present, is the portal directory for this form. Its `login_enabled` and `signup_enabled` values are the stored settings. They are not the admin user-form readback, which is true only when the stored setting is enabled and the matching forcefully-disabled flag is false. If the request already has a scope, `x-scope` must be `portal_user_form.slug`. A different scope is rejected. Do not send `x-scope` when `portal_user_form` is absent.

Send `x-api-key`. `Authorization` is not required to read a public form.

Submit answers with `POST /v3.0/form-displays/slug/{slug}/submit/`. A public address is resolved with `GET /v3.0/form-displays/address/{address}/`; there is no address submit path. Respondent files use `POST /v3.0/files/?id={fieldSlug}`.
