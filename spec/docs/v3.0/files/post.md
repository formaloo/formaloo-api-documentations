Uploads a file to Formaloo's storage service. Send a multipart/form-data body
with the binary `file` part and use the returned file resource in a second API
operation.

For a theme asset, write the returned slug into the theme field, such as
`logo_slug`, `background_image_slug`, or `meta_image_slug`. A form can still
set `cover_image_slug` as its cover override. Rich-text/content and choice-image workflows may consume the
returned URL or file reference according to their field schema. Creating a
form field with `type: file` is different: that creates a respondent upload
question and does not upload an asset.

A respondent answer for that question is uploaded here before form submit.
Send multipart field `file` and query `id` set to the field slug:
`POST /v3.0/files/?id={fieldSlug}`. The hosted form client sends `x-api-key`
and does not send `Authorization`. That client then submits the returned file slug.

Custom integrations must verify stored-file submission support against the deployed submit API.
