# Local configuration

## Environment variables

Create or update the monorepo root .env file next to the root package.json:

```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/foxhound?schema=public
BETTER_AUTH_SECRET=<random secret of at least 32 characters>
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:3001
PORT=3000
```

Replace the example PostgreSQL credentials with your actual credentials.
Separate multiple trusted frontend origins with commas. Generate a secret with:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Do not commit .env. The API and Prisma CLI load the root .env regardless of the
working directory. Existing environment variables take precedence.
DOTENV_CONFIG_PATH can select a different file, including for tests.

## Database setup

Start PostgreSQL, then run from the repository root:

```sh
npm install
npm run db:generate -w api
npm run db:migrate -w api -- --name init_auth
```

Apply committed migrations in deployment with npm run db:deploy -w api.

## Demo accounts

Run npm run seed from the repository root or apps/api. The script creates or
updates these accounts using Better Auth password hashes:

| Username | Password | Destination |
| -------- | -------- | ----------- |
| user     | user     | /feedback   |
| founder  | founder  | /dashboard  |

The login page is at /. These usernames map to the internal email addresses
user@foxhound.test and founder@foxhound.test. Rerunning the seed resets their
passwords and removes their existing sessions. Public sign-up is disabled.
No additional migration is required for these accounts.

Use npm run seed, rather than npm seed, to invoke the custom npm script.

## Running each application independently

In one terminal:

```sh
cd apps/api
npm run start:dev
```

In another terminal:

```sh
cd apps/web
npm run dev
```

The API listens on port 3000 by default; the frontend runs at
http://localhost:3001. Vite proxies /api/auth to the API. Both applications must
be running. If PORT changes, update the proxy target in apps/web/vite.config.ts.
BETTER_AUTH_TRUSTED_ORIGINS must include the frontend origin.

Alternatively, npm run dev from the repository root starts both applications.
In production, configure a reverse proxy to forward /api/auth to NestJS.

## Authentication and database access

Better Auth exposes /api/auth/sign-in/email, /api/auth/sign-out,
/api/auth/get-session and /api/auth/ok. The frontend includes cookies with
credentials: 'include'. Other Nest routes remain public; use auth.api.getSession
inside a guard to protect future private endpoints.

Inject PrismaService into Nest services and use prismaService.client to access
the client shared with Better Auth. The client disconnects when Nest shuts down.
