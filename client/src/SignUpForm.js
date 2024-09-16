import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { auth, storage, db } from './firebaseConfig';
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Typography,
  Box,
  Grid,
  Container,
  Avatar,
  Alert,
  CircularProgress
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

const teams = [
  'Assets and Facilities',
  'Manpower',
  'Vessel Visits',
  'Port Operations and Resources',
  'Cargos',
  'Financial',
  'Customs and Trade Documents'
];

function SignUpForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    salutation: 'Mr',
    company: '',
    teams: [],
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleTeamChange = (event) => {
    const { value } = event.target;
    setFormData(prevState => ({
      ...prevState,
      teams: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("File size should not exceed 5MB");
        return;
      }
      setPhotoFile(file);
    }
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.firstName || !formData.lastName || !formData.company) {
      setError('Please fill in all required fields.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password should be at least 6 characters long');
      return false;
    }
    if (formData.teams.length === 0) {
      setError('Please select at least one team');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Create user
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Upload photo if provided
      let photoURL = '';
      if (photoFile) {
        const storageRef = ref(storage, `profile_photos/${user.uid}`);
        await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(storageRef);
      }

      // Update user profile
      await updateProfile(user, {
        displayName: `${formData.salutation} ${formData.firstName} ${formData.lastName}`,
        photoURL: photoURL
      });

      // Check if company exists and update or create accordingly
      const companyRef = doc(db, 'companies', formData.company);
      const companyDoc = await getDoc(companyRef);

      if (companyDoc.exists()) {
        // Company exists, increment user count
        await updateDoc(companyRef, {
          userCount: increment(1)
        });
      } else {
        // Company doesn't exist, create new company document
        await setDoc(companyRef, {
          name: formData.company,
          userCount: 1
        });
      }

      // Store additional user info in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        salutation: formData.salutation,
        photoURL: photoURL,
        company: formData.company,
        teams: formData.teams,
        userType: 'Admin',
        createdAt: new Date()
      });

      // Navigate to home page or dashboard
      navigate('/');
    } catch (error) {
      console.error("Error during sign up:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign up
        </Typography>
        {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel id="salutation-label">Salutation</InputLabel>
                <Select
                  labelId="salutation-label"
                  id="salutation"
                  name="salutation"
                  value={formData.salutation}
                  onChange={handleChange}
                  label="Salutation"
                >
                  <MenuItem value="Mr">Mr</MenuItem>
                  <MenuItem value="Mrs">Mrs</MenuItem>
                  <MenuItem value="Ms">Ms</MenuItem>
                  <MenuItem value="Dr">Dr</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                autoComplete="given-name"
                name="firstName"
                required
                fullWidth
                id="firstName"
                label="First Name"
                autoFocus
                value={formData.firstName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                required
                fullWidth
                id="lastName"
                label="Last Name"
                name="lastName"
                autoComplete="family-name"
                value={formData.lastName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="company"
                label="Company"
                id="company"
                value={formData.company}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="teams-label">Teams</InputLabel>
                <Select
                  labelId="teams-label"
                  id="teams"
                  multiple
                  value={formData.teams}
                  onChange={handleTeamChange}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {teams.map((team) => (
                    <MenuItem key={team} value={team}>
                      <Checkbox checked={formData.teams.indexOf(team) > -1} />
                      <Typography>{team}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                component="label"
              >
                Upload Profile Photo
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
              </Button>
              {photoFile && <Typography variant="caption" display="block">File selected: {photoFile.name}</Typography>}
            </Grid>
          </Grid>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign Up'}
          </Button>
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link to="/login" variant="body2">
                Already have an account? Sign in
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
}

export default SignUpForm;