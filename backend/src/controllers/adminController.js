import Admin from '../models/Admin.js';
import User from '../models/User.js';

// GET /api/admins/primary
// Returns the primary admin's id and email
export async function getPrimaryAdmin(req, res) {
  try {
    const primary = await Admin.findOne({
      where: { is_primary: true },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'email', 'username'],
        },
      ],
    });

    if (!primary) {
      return res.status(404).json({ error: 'No primary admin found. Contact support.' });
    }

    return res.json({
      admin_id: primary.admin_id,
      user_id: primary.user_id,
      email: primary.user.email,
      username: primary.user.username,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
