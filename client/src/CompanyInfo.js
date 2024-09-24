import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Typography, 
  Button, 
  MenuItem, 
  Grid, 
  Avatar, 
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  FormHelperText
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebaseConfig';
import { getCompanyInfo, updateCompanyInfo } from './services/api';

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

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      if (!userData || !userData.company) throw new Error('User company not found');

      const companyInfo = await getCompanyInfo(userData.company);
      setCompanyData({ ...companyInfo, name: userData.company });
    } catch (err) {
      console.error('Error fetching company data:', err);
      setError('Failed to load company information: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const storageRef = ref(storage, `company_logos/${companyData.name}`);
        await uploadBytes(storageRef, file);
        const logoUrl = await getDownloadURL(storageRef);
        setCompanyData(prev => ({ ...prev, logoUrl }));
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
      };

      // Only include logoUrl if it's set
      if (companyData.logoUrl) {
        updatedData.logoUrl = companyData.logoUrl;
      }

      // Check if all required fields are filled
      const requiredFields = ['country', 'city', 'address', 'zipCode'];
      const missingFields = requiredFields.filter(field => !updatedData[field]);
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      await updateCompanyInfo(companyData.name, updatedData);
      setIsEditable(false);
      setSuccessMessage('Company information updated successfully');
    } catch (err) {
      console.error('Error updating company info:', err);
      setError('Failed to update company information: ' + err.message);
    } finally {
      setLoading(false);
    }
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
              }}
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
          <Button variant="contained" color="primary" onClick={() => setIsEditable(true)}>
            Edit Company Information
          </Button>
        </Box>
      )}

      <Snackbar 
        open={!!error || !!successMessage} 
        autoHideDuration={6000} 
        onClose={() => {setError(''); setSuccessMessage('');}}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => {setError(''); setSuccessMessage('');}} 
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