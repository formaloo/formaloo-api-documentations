Creates a default board for an existing form. Use this when a form should be turned into an app/workflow view and does not already have a suitable board.

## Example request

```json
{
  "folder": "3r2nfcn2"
}
```

`folder` is optional. When provided, the new board is created inside that folder.

## Example response (`201`)

```json
{
  "status": 201,
  "errors": {
    "general_errors": [],
    "form_errors": {}
  },
  "data": {
    "form": {
      "slug": "fGtHYTMI",
      "title": "Customer Feedback",
      "submit_count": 3,
      "total_submits_count": 3,
      "board": {
        "slug": "lOv4Kabw",
        "title": "Customer Feedback",
        "share_address": "7fqk6qsw7o0u2t9",
        "is_public": false,
        "version": "v2",
        "folder": {
          "slug": "3r2nfcn2",
          "title": "Survey Boards"
        }
      }
    }
  }
}
```

Use the returned board `slug` with board, block, and board-form endpoints.
