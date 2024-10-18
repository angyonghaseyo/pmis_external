import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
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
  Alert,
  IconButton,
  Container
} from '@mui/material';
import { Edit, Reply } from '@mui/icons-material';
import { getUserInquiriesFeedback, createInquiryFeedback, updateInquiryFeedback, getUserData } from '../services/api';
import { format } from 'date-fns';

const InquiryFeedback = () => {
  const [user, setUser] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    incrementalId: '',
    type: 'Inquiry',
    subject: '',
    description: '',
    status: 'Pending',
    urgency: 'Medium',
    file: null
  });
  const [formErrors, setFormErrors] = useState({ subject: false, description: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [editingInquiry, setEditingInquiry] = useState(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const userData = await getUserData();
        setUser(userData);
        await fetchInquiriesFeedback();
        await fetchUserProfile();
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('An error occurred while fetching data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchInquiriesFeedback = async () => {
    try {
      const data = await getUserInquiriesFeedback();
      setInquiries(data);
    } catch (err) {
      console.error('Error fetching inquiries and feedback:', err);
      setError('Failed to fetch inquiries and feedback. Please try again later.');
    }
  };

  const handleDialogOpen = (inquiry = null) => {
    if (inquiry) {
      setEditingInquiry(inquiry);
      setFormData({
        incrementalId: inquiry.incrementalId,
        type: inquiry.type,
        subject: inquiry.subject,
        description: inquiry.description,
        status: inquiry.status,
        urgency: inquiry.urgency,
        file: null
      });
    } else {
      setEditingInquiry(null);
      setFormData({
        incrementalId: '',
        type: 'Inquiry',
        subject: '',
        description: '',
        status: 'Pending',
        urgency: 'Medium',
        file: null
      });
    }
    setOpenDialog(true);
    setSubmitError(null);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setFormErrors({ subject: false, description: false });
    setSubmitError(null);
    setEditingInquiry(null);
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

        const submissionData = {
          type: formData.type,
          subject: formData.subject,
          description: formData.description,
          status: 'Pending',
          urgency: formData.urgency,
          file: formData.file instanceof File ? formData.file : null
        };

        if (editingInquiry) {
          await updateInquiryFeedback(editingInquiry.incrementalId, submissionData);
        } else {
          await createInquiryFeedback(submissionData);
        }

        handleDialogClose();
        fetchInquiriesFeedback();
        setSnackbar({ open: true, message: 'Submission successful', severity: 'success' });
      } catch (err) {
        console.error('Error submitting inquiry/feedback:', err);
        setSubmitError(`Failed to submit: ${err.message}`);
        setSnackbar({ open: true, message: 'Submission failed', severity: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReplyOpen = (inquiry) => {
    setEditingInquiry(inquiry);
    setReplyDialogOpen(true);
  };

  const handleReplyClose = () => {
    setReplyDialogOpen(false);
    setReplyText('');
    setEditingInquiry(null);
  };

  const handleReplySubmit = async () => {
    try {
      setLoading(true);
      await updateInquiryFeedback(editingInquiry.incrementalId, {
        userReply: replyText,
      });
      handleReplyClose();
      fetchInquiriesFeedback();
      setSnackbar({ open: true, message: 'Reply submitted successfully', severity: 'success' });
    } catch (err) {
      console.error('Error submitting reply:', err);
      setSnackbar({ open: true, message: 'Failed to submit reply', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const hasRole = (requiredRoles) => {
    if (!userProfile || !Array.isArray(userProfile.accessRights)) return false;
    const hasRequiredRole = requiredRoles.some(role => userProfile.accessRights.includes(role));
    return hasRequiredRole || userProfile.role === 'Admin';
  };

  const fetchUserProfile = async () => {
    try {
      const profileData = await getUserData();
      setUserProfile(profileData);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to fetch user profile. Please try again later.');
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" height="100vh"><CircularProgress /></Box>;
  if (error) return <Typography color="error" align="center">{error}</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h2">Inquiries & Feedback</Typography>
        {hasRole(["Create Inquiries and Feedback"]) &&
          <Button variant="contained" color="primary" onClick={() => handleDialogOpen()}>
            Create New Inquiry / Feedback
          </Button>
        }
      </Box>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="textSecondary">Open Inquiries/Feedback</Typography>
              <Typography variant="h4" component="p">
                {inquiries.filter(item => item.status === 'Pending').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="textSecondary">Waiting For Your Action</Typography>
              <Typography variant="h4" component="p">
                {inquiries.filter(item => ['Approved', 'Rejected'].includes(item.status) && !item.userReply).length}
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
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inquiries.map((inquiry) => (
              <TableRow key={inquiry.incrementalId}>
                <TableCell>{inquiry.incrementalId}</TableCell>
                <TableCell>{inquiry.type}</TableCell>
                <TableCell>{inquiry.subject}</TableCell>
                <TableCell>{inquiry.status}</TableCell>
                <TableCell>
                  {inquiry.createdAt ? format(new Date(inquiry.createdAt), 'yyyy-MM-dd HH:mm') : 'N/A'}
                </TableCell>
                <TableCell>{inquiry.urgency}</TableCell>
                <TableCell>
                  {inquiry.status === 'Pending' && (
                    <IconButton onClick={() => handleDialogOpen(inquiry)} size="small" title="Edit">
                      <Edit />
                    </IconButton>
                  )}
                  {['Approved', 'Rejected'].includes(inquiry.status) && !inquiry.userReply && (
                    <IconButton onClick={() => handleReplyOpen(inquiry)} size="small" title="Reply">
                      <Reply />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingInquiry ? 'Edit Inquiry / Feedback' : 'Create New Inquiry / Feedback'}</DialogTitle>
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
            <MenuItem value="Medium">Medium</MenuItem>
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
            {loading ? 'Submitting...' : (editingInquiry ? 'Update' : 'Submit')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={replyDialogOpen} onClose={handleReplyClose} maxWidth="sm" fullWidth>
        <DialogTitle>Reply to Admin Response</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Current Status: {editingInquiry?.status}
          </Typography>
          {editingInquiry?.adminReply && (
            <Typography variant="body1" gutterBottom>
              Admin Reply: {editingInquiry.adminReply}
            </Typography>
          )}
          <TextField
            fullWidth
            margin="normal"
            label="Your Final Reply"
            multiline
            rows={4}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <Typography variant="body2" color="textSecondary">
            Note: This will be your final reply to this {editingInquiry?.status.toLowerCase()} inquiry.
            The status will remain as {editingInquiry?.status}.
            If you need further assistance, please open a new inquiry.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReplyClose}>Cancel</Button>
          <Button onClick={handleReplySubmit} variant="contained" color="primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Send Reply'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InquiryFeedback;