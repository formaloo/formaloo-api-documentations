# Linked row field

## Auto-creating lookup fields

When updating the linked row field, you can send a list of slugs of the fields (`create_lookup_for_fields`), so a new lookup field is created for each.
The newly created lookup fields will be connected to the specified fields, the current linked row field, and also copy all their data from the current field.
The list of fields sent on `create_lookup_for_fields` should contain the slug of the fields with these specification:

- They should be on the related form of the current field.
- They should be fields that support a linked row connected for them. So, not readonly fields (e.g. meta or success page), no complex fields (e.g. matrix or table).

Whatever field you send on `create_lookup_for_fields`, a new lookup field will be created for it. Even if the list contains repetitive items or a lookup field with for the given field already exists.

List of the newly created fields will be sent back on `new_lookup_fields` field. These fields are automatically added to the form, right after the current field. So always get the new data of the form from the server after creating new fields using this method.

Request Example

``` json
{
   "create_lookup_for_fields": [
       "IXVsW05e",
       "Y2BUblWG"
   ]
}
```

Response Example
``` json
{
    "status": 200,
    "errors": {
        "general_errors": [],
        "form_errors": {}
    },
    "data": {
        "field": {
            "type": "linked_rows",
            "related_form": {
                "slug": "YdUTckS0",
                "address": "bfq2f",
                "title": "NPS New Test 25",
                "category": null,
                "show_submit_tracking_code": false,
                "assign_submit_number": false,
                "accept_draft_answers": false,
                "ai_mode": false,
                "full_form_address": "https://me.formaloo.xi/bfq2f",
                "version": "v1",
                "generate_pdf_for_user": false,
                "generate_pdf_for_admin": false
            },
            ...,
            "new_lookup_fields": [
                {
                    "slug": "ZwEpJU5E",
                    "created_at": "2024-10-04T12:55:42.227433Z",
                    "updated_at": "2024-10-04T12:55:42.227462Z",
                    "type": "lookup",
                    "title": "lined rows field",
                    "alias": null,
                    "description": null,
                    "answer_description": null,
                    "position": 0,
                    "required": false,
                    "unique": false,
                    "admin_only": false,
                    "read_only": false,
                    "json_key": null,
                    "is_calculatable": true,
                    "calculation_items": null,
                    "is_random_sortable": true
                },
                {
                    "slug": "rso2FKLn",
                    "created_at": "2024-10-04T12:55:42.241882Z",
                    "updated_at": "2024-10-04T12:55:42.241911Z",
                    "type": "lookup",
                    "title": "lined rows field",
                    "alias": null,
                    "description": null,
                    "answer_description": null,
                    "position": 0,
                    "required": false,
                    "unique": false,
                    "admin_only": false,
                    "read_only": false,
                    "json_key": null,
                    "is_calculatable": true,
                    "calculation_items": null,
                    "is_random_sortable": true
                }
            ],
            "default": null
        }
    }
}
```# Update a field
update a field's data. Although it only shows the general fields options on the schema, it accepts and excepts all the options needed for the given field's type. For example for the `number` field you can send the `min_value` and `max_value` options.
<br>
## Setting a default value on the field
Most of the fields accept a default value on the edit request, by setting it on `default`. If set, the default value will be automatically set for any response on the form, if the end user does not provide any value for this fields. for example, on a `number` field, if the value is set to `12`, and users does fill this field on their submission, the value `12` will be automatically set for the field.
Each field's `default` value will be validated by the field, as if it's a value sent on submission. For example, on a `number` field with `min_value` set to 1 and `max_value` set to 10, the default value should be a valid **Number**, **Greater than or equal to 1** and **Lesser than or equal to 10**, or for a `multiple_select` field, the value for default can be something like `["choice_1_slug", "choice_2_slug"]` where `choice_1_slug` and `choice_2_slug` are both value choices on the field.
If upon updating the field settings, the value for `default` becomes invalid, it will be automatically set to `null`. For example, if on a `number` with the `default` set to `10`, you change the `min_value` to `20`, the current default will become invalid, and automatically set to `null`.
**Fields that don't accept `default`**
- `file`
- `signature`
- `matrix`
- `table`
- `meta`
- `success_page`
- `email_verification`
- `phone_verification`
## Decimal values
The number field and money fields support decimal values. Read the documentation for creating a number field to see how it works.
You can add the support for decimal values by updating an existing number/money field, and not just by creating a new one.
<br/>
## Subscription based product
You can update a product field to make in a subscription based. This way, when users can buy a subscription from you, and will be charged regularly based and the pricing and the intervals you've set in your payment service.
In order to create a subscription based product field, you should set the `is_subscription` to `true` and send the subscription item's identifier in `subscribed_item_id`. When doing this, the `unit_price` will be automatically read and set from the payment service, based on the `subscribed_item_id` and the `max_value` will be automatically set to `1`. User can optionally enter either `0` or `1` for the `min_value` field.
Please not that if you set the `is_subscription` to false, the product field will change to a normal product field, even if `subscribed_item_id` is already set.
As mentioned, the unit price for the subscription based product is automatically set, but user should add the other data (for example, the subscription's payment intervals) in the description of their field or form.
### Requirements
In order to have a subscription based product field, user needs to have the following requirements:
- User must have a payment method that supports subscriptions. (Stripe for now).
- User Create a subscription item on their payment gateway's panel.
- The field should be connected to the form that's connected to the payment method. If it's not already connected, you can do it in the update request.
### Limitations
- Users **can't** buy more than one subscription at a time, be it from two different items or a similar item.
- Users **can't** make a regular purchase and a subscriptions in the same submit.
- If the're more than one subscription items, or a subscription and a on-time purchase in the same submit, only the first subscription product will be taken into account and all the rest will be ignored.
- Users **can** have multiple subscription based and normal products in the same form if they make sure that they use proper logic to make sure only one of them is shown or filled in any request.
- Users also **can** have multiple normal product fields and submit them at the same time for a on-time purchase, as long as no subscription based product field is submitted.
