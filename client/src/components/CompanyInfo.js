import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Paper
} from '@mui/material';
import { getCompanyInfo, updateCompanyInfo } from '../services/api';

const CompanyInfo = () => {
  const [companyData, setCompanyData] = useState({
    name: '',
    address: '',
    contactPerson: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      setLoading(true);
      const data = await getCompanyInfo();
      setCompanyData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching company info:', err);
      setError('Failed to fetch company information. Please try again later.');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCompanyData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateCompanyInfo(companyData);
      setIsEditing(false);
      setSnackbar({ open: true, message: 'Company information updated successfully', severity: 'success' });
    } catch (err) {
      console.error('Error updating company info:', err);
      setSnackbar({ open: true, message: 'Failed to update company information', severity: 'error' });
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box component={Paper} p={3}>
      <Typography variant="h4" gutterBottom>Company Information</Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          margin="normal"
          name="name"
          label="Company Name"
          value={companyData.name}
          onChange={handleInputChange}
          disabled={!isEditing}
        />
        <TextField
          fullWidth
          margin="normal"
          name="address"
          label="Address"
          value={companyData.address}
          onChange={handleInputChange}
          disabled={!isEditing}
        />
        <TextField
          fullWidth
          margin="normal"
          name="contactPerson"
          label="Contact Person"
          value={companyData.contactPerson}
          onChange={handleInputChange}
          disabled={!isEditing}
        />
        <TextField
          fullWidth
          margin="normal"
          name="email"
          label="Email"
          type="email"
          value={companyData.email}
          onChange={handleInputChange}
          disabled={!isEditing}
        />
        <TextField
          fullWidth
          margin="normal"
          name="phone"
          label="Phone"
          value={companyData.phone}
          onChange={handleInputChange}
          disabled={!isEditing}
        />
        {isEditing ? (
          <Box mt={2}>
            <Button type="submit" variant="contained" color="primary" sx={{ mr: 1 }}>
              Save Changes
            </Button>
            <Button variant="outlined" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </Box>
        ) : (
          <Button variant="contained" color="primary" onClick={() => setIsEditing(true)} sx={{ mt: 2 }}>
            Edit Information
          </Button>
        )}
      </form>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CompanyInfo;