import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  TextField,
  Button,
  Typography,
  Box,
  Container,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormGroup,
  FormControlLabel,
  CircularProgress,
  Alert,
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

  const handleTeamChange = (team) => {
    setFormData(prevState => ({
      ...prevState,
      teams: prevState.teams.includes(team)
        ? prevState.teams.filter(t => t !== team)
        : [...prevState.teams, team]
    }));
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
      const response = await axios.post(`${API_URL}/auth/signup`, formData);
      console.log('Signup successful:', response.data);
      navigate('/login');
    } catch (error) {
      console.error("Error during sign up:", error.response ? error.response.data : error.message);
      setError(error.response ? error.response.data.error : 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8 }}>
        <Typography component="h1" variant="h5">
          🚢 Oceania PMIS - Sign Up
        </Typography>
        {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="salutation-label">Salutation</InputLabel>
            <Select
              labelId="salutation-label"
              id="salutation"
              name="salutation"
              value={formData.salutation}
              onChange={handleChange}
            >
              <MenuItem value="Mr">Mr</MenuItem>
              <MenuItem value="Mrs">Mrs</MenuItem>
              <MenuItem value="Ms">Ms</MenuItem>
              <MenuItem value="Dr">Dr</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="normal"
            required
            fullWidth
            id="firstName"
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="lastName"
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="company"
            label="Company"
            name="company"
            value={formData.company}
            onChange={handleChange}
          />
          <FormControl component="fieldset" sx={{ mt: 2 }}>
            <Typography component="legend">Teams</Typography>
            <FormGroup>
              {teams.map((team) => (
                <FormControlLabel
                  key={team}
                  control={
                    <Checkbox
                      checked={formData.teams.includes(team)}
                      onChange={() => handleTeamChange(team)}
                      name={team}
                    />
                  }
                  label={team}
                />
              ))}
            </FormGroup>
          </FormControl>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign Up'}
          </Button>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <Typography variant="body2" align="center">
              Already have an account? Sign in
            </Typography>
          </Link>
        </Box>
      </Paper>
    </Container>
  );
}

export default SignUpForm;