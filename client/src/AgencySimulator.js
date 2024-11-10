import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  Grid,
  CircularProgress
} from '@mui/material';
import { getAgencies, getBookings, updateDocumentStatus } from './services/api';

const AgencySimulator = () => {
  const [agencies, setAgencies] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedAgencyKey, setSelectedAgencyKey] = useState('');
  const [selectedBooking, setSelectedBooking] = useState('');
  const [selectedCargo, setSelectedCargo] = useState('');
  const [selectedDocument, setSelectedDocument] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [comments, setComments] = useState('');
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch agencies and bookings on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [agenciesData, bookingsData] = await Promise.all([
          getAgencies(),
          getBookings()
        ]);
        
        // Convert agencies array to object with key as index
        const agenciesObj = agenciesData.reduce((acc, agency) => {
          acc[agency.key] = agency;
          return acc;
        }, {});
        
        setAgencies(agenciesObj);
        setBookings(bookingsData);
      } catch (error) {
        setNotification({
          type: 'error',
          message: 'Error loading data: ' + error.message
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!selectedAgencyKey || !selectedBooking || !selectedCargo || !selectedDocument) {
      setNotification({
        type: 'error',
        message: 'Please fill in all required fields'
      });
      return;
    }

    try {
      setSubmitting(true);
      const result = await updateDocumentStatus(
        selectedAgencyKey,
        selectedBooking,
        selectedCargo,
        selectedDocument,
        status,
        comments
      );

      setNotification({
        type: 'success',
        message: result.message || 'Document status updated successfully'
      });

      // Reset form fields except agency selection
      setSelectedDocument('');
      setStatus('PENDING');
      setComments('');

    } catch (error) {
      setNotification({
        type: 'error',
        message: error.message || 'Error updating document status'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Agency Document Update Simulator
        </Typography>

        {notification && (
          <Alert 
            severity={notification.type} 
            sx={{ mb: 2 }}
            onClose={() => setNotification(null)}
          >
            {notification.message}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Select Agency</InputLabel>
              <Select
                value={selectedAgencyKey}
                onChange={(e) => {
                  setSelectedAgencyKey(e.target.value);
                  setSelectedDocument('');
                }}
              >
                {Object.entries(agencies).map(([key, agency]) => (
                  <MenuItem key={key} value={key}>
                    {agency.name} ({key})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Select Booking</InputLabel>
              <Select
                value={selectedBooking}
                onChange={(e) => {
                  setSelectedBooking(e.target.value);
                  setSelectedCargo('');
                }}
              >
                {bookings.map(booking => (
                  <MenuItem key={booking.bookingId} value={booking.bookingId}>
                    Booking: {booking.bookingId}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={!selectedBooking}>
              <InputLabel>Select Cargo</InputLabel>
              <Select
                value={selectedCargo}
                onChange={(e) => setSelectedCargo(e.target.value)}
              >
                {selectedBooking && 
                  bookings.find(b => b.bookingId === selectedBooking)?.cargo &&
                  Object.keys(bookings.find(b => b.bookingId === selectedBooking).cargo)
                    .map(cargoId => (
                      <MenuItem key={cargoId} value={cargoId}>
                        Cargo: {cargoId}
                      </MenuItem>
                    ))
                }
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={!selectedAgencyKey}>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={selectedDocument}
                onChange={(e) => setSelectedDocument(e.target.value)}
              >
                {selectedAgencyKey && 
                  agencies[selectedAgencyKey]?.allowedDocuments.map(doc => (
                    <MenuItem key={doc} value={doc}>
                      {doc}
                    </MenuItem>
                  ))
                }
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <MenuItem value="PENDING">PENDING</MenuItem>
                <MenuItem value="APPROVED">APPROVED</MenuItem>
                <MenuItem value="REJECTED">REJECTED</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting || !selectedAgencyKey || !selectedBooking || !selectedCargo || !selectedDocument}
              fullWidth
            >
              {submitting ? <CircularProgress size={24} /> : 'Update Document Status'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default AgencySimulator;