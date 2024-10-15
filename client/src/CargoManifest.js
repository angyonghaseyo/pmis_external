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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton
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
    voyageNumber: '',
    departureDate: null,
    originPort: '',
    destinationPort: '',
    eta: null,
    etd: null,
    containerNumber: '',
    containerSize: '',
    containerType: '',
    sealNumber: '',
    grossWeight: '',
    netWeight: '',
    cargoDescription: '',
    packageCount: '',
    packageType: '',
    hsCode: '',
    shipperName: '',
    shipperAddress: '',
    consigneeName: '',
    consigneeAddress: '',
    bookingNumber: '',
    billOfLadingNumber: '',
    customsStatus: '',
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
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDateChange = (name) => (date) => {
    setFormData({ ...formData, [name]: date });
  };

  const handleSubmit = async () => {
    try {
      if (currentManifest) {
        await updateCargoManifest(currentManifest.id, formData);
        setSnackbar({ open: true, message: 'Cargo manifest updated successfully', severity: 'success' });
      } else {
        await submitCargoManifest(formData);
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
      setFormData(manifest);
    } else {
      setCurrentManifest(null);
      setFormData({
        vesselName: '',
        imoNumber: '',
        voyageNumber: '',
        departureDate: null,
        originPort: '',
        destinationPort: '',
        eta: null,
        etd: null,
        containerNumber: '',
        containerSize: '',
        containerType: '',
        sealNumber: '',
        grossWeight: '',
        netWeight: '',
        cargoDescription: '',
        packageCount: '',
        packageType: '',
        hsCode: '',
        shipperName: '',
        shipperAddress: '',
        consigneeName: '',
        consigneeAddress: '',
        bookingNumber: '',
        billOfLadingNumber: '',
        customsStatus: '',
        specialInstructions: ''
      });
    }
    setOpenDialog(true);
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
                <TableCell>ETA</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {manifests.map((manifest) => (
                <TableRow key={manifest.id}>
                  <TableCell>{manifest.vesselName}</TableCell>
                  <TableCell>{manifest.voyageNumber}</TableCell>
                  <TableCell>{manifest.originPort}</TableCell>
                  <TableCell>{manifest.destinationPort}</TableCell>
                  <TableCell>{manifest.eta ? new Date(manifest.eta).toLocaleString() : 'N/A'}</TableCell>
                  <TableCell>{manifest.customsStatus}</TableCell>
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
                <TextField
                  name="voyageNumber"
                  label="Voyage Number"
                  fullWidth
                  value={formData.voyageNumber}
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
                <DateTimePicker
                  label="ETA"
                  value={formData.eta}
                  onChange={handleDateChange('eta')}
                  renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="ETD"
                  value={formData.etd}
                  onChange={handleDateChange('etd')}
                  renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="containerNumber"
                  label="Container Number"
                  fullWidth
                  value={formData.containerNumber}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="containerSize"
                  label="Container Size"
                  fullWidth
                  value={formData.containerSize}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="containerType"
                  label="Container Type"
                  fullWidth
                  value={formData.containerType}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="sealNumber"
                  label="Seal Number"
                  fullWidth
                  value={formData.sealNumber}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="grossWeight"
                  label="Gross Weight"
                  fullWidth
                  value={formData.grossWeight}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="netWeight"
                  label="Net Weight"
                  fullWidth
                  value={formData.netWeight}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="cargoDescription"
                  label="Cargo Description"
                  fullWidth
                  multiline
                  rows={4}
                  value={formData.cargoDescription}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="packageCount"
                  label="Package Count"
                  fullWidth
                  value={formData.packageCount}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="packageType"
                  label="Package Type"
                  fullWidth
                  value={formData.packageType}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="hsCode"
                  label="HS Code"
                  fullWidth
                  value={formData.hsCode}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="shipperName"
                  label="Shipper Name"
                  fullWidth
                  value={formData.shipperName}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="shipperAddress"
                  label="Shipper Address"
                  fullWidth
                  value={formData.shipperAddress}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="consigneeName"
                  label="Consignee Name"
                  fullWidth
                  value={formData.consigneeName}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="consigneeAddress"
                  label="Consignee Address"
                  fullWidth
                  value={formData.consigneeAddress}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="bookingNumber"
                  label="Booking Number"
                  fullWidth
                  value={formData.bookingNumber}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="billOfLadingNumber"
                  label="Bill of Lading Number"
                  fullWidth
                  value={formData.billOfLadingNumber}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Customs Status</InputLabel>
                  <Select
                    name="customsStatus"
                    value={formData.customsStatus}
                    onChange={handleInputChange}
                    label="Customs Status"
                  >
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Cleared">Cleared</MenuItem>
                    <MenuItem value="Held">Held</MenuItem>
                  </Select>
                </FormControl>
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