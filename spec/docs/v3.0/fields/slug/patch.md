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
```