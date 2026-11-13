Partially updates end-user profile data. Use this when changing selected member profile fields.

During a Login as session, email and first name are rejected with `400` and the account is left unchanged. Password, two-factor, login-method, and account-deletion calls are rejected by the authentication service while that session is active.
