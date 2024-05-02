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

```json
// **Request**
https://formaloo_api_server/v2.0/businesses/{business_slug}/ (GET)

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
            "extra_data": {}
        }
    }
}
```

### Example: No active plan

```json
// **Request**
https://formaloo_api_server/v2.0/businesses/{business_slug}/ (GET)

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

``` JSON
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
                    "title": "Remove Formaloo Branding",
                    "slug": "white_label",
                    "description": ""
                },
                {
                    "title": "API",
                    "slug": "api",
                    "description": ""
                },
                {
                    "title": "Custom Subdomain",
                    "slug": "custom_subdomain",
                    "description": ""
                },
                {
                    "title": "Team Management",
                    "slug": "team_management",
                    "description": ""
                },
                {
                    "title": "Webhook",
                    "slug": "webhook",
                    "description": ""
                },
                {
                    "title": "Custom CSS and JS",
                    "slug": "custom_css_js",
                    "description": ""
                },
                {
                    "title": "Custom Email",
                    "slug": "custom_email",
                    "description": ""
                },
                {
                    "title": "Payment",
                    "slug": "payment",
                    "description": ""
                },
                {
                    "title": "Backup",
                    "slug": "backup",
                    "description": ""
                },
                {
                    "title": "On Premise",
                    "slug": "on_premise",
                    "description": ""
                },
                {
                    "title": "Access Management",
                    "slug": "access_management",
                    "description": ""
                },
                {
                    "title": "Premium Integrations",
                    "slug": "premium_integration",
                    "description": ""
                },
                {
                    "title": "Custom Domain",
                    "slug": "custom_domain",
                    "description": ""
                }
            ]
        }
    }
}
```
