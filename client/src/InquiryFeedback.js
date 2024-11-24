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
  Container,
  Link,
  Chip,
  Divider,
  Tooltip,
  Badge,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import {
  Edit as EditIcon,
  Reply as ReplyIcon,
  Visibility as VisibilityIcon,
  AttachFile as AttachFileIcon,
  AccessTime as AccessTimeIcon,
  Label as LabelIcon,
  Chat as ChatIcon,
  Mail as MailIcon,
  FeedbackOutlined as FeedbackIcon,
  QuestionAnswer as QuestionIcon
} from '@mui/icons-material';
import { getUserInquiriesFeedback, createInquiryFeedback, updateInquiryFeedback } from './services/api';
import { format } from 'date-fns';
import { useAuth } from './AuthContext';

// Custom styled components
const StyledCard = ({ children, ...props }) => {
  const theme = useTheme();
  return (
    <Card
      {...props}
      sx={{
        borderRadius: 2,
        boxShadow: theme.shadows[3],
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[6],
        },
        ...props.sx
      }}
    >
      {children}
    </Card>
  );
};

const StyledTableCell = ({ children, ...props }) => {
  const theme = useTheme();
  return (
    <TableCell
      {...props}
      sx={{
        padding: theme.spacing(2),
        fontSize: '0.875rem',
        ...props.sx
      }}
    >
      {children}
    </TableCell>
  );
};

const StyledTableRow = ({ children, ...props }) => {
  const theme = useTheme();
  return (
    <TableRow
      {...props}
      sx={{
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.04),
        },
        ...props.sx
      }}
    >
      {children}
    </TableRow>
  );
};

const StatusChip = ({ status, ...props }) => {
  const theme = useTheme();
  const statusColors = {
    Pending: {
      color: theme.palette.warning.main,
      backgroundColor: alpha(theme.palette.warning.main, 0.1)
    },
    Approved: {
      color: theme.palette.success.main,
      backgroundColor: alpha(theme.palette.success.main, 0.1)
    },
    Rejected: {
      color: theme.palette.error.main,
      backgroundColor: alpha(theme.palette.error.main, 0.1)
    }
  };

  return (
    <Chip
      label={status}
      sx={{
        fontWeight: 500,
        ...statusColors[status],
        ...props.sx
      }}
    />
  );
};

const UrgencyChip = ({ urgency, ...props }) => {
  const theme = useTheme();
  const urgencyColors = {
    High: {
      color: theme.palette.error.main,
      backgroundColor: alpha(theme.palette.error.main, 0.1)
    },
    Medium: {
      color: theme.palette.warning.main,
      backgroundColor: alpha(theme.palette.warning.main, 0.1)
    },
    Low: {
      color: theme.palette.success.main,
      backgroundColor: alpha(theme.palette.success.main, 0.1)
    }
  };

  return (
    <Chip
      label={urgency}
      size="small"
      sx={{
        fontWeight: 500,
        ...urgencyColors[urgency],
        ...props.sx
      }}
    />
  );
};

const LoadingOverlay = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    height="100vh"
    flexDirection="column"
    gap={2}
  >
    <CircularProgress size={40} />
    <Typography variant="body1" color="textSecondary">
      Loading inquiries...
    </Typography>
  </Box>
);

