
## Searching for a text on all fields

If you want to search on the whole fields:

- If you want to save the search on the block settings, you should set the `search` key on the `filters` field. For example: 
``` JSON
{"fields_filters":{}, "search": "lorem"}
```

- If you want to apply the search only on a given request, you can send it on the query params: `?seach=lorem`

Notes:
- The search term is case-insensitive, so `Lorem` and `lorem` are the same.
- On the admin view, the query param (if sent) will override the saved search term. On the public view, the saved search query (if exists) can't be changed.

## Searching for a text on a specific field

If you want to search a term on a specific field, you can use this method.

If you want to search a text on an specific field:
- For searching results that have the exact word, use `?fieldSlug=lorem`
- For searching the results contain a part of the word, use `?fieldSlug_icontains=lorem` or  `?fieldSlug_has=lorem`

Like the previous item, search term can be either saved on the block settings, or sent on the query params:
- If you want to save the search on the block settings, you should set it in the `fields_filters` key on the `filters` field. For example: 
``` JSON
{"fields_filters":{"fieldSlug_has": "lorem"}}
```

- If you want to apply the search only on a given request, you can send it on the query params: `?fieldSlug_has=lorem`

Notes:
- The search term is case-insensitive, so `Lorem` and `lorem` are the same.
- On the admin view, the query param (if sent) will override the saved search term. On the public view, it will be added to the saved query.
