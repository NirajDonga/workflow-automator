-- Rollback: drop everything in reverse dependency order

DROP VIEW  IF EXISTS org_monthly_usage;
DROP TABLE IF EXISTS step_runs;
DROP TABLE IF EXISTS workflow_runs;
DROP TABLE IF EXISTS workflow_triggers;
DROP TABLE IF EXISTS workflow_steps;
DROP TABLE IF EXISTS workflows;
DROP TABLE IF EXISTS org_members;
DROP TABLE IF EXISTS organizations;
DROP TYPE  IF EXISTS step_run_status;
DROP TYPE  IF EXISTS run_status;
DROP TYPE  IF EXISTS trigger_type;
DROP TYPE  IF EXISTS step_type;
DROP TYPE  IF EXISTS org_role;
