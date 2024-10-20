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

const storage = new Storage({
    projectId: 'your-project-id',
    keyFilename: path.join(__dirname, './config/serviceAccountKey.json')
});



const bucket = storage.bucket('pmis-47493.appspot.com'); // Replace with your bucket name


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes

const usersCollection = db.collection('users');
const JWT_SECRET = 'your_jwt_secret'; // Replace with a strong secret key

// Endpoint to handle user registration
// Endpoint to handle user registration
app.post('/register', upload.single('photoFile'), async (req, res) => {
    const formData = req.body;
    const photoFile = req.file;

    try {
        let photoURL = '';
        if (photoFile) {
            const fileExtension = photoFile.originalname.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
            const fileRef = bucket.file(`profile_photos/${fileName}`);
            await fileRef.save(photoFile.buffer, {
                metadata: { contentType: photoFile.mimetype },
            });
            photoURL = `https://storage.googleapis.com/${bucket.name}/profile_photos/${fileName}`;
        }

        // Check if company exists and update or create accordingly
        const companyRef = db.collection('companies').doc(formData.company);
        const companyDoc = await companyRef.get();

        if (companyDoc.exists) {
            // Company exists, increment user count
            await companyRef.update({
                userCount: admin.firestore.FieldValue.increment(1)
            });
        } else {
            // Company doesn't exist, create new company document
            await companyRef.set({
                name: formData.company,
                userCount: 1
            });
        }

        // Store additional user info in Firestore
        await db.collection('users').add({
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            salutation: formData.salutation,
            photoURL: photoURL,
            company: formData.company,
            teams: JSON.parse(formData.teams), // Parse teams array from JSON string
            userType: 'Normal',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(201).send('User registered successfully');
    } catch (error) {
        console.error("Error during sign up:", error);
        res.status(500).send(`Error during sign up: ${error.message}`);
    }
});
// Login endpoint
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Find user by email
    const userQuery = await usersCollection.where('email', '==', email).get();
    if (userQuery.empty) {
        return res.status(401).send('Invalid credentials');
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    const isPasswordValid = await bcrypt.compare(password, userData.password);
    if (!isPasswordValid) {
        return res.status(401).send('Invalid credentials');
    }
    console.log(userData)

    // Generate JWT with accessRights

    const token = jwt.sign({ email, accessRights: userData.accessRights, enrolledPrograms: userData?.enrolledPrograms, company: userData.company, firstName: userData?.firstName, photo: userData?.photoURL }, JWT_SECRET, { expiresIn: '24h' });
    res.send({ token });
});



const simulateBerthTestData = async () => {
    const facilityListCollectionRef = db.collection('facilityList');

    // Check if the "facilityList" collection already has documents
    const facilityListSnapshot = await facilityListCollectionRef.get();
    if (!facilityListSnapshot.empty) {
        console.log("FacilityList data already exists, skipping simulation.");
        return; // Exit the function if the collection is not empty
    }

    // Define the berths and the date range
    const berths = [
        {
            name: "B1",
            lengthCapacity: 300, // in meters
            depthCapacity: 15, // in meters
            beamCapacity: 45, // in meters
            displacementCapacity: 150000, // in tons
            cargoType: "Container",
            bookedPeriod: new Map([
                [
                    "period1",
                    [new Date("2024-10-08T10:00:00").toISOString(), new Date("2024-10-08T12:00:00").toISOString()],
                ],
                [
                    "period2",
                    [new Date("2024-11-01T10:00:00").toISOString(), new Date("2024-11-03T12:00:00").toISOString()],
                ],
            ]),
        },
        {
            name: "B2",
            lengthCapacity: 400, // in meters
            depthCapacity: 20, // in meters
            beamCapacity: 50, // in meters
            displacementCapacity: 200000, // in tons
            cargoType: "Bulk",
            bookedPeriod: new Map([]),
        },
    ];

    // Convert the bookedPeriod Map to an object for Firebase
    berths.forEach((berth) => {
        berth.bookedPeriod = Object.fromEntries(berth.bookedPeriod);
    });

    // Add the berths to the facilityList collection
    for (const berth of berths) {
        const docRefList = facilityListCollectionRef.doc(berth.name);
        try {
            await docRefList.set(berth);
            console.log(`Berth ${berth.name} data added successfully.`);
        } catch (error) {
            console.error(`Error adding berth ${berth.name} data:`, error);
        }
    }

    console.log("FacilityList data simulation completed.");
};

// Endpoint to trigger the data simulation
app.post('/simulate-berth-test-data', async (req, res) => {
    try {
        await simulateBerthTestData();
        res.status(200).send('FacilityList data simulation completed.');
    } catch (error) {
        console.error('Error simulating FacilityList data:', error);
        res.status(500).send('Error simulating FacilityList data.');
    }
});





const simulateManpowerTestData = async () => {
    const workSchedulesRef = db.collection("denzel_work_schedule");

    const workScheduleSnapShot = await workSchedulesRef.get();
    if (!workScheduleSnapShot.empty) {
        console.log("denzel_work_schedule data already exists, skipping simulation.");
        return; // Exit the function if the collection is not empty
    }

    // Define the time periods and dates
    const timePeriods = ["00:00-08:00", "08:00-16:00", "16:00-24:00"];
    const startDate = new Date("2024-10-21").toISOString();
    const endDate = new Date("2024-10-25").toISOString();

    try {
        // Loop over time periods and create documents
        for (let i = 0; i < timePeriods.length; i++) {
            const teamData = generateTeamData(timePeriods[i], startDate, endDate);
            const docRef = workSchedulesRef.doc(`${timePeriods[i]}^${startDate}^${endDate}`);
            await docRef.set(teamData);
            console.log(`Document created for time period: ${timePeriods[i]}`);
        }

        console.log("All documents have been successfully created.");
    } catch (error) {
        console.error("Error creating documents:", error);
    }
};

const simulateAssetTestData = async () => {
    const assetsRef = db.collection("denzel_assets");

    // Check if any documents already exist in the collection
    const assetSnapShot = await assetsRef.get();
    if (!assetSnapShot.empty) {
        console.log("denzel_assets data already exists, skipping simulation.");
        return; // Exit the function if the collection is not empty
    }

    try {
        // Define assets for each category
        const assets = [
            // 2 Cranes
            generateAssetData("Ship-to-shore cranes", "Crane Alpha", "High-capacity ship-to-shore crane", { type: "Point", coordinates: [103.8525, 1.2903] }, "Acquired", "Available", null, 10),
            generateAssetData("Ship-to-shore cranes", "Crane Beta", "Heavy-duty ship-to-shore crane", { type: "Point", coordinates: [103.8526, 1.2904] }, "Acquired", "Available", null, 10),

            // 2 Trucks
            generateAssetData("Trucks and trailers", "Truck Alpha", "All-purpose container truck", { type: "Point", coordinates: [103.8530, 1.2910] }, "Acquired", "Available", null, 15),
            generateAssetData("Trucks and trailers", "Truck Beta", "Heavy-duty container truck", { type: "Point", coordinates: [103.8531, 1.2911] }, "Acquired", "Available", null, 15),

            // 8 Reach Stackers
            generateAssetData("Reach stackers", "Stacker Alpha", "High-performance reach stacker", { type: "Point", coordinates: [103.8535, 1.2920] }, "Acquired", "Available", null, 5),
            generateAssetData("Reach stackers", "Stacker Beta", "Compact reach stacker for small areas", { type: "Point", coordinates: [103.8536, 1.2921] }, "Acquired", "Available", null, 5),
            generateAssetData("Reach stackers", "Stacker Gamma", "High-efficiency reach stacker", { type: "Point", coordinates: [103.8537, 1.2922] }, "Acquired", "Available", null, 5),
            generateAssetData("Reach stackers", "Stacker Delta", "Heavy-duty reach stacker", { type: "Point", coordinates: [103.8538, 1.2923] }, "Acquired", "Available", null, 5),
            generateAssetData("Reach stackers", "Stacker Epsilon", "High-reach stacker for large containers", { type: "Point", coordinates: [103.8539, 1.2924] }, "Acquired", "Available", null, 5),
            generateAssetData("Reach stackers", "Stacker Foxtrot", "Reach stacker for dense storage areas", { type: "Point", coordinates: [103.8540, 1.2925] }, "Acquired", "Available", null, 5),
            generateAssetData("Reach stackers", "Stacker Hotel", "Heavy-duty reach stacker for oversized containers", { type: "Point", coordinates: [103.8542, 1.2927] }, "Acquired", "Available", null, 5),
            generateAssetData("Reach stackers", "Stacker India", "Heavy-duty reach stacker for oversized containers", { type: "Point", coordinates: [103.8545, 1.2926] }, "Acquired", "Available", null, 5)
        ];

        // Persist assets into Firestore
        for (const asset of assets) {
            const docRef = assetsRef.doc(asset.id);
            await docRef.set(asset);
            console.log(`Asset ${asset.name} created and persisted.`);
        }

        console.log("All assets have been successfully created.");
    } catch (error) {
        console.error("Error creating assets:", error);
    }
};

// Endpoint to trigger the manpower data simulation
app.post('/simulate-manpower-test-data', async (req, res) => {
    try {
        await simulateManpowerTestData();
        res.status(200).send('Manpower data simulation completed.');
    } catch (error) {
        console.error('Error simulating manpower data:', error);
        res.status(500).send('Error simulating manpower data.');
    }
});

// Endpoint to trigger the asset data simulation
app.post('/simulate-asset-test-data', async (req, res) => {
    try {
        await simulateAssetTestData();
        res.status(200).send('Asset data simulation completed.');
    } catch (error) {
        console.error('Error simulating asset data:', error);
        res.status(500).send('Error simulating asset data.');
    }
});


// Endpoint to fetch vessel visits
app.get('/vessel-visits', async (req, res) => {
    try {
        const querySnapshot = await db.collection('vesselVisitRequests').get();
        const visitsArray = querySnapshot.docs.map((doc) => ({
            documentId: doc.id,
            ...doc.data(),
        }));
        res.status(200).json(visitsArray);
    } catch (error) {
        console.error('Error fetching vessel visits:', error);
        res.status(500).send('Error fetching vessel visits.');
    }
});


// Endpoint to fetch user profile
app.get('/user-profile/:uid', async (req, res) => {
    const { uid } = req.params;
    console.log("user id", uid)
    try {

        const userQuery = await usersCollection.where('email', '==', uid).get();
        if (userQuery.empty) {
            return res.status(404).send('User not found');
        }

        const userDoc = userQuery.docs[0];
        res.status(200).json(userDoc.data());
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).send('Error fetching user profile.');
    }
});


