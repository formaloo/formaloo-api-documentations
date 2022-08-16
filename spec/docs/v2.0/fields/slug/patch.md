# Update a field

update a field's data. Although it only shows the general fields options on the schema, it accepts and excepts all the options needed for the given field's type. For example for the `number` field you can send the `min_value` and `max_value` options.

<br>

### Setting a default value on the field

Most of the fields accept a default value on the edit request, by setting it on `default`. If set, the default value will be automatically set for any response on the form, if the end user does not provide any value for this fields. for example, on a `number` field, if the value is set to `12`, and users does fill this field on their submission, the value `12` will be automatically set for the field.

Each field's `default` value will be validated by the field, as if it's a value sent on submission. For example, on a `number` field with `min_value` set to 1 and `max_value` set to 10, the default value should be a valid **Number**, **Greater than or equal to 1** and **Lesser than or equal to 10**, or for a `multiple_select` field, the value for default can be something like `["choice_1_slug", "choice_2_slug"]` where `choice_1_slug` and `choice_2_slug` are both value choices on the field.

If upon updating the field settings, the value for `default` becomes invalid, it will be automatically set to `null`. For example, if on a `number` with the `default` set to `10`, you change the `min_value` to `20`, the current default will become invalid, and automatically set to `null`.

<br>

**Fields that don't accept `default`**
- `file`
- `signature`
- `matrix`
- `table`
- `meta`
- `success_page`
- `email_verification`
- `phone_verification`