import Message from '../models/Message.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

// Helper: resolve the (single) admin that should receive investor messages.
// Requirement: route to the first admin in the database.
async function getPrimaryAdminOrFirst() {
  const admin = await Admin.findOne({
    order: [['created_at', 'ASC']],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['user_id', 'email', 'username', 'role'],
      },
    ],
  });

  return admin;
}

// Send a message. Always routes to the first admin.

export async function sendMessage(req, res) {
  try {
    const { subject, body } = req.body || {};

    const sender_id = req.user?.id ?? req.user?.user_id;

    if (!sender_id) return res.status(403).json({ error: 'Unauthorized' });

    // This system belongs to only one person.
    // Ignore any client-provided recipient/receiver and route to the first admin.
    const admin = await getPrimaryAdminOrFirst();
    if (!admin) {
      return res.status(404).json({ error: 'No admin account found' });
    }

    const receiver_id = admin.user_id;
    const recipient_id = admin.admin_id;





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

// Get inbox messages for the (single) admin.
export async function getMessages(req, res) {
  try {
    const admin = await getPrimaryAdminOrFirst();
    if (!admin) {
      return res.status(404).json({ error: 'No admin account found' });
    }

    const { sender_id } = req.query;

    const where = { receiver_id: admin.user_id };
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

    return res.json({ messages });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
}


// Admin verifies a message.
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
