# Frontmatter Cleaner

Quickly review and remove frontmatter (YAML) properties from the Obsidian note you're
currently viewing — without opening the YAML block and editing them one by one with right clicks.

## Why

Notes accumulate stray frontmatter properties over time: leftovers from
templates, one-off experiments, plugin residues or fields you no longer use. Frontmatter
Cleaner gives you a single tap-friendly list of the current note's properties
so you can pick the ones to remove and delete them in one action. There are bulk edit plugins out there but I find it tedious to create rules for a handful of impacted notes. This will be helpful if you have many different types of unused properties gathered over years.

## Usage

1. Open the note you want to clean up.
2. Run **Clean frontmatter properties of current file** from the command
   palette, or click the list-checks icon in the ribbon.
3. A modal lists every property in that note's frontmatter, with its current
   value shown alongside it.
4. Tap or click anywhere on a row — not just the checkbox — to select it for
   deletion. Selected rows are highlighted.
5. Select **Delete selected (n)** to remove those properties from the note's
   frontmatter, or **Cancel** to close without changes.

Selection and deletion work the same way on desktop and mobile; rows use a
44px minimum touch target so they're easy to tap accurately on iPhone.

## Notes

- Deleting properties uses Obsidian's own `processFrontMatter` API, so the
  rest of the frontmatter block keeps its existing formatting and order.
- If a note has no frontmatter, the modal tells you instead of showing an
  empty list.
- This is a vibe coded plugin but I use it personally and will need it for a while so will keep maintaining it.


## License

[MIT](LICENSE)
