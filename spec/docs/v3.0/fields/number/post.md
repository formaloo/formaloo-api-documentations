# Create a number field

Use this endpoint to create a number input field.

## Using decimal fields

If you want your number field to accept decimal values, you can do so by setting the `decimal_places` field to a number other than zero. This field is set to `0` by default. meaning the number field will accept an integer number (e.g. 1, 43, 871). By setting the `decimal_places`, your field can accept a decimal number based on your setting. For example, if you set it to `1`, your field will accept a number with one decimal point (e.g. 1.2, 42.0), if you set ot to `2`, your field will accept a number with two decimal points (e.g. 3.14, 33.21). The maximum value for `decimal_places` is `10`, meaning you cannot set for a number for more than 10 decimal points.

The `min_value` and `max_value` fields will accept a decimal number up to two decimal places for now, but if your `decimal_places` is set to `0`, system will treat them as integers. Meaning if you set one of them to `10.12`, it will be converted to `10`.

### Integer vs. Decimal in behavior

If the `decimal_places` field is set to `0`, the system will assume that your number is an integer, thus will treat is as one. Meaning you will have to send an integer number on its submission, and return an integer while reading it, you have to use integers for field's `min_value` and `max_value`, etc.
If you change the `decimal_places` value for an existing field, all the old value will be retained, but system will treat them with the new behavior. For example, if you change it from `0` to `2`, a submission with the value `2` will be shown as a decimal number (e.g. `2.0`). IF you change the `decimal_places` value from `2` to `0`, a value which was previously submitted as `3.14`, will be shown as `3` in the field's display value, however the original value will be retained (and you will see it in the `raw_value` field), so if you change the `decimal_places` back to `2`, the submitted value will be shown as `3.14` again.

**Note:** You can change the `decimal_places` in the update requests as well.
