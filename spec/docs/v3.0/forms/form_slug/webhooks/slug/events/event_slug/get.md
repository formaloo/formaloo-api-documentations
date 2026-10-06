Returns one outbound webhook delivery, including the request body, error log, and retry count.

The body is in `data`. About 30 days after the event is created it is cleared and then returned as an empty object. Status, retries, and `error_logs` remain.

`row` matches the list: an object with the row `slug` and the form slug in `form`, or null when the event has no row.

This endpoint is read-only.
