const app = require('./app');
const connectDB = require('./config/db');

// Connect to Database for Serverless environment
connectDB();

module.exports = app;
