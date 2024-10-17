const { db } = require('../config/firebaseAdmin');
const { collection, setDoc, doc, getDocs } = require('firebase-admin/firestore');

// Function to generate asset data
function generateAssetData(category, name, description, location, ownership, status, expiryDate = null, containersPerHour) {
  console.log("Asset created with name: " + name);
  return {
    category,
    name,
    description,
    location,
    ownership,
    status,
    expiryDate,
    bookedPeriod: [],  // Empty array as per your requirement
    containersPerHour,
    id: doc(collection(db, "denzel_assets")).id, // Generate unique ID for each asset
  };
}

// Function to create and persist asset data into Firestore
async function simulateAssetTestData() {
  const assetsRef = collection(db, "denzel_assets");

  // Check if any documents already exist in the collection
  const assetSnapShot = await getDocs(assetsRef);
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
      const docRef = doc(assetsRef, asset.id);
      await setDoc(docRef, asset);
      console.log(`Asset ${asset.name} created and persisted.`);
    }

    console.log("All assets have been successfully created.");
  } catch (error) {
    console.error("Error creating assets:", error);
  }
}

module.exports = { simulateAssetTestData };