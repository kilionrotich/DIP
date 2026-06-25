# TODO - Investor Dashboard Completion (Option 2: incremental)

## Phase 1 — Deal browsing + invest/proof flow (Investor -> pending -> Admin verify -> active)
- [x] Add/confirm investor-facing “Available Deals” backend endpoint with filters: sector, ROI, deadline, risk.
- [x] Wire investor “Available Deals” filters UI + client request params.


- [ ] Ensure frontend “Available Deals” uses the filtered deal endpoint.
- [ ] Add investor endpoint to create an investment and upload payment proof (or split: create investment + upload proof).
- [ ] Add frontend invest flow UI (deal select -> amount -> payment method -> upload proof).
- [ ] Ensure admin verification updates Investment status to `active` (already partially implemented) and creates an audit log.
- [ ] Validate end-to-end: investor invests -> proof pending -> admin verify -> active.

## Phase 2 — Portfolio analytics
- [ ] Replace KPI approximation with backend-backed aggregation (total invested, current value, ROI).
- [ ] Implement profit time-series endpoint; update ProfitTrends component to render real chart.
- [ ] Implement diversification aggregation endpoint; replace placeholders.
- [ ] Ensure InvestmentHistory shows correct outcomes and enables receipt download when available.

## Phase 3 — Notifications + communication
- [ ] Implement backend notification/events model + endpoints for investor.
- [ ] Replace Notifications placeholder with real data (polling/SSE).
- [ ] Implement Inbox/Support/dispute tickets model + endpoints.
- [ ] Replace InboxSupport placeholder with real ticket creation + listing.

## Phase 4 — Receipts / reports
- [ ] Implement backend receipt/report generation endpoint(s) for each investment.
- [ ] Implement frontend download/print for receipts.
- [ ] Validate downloads.

