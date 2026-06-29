# Deal Investment Platform - Task Checklist

## Planned changes (Admin/Investor lifecycle + messaging + dashboard stats)
1. Fix/align deal + investment + proof + profit status lifecycle with required mapping:
   - Admin: create -> approved -> closed/completed/cancelled
   - Investor: available approved deals -> commit -> pending proof -> active -> completed history
2. Ensure backend endpoints exist and enforce role/status rules:
   - Approve deal (admin) and move to "approved" column
   - Investor commit should only allow on approved deals; lock cancelled/completed deals
   - Admin verify/reject payment proof should update investment status (active/pending)
   - Admin close deal should set deal completed and move investors to history
   - Cancel should set deal cancelled (and lock committing)
3. Implement dashboard stats endpoints and wire frontend:
   - Admin dashboard: Total Invested, Profits, Investments updating automatically
   - Investor dashboard: Total Invested, Current Value, ROI, Profits updating automatically
4. Implement/finish message notifications in both dashboards:
   - Admin sends messages on approval, rejection, closure
   - Investor receives messages and sees them in Messages/Inbox
5. Update frontend UI to reflect lifecycle columns and history:
   - Admin: Active Deals, Approved Deals, History of Completed Deals, Cancelled visible but locked
   - Investor: active/pending investments and history; status pills; lock UI when cancelled/completed
6. Run backend/frontend tests or at least start dev servers and sanity-check flows.

