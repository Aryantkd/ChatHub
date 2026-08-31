// server.js
import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import connectDB from './src/database/database.js';
import router from './src/routes/routes.js';
import errorHandler from './src/middleware/errorHandler.js';
import { initSocketServer } from './sockets/index.js';
import { sendFailure } from './src/helper/utils.js';

const app = express();
const server = http.createServer(app);

// ==========================
// Security Middleware
// ==========================
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ==========================
// Request Parsing
// ==========================
// Raw body needed for Stripe webhook before JSON parsing
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ==========================
// Logging
// ==========================
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ==========================
// Rate Limiting
// ==========================
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});

app.use('/api', globalLimiter);
app.use('/api/session/login', authLimiter);
app.use('/api/session/register', authLimiter);

// ==========================
// Routes
// ==========================
app.use('/api', router);

// Health check
app.get('/', (req, res) => res.json({ success: true, message: 'Chat Platform API Running', version: '1.0.0' }));

// 404 handler
app.use((req, res) => {
  sendFailure(res, 'Route not found', 404);
});

// Global error handler
app.use(errorHandler);

// ==========================
// Socket.io
// ==========================
const io = initSocketServer(server);
app.set('io', io);

// ==========================
// Start server
// ==========================
const start = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
