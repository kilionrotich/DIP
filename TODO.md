# TODO - Super Admin role + route restrictions

## Backend
- [ ] Update `backend/src/models/User.js` role enum to include `super_admin`.
- [ ] Update JWT payload so `verifyToken` can populate `req.user.role` reliably.
- [ ] Add `isSuperAdmin` middleware in `backend/src/middleware/authMiddleware.js`.
- [ ] Add super-admin-only endpoints for admin CRUD in `authController`.
- [ ] Wire new endpoints in `authRoutes`.
- [ ] Restrict deal/investment/profit routes so only `admin` + `super_admin` can access create/update.

## Frontend
- [ ] Add super admin route (separate from `/admin`) and dashboard UI.
- [ ] Update `frontend/src/pages/Login.jsx` redirect logic: `super_admin -> /super-admin`, `admin -> /admin`, `investor -> /dashboard`.
- [ ] Add `frontend/src/pages/SuperAdminDashboard.jsx` to manage admins (list/create/update/delete).
- [ ] Update `frontend/src/routes.js` to protect new `/super-admin` route.

## Testing
- [ ] Manual test: login as each role and confirm correct dashboard + route access.
- [ ] Manual test: ensure only super admin can create/edit/delete admin accounts.

