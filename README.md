# Synaps.ing React

A local-first linked markdown notebook refactored as a Vite + React app and styled to sit in the same product suite as Spiketrain.

## What it does

- Local-first notes saved in `localStorage`
- Markdown editor with front-card metadata
- Stack-based note organization
- Parent/child notebook hierarchy
- `[[wiki links]]` for cross-note references
- `>>subnotes>>` for quick child-note creation
- Search with operators: `tag:`, `title:`, `stack:`, `contains:`, `id:`
- Theme system matching the Spiketrain suite language
- Workspace import/export and note markdown export

## Run locally

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

## Build

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

This repo includes a GitHub Actions workflow at `.github/workflows/deploy.yml`.

1. Push the repo to GitHub.
2. In GitHub, go to **Settings → Pages**.
3. Set **Source** to **GitHub Actions**.
4. Push to `main`; the workflow will build and deploy `dist/`.

## Important data note

Synaps.ing is local-first. Notes live in the browser's local storage unless exported. Use **File → Export Workspace** to back up or move data.
