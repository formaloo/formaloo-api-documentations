Creates a profile field that connects submissions to a user/profile form.

API v5 requires `user_form`, containing the exact slug of the user form that
supplies the profiles. The caller must have access to that user form. After
creation, use `GET /v3.0/fields/{slug}/choices/` to list or search selectable
profiles.
