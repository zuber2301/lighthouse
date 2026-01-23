-- Seed data for Triton tenant and four personas
-- 1. Create the Tenant
INSERT INTO tenants (id, name, subdomain, master_budget_balance)
VALUES ('748c0823-c976-49a6-8968-3e4210a48b96', 'Triton Industries', 'triton', 1000000);

-- 2. Create the Platform Admin (Global Scope)
INSERT INTO users (id, tenant_id, email, full_name, role)
VALUES (gen_random_uuid(), NULL, 'super@lighthouse.com', 'Global SuperAdmin', 'PLATFORM_OWNER');

-- 3. Create the Tenant Admin (Company Scope)
INSERT INTO users (id, tenant_id, email, full_name, role)
VALUES (gen_random_uuid(), '748c0823-c976-49a6-8968-3e4210a48b96', 'hr@triton.com', 'Sarah - HR Manager', 'TENANT_ADMIN');

-- 4. Create the Tenant Lead (Department Scope)
INSERT INTO users (id, tenant_id, email, full_name, role, lead_budget_balance)
VALUES (gen_random_uuid(), '748c0823-c976-49a6-8968-3e4210a48b96', 'eng-lead@triton.com', 'David - Eng Director', 'TENANT_LEAD', 0);

-- 5. Create the Corporate User (Individual Scope)
INSERT INTO users (id, tenant_id, email, full_name, role, points_balance)
VALUES (gen_random_uuid(), '748c0823-c976-49a6-8968-3e4210a48b96', 'dev@triton.com', 'Alex - Software Engineer', 'CORPORATE_USER', 0);

-- Note: `gen_random_uuid()` requires the `pgcrypto` or `pgcrypto` extension available in Postgres.