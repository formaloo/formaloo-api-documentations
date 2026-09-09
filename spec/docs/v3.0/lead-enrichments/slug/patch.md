Partially updates the source field or mapping for the integration's existing form. PATCH does not reassign the saved form; use the current form slug. If `mapped_fields` is supplied, it replaces the saved mapping object, so retrieve the current configuration and enrichable-field catalog first.

Retrieve the current resource and enrichable-field catalog first. Preserve existing mappings that the user did not ask to change, use saved Formaloo field slugs, and only store provider keys returned by the catalog endpoint.
