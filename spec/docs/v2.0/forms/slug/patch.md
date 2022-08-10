Update a form.

## Making the uploaded files private

The `submitted_files_are_private` field on the form, defines wether the files uploaded on a form should be accessible to anyone who has the link to the file, or are only accessible to anyone who has access to the form. Meaning, anyone, even of not authenticated, can see an uploaded file using its link (which needs to be shared by a form admin). But if the `submitted_files_are_private` is set to `true`, the links will be private, and only those who have access to the form can see the file.
 **Note** If you change the `submitted_files_are_private` field from, it won't affect the existing links. For example, if you change it from `false` to `true`, the link to the previous files will still be publicly accessible, but the new uploads will be private.
 The value for `submitted_files_are_private` is `false` by default.
