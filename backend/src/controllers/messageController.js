import Message from '../models/Message.js';
import User from '../models/User.js';

// Investor/Admin sends a message to another user.
export async function sendMessage(req, res) {
  try {
    const { receiver_id, subject, body } = req.body;

    const sender_id = req.user?.id ?? req.user?.user_id;
    if (!sender_id) return res.status(403).json({ error: 'Unauthorized' });

    if (!receiver_id) return res.status(400).json({ error: 'Missing receiver_id' });
    if (!subject || typeof subject !== 'string') {
      return res.status(400).json({ error: 'Missing/invalid subject' });
    }
    if (!body || typeof body !== 'string') {
      return res.status(400).json({ error: 'Missing/invalid body' });
    }

    // Ensure receiver exists
    const receiver = await User.findByPk(receiver_id);
    if (!receiver) return res.status(404).json({ error: 'Receiver not found' });

    const message = await Message.create({
      sender_id,
      receiver_id,
      subject: subject.trim(),
      body: body.trim(),
      status: 'sent',
    });

    const withUsers = await Message.findByPk(message.message_id, {
      include: [
        { model: User, as: 'sender', attributes: ['user_id', 'username', 'email', 'role'] },
        { model: User, as: 'receiver', attributes: ['user_id', 'username', 'email', 'role'] },
      ],
    });

    return res.status(201).json(withUsers);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

// Get inbox messages for the authenticated user.
// Optionally filter by sender_id (for thread-like view).
export async function getMessages(req, res) {
  try {
    const receiver_id = req.user?.id ?? req.user?.user_id;
    if (!receiver_id) return res.status(403).json({ error: 'Unauthorized' });

    const { sender_id } = req.query;

    const where = { receiver_id };
    if (sender_id) where.sender_id = sender_id;

    const messages = await Message.findAll({
      where,
      order: [['created_at', 'DESC']],
      include: [
        { model: User, as: 'sender', attributes: ['user_id', 'username', 'email', 'role'] },
      ],
    });

    res.json({ messages });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

