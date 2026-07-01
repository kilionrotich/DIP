import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return process.env.JWT_SECRET;
}

// Register user
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { role } = req.body;
    const normalizedRole = role === 'admin' ? 'admin' : 'investor';

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: normalizedRole,
    });

    const token = jwt.sign(
      { id: newUser.user_id, email: newUser.email, role: newUser.role },
      getJwtSecret(),
      { expiresIn: '1d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: newUser.user_id, email: newUser.email, role: newUser.role },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

// Super-admin: list all admin users (role=admin)
export const listAdmins = async (req, res) => {
  try {
    const admins = await User.findAll({
      where: { role: 'admin' },
      attributes: ['user_id', 'username', 'email', 'role'],
      order: [['user_id', 'DESC']],
    });

    res.json({ admins });
  } catch (error) {
    console.error('List admins error:', error);
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
};

// Super-admin: create an admin
export const createAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email, and password are required' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'admin',
    });

    res.status(201).json({ message: 'Admin created', admin });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Failed to create admin' });
  }
};

// Super-admin: update an admin
export const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password } = req.body;

    const admin = await User.findOne({ where: { user_id: id, role: 'admin' } });
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    if (email && email !== admin.email) {
      const conflict = await User.findOne({ where: { email } });
      if (conflict) return res.status(400).json({ error: 'Email already in use' });
      admin.email = email;
    }

    if (username) admin.username = username;
    if (password) admin.password = await bcrypt.hash(password, 10);

    await admin.save();

    res.json({ message: 'Admin updated', admin });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({ error: 'Failed to update admin' });
  }
};

// Super-admin: delete an admin
export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await User.findOne({ where: { user_id: id, role: 'admin' } });
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    await admin.destroy();

    res.json({ message: 'Admin deleted' });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ error: 'Failed to delete admin' });
  }
};

// Login user — returns { userId, email, token } on success
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Investor approval gate:
    // - super_admin/admin can login immediately
    // - investors must have at least one approved InvestorAdmin mapping
    if (user.role === 'investor') {
      const InvestorAdmin = (await import('../models/InvestorAdmin.js')).default;
      const { Op } = (await import('sequelize')).Op;

      const approval = await InvestorAdmin.findOne({
        where: {
          investor_id: user.user_id,
          approved_at: { [Op.ne]: null },
        },
      });

      if (!approval) {
        return res.status(403).json({ error: 'Investor is pending approval' });
      }
    }

    const token = jwt.sign(
      { id: user.user_id, email: user.email, role: user.role },
      getJwtSecret(),
      { expiresIn: '1d' }
    );

    res.json({
      userId: user.user_id,
      email: user.email,
      token,
      // Keep user object for backward compatibility with AuthContext
      user: {
        id: user.user_id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    // Log full error so we can identify the real 500 cause on Render.
    console.error('Login error:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
    });

    // Return a more informative payload (avoid leaking internals too much, but
    // provide enough context to diagnose issues like missing JWT_SECRET).
    const statusCode = 500;
    const safeError = error?.message ? String(error.message) : 'Login failed';

    res.status(statusCode).json({
      error: 'Login failed. Please try again.',
      debug: safeError,
    });
  }
};
