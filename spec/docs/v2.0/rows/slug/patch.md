Update a submitted row.

# Position for rows

Position field added to rows. position for new rows will be set automatically.

We can change the position of a row, we should send `previous_position` **or** `next_position`, and the row will be between these positions.

If the user wants to move the row at the beginning of the table you must send the `next_position` (it has not a previous row) and if wanted to move it at the end of the table (last row) you must send the `previous_position` (it has not a next row).

