Use this endpoint to assign a copy of the row to each member of the team. Meaning, if you assign it to the team HR with 5 members in it, five copies of the row will be created, each assigned to a team member.
Response contains the total number of the rows to be created (=Number of team members). The rows will be created in background.

In order to user this endpoint:
- The form should have a assignee field.
- You should fill the assignee field.
- The assignee field should be assigned to a team.
- The assignee field should accept both teams and users.

Other than the response and the mentioned requirements, this endpoint is the same as add row endpoint.

## Async / Lifecycle

- **Status:** `200` (not `202`), even though row-creation work is queued as a background job
- **Asynchronous:** yes — despite the sync-looking `200` status, actual row creation happens asynchronously
- **Implication:** a `200` here does **not** guarantee that the assigned rows exist yet
- **Next / poll:** no dedicated status endpoint for this job; verify later via row listing if needed
