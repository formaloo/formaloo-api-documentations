Use this endpoint to create a file input field.


When using the create/update field API to set allowed extensions, you can provide the value in one of two formats: either as a comma-separated string, such as "gif, pdf" or as a list, like ["gif", "pdf"].

When submitting a form with a file field, you can send the value of the file field as follows: 
{"file_field_slug": ["file_slug_1", "file_slug_2"]}.
