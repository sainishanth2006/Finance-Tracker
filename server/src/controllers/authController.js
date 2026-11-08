import User from '../models/User.js';
import Category from '../models/Category.js';
import { generateToken } from '../utils/token.js';

const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', color: '#f59e0b', icon: 'utensils' },
  { name: 'Housing', color: '#3b82f6', icon: 'home' },
  { name: 'Transportation', color: '#10b981', icon: 'car' },
  { name: 'Utilities', color: '#06b6d4', icon: 'zap' },
  { name: 'Entertainment', color: '#8b5cf6', icon: 'clapperboard' },
  { name: 'Health & Fitness', color: '#ef4444', icon: 'heart-pulse' },
  { name: 'Shopping', color: '#ec4899', icon: 'shopping-bag' },
  { name: 'Other', color: '#6b7280', icon: 'ellipsis' },
];

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({ name, email, password });

    await Category.insertMany(
      DEFAULT_CATEGORIES.map((c) => ({ ...c, user: user._id }))
    );

    const token = generateToken(user._id);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);
    res.status(200).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    next(error);
  }
}

export function getMe(req, res) {
  res.status(200).json({ user: req.user });
}
