# Business (Workspace)

Use to get a business's data using it's identifier (`business_identifier`).

## Reading the current business plan

If you read a business’s data from ICAS, you can see the currently active plan deal along with the business data.

**Fields:** This endpoint gives you a business that you have access to. This data may include various fields:'

- `access_level`: Your access level on the business, which can be:
  - `owner` This belongs to you and you have full access to it.
  - `admin` For future purposes, won’t be returned for now.
  - `team_member` Read-only access to business. You can’t edit the business, and can’t see or edit its members and invitations.

### Example

``` json
// **Request**
https://formaloo_api_server/v1.0/businesses/{business_slug}/ (GET)

// **Response**
{
    "status": 200,
    "errors": {
        "general_errors": [],
        "form_errors": {}
    },
    "data": {
        "object": {
            "access_level": "owner",
            "plan": {
                "plan": {
                    "title": "Enterprise",
                    "plan_type": "enterprise",
                    "description": "",
                    "slug": "gjhjfg"
                },
                "slug": "enterprise_1",
                "title": "Monthly Enterprise",
                "display_title": "Monthly Enterprise - Silver",
                "description": ""
            },
            "title": "John Doe",
            "description": null,
            "slug": "oUmtrSgO",
            "last_update": null,
            "business_services": [
                ...
            ],
            "business_identifier": "oUmtrSgO",
            "extra_data": {},
            "icon": "https://api.staging.formaloo.net/media/businesses/f2e8d86686deb47e/icons/acc127df-65d9-40ce-93b9-5a1ba4cc2a3a.jpg",
            "fav_icon": "https://api.staging.formaloo.net/media/businesses/f2e8d86686deb47e/favicons/104b0f7a-23ed-4e4e-8045-12f6100ac6a6.jpg",
            "features_visibility": {
                "templates": false,
                "old_dashboard": true
                "a_feature": true,
                "another_component": false,
            }
        }
    }
}
```

### Example: No active plan

``` json
// **Request**
https://formaloo_api_server/v1.0/businesses/{business_slug}/ (GET)

// **Response**
{
    "status": 200,
    "errors": {
        "general_errors": [],
        "form_errors": {}
    },
    "data": {
        "object": {
            "access_level": "team_member",
            "plan": null,
            "title": "John Doe",
            "description": null,
            "slug": "oUmtrSgO",
            "last_update": null,
            "business_services": [
                ...
            ],
            "business_identifier": "oUmtrSgO",
            "extra_data": {}
        }
    }
}
```

## Reading the available features

Based on the current plan, and current user's access level on the business, the backend will give you a list of feature available for the current user:

``` json
{
    "status": 200,
    "errors": {
        "general_errors": [],
        "form_errors": {}
    },
    "data": {
        "object": {
            "plan": {
                "plan": {
                    "title": "Enterprise",
                    "plan_type": "enterprise",
                    "description": "<p>HII</p>",
                    "slug": "NCNetR5Q"
                },
                "slug": "GaBs40dG",
                "title": "Enterprise - Quarterly",
                "display_title": "Enterprise - Quarterly",
                "is_subscription": false,
                "subscription_period": "---",
                "description": "",
                "is_trial": false
            },
            "title": "My Workspace",
            ...
            "available_features": [
                {
                    "title": "White Label",
                    "slug": "u3iXpQgf",
                    "description": "",
                    "available": true,
                    "upgradable": true
                },
                {
                    "title": "AI",
                    "slug": "ai",
                    "description": "",
                    "available": false,
                    "upgradable": true
                },
                {
                    "title": "API",
                    "slug": "api",
                    "description": "",
                    "available": true,
                    "upgradable": true
                },
                {
                    "title": "Email",
                    "slug": "email",
                    "description": "",
                    "available": true,
                    "upgradable": true
                },
                {
                    "title": "Payment",
                    "slug": "payment",
                    "description": "",
                    "available": false,
                    "upgradable": true
                },
                {
                    "title": "Survey",
                    "slug": "survey",
                    "description": "",
                    "available": false,
                    "upgradable": true
                },
                {
                    "title": "Translation",
                    "slug": "translation",
                    "description": "",
                    "available": false,
                    "upgradable": false
                }
            ]
        }
    }
}
```
