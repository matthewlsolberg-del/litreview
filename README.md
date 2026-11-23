# Lit Review Desk

**Use it:** https://matthewlsolberg-del.github.io/litreview/

A free tool for literature searches and APA 7th edition annotated bibliographies. It runs in the browser, works on phones (add it to your home screen), and needs no account.

1. **Start** with what you're researching. Each topic becomes a project.
2. **Search.** Turn the question into a Boolean search and search 250 million papers (OpenAlex) right in the app, or open the same search in Google Scholar, PubMed, ERIC and others. Every search is logged with its hit count.
3. **Library.** Add papers from the results, by DOI, by pasting a reference, or from RIS/BibTeX exports. Screen them (To screen → Reading → Included / Excluded), chase citations forward and backward, and save quotes with page numbers.
4. **APA 7.** Every source gets a checked reference and parenthetical and narrative in-text citations, with warnings for missing details and title-case mistakes.
5. **Export** the annotated bibliography to Word (Times New Roman 12, double-spaced, hanging indents), or to CSV, RIS or BibTeX.

Your library is stored in your browser on each device. Use **Download backup** and **Restore** on the Start screen to keep a copy or move to another device.

## Development

- `src/page.html` is the app. The same file is published as a claude.ai artifact, where it also uses Claude to draft annotations and search terms.
- `src/local-runtime.js` stands in for the claude.ai runtime here: localStorage storage, direct downloads.
- After editing anything in `src/`, run `node src/build.mjs` and commit the regenerated `index.html` and copied files.
- `node src/icons.cjs` re-renders the PNG icons from `src/icon.svg` (needs Playwright).
