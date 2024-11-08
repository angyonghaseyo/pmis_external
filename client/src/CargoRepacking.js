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
    MenuItem,
    Grid,
    Card,
    CardContent,
    Tooltip,
    CircularProgress,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Link
} from '@mui/material';
import { Edit, Delete, Visibility, Search, Download } from '@mui/icons-material';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import CargoRepackingRequest from './CargoRepackingRequest';
import { format } from 'date-fns';
import InventoryIcon from '@mui/icons-material/Inventory';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';


const CargoRepacking = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState(null);
    const [viewRequest, setViewRequest] = useState(null);
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

    const fetchRequests = async () => {
        try {
            setLoading(true);
            let q = query(collection(db, 'repackingRequests'), orderBy('createdAt', 'desc'));

            if (filters.status !== 'all') {
                q = query(q, where('status', '==', filters.status));
            }

            const querySnapshot = await getDocs(q);
            const requestData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            }));

            // Apply search filter
            const filteredData = requestData.filter(request => {
                if (filters.searchQuery) {
                    return (
                        request.cargoDetails.cargoNumber.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
                        request.cargoDetails.cargoType.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
                        request.id.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
                        request.status.toLowerCase().includes(filters.searchQuery.toLowerCase())
                    );
                }
                return true;
            });

            setRequests(filteredData);
        } catch (error) {
            console.error('Error fetching requests:', error);
            setSnackbar({
                open: true,
                message: 'Error fetching repacking requests',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [filters]);

    const handleStatusChange = async (requestId, newStatus) => {
        try {
            await updateDoc(doc(db, 'repackingRequests', requestId), {
                status: newStatus,
                updatedAt: new Date()
            });
            await fetchRequests();
            setSnackbar({
                open: true,
                message: 'Status updated successfully',
                severity: 'success'
            });
        } catch (error) {
            console.error('Error updating status:', error);
            setSnackbar({
                open: true,
                message: 'Error updating status',
                severity: 'error'
            });
        }
    };

    const handleDelete = async (requestId) => {

        try {
            await deleteDoc(doc(db, 'repackingRequests', requestId));
            await fetchRequests();
            setSnackbar({
                open: true,
                message: 'Request deleted successfully',
                severity: 'success'
            });
        } catch (error) {
            console.error('Error deleting request:', error);
            setSnackbar({
                open: true,
                message: 'Error deleting request',
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
                                    {key !== "inProgress" && `${key.charAt(0).toUpperCase() + key.slice(1)} Requests`}
                                    {key === "inProgress" && `In Progress Requests`}
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
                        <Typography variant="h6">Repacking Request Details</Typography>
                        <IconButton onClick={onClose}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={3}>
                        {/* Cargo Information Section */}
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
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="textSecondary">Current Packaging</Typography>
                                        <Typography variant="body1">{request.cargoDetails.currentPackaging}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="textSecondary">Desired Packaging</Typography>
                                        <Typography variant="body1">{request.cargoDetails.desiredPackaging}</Typography>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>

                        {/* Repacking Requirements Section */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>Repacking Requirements</Typography>
                            <Paper sx={{ p: 2 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Typography variant="body2" color="textSecondary" gutterBottom>
                                            Requirements
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {request.repackingDetails.requirements.map((requirement) => (
                                                <Chip
                                                    key={requirement}
                                                    label={requirement}
                                                    size="small"
                                                    sx={{ mr: 1, mb: 1 }}
                                                />
                                            ))}
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>

                        {/* Schedule Section */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>Schedule</Typography>
                            <Paper sx={{ p: 2 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="textSecondary">Start Date</Typography>
                                        <Typography variant="body1">
                                            {format(request.schedule.startDate.toDate(), 'PPpp')}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="textSecondary">End Date</Typography>
                                        <Typography variant="body1">
                                            {format(request.schedule.endDate.toDate(), 'PPpp')}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>

                        {/* Documents Section */}
                        {/* <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>Documents</Typography>
                            <Paper sx={{ p: 2 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Typography variant="body2" color="textSecondary" gutterBottom>
                                            Repacking Checklist
                                        </Typography>


                                        <InsertDriveFileIcon sx={{ mr: 1 }} />
                                        <Link href={request.documents.repackagingChecklist} target="_blank" rel="noopener noreferrer">
                                            Document
                                        </Link>


                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid> */}

                        {/* Special Instructions Section */}
                        {request.specialInstructions && (
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" gutterBottom>Special Instructions</Typography>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="body1">{request.specialInstructions}</Typography>
                                </Paper>
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                {/* <DialogActions>
                    {request.status === 'Pending' && (
                        <Button
                            color="primary"
                            onClick={() => handleStatusChange(request.id, 'In Progress')}
                        >
                            Start Repacking
                        </Button>
                    )}
                    {request.status === 'In Progress' && (
                        <Button
                            color="success"
                            onClick={() => handleStatusChange(request.id, 'Completed')}
                        >
                            Mark as Completed
                        </Button>
                    )}
                    <Button onClick={onClose}>Close</Button>
                </DialogActions> */}
            </Dialog>
        );
    };



    return (
        <Container maxWidth="xl" sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4">Cargo Repacking Requests</Typography>
                <Button
                    variant="contained"
                    onClick={() => {
                        setEditingId(null);
                        setOpenDialog(true);
                    }}
                    startIcon={<InventoryIcon />}
                >
                    New Repacking Request
                </Button>
            </Box>

            {renderMetrics()}

            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={12}>
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
                </Grid>
            </Paper>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Request ID</TableCell>
                            <TableCell>Cargo Number</TableCell>
                            <TableCell>Cargo Type</TableCell>
                            <TableCell>Repackaging Requirements</TableCell>
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
                                    No repacking requests found
                                </TableCell>
                            </TableRow>
                        ) : (
                            requests.map((request) => (
                                <TableRow key={request.id}>
                                    <TableCell>{request.id.slice(0, 8)}</TableCell>
                                    <TableCell>{request.cargoDetails.cargoNumber}</TableCell>
                                    <TableCell>{request.cargoDetails.cargoType}</TableCell>
                                    <TableCell>
                                        {request.repackingDetails.requirements.map((type) => (
                                            <Chip
                                                key={type}
                                                label={type}
                                                size="small"
                                                sx={{ mr: 0.5, mb: 0.5 }}
                                            />
                                        ))}
                                    </TableCell>
                                    <TableCell>
                                        {format(request.createdAt, 'dd/MM/yyyy HH:mm')}
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
                                        )}
                                        {request.status === 'Completed' && (
                                            <Tooltip title="Download Report">
                                                <IconButton size="small">
                                                    <Download />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        {request.status === 'Pending' && (
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => setDeleteConfirmation(request.id)}
                                                >
                                                    <Delete />
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

            <CargoRepackingRequest
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
                }}
            />

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
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <Dialog
                open={Boolean(deleteConfirmation)}
                onClose={() => setDeleteConfirmation(null)}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this cargo repacking request?
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

        </Container>
    );
};

export default CargoRepacking;