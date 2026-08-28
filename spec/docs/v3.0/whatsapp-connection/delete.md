Disconnects the WhatsApp Business connection for the workspace selected by `active_business`. Workspace administrator access is required. Success returns `200`; a workspace without a connection returns `404`.

This is a destructive provider-level action, not merely an app uninstall. It removes the workspace connection used by WhatsApp templates and campaigns; confirm the workspace and user intent before calling it.
