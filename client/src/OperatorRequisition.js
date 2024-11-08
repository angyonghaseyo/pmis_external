import React, { useState, useEffect, useCallback } from 'react';
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
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Paper,
  CircularProgress,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Close } from '@mui/icons-material';
import { 
  getOperatorRequisitions,
  createOperatorRequisition, 
  updateOperatorRequisition, 
  deleteOperatorRequisition,
  getActiveVesselVisits,
  getCurrentUserCompany 
} from './services/api';
import { useAuth } from './AuthContext';

const operatorSkills = ['Tugboat Operator', 'Pilot Operator'];
const durations = ['1 Hour', '2 Hours', '3 Hours', '4 Hours'];

const OperatorRequisition = () => {
  const { user } = useAuth();
  const [company, setCompany] = useState(''); 
  const [pendingRequests, setPendingRequests] = useState([]);
  const [resolvedRequests, setResolvedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    operatorSkill: '',
    date: '',
    time: '',
    duration: '',
    quantity: 1,
    imoNumber: '',
  });

  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [activeVesselVisits, setActiveVesselVisits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequisitions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!user || !user.email) {
        setError('No authenticated user found');
        return;
      }
      const requisitions = await getOperatorRequisitions(user.email);

      const pending = requisitions.filter(req => req.status === 'Pending');
      const resolved = requisitions.filter(req => ['Approved', 'Rejected'].includes(req.status));

      setPendingRequests(pending);
      setResolvedRequests(resolved);
    } catch (err) {
      setError(`Error fetching requisitions: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch user's company on component mount
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const userCompany = await getCurrentUserCompany();
        setCompany(userCompany); 
      } catch (error) {
        console.error('Error fetching user company:', error);
      }
    };
    fetchCompany();
  }, []);

  const fetchActiveVessels = async () => {
    try {
      const visits = await getActiveVesselVisits();
      setActiveVesselVisits(visits);
    } catch (error) {
      console.error('Error fetching active vessels:', error);
      setError('Failed to fetch vessel visits');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          setIsLoading(true);
          setError(null);
          await Promise.all([fetchRequisitions(), fetchActiveVessels()]);
        } catch (error) {
          console.error('Error fetching data:', error);
          setError('An error occurred while fetching data. Please try again.');
        } finally {
          setIsLoading(false);
        }
      } else {
        setError('Please log in to view requisitions.');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, fetchRequisitions]);

  const hasRole = (requiredRoles) => {
    if (!user || !Array.isArray(user.accessRights)) return false;
    return requiredRoles.some(role => user.accessRights.includes(role));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'imoNumber') {
      const selectedVisit = activeVesselVisits.find(visit => visit.imoNumber === value);
      if (selectedVisit) {
        const etaDate = new Date(selectedVisit.eta);
        setFormData(prev => ({
          ...prev,
          [name]: value,
          date: etaDate.toISOString().split('T')[0],
          time: etaDate.toTimeString().split(' ')[0].slice(0, 5),
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleOpenDialog = () => {
    if (activeVesselVisits.length === 0) {
      setSnackbar({
        open: true,
        message: 'No active vessel visits available for operator requisition',
        severity: 'warning'
      });
      return;
    }
    setOpen(true);
    setFormData({
      operatorSkill: '',
      date: '',
      time: '',
      duration: '',
      quantity: 1,
      imoNumber: '',
    });
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setIsEditing(null);
  };

  const handleSubmit = async () => {
    try {
      if (!user) throw new Error('No authenticated user');

      if (!formData.time || !formData.imoNumber) {
        setSnackbar({ open: true, message: 'All fields are required', severity: 'error' });
        return;
      }

      const selectedDateTime = new Date(`${formData.date}T${formData.time}`);
      const currentDateTime = new Date();
      if (selectedDateTime < currentDateTime) {
        setSnackbar({ open: true, message: 'Date and time cannot be in the past', severity: 'error' });
        return;
      }

      const selectedVisit = activeVesselVisits.find(visit => visit.imoNumber === formData.imoNumber);
      if (!selectedVisit) {
        setSnackbar({ 
          open: true, 
          message: 'Selected vessel visit is no longer available. Please select another vessel.', 
          severity: 'error' 
        });
        return;
      }

      const requestData = {
        ...formData,
        company, 
        email: user.email,
        status: 'Pending',
      };

      if (isEditing !== null) {
        await updateOperatorRequisition(isEditing, requestData);
      } else {
        const quantity = parseInt(formData.quantity, 10);
        const createPromises = Array(quantity).fill().map(() => 
          createOperatorRequisition({
            ...requestData,
            quantity: 1,
          })
        );
        await Promise.all(createPromises);
      }

      handleCloseDialog();
      await fetchRequisitions();
      setSnackbar({ 
        open: true, 
        message: isEditing ? 'Requisition updated successfully' : `${formData.quantity} requisition(s) created successfully`, 
        severity: 'success' 
      });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save requisition', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteOperatorRequisition(id);
      await fetchRequisitions();
      setSnackbar({ open: true, message: 'Requisition deleted successfully', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete requisition', severity: 'error' });
    }
  };

  const handleEdit = (request) => {
    setFormData(request);
    setIsEditing(request.id);
    setOpen(true);
  };

  const handleTabChange = (event, newValue) => setTabValue(newValue);

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" height="100vh"><CircularProgress /></Box>;
  }

  if (error) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh">
        <Typography color="error" align="center" gutterBottom>{error}</Typography>
        <Button variant="contained" color="primary" onClick={fetchRequisitions}>Retry</Button>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Operator Requisition
      </Typography>
      
      {hasRole(["Create Operator Requisition"]) && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <Button variant="contained" color="primary" onClick={handleOpenDialog}>
            Create New Request
          </Button>
        </Box>
      )}

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Pending Requests" />
        <Tab label="Approved/Rejected Requests" />
      </Tabs>

      {tabValue === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>IMO Number</TableCell>
                <TableCell>Operator Skill</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No pending requests found
                  </TableCell>
                </TableRow>
              ) : (
                pendingRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.imoNumber}</TableCell>
                    <TableCell>{request.operatorSkill}</TableCell>
                    <TableCell>{request.date}</TableCell>
                    <TableCell>{request.time}</TableCell>
                    <TableCell>{request.duration}</TableCell>
                    <TableCell>{request.status}</TableCell>
                    <TableCell>
                      <IconButton color="primary" onClick={() => handleEdit(request)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(request.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tabValue === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>IMO Number</TableCell>
                <TableCell>Operator Skill</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resolvedRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No approved or rejected requests found
                  </TableCell>
                </TableRow>
              ) : (
                resolvedRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.imoNumber}</TableCell>
                    <TableCell>{request.operatorSkill}</TableCell>
                    <TableCell>{request.date}</TableCell>
                    <TableCell>{request.time}</TableCell>
                    <TableCell>{request.duration}</TableCell>
                    <TableCell>{request.status}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing !== null ? 'Update Operator Request' : 'Create Operator Request'}
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
          <FormControl fullWidth margin="normal">
            <InputLabel>IMO Number</InputLabel>
            <Select
              name="imoNumber"
              value={formData.imoNumber}
              onChange={handleInputChange}
              disabled={isEditing}
            >
              {activeVesselVisits.map((visit) => (
                <MenuItem key={visit.imoNumber} value={visit.imoNumber}>
                  {visit.imoNumber}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            select
            label="Operator Skill"
            name="operatorSkill"
            value={formData.operatorSkill}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          >
            {operatorSkills.map((skill) => (
              <MenuItem key={skill} value={skill}>
                {skill}
              </MenuItem>
            ))}
          </TextField>

          {!isEditing && (
            <TextField
              label="Quantity"
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              InputProps={{ 
                inputProps: { 
                  min: 1,
                  max: 10
                } 
              }}
              helperText="Number of identical requests to create (1-10)"
            />
          )}

          <TextField
            label="Date"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            disabled
          />

          <TextField
            label="Time"
            type="time"
            name="time"
            value={formData.time}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            disabled
          />

          <TextField
            select
            label="Duration"
            name="duration"
            value={formData.duration}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          >
            {durations.map((duration) => (
              <MenuItem key={duration} value={duration}>
                {duration}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={!formData.imoNumber || !formData.operatorSkill || !formData.duration}
          >
            {isEditing !== null ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar} 
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OperatorRequisition;
