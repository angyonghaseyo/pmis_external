import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { getInquiriesFeedback, createInquiryFeedback, updateInquiryFeedback, deleteInquiryFeedback } from '../services/api';

const InquiryFeedback = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentInquiry, setCurrentInquiry] = useState(null);
  const [formData, setFormData] = useState({
    type: 'Inquiry',
    subject: '',
    description: '',
    status: 'Pending'
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const data = await getInquiriesFeedback();
      setInquiries(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching inquiries and feedback:', err);
      setError('Failed to fetch inquiries and feedback. Please try again later.');
      setLoading(false);
    }
  };

  const handleOpenDialog = (inquiry = null) => {
    setCurrentInquiry(inquiry);
    setFormData(inquiry || {
      type: 'Inquiry',
      subject: '',
      description: '',
      status: 'Pending'
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentInquiry(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (currentInquiry) {
        await updateInquiryFeedback(currentInquiry.id, formData);
      } else {
        await createInquiryFeedback(formData);
      }
      handleCloseDialog();
      fetchInquiries();
      setSnackbar({ open: true, message: `Inquiry/Feedback ${currentInquiry ? 'updated' : 'submitted'} successfully`, severity: 'success' });
    } catch (err) {
      console.error('Error submitting inquiry/feedback:', err);
      setSnackbar({ open: true, message: 'Failed to submit inquiry/feedback', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteInquiryFeedback(id);
      fetchInquiries();
      setSnackbar({ open: true, message: 'Inquiry/Feedback deleted successfully', severity: 'success' });
    } catch (err) {
      console.error('Error deleting inquiry/feedback:', err);
      setSnackbar({ open: true, message: 'Failed to delete inquiry/feedback', severity: 'error' });
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Inquiries and Feedback</Typography>
      <Button variant="contained" color="primary" onClick={() => handleOpenDialog()} sx={{ mb: 2 }}>
        New Inquiry/Feedback
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inquiries.map((inquiry) => (
              <TableRow key={inquiry.id}>
                <TableCell>{inquiry.type}</TableCell>
                <TableCell>{inquiry.subject}</TableCell>
                <TableCell>{inquiry.status}</TableCell>
                <TableCell>
                  <Button onClick={() => handleOpenDialog(inquiry)}>View/Edit</Button>
                  <Button onClick={() => handleDelete(inquiry.id)} color="secondary">Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{currentInquiry ? 'Edit Inquiry/Feedback' : 'New Inquiry/Feedback'}</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            margin="normal"
            name="type"
            label="Type"
            value={formData.type}
            onChange={handleInputChange}
          >
            <MenuItem value="Inquiry">Inquiry</MenuItem>
            <MenuItem value="Feedback">Feedback</MenuItem>
          </TextField>
          <TextField
            fullWidth
            margin="normal"
            name="subject"
            label="Subject"
            value={formData.subject}
            onChange={handleInputChange}
          />
          <TextField
            fullWidth
            margin="normal"
            name="description"
            label="Description"
            multiline
            rows={4}
            value={formData.description}
            onChange={handleInputChange}
          />
          {currentInquiry && (
            <TextField
              select
              fullWidth
              margin="normal"
              name="status"
              label="Status"
              value={formData.status}
              onChange={handleInputChange}
            >
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Resolved">Resolved</MenuItem>
            </TextField>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary">
            {currentInquiry ? 'Update' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default InquiryFeedback;