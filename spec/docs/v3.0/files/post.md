Uploads a file to Formaloo's storage service. Send a multipart/form-data body
with the binary `file` part and use the returned file resource in a second API
operation.

For form and theme assets, write the returned slug into the relevant asset
field, such as `logo_slug`, `background_image_slug`, `cover_image_slug`, or
`meta_image_slug`. Rich-text/content and choice-image workflows may consume the
returned URL or file reference according to their field schema. Creating a
form field with `type: file` is different: that creates a respondent upload
question and does not upload an asset.
