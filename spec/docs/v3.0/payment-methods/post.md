Creates a Formaloo payment method for an explicitly selected gateway.

Provider credential fields use legacy storage names:

- Stripe: `gateway=stripe`, `terminal_code` is the Secret Key, `merchant_code` is the Publishable Key.
- PayPal: `gateway=paypal`, `terminal_code` is the Client Secret, `merchant_code` is the Client ID.
- Square: `gateway=square`, `terminal_code` is the Access Token, `merchant_code` is the Location ID.
- Razorpay: `gateway=razorpay`, `terminal_code` is the Secret Key, `merchant_code` is the Key ID.

Never log, echo, or infer secret values. After creation, retrieve the saved method and verify `gateway` and `active`; use the provider's test/sandbox mode for an end-to-end payment check.
