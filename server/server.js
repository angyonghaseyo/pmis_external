const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const companyInfoRoutes = require('./routes/companyInfoRoutes');
const inquiryFeedbackRoutes = require('./routes/inquiryFeedbackRoutes');
const operatorRequisitionRoutes = require('./routes/operatorRequisitionRoutes');
const trainingProgramRoutes = require('./routes/trainingProgramRoutes');
const vesselVisitRoutes = require('./routes/vesselVisitRoutes');
const cargoManifestRoutes = require('./routes/cargoManifestRoutes');

// Import middleware
const errorMiddleware = require('./middleware/errorMiddleware');
const authMiddleware = require('./middleware/authMiddleware');

// Create Express app
const app = express();

// Set up middleware
app.use(helmet()); // Helps secure your app by setting various HTTP headers
app.use(cors()); // Enable CORS for all routes
app.use(morgan('dev')); // HTTP request logger
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Set up routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/company-info', authMiddleware, companyInfoRoutes);
app.use('/api/inquiries-feedback', authMiddleware, inquiryFeedbackRoutes);
app.use('/api/operator-requisitions', authMiddleware, operatorRequisitionRoutes);
app.use('/api/training-programs', authMiddleware, trainingProgramRoutes);
app.use('/api/vessel-visits', authMiddleware, vesselVisitRoutes);
app.use('/api/cargo-manifests', authMiddleware, cargoManifestRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Catch-all route for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handling middleware
app.use(errorMiddleware);

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

module.exports = app; // For testing purposes