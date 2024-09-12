import { TextField, Button, Box, Typography } from '@mui/material';
import { useState } from 'react';

function EditProfile() {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({
      ...profile,
      [name]: value
    });
  };

  const handleSubmit = () => {
    // Add logic
    console.log('Profile updated:', profile);
  };

  return (
    <Box sx={{ padding: '2rem' }}>
      <Typography variant="h4" gutterBottom>Edit Profile</Typography>
      <TextField
        label="First Name"
        name="firstName"
        value={profile.firstName}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Last Name"
        name="lastName"
        value={profile.lastName}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Email"
        name="email"
        value={profile.email}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        sx={{ marginTop: '1rem' }}
      >
        Save Changes
      </Button>
    </Box>
  );
}

export default EditProfile;
