# Update a block

You can use this endpoint to update any block with any type (e.g. stats blocks, menu blocks, form display blocks, etc). When updating a block, you can send the data specific to that type for block. For example, `menu_items` when updating a menu block.

## Change block type

You can change the type of a block, by sending editing the `type` field. If you're sending this field, you can also send the data related to the new type. For example, if you're changing a *Form Display* block to a *Report* block, you can also set the `report` for the block.

You can convert all the block types to each other, except for the `menu` block types. You can't change a `menu` to any other block type, and vice versa.

The change in block type will delete the irreverent data from your block. For example, if you change a *Form Result* block to a *Report Block*, all it's relations and settings for the form results (e.g. which form's results to show, which columns to hide, etc) will be deleted, and if you change back your block to *Form Result* again, you will have to set them from the start.
