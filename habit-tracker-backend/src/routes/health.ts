import express, { Request, Response } from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Health check endpoint
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    const healthCheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus,
        name: mongoose.connection.name || 'unknown'
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100
      }
    };
    
    res.status(200).json(healthCheck);
  } catch (error: any) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Detailed health check with database ping
router.get('/detailed', async (req: Request, res: Response): Promise<void> => {
  try {
    // Test database connection with a simple query
    let dbPing;
    if (mongoose.connection.db) {
      dbPing = await mongoose.connection.db.admin().ping();
    } else {
      throw new Error('Database connection not available');
    }
    
    const detailedHealth = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: {
        status: 'connected',
        ping: dbPing,
        name: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port
      },
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
          external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100
        },
        cpu: {
          usage: process.cpuUsage()
        }
      }
    };
    
    res.status(200).json(detailedHealth);
  } catch (error: any) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message,
      database: {
        status: 'error',
        message: 'Database connection failed'
      }
    });
  }
});

export default router;