// Endpoint to geat user profile

app.get('/cargo-manifests', async (req, res) => {
    try {
        const manifestsRef = db.collection('cargo_manifests');
        const snapshot = await manifestsRef.get();
        const manifests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(manifests);
    } catch (error) {
        console.error('Error fetching cargo manifests:', error);
        res.status(500).send('Error fetching cargo manifests.');
    }
});


// Endpoint to submit a new cargo manifest
app.post('/cargo-manifests', async (req, res) => {
    try {
        const manifestData = req.body;
        const manifestsRef = db.collection('cargo_manifests');
        const docRef = await manifestsRef.add(manifestData);
        res.status(201).json({ id: docRef.id });
    } catch (error) {
        console.error('Error submitting cargo manifest:', error);
        res.status(500).send('Error submitting cargo manifest.');
    }
});

// Endpoint to update an existing cargo manifest
app.put('/cargo-manifests/:id', async (req, res) => {
    const { id } = req.params;
    const manifestData = req.body;
    try {
        const manifestRef = db.collection('cargo_manifests').doc(id);
        await manifestRef.update(manifestData);
        res.status(200).send('Cargo manifest updated successfully.');
    } catch (error) {
        console.error('Error updating cargo manifest:', error);
        res.status(500).send('Error updating cargo manifest.');
    }
});


