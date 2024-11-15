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
            case 'ValueAddedService':
                return 'valueaddedservice';
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

    const getVisitTypeColor = (visitType) => {
        return visitType === 'Scheduled' ? 'primary' : 'secondary';
    };

    const getServiceTypeLabel = (serviceType) => {
        const labels = {
            'sampling': 'Sampling',
            'repacking': 'Repacking',
            'storage': 'Storage',
            'transloading': 'Transloading'
        };
        return labels[serviceType] || serviceType;
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

    const renderTableHeaders = () => {
        switch(requestType) {
            case 'ValueAddedService':
                return (
                    <TableRow>
                        <TableCell>Cargo Number</TableCell>
                        <TableCell>Service Type</TableCell>
                        <TableCell>Date Completed</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Rate ($)</TableCell>
                        <TableCell>Total Amount ($)</TableCell>
                        <TableCell>Status</TableCell>
                    </TableRow>
                );
            case 'VesselVisit':
                return (
                    <TableRow>
                        <TableCell>Vessel Visit</TableCell>
                        <TableCell>Visit Type</TableCell>
                        <TableCell>Date Completed</TableCell>
                        <TableCell>Berth Usage</TableCell>
                        <TableCell>Container Handling</TableCell>
                        <TableCell>Total Amount ($)</TableCell>
                        <TableCell>Status</TableCell>
                    </TableRow>
                );
            case 'FacilityRental':
                return (
                    <TableRow>
                        <TableCell>Facility Name</TableCell>
                        <TableCell>Date Completed</TableCell>
                        <TableCell>Rate per Hour</TableCell>
                        <TableCell>Hours Rented</TableCell>
                        <TableCell>Total Amount ($)</TableCell>
                        <TableCell>Status</TableCell>
                    </TableRow>
                );
            default:
                return (
                    <TableRow>
                        <TableCell>Vessel Visit</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Date Completed</TableCell>
                        <TableCell>Rate</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Total Amount ($)</TableCell>
                        <TableCell>Status</TableCell>
                    </TableRow>
                );
        }
    };

    const renderTableRow = (request) => {
        switch(requestType) {
            case 'ValueAddedService':
                return (
                    <TableRow key={request.id || request.requestId}>
                        <TableCell>{request.cargoNumber}</TableCell>
                        <TableCell>{getServiceTypeLabel(request.serviceType)}</TableCell>
                        <TableCell>{formatDate(request.dateCompleted)}</TableCell>
                        <TableCell>{request.quantity}</TableCell>
                        <TableCell>{request.rate}</TableCell>
                        <TableCell>{request.totalAmount?.toLocaleString()}</TableCell>
                        <TableCell>
                            <Chip
                                label={request.status}
                                color={request.status === 'ungenerated' ? 'warning' : 'success'}
                                size="small"
                            />
                        </TableCell>
                    </TableRow>
                );
            case 'VesselVisit':
                const berthAmount = (request.services?.find(s => s.service === 'Berth Usage')?.amount || 0).toLocaleString();
                const containerAmount = (request.services?.find(s => s.service === 'Container Handling')?.amount || 0).toLocaleString();
                return (
                    <TableRow key={request.id || request.requestId}>
                        <TableCell>{request.vesselVisit}</TableCell>
                        <TableCell>
                            <Chip 
                                label={request.visitType || 'Unknown'} 
                                color={getVisitTypeColor(request.visitType)}
                                size="small"
                            />
                        </TableCell>
                        <TableCell>{formatDate(request.dateCompleted)}</TableCell>
                        <TableCell>${berthAmount}</TableCell>
                        <TableCell>${containerAmount}</TableCell>
                        <TableCell>${request.totalAmount?.toLocaleString()}</TableCell>
                        <TableCell>
                            <Chip
                                label={request.status}
                                color={request.status === 'ungenerated' ? 'warning' : 'success'}
                                size="small"
                            />
                        </TableCell>
                    </TableRow>
                );
            case 'FacilityRental':
                return (
                    <TableRow key={request.id || request.requestId}>
                        <TableCell>{request.facilityName}</TableCell>
                        <TableCell>{formatDate(request.dateCompleted)}</TableCell>
                        <TableCell>${request.rate?.toLocaleString()}</TableCell>
                        <TableCell>{request.quantity}</TableCell>
                        <TableCell>${request.totalAmount?.toLocaleString()}</TableCell>
                        <TableCell>
                            <Chip
                                label={request.status}
                                color={request.status === 'ungenerated' ? 'warning' : 'success'}
                                size="small"
                            />
                        </TableCell>
                    </TableRow>
                );
            default:
                return (
                    <TableRow key={request.id || request.requestId}>
                        <TableCell>{request.vesselVisit || '-'}</TableCell>
                        <TableCell>
                            {request.requestType === 'adhocresource' ? 
                                request.resourceType : request.operatorSkill}
                        </TableCell>
                        <TableCell>{formatDate(request.dateCompleted)}</TableCell>
                        <TableCell>${request.rate?.toLocaleString()}</TableCell>
                        <TableCell>{request.quantity}</TableCell>
                        <TableCell>${request.totalAmount?.toLocaleString()}</TableCell>
                        <TableCell>
                            <Chip
                                label={request.status}
                                color={request.status === 'ungenerated' ? 'warning' : 'success'}
                                size="small"
                            />
                        </TableCell>
                    </TableRow>
                );
        }
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
                            <MenuItem value="ValueAddedService">Value Added Service</MenuItem>
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

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        {renderTableHeaders()}
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : paginatedRequests.length > 0 ? (
                            paginatedRequests.map((request) => renderTableRow(request))
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