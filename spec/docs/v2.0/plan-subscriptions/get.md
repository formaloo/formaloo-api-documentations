# Get a list plan subscriptions

This endpoint will give you a list of all plan subscriptions on the current business (workspace). This list may include canceled, active, pending, or other plan subscriptions. This list contains all subscriptions created by all members of the workspace.

The list of plan subscriptions is ordered from newest to oldest, and can be filtered by their status.

### Example

``` json
// **Request**
https://api.formaloo.me/v2.0/plans/ (GET)

// **Response**
{
    "status": 200,
    "errors": {
        "general_errors": [],
        "form_errors": {}
    },
    "data": {
        "count": 3,
        "next": null,
        "previous": null,
        "plan_subscriptions": [
            {
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
                "status": "pending",
                "subscription_method": {
                    "title": "Stripe",
                    "logo": null,
                    "description": null
                },
                "created_at": "2022-09-04T11:46:22.326336+04:30",
                "slug": "BQwGODBj"
            },
            {
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
                "subscription_method": {
                    "title": "Stripe",
                    "logo": null,
                    "description": null
                },
                "created_at": "2022-08-31T16:31:02.751944+04:30",
                "slug": "OAsS8Ai3"
            },
            {
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
                "subscription_method": {
                    "title": "Stripe",
                    "logo": null,
                    "description": null
                },
                "created_at": "2022-08-31T16:28:58.257966+04:30",
                "slug": "a607WHxg"
            }
        ],
        "page_size": 10,
        "page_count": 1,
        "current_page": 1
    }
}
```
