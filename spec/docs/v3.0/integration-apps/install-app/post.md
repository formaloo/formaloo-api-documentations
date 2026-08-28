Installs a catalog app for the authenticated profile in the active workspace.

Pass the catalog app slug in `app`. This creates (or reuses) a `UserInstalledIntegrationApp` record; it does not create provider credentials or a form-level mapping. Most apps return `redirection_url: null`. A non-null URL is an external setup handoff (currently used by Make) and must be completed separately.
