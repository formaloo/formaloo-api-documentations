Deletes an engine this workspace owns, including its stored credentials. The caller must be a workspace admin (`owner` or `admin`) and the workspace must have the AI feature.

Another workspace's engine, or a system engine, is `404`.

If the deleted engine was the workspace default, later AI requests that do not name an engine use the prompt template's engine, then the system default.
