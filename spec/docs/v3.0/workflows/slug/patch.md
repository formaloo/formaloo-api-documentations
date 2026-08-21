Partially updates a workflow. Use this when changing title, description, status, or replacing the blueprint after a plan review or iteration.

Blueprint writes are schema- and reference-validated the same way as create. Prefer validating first with `POST /workflows/{slug}/validate/` when the new plan is large or uncertain.
