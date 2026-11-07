import http from 'http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import settingRoutes from './routes/settingRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Setup Socket.io for Real-time events
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || origin === FRONTEND_URL || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  },
});

io.on('connection', (socket) => {
  // Join role or table rooms
  socket.on('join:room', (room) => {
    socket.join(room);
  });

  socket.on('leave:room', (room) => {
    socket.leave(room);
  });
});

app.set('io', io);

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin === FRONTEND_URL || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, status: 'operational', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// Connect Database, then start accepting requests
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Express API & WebSocket Server running on port ${PORT}`);
      console.log(`👉 CORS Allowed: ${FRONTEND_URL}`);
    });
  })
  .catch(() => {
    console.error('❌ Server not started because MongoDB is unavailable.');
    process.exit(1);
  });