const NoDataMessage = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    height="200px"
    flexDirection="column"
    gap={2}
  >
    <FeedbackIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
    <Typography variant="body1" color="textSecondary">
      No inquiries or feedback found
    </Typography>
  </Box>
);
const InquiryFeedback = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
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
  const [viewingInquiry, setViewingInquiry] = useState(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          await fetchInquiriesFeedback();
        } catch (error) {
          console.error('Error fetching data:', error);
          setSnackbar({
            open: true,
            message: 'Failed to load inquiries',
            severity: 'error'
          });
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const fetchInquiriesFeedback = async () => {
    try {
      setLoading(true);
      if (!user) {
        throw new Error('No authenticated user found');
      }
      const data = await getUserInquiriesFeedback(user.email);
      const sortedData = data.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setInquiries(sortedData);
    } catch (err) {
      console.error('Error fetching inquiries and feedback:', err);
      setError('Failed to fetch inquiries and feedback. Please try again later.');
    } finally {
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
        status: inquiry.status,
        urgency: inquiry.urgency,
        file: null
      });
    } else {
      setEditingInquiry(null);
      setFormData({
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
    setFormErrors({ subject: false, description: false });
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setFormErrors({ subject: false, description: false });
    setSubmitError(null);
    setEditingInquiry(null);
  };

  const handleViewOpen = (inquiry) => {
    setViewingInquiry(inquiry);
    setViewDialogOpen(true);
  };

  const handleViewClose = () => {
    setViewDialogOpen(false);
    setViewingInquiry(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for the field being edited
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (e.g., 5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: 'File size must be less than 5MB',
          severity: 'error'
        });
        return;
      }
      setFormData((prev) => ({ ...prev, file }));
    }
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
          email: user.email,
          file: formData.file
        };

        if (editingInquiry) {
          await updateInquiryFeedback(editingInquiry.id, submissionData);
          setSnackbar({
            open: true,
            message: 'Inquiry updated successfully',
            severity: 'success'
          });
        } else {
          await createInquiryFeedback(submissionData);
          setSnackbar({
            open: true,
            message: 'New inquiry submitted successfully',
            severity: 'success'
          });
        }

        handleDialogClose();
        await fetchInquiriesFeedback();
      } catch (err) {
        console.error('Error submitting inquiry/feedback:', err);
        setSubmitError(`Failed to submit: ${err.message}`);
        setSnackbar({
          open: true,
          message: 'Failed to submit inquiry',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    }
  };
  // ... (continuing from previous part)

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
    if (!replyText.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter a reply',
        severity: 'warning'
      });
      return;
    }

    try {
      setLoading(true);
      await updateInquiryFeedback(editingInquiry.id, {
        userReply: replyText,
      });
      handleReplyClose();
      await fetchInquiriesFeedback();
      setSnackbar({
        open: true,
        message: 'Reply submitted successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error submitting reply:', err);
      setSnackbar({
        open: true,
        message: 'Failed to submit reply',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const hasRole = (requiredRoles) => {
    if (!user || !Array.isArray(user.accessRights)) return false;
    return requiredRoles.some(role => user.accessRights.includes(role));
  };

  if (loading && inquiries.length === 0) return <LoadingOverlay />;
  if (error) return (
    <Alert 
      severity="error" 
      sx={{ 
        maxWidth: 600, 
        mx: 'auto', 
        mt: 4,
        borderRadius: 2,
        boxShadow: theme.shadows[3]
      }}
    >
      {error}
    </Alert>
  );

  const pendingCount = inquiries.filter(item => item.status === 'Pending').length;
  const awaitingActionCount = inquiries.filter(item => 
    ['Approved', 'Rejected'].includes(item.status) && !item.userReply
  ).length;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header Section */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems={{ xs: 'stretch', sm: 'center' }}
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={2}
        mb={4}
      >
        <Typography 
          variant="h4" 
          component="h1"
          sx={{ 
            fontWeight: 600,
            color: theme.palette.primary.main
          }}
        >
          Inquiries & Feedback
        </Typography>
        {hasRole(["Create Inquiries and Feedback"]) && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleDialogOpen()}
            startIcon={<ChatIcon />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              boxShadow: theme.shadows[2]
            }}
          >
            Create New Inquiry
          </Button>
        )}
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
        <StyledCard>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Badge color="warning" badgeContent={pendingCount}>
                  <QuestionIcon color="warning" sx={{ fontSize: 32 }} />
                </Badge>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Open Inquiries
                  </Typography>
                  <Typography variant="h4" component="p">
                    {pendingCount}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StyledCard>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Badge color="info" badgeContent={awaitingActionCount}>
                  <ReplyIcon color="info" sx={{ fontSize: 32 }} />
                </Badge>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Awaiting Your Reply
                  </Typography>
                  <Typography variant="h4" component="p">
                    {awaitingActionCount}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      {/* Main Table */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          borderRadius: 2,
          boxShadow: theme.shadows[3],
          overflow: 'hidden'
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.04) }}>
              <StyledTableCell width="50">#</StyledTableCell>
              <StyledTableCell width="120">Type</StyledTableCell>
              <StyledTableCell>Subject</StyledTableCell>
              <StyledTableCell width="120">Status</StyledTableCell>
              <StyledTableCell width="180">Date Filed</StyledTableCell>
              <StyledTableCell width="100">Urgency</StyledTableCell>
              <StyledTableCell width="120" align="center">Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inquiries.length === 0 ? (
              <TableRow>
                <StyledTableCell colSpan={7}>
                  <NoDataMessage />
                </StyledTableCell>
              </TableRow>
            ) : (
              inquiries.map((inquiry, index) => (
                <StyledTableRow key={inquiry.id}>
                  <StyledTableCell>{index + 1}</StyledTableCell>
                  <StyledTableCell>
                    <Chip
                      icon={inquiry.type === 'Inquiry' ? <QuestionIcon /> : <FeedbackIcon />}
                      label={inquiry.type}
                      size="small"
                      variant="outlined"
                      sx={{ minWidth: 90 }}
                    />
                  </StyledTableCell>
                  <StyledTableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                      {inquiry.subject}
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell>
                    <StatusChip status={inquiry.status} />
                  </StyledTableCell>
                  <StyledTableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <AccessTimeIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {format(new Date(inquiry.createdAt), 'MMM d, yyyy')}
                      </Typography>
                    </Stack>
                  </StyledTableCell>
                  <StyledTableCell>
                    <UrgencyChip urgency={inquiry.urgency} />
                  </StyledTableCell>
                  <StyledTableCell>
                    <Stack direction="row" justifyContent="center" spacing={1}>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          onClick={() => handleViewOpen(inquiry)}
                          sx={{ 
                            color: theme.palette.primary.main,
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.1)
                            }
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {inquiry.status === 'Pending' && (
                        <Tooltip title="Edit">
                          <IconButton 
                            size="small"
                            onClick={() => handleDialogOpen(inquiry)}
                            sx={{ 
                              color: theme.palette.warning.main,
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.warning.main, 0.1)
                              }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {['Approved', 'Rejected'].includes(inquiry.status) && !inquiry.userReply && (
                        <Tooltip title="Reply">
                          <IconButton 
                            size="small"
                            onClick={() => handleReplyOpen(inquiry)}
                            sx={{ 
                              color: theme.palette.info.main,
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.info.main, 0.1)
                              }
                            }}
                          >
                            <ReplyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </StyledTableCell>
                </StyledTableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleDialogClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[5]
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          {editingInquiry ? 'Edit Inquiry / Feedback' : 'Create New Inquiry / Feedback'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}
          <Stack spacing={2}>
            <TextField
              select
              fullWidth
              label="Type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              variant="outlined"
            >
              <MenuItem value="Inquiry">Inquiry</MenuItem>
              <MenuItem value="Feedback">Feedback</MenuItem>
            </TextField>

            <TextField
              fullWidth
              label="Subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              error={formErrors.subject}
              helperText={formErrors.subject ? 'Subject is required' : ''}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Description"
              name="description"
              multiline
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              error={formErrors.description}
              helperText={formErrors.description ? 'Description is required' : ''}
              variant="outlined"
            />

            <TextField
              select
              fullWidth
              label="Urgency"
              name="urgency"
              value={formData.urgency}
              onChange={handleInputChange}
              variant="outlined"
            >
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
            </TextField>

            <Box>
              <input
                accept="image/*,.pdf,.doc,.docx"
                style={{ display: 'none' }}
                id="file-upload"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<AttachFileIcon />}
                  sx={{ textTransform: 'none' }}
                >
                  Attach File
                </Button>
              </label>
              {formData.file && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Selected file: {formData.file.name}
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? 'Submitting...' : (editingInquiry ? 'Update' : 'Submit')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog 
        open={replyDialogOpen} 
        onClose={handleReplyClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[5]
          }
        }}
      >
        <DialogTitle>Reply to Admin Response</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <Box sx={{ backgroundColor: 'grey.50', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" color="textSecondary">
                Admin Response
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {editingInquiry?.adminReply}
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Your Reply"
              multiline
              rows={4}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              variant="outlined"
            />

            <Alert severity="info">
              Note: This will be your final reply to this {editingInquiry?.status.toLowerCase()} inquiry.
              If you need further assistance, please create a new inquiry.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleReplyClose}>Cancel</Button>
          <Button 
            onClick={handleReplySubmit} 
            variant="contained" 
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? 'Sending...' : 'Send Reply'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={handleViewClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[5]
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            View Details
            <StatusChip status={viewingInquiry?.status || ''} />
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent>
          {viewingInquiry && (
            <Stack spacing={3} sx={{ pt: 1 }}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Type</Typography>
                <Chip
                  icon={viewingInquiry.type === 'Inquiry' ? <QuestionIcon /> : <FeedbackIcon />}
                  label={viewingInquiry.type}
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" color="textSecondary">Subject</Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {viewingInquiry.subject}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    mt: 1, 
                    backgroundColor: alpha(theme.palette.background.paper, 0.7)
                  }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {viewingInquiry.description}
                  </Typography>
                </Paper>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Filed On</Typography>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                    <AccessTimeIcon fontSize="small" color="action" />
                    <Typography variant="body1">
                      {format(new Date(viewingInquiry.createdAt), 'PPpp')}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">Urgency</Typography>
                  <UrgencyChip urgency={viewingInquiry.urgency} sx={{ mt: 1 }} />
                </Grid>
              </Grid>

              {viewingInquiry.adminReply && (
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Admin Response
                  </Typography>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      mt: 1, 
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {viewingInquiry.adminReply}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {viewingInquiry.userReply && (
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Your Reply
                  </Typography>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      mt: 1, 
                      backgroundColor: alpha(theme.palette.secondary.main, 0.05),
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {viewingInquiry.userReply}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {viewingInquiry.fileURL && (
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Attachment
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AttachFileIcon />}
                    href={viewingInquiry.fileURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      mt: 1, 
                      textTransform: 'none',
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                      '&:hover': {
                        borderColor: theme.palette.primary.dark,
                        backgroundColor: alpha(theme.palette.primary.main, 0.04)
                      }
                    }}
                  >
                    View Attachment
                  </Button>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Stack direction="row" spacing={2}>
            <Button 
              onClick={handleViewClose}
              variant="outlined"
              sx={{ textTransform: 'none' }}
            >
              Close
            </Button>
            {viewingInquiry?.status === 'Pending' && (
              <Button 
                onClick={() => {
                  handleViewClose();
                  handleDialogOpen(viewingInquiry);
                }}
                variant="contained"
                startIcon={<EditIcon />}
                sx={{ textTransform: 'none' }}
              >
                Edit
              </Button>
            )}
            {['Approved', 'Rejected'].includes(viewingInquiry?.status) && !viewingInquiry?.userReply && (
              <Button 
                onClick={() => {
                  handleViewClose();
                  handleReplyOpen(viewingInquiry);
                }}
                variant="contained"
                startIcon={<ReplyIcon />}
                sx={{ textTransform: 'none' }}
              >
                Reply
              </Button>
            )}
          </Stack>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity} 
          variant="filled"
          elevation={6}
          sx={{ 
            width: '100%',
            '& .MuiAlert-message': {
              fontSize: '0.925rem'
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Loading Overlay */}
      {loading && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bgcolor={alpha('#fff', 0.7)}
          zIndex={theme.zIndex.modal + 1}
        >
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

// Helper components for consistent styling
const StyledBox = ({ children, ...props }) => (
  <Box
    {...props}
    sx={{
      borderRadius: 2,
      p: 2,
      backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.8),
      border: '1px solid',
      borderColor: (theme) => theme.palette.divider,
      ...props.sx
    }}
  >
    {children}
  </Box>
);

const StyledActionButton = ({ children, ...props }) => {
  const theme = useTheme();
  return (
    <Button
      {...props}
      sx={{
        textTransform: 'none',
        borderRadius: 2,
        px: 3,
        py: 1,
        boxShadow: theme.shadows[2],
        '&:hover': {
          boxShadow: theme.shadows[4]
        },
        ...props.sx
      }}
    >
      {children}
    </Button>
  );
};

export default InquiryFeedback;