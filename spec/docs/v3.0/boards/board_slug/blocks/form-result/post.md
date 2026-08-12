
Creates a form result block on a board/app. Use this when an app page should show a table or saved result view for one known form.

`form` is the source form slug. `fields` is the ordered list of saved field slugs to show in the table. Omit `fields` only when the default/all-field behavior is intended.

```json
{
  "title": "Applications",
  "form": "application_form",
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
