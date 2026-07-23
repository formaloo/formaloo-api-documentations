Creates a form field using the `type` supplied in the request body. This is the recommended endpoint for agents, CLI clients, and form builders that programmatically add fields through one URL.

Use the `type` field to choose the field kind, and use `sub_type` only for field families that have variants.

Field types available from the dashboard form editor:

| Editor field | `type` | `sub_type` | Notes |
| --- | --- | --- | --- |
| Short Text | `short_text` | — | Single-line text answer. |
| Long Text | `long_text` | — | Multi-line text answer. |
| Email | `email` | — | Email-address answer. |
| Phone Number | `phone` | — | Phone-number answer. |
| Number | `number` | — | Numeric answer; use numeric constraint fields when needed. |
| Website | `website` | — | URL answer. |
| Checkbox | `checkbox` | — | Boolean checkbox. |
| Single Choice | `choice` | — | Provide options with `choice_items` or `bulk_choices`. |
| Dropdown | `dropdown` | — | Single-select dropdown; provide options with `choice_items` or `bulk_choices`. |
| Multiple Choice | `multiple_select` | `standard` | Provide options with `choice_items` or `bulk_choices`. |
| Multiple choice dropdown | `multiple_select` | `dropdown` | Multiple-select dropdown. |
| Ranking | `multiple_select` | `ranking` | Respondents rank the provided options. |
| Yes/No | `yes_no` | — | Binary yes/no field. |
| Like/Dislike | `rating` | `like_dislike` | Thumbs up/down rating. |
| Star Rating / CSAT | `rating` | `embeded` | Dashboard-compatible CSAT/star rating. |
| Score / NPS | `rating` | `nps` | 0–10 NPS-style score. |
| Slider | `rating` | `score` | Slider-style score. |
| Matrix | `matrix` | — | Grid question; use `choice_groups` for rows and `choice_items` for columns/options. |
| Date | `date` | — | Date answer. |
| Time | `time` | — | Time answer. |
| Date Time | `datetime` | — | Date-time answer. |
| File Upload | `file` | — | Upload field; does not accept a `default` value. |
| Content | `meta` | `section` | Static rich text/content block. |
| Embed Video | `meta` | `video` | Video content block. |
| New Page | `meta` | `page_break` | Page break; not used in one-question-at-a-time forms. |
| Table | `table` | — | Collects multiple rows at once. |
| Product | `product` | — | Product/payment field. |
| Signature | `signature` | — | E-signature field. |
| Repeating section | `repeating_section` | — | Repeating group of fields. |
| Hidden Field | `hidden` | — | Hidden field for values not shown to submitters. |
| AI Analysis | `ai_box` | — | Dashboard-created AI Analysis fields are `admin_only: true`. |
| City | `city` | — | City selector. |
| Country | `country` | — | Country selector. |
| Lookup | `lookup` | — | Looks up values from a related source. |
| Linked to another record | `linked_rows` | — | Links this form to records in another form. |
| User Profile | `profile` | — | Connects a portal/user profile to form rows. |
| Assignee | `assignee` | — | Assigns a user to a form row. |
| Email verification | `email_verification` | — | Verifies the submitter's email with OTP. |
| Custom Validation | `regex` | — | Text field with custom RegEx validation settings. |
| Embed | `oembed` | — | Embeds external content such as PDFs, maps, or other oEmbed-compatible content. |
| Variable | `variable` | `int` | Visible editor entry for logic/calculation variables. Other supported variable subtypes are `decimal`, `string`, and `formula`. |

`embeded` is the legacy API spelling used for dashboard-compatible Star Rating / CSAT fields. Some generated contracts may also show `star`; prefer `embeded` for new fields that should edit cleanly in the dashboard.

For choice-like fields, provide choices with either `choice_items` or `bulk_choices`, but not both. See the per-type field endpoints for the field-specific settings reused by this generic endpoint.

Dashboard editor shortcuts and special recipes:

| Editor item | Recommended API behavior |
| --- | --- |
| Contact Info | Create four normal fields in order: `short_text` titled "First name", `short_text` titled "Last name", `email` titled "Email address", and `phone` titled "Phone number". The dashboard then sets each field's `theme_config.field_width` to one-half width. |
| Terms and Conditions | Create a `multiple_select` field titled "Accept terms and conditions" with one choice titled "I Agree.", `max_selectable_choices: 1`, and a description containing the terms/privacy text or link. |
| Section Divider | Create a `meta` + `section` field with static divider content in `description`. |
| Review | Create a `meta` + `section` field with `description: "Review your answers before submitting:\n\n@review"`. |
| Workspace Status | Create a workspace-level `choice` field with `isWorkspaceLevel: true` and `alias` set to the workspace status alias supplied by the client/workspace context. |
| Workspace Due Date | Create a workspace-level `datetime` field with `isWorkspaceLevel: true` and `alias` set to the workspace due-date alias supplied by the client/workspace context. |

Some field types, including `table` and `email_verification`, are present in the backend field-type enum and dashboard editor but do not currently have dedicated generated request schemas. Use the generic create endpoint with the documented `type` value and common field properties (`form`, `title`, `description`, `required`, etc.) unless backend-specific configuration is required.
