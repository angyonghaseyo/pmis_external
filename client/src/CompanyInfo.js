import React, { useState } from 'react';
import { Box, TextField, Typography, Button, MenuItem, Grid, Avatar, IconButton } from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';

const currencies = [
  { value: 'USD', label: '$ - US Dollar' },
  { value: 'EUR', label: '€ - Euro' },
  { value: 'GBP', label: '£ - British Pound' },
  { value: 'JPY', label: '¥ - Japanese Yen' },
];

const CompanyInfo = () => {
  const [currency, setCurrency] = useState('USD');
  const [isEditable, setIsEditable] = useState(false);  
  const [logoUrl, setLogoUrl] = useState(''); 

  const handleCurrencyChange = (event) => {
    setCurrency(event.target.value);
  };

  const handleEditClick = () => {
    setIsEditable(true);
  };

  const handleCancelClick = () => {
    setIsEditable(false);
  };

  const handleLogoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setLogoUrl(URL.createObjectURL(file)); 
    }
  };

  return (
    <Box sx={{ maxWidth: '1000px', mx: 'auto', p: 3 }}>
      {/* Company Information */}
      <Typography variant="h4" gutterBottom>
        Company Information
      </Typography>

      <Grid container spacing={2} alignItems="center">
        <Grid item xs={2}>
          {/* Company Logo Display */}
          <IconButton
            color="primary"
            aria-label="upload picture"
            component="label"
            disabled={!isEditable}
          >
            <input hidden accept="image/*" type="file" onChange={handleLogoChange} />
            <Avatar
              alt="Company Logo"
              src={logoUrl || undefined}
              sx={{ width: 80, height: 80 }}
            >
              {!logoUrl && <Typography variant="h6">C</Typography>}
            </Avatar>
            {isEditable && <PhotoCamera />}
          </IconButton>
        </Grid>

        <Grid item xs={10}>
          <TextField
            label="Company Name"
            fullWidth
            margin="normal"
            InputProps={{
              readOnly: !isEditable,  
            }}
          />
        </Grid>
      </Grid>

      {/* Address Details */}
      <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>
        Address Details
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            label="Country"
            fullWidth
            margin="normal"
            InputProps={{
              readOnly: !isEditable,
            }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="State"
            fullWidth
            margin="normal"
            InputProps={{
              readOnly: !isEditable,
            }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="City"
            fullWidth
            margin="normal"
            InputProps={{
              readOnly: !isEditable,
            }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Area"
            fullWidth
            margin="normal"
            InputProps={{
              readOnly: !isEditable,
            }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Address"
            fullWidth
            margin="normal"
            InputProps={{
              readOnly: !isEditable,
            }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Zip Code"
            fullWidth
            margin="normal"
            InputProps={{
              readOnly: !isEditable,
            }}
          />
        </Grid>
      </Grid>

      {/* Currency Setting */}
      <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>
        Currency Setting
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            select
            label="Currency Symbol"
            value={currency}
            onChange={handleCurrencyChange}
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

      {/* Save and Cancel buttons */}
      {isEditable && (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" color="secondary" onClick={handleCancelClick}>
            Cancel
          </Button>
          <Button variant="contained" color="primary">
            Save
          </Button>
        </Box>
      )}

      {!isEditable && (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="contained" color="primary" onClick={handleEditClick}>
            Edit Company Information
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default CompanyInfo;
