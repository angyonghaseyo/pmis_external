import { db } from "./firebaseConfig";
import { collection, setDoc, doc, getDocs } from "firebase/firestore";

// Function to generate team data
function generateTeamData(timePeriod, startDate, endDate) {
  const assignedUsers = [
    {
      displayName: "Mr Eunice WKR",
      role: "Signalman",
      id: "HwdEpxjPOlNJHmoSihOi2ycM2jW",
      hours: 40,
      actualWorkingDates: [],
      coveringFor: null,
      start: startDate,
      end: endDate,
      timePeriod: timePeriod,
    },
    {
      displayName: "Ms Xiang Quek WKR",
      role: "Tallyman",
      id: "uKuaODMyI3NLE9Yg9Rqyqm4Fl7a2",
      hours: 40,
      actualWorkingDates: [],
      coveringFor: null,
      start: startDate,
      end: endDate,
      timePeriod: timePeriod,
    },
    {
      displayName: "Mr Jester WKR",
      role: "Crane Operator",
      id: "Y42k1fukE1bmrxz0o9Md8wOkzFX2",
      hours: 40,
      actualWorkingDates: [],
      coveringFor: null,
      start: startDate,
      end: endDate,
      timePeriod: timePeriod,
    },
    {
      displayName: "Mr Ang Yong WKR",
      role: "Crane Operator",
      id: "A10K74CLmyWnycwtunK8OTYX3Gq1",
      hours: 40,
      actualWorkingDates: [],
      coveringFor: null,
      start: startDate,
      end: endDate,
      timePeriod: timePeriod,
    },
    {
      displayName: "Mr Cheong WKR",
      role: "Chief Foreman",
      id: "R3LnxsMkF8wM7FeqIo8VXnqM7L2",
      hours: 40,
      actualWorkingDates: [],
      coveringFor: null,
      start: startDate,
      end: endDate,
      timePeriod: timePeriod,
    },
    // 8 Reach Stacker Operators
    ...Array(8)
      .fill(null)
      .map((_, index) => ({
        displayName: `Reach Stacker Operator ${index + 1}`,
        role: "Reach Stacker Operator",
        id: `ReachStackerOp${index + 1}`,
        hours: 40,
        actualWorkingDates: [],
        coveringFor: null,
        start: startDate,
        end: endDate,
        timePeriod: timePeriod,
      })),
    // 4 Truck Operators
    ...Array(4)
      .fill(null)
      .map((_, index) => ({
        displayName: `Truck Operator ${index + 1}`,
        role: "Truck Operator",
        id: `TruckOp${index + 1}`,
        hours: 40,
        actualWorkingDates: [],
        coveringFor: null,
        start: startDate,
        end: endDate,
        timePeriod: timePeriod,
      })),
  ];

  return {
    assignedUsers,
    createdAt: new Date(),
    startDate: startDate,
    endDate: endDate,
    status: "Scheduled",
    teamName: "Team Alpha",
    timePeriod: timePeriod,
  };
}

// Function to create and persist documents into Firestore
export async function simulateManpowerTestData() {
  const workSchedulesRef = collection(db, "denzel_work_schedule");

  const workScheduleSnapShot = await getDocs(workSchedulesRef);
  if (!workScheduleSnapShot.empty) {
    console.log(
      "denzel_work_schedule data already exists, skipping simulation."
    );
    return; // Exit the function if the collection is not empty
  }

  // Define the time periods and dates
  const timePeriods = ["00:00-08:00", "08:00-16:00", "16:00-24:00"];
  const startDate = new Date("2024-10-21").toISOString();
  const endDate = new Date("2024-10-25").toISOString();

  try {
    // Check if any documents already exist in the collection
    const existingDocsSnapshot = await getDocs(workSchedulesRef);
    if (!existingDocsSnapshot.empty) {
      console.log(
        "Documents already exist in the 'denzel_work_schedule' collection. Skipping creation."
      );
      return;
    }

    // Loop over time periods and create documents
    for (let i = 0; i < timePeriods.length; i++) {
      const teamData = generateTeamData(timePeriods[i], startDate, endDate);
      // Generate the document title by including timePeriod, startDate, and endDate
      //   const docRef = doc(workSchedulesRef, 'schedule-${timePeriods[i]}-${startDate}-${endDate}`);
      const docRef = doc(
        workSchedulesRef,
        `${timePeriods[i]}^${startDate}^${endDate}`
      );
      await setDoc(docRef, teamData);
      console.log(`Document created for time period: ${timePeriods[i]}`);
    }

    console.log("All documents have been successfully created.");
  } catch (error) {
    console.error("Error creating documents:", error);
  }
}

// Call the function to persist the work schedules
