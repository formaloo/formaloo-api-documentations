
# Get a list of plans

This endpoint will give you a list of all available plans with deals for each. For example, professional plans and deals for monthly, quarterly, and yearly deals.

Please note that when upgrading the plan for a business, you should specify the deal you want to buy.

### Example

```json
// **Request**
https://api.formaloo.net/v1.0/plans/ (GET)

// **Response**
{
  "status": 200,
  "errors": { 
      "general_errors": [], 
      "form_errors": {} 
  },
  "data": {
    "plans": [
      {
        "title": "Plus",
        "plan_type": "plus",
        "description": "<div class='plan-long-description'></div>",
        "slug": "plus",
        "deals": [
          {
            "slug": "ru5f7arb",
            "price": "19.00",
            "position": 1,
            "title": "1 Month",
            "display_title": "Plus",
            "duration": 30,
            "description": "",
            "is_active": true,
            "from_date": null,
            "to_date": null,
            "is_subscription": false
          },
          ...
        ]
      },
      {
        "title": "Pro",
        "plan_type": "pro",
        "description": "<div class='plan-long-description'></div>",
        "slug": "pro",
        "deals": [
          {
            "slug": "1monthpro",
            "price": "49.00",
            "position": 1,
            "title": "1 Month",
            "display_title": "Pro",
            "duration": 30,
            "description": "",
            "is_active": true,
            "from_date": null,
            "to_date": null,
            "is_subscription": false
          },
          ...
        ]
      },
      {
        "title": "Enterprise (base)",
        "plan_type": "advance",
        "description": "<div class='plan-long-description'></div>",
        "slug": "vip",
        "deals": [
            ...
        ]
      },
      {
        "title": "Enterprise (On-Premise)",
        "plan_type": "enterprise",
        "description": "<div class='plan-long-description'></div>",
        "slug": "enterprise",
        "deals": [
          ...
        ]
      }
    ]
  }
}
```

## Checking coupons on plans

**Fields** `coupon_code`, `price`, `discounted_price`, `has_discount`

When reading the list of plans, you can pass the code user has entered, with the `coupon_code` key, to see its discounts. In the response, if the code is valid, each plan deal will be updated to show the new discounted price.

If the user enters an invalid or inactive discount, you will receive an `HTTP 400` error.

If the code is valid but does not apply to a specific deal, its data will be returned as normal.

- `price` The deal’s original price, without the discount.
- `has_discount` Whether a valid coupon code that applies to this specific deal was entered.
- `discounted_price` If `has_discount` is true, will contain the discounted price for the deal. Otherwise will be the same as the `price`.
- `monthly_price` Shows the plan’s price per month. Might be null, for example for lifetime plans. (For example, if the deal’s price is $300 and its duration is for 3 months, the monthly plan will be $100).
- `discounted_monthly_price` If `has_discount` is true, will contain the discounted month;y price for the deal.

### Example

```json
**// Request**
https://api.formaloo.net/v1.0/plans/?coupon_code={coupon_code} (GET)

**//Response**
{
    "status": 200,
    "errors": {
        "general_errors": [],
        "form_errors": {}
    },
    "data": {
        "plans": [
            {
                ...,
                "deals": [
                    {
                        "price": "9000.00",
                        "monthly_price": "3000.00",
                        "has_discount": true,
                        "discounted_price": "8970.00",
                        "discounted_monthly_price": "2990.0",
                        ...
                    },
                    {
                        "price": "15000.00",
                        "monthly_price": "2500.00",
                        "has_discount": false,
                        "discounted_price": "15000.00",
                        "discounted_monthly_price": "2500.00",
                        ...
                    },
                    ...
                ]
            },
            {
                ...
                "deals": [
                    {
                        "price": "30000.00",
                        "monthly_price": "3000.00",
                        "has_discount": true,
                        "discounted_price": "29970.00",
                        "discounted_monthly_price": "29970.00",
                        ...
                    },
                    ...
                ]
            },
            ...
        ]
    }
}
```

## Plan subscriptions

Some of the plans may include a subscription. For these plans, one or more deals will be marked with `is_subscription=true`. The data and process for buying such plan deals are the same as normal plan deals.

### Example

```json
// **Request**
https://api.formaloo.net/v1.0/plans/ (GET)

// **Response**
{
  "status": 200,
  "errors": { 
      "general_errors": [], 
      "form_errors": {} 
  },
  "data": {
    "plans": [
      {
        "title": "Plus",
        "plan_type": "plus",
        "description": "<div class='plan-long-description'></div>",
        "slug": "plus",
        "deals": [
          {
            "slug": "ru5f7arb",
            "price": "19.00",
            "position": 1,
            "title": "Monthly subscription",
            "display_title": "Plus",
            "duration": 30,
            "description": "",
            "is_active": true,
            "from_date": null,
            "to_date": null,
            "is_subscription": true
          },
          ...
        ]
      },
      ...
    ]
  }
}
```
