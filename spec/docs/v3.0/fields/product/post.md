# Create product fields

Use this endpoint to create a product field. Alternatively, you can use the generic field creation endpoint, and just pass the `type` field in the POST body (`"type": "product"`).

## Create subscription based product

You can create a subscription based product using this field. This way, when users can buy a subscription from you, and will be charged regularly based and the pricing and the intervals you've set in your payment service.

In order to create a subscription based product field, you should set the `is_subscription` to `true` and send the subscription item's identifier in `subscribed_item_id`. When doing this, the `unit_price` will be automatically read and set from the payment service, based on the `subscribed_item_id` and the `max_value` will be automatically set to `1`. User can optionally enter either `0` or `1` for the `min_value` field.

Please not that if you set the `is_subscription` to false, the product field will change to a normal product field, even if `subscribed_item_id` is already set.

As mentioned, the unit price for the subscription based product is automatically set, but user should add the other data (for example, the subscription's payment intervals) in the description of their field or form.

### Requirements

In order to have a subscription based product field, user needs to have the following requirements:

- User must have a payment method that supports subscriptions. (Stripe for now).
- User Create a subscription item on their payment gateway's panel.
- User should connect the form to their payment method upon creation.

### Limitations

- Users **can't** buy more than one subscription at a time, be it from two different items or a similar item.
- Users **can't** make a regular purchase and a subscriptions in the same submit.
- If the're more than one subscription items, or a subscription and a on-time purchase in the same submit, only the first subscription product will be taken into account and all the rest will be ignored.
- Users **can** have multiple subscription based and normal products in the same form if they make sure that they use proper logic to make sure only one of them is shown or filled in any request.
- Users also **can** have multiple normal product fields and submit them at the same time for a on-time purchase, as long as no subscription based product field is submitted.

