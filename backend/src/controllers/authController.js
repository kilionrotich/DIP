// backend/src/controllers/authController.js
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
    const normalizedRole = role === 'admin' ? 'admin' : 'investor';

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: normalizedRole,
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },   // ✅ aligned with PK "id"
      process.env.JWT_SECRET || 'fallback_secret', // ✅ prevents crash if env missing
      { expiresIn: '1d' }
    );

    res.status(201).json({ message: 'User registered successfully', token, user: newUser });
  } catch (error) {
    console.error('Register error (full):', error); // ✅ full error object
    res.status(500).json({
      message: 'Registration failed',
      error: error.message,
      stack: error.stack, // ✅ shows stack trace in response for debugging
    });
  }
};

// Admin list all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['username', 'role', 'email'],
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error (full):', error);
    res.status(500).json({
      message: 'Failed to fetch users',
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
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );

    // Return user role/type so the frontend can route to /admin
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
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