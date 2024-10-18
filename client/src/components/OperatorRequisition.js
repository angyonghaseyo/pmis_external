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
  Alert
} from '@mui/material';
import { DateTimePicker } from '@mui/lab';
import { getOperatorRequisitions, createOperatorRequisition, updateOperatorRequisition, deleteOperatorRequisition } from '../services/api';

const OperatorRequisition = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentRequisition, setCurrentRequisition] = useState(null);
  const [formData, setFormData] = useState({
    operatorType: '',
    startTime: null,
    endTime: null,
    status: 'Pending'
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchRequisitions();
  }, []);

  const fetchRequisitions = async () => {
    try {
      setLoading(true);
      const data = await getOperatorRequisitions();
      setRequisitions(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching operator requisitions:', err);
      setError('Failed to fetch operator requisitions. Please try again later.');
      setLoading(false);
    }
  };

  const handleOpenDialog = (requisition = null) => {
    setCurrentRequisition(requisition);
    setFormData(requisition || {
      operatorType: '',
      startTime: null,
      endTime: null,
      status: 'Pending'
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentRequisition(null);
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
      if (currentRequisition) {
        await updateOperatorRequisition(currentRequisition.id, formData);
      } else {
        await createOperatorRequisition(formData);
      }
      handleCloseDialog();
      fetchRequisitions();
      setSnackbar({ open: true, message: `Operator requisition ${currentRequisition ? 'updated' : 'created'} successfully`, severity: 'success' });
    } catch (err) {
      console.error('Error submitting operator requisition:', err);
      setSnackbar({ open: true, message: 'Failed to submit operator requisition', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteOperatorRequisition(id);
      fetchRequisitions();
      setSnackbar({ open: true, message: 'Operator requisition deleted successfully', severity: 'success' });
    } catch (err) {
      console.error('Error deleting operator requisition:', err);
      setSnackbar({ open: true, message: 'Failed to delete operator requisition', severity: 'error' });
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Operator Requisitions</Typography>
      <Button variant="contained" color="primary" onClick={() => handleOpenDialog()} sx={{ mb: 2 }}>
        New Requisition
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Operator Type</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>End Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requisitions.map((requisition) => (
              <TableRow key={requisition.id}>
                <TableCell>{requisition.operatorType}</TableCell>
                <TableCell>{new Date(requisition.startTime).toLocaleString()}</TableCell>
                <TableCell>{new Date(requisition.endTime).toLocaleString()}</TableCell>
                <TableCell>{requisition.status}</TableCell>
                <TableCell>
                  <Button onClick={() => handleOpenDialog(requisition)}>Edit</Button>
                  <Button onClick={() => handleDelete(requisition.id)} color="secondary">Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{currentRequisition ? 'Edit Operator Requisition' : 'New Operator Requisition'}</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            margin="normal"
            name="operatorType"
            label="Operator Type"
            value={formData.operatorType}
            onChange={handleInputChange}
          >
            <MenuItem value="Crane Operator">Crane Operator</MenuItem>
            <MenuItem value="Forklift Operator">Forklift Operator</MenuItem>
            <MenuItem value="Truck Driver">Truck Driver</MenuItem>
          </TextField>
          <DateTimePicker
            label="Start Time"
            value={formData.startTime}
            onChange={handleDateChange('startTime')}
            renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
          />
          <DateTimePicker
            label="End Time"
            value={formData.endTime}
            onChange={handleDateChange('endTime')}
            renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
          />
          {currentRequisition && (
            <TextField
              select
              fullWidth
              margin="normal"
              name="status"
              label="Status"
              value={formData.status}
              onChange={handleInputChange}
            >
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Approved">Approved</MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
            </TextField>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary">
            {currentRequisition ? 'Update' : 'Submit'}
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

export default OperatorRequisition;