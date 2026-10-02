Returns the same public form definition as `GET /v3.0/form-displays/slug/{slug}/`, resolved by the form address. The request domain is part of that lookup.

Use the returned form slug for `POST /v3.0/form-displays/slug/{slug}/submit/`. This address path does not accept a submission.

Rendering, `theme.form_type`, portal `x-scope`, and the excluded activity flags are the same as the slug display.
