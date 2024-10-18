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
import { getCargoManifests, createCargoManifest, updateCargoManifest, deleteCargoManifest } from '../services/api';

const CargoManifest = () => {
  const [manifests, setManifests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentManifest, setCurrentManifest] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
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
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchManifests();
  }, []);

  const fetchManifests = async () => {
    try {
      setLoading(true);
      const data = await getCargoManifests();
      setManifests(data);
    } catch (err) {
      setError('Failed to fetch cargo manifests');
      console.error('Error fetching cargo manifests:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const validateForm = () => {
    const errors = {
      vesselName: !formData.vesselName.trim(),
      imoNumber: !formData.imoNumber.trim(),
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
      setLoading(true);
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
        await createCargoManifest(submissionData);
        setSnackbar({ open: true, message: 'Cargo manifest submitted successfully', severity: 'success' });
      }
      setOpenDialog(false);
      fetchManifests();
    } catch (err) {
      console.error('Error processing cargo manifest:', err);
      setSnackbar({ open: true, message: 'Error processing cargo manifest', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCargoManifest(id);
      setSnackbar({ open: true, message: 'Cargo manifest deleted successfully', severity: 'success' });
      fetchManifests();
    } catch (err) {
      console.error('Error deleting cargo manifest:', err);
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

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormErrors({});
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" height="100vh"><CircularProgress /></Box>;
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
                <TableCell>Vessel Name</TableCell>
                <TableCell>IMO Number</TableCell>
                <TableCell>Origin Port</TableCell>
                <TableCell>Destination Port</TableCell>
                <TableCell>Arrival Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {manifests.map((manifest) => (
                <TableRow key={manifest.id}>
                  <TableCell>{manifest.vesselName}</TableCell>
                  <TableCell>{manifest.imoNumber}</TableCell>
                  <TableCell>{manifest.originPort}</TableCell>
                  <TableCell>{manifest.destinationPort}</TableCell>
                  <TableCell>{manifest.arrivalDate ? new Date(manifest.arrivalDate).toLocaleString() : 'N/A'}</TableCell>
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

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>{currentManifest ? 'Edit Cargo Manifest' : 'Submit Cargo Manifest'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="vesselName"
                  label="Vessel Name"
                  fullWidth
                  required
                  value={formData.vesselName}
                  onChange={handleInputChange}
                  error={formErrors.vesselName}
                  helperText={formErrors.vesselName ? 'Vessel Name is required' : ''}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="imoNumber"
                  label="IMO Number"
                  fullWidth
                  required
                  value={formData.imoNumber}
                  onChange={handleInputChange}
                  error={formErrors.imoNumber}
                  helperText={formErrors.imoNumber ? 'IMO Number is required' : ''}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Departure Date"
                  value={formData.departureDate}
                  onChange={handleDateChange('departureDate')}
                  renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Arrival Date"
                  value={formData.arrivalDate}
                  onChange={handleDateChange('arrivalDate')}
                  renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
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
                  error={formErrors.originPort}
                  helperText={formErrors.originPort ? 'Origin Port is required' : ''}
                  margin="normal"
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
                  error={formErrors.destinationPort}
                  helperText={formErrors.destinationPort ? 'Destination Port is required' : ''}
                  margin="normal"
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
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.containsConsolidatedCargo}
                      onChange={handleInputChange}
                      name="containsConsolidatedCargo"
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
                  error={formErrors.cargoSummary}
                  helperText={formErrors.cargoSummary ? 'Cargo Summary is required' : ''}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.dangerousGoods}
                      onChange={handleInputChange}
                      name="dangerousGoods"
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
                  error={formErrors.specialInstructions}
                  helperText={formErrors.specialInstructions ? 'Special Instructions are required' : ''}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
              {currentManifest ? 'Update' : 'Submit'}
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
      </Box>
    </LocalizationProvider>
  );
};

export default CargoManifest;