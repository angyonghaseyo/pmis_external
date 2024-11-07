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
const userRoutes = require('./routes/userRoutes');
const vesselRoutes = require('./routes/vesselRoutes');
const cargoRoutes = require('./routes/cargoRoutes');
const operatorRoutes = require('./routes/operatorRoutes');
const facilityRoutes = require('./routes/facilityRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');
const trainingRoutes = require('./routes/trainingRoutes');
const companyRoutes = require('./routes/companyRoutes');
const adHocResourceRequestRoutes = require('./routes/adHocResourceRequestRoutes');
const containerMenuRoutes = require('./routes/containerMenuRoutes');

require('./config/firebase');

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


app.listen(5001, () => {
    console.log('Server is running on port 5001');
});

