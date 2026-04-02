# Admin Account Access - OkBuddy

## Bootstrap admin (local / staging)

Admin login and auto-creation use **environment variables** only. Do not commit passwords.

Set in `.env.local`:

| Variable | Purpose |
|----------|---------|
| `BOOTSTRAP_ADMIN_EMAIL` | Canonical admin email stored in the database |
| `BOOTSTRAP_ADMIN_PASSWORD` | Password for first-time bootstrap / auto-create |
| `BOOTSTRAP_ADMIN_LOGIN_ALIAS` | Optional; default `adminbuddy` — maps to `BOOTSTRAP_ADMIN_EMAIL` on login |
| `BOOTSTRAP_ADMIN_FULL_NAME` | Optional display name |

Optional **development** master admin:

| Variable | Purpose |
|----------|---------|
| `DEV_MASTERADMIN_EMAIL` | Default `masteradmin@okbuddy.com` |
| `DEV_MASTERADMIN_PASSWORD` | Required in `development` for auto-create |

## Access points

- **Login:** http://localhost:3000/login/ — use `BOOTSTRAP_ADMIN_EMAIL` or the login alias with `BOOTSTRAP_ADMIN_PASSWORD`.
- **Admin dashboard:** http://localhost:3000/admin/ — after signing in as bootstrap admin.

## Auto-creation

The bootstrap admin user is created when:

- First successful login with the alias or email **and** `BOOTSTRAP_ADMIN_PASSWORD` matches, and the user does not exist yet, **or**
- `POST /api/admin/create/` when `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` are set.

## API creation

```bash
curl -X POST http://localhost:3000/api/admin/create/ \
  -H "Content-Type: application/json"
```

## OAuth

Google OAuth still requires `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in `.env.local`. Admin role for OAuth users should be tied to your chosen admin email in application logic / env, not hardcoded in the repo.

## Security

- Role-based access for `/admin/*`
- Passwords hashed at rest
- Rate limiting on login
- **Never** commit `.env.local`, API keys, or PATs (see `.gitignore` and `docs/env-template.txt`).
