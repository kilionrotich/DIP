import Message from '../models/Message.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import InvestorAdmin from '../models/InvestorAdmin.js';

// Helper: resolve the approved admin that should receive messages from the given investor.
// investor_user_id refers to users.user_id
async function getApprovedAdminForInvestorOrNull(investor_user_id) {
  const { Op } = (await import('sequelize')).Op;
  const approval = await InvestorAdmin.findOne({

    where: {
      investor_id: investor_user_id,
      approved_at: { [Op.ne]: null },
    },
    include: [
      {
        model: Admin,
        as: 'admin',
      },
    ],
  });


  return approval?.admin || null;
}

// Send a message.
// - Investors: route to their approved admin.
// - Admins/Super-admin: allow sending but still route to their own approved admin mapping if applicable.
export async function sendMessage(req, res) {
  try {
    const { subject, body } = req.body || {};

    const sender_id = req.user?.id ?? req.user?.user_id;
    if (!sender_id) {
      return res.status(404).json({ error: 'No account found' });
    }

    if (!subject || typeof subject !== 'string') {
      return res.status(400).json({ error: 'Missing/invalid subject' });
    }
    if (!body || typeof body !== 'string') {
      return res.status(400).json({ error: 'Missing/invalid body' });
    }

    // Determine recipient admin for the sender.
    const senderUser = await User.findByPk(sender_id);
    if (!senderUser) {
      return res.status(404).json({ error: 'No account found' });
    }

    const admin = await getApprovedAdminForInvestorOrNull(senderUser.user_id);
    if (!admin) {
      return res.status(404).json({ error: 'Investor not approved by any admin' });
    }

    const receiver_id = admin.user_id; // Message.receiver_id is users.user_id
    const recipient_id = admin.admin_id; // Message.recipient_id is admins.admin_id

    const receiver = await User.findByPk(receiver_id);
    if (!receiver) {
      return res.status(404).json({ error: 'No account found' });
    }

    const created = await Message.create({
      sender_id: senderUser.user_id,
      receiver_id,
      recipient_id,
      subject: subject.trim(),
      body: body.trim(),
      status: 'sent',
    });

    const withUsers = await Message.findByPk(created.message_id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['user_id', 'username', 'email', 'role'],
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['user_id', 'username', 'email', 'role'],
        },
        {
          model: Admin,
          as: 'recipient',
          attributes: ['admin_id', 'user_id'],
        },
      ],
    });

    return res.status(201).json(withUsers);
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Failed to send message' });
  }
}

// Get inbox messages for the authenticated admin.
export async function getMessages(req, res) {
  try {
    const adminUserId = req.user?.id ?? req.user?.user_id;
    if (!adminUserId) {
      return res.status(404).json({ error: 'No account found' });
    }

    const admin = await Admin.findOne({
      where: { user_id: adminUserId },
    });

    if (!admin) {
      return res.status(404).json({ error: 'No admin account found' });
    }

    const messages = await Message.findAll({
      where: {
        receiver_id: admin.user_id,
      },
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['user_id', 'username', 'email', 'role'],
        },
      ],
    });

    return res.json({ messages });
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Failed to fetch messages' });
  }
}

// Admin verifies a message.
export async function verifyMessage(req, res) {
  try {
    const messageId = req.params.messageId || req.body.message_id;
    if (!messageId) return res.status(400).json({ error: 'Missing message_id' });

    await Message.update({ status: 'verified' }, { where: { message_id: messageId } });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Failed to verify message' });
  }
}

// Admin deletes a message.
export async function deleteMessage(req, res) {
  try {
    const messageId = req.params.messageId || req.body.message_id;
    if (!messageId) return res.status(400).json({ error: 'Missing message_id' });

    await Message.destroy({ where: { message_id: messageId } });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Failed to delete message' });
  }
}

