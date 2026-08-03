Deletes a draft campaign. Use this only for campaign cleanup before a campaign is sent or activated; sent or active campaigns are historical records and should not be treated as removable drafts.

## Behavior

Returns `200` with an empty `data` object on success. There is no separate confirmation step.

This delete only succeeds for campaigns in `draft` status. Campaigns that are not drafts return a validation error.
