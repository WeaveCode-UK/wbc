-- Complement RLS Policies for tenant-scoped tables missing from 001
-- Run AFTER 001_rls_policies.sql

-- Enable RLS on remaining tenant-scoped tables
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_sale_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'team_members', 'team_tasks', 'deliveries', 'landing_pages',
      'notifications', 'referrals', 'onboarding_progress',
      'post_sale_flows', 'community_templates'
    ])
  LOOP
    EXECUTE format(
      'CREATE POLICY tenant_isolation_%I ON %I
       USING ("tenantId" = current_setting(''app.current_tenant_id'', true)::uuid)
       WITH CHECK ("tenantId" = current_setting(''app.current_tenant_id'', true)::uuid)',
      tbl, tbl
    );
  END LOOP;
END $$;
