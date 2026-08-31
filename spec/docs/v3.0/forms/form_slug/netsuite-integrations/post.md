Creates the NetSuite configuration for a form.

Connect NetSuite and retrieve record metadata first. In `mapped_fields`, group mappings by supported record type; each item needs a saved Formaloo `source_field` slug and the discovered NetSuite `destination_field` metadata. `sync_previous_responses` queues historical submissions and cannot be changed later.

For choice fields mapped to select, multiselect, or boolean destinations, optional `destination_field.value_mappings` maps saved Formaloo choice slugs to string NetSuite values (verified select IDs or boolean strings). Construct this object from the form's saved choices and verified destination values; it is not returned by record metadata discovery. Unmapped choices and blank overrides retain their readable labels for existing resolution.
