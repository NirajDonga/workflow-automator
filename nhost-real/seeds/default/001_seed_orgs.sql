-- Seed: two orgs for Final Task scenario
INSERT INTO organizations (id, name, quota_limit) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Org Alpha', 100),
  ('b0000000-0000-0000-0000-000000000002', 'Org Beta', 100)
ON CONFLICT (id) DO NOTHING;
