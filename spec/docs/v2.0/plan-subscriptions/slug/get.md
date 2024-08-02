# Get a plan subscription item

This endpoint will give you a plan subscription's full data, including the list of it's payment history and business plans created by it.

### Example

``` json
// **Request**
https://api.formaloo.me/v1.0/plans/ (GET)

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
            "status": "active",
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
