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


app.listen(5001, () => {
    console.log('Server is running on port 5001');
});

