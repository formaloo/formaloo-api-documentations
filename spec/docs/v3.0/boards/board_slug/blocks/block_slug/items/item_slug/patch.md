Partially updates a menu item, which is the page/navigation item inside a board/app menu. Use this for edits such as renaming a page, changing a link/embed target, adjusting page display settings, changing access, or attaching blocks to a page.

Common page/menu item fields:

- `title`: navigation label.
- `page_title`: heading shown inside the page.
- `type`: `block`, `link`, `embed`, or `group`.
- `link`: target URL for `link` and `embed` pages.
- `cover_slug`: Formaloo file slug for the page cover image.
- `icon`: dashboard icon identifier.
- `config`, `workspace_access`, `access_settings`, `roles`, `teams`: dashboard configuration and access settings.
- `content`: BlockNote-style page content array when writing rich page content directly.
- `sub_items`: child menu items for a `group` page.

For `block` pages, `blocks` is the complete desired list of saved block slugs attached to that page. Retrieve the page or app first, include every existing block slug that should remain attached, then add or remove slugs to reach the final page state.

```json
{
  "title": "Dashboard",
  "page_title": "Hiring dashboard",
  "type": "block",
  "blocks": ["result_block_slug", "kanban_block_slug"],
  "cover_slug": "uploaded_cover_file_slug"
}
```
