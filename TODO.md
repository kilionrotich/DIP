- [ ] Backend: add `fixed_amount` to `backend/src/models/Deal.js`
- [ ] Backend: update `backend/src/controllers/dealController.js` create/update to handle `fixed_amount`
- [ ] Backend: enforce exact fixed amount + prevent duplicate investments in `backend/src/routes/dealRoutes.js` POST /:dealId/invest
- [ ] Backend: ensure DealDetails endpoint returns `fixed_amount` (verify existing GET /:dealId)
- [ ] Frontend: show `Required Investment: X KES` in `frontend/src/pages/DealDetails.jsx`
- [ ] Frontend: remove custom amount input and make commit use fixed amount in `frontend/src/components/InvestmentForm.jsx`
- [ ] Frontend: pass fixed amount prop from DealDetails to InvestmentForm
- [ ] Smoke test: run backend/frontend and verify commit + duplicate prevention

