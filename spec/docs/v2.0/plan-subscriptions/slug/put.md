# Update a plan subscription

## Cancel a plan subscription

Using this endpoint, you can cancel a subscription. This means that the user won't be charged for the upcoming intervals, but their curren business plan will be active until it's term.

Depending on the subscription method (e.g. Stripe), the cancellation process will be asynchronous. On these cases, the subscription status will be updated to `canceling` and after it is canceled, it will be automatically set to `canceled`.

### Example

```json
// **Request**
https://api.formaloo.net/v2.0/plans/{plan_slug}/ (PUT)

// **Request**
{
    "cancel_subscription": true
}

// **Response**
{
    "status": 200,
    "errors": {
        "general_errors": [],
        "form_errors": {}
    },
    "data": {
        "plan_subscription": {
            "plan_deal": {
                "plan": {
                    "title": "Plus",
                    "plan_type": "plus",
                    "description": "",
                    "slug": "KpemozRk"
                },
                "slug": "lXZt9fLN",
                "title": "Monthly Plus",
                "display_title": "Monthly Plus",
                "is_subscription": true,
                "description": ""
            },
            "status": "canceling",
            "business_plans": [
                {
                    "from_date": "2022-09-04",
                    "to_date": "2022-10-04",
                    "is_active": true,
                    "status": "completed",
                    "paid_amount": "10.00"
                }
            ],
            "payments": [
                {
                    "created_at": "2022-09-04T11:55:30.465150+04:30",
                    "amount": "10.00",
                    "successful": true,
                    "transaction_code": "4389755793"
                }
            ],
            "subscription_method": {
                "title": "Stripe",
                "logo": null,
                "description": null
            },
            "created_at": "2022-09-04T11:53:39.555612+04:30",
            "slug": "K3RTSg5t"
        }
    }
}
```
