Retrieves a form with its field configuration for builder use. Use this when an agent needs the editable form structure, not just form metadata.

Use this before bulk-editing fields so you can preserve existing field slugs, choice slugs, aliases, positions, logic references, and settings.

This endpoint is the safest starting point for agent-driven form editing because the matching `PUT`/`PATCH` endpoints accept form metadata and field definitions together.
