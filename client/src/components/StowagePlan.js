import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Paper,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { createStowagePlan } from '../services/api';

const StowagePlan = () => {
  const [formData, setFormData] = useState({
    vesselName: '',
    voyageNumber: '',
    portOfLoading: '',
    portOfDischarge: '',
    containerCount: '',
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => formDataToSend.append(key, formData[key]));
      if (file) {
        formDataToSend.append('stowagePlanFile', file);
      }
      await createStowagePlan(formDataToSend);
      setSnackbar({ open: true, message: 'Stowage plan submitted successfully', severity: 'success' });
      setFormData({
        vesselName: '',
        voyageNumber: '',
        portOfLoading: '',
        portOfDischarge: '',
        containerCount: '',
      });
      setFile(null);
    } catch (error) {
      console.error('Error submitting stowage plan:', error);
      setSnackbar({ open: true, message: 'Failed to submit stowage plan', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component={Paper} p={3}>
      <Typography variant="h4" gutterBottom>Stowage Plan Submission</Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Vessel Name"
              name="vesselName"
              value={formData.vesselName}
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Voyage Number"
              name="voyageNumber"
              value={formData.voyageNumber}
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Port of Loading"
              name="portOfLoading"
              value={formData.portOfLoading}
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Port of Discharge"
              name="portOfDischarge"
              value={formData.portOfDischarge}
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Container Count"
              name="containerCount"
              type="number"
              value={formData.containerCount}
              onChange={handleInputChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <input
              accept=".pdf,.doc,.docx,.xlsx"
              style={{ display: 'none' }}
              id="stowage-plan-file"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="stowage-plan-file">
              <Button variant="outlined" component="span">
                Upload Stowage Plan File
              </Button>
            </label>
            {file && <Typography variant="body2">{file.name}</Typography>}
          </Grid>
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Submit Stowage Plan'}
            </Button>
          </Grid>
        </Grid>
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

export default StowagePlan;