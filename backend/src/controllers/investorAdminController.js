import InvestorAdmin from '../models/InvestorAdmin.js';
import Admin from '../models/Admin.js';
import User from '../models/User.js';

// POST /api/investor-admin/approve
// Body: { investor_id, admin_id }
export async function approveInvestorAdmin(req, res) {
  try {
    const { investor_id, admin_id } = req.body || {};

    if (!investor_id) return res.status(400).json({ error: 'Missing investor_id' });
    if (!admin_id) return res.status(400).json({ error: 'Missing admin_id' });

    const investor = await User.findByPk(investor_id);
    if (!investor) return res.status(404).json({ error: 'No account found' });

    const admin = await Admin.findByPk(admin_id);
    if (!admin) return res.status(404).json({ error: 'No account found' });

    // Upsert approval
    const [row, created] = await InvestorAdmin.findOrCreate({
      where: { investor_id, admin_id },
      defaults: { approved_at: new Date() },
    });

    if (!created && !row.approved_at) {
      await InvestorAdmin.update(
        { approved_at: new Date() },
        { where: { investor_id, admin_id } }
      );
    }

    return res.status(created ? 201 : 200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to approve investor' });
  }
}