// Endpoint to delete a cargo manifest
app.delete('/cargo-manifests/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const manifestRef = db.collection('cargo_manifests').doc(id);
        await manifestRef.delete();
        res.status(200).send('Cargo manifest deleted successfully.');
    } catch (error) {
        console.error('Error deleting cargo manifest:', error);
        res.status(500).send('Error deleting cargo manifest.');
    }
});

// Endpoint to fetch operator requisitions for a specific user
app.get('/operator-requisitions/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const q = db.collection('operator_requisitions')
            .where('email', '==', userId)
        const querySnapshot = await q.get();
        const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching operator requisitions:', error);
        res.status(500).send('Error fetching operator requisitions.');
    }
});


// Endpoint to create a new operator requisition
app.post('/operator-requisitions', async (req, res) => {
    try {
        const requisitionData = req.body;
        console.log("Body is ")
        console.log(requisitionData)
        const docRef = await db.collection('operator_requisitions').add({
            ...requisitionData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'Pending'
        });
        res.status(201).json({ id: docRef.id });
    } catch (error) {
        console.error('Error creating operator requisition:', error);
        res.status(500).send('Error creating operator requisition.');
    }
});

// Endpoint to update an existing operator requisition
app.put('/operator-requisitions/:id', async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    try {
        const requisitionRef = db.collection('operator_requisitions').doc(id);
        await requisitionRef.update(updateData);
        res.status(200).send('Operator requisition updated successfully.');
    } catch (error) {
        console.error('Error updating operator requisition:', error);
        res.status(500).send('Error updating operator requisition.');
    }
});

