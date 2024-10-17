import React, { useState, useEffect } from "react";
import axios from "axios";
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

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const VesselVisits = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [visitType, setVisitType] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [editingId, setEditingId] = useState(null);
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
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchVesselVisits();
  }, []);

  const fetchVesselVisits = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/vessel-visits`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setVesselVisitsData(response.data);
    } catch (error) {
      console.error("Error fetching vessel visits:", error);
      setError("Failed to fetch vessel visits. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (type, visit = null) => {
    setVisitType(type);
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
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

  const handleSubmit = async () => {
    try {
      const newVisit = {
        ...formData,
        eta: formData.eta?.toISOString(),
        etd: formData.etd?.toISOString(),
      };

      if (editingId) {
        await axios.put(`${API_URL}/vessel-visits/${editingId}`, newVisit, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        await axios.post(`${API_URL}/vessel-visits`, newVisit, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }
      
      handleCloseDialog();
      fetchVesselVisits();
      setSnackbar({ open: true, message: `Vessel visit ${editingId ? 'updated' : 'created'} successfully`, severity: 'success' });
    } catch (error) {
      console.error("Error submitting vessel visit:", error);
      setSnackbar({ open: true, message: `Failed to ${editingId ? 'update' : 'create'} vessel visit`, severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/vessel-visits/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchVesselVisits();
      setSnackbar({ open: true, message: 'Vessel visit deleted successfully', severity: 'success' });
    } catch (error) {
      console.error("Error deleting vessel visit:", error);
      setSnackbar({ open: true, message: 'Failed to delete vessel visit', severity: 'error' });
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
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
            onClick={() => handleOpenDialog("Ad-Hoc")}
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
                <TableCell>IMO Number</TableCell>
                <TableCell>Vessel Name</TableCell>
                <TableCell>ETA (Local Time) </TableCell>
                <TableCell>ETD (Local Time) </TableCell>
                <TableCell>Containers Offloaded</TableCell>
                <TableCell>Containers Onloaded</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Assigned Berth</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vesselVisitsData.map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell>{visit.imoNumber}</TableCell>
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
                  </TableCell>
                  <TableCell>{visit.containersOffloaded}</TableCell>
                  <TableCell>{visit.containersOnloaded}</TableCell>
                  <TableCell>{visit.status}</TableCell>
                  <TableCell>{visit.berthAssigned}</TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => handleOpenDialog(visit.visitType, visit)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(visit.id)}
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
                    onChange={handleChange}
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
                    onChange={handleChange}
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
                    onChange={handleChange}
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