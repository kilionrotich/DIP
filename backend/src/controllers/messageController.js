import Message from '../models/Message.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

const ADMIN_EMAIL = 'anthonypyatich@gmail.com';

// Helper: find admin by hardcoded email
async function getAdminByEmail() {
  return await Admin.findOne({
    include: [
      {
        model: User,
        as: 'user',
        where: { email: ADMIN_EMAIL, role: 'admin' },
      },
    ],
  });
}

// Send a message. If no recipient specified, routes to the hardcoded admin.
export async function sendMessage(req, res) {
  try {
    let { recipient_id, receiver_id, subject, body } = req.body;

    const sender_id = req.user?.id ?? req.user?.user_id;
    if (!sender_id) return res.status(403).json({ error: 'Unauthorized' });

    // Accept either field name, resolve to hardcoded admin if missing
    const targetReceiverId = recipient_id || receiver_id;

    if (!targetReceiverId) {
      const admin = await getAdminByEmail();
      if (!admin) {
        return res.status(404).json({
          error: 'Admin contact not found. Please contact support@dip.com.',
        });
      }
      receiver_id = admin.user_id;
      recipient_id = admin.admin_id;
    } else {
      receiver_id = targetReceiverId;
    }

    if (!subject || typeof subject !== 'string') {
      return res.status(400).json({ error: 'Missing/invalid subject' });
    }
    if (!body || typeof body !== 'string') {
      return res.status(400).json({ error: 'Missing/invalid body' });
    }

    // Verify receiver exists
    const receiver = await User.findByPk(receiver_id);
    if (!receiver) return res.status(404).json({ error: 'Receiver not found' });

    const message = await Message.create({
      sender_id,
      receiver_id,
      recipient_id: recipient_id || null,
      subject: subject.trim(),
      body: body.trim(),
      status: 'sent',
    });

    const withUsers = await Message.findByPk(message.message_id, {
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
    return res.status(500).json({ error: err.message });
  }
}

// Get inbox messages for the authenticated user.
export async function getMessages(req, res) {
  try {
    const currentUserId = req.user?.id ?? req.user?.user_id;
    if (!currentUserId) return res.status(403).json({ error: 'Unauthorized' });

    const { sender_id } = req.query;
    const where = { receiver_id: currentUserId };
    if (sender_id) where.sender_id = sender_id;

    const messages = await Message.findAll({
      where,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['user_id', 'username', 'email', 'role'],
        },
      ],
    });

    res.json({ messages });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// Admin verifies a message (marks as verified or important).
export async function verifyMessage(req, res) {
  try {
    const messageId = req.params.messageId || req.body.message_id;
    if (!messageId) return res.status(400).json({ error: 'Missing message_id' });

    await Message.update(
      { status: 'verified' },
      { where: { message_id: messageId } }
    );

    res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// Admin deletes a message.
export async function deleteMessage(req, res) {
  try {
    const messageId = req.params.messageId || req.body.message_id;
    if (!messageId) return res.status(400).json({ error: 'Missing message_id' });

    await Message.destroy({ where: { message_id: messageId } });

    res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
