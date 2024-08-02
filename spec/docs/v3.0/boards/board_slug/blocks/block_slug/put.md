
# Setting blocks in a menu item for a menu block

If a menu item under your menu block is supposed to open one or more blocks, the menu item's type should be `block` and you should send the list of blocks' slug inside it. For example:
‍‍‍
``` json
{
    "items": [
        {
            "type": "block",
            "title": "Show list of blocks",
            "blocks": [
                "block_1_slug",
                "block_2_slug",
                "block_3_slug,
            ]
        }
    ]
}
```

The response contains the basic data for each block.