Creates a lead-enrichment configuration for a form.

Retrieve the form and the enrichable-field catalog first. `source_field` must be the slug of a saved email field for people enrichment or a website field for company enrichment; email-verification fields are not valid people-enrichment sources. Keys in `mapped_fields` are saved Formaloo destination field slugs; values are provider keys returned by the enrichable-fields endpoint.
