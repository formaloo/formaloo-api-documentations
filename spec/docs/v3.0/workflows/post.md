Creates a workflow that stores a blueprint plan for the active business. Use this when capturing a user requirement as a structured map of Formaloo artifacts (forms, templates, apps, webhooks, and similar) and how they connect.

The workflow is a plan only. It does not execute runtime behavior. Form logic, form settings, webhooks, integrations, and schedules remain the executors.

Send at least `title`. Prefer including `blueprint` with a `goal`, `nodes`, and optional `tests`. Node keys are plan-local aliases (not Formaloo slugs). Action `when` conditions reuse form-logic operations. Soft-validates schema and hard-validates references before save; use `POST /workflows/{slug}/validate/` to dry-run without writing.
