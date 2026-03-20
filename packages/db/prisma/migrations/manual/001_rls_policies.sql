-- RLS Policies for multi-tenant isolation
-- Run this AFTER Prisma migrations

-- Enable RLS on all tenant-scoped tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE showcases ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

-- Create policies for each table
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'clients', 'tags', 'products', 'showcases', 'sales', 'cashbacks',
      'stocks', 'brand_orders', 'samples', 'campaigns', 'scheduled_messages',
      'message_templates', 'quick_replies', 'expenses', 'financial_reports',
      'appointments', 'reminders', 'opportunities', 'ai_generations'
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
