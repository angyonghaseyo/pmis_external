import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import { getUserInquiriesFeedback, createInquiryFeedback } from './services/api';
import Sidebar from './Sidebar';
import Header from './Header';

const InquiryFeedback = () => {
  const [inquiries, setInquiries] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Inquiry',
    subject: '',
    description: '',
    urgency: 'Normal',
    file: null
  });
  const [formErrors, setFormErrors] = useState({ subject: false, description: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    fetchInquiriesFeedback();
  }, []);

  const fetchInquiriesFeedback = async () => {
    try {
      setLoading(true);
      const data = await getUserInquiriesFeedback();
      setInquiries(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching inquiries and feedback:', err);
      setError('Failed to fetch inquiries and feedback. Please try again later.');
      setLoading(false);
    }
  };

  const handleDialogOpen = () => {
    setOpenDialog(true);
    setSubmitError(null);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setFormErrors({ subject: false, description: false });
    setSubmitError(null);
    setFormData({
      type: 'Inquiry',
      subject: '',
      description: '',
      urgency: 'Normal',
      file: null
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, file: e.target.files[0] }));
  };

  const handleSubmit = async () => {
    const errors = {
      subject: formData.subject.trim() === '',
      description: formData.description.trim() === ''
    };
  
    setFormErrors(errors);
  
    if (!errors.subject && !errors.description) {
      try {
        setLoading(true);
        setSubmitError(null);
        
        // Create a new FormData object to handle the file
        const submissionData = {
          ...formData,
          file: formData.file instanceof File ? formData.file : null
        };
  
        await createInquiryFeedback(submissionData);
        handleDialogClose();
        fetchInquiriesFeedback(); // Refresh the list
      } catch (err) {
        console.error('Error creating inquiry/feedback:', err);
        setSubmitError(`Failed to create inquiry/feedback: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && inquiries.length === 0) return <Box display="flex" justifyContent="center" alignItems="center" height="100vh"><CircularProgress /></Box>;
  if (error) return <Typography color="error" align="center">{error}</Typography>;

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Header />

        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <Typography variant="h4" component="h2">Inquiries & Feedback</Typography>
          <Button variant="contained" color="primary" onClick={handleDialogOpen}>
            Create New Inquiry / Feedback
          </Button>
        </Box>

        <Grid container spacing={3} my={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" color="textSecondary">Open Inquiries</Typography>
                <Typography variant="h4" component="p">
                  {inquiries.filter(item => item.status === 'Open' && item.type === 'Inquiry').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" color="textSecondary">Open Feedback</Typography>
                <Typography variant="h4" component="p">
                  {inquiries.filter(item => item.status === 'Open' && item.type === 'Feedback').length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date Filed</TableCell>
                <TableCell>Urgency</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inquiries.map((inquiry) => (
                <TableRow key={inquiry.id}>
                  <TableCell>{inquiry.id}</TableCell>
                  <TableCell>{inquiry.type}</TableCell>
                  <TableCell>{inquiry.subject}</TableCell>
                  <TableCell>{inquiry.status}</TableCell>
                  <TableCell>{inquiry.createdAt.toDate().toLocaleDateString()}</TableCell>
                  <TableCell>{inquiry.urgency}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Inquiry / Feedback</DialogTitle>
          <DialogContent>
            {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}
            <TextField
              select
              fullWidth
              margin="normal"
              label="Type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
            >
              <MenuItem value="Inquiry">Inquiry</MenuItem>
              <MenuItem value="Feedback">Feedback</MenuItem>
            </TextField>

            <TextField
              fullWidth
              margin="normal"
              label="Subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              error={formErrors.subject}
              helperText={formErrors.subject ? 'Subject is required' : ''}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Description"
              name="description"
              multiline
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              error={formErrors.description}
              helperText={formErrors.description ? 'Description is required' : ''}
            />

            <TextField
              select
              fullWidth
              margin="normal"
              label="Urgency"
              name="urgency"
              value={formData.urgency}
              onChange={handleInputChange}
            >
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Normal">Normal</MenuItem>
              <MenuItem value="High">High</MenuItem>
            </TextField>

            <input
              type="file"
              onChange={handleFileChange}
              style={{ marginTop: '1rem' }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained" color="primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default InquiryFeedback;