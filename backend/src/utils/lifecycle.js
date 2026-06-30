// backend/src/utils/lifecycle.js
// Helpers shared across the deal/investment lifecycle: best-effort audit logging
// and investor notifications (messages). These are intentionally non-fatal: a
// failure to record an audit entry or send a notification must never break the
// primary admin action (approve/verify/close/cancel/...).

import AuditLog from '../models/AuditLog.js';
import Message from '../models/Message.js';

// Resolve the acting user's id from the decoded JWT payload.
export function actorId(req) {
  return req.user?.id ?? req.user?.user_id ?? null;
}

// Record an audit entry. Best-effort: swallows errors.
export async function logAudit({ user_id, action, target_id }) {
  try {
    await AuditLog.create({
      user_id: user_id ?? null,
      action,
      target_id: target_id ?? null,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Audit log failed:', err?.message);
  }
}

// Send a notification message to a single investor. Best-effort.
export async function notifyInvestor({ sender_id, receiver_id, subject, body }) {
  try {
    if (!sender_id || !receiver_id) return;
    await Message.create({
      sender_id,
      receiver_id,
      subject: subject || 'Update',
      body: body || '',
      status: 'sent',
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Notify investor failed:', err?.message);
  }
}

// Send the same notification to many investors. Best-effort and deduplicated.
export async function notifyInvestors({ sender_id, receiverIds, subject, body }) {
  const unique = Array.from(new Set((receiverIds || []).filter(Boolean)));
  await Promise.all(
    unique.map((receiver_id) =>
      notifyInvestor({ sender_id, receiver_id, subject, body })
    )
  );
}
