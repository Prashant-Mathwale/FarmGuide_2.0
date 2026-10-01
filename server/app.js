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

module.exports = app;
