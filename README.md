# AG-UI + ADK Mutual Fund Redemption

Agent-assisted mutual fund redemption form review built with Next.js App Router, CopilotKit, AG-UI, and Google ADK.

## Features

- Form list + PDF preview (left pane)
- Prefilled right pane with accept/reject + ghost fill effect
- Bidirectional state sync between UI and ADK backend using AG-UI protocol via CopilotKit runtime
- Tool-driven validations (folio, bank, PAN KYC, amount, IFSC, account number)
- Gemini 2.5 Flash primary model, Ollama 3.1 fallback for local dev
- Mock JSON datastore with optional Postgres layer

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Create a `.env.local` with the following as needed:

```
# CopilotKit -> AG-UI endpoint (defaults to http://localhost:3000/api/agui)
AGUI_ENDPOINT=http://localhost:3000/api/agui

# Gemini (preferred)
GOOGLE_GENAI_API_KEY=your_key_here
# or
GEMINI_API_KEY=your_key_here

# Optional model override
ADK_MODEL=

# Ollama fallback

# Optional Postgres
DATABASE_URL=postgres://user:pass@host:5432/dbname
```

Gemini is required. Set `GOOGLE_GENAI_API_KEY` or `GEMINI_API_KEY`.

## Data

Mock forms live in `data/forms.json` with PDFs under `public/mock-forms/`.

To switch to Postgres, set `DATABASE_URL`. The expected table shape matches `FormRecord` in `lib/types.ts`.

## Notes

- No file upload is provided in the UI. Forms are loaded from DB or mock JSON.
- Agent nudges appear on the right pane based on validation tools.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```
