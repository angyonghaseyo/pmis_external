import React, { useState, useEffect } from 'react';
import { Box, Button, Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogActions, DialogContent, DialogTitle, TextField, FormControlLabel, Checkbox, Grid, Tabs, Tab, IconButton } from '@mui/material';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getUserData } from './services/api';
import { auth } from './firebaseConfig';

const VesselVisits = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [visitType, setVisitType] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [formData, setFormData] = useState({
    vesselName: '',
    imoNumber: '',
    vesselType: '',
    loa: '',
    draft: '',
    eta: null,
    etd: null,
    cargoType: '',
    cargoVolume: '',
    pilotage: false,
    tugAssistance: false,
    cargoHandlingEquipment: false,
    agentName: '',
    agentContact: '',
  });
  const [error, setError] = useState({});

  const [vesselVisitsData, setVesselVisitsData] = useState([
    {
      id: 1,
      vesselName: "Vessel A",
      visitType: "Scheduled",
      arrivalDate: "2024-10-01 10:00",
      departureDate: "2024-10-03 14:00",
      cargoType: "Container",
      cargoVolume: 500,
      allocatedBerth: "Berth 5",
      completed: false,
      pilotage: true,
      tugAssistance: false,
      cargoHandlingEquipment: true,
      agentName: 'Jester',
      agentContact: 'jester@gmail.com'
    }
  ]);

  const handleOpenDialog = (type, visit = null) => {
    setVisitType(type);
    if (visit) {
      setFormData({
        vesselName: visit.vesselName,
        imoNumber: visit.imoNumber,
        vesselType: visit.vesselType,
        loa: visit.loa,
        draft: visit.draft,
        eta: new Date(visit.arrivalDate),
        etd: new Date(visit.departureDate),
        cargoType: visit.cargoType,
        cargoVolume: visit.cargoVolume,
        pilotage: visit.pilotage || false,
        tugAssistance: visit.tugAssistance || false,
        cargoHandlingEquipment: visit.cargoHandlingEquipment || false,
        agentName: visit.agentName || '',
        agentContact: visit.agentContact || '',
      });
      setEditingId(visit.id);
    } else {
      setEditingId(null);
      setFormData({
        vesselName: '',
        imoNumber: '',
        vesselType: '',
        loa: '',
        draft: '',
        eta: null,
        etd: null,
        cargoType: '',
        cargoVolume: '',
        pilotage: false,
        tugAssistance: false,
        cargoHandlingEquipment: false,
        agentName: '',
        agentContact: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      vesselName: '',
      imoNumber: '',
      vesselType: '',
      loa: '',
      draft: '',
      eta: null,
      etd: null,
      cargoType: '',
      cargoVolume: '',
      pilotage: false,
      tugAssistance: false,
      cargoHandlingEquipment: false,
      agentName: '',
      agentContact: '',
    });
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
      setError((prev) => ({ ...prev, [name]: 'Date and time cannot be earlier than the current date and time' }));
    } else {
      setError((prev) => ({ ...prev, [name]: '' }));
      setFormData((prev) => ({ ...prev, [name]: newDate }));
    }
  };

  const handleSubmit = () => {
    if (!formData.vesselName || !formData.imoNumber || !formData.vesselType || !formData.loa || !formData.draft || !formData.eta || !formData.etd || !formData.cargoType || !formData.cargoVolume || !formData.agentName || !formData.agentContact) {
      alert('Please fill out all required fields');
      return;
    }

    if (editingId) {
      setVesselVisitsData(vesselVisitsData.map((visit) =>
        visit.id === editingId ? { ...visit, ...formData, arrivalDate: formData.eta.toISOString().slice(0, 16), departureDate: formData.etd.toISOString().slice(0, 16) } : visit
      ));
    } else {
      const newVisit = {
        ...formData,
        id: vesselVisitsData.length + 1,
        arrivalDate: formData.eta.toISOString().slice(0, 16),
        departureDate: formData.etd.toISOString().slice(0, 16),
        visitType,
        completed: false
      };
      setVesselVisitsData([...vesselVisitsData, newVisit]);
    }

    handleCloseDialog();
  };

  const handleDelete = (id) => {
    const updatedData = vesselVisitsData.filter((visit) => visit.id !== id);
    setVesselVisitsData(updatedData);
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
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

      <Tabs value={tabValue} onChange={handleTabChange} aria-label="Vessel Visit Tabs">
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
                <TableCell>Visit Type</TableCell>
                <TableCell>ETA (Arrival)</TableCell>
                <TableCell>ETD (Departure)</TableCell>
                <TableCell>Cargo Type</TableCell>
                <TableCell>Cargo Volume (tons)</TableCell>
                <TableCell>Allocated Berth</TableCell>
                {hasRole(["Edit Vessel Visit Requests", "Delete Vessel Visit Requests"]) && (
                  <TableCell>Actions</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {vesselVisitsData.filter(visit => !visit.completed).map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell>{visit.id}</TableCell>
                  <TableCell>{visit.vesselName}</TableCell>
                  <TableCell>{visit.visitType}</TableCell>
                  <TableCell>{visit.arrivalDate}</TableCell>
                  <TableCell>{visit.departureDate}</TableCell>
                  <TableCell>{visit.cargoType}</TableCell>
                  <TableCell>{visit.cargoVolume}</TableCell>
                  <TableCell>{visit.allocatedBerth ? visit.allocatedBerth : "Pending"}</TableCell>
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

      {tabValue === 1 && (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Vessel Name</TableCell>
                <TableCell>Visit Type</TableCell>
                <TableCell>ETA (Arrival)</TableCell>
                <TableCell>ETD (Departure)</TableCell>
                <TableCell>Cargo Type</TableCell>
                <TableCell>Cargo Volume (tons)</TableCell>
                <TableCell>Allocated Berth</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vesselVisitsData.filter(visit => visit.completed).map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell>{visit.id}</TableCell>
                  <TableCell>{visit.vesselName}</TableCell>
                  <TableCell>{visit.visitType}</TableCell>
                  <TableCell>{visit.arrivalDate}</TableCell>
                  <TableCell>{visit.departureDate}</TableCell>
                  <TableCell>{visit.cargoType}</TableCell>
                  <TableCell>{visit.cargoVolume}</TableCell>
                  <TableCell>{visit.allocatedBerth}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? 'Edit Vessel Visit Request' : `${visitType} Vessel Visit Request`}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6">Vessel Information</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField label="Vessel Name" name="vesselName" value={formData.vesselName} onChange={handleChange} fullWidth margin="dense" required />
            </Grid>
            <Grid item xs={6}>
              <TextField label="IMO Number" name="imoNumber" type="number" value={formData.imoNumber} onChange={handleChange} fullWidth margin="dense" required />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Vessel Type" name="vesselType" value={formData.vesselType} onChange={handleChange} fullWidth margin="dense" required />
            </Grid>
            <Grid item xs={3}>
              <TextField label="LOA (m)" name="loa" type="number" inputProps={{ step: "0.1" }} value={formData.loa} onChange={handleChange} fullWidth margin="dense" required />
            </Grid>
            <Grid item xs={3}>
              <TextField label="Draft (m)" name="draft" type="number" inputProps={{ step: "0.1" }} value={formData.draft} onChange={handleChange} fullWidth margin="dense" required />
            </Grid>

            {/* Voyage Information */}
            <Grid item xs={12}>
              <Typography variant="h6">Voyage Information</Typography>
            </Grid>
            <Grid item xs={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="ETA (Estimated Time of Arrival)"
                  value={formData.eta}
                  onChange={(date) => handleDateChange('eta', date)}
                  renderInput={(params) => <TextField {...params} fullWidth margin="dense" required error={!!error.eta} helperText={error.eta} />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="ETD (Estimated Time of Departure)"
                  value={formData.etd}
                  onChange={(date) => handleDateChange('etd', date)}
                  renderInput={(params) => <TextField {...params} fullWidth margin="dense" required error={!!error.etd} helperText={error.etd} />}
                />
              </LocalizationProvider>
            </Grid>

            {/* Cargo Information */}
            <Grid item xs={12}>
              <Typography variant="h6">Cargo Information</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField label="Cargo Type" name="cargoType" value={formData.cargoType} onChange={handleChange} fullWidth margin="dense" required />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Cargo Volume (tons)" name="cargoVolume" type="number" inputProps={{ min: 0 }} value={formData.cargoVolume} onChange={handleChange} fullWidth margin="dense" required />
            </Grid>

            {/* Services Requested */}
            <Grid item xs={12}>
              <Typography variant="h6">Services Requested</Typography>
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel
                control={<Checkbox checked={formData.pilotage} onChange={handleCheckboxChange} name="pilotage" />}
                label="Pilotage"
              />
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel
                control={<Checkbox checked={formData.tugAssistance} onChange={handleCheckboxChange} name="tugAssistance" />}
                label="Tug Assistance"
              />
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel
                control={<Checkbox checked={formData.cargoHandlingEquipment} onChange={handleCheckboxChange} name="cargoHandlingEquipment" />}
                label="Cargo Handling Equipment"
              />
            </Grid>

            {/* Agent Information */}
            <Grid item xs={12}>
              <Typography variant="h6">Agent Information</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField label="Agent Name" name="agentName" value={formData.agentName} onChange={handleChange} fullWidth margin="dense" required />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Agent Contact" name="agentContact" value={formData.agentContact} onChange={handleChange} fullWidth margin="dense" required />
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
