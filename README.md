# Frontmatter Cleaner

Quickly review and remove frontmatter (YAML) properties from the note you're
currently viewing — without opening the YAML block and editing it by hand.

## Why

Notes accumulate stray frontmatter properties over time: leftovers from
templates, one-off experiments, or fields you no longer use. Frontmatter
Cleaner gives you a single tap-friendly list of the current note's properties
so you can pick the ones to remove and delete them in one action.

## Usage

1. Open the note you want to clean up.
2. Run **Clean frontmatter properties of current file** from the command
   palette, or click the list-checks icon in the ribbon.
3. A modal lists every property in that note's frontmatter, with its current
   value shown alongside it.
4. Tap or click anywhere on a row — not just the checkbox — to select it for
   deletion. Selected rows are highlighted.
5. Use the toolbar above the list to select faster: **Select all**, **Select
   none**, or **Empty (n)** — which catches blank strings, `null`, and empty
   lists/objects. The Empty button is disabled when there's nothing of that
   kind to select.
6. Select **Delete selected (n)** to remove those properties from the note's
   frontmatter, or **Cancel** to close without changes.

Selection and deletion work the same way on desktop and mobile; rows use a
44px minimum touch target so they're easy to tap accurately on iPhone.

## Notes

- Deleting properties uses Obsidian's own `processFrontMatter` API, so the
  rest of the frontmatter block keeps its existing formatting and order.
- If a note has no frontmatter, the modal tells you instead of showing an
  empty list.

## Development

```bash
npm install
npm run dev    # watches main.ts and rebuilds main.js on change
npm run build  # production build
```

To test locally, copy `main.js`, `manifest.json`, and `styles.css` into
`<vault>/.obsidian/plugins/frontmatter-cleaner/` in a development vault, then
enable the plugin from Settings → Community plugins.

## License

[MIT](LICENSE)
