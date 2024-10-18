const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authMiddleware = require('./middleware/auth');
const errorHandler = require('./utils/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const inquiryFeedbackRoutes = require('./routes/inquiryFeedback');
const operatorRequisitionRoutes = require('./routes/operatorRequisition');
const trainingProgramRoutes = require('./routes/trainingProgram');
const cargoManifestRoutes = require('./routes/cargoManifest');
const vesselVisitRoutes = require('./routes/vesselVisit');
const companyRoutes = require('./routes/company');

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, usersRoutes);
app.use('/api/inquiry-feedback', authMiddleware, inquiryFeedbackRoutes);
app.use('/api/operator-requisition', authMiddleware, operatorRequisitionRoutes);
app.use('/api/training-program', authMiddleware, trainingProgramRoutes);
app.use('/api/cargo-manifest', authMiddleware, cargoManifestRoutes);
app.use('/api/vessel-visit', authMiddleware, vesselVisitRoutes);
app.use('/api/company', authMiddleware, companyRoutes);

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;