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
} from '@mui/material';
import { getBillingRequests } from './services/api';
import { format, parseISO, isValid } from 'date-fns';

const BillingRequests = ({ companyId }) => {
  const [billingRequests, setBillingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestType, setRequestType] = useState('OperatorRequisition');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [summaryStats, setSummaryStats] = useState({
    totalRequests: 0,
    pendingAmount: 0,
  });

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

  const mapRequestTypeToDbValue = (type) => {
    return type === 'OperatorRequisition' ? 'operatorrequisition' : 'adhocresource';
  };

  useEffect(() => {
    fetchBillingRequests();
  }, [companyId, requestType]);

  const fetchBillingRequests = async () => {
    setLoading(true);
    try {
      const mappedRequestType = mapRequestTypeToDbValue(requestType);
      const data = await getBillingRequests(companyId, mappedRequestType);
      const processedData = data.map(request => ({
        ...request,
        createdAt: request.createdAt ? new Date(request.createdAt) : new Date(),
      }));

      setBillingRequests(processedData);

      const stats = processedData.reduce((acc, request) => {
        acc.totalRequests++;
        if (request.status === 'ungenerated') {
          acc.pendingAmount += request.totalAmount || 0;
        }
        return acc;
      }, { totalRequests: 0, pendingAmount: 0 });

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

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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

  const filteredRequests = billingRequests.filter(request => {
    return (
      searchTerm === '' ||
      Object.values(request).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  });

  const paginatedRequests = filteredRequests.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
        <Grid item xs={12} sm={6}>
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
        <Grid item xs={12} sm={6}>
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
      </Grid>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
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
        <Grid item xs={12} sm={6}>
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
              <TableCell>Date Completed</TableCell>
              <TableCell>Rate</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Total Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRequests.length > 0 ? (
              paginatedRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.requestId || request.id}</TableCell>
                  <TableCell>
                    {requestType === 'AdHocResourceRequest' ? request.resourceType : request.operatorSkill}
                  </TableCell>
                  <TableCell>{formatDate(request.createdAt)}</TableCell>
                  <TableCell>${(request.rate || 0).toLocaleString()}</TableCell>
                  <TableCell>{request.quantity || 0}</TableCell>
                  <TableCell>${(request.totalAmount || 0).toLocaleString()}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
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
    </Box>
  );
};

export default BillingRequests;
