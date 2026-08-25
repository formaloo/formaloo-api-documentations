Deletes a workflow binding.

Use this when a node mapping is obsolete, the artifact was removed, or the binding should be recreated cleanly after a rebuild.

## Path params

- `slug`: workflow slug
- `binding_slug`: binding slug

## Behavior

Returns `200` with an empty `data` object on success. Deleting a binding does **not** delete the Formaloo artifact (`artifact_slug`); remove that resource through its own endpoint if needed.
