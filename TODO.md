# TODO

## Simplify system by removing unused modules

- [ ] Update `frontend/src/pages/InvestorDashboard.jsx` to remove unused dashboard sections (ProfitTrends, Notifications, Diversification, InboxSupport) and related profit loading/KPIs.
- [ ] Update `frontend/src/pages/AdminDashboard.jsx` to remove Messages & Replies tab and related messaging state/navigation/UI.
- [ ] Update `frontend/src/components/InvestmentForm.jsx` to remove receipt upload/placeholder text and related optional proof URL fields.
- [x] Update `frontend/src/components/investor/InvestmentHistory.jsx` to remove/neutralize receipt download placeholder text.

- [ ] Update `frontend/src/components/investor/index.js` exports to match removed components.
- [x] Build/test frontend to confirm only working modules render and no placeholder "Coming soon" text remains.


