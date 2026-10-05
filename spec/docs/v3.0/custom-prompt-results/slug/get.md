Reads one custom-prompt result by slug.

Call this operation on the server this reference publishes. The slug is not on the form definition. After `POST /v3.0/form-displays/slug/{slug}/submit/`, `success_page.description` may contain `{% block AI %}{slug}{% endblock %}`. That inner slug is the result to read. Poll until `status` is `completed`, then use `result`.

The hosted form client does not call this path. It polls its configured AI base URL, default `https://ai-api.formaloo.me`, at `/v1/custom-prompt-results/{slug}/`. That default is the shared frontend setting `AIURL`, not a server entry on this operation. Whether the AI service also serves `/v1/` beside `/v3.0/` is an alignment item to verify. This page does not rename the operation or add a route.
