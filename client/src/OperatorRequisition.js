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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Close } from '@mui/icons-material';
import { getOperatorRequisitions, createOperatorRequisition, updateOperatorRequisition, deleteOperatorRequisition } from './services/api';
import { auth } from './firebaseConfig';

const equipmentTypes = ['Crane', 'Forklift', 'Container Handler'];
const operatorSkills = ['Crane Operator', 'Forklift Operator', 'Equipment Technician'];

const OperatorRequisition = () => {
  const [activeRequests, setActiveRequests] = useState([]);
  const [completedRequests, setCompletedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    operatorSkill: '',
    date: '',
    time: '',
    duration: '',
    equipmentType: '',
  });

  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    setLogs(prevLogs => [...prevLogs, `${new Date().toISOString()}: ${message}`]);
    console.log(message);
  };

  const fetchRequisitions = useCallback(async () => {
    addLog('Starting to fetch requisitions...');
    try {
      setLoading(true);
      setError(null);
      const user = auth.currentUser;
      if (!user) {
        const noUserError = 'No authenticated user found';
        addLog(noUserError);
        setError(noUserError);
        return;
      }
      addLog(`Current user: ${user.uid}`);
      addLog(`Fetching requisitions for user: ${user.uid}`);
      const requisitions = await getOperatorRequisitions(user.uid);
      addLog(`Fetched ${requisitions.length} requisitions`);
      
      const active = requisitions.filter(req => req.status === 'Active');
      const completed = requisitions.filter(req => ['Completed', 'Cancelled'].includes(req.status));
      
      addLog(`Active requests: ${active.length}`);
      addLog(`Completed/Cancelled requests: ${completed.length}`);
      
      setActiveRequests(active);
      setCompletedRequests(completed);
    } catch (err) {
      const errorMessage = `Error fetching requisitions: ${err.message}`;
      addLog(errorMessage);
      addLog(`Error details: ${JSON.stringify(err, null, 2)}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
      addLog('Finished fetching requisitions');
    }
  }, []);

  useEffect(() => {
    addLog('Component mounted, setting up auth listener');
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        addLog(`User authenticated: ${user.uid}`);
        fetchRequisitions();
      } else {
        addLog('No authenticated user');
        setError('Please log in to view requisitions.');
        setLoading(false);
      }
    });

    return () => {
      addLog('Component unmounting, unsubscribing from auth listener');
      unsubscribe();
    };
  }, [fetchRequisitions]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenDialog = () => setOpen(true);
  const handleCloseDialog = () => {
    setOpen(false);
    setFormData({
      operatorSkill: '',
      date: '',
      time: '',
      duration: '',
      equipmentType: '',
    });
    setIsEditing(null);
  };

  const handleSubmit = async () => {
    addLog(`Submitting form: ${JSON.stringify(formData)}`);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');

      if (isEditing !== null) {
        await updateOperatorRequisition(isEditing, { ...formData, userId: user.uid });
        addLog(`Updated requisition: ${isEditing}`);
      } else {
        const newRequisitionId = await createOperatorRequisition({ ...formData, userId: user.uid, status: 'Active' });
        addLog(`Created new requisition with ID: ${newRequisitionId}`);
      }
      handleCloseDialog();
      await fetchRequisitions();
      setSnackbar({ open: true, message: 'Requisition saved successfully', severity: 'success' });
    } catch (err) {
      addLog(`Error submitting requisition: ${err.message}`);
      addLog(`Error details: ${JSON.stringify(err, null, 2)}`);
      setSnackbar({ open: true, message: 'Failed to save requisition', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    addLog(`Deleting requisition: ${id}`);
    try {
      await deleteOperatorRequisition(id);
      await fetchRequisitions();
      setSnackbar({ open: true, message: 'Requisition deleted successfully', severity: 'success' });
    } catch (err) {
      addLog(`Error deleting requisition: ${err.message}`);
      addLog(`Error details: ${JSON.stringify(err, null, 2)}`);
      setSnackbar({ open: true, message: 'Failed to delete requisition', severity: 'error' });
    }
  };

  const handleEdit = (request) => {
    addLog(`Editing requisition: ${JSON.stringify(request)}`);
    setFormData(request);
    setIsEditing(request.id);
    handleOpenDialog();
  };

  const handleComplete = async (id) => {
    addLog(`Completing requisition: ${id}`);
    try {
      await updateOperatorRequisition(id, { status: 'Completed' });
      await fetchRequisitions();
      setSnackbar({ open: true, message: 'Requisition marked as completed', severity: 'success' });
    } catch (err) {
      addLog(`Error completing requisition: ${err.message}`);
      addLog(`Error details: ${JSON.stringify(err, null, 2)}`);
      setSnackbar({ open: true, message: 'Failed to complete requisition', severity: 'error' });
    }
  };

  const handleCancel = async (id) => {
    addLog(`Cancelling requisition: ${id}`);
    try {
      await updateOperatorRequisition(id, { status: 'Cancelled' });
      await fetchRequisitions();
      setSnackbar({ open: true, message: 'Requisition cancelled successfully', severity: 'success' });
    } catch (err) {
      addLog(`Error cancelling requisition: ${err.message}`);
      addLog(`Error details: ${JSON.stringify(err, null, 2)}`);
      setSnackbar({ open: true, message: 'Failed to cancel requisition', severity: 'error' });
    }
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Operator Requisition
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button variant="contained" color="primary" onClick={handleOpenDialog}>
          Create New Request
        </Button>
      </Box>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Active Requests" />
        <Tab label="Completed/Cancelled Requests" />
      </Tabs>

      {tabValue === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Operator Skill</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Equipment Type</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activeRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No active requests found
                  </TableCell>
                </TableRow>
              ) : (
                activeRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.operatorSkill}</TableCell>
                    <TableCell>{request.date}</TableCell>
                    <TableCell>{request.time}</TableCell>
                    <TableCell>{request.duration}</TableCell>
                    <TableCell>{request.equipmentType}</TableCell>
                    <TableCell>
                      <IconButton color="primary" onClick={() => handleEdit(request)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(request.id)}>
                        <DeleteIcon />
                      </IconButton>
                      <Button onClick={() => handleComplete(request.id)}>Complete</Button>
                      <Button onClick={() => handleCancel(request.id)}>Cancel</Button>
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
                <TableCell>Operator Skill</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Equipment Type</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {completedRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No completed or cancelled requests found
                  </TableCell>
                </TableRow>
              ) : (
                completedRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.operatorSkill}</TableCell>
                    <TableCell>{request.date}</TableCell>
                    <TableCell>{request.time}</TableCell>
                    <TableCell>{request.duration}</TableCell>
                    <TableCell>{request.equipmentType}</TableCell>
                    <TableCell>{request.status}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={handleCloseDialog}>
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
          <TextField
            label="Date"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
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
          />
          <TextField
            label="Duration (hours)"
            name="duration"
            value={formData.duration}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          />
          <TextField
            select
            label="Equipment Type"
            name="equipmentType"
            value={formData.equipmentType}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          >
            {equipmentTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {isEditing !== null ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

     {/* Logs Section */}
     <Box mt={4}>
        <Typography variant="h6">Logs</Typography>
        <Paper style={{ maxHeight: 200, overflow: 'auto', padding: 10 }}>
          {logs.map((log, index) => (
            <Typography key={index} variant="body2">{log}</Typography>
          ))}
        </Paper>
      </Box>
    </Box>
  );
};

export default OperatorRequisition;