Returns one engine the workspace can see: its own engine, or a public engine marked `show_in_list`.

`settings` contains the credential keys only, each set to `null`, and only for an engine this workspace owns. A public engine returns `settings` as `{}`. Stored values stay encrypted and are not returned.

Another workspace's engine is `404`.
