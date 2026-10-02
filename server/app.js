const express = require('express');
const cors = require('cors');

const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/community', express.static(path.join(__dirname, 'uploads/community')));

// Default Route
app.get('/', (req, res) => {
    res.send('FarmGuide API Runnning...');
});

// Define Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/meta', require('./routes/metaRoutes'));
app.use('/api/ml', require('./routes/mlRoutes'));
app.use('/api/market', require('./routes/marketRoutes'));
app.use('/api/weather', require('./routes/weatherRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/community', require('./routes/communityRoutes'));
app.use('/api/schemes', require('./routes/schemeRoutes'));

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

