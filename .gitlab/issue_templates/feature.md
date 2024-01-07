## Summary
(Concisely summarize the proposed new feature)

## Description
(Provide a detailed description of the new feature. Explain its purpose, functionality, and the problem it aims to solve.)

## Use Case
(Explain the specific use case or scenario where this feature would be beneficial.)

## Proposed Solution
(Describe the proposed solution for implementing this feature.)

## Acceptance Criteria
(Specify the criteria that need to be met for this feature to be considered completed or accepted.)
(
_**Tip**: Write a **checkboxed** list of sentences in the present tense describing the desired state of the system._

**GOOD (clear how to verify, it reports design and interaction decisions
agreed):**

* [ ] The page shows a button only to logged in users
* [ ] The button has the style XXX and label "Logout"
* [ ] When pressed, opens a confirmation modal with "OK" and "Cancel" buttons
* [ ] ...

**BAD (cannot be activated during verification, too arbitrary):**

* [ ] Logout button
* [ ] Modal for confirmation
)

## Validation scenarios
(
_**Hint**: Use Gherkin syntax to lay them out. It is complete and explicit, human-readable but easy to convert into self-executable tests._

_**Tip**: A scenario title should describe in a complete sentence what happens in that scenario, to improve readability and indability._

**OK**: `Administrator logs into back-office`
**BAD**: `Backoffice login`
)

### Scenario title
(
**Given**
**When**
**Then**
)

## Possible Implementation Approach
(Provide suggestions or ideas for how this feature could be implemented.)

## Dependencies
(List any dependencies or related features needed for implementing this feature.)

## Resources
(Design Links, API Documentation, Product Documents, or any other relevant external documents or resources)

## Additional Information
(Include any extra details, considerations, or references relevant to this feature request.)

/label ~frontend ~feature
/assign @developer
/cc @product-owner