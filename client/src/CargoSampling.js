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
    DialogContent,
    DialogTitle,
    DialogActions,
} from '@mui/material';
import { Edit, Delete, Visibility, Search, Download } from '@mui/icons-material';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import CargoSamplingRequest from './CargoSamplingRequest';
import { format } from 'date-fns';


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

    const fetchRequests = async () => {
        try {
            setLoading(true);
            let q = query(collection(db, 'samplingRequests'), orderBy('createdAt', 'desc'));

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
                        request.cargoDetails.containerNumber.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
                        request.cargoDetails.cargoType.toLowerCase().includes(filters.searchQuery.toLowerCase())
                    );
                }
                return true;
            });

            setRequests(filteredData);
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

    const handleStatusChange = async (requestId, newStatus) => {
        try {
            await updateDoc(doc(db, 'samplingRequests', requestId), {
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
            await deleteDoc(doc(db, 'samplingRequests', requestId));
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
                >
                    New Sampling Request
                </Button>
            </Box>

            {renderMetrics()}

            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
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
                    <Grid item xs={12} sm={4}>
                        <TextField
                            select
                            fullWidth
                            label="Status"
                            size="small"
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        >
                            <MenuItem value="all">All Status</MenuItem>
                            <MenuItem value="Pending">Pending</MenuItem>
                            <MenuItem value="In Progress">In Progress</MenuItem>
                            <MenuItem value="Completed">Completed</MenuItem>
                            <MenuItem value="Rejected">Rejected</MenuItem>
                        </TextField>
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
                                            <IconButton size="small" onClick={() => { }}>
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
                    variant="filled"
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
                        Are you sure you want to delete this cargo storage request?
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

        </Container>
    );
};

export default CargoSampling;