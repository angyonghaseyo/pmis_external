import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Card,
  CardContent,
  TablePagination,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { getBillingRequests } from './services/api';
import { format, parseISO, isValid } from 'date-fns';

const BillingRequests = ({ companyId }) => {
  const [billingRequests, setBillingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestType, setRequestType] = useState('OperatorRequisition');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [summaryStats, setSummaryStats] = useState({
    totalRequests: 0,
    pendingAmount: 0,
    processedAmount: 0
  });

  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
      return isValid(date) ? format(date, 'dd/MM/yyyy HH:mm') : 'Invalid Date';
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  useEffect(() => {
    fetchBillingRequests();
  }, [companyId, requestType]);

  const fetchBillingRequests = async () => {
    setLoading(true);
    try {
      const data = await getBillingRequests(companyId, requestType);
      // Convert server timestamps to Date objects
      const processedData = data.map(request => ({
        ...request,
        createdAt: request.createdAt ? new Date(request.createdAt) : new Date(),
        updatedAt: request.updatedAt ? new Date(request.updatedAt) : new Date()
      }));
      
      setBillingRequests(processedData);
      
      // Calculate summary statistics
      const stats = processedData.reduce((acc, request) => {
        acc.totalRequests++;
        if (request.status === 'pending') {
          acc.pendingAmount += request.totalAmount || 0;
        } else {
          acc.processedAmount += request.totalAmount || 0;
        }
        return acc;
      }, { totalRequests: 0, pendingAmount: 0, processedAmount: 0 });
      
      setSummaryStats(stats);
      setError(null);
    } catch (error) {
      console.error("Error fetching billing requests:", error);
      setError("Failed to load billing requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestTypeChange = (event) => {
    setRequestType(event.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
  };

  const handleCloseDetails = () => {
    setSelectedRequest(null);
  };

  const getStatusChipColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredRequests = billingRequests
    .filter(request => {
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesSearch = searchTerm === '' || 
        Object.values(request).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      return matchesStatus && matchesSearch;
    });

  const paginatedRequests = filteredRequests
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Billing Requests
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="textSecondary">
                Total Requests
              </Typography>
              <Typography variant="h4">
                {summaryStats.totalRequests}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="textSecondary">
                Pending Amount
              </Typography>
              <Typography variant="h4">
                ${summaryStats.pendingAmount.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="textSecondary">
                Processed Amount
              </Typography>
              <Typography variant="h4">
                ${summaryStats.processedAmount.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Request Type</InputLabel>
            <Select
              value={requestType}
              onChange={handleRequestTypeChange}
              label="Request Type"
            >
              <MenuItem value="OperatorRequisition">Operator Requisition</MenuItem>
              <MenuItem value="AdHocResourceRequest">Ad Hoc Resource Request</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              label="Status"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Search"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
      </Grid>

      {/* Main Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Request ID</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Rate</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Total Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRequests.length > 0 ? (
              paginatedRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.requestId || request.id}</TableCell>
                  <TableCell>{request.resourceType}</TableCell>
                  <TableCell>{formatDate(request.createdAt)}</TableCell>
                  <TableCell>${(request.rate || 0).toLocaleString()}</TableCell>
                  <TableCell>{request.quantity || 0}</TableCell>
                  <TableCell>${(request.totalAmount || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={request.status || 'Pending'}
                      color={getStatusChipColor(request.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleViewDetails(request)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No billing requests found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredRequests.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Details Dialog */}
      <Dialog
        open={Boolean(selectedRequest)}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Request Details
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Grid container spacing={2} sx={{ pt: 2 }}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Request ID
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedRequest.requestId || selectedRequest.id}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Type
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedRequest.resourceType}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Created Date
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatDate(selectedRequest.createdAt)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Status
                </Typography>
                <Chip
                  label={selectedRequest.status || 'Pending'}
                  color={getStatusChipColor(selectedRequest.status)}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Rate
                </Typography>
                <Typography variant="body1" gutterBottom>
                  ${(selectedRequest.rate || 0).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Quantity
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedRequest.quantity || 0}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total Amount
                </Typography>
                <Typography variant="body1" gutterBottom>
                  ${(selectedRequest.totalAmount || 0).toLocaleString()}
                </Typography>
              </Grid>
              {selectedRequest.description && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Description
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedRequest.description}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BillingRequests;