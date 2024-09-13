import React, { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography, Select, MenuItem, InputLabel, FormControl, Grid, Chip, Avatar } from '@mui/material';
import { getCurrentUser, updateUserProfile, sendPasswordResetEmailToUser, deleteUserAccount } from './services/api';
import { auth, db, storage } from './firebaseConfig';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function EditProfile() {
  const [profile, setProfile] = useState({
    email: '',
    salutation: 'Mr',
    firstName: '',
    lastName: '',
    company: 'Oceania Port',
    userType: 'Normal',
    teams: []
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (user) {
        const fullName = user.displayName || '';
        const nameParts = fullName.split(' ');
        
        let salutation = 'Mr';
        let firstName = '';
        let lastName = '';

        if (['Mr', 'Ms', 'Dr'].includes(nameParts[0])) {
          salutation = nameParts[0];
          firstName = nameParts.slice(1, -1).join(' ');
          lastName = nameParts[nameParts.length - 1];
        } else {
          firstName = nameParts.slice(0, -1).join(' ');
          lastName = nameParts[nameParts.length - 1];
        }

        setProfile({
          email: user.email || '',
          salutation: salutation,
          firstName: firstName,
          lastName: lastName,
          company: 'Oceania Port',
          userType: user.userType || 'Normal',
          teams: user.teams || []
        });
        setSelectedImage(user.photoURL);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
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

  const handleTeamsChange = (e) => {
    setProfile(prevProfile => ({
      ...prevProfile,
      teams: e.target.value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      let photoURL = selectedImage;
      
      if (selectedImage && selectedImage.startsWith('blob:')) {
        const imageRef = ref(storage, `profile_photos/${auth.currentUser.uid}`);
        const response = await fetch(selectedImage);
        const blob = await response.blob();
        await uploadBytes(imageRef, blob);
        photoURL = await getDownloadURL(imageRef);
      }
  
      const fullName = `${profile.salutation} ${profile.firstName} ${profile.lastName}`.trim();
      const updatedProfile = {
        displayName: fullName,
        photoURL: photoURL,
      };
  
      // Update Firebase Auth user profile
      await updateProfile(auth.currentUser, updatedProfile);
  
      // Update Firestore document
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDocRef, {
        salutation: profile.salutation,
        firstName: profile.firstName,
        lastName: profile.lastName,
        displayName: fullName,
        photoURL: photoURL,
        userType: profile.userType,
        teams: profile.teams,
      });
  
      alert('Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
    }
  };

  const handlePasswordReset = async () => {
    try {
      await sendPasswordResetEmailToUser(profile.email);
      alert('Password reset email sent. Please check your inbox.');
    } catch (err) {
      console.error('Error sending password reset email:', err);
      setError('Failed to send password reset email');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await deleteUserAccount();
        alert('Your account has been deleted successfully.');
        // Redirect to login page or show a goodbye message
      } catch (err) {
        console.error('Error deleting account:', err);
        setError('Failed to delete account. Please try again.');
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Box sx={{ padding: '1rem' }}>
      <Typography variant="h4" gutterBottom>Profile</Typography>

      <Box display="flex" alignItems="center" sx={{ marginBottom: '2rem' }}>
        <Avatar
          sx={{ width: 50, height: 50, marginRight: '1rem' }}
          src={selectedImage || ''}
        >
          {!selectedImage && profile.firstName[0]}
        </Avatar>
        <Button variant="outlined" component="label">
          Upload Photo
          <input hidden accept="image/*" type="file" onChange={handleImageUpload} />
        </Button>
      </Box>

      <TextField
        label="Email Address"
        name="email"
        value={profile.email}
        onChange={handleChange}
        fullWidth
        margin="normal"
        disabled
      />

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

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            label="First Name"
            name="firstName"
            value={profile.firstName}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Last Name"
            name="lastName"
            value={profile.lastName}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
        </Grid>
      </Grid>

      <TextField
        label="Company"
        name="company"
        value={profile.company}
        onChange={handleChange}
        fullWidth
        margin="normal"
        disabled
      />

      <FormControl fullWidth margin="normal">
        <InputLabel id="user-type-label">User Type</InputLabel>
        <Select
          labelId="user-type-label"
          name="userType"
          value={profile.userType}
          onChange={handleChange}
          disabled
        >
          <MenuItem value="Normal">Normal</MenuItem>
          <MenuItem value="Admin">Admin</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth margin="normal">
        <InputLabel id="teams-label">Teams</InputLabel>
        <Select
          labelId="teams-label"
          name="teams"
          multiple
          value={profile.teams}
          onChange={handleTeamsChange}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
              {selected.map((value) => (
                <Chip key={value} label={value} sx={{ margin: '2px' }} />
              ))}
            </Box>
          )}
        >
          {['Assets and Facilities', 'Manpower', 'Vessel Visits', 'Port Operations and Resources', 'Cargos', 'Financial', 'Customs and Trade Documents'].map((team) => (
            <MenuItem key={team} value={team}>
              {team}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Typography variant="h6" gutterBottom sx={{ marginTop: '2rem' }}>User Account Management</Typography>
      <Button
        variant="outlined"
        color="primary"
        sx={{ marginRight: '1rem' }}
        onClick={handlePasswordReset}
      >
        Request for password reset
      </Button>
      <Button
        variant="contained"
        color="error"
        onClick={handleDeleteAccount}
      >
        Delete Account (DANGER!)
      </Button>

      <Box sx={{ marginTop: '2rem' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          sx={{ marginRight: '1rem' }}
        >
          Save Changes
        </Button>
        <Button variant="outlined" color="secondary" onClick={() => console.log('Canceled')}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
}

export default EditProfile;