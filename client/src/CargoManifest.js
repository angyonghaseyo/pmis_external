import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
  Grid,
  FormControlLabel,
  Switch
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { submitCargoManifest, updateCargoManifest, deleteCargoManifest } from './services/api';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';

const CargoManifest = () => {
  const [manifests, setManifests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentManifest, setCurrentManifest] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [vesselVisits, setVesselVisits] = useState([]);
  const [formData, setFormData] = useState({
    vesselName: '',
    imoNumber: '',
    departureDate: null,
    arrivalDate: null,
    originPort: '',
    destinationPort: '',
    containersOffloaded: '',
    containersOnloaded: '',
    cargoVolume: '',
    containsConsolidatedCargo: false,
    cargoSummary: '',
    dangerousGoods: false,
    specialInstructions: '',
    status: 'Pending'
  });
  const [formErrors, setFormErrors] = useState({
    originPort: false,
    destinationPort: false,
    cargoSummary: false,
    specialInstructions: false
  });
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchManifests(),
          fetchVesselVisits(),
        ]);
      } catch (err) {
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchManifests = async () => {
    try {
      const response = await fetch('http://localhost:5001/cargo-manifests');
      if (!response.ok) {
        throw new Error('Failed to fetch cargo manifests');
      }
      const data = await response.json();
      setManifests(data);
    } catch (err) {
      console.error('Error fetching cargo manifests:', err);
      setError('Failed to fetch cargo manifests');
    }
  };
  const fetchVesselVisits = async () => {
    try {
      const response = await fetch('http://localhost:5001/vessel-visits-confirmed-without-manifests');
      if (!response.ok) {
        throw new Error('Failed to fetch vessel visits');
      }
      const data = await response.json();
      setVesselVisits(data);
    } catch (err) {
      console.error('Error fetching vessel visits:', err);
      setError('Failed to fetch vessel visits');
    }
  }

  const handleInputChange = (event) => {
    const { name, value, checked, type } = event.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    setFormErrors({
      ...formErrors,
      [name]: false
    });
  };

  const handleDateChange = (name) => (date) => {
    setFormData({ ...formData, [name]: date });
  };

  const handleImoNumberChange = (event) => {
    const selectedImoNumber = event.target.value;
    const selectedVessel = vesselVisits.find(visit => visit.imoNumber === selectedImoNumber);

    if (selectedVessel) {
      setFormData({
        ...formData,
        imoNumber: selectedImoNumber,
        vesselName: selectedVessel.vesselName,
        departureDate: new Date(selectedVessel.etd),
        arrivalDate: new Date(selectedVessel.eta),
        containersOffloaded: selectedVessel.containersOffloaded,
        containersOnloaded: selectedVessel.containersOnloaded,
        cargoVolume: selectedVessel.cargoVolume || ''
      });
    }
  };

  const validateForm = () => {
    const errors = {
      originPort: !formData.originPort.trim(),
      destinationPort: !formData.destinationPort.trim(),
      cargoSummary: !formData.cargoSummary.trim(),
      specialInstructions: !formData.specialInstructions.trim()
    };
    setFormErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setSnackbar({ open: true, message: 'Please fill in all required fields', severity: 'error' });
      return;
    }

    try {
      const submissionData = {
        ...formData,
        departureDate: formData.departureDate ? formData.departureDate.toISOString() : null,
        arrivalDate: formData.arrivalDate ? formData.arrivalDate.toISOString() : null,
        containersOffloaded: Number(formData.containersOffloaded),
        containersOnloaded: Number(formData.containersOnloaded),
        cargoVolume: Number(formData.cargoVolume),
        status: 'Pending'
      };

      if (currentManifest) {
        await updateCargoManifest(currentManifest.id, submissionData);
        setSnackbar({ open: true, message: 'Cargo manifest updated successfully', severity: 'success' });
      } else {
        await submitCargoManifest(submissionData);
        setSnackbar({ open: true, message: 'Cargo manifest submitted successfully', severity: 'success' });
      }
      setOpenDialog(false);
      fetchManifests();
    } catch (err) {
      setSnackbar({ open: true, message: 'Error processing cargo manifest', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCargoManifest(id);
      setSnackbar({ open: true, message: 'Cargo manifest deleted successfully', severity: 'success' });
      fetchManifests();
    } catch (err) {
      setSnackbar({ open: true, message: 'Error deleting cargo manifest', severity: 'error' });
    }
  };

  const handleOpenDialog = (manifest = null) => {
    if (manifest) {
      setCurrentManifest(manifest);
      setFormData({
        ...manifest,
        departureDate: manifest.departureDate ? new Date(manifest.departureDate) : null,
        arrivalDate: manifest.arrivalDate ? new Date(manifest.arrivalDate) : null,
      });
    } else {
      setCurrentManifest(null);
      setFormData({
        vesselName: '',
        imoNumber: '',
        departureDate: null,
        arrivalDate: null,
        originPort: '',
        destinationPort: '',
        containersOffloaded: '',
        containersOnloaded: '',
        cargoVolume: '',
        containsConsolidatedCargo: false,
        cargoSummary: '',
        dangerousGoods: false,
        specialInstructions: '',
        status: 'Pending'
      });
    }
    setOpenDialog(true);
  };

  const generateVoyageNumber = (manifest) => {
    let datePart = 'YYYYMMDD';
    if (manifest.departureDate) {
      try {
        const date = new Date(manifest.departureDate);
        if (!isNaN(date.getTime())) {
          datePart = date.toISOString().split('T')[0].replace(/-/g, '');
        }
      } catch (error) {
        console.error('Invalid date:', manifest.departureDate);
      }
    }
    return `${manifest.imoNumber}-${datePart}-${manifest.originPort.slice(0, 3).toUpperCase()}`;
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Cargo Manifests</Typography>
        <Button variant="contained" onClick={() => handleOpenDialog()} sx={{ mb: 2 }}>
          Submit New Cargo Manifest
        </Button>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Voyage Number</TableCell>
                <TableCell>Origin Port</TableCell>
                <TableCell>Destination Port</TableCell>
                <TableCell>Arrival Date</TableCell>
                <TableCell>Containers Offloaded</TableCell>
                <TableCell>Containers Onloaded</TableCell>
                <TableCell>Cargo Volume (tons)</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {manifests.map((manifest) => (
                <TableRow key={manifest.id}>
                  <TableCell>{generateVoyageNumber(manifest)}</TableCell>
                  <TableCell>{manifest.originPort}</TableCell>
                  <TableCell>{manifest.destinationPort}</TableCell>
                  <TableCell>{manifest.arrivalDate ? new Date(manifest.arrivalDate).toLocaleString() : 'N/A'}</TableCell>
                  <TableCell>{manifest.containersOffloaded}</TableCell>
                  <TableCell>{manifest.containersOnloaded}</TableCell>
                  <TableCell>{manifest.cargoVolume}</TableCell>
                  <TableCell>{manifest.status}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(manifest)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(manifest.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>{currentManifest ? 'Edit Cargo Manifest' : 'Submit Cargo Manifest'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  name="imoNumber"
                  label="IMO Number"
                  fullWidth
                  value={formData.imoNumber}
                  onChange={handleImoNumberChange}
                  margin="normal"
                  InputLabelProps={{
                    style: { color: 'black' },
                  }}
                >
                  {vesselVisits.map((visit) => (
                    <MenuItem key={visit.imoNumber} value={visit.imoNumber}>
                      {visit.imoNumber}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="vesselName"
                  label="Vessel Name"
                  fullWidth
                  value={formData.vesselName}
                  onChange={handleInputChange}
                  margin="normal"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="cargoVolume"
                  label="Cargo Volume (tons)"
                  type="number"
                  fullWidth
                  value={formData.cargoVolume}
                  onChange={handleInputChange}
                  margin="normal"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Departure Date"
                  value={formData.departureDate}
                  onChange={handleDateChange('departureDate')}
                  renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                  readOnly
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Arrival Date"
                  value={formData.arrivalDate}
                  onChange={handleDateChange('arrivalDate')}
                  renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                  readOnly
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="containersOffloaded"
                  label="Containers Offloaded"
                  type="number"
                  fullWidth
                  value={formData.containersOffloaded}
                  onChange={handleInputChange}
                  margin="normal"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="containersOnloaded"
                  label="Containers Onloaded"
                  type="number"
                  fullWidth
                  value={formData.containersOnloaded}
                  onChange={handleInputChange}
                  margin="normal"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="originPort"
                  label="Origin Port"
                  fullWidth
                  required
                  value={formData.originPort}
                  onChange={handleInputChange}
                  margin="normal"
                  error={formErrors.originPort}
                  helperText={formErrors.originPort ? 'Origin Port is required' : ''}
                  InputLabelProps={{
                    style: { color: 'black' },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="destinationPort"
                  label="Destination Port"
                  fullWidth
                  required
                  value={formData.destinationPort}
                  onChange={handleInputChange}
                  margin="normal"
                  error={formErrors.destinationPort}
                  helperText={formErrors.destinationPort ? 'Destination Port is required' : ''}
                  InputLabelProps={{
                    style: { color: 'black' },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.containsConsolidatedCargo}
                      onChange={handleInputChange}
                      name="containsConsolidatedCargo"
                      color="primary"
                    />
                  }
                  label="Contains Consolidated Cargo"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="cargoSummary"
                  label="Cargo Summary"
                  fullWidth
                  multiline
                  rows={4}
                  required
                  value={formData.cargoSummary}
                  onChange={handleInputChange}
                  margin="normal"
                  error={formErrors.cargoSummary}
                  helperText={formErrors.cargoSummary ? 'Cargo Summary is required' : ''}
                  InputLabelProps={{
                    style: { color: 'black' },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.dangerousGoods}
                      onChange={handleInputChange}
                      name="dangerousGoods"
                      color="primary"
                    />
                  }
                  label="Contains Dangerous Goods"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="specialInstructions"
                  label="Special Instructions"
                  fullWidth
                  multiline
                  rows={4}
                  required
                  value={formData.specialInstructions}
                  onChange={handleInputChange}
                  margin="normal"
                  error={formErrors.specialInstructions}
                  helperText={formErrors.specialInstructions ? 'Special Instructions are required' : ''}
                  InputLabelProps={{
                    style: { color: 'black' },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="status"
                  label="Status"
                  fullWidth
                  value={formData.status}
                  margin="normal"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
              {currentManifest ? 'Update' : 'Submit'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default CargoManifest;