const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Default Route
app.get('/', (req, res) => {
    res.send('FarmGuide API Runnning...');
});

// Define Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/ml', require('./routes/mlRoutes'));
app.use('/api/market', require('./routes/marketRoutes'));
app.use('/api/weather', require('./routes/weatherRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));

// 404 Route Handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[Unhandled Request Error]:', err.stack || err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

module.exports = app;

