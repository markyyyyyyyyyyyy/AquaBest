# AquaBest Shared Data Foundation (v1)

## Goal
One data contract for Customer, Manager, Staff/Refiller, Delivery and Owner. The backend developer may choose **Laravel REST**, **Supabase BaaS**, or another service. React imports `src/services/dataService.js` and never imports database drivers inside pages.

## State today
- `src/services/dataContract.js`: stable IDs, enums, integer centavos, ISO timestamps and validation.
- `src/services/mock/seed.js`: normalized fake sample data mapped from the current GUI fixtures.
- `src/services/mock/mockDataService.js`: asynchronous browser mock repository, order status transitions, product-price snapshots, basic inventory IN/OUT, payment proofs, cash collections and audit events.
- `backend/schema/aquabest-postgres-v1.sql`: **reference** schema for PostgreSQL / Supabase or Laravel-equivalent migrations. Not executed.
- `src/services/dataService.js`: one import path, currently points at the mock adapter.

The existing role GUIs have **not been migrated** from React local state to this service yet. This commit is data foundation only; it must not break the currently deployed preview. Next phase: gradually replace each role's local state with the adapter, preserving UI behavior.

## Frontend service contract
```js
import {dataService} from '../services/dataService.js';

const products = await dataService.getProducts();
const order = await dataService.createOrder({
  source:'online',
  items:[{product_id:'round5',quantity:2}],
  fulfillment:'delivery'
});
const orders = await dataService.getOrders();
await dataService.updateOrderStatus(order.id,'confirmed');
```
Orders calculate totals using catalog snapshot prices; clients cannot directly override billed total. An order has many order items; a delivery trip has one or more stops; payments are separate from fulfillment and from cash remittance.

## Migration contract with backend developer
Agree on:
1. Identifiers (UUID in SQL, string in frontend), timestamps (ISO UTC), money (integer **centavos**).
2. Exact status transitions and permission matrix for each employee role.
3. Routes/data responses (or Supabase table adapter) matching async service methods.
4. Server-side atomic inventory movements, idempotent order submission, payment confirmation, and stock reservation/release timing.
5. Auth: real employee/customer identity; never take actor role or total price from untrusted browser input. Supabase RLS or Laravel policies.
6. Data migration from mock fixtures to approved product catalog, inventory counts and client-verified prices.

## Limitations and safety
- GitHub Pages cannot execute server code or persist shared database writes.
- Browser mock `localStorage` shares a browser profile across tabs; different devices do **not** share state. It is mutable, insecure, and unsuitable for PII or money.
- The SQL schema is a review artifact, not a deployed database; auth/RLS and transaction-safe backend functions are still required.
- Payments with an e-wallet/bank reference are **pending verification** until validated; cash collected is distinct from confirmed cash remittance.
- Attendance is not derived from online/offline availability.
- Real inventory must be based on physical bottle release/return, with no duplicate stock-out from a status edit.
- Operational screens still contain sample data and are not database-backed.

## Staff authentication (Supabase)

The business login uses Supabase Auth email/password credentials. Passwords are managed by Supabase Auth and are never stored in `public.employees` or in the frontend. `public.employees` maps an Auth user ID to an administrator-assigned role and active status. The browser reads only the signed-in user's own employee row through RLS.

### One-time project setup

1. In the Supabase Dashboard, enable the Email provider and disable public sign-ups. Staff accounts must be created or invited by an authorized administrator.
2. Run [`schema/business-auth-supabase.sql`](schema/business-auth-supabase.sql) in the Supabase SQL Editor.
3. Keep `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the local `.env` file. For GitHub Pages, add repository Actions variables with those exact names so the deployment build can embed the Supabase URL and anon/publishable key. The anon/publishable key is intended for browser use; database access must be restricted with RLS. Never put a `service_role` or secret key in a `VITE_` variable or frontend file.
4. Create each employee's Auth user from the Supabase Dashboard. Then link that Auth user to a role using trusted SQL, replacing the sample values:

   ```sql
   insert into public.employees (auth_user_id, full_name, primary_role, active)
   select id, 'Employee Name', 'staff', true
   from auth.users
   where lower(email) = lower('employee@example.com')
   on conflict (auth_user_id) do update
   set full_name = excluded.full_name,
       primary_role = excluded.primary_role,
       active = excluded.active;
   ```

   Allowed roles are `owner`, `manager`, `staff`, and `delivery`. Never let the employee client insert or update these role records.

The login route is `?view=business-login`; successful sign-in opens `?view=business`. Legacy role values in the URL do not assign roles. The application derives the role from the RLS-protected employee row.

### Optional test accounts

After applying the migration, copy `.env.admin.example` to `.env.admin`. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the project's URL and the **legacy `service_role` JWT** from Supabase Settings → API Keys → Legacy API Keys. This Auth Admin seeder requires a JWT bearer token; the anon/publishable key and new `sb_secret_` API key are not valid for this script's bearer-token call. Keep `.env.admin` private; it is ignored by Git. Run `node scripts/create-test-business-accounts.mjs` from the project root. It creates one confirmed test Auth user per role, links each to `public.employees`, and prints unique generated passwords once. It aborts if any reserved test email already exists. The addresses use `example.com`, so they cannot receive email or password-reset messages. Delete these users from Supabase Auth when testing is finished. Never use this script for real worker accounts.

### Security boundary

This change secures sign-in and employee identity/role lookup. The management screens still contain local sample orders, prices, stock, and activity; they are not database-backed yet. Do not treat the current UI route guard as authorization for operational data. Before connecting business tables, enable RLS on each table and add role-specific policies or server-side RPCs for every read/write. Never ship the Supabase service-role key to the browser.

## Shared products catalog

Run `schema/products-catalog-supabase.sql` in Supabase SQL Editor after `schema/business-auth-supabase.sql`. It creates/updates the products table policies and public image bucket. Only an authenticated, active `owner` employee can create or edit products. Customers can read only active products whose `channels` include `online`; they do not receive permission to change the catalog. The browser uses only the public anon key and relies on RLS.

In the Owner workspace, open **Products & Services** to add or edit a product, set its price and channels, and optionally upload an image. Saving writes the product and image to Supabase. Products marked active and available online appear on the customer home page and in the order size selector. Products marked inactive or Walk-in Only are hidden from online customers. Refresh the customer page after a catalog update to load the latest list.

The online customer order submission flow remains a local preview. This catalog connection does not persist customer orders or decrement inventory.
