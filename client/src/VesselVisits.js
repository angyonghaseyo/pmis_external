import React, { useState, useEffect } from "react";
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
// import firebase from './firebase'; // Assume Firebase is properly configured

const VesselVisits = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [visitType, setVisitType] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [editingId, setEditingId] = useState(null);
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
  });
  const [vesselVisitsData, setVesselVisitsData] = useState([]);
  const [error, setError] = useState({});

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

  const checkAssetAvailability = async () => {
    try {
      const assetCollectionRef = collection(db, "asset");
      const assetSnapshot = await getDocs(assetCollectionRef);

      // Assuming that each document has an 'available' field
      let assetsAvailable = true;
      await assetSnapshot.forEach((doc) => {
        const asset = doc.data();
        if (!asset.available) {
          assetsAvailable = false;
        }
      });

      return assetsAvailable; // True if all assets are available, false if any are unavailable
    } catch (error) {
      console.error("Error checking asset availability:", error);
      return false; // Return false in case of error
    }
  };

  const checkFacilityAvailability = async (vesselVisitRequest) => {
    const { loa, draft, cargoType, eta, etd } = vesselVisitRequest;

    try {
      // Step 1: Check the facilityList to find berths that match the vessel's LOA, draft, and cargoType
      const facilityListCollectionRef = collection(db, "facilityList");
      const facilityListSnapshot = await getDocs(facilityListCollectionRef);
      const matchedBerths = [];

      facilityListSnapshot.forEach((doc) => {
        const berth = doc.data();

        // Check if LOA, draft, and cargoType match
        if (
          loa <= berth.lengthCapacity &&
          draft <= berth.depthCapacity &&
          cargoType === berth.cargoType
        ) {
          matchedBerths.push(berth.name); // Store the matched berth name
        }
      });

      if (matchedBerths.length === 0) {
        console.log("No berths match the vessel's requirements.");
        return false;
      }

      // Step 2: Check availability in facilitySchedule for each matched berth
      const facilityScheduleCollectionRef = collection(db, "facilitySchedule");

      const startDate = new Date(eta);
      const endDate = new Date(etd);
      console.log("The start date is " + startDate);
      console.log("The end date is " + endDate);
      console.log("The eta is " + eta);
      console.log("The etd is " + etd);

      // Loop through each matched berth
      for (const berth of matchedBerths) {
        let berthAvailable = true;

        // Iterate over the time blocks (1-hour intervals between eta and etd)
        let IteratedDate = startDate;
        while (IteratedDate <= endDate) {
          console.log("The iterated date is " + IteratedDate);
          const dateString = IteratedDate.toISOString().split("T")[0]; // Get the YYYY-MM-DD part of the timestamp
          const timeString = IteratedDate.toISOString()
            .split("T")[1]
            .split(":")
            .slice(0, 2)
            .join(":"); // Get HH:MM format
          console.log(dateString + " " + timeString);

          // Query the facilitySchedule collection for this berth and time
          const scheduleQuery = query(
            facilityScheduleCollectionRef,
            where("berthName", "==", berth),
            where("date", "==", dateString),
            where("time", "==", timeString)
          );

          const scheduleSnapshot = await getDocs(scheduleQuery);

          let isAvailable = false;
          scheduleSnapshot.forEach((scheduleDoc) => {
            const schedule = scheduleDoc.data();
            if (schedule.available) {
              isAvailable = true;
              console.log(dateString + " " + timeString + " available");
            }
          });

          if (!isAvailable) {
            berthAvailable = false;
            console.log(
              `Berth ${berth} is unavailable on ${dateString} at ${timeString}`
            );
            break; // Exit the loop if any 1-hour block is unavailable
          }

          // Move to the next hour block
          IteratedDate.setHours(IteratedDate.getHours() + 1);
        }

        // If the berth is available for the entire time range, return true and log the berth name
        if (berthAvailable) {
          console.log(`Berth ${berth} is available for the entire time range.`);
          return true;
        }
      }

      // If no berth is fully available for the entire time range, return false
      console.log("No berth is available for the entire time range.");
      return false;
    } catch (error) {
      console.error("Error checking facility availability:", error);
      return false; // Return false in case of error
    }
  };

  const checkManpowerAvailability = async () => {
    try {
      const manpowerCollectionRef = collection(db, "manpower");
      const manpowerSnapshot = await getDocs(manpowerCollectionRef);

      // Assuming that each document has an 'available' field
      let manpowerAvailable = true;
      manpowerSnapshot.forEach((doc) => {
        const manpower = doc.data();
        if (!manpower.available) {
          manpowerAvailable = false;
        }
      });

      return manpowerAvailable; // True if all manpower resources are available, false if any are unavailable
    } catch (error) {
      console.error("Error checking manpower availability:", error);
      return false; // Return false in case of error
    }
  };

  const checkResources = async () => {
    const assets = await checkAssetAvailability();
    const facilities = await checkFacilityAvailability({
      loa: formData.loa,
      draft: formData.draft,
      cargoType: formData.cargoType,
      eta: formData.eta,
      etd: formData.etd,
    });
    const manpower = await checkManpowerAvailability();

    return {
      assets,
      facilities,
      manpower,
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
      });
      setEditingId(visit.id);
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
        [name]: "Date and time cannot be earlier than the current date and time",
      }));
    } else {
      setError((prev) => ({ ...prev, [name]: "" }));
      setFormData((prev) => ({
        ...prev,
        [name]: newDate, // Convert to ISO string
      }));
    }
  };
  

  const handleSubmit = async () => {
    if (
      !formData.vesselName ||
      !formData.imoNumber ||
      !formData.vesselType ||
      !formData.loa ||
      !formData.draft ||
      !formData.eta ||
      !formData.etd ||
      !formData.cargoType ||
      !formData.cargoVolume ||
      !formData.agentName ||
      !formData.agentContact
    ) {
      alert("Please fill out all required fields");
      return;
    }

     // Simulate resource check
     const resourceCheck = await checkResources();
  
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
      resourceCheck: resourceCheck,
      status:
        // resourceCheck.manpower &&
        // resourceCheck.assets &&
        resourceCheck.facilities ? "confirmed" : "pending user intervention",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  
    try {
      const docRef = doc(db, "vesselVisitRequests", formData.imoNumber);
      await setDoc(docRef, newVisit);
  
      setVesselVisitsData((prev) => [
        ...prev,
        { ...newVisit, documentId: formData.imoNumber },
      ]);
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
            onClick={() => handleOpenDialog("Ad Hoc")}
          >
            Ad Hoc Vessel Visit
          </Button>
        </Box>
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
                <TableCell>ID</TableCell>
                <TableCell>Vessel Name</TableCell>
                <TableCell>ETA</TableCell>
                <TableCell>ETD</TableCell>
                <TableCell>Containers Offloaded</TableCell>
                <TableCell>Containers Onloaded</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vesselVisitsData.map((visit) => (
                <TableRow key={visit.documentId}>
                  <TableCell>{visit.documentId}</TableCell>
                  <TableCell>{visit.vesselName}</TableCell>
                  <TableCell>{visit.eta}</TableCell> {/* ISO string */}
                  <TableCell>{visit.etd}</TableCell> {/* ISO string */}
                  <TableCell>{visit.containersOffloaded}</TableCell>
                  <TableCell>{visit.containersOnloaded}</TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => handleOpenDialog(visit.visitType, visit)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(visit.documentId)}
                      color="secondary"
                    >
                      <DeleteIcon />
                    </IconButton>
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
          </Grid>
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