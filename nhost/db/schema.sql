-- AI Agent Workflow Builder — Schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE org_role        AS ENUM ('owner', 'editor', 'viewer');
CREATE TYPE step_type       AS ENUM ('llm_call', 'http_request', 'db_write', 'notify', 'conditional_branch', 'approval_gate');
CREATE TYPE trigger_type    AS ENUM ('manual', 'webhook', 'scheduled', 'database_event');
CREATE TYPE run_status      AS ENUM ('pending', 'running', 'paused', 'completed', 'failed');
CREATE TYPE step_run_status AS ENUM ('pending', 'running', 'success', 'failed', 'skipped', 'paused');

-- Tables

CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  quota_limit INT  NOT NULL DEFAULT 100 CHECK (quota_limit > 0),
  quota_used  INT  NOT NULL DEFAULT 0   CHECK (quota_used >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE org_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID     NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id    UUID     NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
  role       org_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);

CREATE TABLE workflows (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workflow_steps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID      NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  step_type   step_type NOT NULL,
  config      JSONB     NOT NULL DEFAULT '{}',
  order_index INT       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workflow_id, order_index)
);

CREATE TABLE workflow_triggers (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id  UUID         NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  trigger_type trigger_type NOT NULL,
  config       JSONB        NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE workflow_runs (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id  UUID         NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  triggered_by UUID         REFERENCES auth.users(id),
  trigger_type trigger_type NOT NULL DEFAULT 'manual',
  status       run_status   NOT NULL DEFAULT 'pending',
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE step_runs (
  id            UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id        UUID            NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  step_id       UUID            NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  status        step_run_status NOT NULL DEFAULT 'pending',
  input         JSONB,
  output        JSONB,
  error         TEXT,
  attempt_count INT             NOT NULL DEFAULT 0,
  approved_by   UUID            REFERENCES auth.users(id),
  approved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- Aggregation (required by assignment: org-level usage this month)
CREATE VIEW org_monthly_usage AS
SELECT
  o.id AS org_id,
  COUNT(wr.id)::INT AS runs_this_month,
  COALESCE(AVG(EXTRACT(EPOCH FROM (wr.completed_at - wr.started_at))), 0) AS avg_duration_s
FROM organizations o
LEFT JOIN workflows w      ON w.org_id = o.id
LEFT JOIN workflow_runs wr ON wr.workflow_id = w.id AND wr.started_at >= date_trunc('month', now())
GROUP BY o.id;
