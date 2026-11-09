
Creates a form result block on a board/app. Use this when an app page should show a table or saved result view for one known form.

`form` is the source form slug. `fields` is the ordered list of saved field slugs to show in the table. Omit `fields`, or send `[]`, to show every form field.

`excluded_fields` is the list of field slugs to hide when `fields` is empty. Only one of `fields` and `excluded_fields` may be non-empty. The API returns 400 if a write leaves both set, so send the other list as `[]` in the same request. A field added later stays visible when `fields` is empty, including when `excluded_fields` hides other columns. A non-empty `fields` list does not pick up later fields. `excluded_fields` does not change `filters.meta_data_fields.exclude`.

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
