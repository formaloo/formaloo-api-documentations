
A user field is a choice field that's connected to a user table (user form), and reads its options from the list of users on it.
The user field is always admin only and can only be seen and submitted by someone who has sufficient access to the form. Also, the list of the choices on this field is only shown to those who have atleast read access to the user form. So even if someone has full access to the form on which this field is added, they won't be able to propely use it unless they have access to the user form as well.

Important fields:

- `user_form`: Send the slug of the user form to wich you want to connect the field. Current user should have sufficient access to the user form.
- `auto_assign`: Set to `true` by default, and it will automatically try to assign the authenticated end user to the field on sumission. Although the assignment only works if the user belongs to the same user form that the field is connected to.

Getting the choices:
Like all oher choice fields such as lookup field or city field, you can get/search a list of choices on this field, from the following endpoint. The search oprion on this field's choices, will search on the users email, username, and name.

`/v3.0/fields/{slug}/choices/?search={qeury}`
