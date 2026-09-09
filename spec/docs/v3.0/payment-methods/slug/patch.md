Partially updates a known Formaloo payment method.

Retrieve the current method first and preserve credential fields the user did not ask to replace. The legacy credential mapping is: Stripe secret/publishable key, PayPal client secret/client ID, Square access token/location ID, and Razorpay secret/key ID stored in `terminal_code`/`merchant_code`, respectively. Never expose secret values in logs or summaries.
