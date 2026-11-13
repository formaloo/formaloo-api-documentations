Lists Login as sessions for one user directory. The caller needs the same edit access as starting a session. This is the activity record. It does not start or end a session.

Results are paginated. `ended_at` is empty while the session is open. `started_at` is empty until the portal tab exchanges the code. Each item records the owner, the portal user, the portal address, the start, the end, and the owner IP.
