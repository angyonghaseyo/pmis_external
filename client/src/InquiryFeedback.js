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
  MenuItem
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate data fetching
    const simulateData = () => {
      const inquiryData = [
        { id: 1, title: 'Issue with Docking', status: 'Open', dateFiled: '2023-09-15' },
        { id: 2, title: 'Request for Additional Manpower', status: 'Pending User Action', dateFiled: '2023-09-10' },
        { id: 3, title: 'Feedback on Cargo Handling', status: 'Closed', dateFiled: '2023-09-05' },
      ];

      setInquiries(inquiryData);
    };

    simulateData();
  }, []);

  const openDetailsPage = (id) => {
    navigate(`/inquiries/${id}`);
  };

  const handleDialogOpen = () => {
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setFormErrors({ subject: false, description: false });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, file: e.target.files[0] }));
  };

  const handleSubmit = () => {
    // Validate fields
    const errors = {
      subject: formData.subject.trim() === '',
      description: formData.description.trim() === ''
    };

    setFormErrors(errors);

    if (!errors.subject && !errors.description) {
      // Simulate form submission
      console.log("Submitted data:", formData);
      setOpenDialog(false);
      setFormData({
        type: 'Inquiry',
        subject: '',
        description: '',
        urgency: 'Normal',
        file: null
      });
      setFormErrors({ subject: false, description: false });
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Header />

        {/* Dashboard */}
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
                <Typography variant="h4" component="p">1</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" color="textSecondary">Pending User Action</Typography>
                <Typography variant="h4" component="p">1</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Inquiry/Feedback Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date Filed</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inquiries.map((inquiry) => (
                <TableRow key={inquiry.id} onClick={() => openDetailsPage(inquiry.id)} sx={{ cursor: 'pointer' }}>
                  <TableCell>{inquiry.id}</TableCell>
                  <TableCell>{inquiry.title}</TableCell>
                  <TableCell>{inquiry.status}</TableCell>
                  <TableCell>{inquiry.dateFiled}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Dialog for New Inquiry/Feedback */}
        <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Inquiry / Feedback</DialogTitle>
          <DialogContent>
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

            <input type="file" onChange={handleFileChange} />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
              Submit
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default InquiryFeedback;
