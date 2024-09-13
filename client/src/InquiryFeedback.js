import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';  // Import your Sidebar component
import Header from './Header';    // Import your Header component

const InquiryFeedback = () => {
  const [inquiries, setInquiries] = useState([]);
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

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Header />

        {/* Dashboard-like statistics */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <Typography variant="h4" component="h2">Inquiries & Feedback</Typography>
          <Button variant="contained" color="primary" onClick={() => navigate('/inquiries/new')}>
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
      </Box>
    </Box>
  );
};

export default InquiryFeedback;
