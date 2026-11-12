Lists the same engines as `GET /v3.0/engines/`: this workspace's engines, and public engines marked `show_in_list`.

The response also includes `settings` and `is_default`. `settings` is the credential keys only, each set to `null`. Values are never returned. A public engine returns `settings` as `{}`.

Send the workspace with `X-Business` or `X-Workspace`.