// Endpoint to delete an operator requisition
app.delete('/operator-requisitions/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const requisitionRef = db.collection('operator_requisitions').doc(id);
        await requisitionRef.delete();
        res.status(200).send('Operator requisition deleted successfully.');
    } catch (error) {
        console.error('Error deleting operator requisition:', error);
        res.status(500).send('Error deleting operator requisition.');
    }
});

// Endpoint to check facility availability
app.post('/check-facility-availability', async (req, res) => {
    const vesselVisitRequest = req.body;
    const { imoNumber, loa, draft, cargoType, eta, etd } = vesselVisitRequest;

    // Convert eta and etd to Date objects
    const etaDate = new Date(eta);
    const etdDate = new Date(etd);

    // Helper function to check if assets are available during a time range
    function isBerthAvailable(facility, eta, etd) {
        for (const [key, period] of Object.entries(facility.bookedPeriod)) {
            const [bookedEta, bookedEtd] = period.map(date => new Date(date));
            // If the asset's booked period overlaps with the requested period, it's unavailable
            if (
                !(
                    etd <= bookedEta ||
                    eta >= bookedEtd
                )
            ) {
                console.log(
                    "Berth " +
                    facility.name +
                    " is not available because it has been reserved"
                );
                return false;
            }
        }
        return true;
    }

    try {
        // Step 1: Check the facilityList to find berths that match the vessel's LOA, draft, and cargoType
        const facilityListCollectionRef = db.collection("portConfigurations");
        const facilityListQuery = facilityListCollectionRef.where("type", "==", "berth");
        const facilityListSnapshot = await facilityListQuery.get();
        const matchedBerths = [];

        facilityListSnapshot.forEach((doc) => {
            const berth = doc.data();

            // Check if LOA, draft, and cargoType match
            if (
                loa <= berth.lengthCapacity &&
                draft <= berth.depthCapacity &&
                cargoType === berth.cargoType
            ) {
                matchedBerths.push(berth); // Store the matched berth
                console.log("Berth " + berth.name + " added to matchedBerths");
            }
        });

        if (matchedBerths.length === 0) {
            console.log("No berths match the vessel's requirements.");
            return res.status(200).json({
                success: false,
                assignedBerth: "",
                adjustedEta: eta,
                adjustedEtd: etd,
            });
        }

        // Step 2: Loop through each matched berth and check whether it is available during the required hours
        for (const berth of matchedBerths) {
            if (isBerthAvailable(berth, etaDate, etdDate)) {
                console.log(
                    `Berth ${berth.name} is available for the entire time range.`
                );
            } else {
                const index = matchedBerths.findIndex((obj) => obj === berth);
                matchedBerths.splice(index, 1);
                console.log(`Berth ${berth.name} is removed from matchedBerths`);
            }
        }

        // If no berth is fully available for the entire time range, adjust ETA/ETD
        if (matchedBerths.length === 0) {
            console.log("No berth is available for the entire time range.");

            // Adjust ETA and ETD by 15 minutes
            let etaAdjustedDate = new Date(etaDate);
            let etdAdjustedDate = new Date(etdDate);
            etaAdjustedDate.setMinutes(etaAdjustedDate.getMinutes() + 15);
            etdAdjustedDate.setMinutes(etdAdjustedDate.getMinutes() + 15);

            console.log(
                `Adjusting ETA and ETD by 15 minutes: New ETA: ${etaAdjustedDate}, New ETD: ${etdAdjustedDate}`
            );

            // Create a new vesselVisitRequest with the adjusted ETA and ETD
            let vesselVisitRequestX = {
                imoNumber,
                loa,
                draft,
                cargoType,
                eta: etaAdjustedDate.toISOString(),
                etd: etdAdjustedDate.toISOString(),
            };

            // Recursively call checkFacilityAvailability with adjusted times
            return checkFacilityAvailability(vesselVisitRequestX);
        } else {
            // If a berth is available, return success with berth name and original ETA/ETD
            let assignedBerth = matchedBerths.pop();
            console.log(
                "The berth that has been assigned to the vessel is " +
                assignedBerth.name
            );
            // Update the assignedBerth's bookedPeriod map. key: vessel's IMO number value: [eta, etd]
            assignedBerth.bookedPeriod[imoNumber] = [etaDate.toISOString(), etdDate.toISOString()];
            // Set the document in Firestore
            const toBeUpdatedDocRef = db.collection("portConfigurations").doc(assignedBerth.name);
            await toBeUpdatedDocRef.set(assignedBerth)
                .then(() => {
                    console.log("Document successfully replaced");
                })
                .catch((error) => {
                    console.error("Error replacing document: ", error);
                });
            return res.status(200).json({
                success: true,
                assignedBerth: assignedBerth.name,
                adjustedEta: eta,
                adjustedEtd: etd,
            });
        }
    } catch (error) {
        console.error("Error checking facility availability:", error);
        return res.status(500).json({
            success: false,
            assignedBerth: "",
            adjustedEta: eta,
            adjustedEtd: etd,
        });
    }
});

