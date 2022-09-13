# Subscribe for row events on the board

You can use this event to register for row submission and update events on this board. After you register, you will receive notifications for the forms on each block of this board, if the owner has activated notification settings for the block. Notifications will be called after new submit and a row update event, depending on the block's settings. User's device will receive the notifications based on what they've subscribed for.
You should post a request containing the device id (`key`) and the desired settings, to subscribe for the notifications. You can send another post to change the settings as well.

## Notification Data

The notification data contains the slug value for the board, block, form, and the row, its type is `P` and its `page` is `row`.

**Example:**

``` json
{
    "board": "board_slug",
    "block": "block_slug",
    "form": "form_slug",
    "row": "row_slug",
    "page": "row",
    "action_type": "U",
    "title": "You have a new notification.",
    "url": None,
}
```
