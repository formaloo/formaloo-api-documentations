Retrieves the authenticated profile's installed app record for the requested integration type.

This checks installation state only. Provider authorization and configured items have their own endpoints and lifecycles, so an installed app may still need a connection or form mapping.

When multiple catalog entries share the requested type, pass the catalog entry
slug in the optional `app_slug` query parameter.
