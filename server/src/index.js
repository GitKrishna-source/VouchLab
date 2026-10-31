import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDatabase } from './db/database.js';
import { seedDatabase } from './db/seed.js';
import { generalApiLimiter } from './middleware/security.js';
import { startOverdueWatcher } from './services/overdueWatcher.js';

import { authRouter } from './routes/auth.js';
import { resourcesRouter } from './routes/resources.js';
import { passportRouter } from './routes/passport.js';
import { bookingsRouter } from './routes/bookings.js';
import { incidentsRouter } from './routes/incidents.js';
import { auditRouter } from './routes/audit.js';
import { notificationsRouter } from './routes/notifications.js';
import { adminRouter } from './routes/admin.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware: Helmet headers with cross-origin assets support
app.use(helmet({
  contentSecurityPolicy: false, // Allows SPA inline assets and Vite development/production assets
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Middleware with origin handling
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || true,
  credentials: true
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Apply rate limiting to all /api/ routes
app.use('/api', generalApiLimiter);

// Serve static uploads for photos and certificates
const uploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Serve static build from client/dist if present
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'ShareSpace / VouchLab API', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/passport', passportRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/incidents', incidentsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/admin', adminRouter);

// SPA fallback for frontend client routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  const indexPath = path.join(clientDist, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) next();
  });
});

// Initialize DB and auto-seed if first launch
initDatabase();
seedDatabase(false).catch(err => {
  console.error('Failed to auto-seed database:', err);
});

// Start background overdue return scheduler (every 60s)
startOverdueWatcher(60000);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    details: err.details || null
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 ShareSpace Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🛡️ Audit Chain initialized with SHA-256 tamper detection\n`);
});

export default app;
