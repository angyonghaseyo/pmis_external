import React, { useState, useEffect } from 'react';
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
import { getUserData, updateUserProfile, sendPasswordResetEmailToUser, deleteUserAccount } from '../services/api';
import { storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function EditProfile() {
  const [profile, setProfile] = useState({
    email: '',
    salutation: '',
    firstName: '',
    lastName: '',
    company: '',
    userType: '',
    accessRights: [],
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const userData = await getUserData();
      if (userData) {
        setProfile({
          email: userData.email || '',
          salutation: userData.salutation || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          company: userData.company || '',
          userType: userData.userType || 'Normal',
          accessRights: userData.accessRights || [],
        });
        setSelectedImage(userData.photoURL);
      }
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      let photoURL = selectedImage;

      if (selectedImage && selectedImage.startsWith('blob:')) {
        const imageRef = ref(storage, `profile_photos/${profile.email}`);
        const response = await fetch(selectedImage);
        const blob = await response.blob();
        await uploadBytes(imageRef, blob);
        photoURL = await getDownloadURL(imageRef);
      }

      const updatedProfile = {
        ...profile,
        photoURL: photoURL,
      };

      await updateUserProfile(updatedProfile);
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
      await sendPasswordResetEmailToUser(profile.email);
      setSnackbar({ open: true, message: 'Password reset email sent. Please check your inbox.', severity: 'success' });
    } catch (err) {
      console.error('Error sending password reset email:', err);
      setSnackbar({ open: true, message: 'Failed to send password reset email', severity: 'error' });
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await deleteUserAccount();
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

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" height="100vh"><CircularProgress /></Box>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box sx={{ padding: '1rem' }}>
      <Typography variant="h4" gutterBottom>Profile</Typography>

      <Box display="flex" alignItems="center" sx={{ marginBottom: '2rem' }}>
        <Avatar
          sx={{ width: 100, height: 100, marginRight: '1rem' }}
          src={selectedImage || ''}
        >
          {!selectedImage && profile.firstName[0]}
        </Avatar>
        <Button variant="outlined" component="label">
          Upload Photo
          <input hidden accept="image/*" type="file" onChange={handleImageUpload} />
        </Button>
      </Box>

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