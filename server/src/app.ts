import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import projectRoutes from './routes/projectRoutes';
import bookmarkRoutes from './routes/bookmarkRoutes';
import historyRoutes from './routes/historyRoutes';
import chartRoutes from './routes/chartRoutes';
import { handleErrors } from './middleware/errorHandler';
import helmet from 'helmet';
import { setRequestTimeout } from './middleware/timeout';
dotenv.config();

const app = express();

// security headers using helmet
app.use(helmet());

// setiing equest timeout to 30 seconds
app.use(setRequestTimeout(30));

// rate limiting
const rateLimit = require('express-rate-limit');
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
}));

app.use(express.json({ limit: '10kb' }));

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true 
}));

app.use(express.json());

// all server routes
app.use('/api/projects', projectRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/charts', chartRoutes);
app.use(handleErrors);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;