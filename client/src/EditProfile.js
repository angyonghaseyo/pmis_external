import { TextField, Button, Box, Typography, Select, MenuItem, InputLabel, FormControl, Grid, Chip, Avatar } from '@mui/material';
import { useState } from 'react';

function EditProfile() {
  const [profile, setProfile] = useState({
    email: '',
    salutation: 'Mr',
    firstName: '',
    lastName: '',
    company: 'Oceania Port',
    userType: 'Normal',
    teams: [],
  });

  const [selectedImage, setSelectedImage] = useState(null); // State to store the uploaded image

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({
      ...profile,
      [name]: value,
    });
  };

  const handleTeamsChange = (e) => {
    setProfile({
      ...profile,
      teams: e.target.value,
    });
  };

  const handleSubmit = () => {
    // Add logic
    console.log('Profile updated:', profile);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file); // Create a temporary URL for the image
      setSelectedImage(imageUrl); // Update the state with the image URL
    }
  };

  return (
    <Box sx={{ padding: '1rem' }}>
      <Typography variant="h4" gutterBottom>Profile</Typography>

      {/* Profile Picture Upload */}
      <Box display="flex" alignItems="center" sx={{ marginBottom: '2rem' }}>
        <Avatar
          sx={{ width: 50, height: 50, marginRight: '1rem' }}
          src={selectedImage ? selectedImage : ''} // Display the selected image or fallback to empty
        >
          {!selectedImage && 'P'} {/* Show initial when no image */}
        </Avatar>
        <Button variant="outlined" component="label">
          Upload Photo
          <input hidden accept="image/*" multiple type="file" onChange={handleImageUpload} />
        </Button>
      </Box>

      {/* Email Address */}
      <TextField
        label="Email Address"
        name="email"
        value={profile.email}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />

      {/* Salutation */}
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

      {/* First Name and Last Name */}
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

      {/* Company */}
      <TextField
        label="Company"
        name="company"
        value={profile.company}
        onChange={handleChange}
        fullWidth
        margin="normal"
        disabled
      />

      {/* User Type */}
      <FormControl fullWidth margin="normal">
        <InputLabel id="user-type-label">User Type</InputLabel>
        <Select
          labelId="user-type-label"
          name="userType"
          value={profile.userType}
          onChange={handleChange}
        >
          <MenuItem value="Normal">Normal</MenuItem>
          <MenuItem value="Admin">Admin</MenuItem>
        </Select>
      </FormControl>

      {/* Teams */}
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

      {/* User Account Management */}
      <Typography variant="h6" gutterBottom sx={{ marginTop: '2rem' }}>User Account Management</Typography>
      <Button
        variant="outlined"
        color="primary"
        sx={{ marginRight: '1rem' }}
        onClick={() => console.log('Requesting password reset...')}
      >
        Request for password reset
      </Button>
      <Button
        variant="contained"
        color="error"
        onClick={() => console.log('Deleting account...')}
      >
        Delete Account (DANGER!)
      </Button>

      {/* Save Changes and Cancel Buttons */}
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
