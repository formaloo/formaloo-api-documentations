Lists databases accessible through one connected Notion workspace.

`notion_databases` is an array of Notion database objects, not a string. Use a returned database `id` as `database_id`; keys in the form mapping are saved Formaloo field slugs and values use property `name` and `type` discovered from that database.
