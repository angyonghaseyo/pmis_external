import React, { useState, useEffect } from 'react';
import { getBillingRequests } from './services/api';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';

const BillingRequests = ({ companyId }) => {
  const [billingRequests, setBillingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestType, setRequestType] = useState('OperatorRequisition');
  const [statusFilter, setStatusFilter] = useState('ungenerated');

  useEffect(() => {
    const fetchBillingRequests = async () => {
      setLoading(true);
      try {
        const data = await getBillingRequests(companyId, requestType);
        setBillingRequests(data);
      } catch (error) {
        console.error("Error fetching billing requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBillingRequests();
  }, [companyId, requestType]);

  const handleRequestTypeChange = (event) => {
    setRequestType(event.target.value);
    setStatusFilter('ungenerated'); // Reset filter when changing request type
  };

  const filteredRequests = billingRequests.filter(
    (request) => request.status === statusFilter
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Billing Requests
      </Typography>

      {/* Request Type Selector */}
      <FormControl sx={{ mb: 2, minWidth: 200 }}>
        <InputLabel>Request Type</InputLabel>
        <Select
          value={requestType}
          onChange={handleRequestTypeChange}
          label="Request Type"
        >
          <MenuItem value="OperatorRequisition">Operator Requisition</MenuItem>
          <MenuItem value="AdHocResourceRequest">Ad Hoc Resource Request</MenuItem>
          {/* Add other request types as needed */}
        </Select>
      </FormControl>

      {/* Generated vs Ungenerated Filter */}
      <Tabs
        value={statusFilter}
        onChange={(e, newValue) => setStatusFilter(newValue)}
        aria-label="Status Filter"
      >
        <Tab value="ungenerated" label="Ungenerated Requests" />
        <Tab value="generated" label="Generated Requests" />
      </Tabs>

      {/* Billing Requests Table */}
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Request ID</TableCell>
              <TableCell>Resource Type</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Rate</TableCell>
              <TableCell>Total Amount</TableCell>
              <TableCell>Date Completed</TableCell>
              {/* Add more columns based on request type */}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRequests.length > 0 ? (
              filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.requestId}</TableCell>
                  <TableCell>{request.resourceType}</TableCell>
                  <TableCell>{request.quantity}</TableCell>
                  <TableCell>{request.rate}</TableCell>
                  <TableCell>{request.totalAmount}</TableCell>
                  <TableCell>{new Date(request.dateCompleted).toLocaleString()}</TableCell>
                  {/* Display additional attributes conditionally based on requestType */}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No {statusFilter} billing requests for {requestType}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default BillingRequests;
