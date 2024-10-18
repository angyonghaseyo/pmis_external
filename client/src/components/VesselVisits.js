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
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Grid
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { getVesselVisits, createVesselVisit, updateVesselVisit, deleteVesselVisit } from '../services/api';

const VesselVisits = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentVisit, setCurrentVisit] = useState(null);
  const [formData, setFormData] = useState({
    vesselName: '',
    imoNumber: '',
    eta: null,
    etd: null,
    purpose: '',
    status: 'Scheduled'
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchVesselVisits();
  }, []);

  const fetchVesselVisits = async () => {
    try {
      setLoading(true);
      const data = await getVesselVisits();
      setVisits(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching vessel visits:', err);
      setError('Failed to fetch vessel visits. Please try again later.');
      setLoading(false);
    }
  };

  const handleOpenDialog = (visit = null) => {
    setCurrentVisit(visit);
    setFormData(visit || {
      vesselName: '',
      imoNumber: '',
      eta: null,
      etd: null,
      purpose: '',
      status: 'Scheduled'
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentVisit(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleDateChange = (name) => (date) => {
    setFormData(prevState => ({ ...prevState, [name]: date }));
  };

  const handleSubmit = async () => {
    try {
      if (currentVisit) {
        await updateVesselVisit(currentVisit.id, formData);
      } else {
        await createVesselVisit(formData);
      }
      handleCloseDialog();
      fetchVesselVisits();
      setSnackbar({ open: true, message: `Vessel visit ${currentVisit ? 'updated' : 'created'} successfully`, severity: 'success' });
    } catch (err) {
      console.error('Error submitting vessel visit:', err);
      setSnackbar({ open: true, message: 'Failed to submit vessel visit', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteVesselVisit(id);
      fetchVesselVisits();
      setSnackbar({ open: true, message: 'Vessel visit deleted successfully', severity: 'success' });
    } catch (err) {
      console.error('Error deleting vessel visit:', err);
      setSnackbar({ open: true, message: 'Failed to delete vessel visit', severity: 'error' });
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h4" gutterBottom>Vessel Visits</Typography>
        <Button variant="contained" color="primary" onClick={() => handleOpenDialog()} sx={{ mb: 2 }}>
          New Vessel Visit
        </Button>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vessel Name</TableCell>
                <TableCell>IMO Number</TableCell>
                <TableCell>ETA</TableCell>
                <TableCell>ETD</TableCell>
                <TableCell>Purpose</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visits.map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell>{visit.vesselName}</TableCell>
                  <TableCell>{visit.imoNumber}</TableCell>
                  <TableCell>{visit.eta ? new Date(visit.eta).toLocaleString() : 'N/A'}</TableCell>
                  <TableCell>{visit.etd ? new Date(visit.etd).toLocaleString() : 'N/A'}</TableCell>
                  <TableCell>{visit.purpose}</TableCell>
                  <TableCell>{visit.status}</TableCell>
                  <TableCell>
                    <Button onClick={() => handleOpenDialog(visit)}>Edit</Button>
                    <Button onClick={() => handleDelete(visit.id)} color="secondary">Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>{currentVisit ? 'Edit Vessel Visit' : 'New Vessel Visit'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="normal"
                  name="vesselName"
                  label="Vessel Name"
                  value={formData.vesselName}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="normal"
                  name="imoNumber"
                  label="IMO Number"
                  value={formData.imoNumber}
                  onChange={handleInputChange}
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
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="normal"
                  name="purpose"
                  label="Purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  margin="normal"
                  name="status"
                  label="Status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <MenuItem value="Scheduled">Scheduled</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} color="primary">
              {currentVisit ? 'Update' : 'Create'}
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
    </LocalizationProvider>
  );
};

export default VesselVisits;