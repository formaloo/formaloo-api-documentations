
Use this endpoint to create a form result block.

## Adding My Data filter to a board

If block's form contains any user fields, the results (responses) on the block can set to be automatically filtered by the given field. This way, each user can only see the list of responses assigned to them on the given field. In order to apply this filter, you can set the `user_field` key inside the `filters` attribute of the block. For example:

``` JSON
{
    "filters":{
        "user_field": "{USER_FIELD_SLUG}"
    }
}
```
