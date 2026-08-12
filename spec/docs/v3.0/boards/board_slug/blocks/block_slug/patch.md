
# Update a board/app block

Use this endpoint to update an existing block on a board/app. The API uses one PATCH endpoint for several block types, so first retrieve the block, check its `type`, and send the fields that belong to that block type.

For data blocks connected to forms:

- `form_result` uses `form`, `fields`, `filters`, `settings`, edit flags, voting, and export settings.
- `form_charts` uses `form`, `fields`, `subtype`, `settings`, and `config`.
- `kanban` uses `form`, `fields`, `columns_field`, `items_field`, `featured_image_field`, `filters`, `settings`, `mode`, and `display_type`.
- `gallery` is a kanban block with `display_type: "grid_view"`.
- `ai_summary` uses `form`, `user_questions`, `length`, and `ai_engine_id`.
- `form_display` uses `form`, `display_type`, `style_type`, and optional `fields`.

`filters` is saved block state. Send the complete intended filter snapshot when saving filters on the block. `settings` and `config` are dashboard metadata objects; retrieve the block first and preserve existing keys when changing one nested value.

## Example: update a result table

```json
{
  "fields": ["name", "email", "status"],
  "filters": {
    "fields_filters": {},
    "sort_by": [],
    "meta_data_fields": {
      "exclude": ["ip"]
    }
  },
  "settings": {
    "columns_width": {
      "name": 240
    }
  }
}
```

## Example: update a gallery view

```json
{
  "display_type": "grid_view",
  "items_field": "applicant_name",
  "featured_image_field": "photo",
  "settings": {
    "columns_count": "3",
    "card_fields": ["status", "rating"]
  }
}
```

## Setting blocks in a menu item for a menu block

When updating a menu block, the body can contain menu `items`. If a menu item should open one or more blocks, set the menu item's `type` to `block` and send the complete desired list of block slugs inside `blocks`.

```json
{
  "items": [
    {
      "type": "block",
      "title": "Show list of blocks",
      "blocks": [
        "block_1_slug",
        "block_2_slug",
        "block_3_slug"
      ]
    }
  ]
}
```

The response contains the basic data for each block.

## Enable or disable row editing for end users

To grant edit access to assigned end users, set `assignee_can_edit` to `true`. Set it to `false` to disable that access.

```json
{
  "assignee_can_edit": true
}
```

## Change block type

You can change a block's type by sending the `type` field and any fields required for the new type. Changing type removes data that belongs only to the previous type. For example, changing a form-result block to another block type removes its form-result relations and settings; changing back later requires setting them again.

Menu blocks are not interchangeable with other block types.

## Notification Settings

Use `submit_push_notif` and `row_update_push_notif` to manage public notification settings for this board. These fields are `false` by default. When set to `true`, a push notification is sent to subscribers after a row submission or update.

- `submit_push_notif`: Whether to send a notification after a new submit on this block's form.
- `row_update_push_notif`: Whether to send a notification after a row on this block's form is updated.

These notification settings apply to blocks connected to a form, such as form-result and kanban blocks.
