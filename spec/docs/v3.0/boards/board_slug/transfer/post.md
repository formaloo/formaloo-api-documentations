Transfers a board to another workspace and optionally into a destination folder. A board is an app in the Formaloo UI.

The call enqueues the transfer and returns the board representation that already exists. HTTP 200 means the transfer was accepted, not that it has finished.

Templates referenced from the source workspace are copied. Compatible templates already in the destination workspace are reused, as are default PDF templates. Email and PDF template argument identifiers in logic are rewritten to those copied or reused templates.
