import express, { Request, Response } from 'express';
import Habit from '../models/Habit';
import User from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all habits for the authenticated user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const habits = await Habit.find({ 
      userId: req.userId,
      isActive: true 
    }).sort({ createdAt: -1 });
    
    res.json({ habits });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific habit by ID
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const habit = await Habit.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    
    if (!habit) {
      res.status(404).json({ message: 'Habit not found' });
      return;
    }
    
    res.json({ habit });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new habit
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, category, frequency, targetCount } = req.body;
    
    // Validate required fields
    if (!title || !category) {
      res.status(400).json({ message: 'Title and category are required' });
      return;
    }
    
    const habit = new Habit({
      userId: req.userId,
      title,
      description,
      category,
      frequency: frequency || 'daily',
      targetCount: targetCount || 1
    });
    
    await habit.save();
    
    // Update user stats
    await User.findByIdAndUpdate(req.userId, {
      $inc: { 'stats.totalHabits': 1 }
    });
    
    res.status(201).json({ 
      message: 'Habit created successfully', 
      habit 
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a habit
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, category, frequency, targetCount, isActive } = req.body;
    
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(frequency && { frequency }),
        ...(targetCount && { targetCount }),
        ...(isActive !== undefined && { isActive })
      },
      { new: true }
    );
    
    if (!habit) {
      res.status(404).json({ message: 'Habit not found' });
      return;
    }
    
    res.json({ 
      message: 'Habit updated successfully', 
      habit 
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark habit as completed for today
router.post('/:id/complete', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { count = 1 } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const habit = await Habit.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    
    if (!habit) {
      res.status(404).json({ message: 'Habit not found' });
      return;
    }
    
    // Check if already completed today
    const todayCompletion = habit.completions.find(
      completion => completion.date.getTime() === today.getTime()
    );
    
    if (todayCompletion) {
      todayCompletion.count += count;
    } else {
      habit.completions.push({ date: today, count });
      
      // Update streak
      habit.currentStreak += 1;
      if (habit.currentStreak > habit.longestStreak) {
        habit.longestStreak = habit.currentStreak;
      }
    }
    
    await habit.save();
    
    res.json({ 
      message: 'Habit marked as completed', 
      habit 
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a habit
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isActive: false },
      { new: true }
    );
    
    if (!habit) {
      res.status(404).json({ message: 'Habit not found' });
      return;
    }
    
    // Update user stats
    await User.findByIdAndUpdate(req.userId, {
      $inc: { 'stats.totalHabits': -1 }
    });
    
    res.json({ message: 'Habit deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get habit statistics
router.get('/:id/stats', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const habit = await Habit.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    
    if (!habit) {
      res.status(404).json({ message: 'Habit not found' });
      return;
    }
    
    const totalCompletions = habit.completions.reduce((sum, completion) => sum + completion.count, 0);
    const completionRate = habit.completions.length > 0 ? 
      (habit.completions.length / Math.ceil((Date.now() - habit.createdAt.getTime()) / (1000 * 60 * 60 * 24))) * 100 : 0;
    
    const stats = {
      totalCompletions,
      currentStreak: habit.currentStreak,
      longestStreak: habit.longestStreak,
      completionRate: Math.round(completionRate * 100) / 100,
      recentCompletions: habit.completions.slice(-30) // Last 30 completions
    };
    
    res.json({ stats });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;