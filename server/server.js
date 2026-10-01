const path = require('path');
const dotenv = require('dotenv');

// Load environment variables (.env.local first, fallback to .env)
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = require('./app');
const connectDB = require('./config/db');

// Connect Database
connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle server listen errors such as port collision (EADDRINUSE)
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`[Server Error] Port ${PORT} is already in use. Retrying or terminate the existing process.`);
        process.exit(1);
    } else {
        console.error('[Server Error]', err);
    }
});

// Graceful shutdown to free port on nodemon restart or termination
const gracefulShutdown = () => {
    server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Catch unhandled errors without crashing nodemon
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

