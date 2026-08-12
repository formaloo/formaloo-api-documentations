Creates a kanban block on a board/app. Use this when an app page should show form submissions as workflow cards grouped by a choice-like field.

`form` is the source form slug. `columns_field` is the field used to group cards and should be choice-like (`choice`, `dropdown`, `rating`, or `yes_no`). `items_field` is the non-file field used as the card title or primary label. `featured_image_field` is a file field used as the card image.

```json
{
  "title": "Pipeline",
  "form": "application_form",
  "fields": ["name", "status", "photo"],
  "columns_field": "status",
  "items_field": "name",
  "featured_image_field": "photo",
  "mode": "read_only",
  "display_type": "kanban"
}
```

For a gallery/card grid, create a kanban block with `display_type: "grid_view"`:

```json
{
  "title": "Applicant gallery",
  "form": "application_form",
  "fields": ["name", "status", "photo"],
  "items_field": "name",
  "featured_image_field": "photo",
  "display_type": "grid_view",
  "settings": {
    "columns_count": "3",
    "card_fields": ["status"]
  }
}
```

`filters` is saved block state. Send the complete intended filter snapshot when saving filters on the block. `settings` and `config` are dashboard metadata objects; retrieve the block first and preserve existing keys when changing one nested value later.

## Adding My Data filter to a board

If block's form contains any user fields, the results (responses) on the block can set to be automatically filtered by the given field. This way, each user can only see the list of responses assigned to them on the given field. In order to apply this filter, you can set the `user_field` key inside the `filters` attribute of the block. For example:

``` json
{
    "filters":{
        "user_field": "{USER_FIELD_SLUG}"
    }
}
```
