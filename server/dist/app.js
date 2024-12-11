"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const bookmarkRoutes_1 = __importDefault(require("./routes/bookmarkRoutes"));
const historyRoutes_1 = __importDefault(require("./routes/historyRoutes"));
const chartRoutes_1 = __importDefault(require("./routes/chartRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
const helmet_1 = __importDefault(require("helmet"));
const timeout_1 = require("./middleware/timeout");
dotenv_1.default.config();
const app = (0, express_1.default)();
// security headers using helmet
app.use((0, helmet_1.default)());
// setiing equest timeout to 30 seconds
app.use((0, timeout_1.setRequestTimeout)(30));
// rate limiting
const rateLimit = require('express-rate-limit');
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
}));
app.use(express_1.default.json({ limit: '10kb' }));
app.use((0, cors_1.default)({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express_1.default.json());
// all server routes
app.use('/api/projects', projectRoutes_1.default);
app.use('/api/bookmarks', bookmarkRoutes_1.default);
app.use('/api/history', historyRoutes_1.default);
app.use('/api/charts', chartRoutes_1.default);
app.use(errorHandler_1.handleErrors);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
exports.default = app;
