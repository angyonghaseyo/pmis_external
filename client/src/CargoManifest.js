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
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  Grid,
  IconButton,
  FormControlLabel,
  Switch
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { getCargoManifests, submitCargoManifest, updateCargoManifest, deleteCargoManifest } from './services/api';

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
    totalContainers: '',
    cargoVolume: '',
    containsConsolidatedCargo: false,
    cargoSummary: '',
    dangerousGoods: false,
    specialInstructions: ''
  });

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
  };

  const handleDateChange = (name) => (date) => {
    setFormData({ ...formData, [name]: date });
  };

  const handleSubmit = async () => {
    try {
      const submissionData = {
        ...formData,
        departureDate: formData.departureDate ? formData.departureDate.toISOString() : null,
        arrivalDate: formData.arrivalDate ? formData.arrivalDate.toISOString() : null,
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
        totalContainers: '',
        cargoVolume: '',
        containsConsolidatedCargo: false,
        cargoSummary: '',
        dangerousGoods: false,
        specialInstructions: ''
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
                <TableCell>Vessel Name</TableCell>
                <TableCell>Voyage Number</TableCell>
                <TableCell>Origin Port</TableCell>
                <TableCell>Destination Port</TableCell>
                <TableCell>Arrival Date</TableCell>
                <TableCell>Total Containers</TableCell>
                <TableCell>Cargo Volume (tons)</TableCell>
                <TableCell>Consolidated Cargo</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {manifests.map((manifest) => (
                <TableRow key={manifest.id}>
                  <TableCell>{manifest.vesselName}</TableCell>
                  <TableCell>{generateVoyageNumber(manifest)}</TableCell>
                  <TableCell>{manifest.originPort}</TableCell>
                  <TableCell>{manifest.destinationPort}</TableCell>
                  <TableCell>{manifest.arrivalDate ? new Date(manifest.arrivalDate).toLocaleString() : 'N/A'}</TableCell>
                  <TableCell>{manifest.totalContainers}</TableCell>
                  <TableCell>{manifest.cargoVolume}</TableCell>
                  <TableCell>{manifest.containsConsolidatedCargo ? 'Yes' : 'No'}</TableCell>
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
              <Grid item xs={12} sm={6}>
                <TextField
                  name="vesselName"
                  label="Vessel Name"
                  fullWidth
                  value={formData.vesselName}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="imoNumber"
                  label="IMO Number"
                  fullWidth
                  value={formData.imoNumber}
                  onChange={handleInputChange}
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
                  value={formData.originPort}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="destinationPort"
                  label="Destination Port"
                  fullWidth
                  value={formData.destinationPort}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="totalContainers"
                  label="Total Containers"
                  type="number"
                  fullWidth
                  value={formData.totalContainers}
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
              <Grid item xs={12}>
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
                  value={formData.cargoSummary}
                  onChange={handleInputChange}
                  margin="normal"
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
                  value={formData.specialInstructions}
                  onChange={handleInputChange}
                  margin="normal"
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