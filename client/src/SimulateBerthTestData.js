import { db } from "./firebaseConfig"; // Firestore configuration
import { collection, getDocs, setDoc, doc } from "firebase/firestore";

// Function to simulate adding test data to Firestore
export const simulateBerthTestData = async () => {
  const facilityScheduleCollectionRef = collection(db, "facilitySchedule");
  const facilityListCollectionRef = collection(db, "facilityList");

  // Check if the "facilitySchedule" collection already has documents
  const facilityScheduleSnapshot = await getDocs(facilityScheduleCollectionRef);
  if (!facilityScheduleSnapshot.empty) {
    console.log("FacilitySchedule data already exists, skipping simulation.");
    return; // Exit the function if the collection is not empty
  }

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
    },
    {
      name: "B2",
      lengthCapacity: 400, // in meters
      depthCapacity: 20, // in meters
      beamCapacity: 50, // in meters
      displacementCapacity: 200000, // in tons
      cargoType: "Bulk",
    },
  ];

  const startDate = new Date("2024-09-29"); // Start date
  const numberOfDays = 10; // Simulate for 10 days

  for (let dayOffset = 0; dayOffset < numberOfDays; dayOffset++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + dayOffset);

    // Convert date to local date string in YYYY-MM-DD format
    const dateString = new Intl.DateTimeFormat('en-CA', { // en-CA format is used for YYYY-MM-DD
      timeZone: 'Asia/Singapore', // Specify your local timezone here
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(currentDate).replace(/\//g, '-'); // Adjust to format YYYY-MM-DD

    for (let hour = 0; hour < 24; hour++) {
      // Format the time as HH:00 using local time zone
      const timeString = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Singapore', // Specify your local timezone
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // 24-hour format
      }).format(new Date(currentDate.setHours(hour, 0))).split(":").join(":");

      // Loop through each berth
      for (const berth of berths) {
        const availability = true; // 100% chance of being available

        // Create the document data with the `reason` attribute set to null
        const facilityData = {
          berthName: berth.name,
          date: dateString,
          time: timeString,
          available: availability,
          reason: null,
        };

        const scheduleDocId = `${berth.name}-${dateString}-${timeString}`;

        // Add the document to Firestore
        try {
          const docRefSchedule = doc(facilityScheduleCollectionRef, scheduleDocId); // Specify custom document ID
          await setDoc(docRefSchedule, facilityData);
          console.log(
            `Data added: Berth ${berth.name}, Date ${dateString}, Time ${timeString}, Available ${availability}, Reason: null`
          );
        } catch (error) {
          console.error("Error adding document:", error);
        }
      }
    }
  }
  console.log("FacilitySchedule data simulation completed.");

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
};
