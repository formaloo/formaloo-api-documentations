Update a form.

## Making the uploaded files private

The `submitted_files_are_private` field on the form, defines wether the files uploaded on a form should be accessible to anyone who has the link to the file, or are only accessible to anyone who has access to the form. Meaning, anyone, even of not authenticated, can see an uploaded file using its link (which needs to be shared by a form admin). But if the `submitted_files_are_private` is set to `true`, the links will be private, and only those who have access to the form can see the file.


 **Note** If you change the `submitted_files_are_private` field from, it won't affect the existing links. For example, if you change it from `false` to `true`, the link to the previous files will still be publicly accessible, but the new uploads will be private.


 The value for `submitted_files_are_private` is `false` by default.

## Form Logic

### Matrix and Table fields logic

When setting logic for a **Matrix Field** You can access the value selected for a given group, with the following syntax `matrix_field_slug.group_slug` and compare it with the desired choice. Type of these logic conditions are not `choice`, but `matrix`, since they're a specific case.

When setting logic for a **Table Field** You can access the value selected for a given cell, with the following syntax `table_field_slug.group_slug.column_slug` and compare it with the desired value. Type of these logic conditions are not `choice`, but `table`, since they're a specific case.

Example

``` json
{
  "logic": [
    {
      "type": "field",
      "identifier": "{field_1}",
      "actions": [
        {
          "action": "hide",
          "args": [
            {
              "type": "field",
              "identifier": "{field_3}"
            }
          ],
          "when": {
            "operation": "is",
            "args": [
              {
                "type": "matrix",
                "value": "{field_1}.{field_1_group_1}"
              },
              {
                "type": "choice",
                "value": "{field_1_choice_1}"
              }
            ]
          }
        }
      ]
    },
    {
      "type": "field",
      "identifier": "{field_2}",
      "actions": [
        {
          "action": "hide",
          "args": [
            {
              "type": "field",
              "identifier": "{field_4}"
            }
          ],
          "when": {
            "operation": "is",
            "args": [
              {
                "type": "table",
                "value": "{field_2}.{field_2_group_2}.{field_2_column_2}"
              },
              {
                "type": "constant",
                "value": "Tango"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

## Assign Submit Number

The `assign_submit_number` field on the form defines whether each submission on a form will be assigned an incremental number starting from 1. By default, this field is set to `false`, meaning that no incremental numbering will be applied. However, when set to `true`, each new submission on the form will be given a `submit_number` that starts from `1` and increments by 1 with each new submission. 

The `submit_number` can be useful for keeping track of the order of submissions or for internal referencing purposes.

### Usage

- **Field Name**: `assign_submit_number`
- **Default Value**: `false`
- **Type**: `boolean`
- **Purpose**: If `true`, assigns an incremental `submit_number` starting from 1 to each submission.

### API Behavior

When the `assign_submit_number` field is set to `true`, the following changes will be visible:

- **In Submission Response**: 
  - Every submission will have an additional field, `submit_number`, which reflects its incremental number.
  
  Example:
  ```json
    {
        "submit_number": 5,
        "tracking_code": "ABC123",
        ...
    }



**Notes**
*   If a row is deleted, the submit_number for subsequent submissions will continue incrementing from the last assigned number (i.e., gaps may exist in the submit_number sequence if some submissions are deleted).

*   The `submit_number` is not editable once assigned and is automatically handled by the backend.

*   number is not editable once assigned and is automatically handled by the backend.