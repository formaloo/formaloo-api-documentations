Returns public-facing runtime content for a shared board block. Use this to display rows, kanban cards, stats, charts, content, or summaries in a published app while respecting public and end-user access rules.

For kanban and gallery blocks, row objects include only the fields configured in `card_fields`. When `card_fields` is empty, the endpoint falls back to `fields`. The block payload still returns `fields` separately for clients that configure the open-row editor.
