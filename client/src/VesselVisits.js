import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControlLabel,
  Checkbox,
  Grid,
  Tabs,
  Tab,
  IconButton,
} from "@mui/material";
import { LocalizationProvider, DateTimePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { db } from "./firebaseConfig";
import { getUserData } from './services/api';
import { auth } from './firebaseConfig';
import {
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  query,
  where,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  deleteObject,
} from "firebase/storage";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

const VesselVisits = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [visitType, setVisitType] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [formData, setFormData] = useState({
    vesselName: "",
    imoNumber: "",
    vesselType: "",
    loa: "",
    draft: "",
    eta: null,
    etd: null,
    cargoType: "",
    cargoVolume: "",
    pilotage: false,
    tugAssistance: false,
    cargoHandlingEquipment: false,
    agentName: "",
    agentContact: "",
    containersOffloaded: 0,
    containersOnloaded: 0,
    requiredCranes: 0, // New field for cranes
    requiredTrucks: 0, // New field for trucks
    requiredReachStackers: 0, // New field for reach stackers
    facilityDemandCheckBoolean: "",
    berthAssigned: "",
    assetDemandCheckBoolean: "",
    numberOfCranesNeeded: "",
    numberOfTrucksNeeded: "",
    numberOfReachStackersNeeded: "",
    manpowerDemandCheckBoolean: "",
    status: "",
    createdAt: "",
    updatedAt: "",
    vesselGridCount: 0,
    vesselBayCount: 0,
    vesselTierCount: 0,
    stowageplanURL: "",
    //Denzel
  });
  const [vesselVisitsData, setVesselVisitsData] = useState([]);
  const [error, setError] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef(null); // Create a ref for the file input
  const [downloadURL, setDownloadURL] = useState("");

  dayjs.extend(utc);
  dayjs.extend(timezone);
  const singaporeTimeZone = "Asia/Singapore";

  useEffect(() => {
    fetchVesselVisits();
  }, []);

  const fetchVesselVisits = async () => {
    const querySnapshot = await getDocs(collection(db, "vesselVisitRequests"));
    const visitsArray = querySnapshot.docs.map((doc) => ({
      documentId: doc.id,
      ...doc.data(),
    }));
    setVesselVisitsData(visitsArray); // Load data into vesselVisitsData state
  };

  async function checkAssetAvailability(vesselVisitRequest) {
    const { eta, etd, containersOffloaded, containersOnloaded } =
      vesselVisitRequest;
    // Initialize required assets count
    let requiredCranes = 0;
    let requiredTrucks = 0;
    let requiredReachStackers = 0;
    let cranePass = false;
    let truckPass = false;
    let reachStackerPass = false;

    // Calculate total containers to handle
    const totalContainers = +containersOffloaded + +containersOnloaded;
    const totalContainersForReachStackerOnly =
      (+containersOffloaded + +containersOnloaded) * 2;

    // Calculate the time difference between ETA and ETD (in hours)
    const etaDate = new Date(eta);
    const etdDate = new Date(etd);
    const totalAvailableHours = (etdDate - etaDate) / (1000 * 60 * 60); // Converts ms to hours

    // Query Firestore to get all cranes, trucks, and reach stackers
    const assetsRef = collection(db, "denzel_assets");
    const assetSnapshot = await getDocs(assetsRef);
    const assets = assetSnapshot.docs.map((doc) => doc.data());

    // Separate assets into categories (cranes, trucks, reach stackers)
    const cranes = assets.filter(
      (asset) => asset.category === "Ship-to-shore cranes"
    );
    const trucks = assets.filter(
      (asset) => asset.category === "Trucks and trailers"
    );
    const reachStackers = assets.filter(
      (asset) => asset.category === "Reach stackers"
    );

    // Helper function to check if assets are available during a time range
    function isAssetAvailable(asset, eta, etd) {
      for (const period of asset.bookedPeriod) {
        const [bookedEta, bookedEtd] = period;
        // If the asset's booked period overlaps with the requested period, it's unavailable
        if (
          !(
            new Date(etd) <= new Date(bookedEta) ||
            new Date(eta) >= new Date(bookedEtd)
          )
        ) {
          return false;
        }
      }
      return true;
    }

    // 1. Check cranes availability
    let craneCapacityPerHour = 0;
    let craneCount = 0;
    for (const crane of cranes) {
      if (isAssetAvailable(crane, eta, etd)) {
        console.log(
          "Crane with id " +
          crane.name +
          " is available time-wise and is being demand checked"
        );
        craneCapacityPerHour += crane.containersPerHour;
        craneCount += 1;
        requiredCranes += 1; // Add to required cranes
        const requiredHoursForCranes = totalContainers / craneCapacityPerHour;
        // If required hours exceed the available time window, return false
        console.log("totalContainers is " + totalContainers);
        console.log("craneCapcityPerHour is " + craneCapacityPerHour);
        console.log("requiredHoursForCranes is " + requiredHoursForCranes);
        console.log("totalAvailableHours is " + totalAvailableHours);

        if (requiredHoursForCranes > totalAvailableHours) {
          console.log(
            "there is not enough cranes, please repeat the loop and demand check using more cranes"
          );
        }
        // If crane count meets the required capacity, break the loop
        if (craneCapacityPerHour * totalAvailableHours >= totalContainers) {
          console.log(
            "there is enough cranes with a quantity of " + requiredCranes
          );
          cranePass = true;
          break;
        }
      }
    }

    // 2. Check trucks availability (similar logic)
    let truckCapacityPerHour = 0;
    let truckCount = 0;
    for (const truck of trucks) {
      console.log(
        "Truck with id" +
        truck.name +
        "is available and is being demand checked"
      );
      if (isAssetAvailable(truck, eta, etd)) {
        truckCapacityPerHour += truck.containersPerHour;
        truckCount += 1;
        requiredTrucks += 1; // Add to required trucks
        const requiredHoursForTrucks = totalContainers / truckCapacityPerHour;
        // If required hours exceed the available time window, return false
        if (requiredHoursForTrucks > totalAvailableHours) {
          console.log(
            "there is not enough trucks, therefore, loop again and demand check using more trucks"
          );
        }
        if (truckCapacityPerHour * totalAvailableHours >= totalContainers) {
          console.log(
            "there is enough trucks with a quantity of " + requiredTrucks
          );
          truckPass = true;
          break;
        }
      }
    }

    // 3. Check reach stackers availability
    let stackerCapacityPerHour = 0;
    let stackerCount = 0;
    for (const stacker of reachStackers) {
      if (isAssetAvailable(stacker, eta, etd)) {
        stackerCapacityPerHour += stacker.containersPerHour;
        stackerCount += 1;
        requiredReachStackers += 1; // Add to required reach stackers
        const requiredHoursForReachStackers =
          totalContainersForReachStackerOnly / stackerCapacityPerHour;
        // If required hours exceed the available time window, return false
        if (requiredHoursForReachStackers > totalAvailableHours) {
          console.log(
            "there is not enough reach stackers, therefore, loop again and demand check using more reach stackers"
          );
        }
        if (
          stackerCapacityPerHour * totalAvailableHours >=
          totalContainersForReachStackerOnly
        ) {
          console.log(
            "there is enough reach stackers with a quantity of " +
            requiredReachStackers
          );
          reachStackerPass = true;
          break;
        }
      }
    }

    // If all checks pass, return true
    if (cranePass && truckPass && reachStackerPass) {
      console.log("asset demand check has passed");
      return {
        success: true,
        requiredAssets: {
          requiredCranes,
          requiredTrucks,
          requiredReachStackers,
        },
      };
    } else {
      console.log("asset demand check has failed");
      return {
        success: false,
        requiredAssets: {
          requiredCranes,
          requiredTrucks,
          requiredReachStackers,
        },
      };
    }
  }

  const checkFacilityAvailability = async (vesselVisitRequest) => {
    const { loa, draft, cargoType, eta, etd } = vesselVisitRequest;
    const facilityListCollectionRef = collection(db, "facilityList");
    const facilityListSnapshot = await getDocs(facilityListCollectionRef);
    const matchedBerths = [];
    const etaAdjustedDate = new Date();
    const etdAdjustedDate = new Date();



    // Helper function to check if assets are available during a time range
    function isBerthAvailable(facility, eta, etd) {
      console.log("The facility is: " + facility.name);
      console.log("eta at isBerthAvailable: " + eta);
      console.log("etd at isBerthAvailable: " + etd);

      try {
        // Use Object.entries to iterate over the bookedPeriod map (converted to an object)
        for (const [periodKey, period] of Object.entries(
          facility.bookedPeriod
        )) {
          const [bookedEta, bookedEtd] = period;

          // If the asset's booked period overlaps with the requested period, it's unavailable
          if (
            !(
              new Date(etd) <= new Date(bookedEta) ||
              new Date(eta) >= new Date(bookedEtd)
            )
          ) {
            console.log(`Berth is unavailable during period ${periodKey}`);
            return false;
          }
        }
        return true; // Available if no conflicts found
      } catch (error) {
        console.error("Error checking berth availability: ", error);
      }
    }

    try {
      // Step 1: Check the facilityList to find berths that match the vessel's LOA, draft, and cargoType
      facilityListSnapshot.forEach((doc) => {
        const berth = doc.data();

        // Check if LOA, draft, and cargoType match
        if (
          loa <= berth.lengthCapacity &&
          draft <= berth.depthCapacity &&
          cargoType === berth.cargoType
        ) {
          matchedBerths.push(berth); // Store the matched berth name
        }
      });

      if (matchedBerths.length === 0) {
        console.log("No berths match the vessel's requirements.");
        return false;
      }

      const startDate = new Date(eta);
      const endDate = new Date(etd);
      console.log("!The start date is " + startDate);
      console.log("!The end date is " + endDate);
      console.log("!The eta is " + eta);
      console.log("!The etd is " + etd);
      console.log("!As of now, matchedBerths contains: " + matchedBerths);
    } catch (error) {
      console.log(
        "Step 1 for facility demand check has failed because of: " + error
      );
    }

    try {
      // Step 2: Loop through each matched berth and check whether it is available during the required hours
      for (const berth of matchedBerths) {
        if (isBerthAvailable(berth, eta, etd)) {
          //check that berth is available using helper function isBerthAvailable
          console.log(`Berth ${berth} is available for the entire time range.`);
        } else {
          //remove the berth from matchedBerths array
          const index = matchedBerths.findIndex((obj) => obj === berth); // Find the index of the berth to be removed
          matchedBerths.splice(index, 1);
          console.log(
            `Berth ${berth} is NOT available for the entire time range and is removed from matchedBerths array.`
          );
        }
      }
      console.log("dfdsf: " + matchedBerths);
      console.log("oohlahlah" + eta);
      // If no berth is fully available for the entire time range, find a berth with an availability that closest matches the eta of the vessel
      if (matchedBerths.length === 0) {
        console.log("No berth is available for the entire time range.");
        // adjust eta by +1 hour and etd by +1 hour and do demand check again. Keep repeating until you find at least one berth that is free within the eta-etd period
        // First Convert the ISO string to Date objects
        etaAdjustedDate = new Date(eta);
        etaAdjustedDate.setMinutes(eta.getMinutes() + 15);
        etdAdjustedDate = new Date(etd);
        etdAdjustedDate.setMinutes(etd.getMinutes() + 15);
        console.log(
          `Adjusting ETA and ETD by 15 minutes: New ETA: ${etaAdjustedDate}, New ETD: ${etdAdjustedDate}`
        );
        const { loa, draft, cargoType, etaAdjustedDate, etdAdjustedDate } = vesselVisitRequest;
        return checkFacilityAvailability(vesselVisitRequest);
      } else {
        let assignedBerth = matchedBerths.pop();
        console.log(
          "The berth that has been assigned to the vessel is" +
          assignedBerth.name
        );
        return { success: true, assignedBerth: assignedBerth.name };
      }
    } catch (error) {
      console.error("Error checking facility availability:", error);
      return { success: false, assignedBerth: "" }; // Return false in case of error
    }
  };

  const checkManpowerAvailability = async (vesselVisitRequest) => {
    const {
      eta,
      etd,
      numberOfCranesNeeded,
      numberOfTrucksNeeded,
      numberOfReachStackersNeeded,
    } = vesselVisitRequest;

    // Define the 8-hour time slots
    const timeSlots = [
      { start: "00:00", end: "08:00" },
      { start: "08:00", end: "16:00" },
      { start: "16:00", end: "00:00" },
    ];

    // Helper function to calculate overlapping time slots
    const getOverlappingTimeSlots = (eta, etd) => {
      const slots = [];
      let iterator = eta.startOf("day"); // Start from the day of the ETA

      // Loop through each day between ETA and ETD
      while (iterator.isBefore(etd, "day") || iterator.isSame(etd, "day")) {
        timeSlots.forEach((slot) => {
          const slotStart = iterator
            .hour(Number(slot.start.split(":")[0]))
            .minute(0);
          let slotEnd = iterator.hour(Number(slot.end.split(":")[0])).minute(0);

          if (slot.end === "00:00") {
            slotEnd = slotEnd.add(1, "day");
          }

          // Check if the slot overlaps with ETA-ETD range
          if (
            ((slotStart.isSame(eta) || slotStart.isAfter(eta)) &&
              slotStart.isBefore(etd)) ||
            ((slotEnd.isSame(etd) || slotEnd.isBefore(etd)) &&
              slotEnd.isAfter(eta))
          ) {
            slots.push({ start: slotStart.format(), end: slotEnd.format() });
          }
        });

        iterator = iterator.add(1, "day"); // Move to the next day
      }
      console.log(slots);
      return slots;
    };

    // Helper function to filter manpower documents based on time slots
    const filterManpowerDocuments = async (calculatedSlots) => {
      try {
        const workSchedulesRef = collection(db, "denzel_work_schedule");
        const manpowerDocs = [];

        // Loop through each calculated slot and query Firestore
        for (const slot of calculatedSlots) {
          const { start, end } = slot;

          // Create time period string for Firestore query (e.g., "00:00-08:00")
          const timePeriod = `${start.split("T")[1].slice(0, 5)}-${end
            .split("T")[1]
            .slice(0, 5)}`;
          const startDate = start.split("T")[0];
          const endDate = end.split("T")[0];

          // Query Firestore for documents matching the time period and date range
          const q = query(
            workSchedulesRef,
            where("startDate", "<=", endDate),
            where("endDate", ">=", startDate),
            where("timePeriod", "==", timePeriod)
          );

          const querySnapshot = await getDocs(q);

          // Add matching documents to array
          querySnapshot.forEach((doc) => {
            manpowerDocs.push(doc.data());
          });
        }

        return manpowerDocs;
      } catch (error) {
        console.error("Error fetching manpower documents:", error);
      }
    };

    // Helper function to check if manpower is sufficient
    const checkManpowerSufficiency = (manpowerDocs, requiredRoles) => {
      const availableManpower = {};

      manpowerDocs.forEach((doc) => {
        doc.assignedUsers.forEach((user) => {
          if (!availableManpower[user.role]) {
            availableManpower[user.role] = 0;
          }
          availableManpower[user.role] += 1;
        });
      });

      const isManpowerSufficient = Object.keys(requiredRoles).every((role) => {
        return (
          availableManpower[role] &&
          availableManpower[role] >= requiredRoles[role]
        );
      });

      return isManpowerSufficient;
    };

    // Function to fetch documents based on filters
    const fetchFilteredDocuments = async (
      timePeriod,
      startDate,
      endDate,
      status
    ) => {
      try {
        const workSchedulesRef = collection(db, "denzel_work_schedule");

        // Create a Firestore query with the provided filters
        const q = query(
          workSchedulesRef,
          where("timePeriod", "==", timePeriod),
          where("startDate", "==", startDate),
          where("endDate", "==", endDate),
          where("status", "==", status)
        );

        const querySnapshot = await getDocs(q);

        // Check if documents are found
        if (querySnapshot.empty) {
          console.log("No matching documents.");
          return [];
        }

        // Map through the found documents and log them
        const results = [];
        querySnapshot.forEach((doc) => {
          results.push(doc.data());
          console.log(doc.id, " => ", doc.data());
        });

        return results; // Return the filtered results
      } catch (error) {
        console.error("Error fetching filtered documents: ", error);
      }
    };

    // Helper function to loop through each day in the range
    const fetchDocumentsForDateRange = async (
      timePeriod,
      startDay,
      endDay,
      status
    ) => {
      let currentDay = dayjs(startDay);
      const endDate = dayjs(endDay);
      const allResults = [];

      // Loop through each day in the range
      while (currentDay.isBefore(endDate) || currentDay.isSame(endDate)) {
        const startDateString = currentDay.format("YYYY-MM-DD"); // Format the date as a string
        const endDateString = currentDay.format("YYYY-MM-DD"); // Use the same date for a single-day check
        console.log("start" + startDateString);
        console.log("end" + endDateString);

        // Fetch documents for the current day
        const docs = await fetchFilteredDocuments(
          timePeriod,
          startDateString,
          endDateString,
          status
        );

        if (docs.length > 0) {
          allResults.push(...docs); // Add found documents to the results array
        }

        currentDay = currentDay.add(1, "day"); // Move to the next day
      }

      return allResults; // Return all found documents
    };

    const timePeriod = "00:00-08:00";
    const startDay = "2024-10-21";
    const endDay = "2024-10-25";
    const status = "Ad-Hoc";

    // Fetch documents for the date range
    fetchDocumentsForDateRange(timePeriod, startDay, endDay, status).then(
      (allDocs) => {
        console.log("All Filtered Documents: ", allDocs);
      }
    );

    // const localETA = dayjs.utc(eta).tz(singaporeTimeZone);
    // console.log("Local ETA:", localETA.toISOString());

    // const localETD = dayjs.utc(etd).tz(singaporeTimeZone);
    // console.log("Local ETD:", localETD.toISOString());

    // // Calculate relevant 8-hour time slots
    // const overlappingSlots = getOverlappingTimeSlots(localETA, localETD);
    // console.log("Overlapping Time Slots:", overlappingSlots);

    // // Fetch manpower documents that fall within those slots
    // const manpowerDocs = await filterManpowerDocuments(overlappingSlots);
    // console.log("Filtered Manpower Documents:", manpowerDocs);

    // Define required roles based on vessel needs
    const requiredRoles = {
      "Crane Operator": numberOfCranesNeeded,
      "Truck Operator": numberOfTrucksNeeded,
      "Reach Stacker Operator": numberOfReachStackersNeeded,
    };
    console.log("Required Roles:", requiredRoles);

    // Check if manpower is sufficient for the vessel visit request
    // const isSufficient = checkManpowerSufficiency(manpowerDocs, requiredRoles);
    // console.log("isSuffucient is " + isSufficient);

    return true ? true : false;
  };

  const checkResources = async () => {
    const facilitiesDemandCheckBooleanAndBerth =
      await checkFacilityAvailability({
        loa: formData.loa,
        draft: formData.draft,
        cargoType: formData.cargoType,
        eta: formData.eta,
        etd: formData.etd,
      });
    const assetsDemandCheckBooleanAndQuantity = await checkAssetAvailability({
      eta: formData.eta,
      etd: formData.etd,
      containersOffloaded: formData.containersOffloaded,
      containersOnloaded: formData.containersOnloaded,
    });
    const manpowerDemandCheckBoolean = await checkManpowerAvailability({
      eta: formData.eta,
      etd: FormData.etd,
      numberOfCranesNeeded: formData.numberOfCranesNeeded,
      numberOfTrucksNeeded: formData.numberOfTrucksNeeded,
      numberOfReachStackersNeeded: formData.numberOfReachStackersNeeded,
    });

    return {
      facilitiesDemandCheckBooleanAndBerth,
      assetsDemandCheckBooleanAndQuantity,
      manpowerDemandCheckBoolean,
    };
  };

  const handleOpenDialog = (type, visit = null) => {
    setVisitType(type);
    if (visit) {
      setFormData({
        vesselName: visit.vesselName,
        imoNumber: visit.imoNumber,
        vesselType: visit.vesselType,
        loa: visit.loa,
        draft: visit.draft,
        eta: visit.eta ? new Date(visit.eta) : null, // Convert ISO string to Date
        etd: visit.etd ? new Date(visit.etd) : null, // Convert ISO string to Date
        cargoType: visit.cargoType,
        cargoVolume: visit.cargoVolume,
        pilotage: visit.pilotage || false,
        tugAssistance: visit.tugAssistance || false,
        cargoHandlingEquipment: visit.cargoHandlingEquipment || false,
        agentName: visit.agentName,
        agentContact: visit.agentContact,
        containersOffloaded: visit.containersOffloaded,
        containersOnloaded: visit.containersOnloaded,
        vesselGridCount: visit.vesselGridCount,
        vesselBayCount: visit.vesselBayCount,
        vesselTierCount: visit.vesselTierCount,
        stowageplanURL: visit.stowageplanURL,
      });
      setEditingId("Edit"); //  setEditingId(visit.id); Denzel
    } else {
      setEditingId(null);
      setFormData({
        vesselName: "",
        imoNumber: "",
        vesselType: "",
        loa: "",
        draft: "",
        eta: null,
        etd: null,
        cargoType: "",
        cargoVolume: "",
        pilotage: false,
        tugAssistance: false,
        cargoHandlingEquipment: false,
        agentName: "",
        agentContact: "",
        containersOffloaded: 0,
        containersOnloaded: 0,
        vesselGridCount: 0,
        vesselBayCount: 0,
        vesselTierCount: 0,
        stowageplanURL: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleDateChange = (name, newDate) => {
    const currentDateTime = new Date();
    if (newDate < currentDateTime) {
      setError((prev) => ({
        ...prev,
        [name]:
          "Date and time cannot be earlier than the current date and time",
      }));
    } else {
      setError((prev) => ({ ...prev, [name]: "" }));
      setFormData((prev) => ({
        ...prev,
        [name]: newDate, // Convert to ISO string
      }));
      console.log("change is happening");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0]; // Only one file
    try {
      if (file && file.type !== "text/csv") {
        setFileError("Please upload a valid CSV file.");
        setSelectedFile(null);
      } else {
        console.log("file with" + file.name + "is registered");
        setFileError("");
        setSelectedFile(file);
      }
    } catch (error) {
      console.log("there is an error", error);
    }
  };

  // Handle file clear/reset
  const handleClearFile = async () => {
    const storage = getStorage();
    const fileName = selectedFile.name;
    try {
      // Create a reference to the specific file in the 'stowage-plans/' directory
      const fileRef = ref(storage, `stowage-plans/${fileName}`);
      // Delete the specific file
      await deleteObject(fileRef);

      console.log("The right file has been deleted.");
    } catch (error) {
      console.error("Error deleting files from 'stowage-plans':", error);
    }
    setSelectedFile(null);
    setFileError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = null; // This line is important if you want to be able to re-upload the same file
    }
  };

  const handleSubmit = async () => {
    if (!formData.vesselName) {
      alert("Please fill out the vessel name");
      return;
    }
    if (!formData.imoNumber) {
      alert("Please fill out the IMO number");
      return;
    }
    if (!formData.vesselType) {
      alert("Please select the vessel type");
      return;
    }
    if (!formData.loa) {
      alert("Please provide the LOA (Length Overall)");
      return;
    }
    if (!formData.draft) {
      alert("Please provide the draft of the vessel");
      return;
    }
    if (!formData.eta) {
      alert("Please provide the ETA (Estimated Time of Arrival)");
      return;
    }
    if (!formData.etd) {
      alert("Please provide the ETD (Estimated Time of Departure)");
      return;
    }
    if (!formData.cargoType) {
      alert("Please select the cargo type");
      return;
    }
    if (!formData.cargoVolume) {
      alert("Please provide the cargo volume");
      return;
    }
    if (!formData.agentName) {
      alert("Please provide the agent's name");
      return;
    }
    if (!formData.containersOffloaded) {
      alert(
        "Please provide the number of containers that will be offloaded from the vesssel"
      );
      return;
    }
    if (!formData.containersOnloaded) {
      alert(
        "Please provide the number of containers that will be onloaded to the vesssel"
      );
      return;
    }

    // Simulate resource check
    const resourceCheck = await checkResources();
    console.log(resourceCheck);

    // The dates are already stored in ISO format in formData
    const newVisit = {
      vesselName: formData.vesselName,
      imoNumber: formData.imoNumber,
      vesselType: formData.vesselType,
      loa: formData.loa,
      draft: formData.draft,
      eta: formData.eta.toISOString(),
      etd: formData.etd.toISOString(),
      cargoType: formData.cargoType,
      cargoVolume: formData.cargoVolume,
      pilotage: formData.pilotage,
      tugAssistance: formData.tugAssistance,
      cargoHandlingEquipment: formData.cargoHandlingEquipment,
      agentName: formData.agentName,
      agentContact: formData.agentContact,
      containersOffloaded: formData.containersOffloaded,
      containersOnloaded: formData.containersOnloaded,
      facilityDemandCheckBoolean:
        resourceCheck.facilitiesDemandCheckBooleanAndBerth.success !== undefined ? false : false ,
      berthAssigned:
        resourceCheck.facilitiesDemandCheckBooleanAndBerth.assignedBerth !== undefined ? "" : "",
      assetDemandCheckBoolean:
        resourceCheck.assetsDemandCheckBooleanAndQuantity.success,
      numberOfCranesNeeded:
        resourceCheck.assetsDemandCheckBooleanAndQuantity.requiredAssets
          .requiredCranes,
      numberOfTrucksNeeded:
        resourceCheck.assetsDemandCheckBooleanAndQuantity.requiredAssets
          .requiredTrucks,
      numberOfReachStackersNeeded:
        resourceCheck.assetsDemandCheckBooleanAndQuantity.requiredAssets
          .requiredReachStackers,
      manpowerDemandCheckBoolean: resourceCheck.manpowerDemandCheckBoolean,
      // status for UI purposes
      status:
        resourceCheck.manpowerDemandCheckBoolean &&
          resourceCheck.assetsDemandCheckBooleanAndQuantity.success &&
          resourceCheck.facilitiesDemandCheckBooleanAndBerth.success
          ? "confirmed"
          : "pending user intervention",
      vesselGridCount:
        formData.vesselGridCount !== undefined ? formData.vesselGridCount : 0, // Provide default value for undefined
      vesselBayCount:
        formData.vesselBayCount !== undefined ? formData.vesselBayCount : 0, // Provide default value for undefined
      vesselTierCount:
        formData.vesselTierCount !== undefined ? formData.vesselTierCount : 0, // Provide default value for undefined
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stowageplanURL: formData.stowageplanURL,
    };
    //denzel: facility demand check - checking booking time slots is wrong - no longer using 1 hour slots done
    //denzel: facilitydemandcheck should always return true except if there is an error caused in the demand heck
    //file uploading
    try {
      const storage = getStorage();
      const storageRef = ref(
        storage,
        `stowage-plans/${formData.imoNumber}_stowageplan.csv`
      );
      // Upload the file
      await uploadBytes(storageRef, selectedFile);
      // Get the download URL after upload
      newVisit.stowageplanURL = await getDownloadURL(storageRef);
      setDownloadURL(newVisit.stowageplanURL);
      console.log(
        "File uploaded and renamed successfully:",
        newVisit.stowageplanURL
      );
    } catch (error) {
      setFileError("Missing stowage plan.");
      console.error("Error updating stowage plan's URL to newVisit:", error);
    }
    console.log(newVisit);
    try {
      const docRef = doc(db, "vesselVisitRequests", formData.imoNumber);
      await setDoc(docRef, newVisit);

      if (editingId) {
        // Editing an existing record: update the corresponding entry in vesselVisitsData
        setVesselVisitsData((prev) =>
          prev.map((visit) =>
            visit.documentId === formData.imoNumber
              ? { ...newVisit, documentId: formData.imoNumber }
              : visit
          )
        );
      } else {
        setVesselVisitsData((prev) => [
          ...prev,
          { ...newVisit, documentId: formData.imoNumber },
        ]);
      }
      handleCloseDialog();

      console.log(
        "Vessel visit request saved successfully with ID:",
        formData.imoNumber
      );
    } catch (error) {
      console.error("Error adding or updating document: ", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      // Create a reference to a specific document
      const docRef = doc(db, "vesselVisitRequests", id);
      // Fetch the document
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // The document exists, and you can access the data
        await deleteDoc(docRef);
        // Update the state to remove the deleted visit from the vesselVisitsData array
        setVesselVisitsData((prev) =>
          prev.filter((visit) => visit.documentId !== id)
        );
        console.log(`Vessel visit request with ID: ${id} has been deleted.`);
      } else {
        // The document does not exist
        console.log("No such document!");
      }
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const fetchUserProfile = async (userId) => {
    try {
      const profileData = await getUserData(userId);
      setUserProfile(profileData);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to fetch user profile. Please try again later.');
    }
  };

  const hasRole = (requiredRoles) => {
    if (!userProfile || !Array.isArray(userProfile.accessRights)) return false;

    // Check if the user has any of the required roles
    const hasRequiredRole = requiredRoles.some(role => userProfile.accessRights.includes(role));

    // Return true if the user has a required role or is an Admin
    return hasRequiredRole || userProfile.role === 'Admin';
  };

  useEffect(() => {
    fetchUserProfile(auth.currentUser.uid);
  }, []);


  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1">
          Vessel Visits
        </Typography>
        {hasRole(['Create Vessel Visit Request']) && (
          <Box>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleOpenDialog('Scheduled')}
              sx={{ mr: 2 }}
            >
              Scheduled Vessel Visit
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleOpenDialog('Ad Hoc')}
            >
              Ad Hoc Vessel Visit
            </Button>
          </Box>
        )}
      </Box>

      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        aria-label="Vessel Visit Tabs"
      >
        <Tab label="Upcoming Vessel Visits" />
        <Tab label="Completed Vessel Visits" />
      </Tabs>

      {tabValue === 0 && (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>IMO Number</TableCell>
                <TableCell>Vessel Name</TableCell>
                <TableCell>ETA (Local Time) </TableCell>
                <TableCell>ETD (Local Time) </TableCell>
                <TableCell>Containers Offloaded</TableCell>
                <TableCell>Containers Onloaded</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Assigned Berth</TableCell>
                {hasRole(["Edit Vessel Visit Requests", "Delete Vessel Visit Requests"]) && (
                <TableCell>Actions</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {vesselVisitsData.map((visit) => (
                <TableRow key={visit.documentId}>
                  <TableCell>{visit.documentId}</TableCell>
                  <TableCell>{visit.vesselName}</TableCell>
                  <TableCell>
                    {visit.eta
                      ? new Date(visit.eta).toLocaleString("en-SG", {
                          hour12: true,
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "No Date"}
                  </TableCell>
                  <TableCell>
                    {visit.etd
                      ? new Date(visit.etd).toLocaleString("en-SG", {
                          hour12: true,
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "No Date"}
                  </TableCell>{" "}
                  {/* ISO string */}
                  <TableCell>{visit.containersOffloaded}</TableCell>
                  <TableCell>{visit.containersOnloaded}</TableCell>
                  <TableCell>{visit.status}</TableCell>
                  <TableCell>{visit.berthAssigned}</TableCell>
                  <TableCell>
                    {hasRole(["Edit Vessel Visit Requests"]) && (
                      <IconButton onClick={() => handleOpenDialog(visit.visitType, visit)} color="primary">
                        <EditIcon />
                      </IconButton>
                    )}
                    {hasRole(["Delete Vessel Visit Requests"]) && (
                      <IconButton onClick={() => handleDelete(visit.id)} color="secondary">
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingId
            ? "Edit Vessel Visit Request"
            : `${visitType} Vessel Visit Request`}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Vessel Name"
                name="vesselName"
                value={formData.vesselName}
                onChange={handleChange}
                fullWidth
                required
              // disabled={!!formData.vesselName}
              // helperText={
              //   formData.vesselName
              //     ? "This field cannot be edited after it is set"
              //     : ""
              // }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="IMO Number"
                name="imoNumber"
                type="number"
                value={formData.imoNumber}
                onChange={handleChange}
                fullWidth
                required
              // disabled={!!formData.imoNumber}
              // helperText={
              //   formData.imoNumber
              //     ? "This field cannot be edited after it is set"
              //     : ""
              // }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Vessel Type"
                name="vesselType"
                value={formData.vesselType}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="LOA (m)"
                name="loa"
                type="number"
                value={formData.loa}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Draft (m)"
                name="draft"
                type="number"
                value={formData.draft}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="ETA"
                  value={formData.eta ? new Date(formData.eta) : null} // Convert ISO string to Date object
                  onChange={(date) => handleDateChange("eta", date)}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth required />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="ETD"
                  value={formData.etd ? new Date(formData.etd) : null} // Convert ISO string to Date object
                  onChange={(date) => handleDateChange("etd", date)}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth required />
                  )}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Cargo Type"
                name="cargoType"
                value={formData.cargoType}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Cargo Volume (tons)"
                name="cargoVolume"
                type="number"
                value={formData.cargoVolume}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Containers Offloaded"
                name="containersOffloaded"
                type="number"
                value={formData.containersOffloaded}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Containers Onloaded"
                name="containersOnloaded"
                type="number"
                value={formData.containersOnloaded}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.pilotage}
                    onChange={handleCheckboxChange}
                    name="pilotage"
                  />
                }
                label="Pilotage"
              />
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.tugAssistance}
                    onChange={handleCheckboxChange}
                    name="tugAssistance"
                  />
                }
                label="Tug Assistance"
              />
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.cargoHandlingEquipment}
                    onChange={handleCheckboxChange}
                    name="cargoHandlingEquipment"
                  />
                }
                label="Cargo Handling Equipment"
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Agent Name"
                name="agentName"
                value={formData.agentName}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Agent Contact"
                name="agentContact"
                value={formData.agentContact}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Number of grids"
                name="vesselGridCount"
                type="number"
                value={formData.vesselGridCount}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Number of tiers"
                name="vesselTierCount"
                type="number"
                value={formData.vesselTierCount}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Number of bays"
                name="vesselBayCount"
                type="number"
                value={formData.vesselBayCount}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
          </Grid>
          <Box
            sx={{ mt: 4, p: 2, border: "1px solid lightgrey", borderRadius: 1 }}
          >
            <Typography variant="h6" gutterBottom>
              Upload Stowage Plan (CSV)
            </Typography>

            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: "none" }}
              id="file-upload"
              ref={fileInputRef}
            />
            <label htmlFor="file-upload">
              <Button variant="contained" component="span">
                Select CSV File
              </Button>
            </label>

            {selectedFile && (
              <Typography mt={2} variant="body1">
                Selected File: {selectedFile.name}
              </Typography>
            )}

            {fileError && (
              <Typography color="error" mt={1}>
                {fileError}
              </Typography>
            )}

            <Box mt={2} sx={{ mt: 4, p: 2 }}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleClearFile}
                sx={{ ml: 2 }}
                disabled={!selectedFile}
              >
                Clear File
              </Button>
              {downloadURL && (
                <a href={downloadURL} download>
                  <Button
                    variant="contained"
                    color="secondary" // Set to purple or any color you prefer
                    sx={{ ml: 2, backgroundColor: "green" }} // Apply margin-left for spacing
                    href={downloadURL}
                    download
                  >
                    Download file
                  </Button>
                </a>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default VesselVisits;

