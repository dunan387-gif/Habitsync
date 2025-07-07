import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Register endpoint
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Create user
    const user = new User({ email, password, name });
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userData = {
      id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      dateOfBirth: user.dateOfBirth,
      location: user.location,
      joinedAt: user.joinedAt,
      preferences: user.preferences,
      stats: user.stats
    };

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: userData
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login endpoint
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userData = {
      id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      dateOfBirth: user.dateOfBirth,
      location: user.location,
      joinedAt: user.joinedAt,
      preferences: user.preferences,
      stats: user.stats
    };

    res.json({
      message: 'Login successful',
      token,
      user: userData
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user endpoint
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const userData = {
      id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      dateOfBirth: user.dateOfBirth,
      location: user.location,
      joinedAt: user.joinedAt,
      preferences: user.preferences,
      stats: user.stats
    };

    res.json({ user: userData });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;