import React, { useState } from 'react';
import { Box, TextField, Typography, Button, MenuItem, Grid } from '@mui/material';

const currencies = [
  { value: 'USD', label: '$ - US Dollar' },
  { value: 'EUR', label: '€ - Euro' },
  { value: 'GBP', label: '£ - British Pound' },
  { value: 'JPY', label: '¥ - Japanese Yen' },
];

const CompanyInfo = () => {
  const [currency, setCurrency] = useState('USD');
  const [isEditable, setIsEditable] = useState(false);  

  const handleCurrencyChange = (event) => {
    setCurrency(event.target.value);
  };

  const handleEditClick = () => {
    setIsEditable(true);
  };

  const handleCancelClick = () => {
    setIsEditable(false);
  };

  return (
    <Box sx={{ maxWidth: '1000px', mx: 'auto', p: 3 }}>
      {/* Company Information */}
      <Typography variant="h4" gutterBottom>
        Company Information
      </Typography>

      {/* Edit Company Information Button */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        {!isEditable ? (
          <Button variant="contained" color="primary" onClick={handleEditClick}>
            Edit Company Information
          </Button>
        ) : null}
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            label="Company Name"
            fullWidth
            margin="normal"
            InputProps={{
              readOnly: !isEditable,  
            }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Company Logo URL"
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
    </Box>
  );
};

export default CompanyInfo;
