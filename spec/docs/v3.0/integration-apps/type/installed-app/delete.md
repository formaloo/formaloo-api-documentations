Uninstalls the requested integration app for the authenticated profile.

Uninstalling removes the catalog installation record. It does not revoke credentials at the external provider.

Important type-specific effects:

- Slack clears Slack access from all forms owned by the user.
- Google Sheets clears stored spreadsheet ID, URL, and range from all forms owned by the user.
- Stripe, PayPal, Square, and Razorpay deactivate all payment methods for that gateway owned by the user; the payment-method records are not deleted.
- Webhook deletes accessible Formaloo form webhooks.
- Most other configured items remain and must be inspected or removed separately.
- Email templates and PDF generator are pre-installed; a later installed-app read can recreate their installation record.

Preview and confirm these effects before uninstalling. Use provider/configuration-specific delete operations when the intent is to remove only one mapping, campaign, template, or webhook.

## Behavior

Returns `200` with envelope `{"status": 200, "errors": {...}, "data": {}}` — an empty `data` object — on success. There is no separate confirmation step.
