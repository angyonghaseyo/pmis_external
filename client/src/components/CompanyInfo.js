import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Box,
  TextField,
  Typography,
  Button,
  MenuItem,
  Grid,
  Avatar,
  CircularProgress,
  Snackbar,
  Alert,
  FormHelperText,
  Container
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const currencies = [
  { value: 'USD', label: '$ - US Dollar' },
  { value: 'EUR', label: '€ - Euro' },
  { value: 'GBP', label: '£ - British Pound' },
  { value: 'JPY', label: '¥ - Japanese Yen' },
];

const CompanyInfo = () => {
  const [companyData, setCompanyData] = useState({
    name: '',
    country: '',
    state: '',
    city: '',
    area: '',
    address: '',
    zipCode: '',
    currencySymbol: 'USD',
    logoUrl: ''
  });
  const [isEditable, setIsEditable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [userProfile, setUserProfile] = useState(null);

  const fetchCompanyData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authenticated user');

      const userResponse = await axios.get(`${API_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = userResponse.data;
      setUserProfile(userData);

      if (!userData || !userData.company) throw new Error('User company not found');

      const companyResponse = await axios.get(`${API_URL}/company/${userData.company}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompanyData({ ...companyResponse.data, name: userData.company });
    } catch (err) {
      console.error('Error fetching company data:', err);
      setError('Failed to load company information: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanyData();
  }, [fetchCompanyData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const formData = new FormData();
        formData.append('logo', file);
        const response = await axios.post(`${API_URL}/company/upload-logo`, formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setCompanyData(prev => ({ ...prev, logoUrl: response.data.logoUrl }));
      } catch (err) {
        console.error('Error uploading logo:', err);
        setError('Failed to upload logo: ' + err.message);
      }
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const updatedData = {
        country: companyData.country,
        state: companyData.state,
        city: companyData.city,
        area: companyData.area,
        address: companyData.address,
        zipCode: companyData.zipCode,
        currencySymbol: companyData.currencySymbol,
        logoUrl: companyData.logoUrl
      };

      const requiredFields = ['country', 'state', 'city', 'area', 'address', 'zipCode'];
      const missingFields = requiredFields.filter(field => !updatedData[field]);
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      await axios.put(`${API_URL}/company/${companyData.name}`, updatedData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setIsEditable(false);
      setSuccessMessage('Company information updated successfully');
    } catch (err) {
      console.error('Error updating company info:', err);
      setError('Failed to update company information: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (requiredRoles) => {
    if (!userProfile || !Array.isArray(userProfile.accessRights)) return false;
    const hasRequiredRole = requiredRoles.some(role => userProfile.accessRights.includes(role));
    return hasRequiredRole || userProfile.role === 'Admin';
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" height="100vh"><CircularProgress /></Box>;

  return (
    <Box sx={{ maxWidth: '1000px', mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Company Information
      </Typography>

      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={4}>
          <Box display="flex" flexDirection="column" alignItems="center">
            <Avatar
              alt="Company Logo"
              src={companyData.logoUrl || undefined}
              sx={{ width: 100, height: 100, mb: 2 }}
            >
              {!companyData.logoUrl && <Typography variant="h4">{companyData.name[0]}</Typography>}
            </Avatar>
            {isEditable && (
              <>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="logo-upload"
                  type="file"
                  onChange={handleLogoChange}
                />
                <label htmlFor="logo-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<PhotoCamera />}
                  >
                    Upload Logo
                  </Button>
                </label>
                <FormHelperText>
                  {companyData.logoUrl ? 'Click to change logo' : 'Please upload a company logo'}
                </FormHelperText>
              </>
            )}
          </Box>
        </Grid>

        <Grid item xs={12} sm={6} md={8}>
          <TextField
            label="Company Name"
            fullWidth
            margin="normal"
            value={companyData.name}
            InputProps={{
              readOnly: true,
              style: { color: 'grey' }
            }}
          />
        </Grid>
      </Grid>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Address Details
      </Typography>
      <Grid container spacing={2}>
        {['country', 'state', 'city', 'area', 'address', 'zipCode'].map((field) => (
          <Grid item xs={12} sm={6} key={field}>
            <TextField
              label={field.charAt(0).toUpperCase() + field.slice(1)}
              fullWidth
              margin="normal"
              name={field}
              value={companyData[field]}
              onChange={handleInputChange}
              InputProps={{
                readOnly: !isEditable,
                style: { color: isEditable ? 'inherit' : 'grey' }
              }}
              required={['country', 'state', 'city', 'area', 'address', 'zipCode'].includes(field)}
              error={isEditable && !companyData[field]}
              helperText={isEditable && !companyData[field] ? 'This field is required' : ''}
            />
          </Grid>
        ))}
      </Grid>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Currency Setting
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            select
            label="Currency Symbol"
            name="currencySymbol"
            value={companyData.currencySymbol}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            InputProps={{
              readOnly: !isEditable,
              style: { color: isEditable ? 'inherit' : 'grey' }
            }}
            SelectProps={{
              disabled: !isEditable,
            }}
          >
            {currencies.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {isEditable ? (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" color="secondary" onClick={() => setIsEditable(false)}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={handleSave}>
            Save
          </Button>
        </Box>
      ) : (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          {hasRole(['Edit Company Information']) && (
            <Button variant="contained" color="primary" onClick={() => setIsEditable(true)}>
              Edit Company Information
            </Button>
          )}
        </Box>
      )}

      <Snackbar
        open={!!error || !!successMessage}
        autoHideDuration={6000}
        onClose={() => { setError(''); setSuccessMessage(''); }}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => { setError(''); setSuccessMessage(''); }}
          severity={error ? "error" : "success"}
          sx={{ width: '100%' }}
        >
          {error || successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CompanyInfo;