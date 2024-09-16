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
  Alert,
  IconButton
} from '@mui/material';
import { Edit, Reply } from '@mui/icons-material';
import { getUserInquiriesFeedback, createInquiryFeedback, updateInquiryFeedback } from './services/api';
import Sidebar from './Sidebar';
import Header from './Header';
import { auth } from './firebaseConfig';

const InquiryFeedback = () => {
  const [user, setUser] = useState(null);
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
  const [editingInquiry, setEditingInquiry] = useState(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

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

  const handleDialogOpen = (inquiry = null) => {
    if (inquiry) {
      setEditingInquiry(inquiry);
      setFormData({
        type: inquiry.type,
        subject: inquiry.subject,
        description: inquiry.description,
        urgency: inquiry.urgency,
        file: null
      });
    } else {
      setEditingInquiry(null);
      setFormData({
        type: 'Inquiry',
        subject: '',
        description: '',
        urgency: 'Normal',
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
          ...formData,
          file: formData.file instanceof File ? formData.file : null
        };
  
        if (editingInquiry) {
          await updateInquiryFeedback(editingInquiry.id, submissionData);
        } else {
          await createInquiryFeedback(submissionData);
        }
        handleDialogClose();
        fetchInquiriesFeedback();
      } catch (err) {
        console.error('Error submitting inquiry/feedback:', err);
        setSubmitError(`Failed to submit inquiry/feedback: ${err.message}`);
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
      await updateInquiryFeedback(editingInquiry.id, { 
        userReply: replyText,
        status: 'User Replied'
      });
      handleReplyClose();
      fetchInquiriesFeedback();
    } catch (err) {
      console.error('Error submitting reply:', err);
      setError(`Failed to submit reply: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openInquiriesFeedback = inquiries.filter(item => item.status === 'Open').length;
  const pendingUserAction = inquiries.filter(item => ['Approved', 'Rejected'].includes(item.status)).length;

  if (loading && inquiries.length === 0) return <Box display="flex" justifyContent="center" alignItems="center" height="100vh"><CircularProgress /></Box>;
  if (error) return <Typography color="error" align="center">{error}</Typography>;

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Header user={user} />

        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <Typography variant="h4" component="h2">Inquiries & Feedback</Typography>
          <Button variant="contained" color="primary" onClick={() => handleDialogOpen()}>
            Create New Inquiry / Feedback
          </Button>
        </Box>

        <Grid container spacing={3} my={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" color="textSecondary">Open Inquiries/Feedback</Typography>
                <Typography variant="h4" component="p">
                  {openInquiriesFeedback}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" color="textSecondary">Pending Your Action</Typography>
                <Typography variant="h4" component="p">
                  {pendingUserAction}
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
              {inquiries.map((inquiry, index) => (
                <TableRow key={inquiry.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{inquiry.type}</TableCell>
                  <TableCell>{inquiry.subject}</TableCell>
                  <TableCell>{inquiry.status}</TableCell>
                  <TableCell>{inquiry.createdAt.toDate().toLocaleDateString()}</TableCell>
                  <TableCell>{inquiry.urgency}</TableCell>
                  <TableCell>
                    {inquiry.status === 'Open' && (
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
              {loading ? 'Submitting...' : (editingInquiry ? 'Update' : 'Submit')}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={replyDialogOpen} onClose={handleReplyClose} maxWidth="sm" fullWidth>
          <DialogTitle>Reply to Admin Response</DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              Status: {editingInquiry?.status}
            </Typography>
            {editingInquiry?.adminReply && (
              <Typography variant="body1" gutterBottom>
                Admin Reply: {editingInquiry.adminReply}
              </Typography>
            )}
            <TextField
              fullWidth
              margin="normal"
              label="Your Reply"
              multiline
              rows={4}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <Typography variant="body2" color="textSecondary">
              Note: This will be your final reply. If the issue is not resolved, please open a new inquiry.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleReplyClose}>Cancel</Button>
            <Button onClick={handleReplySubmit} variant="contained" color="primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Send Reply'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default InquiryFeedback;