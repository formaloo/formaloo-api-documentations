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

### Set fields' value based on condition(s)

#### Example 1 - Using Text fields

Fields:
``` 
Text Field A: mu1oEnbp
Text Field B: 7IdBlI0V
```

Conditions:
```text
if A == 'Python'
then set B to 'Yay'
```

```json
{
    "logic": [
        {
            "type": "field",
            "identifier": "mu1oEnbp",
            "actions": [
                {
                    "action": "set",
                    "args": [
                        {
                            "type": "field",
                            "identifier": "7IdBlI0V" 
                        },
                        {
                            "type": "constant",
                            "value": "Yay"
                        }  
                    ],
                    "when": {
                        "operation": "equal",
                        "args": [
                            {
                                "type": "field",
                                "value": "mu1oEnbp"
                            },
                            {
                                "type": "constant",
                                "value": "Python"
                            }
                        ]
                    }
                }
            ]
        }
    ]
}
```

#### Example 2 - Using Choice fields

Fields:
``` 
Choice Field A: PrJNHykP
    Option 1: dgf67dGH
    Option 2: ysFv28XR 

Choice Field B: KRwEpVNX
    Option 1: f6dyegtF
    Option 2: rO0byBlU
    
```

Conditions:
```text
if A == 'Option 2'
then set B to 'Option 2'
```

```json
{
    "logic": [
        {
            "type": "field",
            "identifier": "PrJNHykP",
            "actions": [
                {
                    "action": "set",
                    "args": [
                        {
                            "identifier": "KRwEpVNX",
                            "type": "field"
                        },
                        {
                            "identifier": "rO0byBlU",
                            "type": "choice"
                        }
                    ],
                    "when": {
                        "operation": "is",
                        "args": [
                            {
                                "type": "field",
                                "value": "PrJNHykP"
                            },
                            {
                                "type": "choice",
                                "value": "ysFv28XR"
                            }
                        ]
                    }
                }
            ]
        }
    ]
}
```