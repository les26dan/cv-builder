# OkBuddy App - Setup Summary

## Completed setup steps (high level)

### 1. Repository and dependencies

- Dependencies installed via `npm install`.

### 2. Environment configuration

- Copy `docs/env-template.txt` to `.env.local` and fill in:
  - Supabase URL and keys
  - JWT / session secrets
  - OAuth client IDs and secrets
  - `OPENAI_API_KEY` (and related AI keys) as needed
  - Bootstrap admin: `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`, optional `BOOTSTRAP_ADMIN_LOGIN_ALIAS`

### 3. Database

- Apply SQL from `docs/` and `scripts/` as documented in `SUPABASE_SETUP_INSTRUCTIONS.md`.
- Run `setup-database.js` or `POST /api/admin/create/` after env is set (see `ADMIN_ACCESS.md`).

### 4. Language and auth

- Vietnamese / English configuration lives under `config/texts/`.
- Email/password and OAuth flows require correct env vars; see `OAUTH_SETUP_INSTRUCTIONS.md`.

## How to run

```bash
cd /Users/dale/pmf
npm run dev
```

Open http://localhost:3000 and sign in with accounts you create in your own Supabase project.

## Credentials (never commit)

- **Do not** store real passwords, API keys, or personal emails in tracked markdown.
- Use `.env.local` (gitignored) and your password manager.
- Rotate any secret that was ever committed or pushed; see repository history scrub if needed.

## Database tables (overview)

- Users, OAuth, CV workflow, drafts, and audit tables as defined in project SQL migrations and docs.

## Reference docs

- `SUPABASE_SETUP_INSTRUCTIONS.md`
- `OAUTH_SETUP_INSTRUCTIONS.md`
- `docs/env-template.txt`
- `ADMIN_ACCESS.md`
