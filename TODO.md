# TODO - Messaging system fix (Admin receives investor messages)

- [ ] Implement fallback routing to first admin in `backend/src/controllers/messageController.js` (sendMessage + getMessages) with structured JSON errors.
- [ ] Add helper to ensure admin exists (fallback error `{ error: "No admin account found" }`) in message controller.
- [ ] Verify frontend message sending calls no longer attempt admin lookup (update `frontend/src/services/messageService.js` and any dashboard/components that pass recipient/admin params).
- [ ] Ensure AdminDashboard fetches messages from `/api/messages` (no params) and displays them.
- [ ] Ensure InboxSupport continues to send without recipient lookup; adjust if needed for new backend behavior.
- [ ] Run backend lint/tests/build (or at least start server) and manually verify send/get flows.

