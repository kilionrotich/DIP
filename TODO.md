# Deal Investment Platform - Implementation TODO

- [ ] Step 1: Refactor InvestorDashboard into requested core sections (KPIs, Active Deals, Profit Trends area, Investment History, Notifications, Diversification, Communication/Inbox).
- [ ] Step 2: Add missing frontend components for each section (InvestorKPICards, ActiveDeals, ProfitTrends, InvestmentHistory, Notifications, Diversification, InboxSupport).
- [ ] Step 3: Compute KPIs using existing backend endpoints:
  - Total Invested from `/api/investments` (sum `amount_invested`).
  - Profits from `/api/profits` (sum `total_profit`).
  - ROI as `profits / totalInvested`.
  - Current Value approximated as `totalInvested + profits`.
- [ ] Step 4: Ensure sections degrade gracefully with “Coming soon / no data available” where backend data is missing.
- [ ] Step 5: Keep existing “Available Deals” functionality using `useDeals()` + `DealCrad`.
- [x] Step 1: Refactor InvestorDashboard into requested core sections (KPIs, Active Deals, Profit Trends area, Investment History, Notifications, Diversification, Communication/Inbox).
- [x] Step 2: Add missing frontend components for each section (InvestorKPICards, ActiveDeals, ProfitTrends, InvestmentHistory, Notifications, Diversification, InboxSupport).
- [x] Step 3: Compute KPIs using existing backend endpoints.
- [ ] Step 4: Ensure sections degrade gracefully with “Coming soon / no data available” where backend data is missing.
- [ ] Step 5: Keep existing “Available Deals” functionality using `useDeals()` + `DealCrad`.
- [ ] Step 6: Run frontend build/lint (if available) and ensure no runtime errors.


