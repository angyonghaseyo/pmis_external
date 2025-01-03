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
import { getUserUpdatedData } from "./services/api";
import { useAuth } from "./AuthContext";
import { CircularProgress } from "@mui/material";
import Papa from "papaparse";
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
  getDownloadURL,
  uploadBytes,
  listAll,
  deleteObject,
} from "firebase/storage";

const VesselVisits = () => {
  const { user } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [visitType, setVisitType] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    company: user.company,
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
    voyages: [
      {
        voyageNumber: "",
        departurePort: "",
        arrivalPort: "",
      },
    ],
  });
  const [vesselVisitsData, setVesselVisitsData] = useState([]);
  const [error, setError] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef(null); // Create a ref for the file input
  const [downloadURL, setDownloadURL] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (user) {
          // Change from auth.currentUser to user
          await Promise.all([
            fetchVesselVisits(),
            fetchUserProfile(user.email), // Change from auth.currentUser.uid to user.email
          ]);
        } else {
          setError("No authenticated user found");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const fetchVesselVisits = async () => {
    const querySnapshot = await getDocs(collection(db, "vesselVisitRequests"));
    const visitsArray = querySnapshot.docs.map((doc) => ({
      documentId: doc.id,
      ...doc.data(),
    }));
    setVesselVisitsData(visitsArray); // Load data into vesselVisitsData state
  };

  async function checkAssetAvailability(vesselVisitRequest) {
    const { imoNumber, eta, etd, containersOffloaded, containersOnloaded } =
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
    const assetsRef = collection(db, "assets");
    const assetSnapshot = await getDocs(assetsRef);
    const assets = assetSnapshot.docs.map((doc) => doc.data());

    // Separate assets into categories (cranes, trucks, reach stackers)
    const cranes = assets.filter(
      (asset) => asset.category === "Ship-to-Shore Cranes"
    );
    const trucks = assets.filter(
      (asset) => asset.category === "Trucks and Trailers"
    );
    const reachStackers = assets.filter(
      (asset) => asset.category === "Reach Stackers"
    );

    // Helper function to check if assets are available during a time range
    /**
     * Checks if an asset is available during a requested time period
     * @param {Object} asset - The asset object with bookedPeriod map
     * @param {string} requestedEta - Requested start time in ISO format
     * @param {string} requestedEtd - Requested end time in ISO format
     * @returns {boolean} - True if asset is available, false otherwise
     */
    function isAssetAvailable(asset, requestedEta, requestedEtd) {
      console.log("Checking availability for asset:", asset.name);

      // Input validation
      if (!asset?.bookedPeriod || !requestedEta || !requestedEtd) {
        throw new Error("Missing required parameters");
      }

      // Convert requested dates once
      const requestStart = new Date(requestedEta);
      const requestEnd = new Date(requestedEtd);

      // Iterate through each booking in bookedPeriod
      for (const [bookingId, booking] of Object.entries(asset.bookedPeriod)) {
        // Get eta and etd from the nested booking object
        const bookedStart = new Date(booking.eta);
        const bookedEnd = new Date(booking.etd);

        // Check for overlap
        if (
          !(
            (
              bookedEnd <= requestStart || // Booked period ends before requested period starts
              requestEnd <= bookedStart
            ) // Requested period ends before booked period starts
          )
        ) {
          console.log(
            `${asset.name} is not available because it has been reserved for booking ${bookingId}`
          );
          return false;
        }
      }

      return true;
    }

    // 1. Check cranes availability
    let craneCapacityPerHour = 0;
    let craneCount = 0;
    let craneArray = [];
    for (const crane of cranes) {
      if (isAssetAvailable(crane, eta, etd)) {
        console.log(
          "Crane with id " +
            crane.name +
            " is available time-wise and is being demand checked"
        );
        craneArray.push(crane);
        craneCapacityPerHour += +crane.numberOfContainers; // Unary + to coerce to number
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
          //I need to update the crane's bookedPeriod map. key: vessel's IMO number value: [eta, etd]
          craneArray.forEach((crane) => {
            crane.bookedPeriod[imoNumber] = [
              eta.toISOString(),
              etd.toISOString(),
            ];
          });
          //Next I need to setDoc
          const toBeUpdatedDocRef = doc(db, "assets", crane.name);
          await setDoc(toBeUpdatedDocRef, crane)
            .then(() => {
              console.log("Document successfully replaced");
            })
            .catch((error) => {
              console.error("Error replacing document: ", error);
            });
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
        "Truck with id " +
          truck.name +
          "is available and is being demand checked"
      );
      if (isAssetAvailable(truck, eta, etd)) {
        truckCapacityPerHour += +truck.numberOfContainers;
        truckCount += 1;
        requiredTrucks += 1; // Add to required trucks
        const requiredHoursForTrucks = totalContainers / truckCapacityPerHour;
        console.log("totalContainers is " + totalContainers);
        console.log("truckCapacityPerHour is " + truckCapacityPerHour);
        console.log("requiredHoursForTrucks is " + requiredHoursForTrucks);
        console.log("totalAvailableHours is " + totalAvailableHours);
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
          truck.bookedPeriod[imoNumber] = [
            eta.toISOString(),
            etd.toISOString(),
          ];
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
        stackerCapacityPerHour += +stacker.numberOfContainers;
        stackerCount += 1;
        requiredReachStackers += 1; // Add to required reach stackers
        const requiredHoursForReachStackers =
          totalContainersForReachStackerOnly / stackerCapacityPerHour;
        console.log("totalContainers is " + totalContainers);
        console.log("stackerCapacityPerHour is " + stackerCapacityPerHour);
        console.log(
          "requiredHoursForReachStackers is " + requiredHoursForReachStackers
        );
        console.log("totalAvailableHours is " + totalAvailableHours);
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
          stacker.bookedPeriod[imoNumber] = [
            eta.toISOString(),
            etd.toISOString(),
          ];
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
    const { imoNumber, loa, draft, cargoType, eta, etd } = vesselVisitRequest;

    // Helper function to check if assets are available during a time range
    function isBerthAvailable(facility, eta, etd) {
      for (const [key, period] of Object.entries(facility.bookedPeriod)) {
        const [bookedEta, bookedEtd] = period;
        // If the asset's booked period overlaps with the requested period, it's unavailable
        if (
          !(
            new Date(etd) <= new Date(bookedEta) ||
            new Date(eta) >= new Date(bookedEtd)
          )
        ) {
          console.log(
            "Berth " +
              facility.name +
              "is not available because it has been reserved"
          );
          return false;
        }
      }
      return true;
    }

    try {
      // Step 1: Check the facilityList to find berths that match the vessel's LOA, draft, and cargoType
      const facilityListCollectionRef = collection(db, "portConfigurations");
      const facilityListQuery = query(
        facilityListCollectionRef,
        where("type", "==", "berth")
      );
      const facilityListSnapshot = await getDocs(facilityListQuery);
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
        return {
          success: false,
          assignedBerth: "",
          adjustedEta: eta,
          adjustedEtd: etd,
        };
      }

      // Step 2: Loop through each matched berth and check whether it is available during the required hours
      for (const berth of matchedBerths) {
        if (isBerthAvailable(berth, eta, etd)) {
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
        let etaAdjustedDate = new Date(eta);
        let etdAdjustedDate = new Date(etd);
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
          eta: etaAdjustedDate.toISOString(), //star-denzel remove toISOString()
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
        //I need to update the assignedBerth's bookedPeriod map. key: vessel's IMO number value: [eta, etd]
        assignedBerth.bookedPeriod[formData.imoNumber] = [
          eta.toISOString(),
          etd.toISOString(),
        ];
        //Next I need to setDoc
        const toBeUpdatedDocRef = doc(
          db,
          "portConfigurations",
          assignedBerth.name
        );
        await setDoc(toBeUpdatedDocRef, assignedBerth)
          .then(() => {
            console.log("Document successfully replaced");
          })
          .catch((error) => {
            console.error("Error replacing document: ", error);
          });
        return {
          success: true,
          assignedBerth: assignedBerth.name,
          adjustedEta: eta,
          adjustedEtd: etd,
        };
      }
    } catch (error) {
      console.error("Error checking facility availability:", error);
      return {
        success: false,
        assignedBerth: "",
        adjustedEta: eta,
        adjustedEtd: etd,
      };
    }
  };

  const checkManpowerAvailability = async (vesselVisitRequest) => {
    try {
      const {
        eta,
        etd,
        numberOfCranesNeeded,
        numberOfTrucksNeeded,
        numberOfReachStackersNeeded,
        scheduleJson,
      } = vesselVisitRequest;

      console.log("Received vesselVisitRequest:", vesselVisitRequest);

      // Convert ETA and ETD to local time (UTC+8)
      const etaDateUTC = new Date(eta.getTime() + 8 * 60 * 60 * 1000); // ETA in UTC+8
      const etdDateUTC = new Date(etd.getTime() + 8 * 60 * 60 * 1000); // ETD in UTC+8

      console.log("Converted ETA (UTC):", etaDateUTC);
      console.log("Converted ETD (UTC):", etdDateUTC);

      // Define roles that we need to check availability for
      const rolesToCheck = [
        { role: "Crane Operator", required: numberOfCranesNeeded },
        { role: "Truck Operator", required: numberOfTrucksNeeded },
        {
          role: "Reach Stacker Operator",
          required: numberOfReachStackersNeeded,
        },
      ];

      // Helper function to check if an employee's schedule can cover the given ETA to ETD period
      function canCoverTime(scheduleJson, eta, etd) {
        const etaDate = new Date(eta);
        const etdDate = new Date(etd);

        // // Loop through each hour within the range from ETA to ETD
        // for (let currentHour = new Date(etaDate); currentHour <= etdDate; currentHour.setHours(currentHour.getHours() + 1)) {
        //   const hourStr = currentHour.getHours().toString().padStart(2, "0") + ":00"; // Format hour as "HH:00"

        //   // Format the date as 'dd/mm/yy'
        //   const day = currentHour.getDate().toString().padStart(2, "0");
        //   const month = (currentHour.getMonth() + 1).toString().padStart(2, "0");
        //   const year = currentHour.getFullYear().toString().slice(-2);
        //   const currentDay = `${day}/${month}/${year}`; // Format as 'dd/mm/yy'

        //   // Check if the hour and day exist in the scheduleJson and are marked as "Scheduled shift"
        //   if (
        //     !scheduleJson[hourStr] || // If this hour doesn't exist in the scheduleJson
        //     !scheduleJson[hourStr][currentDay] || // If this specific day within the hour doesn't exist
        //     scheduleJson[hourStr][currentDay] !== "Scheduled shift" // If the status is not "Scheduled shift"
        //   ) {
        //     return false; // Employee is not available for this hour
        //   }
        // }

        return true; // Employee is available for the entire period from ETA to ETD
      }

      // Array to hold arrays of employee IDs per role
      const roleEmployeeIds = {};

      // Scan through the collection of employees
      const employeeCollectionRef = collection(db, "employees");
      const employeeSnapshot = await getDocs(employeeCollectionRef);

      // Initialize arrays for each role
      rolesToCheck.forEach((roleCheck) => {
        roleEmployeeIds[roleCheck.role] = [];
      });

      // Go through each employee document
      employeeSnapshot.forEach((doc) => {
        const employeeData = doc.data();
        const employeeRole = employeeData.userRole;

        // Check if this employee's role matches any of the roles we need to check
        rolesToCheck.forEach((roleCheck) => {
          if (employeeRole === roleCheck.role) {
            // Store the employee ID in the respective array
            roleEmployeeIds[roleCheck.role].push(employeeData.employeeId);
          }
        });
      });

      console.log("Employee IDs per role:", roleEmployeeIds);

      // Now check if we have enough employees for each role
      const missingRoles = [];

      rolesToCheck.forEach((roleCheck) => {
        const availableEmployees = roleEmployeeIds[roleCheck.role].length;
        const workersWhoCanCover = []; // To keep track of workers who can cover the visit

        if (availableEmployees < roleCheck.required) {
          missingRoles.push({
            role: roleCheck.role,
            missing: roleCheck.required - availableEmployees,
          });
        } else {
          // Check each employee's schedule to see if they can cover the required hours
          const etaDateUTC = new Date(eta);
          const etdDateUTC = new Date(etd);

          // Loop through all employees for the current role
          roleEmployeeIds[roleCheck.role].forEach((employeeId) => {
            // Get the employee's schedule JSON (this might be retrieved from a Firestore collection or provided as scheduleJson)
            const employeeSchedule = scheduleJson; // Assuming scheduleJson is an object with employeeId as keys

            // Check if the employee can cover the required time range
            if (canCoverTime(employeeSchedule, etaDateUTC, etdDateUTC)) {
              workersWhoCanCover.push(employeeId);
            }
          });

          // Now, check if the number of workers who can cover the visit is sufficient
          if (workersWhoCanCover.length < roleCheck.required) {
            missingRoles.push({
              role: roleCheck.role,
              missing: roleCheck.required - workersWhoCanCover.length,
            });
          }
        }
      });

      if (missingRoles.length > 0) {
        return {
          success: false,
          message: "Not enough employees for one or more roles.",
          missingRoles,
        };
      }

      return {
        success: true,
        message: "Sufficient employees for all roles.",
      };
    } catch (error) {
      console.error("Error checking manpower availability:", error);
      throw new Error("Failed to check manpower availability");
    }
  };

  const checkResources = async () => {
    try {
      // Step 1: Check facility availability
      const facilitiesDemandCheckBooleanAndBerth =
        await checkFacilityAvailability({
          imoNumber: formData.imoNumber,
          loa: formData.loa,
          draft: formData.draft,
          cargoType: formData.cargoType,
          eta: formData.eta,
          etd: formData.etd,
        });

      // Step 2: Check asset availability
      const assetsDemandCheckBooleanAndQuantity = await checkAssetAvailability({
        imoNumber: formData.imoNumber,
        eta: formData.eta,
        etd: formData.etd,
        containersOffloaded: formData.containersOffloaded,
        containersOnloaded: formData.containersOnloaded,
      });

      // Step 3: Check manpower availability
      const manpowerDemandCheckBoolean = await checkManpowerAvailability({
        eta: formData.eta,
        etd: formData.etd,
        numberOfCranesNeeded:
          assetsDemandCheckBooleanAndQuantity.requiredAssets.requiredCranes,
        numberOfTrucksNeeded:
          assetsDemandCheckBooleanAndQuantity.requiredAssets.requiredTrucks,
        numberOfReachStackersNeeded:
          assetsDemandCheckBooleanAndQuantity.requiredAssets
            .requiredReachStackers,
        scheduleJson: formData.scheduleJson,
      });

      // Handle the result of manpower check
      if (manpowerDemandCheckBoolean.success) {
        console.log("Manpower is sufficient for the vessel visit!");
      } else {
        console.log(
          "Insufficient manpower:",
          manpowerDemandCheckBoolean.message
        );
        console.log(
          "Cranes available:",
          manpowerDemandCheckBoolean.cranesAvailable
        );
        console.log(
          "Trucks available:",
          manpowerDemandCheckBoolean.trucksAvailable
        );
        console.log(
          "Missing roles and counts:",
          manpowerDemandCheckBoolean.missingRoles
        );
      }

      // Return all the results
      return {
        facilitiesDemandCheckBooleanAndBerth,
        assetsDemandCheckBooleanAndQuantity,
        manpowerDemandCheckBoolean,
      };
    } catch (error) {
      console.error("Error checking resources:", error);
      return {
        success: false,
        message: "Error occurred during resource checks",
      };
    }
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
        visitType: type,
        voyages: visit.voyages || [
          {
            // Add default if voyages doesn't exist
            voyageNumber: "",
            departurePort: "",
            arrivalPort: "",
          },
        ],
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
        visitType: type,
        voyages: [
          {
            // Make sure to include voyages here too
            voyageNumber: "",
            departurePort: "",
            arrivalPort: "",
          },
        ],
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
    //clear from here
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

  const parseCSVFile = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true, // Assumes the first row contains the column headers
        skipEmptyLines: true,
        complete: function (results) {
          resolve(results.data); // results.data will be an array of objects
        },
        error: function (error) {
          reject(error);
        },
      });
    });
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
        "Please provide the number of containers that will be offloaded from the vessel"
      );
      return;
    }
    if (!formData.containersOnloaded) {
      alert(
        "Please provide the number of containers that will be onloaded to the vessel"
      );
      return;
    }

    // Simulate resource check
    const resourceCheck = await checkResources();
    // const resourceCheck = "";
    console.log(resourceCheck);

    // The dates are already stored in ISO format in formData
    if (resourceCheck.facilitiesDemandCheckBooleanAndBerth?.success) {
      const newVisit = {
        company: user.company,
        vesselName: formData.vesselName,
        imoNumber: formData.imoNumber,
        vesselType: formData.vesselType,
        loa: formData.loa,
        draft: formData.draft,
        eta: resourceCheck.facilitiesDemandCheckBooleanAndBerth.success
          ? resourceCheck.facilitiesDemandCheckBooleanAndBerth.adjustedEta.toISOString()
          : formData.eta.toISOString(),
        etd: resourceCheck.facilitiesDemandCheckBooleanAndBerth.success
          ? resourceCheck.facilitiesDemandCheckBooleanAndBerth.adjustedEtd.toISOString()
          : formData.etd.toISOString(),
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
          resourceCheck.facilitiesDemandCheckBooleanAndBerth.success,
        berthAssigned:
          resourceCheck.facilitiesDemandCheckBooleanAndBerth.assignedBerth,
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
        manpowerDemandCheckBoolean:
          resourceCheck.manpowerDemandCheckBoolean.success,
        // status for UI purposes
        status:
          resourceCheck.manpowerDemandCheckBoolean.success &&
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
        stowageplan: formData.stowageplan, // Store the parsed stowage plan array
        visitType: formData.visitType,
        voyages: formData.voyages,
      };

      try {
        // Parsing the CSV file and storing as an array of objects (instead of URL)
        const parsedCSVData = await parseCSVFile(selectedFile);
        newVisit.stowageplan = parsedCSVData;
        console.log("Stowage plan data stored as an array:", parsedCSVData);
      } catch (error) {
        setFileError("Error parsing the CSV file.");
        console.error("Error parsing the CSV file:", error);
        return; // Exit the function if CSV parsing fails
      }

      try {
        const docRef = doc(db, "vesselVisitRequests", formData.imoNumber);
        await setDoc(docRef, newVisit, { merge: false });

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
    }
  };

  const handleDelete = async (id) => {
    setDeleteConfirmation(null); // Close dialog after deletion
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

  const fetchUserProfile = async (userEmail) => {
    try {
      const profileData = await getUserUpdatedData(userEmail);
      setUserProfile(profileData);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setError("Failed to fetch user profile. Please try again later.");
    }
  };

  const hasRole = (requiredRoles) => {
    if (!userProfile || !Array.isArray(userProfile.accessRights)) return false;

    // Check if the user has any of the required roles
    const hasRequiredRole = requiredRoles.some((role) =>
      userProfile.accessRights.includes(role)
    );

    // Return true if the user has a required role or is an Admin
    return hasRequiredRole || userProfile.role === "Admin";
  };

  if (isLoading) {
    return (
      <Container
        maxWidth="lg"
        sx={{
          mt: 4,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
      </Container>
    );
  }

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
        {hasRole(["Create Vessel Visit Request"]) && (
          <Box>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleOpenDialog("Scheduled")}
              sx={{ mr: 2 }}
            >
              Scheduled Vessel Visit
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleOpenDialog("Ad-Hoc")}
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
                {hasRole([
                  "Edit Vessel Visit Requests",
                  "Delete Vessel Visit Requests",
                ]) && <TableCell>Actions</TableCell>}
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
                      : "Invalid Date"}
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
                      : "Invalid Date"}
                  </TableCell>{" "}
                  {/* ISO string */}
                  <TableCell>{visit.containersOffloaded}</TableCell>
                  <TableCell>{visit.containersOnloaded}</TableCell>
                  <TableCell>{visit.status}</TableCell>
                  <TableCell>{visit.berthAssigned}</TableCell>
                  <TableCell>
                    {hasRole(["Edit Vessel Visit Requests"]) && (
                      <IconButton
                        onClick={() => handleOpenDialog(visit.visitType, visit)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                    {hasRole(["Delete Vessel Visit Requests"]) && (
                      <IconButton
                        onClick={() => setDeleteConfirmation(visit.documentId)}
                        color="secondary"
                      >
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
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Voyage Details
              </Typography>
              <Typography variant="h7" gutterBottom sx={{ mb: 2 }}>
                (Starting from the voyage that includes Oceania Port)
              </Typography>

              {formData.voyages.map((voyage, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Voyage Number"
                        value={voyage.voyageNumber}
                        onChange={(e) => {
                          const newVoyages = [...formData.voyages];
                          newVoyages[index].voyageNumber = e.target.value;
                          setFormData({ ...formData, voyages: newVoyages });
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Port of Departure"
                        value={voyage.departurePort}
                        onChange={(e) => {
                          const newVoyages = [...formData.voyages];
                          newVoyages[index].departurePort = e.target.value;
                          setFormData({ ...formData, voyages: newVoyages });
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Port of Arrival"
                        value={voyage.arrivalPort}
                        onChange={(e) => {
                          const newVoyages = [...formData.voyages];
                          newVoyages[index].arrivalPort = e.target.value;
                          setFormData({ ...formData, voyages: newVoyages });
                        }}
                      />
                    </Grid>
                  </Grid>
                  {formData.voyages.length > 1 && (
                    <Button
                      color="error"
                      onClick={() => {
                        const newVoyages = formData.voyages.filter(
                          (_, i) => i !== index
                        );
                        setFormData({ ...formData, voyages: newVoyages });
                      }}
                      sx={{ mt: 1 }}
                    >
                      Remove Voyage
                    </Button>
                  )}
                </Box>
              ))}
              <Button
                variant="outlined"
                onClick={() => {
                  setFormData({
                    ...formData,
                    voyages: [
                      ...formData.voyages,
                      { voyageNumber: "", departurePort: "", arrivalPort: "" },
                    ],
                  });
                }}
                sx={{ mt: 1 }}
              >
                Add Another Voyage
              </Button>
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

      <Dialog
        open={Boolean(deleteConfirmation)}
        onClose={() => setDeleteConfirmation(null)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this vessel visit request? This
            action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmation(null)}>Cancel</Button>
          <Button
            onClick={() => handleDelete(deleteConfirmation)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default VesselVisits;
