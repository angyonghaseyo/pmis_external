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
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { getCargoManifests, createCargoManifest, updateCargoManifest, deleteCargoManifest } from '../services/api';

const CargoManifest = () => {
  const [manifests, setManifests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentManifest, setCurrentManifest] = useState(null);
  const [formData, setFormData] = useState({
    vesselName: '',
    imoNumber: '',
    departureDate: '',
    arrivalDate: '',
    originPort: '',
    destinationPort: '',
    cargoDescription: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchManifests();
  }, []);

  const fetchManifests = async () => {
    try {
      setLoading(true);
      const data = await getCargoManifests();
      setManifests(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching cargo manifests:', err);
      setError('Failed to fetch cargo manifests. Please try again later.');
      setLoading(false);
    }
  };

  const handleOpenDialog = (manifest = null) => {
    setCurrentManifest(manifest);
    setFormData(manifest || {
      vesselName: '',
      imoNumber: '',
      departureDate: '',
      arrivalDate: '',
      originPort: '',
      destinationPort: '',
      cargoDescription: '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentManifest(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (currentManifest) {
        await updateCargoManifest(currentManifest.id, formData);
      } else {
        await createCargoManifest(formData);
      }
      handleCloseDialog();
      fetchManifests();
      setSnackbar({ open: true, message: `Cargo manifest ${currentManifest ? 'updated' : 'submitted'} successfully`, severity: 'success' });
    } catch (err) {
      console.error('Error submitting cargo manifest:', err);
      setSnackbar({ open: true, message: 'Failed to submit cargo manifest', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCargoManifest(id);
      fetchManifests();
      setSnackbar({ open: true, message: 'Cargo manifest deleted successfully', severity: 'success' });
    } catch (err) {
      console.error('Error deleting cargo manifest:', err);
      setSnackbar({ open: true, message: 'Failed to delete cargo manifest', severity: 'error' });
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Cargo Manifests</Typography>
      <Button variant="contained" color="primary" onClick={() => handleOpenDialog()} sx={{ mb: 2 }}>
        Create New Manifest
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Vessel Name</TableCell>
              <TableCell>IMO Number</TableCell>
              <TableCell>Departure Date</TableCell>
              <TableCell>Arrival Date</TableCell>
              <TableCell>Origin Port</TableCell>
              <TableCell>Destination Port</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {manifests.map((manifest) => (
              <TableRow key={manifest.id}>
                <TableCell>{manifest.vesselName}</TableCell>
                <TableCell>{manifest.imoNumber}</TableCell>
                <TableCell>{manifest.departureDate}</TableCell>
                <TableCell>{manifest.arrivalDate}</TableCell>
                <TableCell>{manifest.originPort}</TableCell>
                <TableCell>{manifest.destinationPort}</TableCell>
                <TableCell>
                  <Button onClick={() => handleOpenDialog(manifest)}>Edit</Button>
                  <Button onClick={() => handleDelete(manifest.id)} color="secondary">Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{currentManifest ? 'Edit Cargo Manifest' : 'Create New Cargo Manifest'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="vesselName"
            label="Vessel Name"
            type="text"
            fullWidth
            value={formData.vesselName}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="imoNumber"
            label="IMO Number"
            type="text"
            fullWidth
            value={formData.imoNumber}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="departureDate"
            label="Departure Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={formData.departureDate}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="arrivalDate"
            label="Arrival Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={formData.arrivalDate}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="originPort"
            label="Origin Port"
            type="text"
            fullWidth
            value={formData.originPort}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="destinationPort"
            label="Destination Port"
            type="text"
            fullWidth
            value={formData.destinationPort}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="cargoDescription"
            label="Cargo Description"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={formData.cargoDescription}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary">
            {currentManifest ? 'Update' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CargoManifest;