
# Get the details of a plan

This endpoint will give you the full data available on a plan. This includes the plan data, all plan deals grouped by their seats and monthly/annual status.


### Example

```json
// **Request**
https://api.formaloo.me/v2.0/plans/KpemozRk/ (GET)

// **Response**
{
    "status": 200,
    "errors": {
        "general_errors": [],
        "form_errors": {}
    },
    "data": {
        "plan": {
            "title": "Plus",
            "plan_type": "plus",
            "description": "<div>\r\n<p><strong>All features in Free, plus:</strong></p>\r\n\r\n<div>\r\n<p>✓ 10,000 records per base</p>\r\n</div>\r\n\r\n<div>\r\n<p>✓ Access Management</p>\r\n</div>\r\n\r\n<div>\r\n<div>&nbsp;</div>\r\n\r\n<p>✓ 1,000 external members/app</p>\r\n</div>\r\n\r\n<div>\r\n<div>&nbsp;</div>\r\n\r\n<p>✓ 2GB Cloud Storage/seat</p>\r\n</div>\r\n\r\n<div>\r\n<div>&nbsp;</div>\r\n\r\n<p>✓ 2,500 monthly form submissions</p>\r\n</div>\r\n\r\n<div>&nbsp;</div>\r\n\r\n<div>✓ Accept Payments</div>\r\n</div>",
            "slug": "KpemozRk",
            "exclusive": false,
            "seats": [
                {
                    "available_seats": 4,
                    "annual": {
                        "slug": "fGunB155",
                        "title": "Three Monthly Plus",
                        "display_title": "Three Monthly Plus",
                        "price": "100.00",
                        "is_subscription": false,
                        "subscription_period": "annual",
                        "description": "",
                        "is_trial": false
                    },
                    "monthly": {
                        "slug": "lXZt9fLN",
                        "title": "Monthly Plus",
                        "display_title": "Monthly Plus",
                        "price": "100.00",
                        "is_subscription": true,
                        "subscription_period": "monthly",
                        "description": "",
                        "is_trial": false
                    }
                },
                {
                    "available_seats": 2,
                    "annual": null,
                    "monthly": {
                        "slug": "trial",
                        "title": "Trial",
                        "display_title": "Trial",
                        "price": "0.00",
                        "is_subscription": false,
                        "subscription_period": "monthly",
                        "description": "",
                        "is_trial": true
                    }
                }
            ],
            "available_extensions": [
                {
                    "title": "White Label",
                    "slug": "u3iXpQgf",
                    "description": "",
                    "monthly_price": "10.00",
                    "annual_price": 120.0
                }
            ]
        }
    }
}
```
