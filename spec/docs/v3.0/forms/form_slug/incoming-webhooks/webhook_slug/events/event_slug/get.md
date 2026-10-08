Returns one incoming webhook request, including the stored body and error log.

`payload` is the JSON body received after authentication. It is null when authentication failed, and it is removed about 30 days after the event is created. Status and `error_logs` remain.

`row` matches the list: an object with the row `slug` and the form slug in `form` when the request created or updated a row, otherwise null.

This endpoint is read-only.
