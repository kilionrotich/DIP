import User from '../models/User.js';
import Investment from '../models/Investment.js';

export async function listInvestors(req, res) {
  try {
    // Derive investors from distinct investor_id values in investments
    const rows = await Investment.findAll({
      attributes: ['investor_id'],
      group: ['investor_id'],
      raw: true,
    });

    const investorIds = rows.map((r) => r.investor_id).filter(Boolean);

    if (!investorIds.length) {
      return res.json({ investors: [] });
    }

    const users = await User.findAll({
      where: { user_id: investorIds },
      attributes: ['user_id', 'username', 'email', 'role'],
      order: [['user_id', 'DESC']],
    });

    res.json({ investors: users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

