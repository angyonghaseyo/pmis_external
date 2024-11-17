import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Container,
    Chip,
    IconButton,
    TextField,
    Grid,
    Card,
    CardContent,
    Tooltip,
    CircularProgress,
    Snackbar,
    Alert,
    Dialog,
    DialogContent,
    DialogTitle,
    DialogActions,
    Menu,
    MenuItem,
} from '@mui/material';
import { Edit, Delete, Visibility, Search, Download, FilterList } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import ScienceIcon from '@mui/icons-material/Science';
import CloseIcon from '@mui/icons-material/Close';
import CargoSamplingRequest from './CargoSamplingRequest';
import {
    getSamplingRequests,
    deleteSamplingRequest,
} from './services/api';

const CargoSampling = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState(null);
    const [filters, setFilters] = useState({
        status: 'all',
        searchQuery: '',
        dateRange: 'all'
    });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info'
    });
    const [viewRequest, setViewRequest] = useState(null);
    const [filterAnchorEl, setFilterAnchorEl] = useState(null);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const requestData = await getSamplingRequests(filters);
            setRequests(requestData);
        } catch (error) {
            console.error('Error fetching requests:', error);
            setSnackbar({
                open: true,
                message: 'Error fetching sampling requests',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [filters]);

    const handleDelete = async (requestId) => {
        try {
            await deleteSamplingRequest(requestId);
            await fetchRequests();
            setSnackbar({
                open: true,
                message: 'Request deleted successfully',
                severity: 'success'
            });
            setDeleteConfirmation(null);
        } catch (error) {
            console.error('Error deleting request:', error);
            setSnackbar({
                open: true,
                message: error.message || 'Error deleting request',
                severity: 'error'
            });
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'Pending': 'warning',
            'In Progress': 'info',
            'Completed': 'success',
            'Rejected': 'error'
        };
        return colors[status] || 'default';
    };

    const handleFilterClick = (event) => {
        setFilterAnchorEl(event.currentTarget);
    };

    const handleFilterClose = () => {
        setFilterAnchorEl(null);
    };

    const handleFilterChange = (filterType) => {
        setFilters(prev => ({ ...prev, dateRange: filterType }));
        handleFilterClose();
    };

    const formatDate = (timestamp) => {
        if (!timestamp || typeof timestamp._seconds !== 'number') return 'N/A';
        return new Date(timestamp._seconds * 1000).toLocaleString();
    };


    const renderMetrics = () => {
        const metrics = {
            total: requests.length,
            pending: requests.filter(r => r.status === 'Pending').length,
            inProgress: requests.filter(r => r.status === 'In Progress').length,
            completed: requests.filter(r => r.status === 'Completed').length
        };

        return (
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {Object.entries(metrics).map(([key, value]) => (
                    <Grid item xs={12} sm={6} md={3} key={key}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')} Requests
                                </Typography>
                                <Typography variant="h4">{value}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        );
    };

    const RequestDetailsDialog = ({ request, onClose }) => {
        if (!request) return null;

        return (
            <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">Request Details</Typography>
                        <IconButton onClick={onClose}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>Cargo Information</Typography>
                            <Paper sx={{ p: 2 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="textSecondary">Cargo Number</Typography>
                                        <Typography variant="body1">{request.cargoDetails.cargoNumber}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="textSecondary">Cargo Type</Typography>
                                        <Typography variant="body1">{request.cargoDetails.cargoType}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="textSecondary">Quantity</Typography>
                                        <Typography variant="body1">
                                            {request.cargoDetails.quantity} {request.cargoDetails.unit}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="textSecondary">Status</Typography>
                                        <Chip
                                            label={request.status}
                                            color={getStatusColor(request.status)}
                                            size="small"
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>Sampling Details</Typography>
                            <Paper sx={{ p: 2 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Typography variant="body2" color="textSecondary">Sample Types</Typography>
                                        <Box sx={{ mt: 1 }}>
                                            {request.samplingDetails.sampleType.map((type) => (
                                                <Chip key={type} label={type} sx={{ mr: 1, mb: 1 }} />
                                            ))}
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="body2" color="textSecondary">Testing Requirements</Typography>
                                        <Box sx={{ mt: 1 }}>
                                            {request.samplingDetails.testingRequirements.map((req) => (
                                                <Chip key={req} label={req} sx={{ mr: 1, mb: 1 }} />
                                            ))}
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="textSecondary">Sample Quantity</Typography>
                                        <Typography variant="body1">
                                            {request.samplingDetails.sampleQuantity} {request.samplingDetails.sampleUnit}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>Schedule</Typography>
                            <Paper sx={{ p: 2 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="textSecondary">Start Date</Typography>
                                        <Typography variant="body1">
                                            {formatDate(request.schedule.startDate)}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="textSecondary">End Date</Typography>
                                        <Typography variant="body1">
                                            {formatDate(request.schedule.endDate)}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>

                        {request.specialInstructions && (
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" gutterBottom>Special Instructions</Typography>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="body1">{request.specialInstructions}</Typography>
                                </Paper>
                            </Grid>
                        )}

                        {request.documents && (
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" gutterBottom>Documents</Typography>
                                <Paper sx={{ p: 2 }}>
                                    <Grid container spacing={2}>
                                        {request.documents.safetyDataSheet && (
                                            <Grid item xs={12}>
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<Download />}
                                                    onClick={() => window.open(request.documents.safetyDataSheet, '_blank')}
                                                >
                                                    Safety Data Sheet
                                                </Button>
                                            </Grid>
                                        )}
                                        {request.documents.additionalDocs?.map((doc, index) => (
                                            <Grid item xs={12} key={index}>
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<Download />}
                                                    onClick={() => window.open(doc, '_blank')}
                                                >
                                                    Additional Document {index + 1}
                                                </Button>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Paper>
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Close</Button>
                </DialogActions>
            </Dialog>
        );
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4">Cargo Sampling Requests</Typography>
                <Button
                    variant="contained"
                    onClick={() => {
                        setEditingId(null);
                        setOpenDialog(true);
                    }}
                    startIcon={<ScienceIcon />}
                >
                    New Sampling Request
                </Button>
            </Box>

            {renderMetrics()}

            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={9}>
                        <TextField
                            fullWidth
                            label="Search"
                            variant="outlined"
                            size="small"
                            value={filters.searchQuery}
                            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                            InputProps={{
                                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<FilterList />}
                            onClick={handleFilterClick}
                        >
                            Filter by Date
                        </Button>
                        <Menu
                            anchorEl={filterAnchorEl}
                            open={Boolean(filterAnchorEl)}
                            onClose={handleFilterClose}
                        >
                            <MenuItem onClick={() => handleFilterChange('all')}>All Time</MenuItem>
                            <MenuItem onClick={() => handleFilterChange('today')}>Today</MenuItem>
                            <MenuItem onClick={() => handleFilterChange('week')}>This Week</MenuItem>
                            <MenuItem onClick={() => handleFilterChange('month')}>This Month</MenuItem>
                        </Menu>
                    </Grid>
                </Grid>
            </Paper>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Request ID</TableCell>
                            <TableCell>Cargo Number</TableCell>
                            <TableCell>Cargo Type</TableCell>
                            <TableCell>Sample Types</TableCell>
                            <TableCell>Date Requested</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : requests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    No sampling requests found
                                </TableCell>
                            </TableRow>
                        ) : (
                            requests.map((request) => (
                                <TableRow key={request.id}>
                                    <TableCell>{request.id.slice(0, 8)}</TableCell>
                                    <TableCell>{request.cargoDetails.cargoNumber}</TableCell>
                                    <TableCell>{request.cargoDetails.cargoType}</TableCell>
                                    <TableCell>
                                        {request.samplingDetails.sampleType.map((type) => (
                                            <Chip
                                                key={type}
                                                label={type}
                                                size="small"
                                                sx={{ mr: 0.5, mb: 0.5 }}
                                            />
                                        ))}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(request.createdAt)}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={request.status}
                                            color={getStatusColor(request.status)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title="View Details">
                                            <IconButton size="small" onClick={() => setViewRequest(request)}>
                                                <Visibility />
                                            </IconButton>
                                        </Tooltip>
                                        {request.status === 'Pending' && (
                                            <>
                                                <Tooltip title="Edit">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            setEditingId(request.id);
                                                            setOpenDialog(true);
                                                        }}
                                                    >
                                                        <Edit />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => setDeleteConfirmation(request.id)}
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                </Tooltip>
                                            </>
                                        )}
                                        {request.status === 'Completed' && (
                                            <Tooltip title="Download Report">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        // Handle download report
                                                        setSnackbar({
                                                            open: true,
                                                            message: 'Report download started',
                                                            severity: 'info'
                                                        });
                                                    }}
                                                >
                                                    <Download />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <CargoSamplingRequest
                open={openDialog}
                handleClose={() => {
                    setOpenDialog(false);
                    setEditingId(null);
                }}
                editingId={editingId}
                onSubmitSuccess={() => {
                    fetchRequests();
                    setOpenDialog(false);
                    setEditingId(null);
                    setSnackbar({
                        open: true,
                        message: `Sampling request ${editingId ? 'updated' : 'created'} successfully`,
                        severity: 'success'
                    });
                }}
            />

            <Dialog
                open={Boolean(deleteConfirmation)}
                onClose={() => setDeleteConfirmation(null)}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this sampling request?
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmation(null)}>Cancel</Button>
                    <Button
                        onClick={() => handleDelete(deleteConfirmation)}
                        color="error"
                        variant="contained"
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {viewRequest && (
                <RequestDetailsDialog
                    request={viewRequest}
                    onClose={() => setViewRequest(null)}
                />
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                    elevation={6}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default CargoSampling;