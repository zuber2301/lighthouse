SSO & HRIS Integrations
======================

This folder contains provider-specific integration helpers for SSO and HRIS systems.

Design principles
- Keep provider SDK/HTTP details isolated here.
- Mapping functions should return a canonical shape: `external_id`, `email`, `manager_external_id`, `first_name`, `last_name`.
- Sync jobs operate tenant-scoped and use `external_id` + `sso_provider` to find or create users.
- Avoid writing business rules in provider modules; they only normalize payloads.

User Sync Pattern
- Periodic job pulls users from provider `fetch_*` APIs.
- For each external record, the job upserts a local `User` by (`tenant_id`, `external_id`, `sso_provider`) and updates fields.
- Manager mapping is performed after all users are upserted (two-phase: upsert nodes, then wire manager relationships using external ids).

SSO / JWT
- SSO login should produce JWTs containing `sub` (local user id) or `external_id` and `sso_provider` claims.
- If JWT contains `external_id` + `sso_provider`, the auth layer should map that to a local user (lookup by tenant + external_id + provider) and issue a local session token.

Notes
- These modules are skeletons; replace placeholders with real HTTP/SDK clients and robust error handling.
