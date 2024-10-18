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
  CircularProgress,
  Snackbar,
  Alert
} from "@mui/material";
import { LocalizationProvider, DateTimePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Close } from "@mui/icons-material";
import { getUserData } from "../services/api";
import Papa from 'papaparse';
import {
  getVesselVisits,
  createVesselVisit,
  updateVesselVisit,
  deleteVesselVisit,
  uploadStowagePlan,
  deleteStowagePlan
} from "../services/api";

const VesselVisits = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [visitType, setVisitType] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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
    requiredCranes: 0,
    requiredTrucks: 0,
    requiredReachStackers: 0,
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
  });
  const [vesselVisitsData, setVesselVisitsData] = useState([]);
  const [error, setError] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchVesselVisits(),
          fetchUserProfile()
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
        setSnackbar({ open: true, message: 'Error fetching data. Please try again.', severity: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchVesselVisits = async () => {
    try {
      const data = await getVesselVisits();
      setVesselVisitsData(data);
    } catch (error) {
      console.error('Error fetching vessel visits:', error);
      setSnackbar({ open: true, message: 'Error fetching vessel visits. Please try again.', severity: 'error' });
    }
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
        [name]: newDate,
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== "text/csv") {
      setFileError("Please upload a valid CSV file.");
      setSelectedFile(null);
    } else {
      setFileError("");
      setSelectedFile(file);
    }
  };

  const handleClearFile = async () => {
    if (editingId && formData.stowageplanURL) {
      try {
        await deleteStowagePlan(editingId);
        setFormData(prev => ({ ...prev, stowageplanURL: '' }));
        setSnackbar({ open: true, message: 'Stowage plan deleted successfully', severity: 'success' });
      } catch (error) {
        console.error("Error deleting stowage plan:", error);
        setSnackbar({ open: true, message: 'Error deleting stowage plan. Please try again.', severity: 'error' });
      }
    }
    setSelectedFile(null);
    setFileError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const parseCSVFile = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          resolve(results.data);
        },
        error: function (error) {
          reject(error);
        }
      });
    });
  };

  const handleSubmit = async () => {
    if (!formData.vesselName || !formData.imoNumber || !formData.vesselType || !formData.loa || !formData.draft ||
        !formData.eta || !formData.etd || !formData.cargoType || !formData.cargoVolume || !formData.agentName ||
        !formData.containersOffloaded || !formData.containersOnloaded) {
      setSnackbar({ open: true, message: 'Please fill in all required fields', severity: 'error' });
      return;
    }

    try {
      let stowagePlanData = null;
      if (selectedFile) {
        stowagePlanData = await parseCSVFile(selectedFile);
      }

      const visitData = {
        ...formData,
        eta: formData.eta.toISOString(),
        etd: formData.etd.toISOString(),
        stowagePlan: stowagePlanData,
      };

      if (editingId) {
        await updateVesselVisit(editingId, visitData);
        if (selectedFile) {
          await uploadStowagePlan(editingId, selectedFile);
        }
        setSnackbar({ open: true, message: 'Vessel visit updated successfully', severity: 'success' });
      } else {
        const newVisitId = await createVesselVisit(visitData);
        if (selectedFile) {
          await uploadStowagePlan(newVisitId, selectedFile);
        }
        setSnackbar({ open: true, message: 'Vessel visit created successfully', severity: 'success' });
      }

      handleCloseDialog();
      fetchVesselVisits();
    } catch (error) {
      console.error("Error submitting vessel visit:", error);
      setSnackbar({ open: true, message: 'Error submitting vessel visit. Please try again.', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteVesselVisit(id);
      setSnackbar({ open: true, message: 'Vessel visit deleted successfully', severity: 'success' });
      fetchVesselVisits();
    } catch (error) {
      console.error("Error deleting vessel visit:", error);
      setSnackbar({ open: true, message: 'Error deleting vessel visit. Please try again.', severity: 'error' });
    }
  };

  const handleOpenDialog = (type, visit = null) => {
    setVisitType(type);
    setSelectedFile(null);
    setFileError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
    if (visit) {
      setFormData({
        ...visit,
        eta: visit.eta ? new Date(visit.eta) : null,
        etd: visit.etd ? new Date(visit.etd) : null,
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
        vesselGridCount: 0,
        vesselBayCount: 0,
        vesselTierCount: 0,
        stowageplanURL: "",
        visitType: type,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError({});
  };

  const handleTabChange = (event, newValue) => setTabValue(newValue);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const fetchUserProfile = async () => {
    try {
      const profileData = await getUserData();
      setUserProfile(profileData);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setSnackbar({ open: true, message: 'Error fetching user profile. Please try again.', severity: 'error' });
    }
  };

  const hasRole = (requiredRoles) => {
    if (!userProfile || !Array.isArray(userProfile.accessRights)) return false;
    const hasRequiredRole = requiredRoles.some(role => userProfile.accessRights.includes(role));
    return hasRequiredRole || userProfile.role === 'Admin';
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">Vessel Visits</Typography>
        {hasRole(["Create Vessel Visit Request"]) && (
          <Box>
            <Button variant="contained" color="primary" onClick={() => handleOpenDialog("Scheduled")} sx={{ mr: 2 }}>
              Scheduled Vessel Visit
            </Button>
            <Button variant="contained" color="primary" onClick={() => handleOpenDialog("Ad-Hoc")}>
              Ad Hoc Vessel Visit
            </Button>
          </Box>
        )}
      </Box>

      <Tabs value={tabValue} onChange={handleTabChange} aria-label="Vessel Visit Tabs">
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
                <TableCell>ETA (Local Time)</TableCell>
                <TableCell>ETD (Local Time)</TableCell>
                <TableCell>Containers Offloaded</TableCell>
                <TableCell>Containers Onloaded</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Assigned Berth</TableCell>
                {hasRole(["Edit Vessel Visit Requests", "Delete Vessel Visit Requests"]) && <TableCell>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {vesselVisitsData.map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell>{visit.imoNumber}</TableCell>
                  <TableCell>{visit.vesselName}</TableCell>
                  <TableCell>
                    {visit.eta ? new Date(visit.eta).toLocaleString("en-SG", {
                      hour12: true,
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    }) : "No Date"}
                  </TableCell>
                  <TableCell>
                    {visit.etd ? new Date(visit.etd).toLocaleString("en-SG", {
                      hour12: true,
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    }) : "No Date"}
                  </TableCell>
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

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
        {editingId ? "Edit Vessel Visit Request" : `${visitType} Vessel Visit Request`}
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
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
                  value={formData.eta}
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
                  value={formData.etd}
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
          <Box sx={{ mt: 4, p: 2, border: "1px solid lightgrey", borderRadius: 1 }}>
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

            <Box mt={2}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleClearFile}
                disabled={!selectedFile && !formData.stowageplanURL}
              >
                Clear File
              </Button>
              {formData.stowageplanURL && (
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ ml: 2 }}
                  href={formData.stowageplanURL}
                  download
                >
                  Download Current Stowage Plan
                </Button>
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

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default VesselVisits;