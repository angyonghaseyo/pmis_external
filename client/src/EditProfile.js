import React, { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography, Select, MenuItem, InputLabel, FormControl, Grid, Avatar } from '@mui/material';
import { sendPasswordResetEmailToUser, deleteUserAccount } from './services/api';
import { auth, db, storage } from './firebaseConfig';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfile({
            email: user.email || '',
            salutation: userData.salutation || '',
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            company: userData.company || 'Oceania Port',
            userType: userData.userType || 'Normal',
            teams: userData.teams || []
          });
          setSelectedImage(user.photoURL);
        }
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
        company: profile.company,
        userType: profile.userType,
        // Note: We're not updating 'teams' here as it should be managed elsewhere
      });
  
      alert('Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile: ' + err.message);
    } finally {
      setLoading(false);
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

  if (loading) return <Typography>Loading...</Typography>;
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
          />
        </Grid>
        <Grid item xs={12}>
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
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ border: '1px solid #ccc', borderRadius: '4px', padding: '1rem', marginTop: '1rem' }}>
            <Typography variant="subtitle1" gutterBottom>Teams</Typography>
            <div className="teams-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {teams.map((team) => (
                <div key={team} className="team-checkbox" style={{ display: 'flex', alignItems: 'center', minWidth: '200px' }}>
                  <input
                    type="checkbox"
                    id={team}
                    checked={profile.teams.includes(team)}
                    disabled
                    style={{ marginRight: '8px' }}
                  />
                  <label htmlFor={team}>{team}</label>
                </div>
              ))}
            </div>
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
    </Box>
  );
}

export default EditProfile;