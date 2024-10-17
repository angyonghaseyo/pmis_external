import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const userTypes = ['Normal', 'Admin'];
const teams = [
  'Assets and Facilities',
  'Manpower',
  'Vessel Visits',
  'Port Operations and Resources',
  'Cargos',
  'Financial',
  'Customs and Trade Documents'
];

function SettingsUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(response.data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user = null) => {
    setCurrentUser(user || { firstName: '', lastName: '', email: '', userType: 'Normal', teams: [] });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentUser(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentUser(prev => ({ ...prev, [name]: value }));
  };

  const handleTeamChange = (event) => {
    setCurrentUser(prev => ({ ...prev, teams: event.target.value }));
  };

  const handleSubmit = async () => {
    try {
      if (currentUser.id) {
        await axios.put(`${API_URL}/users/${currentUser.id}`, currentUser, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        await axios.post(`${API_URL}/users`, currentUser, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }
      handleCloseDialog();
      fetchUsers();
      setSnackbar({ open: true, message: `User ${currentUser.id ? 'updated' : 'created'} successfully`, severity: 'success' });
    } catch (err) {
      console.error('Error submitting user:', err);
      setSnackbar({ open: true, message: `Failed to ${currentUser.id ? 'update' : 'create'} user`, severity: 'error' });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`${API_URL}/users/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        fetchUsers();
        setSnackbar({ open: true, message: 'User deleted successfully', severity: 'success' });
      } catch (err) {
        console.error('Error deleting user:', err);
        setSnackbar({ open: true, message: 'Failed to delete user', severity: 'error' });
      }
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box sx={{ padding: '1rem' }}>
      <Typography variant="h4" gutterBottom>User Management</Typography>
      <Button variant="contained" color="primary" onClick={() => handleOpenDialog()} sx={{ mb: 2 }}>
        Add New User
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>User Type</TableCell>
              <TableCell>Teams</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.userType}</TableCell>
                <TableCell>
                  {user.teams.map((team) => (
                    <Chip key={team} label={team} sx={{ mr: 0.5, mb: 0.5 }} />
                  ))}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(user)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteUser(user.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{currentUser?.id ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="firstName"
            label="First Name"
            type="text"
            fullWidth
            value={currentUser?.firstName || ''}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="lastName"
            label="Last Name"
            type="text"
            fullWidth
            value={currentUser?.lastName || ''}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="email"
            label="Email Address"
            type="email"
            fullWidth
            value={currentUser?.email || ''}
            onChange={handleInputChange}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>User Type</InputLabel>
            <Select
              name="userType"
              value={currentUser?.userType || ''}
              onChange={handleInputChange}
            >
              {userTypes.map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Teams</InputLabel>
            <Select
              multiple
              value={currentUser?.teams || []}
              onChange={handleTeamChange}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
              {teams.map((team) => (
                <MenuItem key={team} value={team}>
                  {team}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit}>{currentUser?.id ? 'Update' : 'Add'}</Button>
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
  );
}

export default SettingsUsers;