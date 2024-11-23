const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccountKey.json');
const cors = require('cors');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const multer = require('multer');
const { captureRejectionSymbol } = require('events');
const upload = multer({ storage: multer.memoryStorage() });
const userRoutes = require('./src/routes/userRoutes');
const vesselRoutes = require('./src/routes/vesselRoutes');
const cargoRoutes = require('./src/routes/cargoRoutes');
const operatorRoutes = require('./src/routes/operatorRoutes');
const facilityRoutes = require('./src/routes/facilityRoutes');
const inquiryRoutes = require('./src/routes/inquiryRoutes');
const trainingRoutes = require('./src/routes/trainingRoutes');
const companyRoutes = require('./src/routes/companyRoutes');
const adHocResourceRequestRoutes = require('./src/routes/adHocResourceRequestRoutes');
const containerMenuRoutes = require('./src/routes/containerMenuRoutes');
const financeRoutes = require('./src/routes/financeRoutes')
const containerPricingRoutes = require('./src/routes/containerPricingRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const containerRequestRoutes = require('./src/routes/containerRequestRoutes');
const agencyRoutes = require('./src/routes/agencyRoutes');
const cargoSamplingRoutes = require('./src/routes/cargoSamplingRoutes');
const cargoRepackingRoutes = require('./src/routes/cargoRepackingRoutes');
require('./src/config/firebase');

const storage = new Storage({
    projectId: 'your-project-id',
    keyFilename: path.join(__dirname, './config/serviceAccountKey.json')
});


const bucket = storage.bucket('pmis-47493.appspot.com');
const app = express();

app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes

const JWT_SECRET = 'your_jwt_secret';

app.use('/', userRoutes);
app.use('/', vesselRoutes);
app.use('/', cargoRoutes);
app.use('/', operatorRoutes);
app.use('/', facilityRoutes);
app.use('/', inquiryRoutes);
app.use('/', trainingRoutes);
app.use('/', companyRoutes);
app.use('/', adHocResourceRequestRoutes);
app.use('/', containerMenuRoutes);
app.use('/', containerPricingRoutes);
app.use('/', financeRoutes);
app.use('/', bookingRoutes);
app.use('/', containerRequestRoutes);
app.use('/', agencyRoutes);
app.use('/', cargoSamplingRoutes);
app.use('/', cargoRepackingRoutes);

const PORT = process.env.PORT || 5001;










app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

