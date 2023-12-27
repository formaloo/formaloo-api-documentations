Creates a dynamic form for the current user.


When creating a form, we accept the board as input, then obtain the associated form category of the board's folder, and create the form within that category.
send board like this:


```
{
    "board": "board_slug"
}
```

