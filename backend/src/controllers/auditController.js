import AuditLog from '../models/AuditLog.js';

export async function getRecentAuditLogs(req, res) {
  try {
    const limit = Number(req.query.limit || 20);

    const logs = await AuditLog.findAll({
      order: [['log_id', 'DESC']],
      limit: Number.isFinite(limit) ? limit : 20,
    });

    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

