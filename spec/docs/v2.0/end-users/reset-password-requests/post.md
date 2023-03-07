# Request password reset

Using this endpoint, you can create a request for password reset. You should simply send the user's email or phone number and receive a token in response.
The other part of the token will be sent to user's email or phone. You can use the sent contact (phone or email), along with these two tokens to change the password in the next step, `reset-password-confirms`.
  
## Application Key

The `x-api-key` used for this endpoint is different from the key you may use for other requests, and you should request to receive it from the Fromaloo team.
