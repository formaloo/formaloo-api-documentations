Creates a Mailchimp audience mapping for a form.

Connect Mailchimp, list available audiences and merge fields, then pass the selected audience as `list_id`. `mapped_fields` is keyed by saved Formaloo field slug and uses discovered Mailchimp merge-field metadata. Additionally map a saved email field with both `tag: email_address` and `type: email_address`; this required email descriptor is separate from ordinary discovered merge fields.
