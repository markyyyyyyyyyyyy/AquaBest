# aquabest-system
A management system for water stations. Handles station operations, inventory tracking, and ordering.

## Management UI prototype

The customer website is unchanged at the repository's existing URL.

Open the **Manager UI prototype** on GitHub Pages using:
`(https://markyyyyyyyyyyyy.github.io/AquaBest/?view=manager)`

CUSTOMER DASHBOARD:
https://markyyyyyyyyyyyy.github.io/AquaBest/

Local development:
```bash
npm install
npm run dev
```
Then open the local Vite URL with `?view=manager` (the default is customer).

Manager modules: Dashboard, POS, Orders, Refill Tasks, Delivery, Inventory & Bottles, Payments, Sales Reports, and Staff Tasks. Responsive mobile-first navigation uses Home/POS/Orders/More; desktop shows a full sidebar.

### Design rules
- Inter, primary `#244EA3`, navy `#1B2F63`, aqua `#2AA9C5`, background `#F8FBFF`, border `#D9E2EC`
- 8px spacing rhythm, 16px card radius, 12px form/button radius
- All icons are `react-icons/fi`; bottle assets are reused from `src/assets/WaterBottleSize`.

### Important: Prototype, not production
Management access is a **preview route with no authentication**. The `view=manager` URL is PUBLIC and must not expose real customer/financial data. Orders, payment collection, POS prices, stock and reports use local demo fixtures and React state only. No server request, real payment, OTP or database write occurs. Values in `src/data/managerDemo.js` are illustrative and **NOT approved AquaBest prices**.

Before production: separate management hosting/release, implement Supabase Auth and staff authorization, server-side role permissions/RLS, validated prices, immutable payment audit trail, true order/delivery status workflows and verified financial reports. For the future Capacitor build, target the management view explicitly rather than relying on a public query parameter.

## Employee availability (Manager and Staff preview)

The shared `EmployeeAvailability.jsx` UI supports manual **On Duty / Offline** and **Take Break / End Break** statuses, with visible local timestamps and recent transitions. **Busy** is derived automatically from an order currently in `Preparing` and assigned to that employee. Manager's Dashboard and Staff Tasks show the same demo status panel, with active/queued task counts. Manager assignment warns above the suggested soft limit of three queued tasks, and blocks new assignment to a worker marked Offline or On Break.

This is a **local-browser prototype**: status selections are saved in localStorage and may update across tabs in the same browser, but **do not synchronize across phones or accounts**. The seeded order assignments are demo fixtures, not actual employee work. Manual duty changes are not verified attendance or payroll time logs. There is no secure login yet. **My Schedule** is intentionally disabled, and Delivery role status is not implemented yet.

Production requires authenticated employee IDs, database-backed status events, authorization rules, shift scheduling and a real-time subscription for manager monitoring.

## Delivery personnel demo

Open `https://gian007.github.io/aquabest-system/?view=delivery`. This uses the **same ManagementWeb shell, shared header and employee availability UI, desktop sidebar, and mobile floating navigation** as Manager and Staff. Only role-specific views are rendered.

The delivery demo contains Dashboard, My Deliveries, Bottle Handling, Collections, Delivery History, Notifications, and More / Logout. Trips have sample Driver A assignments, progressive stages, recorded bottle load/empty/return counts, manual COD entry, and remittance requests. A trip must be loaded before it can advance to Loaded; COD must be fully recorded before delivery is marked Delivered. Cash received is tracked separately from remittance; a real manager must confirm receipt later. The shared status header derives On Delivery from active trips, with manual Break/Offline. Scheduling remains disabled.

**All records are mock/demo values and isolated in browser component state.** There is no real customer address/contact information, verified payment, inventory write, driver GPS, server login, or synchronization with Manager/Staff sessions yet. The Maps action is intentionally disabled until valid addresses are available. Real backend will require trip-to-order linking, staff handover validation, payment verification, inventory reconciliation, and permission enforcement.

## Owner and revised Delivery demo (November 2026)

The shared ManagementWeb now supports **`?view=owner`** in addition to Manager, Staff, and Delivery. Owner retains the existing AquaBest design tokens, compact status/header, full desktop sidebar, and floating mobile four-tab bar (Home, Reports, Employees, More). Owner-specific pages provide executive KPI reporting, expenses, role/POS permission previews, electronic proof review, remittance oversight, sample pricing/settings and an activity log; operational pages reuse Manager POS, Orders, Refill, Delivery, Inventory and Payments. Owner changes stay in local component state and are **not** secure authentication or actual policy enforcement.

Delivery demo progress is simplified to Assigned → Ready for Pickup → Out for Delivery → Delivered (or Failed). Container loading stays a handover action rather than an extra order stage. While Out for Delivery, the driver confirms the result and handles payment in one dialog:
- Already verified Paid: confirm delivery without collecting again.
- Cash: record cash at drop-off; separate cash remittance remains pending.
- GCash / bank transfer: require transaction reference and flag as **Pending Verification**, not verified Paid.
- Failed: require a reason without forcing collection.

**Important:** Online order source does not imply paid. All demo receipts and proof references are illustrative; they are not verified. Cross-device sync, back-end inventory release logic, pricing persistence, actual payment verification, separate two-owner identities, role enforcement and delivery/staff handovers still require Supabase/Auth/RLS. All preview URLs are publicly accessible; do not add real personal or financial data.

## November 2026 Owner/Manager usability improvements

Owner Employees now has a directory with profile detail, demo Add Employee, account activation/deactivation, role/POS permissions under Advanced, sample assigned-task counts, and honest attendance placeholders (days/hours require verified time-in/out). Owner Products & Services has a demo add/edit form, JPG/PNG/WebP image uploads (up to 2 MB), price, description, channel availability, and Active/Inactive toggles. These changes remain browser-only and do not modify the public customer products or Manager POS catalog yet.

Expense recording is in **Sales Reports** for both Manager and Owner, using the shared `ExpenseReport` component. Demo expenses can be added, edited and voided with a reason/description; recorded expenses are not revenue. Owner reports show active expense totals. Financial date filters remain visual-only until records have database timestamps. Audit and payment verification screens are prototypes—not authoritative financial records or server audit logs.
