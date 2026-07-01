# Magic logic

This endpoint uses AI to help use the logic on the form more easilly. It can create the logic rules, explain what existing logic does, or suggest how user can use logic to improve the form.

## Flow

First, the client should connect to the websockets, as they will receive the response there.
Second, client sends the post request containing:

- `mode`: which can be:
  - `generate`: Create new logic based on the user requirements.
  - `explain`: Tell the user what the existing logic on the form does.
  - `suggest`: Check the form and fields and data and suggest logic based improvements for the form.
- `requirements`: user's text that tells what they want from their logic.

Finally, when the response is ready, the client will receive it in the websockets.
Based on the mode, the response can vary:

### `generate`

```json
{
  "logic": {}, // Suggested logic
  "form": {"run_field_logics_on_update": true|false}, // Define whether the field logics should be applied on the update as well or not.
  "human_readable_logic": "", // A human-readable explanation of the logic.
  "new_variables": [ // Any new variables needed to enhance the form's logic/calculation.
    {
      "title": "string",
      "description": "string", // tell what this variable does
      "alias": "human_readable_slug",
      "sub_type": "int|string|decimal|formula",
      "decimal_places": "int", // only send for decimal variables
    }
  ]
}

```

Note that when saving, we should first send a request to save the `new_variables` as new fields on the form, then save the logic.

### `explain`

```html
<h3>Logic Summary</h3>
<p>Your form shows additional product details when "Custom Product" is selected and calculates total price including tax.</p>

<h3>Key Behaviors</h3>
<ul>
<li>Selecting "Custom Product" reveals a text field for specifications</li>
<li>Total price automatically updates when quantity or unit price changes</li>
<li>Tax is calculated at 10% and added to the final total</li>
</ul>
```

### `suggest`

```html
<h3>💡 Logic Enhancement Suggestions</h3>

<h4>Smart Conditionals</h4>
<ul>
<li><strong>Show Service Details:</strong> When user selects "Custom Service" in your Service Type field, show additional fields for specifications</li>
<li><strong>Contact Preferences:</strong> Only show "Phone Number" field when user selects "Phone" as preferred contact method</li>
</ul>

<h4>Helpful Calculations</h4>
<ul>
<li><strong>Order Total:</strong> Auto-calculate total by multiplying "Quantity" × "Unit Price" to save users from manual calculation</li>
</ul>

<h4>User Experience</h4>
<ul>
<li><strong>Skip Irrelevant Sections:</strong> Jump past company-related questions when user selects "Individual" as customer type</li>
</ul>
```
