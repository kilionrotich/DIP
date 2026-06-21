import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Register user
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { role } = req.body;
    // Only admin is allowed via public registration; anything else defaults to investor.
    // super_admin can only be created by direct DB/seed (not via this endpoint).
    const normalizedRole = role === 'admin' ? 'admin' : 'investor';

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: normalizedRole,
    });

    const token = jwt.sign(
      { id: newUser.user_id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );

    res.status(201).json({ message: 'User registered successfully', token, user: newUser });
  } catch (error) {
    console.error('Register error (full):', error);
    res.status(500).json({
      message: 'Registration failed',
      error: error.message,
      stack: error.stack,
    });
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
    console.error('List admins error (full):', error);
    res.status(500).json({
      message: 'Failed to fetch admins',
      error: error.message,
      stack: error.stack,
    });
  }
};

// Super-admin: create an admin
export const createAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email, and password are required' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
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
    console.error('Create admin error (full):', error);
    res.status(500).json({
      message: 'Failed to create admin',
      error: error.message,
      stack: error.stack,
    });
  }
};

// Super-admin: update an admin
export const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password } = req.body;

    const admin = await User.findOne({ where: { user_id: id, role: 'admin' } });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    if (email && email !== admin.email) {
      const conflict = await User.findOne({ where: { email } });
      if (conflict) return res.status(400).json({ message: 'Email already in use' });
      admin.email = email;
    }

    if (username) admin.username = username;
    if (password) admin.password = await bcrypt.hash(password, 10);

    await admin.save();

    res.json({ message: 'Admin updated', admin });
  } catch (error) {
    console.error('Update admin error (full):', error);
    res.status(500).json({
      message: 'Failed to update admin',
      error: error.message,
      stack: error.stack,
    });
  }
};

// Super-admin: delete an admin
export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await User.findOne({ where: { user_id: id, role: 'admin' } });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    // Optional: prevent deleting the only super admin if super admin shares an ID somehow.
    // In this schema, super_admin has role 'super_admin' so deleting admins is safe.

    await admin.destroy();

    res.json({ message: 'Admin deleted' });
  } catch (error) {
    console.error('Delete admin error (full):', error);
    res.status(500).json({
      message: 'Failed to delete admin',
      error: error.message,
      stack: error.stack,
    });
  }
};

// Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.user_id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error (full):', error);
    res.status(500).json({
      message: 'Login failed',
      error: error.message,
      stack: error.stack,
    });
  }
};

