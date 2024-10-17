import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  TextField,
  Button,
  Box,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Grid,
  Avatar,
  Chip,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const teams = [
  'Assets and Facilities',
  'Manpower',
  'Vessel Visits',
  'Port Operations and Resources',
  'Cargos',
  'Financial',
  'Customs and Trade Documents'
];

function EditProfile() {
  const [profile, setProfile] = useState({
    email: '',
    salutation: '',
    firstName: '',
    lastName: '',
    company: '',
    userType: '',
    teams: [],
    accessRights: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProfile(response.data);
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError('Failed to fetch user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prevProfile => ({
      ...prevProfile,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await axios.put(`${API_URL}/user/profile`, profile, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSnackbar({ open: true, message: 'Profile updated successfully', severity: 'success' });
    } catch (err) {
      console.error('Error updating profile:', err);
      setSnackbar({ open: true, message: 'Failed to update profile: ' + err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email: profile.email });
      setSnackbar({ open: true, message: 'Password reset email sent. Please check your inbox.', severity: 'success' });
    } catch (err) {
      console.error('Error sending password reset email:', err);
      setSnackbar({ open: true, message: 'Failed to send password reset email', severity: 'error' });
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await axios.delete(`${API_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setSnackbar({ open: true, message: 'Your account has been deleted successfully.', severity: 'success' });
        // Redirect to login page or show a goodbye message
      } catch (err) {
        console.error('Error deleting account:', err);
        setSnackbar({ open: true, message: 'Failed to delete account. Please try again.', severity: 'error' });
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
      <Typography variant="h4" gutterBottom>Profile</Typography>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            label="Email Address"
            name="email"
            value={profile.email}
            fullWidth
            margin="normal"
            disabled
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="salutation-label">Salutation</InputLabel>
            <Select
              labelId="salutation-label"
              name="salutation"
              value={profile.salutation}
              onChange={handleChange}
            >
              <MenuItem value="Mr">Mr</MenuItem>
              <MenuItem value="Ms">Ms</MenuItem>
              <MenuItem value="Dr">Dr</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="First Name"
            name="firstName"
            value={profile.firstName}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Last Name"
            name="lastName"
            value={profile.lastName}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Company"
            name="company"
            value={profile.company}
            onChange={handleChange}
            fullWidth
            margin="normal"
            disabled
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>Access Rights</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {profile.accessRights.length > 0 ? (
              profile.accessRights.map((right, index) => (
                <Chip key={index} label={right} color="secondary" />
              ))
            ) : (
              <Typography color="textSecondary">No specific access rights assigned</Typography>
            )}
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ marginTop: '2rem' }}>
        <Typography variant="h6" gutterBottom>User Account Management</Typography>
        <Button
          variant="outlined"
          color="primary"
          onClick={handlePasswordReset}
          sx={{ marginRight: '1rem' }}
        >
          Request Password Reset
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDeleteAccount}
        >
          Delete Account
        </Button>
      </Box>

      <Box sx={{ marginTop: '2rem' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          sx={{ marginRight: '1rem' }}
        >
          Save Changes
        </Button>
        <Button variant="outlined" color="secondary" onClick={() => fetchUserProfile()}>
          Cancel
        </Button>
      </Box>

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

export default EditProfile;