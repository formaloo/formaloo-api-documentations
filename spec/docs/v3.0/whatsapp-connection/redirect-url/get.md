**Work in progress:** the WhatsApp Embedded Signup redirect contract is not stable enough for API automation. The current generated schema and dashboard implementation do not yet agree on workspace selection or the response envelope containing `redirect_url`.

Start onboarding through the dashboard/provider flow. Do not guess between `active_business` and `x-workspace`, and do not treat receipt of any redirect URL as proof that the connection is active.
