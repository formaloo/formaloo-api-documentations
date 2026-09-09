Creates a Brevo list mapping for a form.

Connect Brevo and discover its lists and contact attributes first. Pass the destination list as `list_id`. `mapped_fields` is keyed by saved Formaloo field slug and uses discovered Brevo attribute metadata. For runnable delivery, include at least one email or SMS mapping; the current API accepts an omitted or empty mapping, but that does not create a usable delivery mapping.
