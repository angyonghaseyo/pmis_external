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
  Grid,
  Card,
  CardContent,
  TablePagination,
  TextField,
  Chip
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
    switch(type) {
      case 'OperatorRequisition':
        return 'operatorrequisition';
      case 'AdHocResourceRequest':
        return 'adhocresource';
      case 'VesselVisit':
        return 'vesselvisit';
      case 'FacilityRental':
        return 'facilityrental';
      default:
        return type.toLowerCase();
    }
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

  const getServiceDetails = (request) => {
    const defaultDetails = {
      berthHours: 0,
      berthRate: 0,
      containerCount: 0,
      containerRate: 0,
      rate: 0,
      quantity: 0
    };

    if (!request || !request.requestType) {
      return defaultDetails;
    }

    if (request.requestType === 'vesselvisit' && Array.isArray(request.services)) {
      const berthService = request.services.find(s => s?.service === 'Berth Usage') || {};
      const containerService = request.services.find(s => s?.service === 'Container Handling') || {};
      
      return {
        ...defaultDetails,
        berthHours: berthService.quantity || 0,
        berthRate: berthService.rate || 0,
        containerCount: containerService.quantity || 0,
        containerRate: containerService.rate || 0
      };
    }

    return {
      ...defaultDetails,
      rate: request.rate || 0,
      quantity: request.quantity || 0
    };
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

  const getVisitTypeColor = (visitType) => {
    return visitType === 'Scheduled' ? 'primary' : 'secondary';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Billing Requests
      </Typography>

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
                ${(summaryStats.pendingAmount || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
            <MenuItem value="VesselVisit">Vessel Visit</MenuItem>
            <MenuItem value="FacilityRental">Facility Rental</MenuItem>
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

      {/* Updated table with Visit Type column */}
      <TableContainer component={Paper}>
        <Table>
        <TableHead>
          <TableRow>
            {requestType !== 'FacilityRental' && <TableCell>Vessel Visit</TableCell>}
            {requestType === 'VesselVisit' ? (
              <>
                <TableCell>Visit Type</TableCell>
                <TableCell>Date Completed</TableCell>
                <TableCell>Berth Usage</TableCell>
                <TableCell>Container Handling</TableCell>
                <TableCell>Total Amount</TableCell>
              </>
            ) : requestType === 'FacilityRental' ? (
              <>
                <TableCell>Facility Name</TableCell>
                <TableCell>Date Completed</TableCell>
                <TableCell>Rate per Hour</TableCell>
                <TableCell>Hours Rented</TableCell>
                <TableCell>Total Amount</TableCell>
              </>
            ) : (
              <>
                <TableCell>Type</TableCell>
                <TableCell>Date Completed</TableCell>
                <TableCell>Rate</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Total Amount</TableCell>
              </>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedRequests.length > 0 ? (
            paginatedRequests.map((request) => {
              const serviceDetails = getServiceDetails(request);
              const amount = request.totalAmount || 0;

              if (requestType === 'VesselVisit') {
                const berthAmount = (serviceDetails.berthHours * serviceDetails.berthRate) || 0;
                const containerAmount = (serviceDetails.containerCount * serviceDetails.containerRate) || 0;

                return (
                  <TableRow key={request.id || Math.random()}>
                    <TableCell>{request.vesselVisit || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={request.visitType || 'Unknown'} 
                        color={getVisitTypeColor(request.visitType)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(request.dateCompleted)}</TableCell>
                    <TableCell>
                      {`${serviceDetails.berthHours} hours @ $${serviceDetails.berthRate}/hour ($${berthAmount.toLocaleString()})`}
                    </TableCell>
                    <TableCell>
                      {`${serviceDetails.containerCount} containers @ $${serviceDetails.containerRate}/container ($${containerAmount.toLocaleString()})`}
                    </TableCell>
                    <TableCell>${amount.toLocaleString()}</TableCell>
                  </TableRow>
                );
              } else if (requestType === 'FacilityRental') {
                return (
                  <TableRow key={request.id || Math.random()}>
                    <TableCell>{request.facilityName || '-'}</TableCell>
                    <TableCell>{formatDate(request.dateCompleted)}</TableCell>
                    <TableCell>${(request.rate || 0).toLocaleString()}</TableCell>
                    <TableCell>{request.quantity || 0}</TableCell>
                    <TableCell>${amount.toLocaleString()}</TableCell>
                  </TableRow>
                );
              } else {
                return (
                  <TableRow key={request.id || Math.random()}>
                    <TableCell>{request.vesselVisit || '-'}</TableCell>
                    <TableCell>
                      {request.requestType === 'adhocresource' ? request.resourceType : request.operatorSkill}
                    </TableCell>
                    <TableCell>{formatDate(request.dateCompleted)}</TableCell>
                    <TableCell>${(serviceDetails.rate || 0).toLocaleString()}</TableCell>
                    <TableCell>{serviceDetails.quantity || 0}</TableCell>
                    <TableCell>${amount.toLocaleString()}</TableCell>
                  </TableRow>
                );
              }
            })
          ) : (
            <TableRow>
              <TableCell colSpan={6} align="center">
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