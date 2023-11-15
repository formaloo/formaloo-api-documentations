Use this endpoint to create a file input field.


When using the create/update field API to set allowed extensions, you can provide the value in one of two formats: either as a comma-separated string, such as "gif, pdf" or as a list, like ["gif", "pdf"].

allow_multiple_files: boolean field that enables the ability to submit multiple files as answer, default is false.

When submitting a form with a file field, you can send the value of the file field as follows: 
{"file_field_slug": ["file_slug_1", "file_slug_2"]}.


Assume you submitted the form, and the values of the file field are stored as follows:
```
"data": {
    "file_field_slug": [
        {
            "url": "http://127.0.0.1:8000/media/form/NIx9wT3r/file/file_slug_1/egSRPnzyd3ac59a2-aabc-4062-9e22-0b53baf93508.jpg",
            "file_slug": "file_slug_1"
        },
        {
            "url": "http://127.0.0.1:8000/media/form/NIx9wT3r/file/file_slug_2/9ybGRj9Dd6e6cc28-0266-4958-bf01-3e0751b2e155.jpg",
            "file_slug": "file_slug_2"
        }
    ]
}
```

Now, if you want to edit the row and add a new file, you send data like this:
```
{"file_field_slug": ["file_slug_1", "file_slug_2", "file_slug_3"]}
```


Subsequently, if you wish to delete these two files, namely file_slug_2 and file_slug_3, you send data like this:
```
{"file_field_slug": ["file_slug_1"]}
```

