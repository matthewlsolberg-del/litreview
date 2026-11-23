# Lit Review Desk

**Use it:** https://matthewlsolberg-del.github.io/litreview/

A free tool for literature searches and APA 7th edition annotated bibliographies. It runs in the browser, works on phones (add it to your home screen), and needs no account.

1. **Start** with what you're researching. Each topic becomes a project.
2. **Search.** Turn the question into a Boolean search and search 250 million papers (OpenAlex) right in the app, or open the same search in Google Scholar, PubMed, ERIC and others. Every search is logged with its hit count.
3. **Library.** Add papers from the results, by DOI, by pasting a reference, or from RIS/BibTeX exports. Screen them (To screen → Reading → Included / Excluded), chase citations forward and backward, and save quotes with page numbers.
4. **APA 7 or ASA.** Pick the citation style per project (ASA is common in sociology). Every source gets a checked reference and parenthetical and narrative in-text citations, with warnings for missing details and title-case mistakes.
5. **Research tools.** Attach the full paper (free copies are found automatically when possible, or upload a PDF from your library), extract study details with page references, check each sentence of an annotation against the paper (quotes are verified in the text, not just trusted), flag retracted papers, get screening suggestions against your criteria (you decide), and find papers your sources cite that you don't have yet.
6. **Export** the annotated bibliography to Word (Times New Roman 12, double-spaced, hanging indents), or to CSV, RIS or BibTeX, along with an evidence table, a PRISMA-style flow diagram and an honest AI-use statement built from what you actually did.

**AI assistant (optional).** Tap **Connect AI** and paste a key for **Gemini** (free key from aistudio.google.com/apikey) or **ChatGPT** (OpenAI API key with credit). The AI then suggests better search terms, drafts annotations from abstracts, reads pasted references, and synthesizes themes across your sources. Your key stays in your browser and is sent only to Google or OpenAI.

Your library is stored in your browser on each device. Use **Download backup** and **Restore** on the Start screen to keep a copy or move to another device.

## Built-in AI

To make the AI features work with no setup, put a **free** Gemini API key (from aistudio.google.com/apikey, with no billing attached) into `config.js`. The file is public, so never use a paid key. Leave it empty to require each person to connect their own key.

## Development

- `src/page.html` is the app. The same file is published as a claude.ai artifact, where it also uses Claude to draft annotations and search terms.
- `src/local-runtime.js` stands in for the claude.ai runtime here: localStorage storage, direct downloads, and AI calls to Gemini or OpenAI with the user's own key.
- `assets/` holds the notebook-style illustrations.
- After editing anything in `src/`, run `node src/build.mjs` and commit the regenerated `index.html` and copied files.
- `node src/icons.cjs` re-renders the PNG icons from `src/icon.svg` (needs Playwright).
