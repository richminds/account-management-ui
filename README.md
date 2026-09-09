# Account Management UI

Standalone admin console for [`auth-service`](../auth-service): create, rename and
delete the **accounts** users sign in under.

Extracted from [`knowledge-ingest-ui`](../knowledge-ingest-ui), where this
started life as an "Accounts" tab. That app no longer carries it — account
administration is not an ingestion concern, and it is not specific to any one
product.

## What an "account" is

An **application** registered against `auth-service` — makemerich, the
knowledge ingest console, anything onboarded later. Each one is a record in
auth-service's own `app_accounts` collection, and its `account_id` is the value
that application sends as `LoginRequest.account_id` when its users sign in.

It is **not** an organization. An organization (`organizations` collection) is
a *tenant* that users belong to; an app account is an *application*. Separate
concepts, separate collections — see the "App accounts vs organizations" table
in auth-service's README.

Registering an application here records that it exists; it does not wire up its
login, which still needs an `AccountAdapter` in auth-service. Each row shows
which it has (`login wired` / `no adapter`).

This console deliberately does **not** do user sign-up or sign-in for end
users. Each application owns that for its own users.

## Quick start

```bash
npm install

# Terminal 1 — auth-service on :8100
cd ../auth-service && python run.py

# Terminal 2 — this console on :5176
npm run dev
```

Sign in with an account whose email is on auth-service's `AUTH_PORTLESS_EMAILS`
allowlist. Every endpoint this console calls is platform-staff only, so a
non-staff sign-in gets an explanatory screen rather than an empty console.

> **Local dev writes to whatever auth-service you point at.** Leave
> `VITE_AUTH_BASE_URL` unset and the Vite proxy targets `localhost:8100`. Set
> it, and you are administering that deployment's real accounts.

## Endpoints used

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/auth/login` | Sign in |
| `GET` | `/auth/me` | Re-validate a stored session |
| `POST` | `/auth/logout` | Revoke the current token |
| `GET` | `/auth/accounts` | List registered applications |
| `POST` | `/auth/accounts` | Register an application (`409` if the ID is taken) |
| `PATCH` | `/auth/accounts/{id}` | Update name / description / enabled |
| `DELETE` | `/auth/accounts/{id}` | Deregister an application |

`account_id` is caller-supplied and immutable — it's the value the application
already sends at login, so the service can't invent it, and changing it later
would break that application's logins. Prefer `enabled: false` over `DELETE`
to take an application out of service reversibly.

## Stack

Vite 8 · React 19 · TypeScript · Tailwind CSS v4 (CSS-first — no
`tailwind.config.js`, tokens live in `src/index.css`) · TanStack Query v5 ·
axios · lucide-react · sonner.

Source is organised by feature rather than by file type:

```
src/
  components/ui/        Button, Card, Badge, Skeleton
  features/
    auth/               sign-in screen, auth context, auth API
    accounts/           accounts page, hooks, API
  lib/                  axios client, helpers
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on :5176 |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Serve the built bundle |
| `npm run lint` | Typecheck only |