app.get('/inquiries-feedback/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const q = db.collection('inquiries_feedback').where('email', '==', userId);
        const querySnapshot = await q.get();
        const results = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt.toDate() // Convert Firestore Timestamp to JavaScript Date
            };
        });
        console.log(results)
        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching inquiries and feedback:', error);
        res.status(500).send('Error fetching inquiries and feedback.');
    }
});

// Endpoint to update inquiry or feedback
app.put('/inquiries-feedback/:incrementalId', upload.single('file'), async (req, res) => {
    const { incrementalId } = req.params;

    const data = req.body;
    try {
        const inquiriesRef = db.collection('inquiries_feedback');
        const querySnapshot = await inquiriesRef.get();
        let docId = null;

        querySnapshot.forEach((doc) => {
            const inquiryData = doc.data();
            if (inquiryData.incrementalId.toString() === incrementalId) {
                docId = doc.id;
            }
        });

        if (!docId) {
            console.log("NO ")
            return res.status(404).send(`No inquiry/feedback found with incremental ID: ${incrementalId}`);
        }

        // Process file upload if there is a new file
        let fileURL = data.fileURL || null;
        if (req.file) {
            try {
                const fileExtension = req.file.originalname.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
                const fileRef = bucket.file(`inquiries_feedback/${fileName}`);
                await fileRef.save(req.file.buffer, {
                    metadata: { contentType: req.file.mimetype },
                });
                fileURL = `https://storage.googleapis.com/${bucket.name}/inquiries_feedback/${fileName}`;
            } catch (uploadError) {
                console.error('Error uploading file:', uploadError);
                return res.status(500).send('Failed to upload file: ' + uploadError.message);
            }
        }

        const { file, ...dataWithoutFile } = data;
        const updateData = {
            ...dataWithoutFile,
            fileURL: fileURL,
        };

        const docRef = db.collection('inquiries_feedback').doc(docId);
        await docRef.update(updateData);

        res.status(200).send('Inquiry/feedback updated successfully');
    } catch (error) {
        console.error('Error updating inquiry/feedback:', error);
        res.status(500).send('Error updating inquiry/feedback');
    }
});



// Endpoint to create a new inquiry or feedback with auto-incrementing ID
app.post('/inquiries-feedback', upload.single('file'), async (req, res) => {
    const data = req.body;
    const { email } = data;

    if (!email) {
        return res.status(400).send('email is required');
    }

    try {
        let fileURL = null;

        // Process file upload if a file exists
        if (req.file) {
            try {
                const fileExtension = req.file.originalname.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
                const fileRef = bucket.file(`inquiries_feedback/${fileName}`);
                await fileRef.save(req.file.buffer, {
                    metadata: { contentType: req.file.mimetype },
                });
                fileURL = `https://storage.googleapis.com/${bucket.name}/inquiries_feedback/${fileName}`;
            } catch (uploadError) {
                console.error('Error uploading file:', uploadError);
                return res.status(500).send('Failed to upload file: ' + uploadError.message);
            }
        }

        const { file, ...dataWithoutFile } = data;
        const inquiriesRef = db.collection('inquiries_feedback');
        const snapshot = await inquiriesRef.get();
        const newIncrementalId = snapshot.size + 1;

        const docData = {
            ...dataWithoutFile,
            incrementalId: newIncrementalId,
            userId: email,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'Pending',
            fileURL: fileURL,
        };

        console.log('Final document data:', docData);

        const docRef = await inquiriesRef.add(docData);
        res.status(201).json({ id: docRef.id });
    } catch (error) {
        console.error('Error in createInquiryFeedback:', error);
        res.status(500).send('Error creating inquiry/feedback');
    }
});

