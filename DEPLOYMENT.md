# Hackathon deployment

Deploy the `fullstack` branch as two Vercel projects backed by one Neon PostgreSQL database. Production deployments use stable Vercel domains, not individual deployment URLs.

## 1. Create the database and projects

Create a Neon PostgreSQL project and copy its pooled connection string with SSL into the API project's private `DATABASE_URL` variable. Keep credentials out of Git and chat.

Import the same GitHub repository twice in Vercel:

| Setting           | Frontend        | API             |
| ----------------- | --------------- | --------------- |
| Root directory    | `apps/web`      | `apps/api`      |
| Framework         | TanStack Start  | NestJS          |
| Production branch | `fullstack`     | `fullstack`     |
| Node.js           | 24.x            | 24.x            |
| Build command     | `npm run build` | `npm run build` |

Enable **Include source files outside of the Root Directory in the Build Step** for both projects. The frontend imports `packages/ui`; both projects install from the monorepo root. Let the framework determine the output directory. The committed Vercel configuration supplies installation and build commands.

Under Settings > Environments > Production, set the branch to `fullstack`. If the import initially deploys `main`, redeploy from `fullstack` after changing this setting. Reserve both stable project domains before configuring authentication.

## 2. Set production environment variables

Frontend:

| Variable     | Value                                                                              |
| ------------ | ---------------------------------------------------------------------------------- |
| `API_ORIGIN` | Stable API HTTPS origin, e.g. `https://your-api.vercel.app`, with no `/api` suffix |

API:

| Variable                      | Value                                               |
| ----------------------------- | --------------------------------------------------- |
| `DATABASE_URL`                | Neon pooled PostgreSQL connection string with SSL   |
| `BETTER_AUTH_SECRET`          | A private random secret with at least 32 characters |
| `BETTER_AUTH_URL`             | Stable frontend HTTPS origin, without `/api/auth`   |
| `BETTER_AUTH_TRUSTED_ORIGINS` | Same frontend HTTPS origin                          |

Generate a secret locally with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"` and paste it directly into Vercel. Never prefix secrets with `VITE_`. Let Vercel manage `PORT`.

The frontend's Vercel rewrite forwards every `/api/*` request to the API, preserving its path. Better Auth uses the public frontend origin so cookies remain on that domain. Disable Vercel deployment authentication for the API's production deployment so the rewrite can reach it. Keep the application's own session guards enabled.

## 3. Initialize Neon once

In a local terminal, securely set `DATABASE_URL` to the Neon database, then run from the repository root:

```sh
npm install
npm run db:deploy -w api
npm run seed -w api
```

Set secrets through your terminal's secure input or secret manager; avoid commands containing literal credentials. Explicit environment variables override local dotenv values. Use a direct Neon connection for migration commands if required by your database configuration, targeting the same database as the pooled runtime URL.

The seed creates the two demo accounts and 50 feedback results. It resets demo passwords and sessions, so run it only for initialization or an intentional demo reset. Never run it automatically in a build or on each server startup.

## 4. Deploy and verify

Deploy the API first, then the frontend. The API build generates Prisma Client; the frontend build uses Nitro's Vercel integration. Redeploy after changing environment variables.

Check these behaviors on the public frontend domain:

- `/api/auth/ok` reaches Better Auth without a Vercel login screen.
- Sign in as `founder` / `founder`; reload `/dashboard` and confirm the session survives.
- Confirm 50 results, 5 per page, and sorting across all results.
- Sign out, then sign in as `user` / `user` and submit feedback.
- Reload `/feedback`, sign out, and verify access redirects to login.
- Redeploy without seeding and confirm submitted feedback remains in Neon.

## 5. Publish updates

Commit and push changes to `fullstack`. Both Vercel projects track that branch and automatically deploy applicable changes. Database contents persist independently.

For a schema update, commit a Prisma migration and run `npm run db:deploy -w api` against production before deploying code that requires it. Prefer additive migrations so the previous API remains compatible during rollout. A Vercel code rollback does not undo database migrations.

Preview deployments are outside this initial setup. Do not connect arbitrary preview deployments to the production database or broaden authentication origins with a wildcard.

## Local development

The initial preparation environment could not reach the npm registry. Run `npm install` with network access and commit the regenerated `package-lock.json` before using `npm ci`. The Vercel projects explicitly use `npm install` so they can resolve the added Nitro dependency.

Run `npm run dev` from the repository root. Vite continues proxying `/api` to `http://localhost:3000`; `API_ORIGIN` is used only by Vercel configuration. Install dependencies after pulling these changes so `nitro/vite` is available.
