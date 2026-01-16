# Lighthouse Frontend

This is a minimal Vite + React + Tailwind scaffold.

Quick start

```bash
cd lighthouse/frontend
npm install
npm run dev
```

Notes

- Tailwind is already configured via `tailwind.config.js` in the parent folder.
- Run `npx tailwindcss -i ./src/index.css -o ./dist/output.css --watch` only if you need a manual build step; Vite + PostCSS will process Tailwind automatically.
