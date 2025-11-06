
# Upgrading the business plan

## Purchase a plan

You can send the deal’s slug to this endpoint (containing the business slug in the URL), to upgrade the plan. The response will contain a payment link to which you should redirect the user.

**Note** Users can’t upgrade their business to a lower plan than what they already have. If they try to do, this endpoint will raise an error.

**Note** If users try to upgrade their plan to a deal that has fewer available seats than they already use, they will face an error. For example, if their workspace has 5 members, and they want to upgrade to a plan that has 3 seats, the system will throw them an error. They should either choose a deal with 5+ seats or remove some members from their workspace first.

### Example

``` json
// **Request**
https://api.formaloo.me/v2.0/businesses/{business_slug}/ (POST)
{
    "plan_deal": "{plan_deal_slug}"
}

// **Response**
{
    "status": 201,
    "errors": {
        "general_errors": [],
        "form_errors": {}
    },
    "data": {
        "business_plan": {
            "plan_deal": "6Mh4Grg7",
            "link": "https://accounts.formalo.net/v1/payment/zarrinpal/process/?transaction_code=1580770372"
        }
    }
}
```

### Example (Errors)

``` json
// **Response: Error on downgrading plan**
{
    "status": 400,
    "errors": {
        "general_errors": [
            [
                "Cant upgrade to lower plan!"
            ]
        ],
        "form_errors": {}
    },
    "data": {}
}

// **Response: Error on workspace seats**
{
    "status": 400,
    "errors": {
        "general_errors": [
            [
                "This plan deal allows 0 members and invitations. However, your workspace currently has 2 members and or invitations. You have to remove some members to be able to buy this plan."
            ]
        ],
        "form_errors": {}
    },
    "data": {}
}
```



## Purchase plan with coupon

In the process of buying a plan, you can pass the `coupon_code` to apply it to the user’s purchase. If the coupon code is invalid or does not apply to the purchase, the server will return an `HTTP 400` error with proper messages. Otherwise, it will be applied to the purchase.

### Example

``` json
**// Request**
https://api.formaloo.me/v2.0/businesses/{business_slug}/plans/ (POST)
{
    "plan_deal": "{plan_deal_slug}",
    "coupon_code": "{coupon_code}"
}

**//Response**
{
    "status": 201,
    "errors": {
        "general_errors": [],
        "form_errors": {}
    },
    "data": {
        "business_plan": {
            "plan_deal": "{plan_deal_slug}",
            "coupon": "{coupon_code}",
            "link": "https://accounts.formaloo.net/v1/payment/paypal/?transaction_code=3600886651"
        }
    }
}
```

### Example (error)

``` json
**// Request**
https://api.formaloo.me/v2.0/businesses/{business_slug}/plans/ (POST)
{
    "plan_deal": "{plan_deal_slug}",
    "coupon_code": "{coupon_code}"
}

**//Response**
{
    "status": 400,
    "errors": {
        "general_errors": [
            [
                "Coupon code is not valid for your purchase!"
            ]
        ],
        "form_errors": {}
    },
    "data": {}
}
```

## Purchasing plan subscriptions

In order to purchase a plan subscription, you follow the same flow as buying a normal plan. You send the plan deal's slug to the server, and redirect the user to the payment link returned from the server.
https://api.formaloo.me/v1.0/businesses/{business_slug}/ (POST)
https://api.formaloo.me/v1.0/businesses/{business_slug}/plans/ (POST)
## Purchasing an exclusive plan
In order to purchase an exclusive plan, you follow the same flow as buying a normal plan. You send the plan deal's slug to the server, and redirect the user to the payment link returned from the server.
If the exclusive plan is not available for the intended business, you will receive a 400 error containing a proper message.
                "this plan is not available for your workspace!"
