# AI Agent Workflow Builder

A mini n8n for chaining AI agent steps, built on nhost + Hasura + PostgreSQL + GraphQL.

## Prerequisites

- **Docker** (running)
- **Node.js** ≥ 18
- **nhost CLI** — install globally:
  ```bash
  npm install -g nhost
  ```
- **Groq API Key** — get one free at [console.groq.com](https://console.groq.com)

## Setup

### 1. Clone & install dependencies

```bash
cd /path/to/this/project
npm install
```

### 2. Initialize nhost (first time only)

If this is a fresh checkout and `nhost/config.yaml` doesn't exist yet:

```bash
nhost init --remote
```

Select the defaults when prompted. This creates the nhost config files. Our migrations in `nhost/migrations/` will be picked up automatically.

> **Already have a `nhost/config.yaml`?** Skip this step.

### 3. Configure environment

```bash
cp .env.example .env.development
```

Edit `.env.development` and set your `GROQ_API_KEY`.

### 4. Start local nhost

```bash
nhost up
```

This starts PostgreSQL, Hasura, Auth, and Functions via Docker.  
Wait until you see: `Local Nhost development environment started.`

The following services will be available:

| Service        | URL                                   |
|----------------|---------------------------------------|
| GraphQL API    | `http://localhost:1337/v1/graphql`     |
| Hasura Console | `http://localhost:1337/console`        |
| Auth           | `http://localhost:1337/v1/auth`        |
| Functions      | `http://localhost:1337/v1/functions`   |
| Postgres       | `localhost:5432` (user: `postgres`)    |

### 5. Apply seed data

Open the Hasura Console (`http://localhost:1337/console` → SQL tab) and paste the contents of:

```
nhost/seeds/default/001_seed_orgs.sql
```

This creates two test organizations (Org Alpha, Org Beta).

### 6. Create test users

Sign up users via the nhost Auth API or the Hasura Console:

```bash
# Example: create a user via curl
curl -X POST http://localhost:1337/v1/auth/signup/email-password \
  -H 'Content-Type: application/json' \
  -d '{"email": "owner@alpha.com", "password": "password123"}'
```

Then add them as org members by running an INSERT in the Hasura Console SQL tab:

```sql
INSERT INTO public.org_members (org_id, user_id, role) VALUES
  ('a0000000-0000-0000-0000-000000000001', '<USER_ID>', 'owner');
```

## Testing

### Via Hasura Console

1. Open `http://localhost:1337/console`
2. Go to the **API** tab
3. Test GraphQL queries/mutations/subscriptions
4. Use the `x-hasura-admin-secret: nhost-admin-secret` header for admin access
5. Or use a user's JWT token (from auth signup response) to test role-based permissions

### Via curl (Hasura Actions)

```bash
# Trigger a workflow run
curl -X POST http://localhost:1337/v1/graphql \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <USER_JWT>' \
  -d '{"query": "mutation { triggerWorkflowRun(workflow_id: \"<WF_ID>\") { run_id } }"}'
```

### Unit tests

```bash
npx vitest run
```

## 📂 Project Structure

This repository follows a monorepo structure containing the Nhost backend, serverless functions, and the Next.js frontend:

- 📁 **`nhost/`** — Backend configuration (PostgreSQL, Hasura, Auth)
  - 📁 `migrations/default/` — SQL schema (tables, views, etc.)
  - 📁 `metadata/` — Hasura metadata (relationships, permissions, actions, event triggers)
  - 📁 `seeds/default/` — Test data for local development
- 📁 **`functions/`** — Nhost Serverless Functions (Node.js)
  - 📁 `_utils/` — Shared utilities (GraphQL clients, error helpers)
  - 📁 `_repositories/` — Data access layer interfacing with Hasura GraphQL
  - 📁 `_services/` — Core business logic & Layer 2 step-level permissions
    - 📁 `step-handlers/` — Handlers for `llm_call`, `http_request`, `db_write`, etc.
  - 📄 `trigger-workflow-run.ts` — Hasura Action to execute workflows
  - 📄 `approve-step.ts` — Hasura Action to resume paused approval gates
  - 📄 `webhook-trigger.ts` — Hasura Action for inbound webhooks
  - 📄 `notify-event.ts` — Event Trigger for `notify` steps
- 📁 **`frontend/`** — Next.js React Web Application
  - 📁 `src/app/` — Next.js App Router (Workflow builder, Run UI, Quota indicators)
  - 📁 `src/components/` — UI components and forms
  - 📁 `src/lib/` — Nhost client and shared utilities
- 📁 **`docs/`** — Documentation and Write-ups
  - 📄 `architecture.md` — Write-up on schema, permissions, and architecture
  - 🎥 `demo.mp4` — Final Task scenario recording
- 📄 **`package.json`** — Root dependencies and monorepo scripts
- 📄 **`.env.example`** — Environment variables template
- 📄 **`README.md`** — Project documentation and setup guide

## Architecture

- **Controllers** (top-level `functions/*.ts`) — parse request, call service, return response. Zero business logic.
- **Services** (`functions/_services/`) — business logic, permission gating (Layer 2), step execution orchestration.
- **Repositories** (`functions/_repositories/`) — thin wrappers around Hasura GraphQL admin API calls.
- **Step Handlers** (`functions/_services/step-handlers/`) — one per step type, all implement `IStepHandler`. Registry pattern (Open/Closed Principle).
