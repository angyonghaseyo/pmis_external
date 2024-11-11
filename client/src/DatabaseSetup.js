import React, { useState } from 'react';
import { Button, Alert, Box, Typography } from '@mui/material';
import { initializeAgencies } from './CustomsTradeManager';

const DatabaseSetup = () => {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleSetup = async () => {
    try {
      setStatus('Setting up agencies...');
      await initializeAgencies();
      setStatus('Agencies initialized successfully!');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, margin: 'auto', p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Database Setup
      </Typography>
      <Button 
        variant="contained" 
        onClick={handleSetup}
        sx={{ mb: 2 }}
      >
        Initialize Agencies
      </Button>
      
      {status && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {status}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default DatabaseSetup;