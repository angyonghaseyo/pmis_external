const { db } = require('../config/firebaseAdmin');
const { collection, getDocs, setDoc, doc } = require('firebase-admin/firestore');

// Function to simulate adding test data to Firestore
async function simulateBerthTestData() {
  const facilityListCollectionRef = collection(db, "facilityList");

  // Check if the "facilityList" collection already has documents
  const facilityListSnapshot = await getDocs(facilityListCollectionRef);
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
      bookedPeriod: {
        period1: [new Date("2024-10-08T10:00:00").toISOString(), new Date("2024-10-08T12:00:00").toISOString()],
        period2: [new Date("2024-11-01T10:00:00").toISOString(), new Date("2024-11-03T12:00:00").toISOString()],
      },
    },
    {
      name: "B2",
      lengthCapacity: 400, // in meters
      depthCapacity: 20, // in meters
      beamCapacity: 50, // in meters
      displacementCapacity: 200000, // in tons
      cargoType: "Bulk",
      bookedPeriod: {},
    },
  ];

  // Add the berths to the facilityList collection
  for (const berth of berths) {
    const docRefList = doc(facilityListCollectionRef, berth.name);
    try {
      await setDoc(docRefList, berth);
      console.log(`Berth ${berth.name} data added successfully.`);
    } catch (error) {
      console.error(`Error adding berth ${berth.name} data:`, error);
    }
  }

  console.log("FacilityList data simulation completed.");
}

module.exports = { simulateBerthTestData };