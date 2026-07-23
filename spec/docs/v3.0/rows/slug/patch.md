Update a submitted row.

Send editable field values as top-level keys using field slugs, the same shape used when creating a row. You may also send row-level fields such as `row_tags`, `previous_position`, or `next_position`.

Do **not** wrap field values inside a `data` object. Field values are sent as attributes of the row itself.

Incorrect:

``` json
{
    "data": {
        "FIELD_X": "value",
        "FIELD_Y": 1
    },
    "submit_time": "00:15:22Z"
}
```

Correct:

``` json
{
    "FIELD_X": "value",
    "FIELD_Y": 1,
    "submit_time": "00:15:22Z"
}
```

Only the fields you include are updated; omitted fields keep their current values. Use the field's slug as the key, not its title. The same field types and value formats accepted when submitting a form apply here.

Updating a row can run update logic and trigger configured post-update activities such as webhooks, emails, Slack events, or PDF generation.

# Position for rows

Position field added to rows. position for new rows will be set automatically.

We can change the position of a row, we should send `previous_position` **or** `next_position`, and the row will be between these positions.

If the user wants to move the row at the beginning of the table you must send the `next_position` (it has not a previous row) and if wanted to move it at the end of the table (last row) you must send the `previous_position` (it has not a next row).
