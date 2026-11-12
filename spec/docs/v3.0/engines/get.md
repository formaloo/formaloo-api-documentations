Lists the engines this workspace can see: its own engines, and public engines marked `show_in_list`.

Each item has `id`, `title`, `service`, `model`, and `is_default`. This list does not include `settings`.

`is_default` is `true` for the one engine the workspace uses when an AI request does not name an engine. A public system engine can also be the system default. Those two flags are independent.

Send the workspace with `X-Business` or `X-Workspace`. The caller needs the business-user scope.