// Endpoint to fetch user profile by email
app.get('/user-profile', async (req, res) => {
    const { email } = req.query;
    if (!email) {
        return res.status(400).send('Email is required');
    }

    try {
        // Find user by email
        const userQuery = await db.collection('users').where('email', '==', email).get();
        if (userQuery.empty) {
            return res.status(404).send('User not found');
        }

        const userDoc = userQuery.docs[0];
        const userData = userDoc.data();
        console.log(userData)

        res.status(200).json(userData);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).send('Error fetching user profile');
    }
});

// Endpoint to handle profile update
app.put('/update-profile', upload.single('photoFile'), async (req, res) => {
    const { email, salutation, firstName, lastName, company, userType } = req.body;
    const photoFile = req.file;

    if (!email) {
        return res.status(400).send('Email is required');
    }

    try {
        let photoURL = req.body.photoURL;

        // Find user by email
        const userQuery = await db.collection('users').where('email', '==', email).get();
        if (userQuery.empty) {
            return res.status(404).send('User not found');
        }

        const userDoc = userQuery.docs[0];
        const userId = userDoc.id;

        if (photoFile) {

            const fileExtension = photoFile.originalname.split('.').pop();
            const currentDateTime = new Date().toISOString().replace(/[:.]/g, '-'); // Get current date and time, replace colons and dots with hyphens
            const fileName = `${currentDateTime}.${fileExtension}`; // Use the current date and time for the file name

            const fileRef = bucket.file(`profile_photos/${fileName}`);
            await fileRef.save(photoFile.buffer, {
                metadata: { contentType: photoFile.mimetype },
            });
            photoURL = `https://storage.googleapis.com/${bucket.name}/profile_photos/${fileName}`;
            await fileRef.makePublic();
            []
        }


        const fullName = `${salutation} ${firstName} ${lastName}`.trim();
        const updatedProfile = {
            displayName: fullName,
            photoURL: photoURL,
        };

        
        // Update Firestore document
        const userDocRef = db.collection('users').doc(userId);
        await userDocRef.update({
            salutation: salutation,
            firstName: firstName,
            lastName: lastName,
            displayName: fullName,
            photoURL: photoURL,
            company: company,
            userType: userType,
        });

        res.status(200).send('Profile updated successfully');
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).send('Failed to update profile: ' + error.message);
    }
});

// Endpoint to fetch training programs
app.get('/training-programs', async (req, res) => {
    try {
        const programsRef = db.collection('training_programs');
        const programsSnapshot = await programsRef.get();
        const programs = programsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                startDate: data.startDate ? data.startDate.toDate() : null, // Convert Firestore Timestamp to JavaScript Date
                endDate: data.endDate ? data.endDate.toDate() : null // Convert Firestore Timestamp to JavaScript Date
            };
        });
        res.status(200).json(programs);
    } catch (error) {
        console.error('Error fetching training programs:', error);
        res.status(500).send('Error fetching training programs.');
    }
});


// Endpoint to fetch users and invitations for a company
app.get('/users', async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).send('email is required');
    }

    try {

        const userQuery = await usersCollection.where('email', '==', email).get();
        if (userQuery.empty) {
            return res.status(404).send('not found');
        }

        const userDoc = userQuery.docs[0];
        const currentUserData = userDoc.data();

        if (!currentUserData || !currentUserData.company) {
            return res.status(404).send('User company information not found');
        }

        const usersQuery = db.collection('users').where('company', '==', currentUserData.company);
        const usersSnapshot = await usersQuery.get();
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), status: 'Active' }));

        const invitationsQuery = db.collection('invitations')
            .where('company', '==', currentUserData.company)
            .where('status', 'in', ['Pending', 'Approved', 'Rejected']);
        const invitationsSnapshot = await invitationsQuery.get();
        const invitationUsers = invitationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            status: doc.data().status === 'Rejected' ? 'Rejected' : doc.data().status === 'Approved' ? 'Approved' : 'Pending',
        }));

        res.status(200).json([...users, ...invitationUsers]);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Error fetching users');
    }
});

