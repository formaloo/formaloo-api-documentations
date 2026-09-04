Installs a catalog app for the authenticated profile in the active workspace.

Pass the canonical catalog type in `app`. When multiple catalog entries share
that type, such as Make templates, also pass the catalog entry slug in the
`app_slug` query parameter.

This creates or reuses an installed-app record. It does not create provider
credentials or a form-level mapping. Most apps return `redirection_url: null`.
A non-null URL is an external setup handoff, currently used by Make, and must
be completed separately.
