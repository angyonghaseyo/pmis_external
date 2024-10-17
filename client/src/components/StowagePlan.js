import React, { useState } from 'react';
import axios from 'axios';
import { Button, Typography, Box, TextField, Snackbar, Alert } from '@mui/material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const StowagePlan = () => {
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState(10);
  const [bays, setBays] = useState(10);
  const [tiers, setTiers] = useState(3);
  const [csvUploaded, setCsvUploaded] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      if (uploadedFile.type !== "text/csv") {
        showToast('Please upload a valid CSV file.', 'error');
        return;
      }
      setFile(uploadedFile);
      setCsvUploaded(true);
      showToast('CSV file successfully uploaded!', 'success');
    }
  };

  const showToast = (message, severity) => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const handleSubmit = async () => {
    if (!csvUploaded) {
      showToast('Please upload a CSV file before submitting.', 'error');
      return;
    }

    if (rows <= 0 || bays <= 0 || tiers <= 0) {
      showToast('Rows, Bays, and Tiers must be positive numbers.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('rows', rows);
    formData.append('bays', bays);
    formData.append('tiers', tiers);

    try {
      await axios.post(`${API_URL}/stowage-plan`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      showToast('Stowage plan successfully submitted!', 'success');
    } catch (error) {
      console.error('Error submitting stowage plan:', error);
      showToast('An error occurred while submitting the stowage plan.', 'error');
    }
  };

  const handleCloseToast = () => {
    setToastOpen(false);
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        Upload Stowage Plan
      </Typography>
      <input
        style={{ display: 'none' }}
        id="upload-csv"
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
      />
      <label htmlFor="upload-csv">
        <Button variant="contained" component="span">
          Upload CSV
        </Button>
      </label>

      <Box mt={2}>
        <TextField
          label="Number of Rows"
          type="number"
          variant="outlined"
          value={rows}
          onChange={(e) => setRows(parseInt(e.target.value, 10))}
          sx={{ marginRight: 2 }}
          error={rows <= 0}
          helperText={rows <= 0 ? 'Must be a positive number' : ''}
        />
        <TextField
          label="Number of Bays"
          type="number"
          variant="outlined"
          value={bays}
          onChange={(e) => setBays(parseInt(e.target.value, 10))}
          sx={{ marginRight: 2 }}
          error={bays <= 0}
          helperText={bays <= 0 ? 'Must be a positive number' : ''}
        />
        <TextField
          label="Number of Tiers"
          type="number"
          variant="outlined"
          value={tiers}
          onChange={(e) => setTiers(parseInt(e.target.value, 10))}
          error={tiers <= 0}
          helperText={tiers <= 0 ? 'Must be a positive number' : ''}
        />
      </Box>

      <Box mt={2}>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          Submit Stowage Plan
        </Button>
      </Box>

      <Snackbar open={toastOpen} autoHideDuration={6000} onClose={handleCloseToast}>
        <Alert onClose={handleCloseToast} severity={toastSeverity} sx={{ width: '100%' }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StowagePlan;