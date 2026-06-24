# TODO - Investor Section + Super Admin Flow

## Part A — Super admin role + route restrictions (existing)

### Backend
- [x] `backend/src/models/User.js` role enum includes `super_admin`.
- [ ] Verify JWT payload includes user role so `verifyToken` populates `req.user.role` reliably.
- [x] Ensure `isSuperAdmin` middleware exists in `backend/src/middleware/authMiddleware.js`.
- [x] Super-admin-only endpoints for admin CRUD exist in `backend/src/controllers/authController.js`.
- [x] Wire super-admin-only endpoints in `backend/src/routes/authRoutes.js`.
- [ ] Restrict deal/investment/profit routes so only `admin` + `super_admin` can access create/update (investor should only read/commit as allowed).

### Frontend
- [x] Super admin route exists and is protected in `frontend/src/routes.js` (`/super-admin`).
- [x] `frontend/src/pages/Login.jsx` redirect logic routes `super_admin -> /super-admin`, `admin -> /admin`, `investor -> /dashboard`.
- [x] `frontend/src/pages/SuperAdminDashboard.jsx` for admin CRUD.

### Testing
- [ ] Manual test: login as each role and confirm correct dashboard + route access.
- [ ] Manual test: ensure only super admin can create/edit/delete admin accounts.

---

## Part B — Investor section (requested full implementation)

### 1) Account Setup
- [ ] Investor Profile page (view/edit profile basics)
- [ ] Investor Payment Details page (save/update payout details / payment method)
- [ ] Backend endpoints for investor profile + payment details (GET/PUT)
- [ ] Wire frontend navigation: Dashboard → Profile, Dashboard → Payment Details

### 2) Browse Deals
- [ ] Add investor filters UI on deals list:
  - Sector
  - ROI
  - Deadline (end_date)
  - Risk level
- [ ] Backend deal filtering support with query params on `GET /api/deals`.
- [ ] Frontend applies filters (debounced) and renders filtered deals

### 3) Commit Investments
- [ ] Commit form includes **payment proof upload** (file) or **proof URL**
- [ ] Backend implement/confirm `POST /api/deals/:dealId/invest`:
  - create `Investment`
  - create `PaymentProof`
- [ ] Backend implement admin verification endpoints:
  - verify proof
  - reject proof
- [ ] Frontend shows investment status timeline:
  - pending → verified → active → completed (as your backend supports)
- [ ] Frontend shows reason/errors when rejected

### 4) Portfolio Tracking
- [ ] Investor dashboard analytics:
  - total invested
  - current value
  - ROI
  - diversification by sector
- [ ] Backend endpoint(s) for portfolio summary

### 5) Profit Monitoring → notifications
- [ ] Notification center UI (in-app list)
- [ ] Backend endpoints for investor notifications
- [ ] Trigger notifications on:
  - deal close
  - distribution / payout events

### 6) Investment History
- [ ] Investment History page (timeline)
- [ ] Receipt/report download for each investment
- [ ] Backend endpoints to generate receipts/reports

### 7) Communication
- [ ] Investor announcements feed UI
- [ ] Investor support/dispute tickets UI
- [ ] Backend endpoints + ticket resolution workflow

---

## Part C — Implementation order (build sequence)
1. [ ] Confirm backend endpoints for committing investments + payment proof upload.
2. [ ] Fix/standardize field names between frontend payloads and Sequelize models.
3. [ ] Implement payment proof + admin verification end-to-end.
4. [ ] Add investor history + basic portfolio summary.
5. [ ] Add deal filters.
6. [ ] Add notifications + announcements + support tickets.


