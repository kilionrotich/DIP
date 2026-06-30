# Deal Investment Platform - Task Checklist

## Planned changes (Admin/Investor lifecycle + messaging + dashboard stats)
1. Fix/align deal + investment + proof + profit status lifecycle with required mapping:
   - Admin: create -> approved -> closed/completed/cancelled
   - Investor: available approved deals -> commit -> pending proof -> active -> completed history
2. Ensure backend endpoints exist and enforce role/status rules:
   - Add `sector` to deals
   - Approve deal (admin) and move to `approved`
   - Investor commit only allowed on `approved` deals; lock cancelled/completed deals
   - Admin verify/reject payment proof should update investment status (`active`/`pending`)
   - Admin close deal should set deal `completed` and move investments to history/completed
   - Cancel sets deal `cancelled` and locks related investments from committing
3. Implement audit logs for: deal creation, approval, close, cancellation, proof verification/rejection, profit updates.
4. Notifications/messages tied to deals on each lifecycle event.
5. Implement/finish dashboards endpoints and wire frontend:
   - Admin dashboard totals and deal breakdown
   - Investor dashboard commitments/history + profit/ROI display
6. Update frontend UI components/pages to show columns (active/pending/approved/completed/cancelled) and lock actions for cancelled/completed.
7. Sanity-check by running backend + frontend and exercising: create deal -> approve -> commit -> upload proof -> verify -> profit -> close -> history.

