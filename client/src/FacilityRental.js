import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    CardMedia,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Box,
    Stepper,
    Step,
    StepLabel,
    Chip,
    IconButton,
    Alert,
    TableContainer,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Divider,
    CircularProgress,
    Tooltip,
    Snackbar
} from '@mui/material';
import {
    CalendarMonth,
    LocationOn,
    Description,
    AttachMoney,
    Cancel,
    Edit,
    Delete,
    Visibility,
    Close,
    ArrowForward,
    ArrowBack
} from '@mui/icons-material';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { useAuth } from './AuthContext';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const steps = ['Select Facility', 'Rental Details', 'Review & Submit'];

const rentalTypes = [
    { id: 'office', name: 'Office Space', pricePerHour: 50 },
    { id: 'warehouse', name: 'Warehouse', pricePerHour: 100 },
    { id: 'storage', name: 'Storage Area', pricePerHour: 75 },
    { id: 'conference', name: 'Conference Room', pricePerHour: 40 }
];

const FacilityRental = () => {
    const { user } = useAuth();
    const [activeStep, setActiveStep] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [rentalRequests, setRentalRequests] = useState([]);
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        facilityType: '',
        startDate: null,
        endDate: null,
        purpose: '',
        numberOfPeople: '',
        additionalNotes: ''
    });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    useEffect(() => {
        fetchRentalRequests();
    }, [user]);

    const fetchRentalRequests = async () => {
        try {
            setLoading(true);
            const q = query(
                collection(db, 'rental_requests'),
                where('userId', '==', user.email)
            );
            const querySnapshot = await getDocs(q);
            const requests = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRentalRequests(requests);
        } catch (err) {
            console.error('Error fetching rental requests:', err);
            setError('Failed to load rental requests');
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        setActiveStep((prevStep) => prevStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    const handleFacilitySelect = (facility) => {
        setSelectedFacility(facility);
        setFormData(prev => ({ ...prev, facilityType: facility.id }));
        handleNext();
    };

    const calculateTotalPrice = () => {
        if (!formData.startDate || !formData.endDate) return 0;
        const hours = Math.ceil((formData.endDate - formData.startDate) / (1000 * 60 * 60));
        const facility = rentalTypes.find(f => f.id === formData.facilityType);
        return hours * facility.pricePerHour;
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const rentalData = {
                ...formData,
                userId: user.email,
                userName: user.firstName,
                company: user.company,
                status: 'Pending',
                totalPrice: calculateTotalPrice(),
                createdAt: serverTimestamp(),
                startDate: formData.startDate.toISOString(),
                endDate: formData.endDate.toISOString()
            };

            await addDoc(collection(db, 'rental_requests'), rentalData);
            setSnackbar({
                open: true,
                message: 'Rental request submitted successfully!',
                severity: 'success'
            });
            handleCloseDialog();
            fetchRentalRequests();
        } catch (err) {
            console.error('Error submitting rental request:', err);
            setSnackbar({
                open: true,
                message: 'Failed to submit rental request',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (requestId) => {
        try {
            setLoading(true);
            const requestRef = doc(db, 'rental_requests', requestId);
            await updateDoc(requestRef, {
                status: 'Cancelled',
                updatedAt: serverTimestamp()
            });
            setSnackbar({
                open: true,
                message: 'Rental request cancelled successfully',
                severity: 'success'
            });
            fetchRentalRequests();
        } catch (err) {
            console.error('Error cancelling rental request:', err);
            setSnackbar({
                open: true,
                message: 'Failed to cancel rental request',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (requestId) => {
        try {
            setLoading(true);
            await deleteDoc(doc(db, 'rental_requests', requestId));
            setSnackbar({
                open: true,
                message: 'Rental request deleted successfully',
                severity: 'success'
            });
            fetchRentalRequests();
        } catch (err) {
            console.error('Error deleting rental request:', err);
            setSnackbar({
                open: true,
                message: 'Failed to delete rental request',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setActiveStep(0);
        setSelectedFacility(null);
        setFormData({
            facilityType: '',
            startDate: null,
            endDate: null,
            purpose: '',
            numberOfPeople: '',
            additionalNotes: ''
        });
    };

    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Grid container spacing={3}>
                        {rentalTypes.map((facility) => (
                            <Grid item xs={12} sm={6} md={4} key={facility.id}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s',
                                        '&:hover': {
                                            transform: 'scale(1.02)'
                                        }
                                    }}
                                    onClick={() => handleFacilitySelect(facility)}
                                >
                                    <CardMedia
                                        component="img"
                                        height="180"
                                        image={`/api/placeholder/400/320`}
                                        alt={facility.name}
                                    />
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            {facility.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            ${facility.pricePerHour}/hour
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                );

            case 1:
                return (
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <DateTimePicker
                                    label="Start Date & Time"
                                    value={formData.startDate}
                                    onChange={(newValue) => setFormData(prev => ({
                                        ...prev,
                                        startDate: newValue
                                    }))}
                                    slotProps={{ textField: { fullWidth: true } }}
                                    minDate={new Date()}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <DateTimePicker
                                    label="End Date & Time"
                                    value={formData.endDate}
                                    onChange={(newValue) => setFormData(prev => ({
                                        ...prev,
                                        endDate: newValue
                                    }))}
                                    slotProps={{ textField: { fullWidth: true } }}
                                    minDate={formData.startDate || new Date()}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Purpose of Rental"
                                    value={formData.purpose}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        purpose: e.target.value
                                    }))}
                                    fullWidth
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Number of People"
                                    type="number"
                                    value={formData.numberOfPeople}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        numberOfPeople: e.target.value
                                    }))}
                                    fullWidth
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Additional Notes"
                                    value={formData.additionalNotes}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        additionalNotes: e.target.value
                                    }))}
                                    multiline
                                    rows={4}
                                    fullWidth
                                />
                            </Grid>
                        </Grid>
                    </LocalizationProvider>
                );

            case 2:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>Review Your Rental Request</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="subtitle1">Selected Facility</Typography>
                                    <Typography variant="body1" color="primary">
                                        {rentalTypes.find(f => f.id === formData.facilityType)?.name}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="subtitle1">Start Time</Typography>
                                    <Typography variant="body1">
                                        {formData.startDate?.toLocaleString()}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="subtitle1">End Time</Typography>
                                    <Typography variant="body1">
                                        {formData.endDate?.toLocaleString()}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="subtitle1">Total Price</Typography>
                                    <Typography variant="h5" color="primary">
                                        ${calculateTotalPrice()}
                                    </Typography>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>
                );

            default:
                return 'Unknown step';
        }
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'approved':
                return 'success';
            case 'pending':
                return 'warning';
            case 'rejected':
                return 'error';
            case 'cancelled':
                return 'default';
            default:
                return 'default';
        }
    };

    if (loading && !openDialog) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h4">Facility & Space Rental</Typography>
                    <Button
                        variant="contained"
                        onClick={() => setOpenDialog(true)}
                        startIcon={<CalendarMonth />}
                    >
                        New Rental Request
                    </Button>
                </Box>

                <Typography variant="h6" gutterBottom>Your Rental Requests</Typography>
                <TableContainer component={Paper} variant="outlined">
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Facility Type</TableCell>
                                <TableCell>Start Date</TableCell>
                                <TableCell>End Date</TableCell>
                                <TableCell>Total Price</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rentalRequests.map((request) => (
                                <TableRow key={request.id}>
                                    <TableCell>
                                        {rentalTypes.find(f => f.id === request.facilityType)?.name}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(request.startDate).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(request.endDate).toLocaleString()}
                                    </TableCell>
                                    <TableCell>${request.totalPrice}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={request.status}
                                            color={getStatusColor(request.status)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                            <Tooltip title="View Details">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => {
                                                        setSelectedFacility(request);
                                                        setFormData(request);
                                                        setActiveStep(2);
                                                        setOpenDialog(true);
                                                    }}
                                                >
                                                    <Visibility />
                                                </IconButton>
                                            </Tooltip>
                                            {request.status === 'Pending' && (
                                                <>
                                                    <Tooltip title="Cancel Request">
                                                        <IconButton
                                                            size="small"
                                                            color="warning"
                                                            onClick={() => handleCancel(request.id)}
                                                        >
                                                            <Cancel />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete Request">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleDelete(request.id)}
                                                        >
                                                            <Delete />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {rentalRequests.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        <Typography color="textSecondary" py={3}>
                                            No rental requests found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* New Rental Request Dialog */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">
                            {activeStep === 2 && selectedFacility ? 
                                'Rental Request Details' : 
                                'New Rental Request'
                            }
                        </Typography>
                        <IconButton
                            onClick={handleCloseDialog}
                            size="small"
                            aria-label="close"
                        >
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                            {steps.map((label) => (
                                <Step key={label}>
                                    <StepLabel>{label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                        
                        {getStepContent(activeStep)}
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={handleCloseDialog}>
                        Cancel
                    </Button>
                    <Box sx={{ flex: '1 1 auto' }} />
                    {activeStep > 0 && !selectedFacility && (
                        <Button
                            onClick={handleBack}
                            startIcon={<ArrowBack />}
                        >
                            Back
                        </Button>
                    )}
                    {activeStep === steps.length - 1 ? (
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={loading || !formData.startDate || !formData.endDate || !formData.purpose}
                        >
                            {loading ? (
                                <CircularProgress size={24} />
                            ) : (
                                'Submit Request'
                            )}
                        </Button>
                    ) : (
                        !selectedFacility && (
                            <Button
                                variant="contained"
                                onClick={handleNext}
                                endIcon={<ArrowForward />}
                                disabled={
                                    (activeStep === 0 && !formData.facilityType) ||
                                    (activeStep === 1 && (!formData.startDate || !formData.endDate || !formData.purpose))
                                }
                            >
                                Next
                            </Button>
                        )
                    )}
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default FacilityRental;