// Endpoint to fetch all users in a company
app.get('/all-users-in-company', async (req, res) => {
    const { email } = req.query;
    if (!email) {
        return res.status(400).send('email is required');
    }

    try {

        const userQuery = await usersCollection.where('email', '==', email).get();
        if (userQuery.empty) {
            return res.status(404).send('not found');
        }

        const userDoc = userQuery.docs[0];
        const currentUserData = userDoc.data();

        if (!currentUserData || !currentUserData.company) {
            return res.status(404).send('User company information not found');
        }

        const usersQuery = db.collection('users').where('company', '==', currentUserData.company);
        const usersSnapshot = await usersQuery.get();
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users in company:', error);
        res.status(500).send('Error fetching users in company');
    }
});


// Endpoint to delete a user
app.delete('/users', async (req, res) => {
    const { email } = req.query;
    if (!email) {

        return res.status(400).send('Email is required');
    }

    try {
        const usersRef = db.collection('users');
        const querySnapshot = await usersRef.where('email', '==', email).get();

        if (querySnapshot.empty) {
            return res.status(404).send('User not found');
        }

        const userDoc = querySnapshot.docs[0];
        await userDoc.ref.delete();

        res.status(200).send('User deleted successfully');
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send('Error deleting user');
    }
});
// Endpoint to delete the current user's account
app.delete('/user-account', async (req, res) => {
    const email = req.headers['x-user-email'];


    if (!email) {

        return res.status(401).send('No authenticated user');
    }
    console.log(email)

    try {
        const usersRef = db.collection('users');
        const querySnapshot = await usersRef.where('email', '==', email).get();
        const userDoc = querySnapshot.docs[0];
        await userDoc.ref.delete();
        res.status(200).send('User account deleted successfully');
    } catch (error) {
        console.error('Error deleting user account:', error);
        res.status(500).send('Error deleting user account');
    }
});

// Endpoint to invite a user
app.post('/invitations', async (req, res) => {
    const userData = req.body;
    console.log("inviting")
    try {
        const invitationRef = await db.collection('invitations').add({
            ...userData,
            userType: 'Normal',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'Pending'
        });
        res.status(201).json({ id: invitationRef.id });
    } catch (error) {
        console.error('Error inviting user:', error);
        res.status(500).send('Error inviting user');
    }
});

// Endpoint to cancel an invitation
app.delete('/invitations/:invitationId', async (req, res) => {
    const { invitationId } = req.params;
    try {
        await db.collection('invitations').doc(invitationId).delete();
        res.status(200).send('Invitation canceled successfully');
    } catch (error) {
        console.error('Error canceling invitation:', error);
        res.status(500).send('Error canceling invitation');
    }
});


// Endpoint to fetch company data
app.get('/company-data', async (req, res) => {
    const { companyName } = req.query; // Assuming companyName is passed as a query parameter
    console.log("Attempting to.")
    console.log("HEY")
    if (!companyName) {
        return res.status(400).send('Company name is required');
    }

    try {
        const companyRef = db.collection('companies').doc(companyName);
        const companyDoc = await companyRef.get();

        if (!companyDoc.exists) {
            return res.status(404).send('Company not found');
        }

        const companyData = companyDoc.data();
        res.status(200).json({ ...companyData, name: companyName });
    } catch (error) {
        console.error('Error fetching company data:', error);
        res.status(500).send('Error fetching company data');
    }
});


// Endpoint to update company info
app.put('/company-data/:companyName', async (req, res) => {
    const { companyName } = req.params;
    const data = req.body;

    if (!companyName) {
        return res.status(400).send('Company name is required');
    }

    try {
        const companyRef = db.collection('companies').doc(companyName);
        await companyRef.update(data);
        res.status(200).send('Company information updated successfully');
    } catch (error) {
        console.error('Error updating company info:', error);
        res.status(500).send(`Failed to update company information: ${error.message}`);
    }
});


app.listen(3001, () => {
    console.log('Server is running on port 3001');
});

