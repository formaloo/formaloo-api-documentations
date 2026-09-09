Lists configured resources for one installed integration type.

The response item schema depends on the requested type. Items can be forms,
form-provider mappings, payment methods, webhooks, templates, campaigns, or
Make installations. Not every catalog type supports this endpoint; use a
provider-specific list endpoint where one exists.

For types with multiple catalog entries, such as Make templates, pass the
catalog entry slug in the `app_slug` query parameter.
