# blackboxai/TODO.progress

- [x] Locate current message controller + frontend messaging calls.
- [x] Updated backend messageController.js send/get to use first admin from Admin table.
- [x] Updated frontend messageService.js to call POST /api/messages/send without recipient/admin lookup.
- [x] Updated AdminDashboard.jsx inbox fetch to use getInboxMessages() without params.
- [x] Fixed messageController.js runtime bug caused by implicit globals (receiver_id/recipient_id).
- [x] Adjusted AdminDashboard.jsx to treat messageService return as resilient (array vs {messages}).
- [ ] Manual smoke-test endpoints: 
  - POST /api/messages/send (investor) -> message stored with receiver_id = first admin.user_id
  - GET /api/messages (admin) -> only messages where receiver_id = first admin.user_id
  - Missing admin scenario -> JSON { error: "No admin account found" }.

