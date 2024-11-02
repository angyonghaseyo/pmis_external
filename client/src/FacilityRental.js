import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
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
    Warehouse,
    Cancel,
    Visibility,
    Close,
    ArrowForward,
    ArrowBack,
    Event
} from '@mui/icons-material';
import { collection, addDoc, getDocs, doc, getDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const steps = ['Select Facility', 'Specify Booking Period', 'Review & Submit'];

const FacilityRental = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [facilities, setFacilities] = useState([]);
    const [formData, setFormData] = useState({
        facilityId: '',
        bookedPeriodStart: null,
        bookedPeriodEnd: null,
        purpose: '',
        specialRequirements: ''
    });
    const [rentalRequests, setRentalRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info'
    });
    const [viewMode, setViewMode] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [bookingConflict, setBookingConflict] = useState(false);

    useEffect(() => {
        fetchFacilities();
        fetchRentalRequests();
    }, []);

    const fetchFacilities = async () => {
        try {
            setLoading(true);
            const querySnapshot = await getDocs(collection(db, 'facilities'));
            const facilitiesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                bookedPeriods: doc.data().bookedPeriods || []
            }));
            setFacilities(facilitiesData);
        } catch (error) {
            console.error('Error fetching facilities:', error);
            showSnackbar('Error fetching facilities', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchRentalRequests = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'facility_rentals'));
            const requests = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                bookedPeriodStart: doc.data().bookedPeriodStart,
                bookedPeriodEnd: doc.data().bookedPeriodEnd
            }));
            setRentalRequests(requests);
        } catch (error) {
            console.error('Error fetching rental requests:', error);
            showSnackbar('Error fetching rental requests', 'error');
        }
    };

    const checkBookingConflict = (facility, start, end) => {
        if (!facility || !start || !end) return false;

        return facility.bookedPeriods.some(period => {
            const periodStart = new Date(period.start);
            const periodEnd = new Date(period.end);
            const newStart = new Date(start);
            const newEnd = new Date(end);

            return (
                (newStart >= periodStart && newStart <= periodEnd) ||
                (newEnd >= periodStart && newEnd <= periodEnd) ||
                (newStart <= periodStart && newEnd >= periodEnd)
            );
        });
    };

    const handleDateChange = (field, value) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };

            if (selectedFacility && newData.bookedPeriodStart && newData.bookedPeriodEnd) {
                const hasConflict = checkBookingConflict(
                    selectedFacility,
                    newData.bookedPeriodStart,
                    newData.bookedPeriodEnd
                );
                setBookingConflict(hasConflict);
            }

            return newData;
        });
    };

    const calculateTotalPrice = () => {
        if (!selectedFacility || !formData.bookedPeriodStart || !formData.bookedPeriodEnd) return 0;
        const days = Math.ceil(
            (new Date(formData.bookedPeriodEnd) - new Date(formData.bookedPeriodStart)) / 
            (1000 * 60 * 60 * 24)
        );
        return days * selectedFacility.pricePerDay;
    };

    const handleNext = () => {
        if (activeStep === steps.length - 1) {
            handleSubmit();
        } else {
            setActiveStep(prevStep => prevStep + 1);
        }
    };

    const handleBack = () => {
        setActiveStep(prevStep => prevStep - 1);
    };

    const handleFacilitySelect = (facility) => {
        setSelectedFacility(facility);
        setFormData(prev => ({ ...prev, facilityId: facility.id }));
        handleNext();
    };

    const showSnackbar = (message, severity = 'info') => {
        setSnackbar({
            open: true,
            message,
            severity
        });
    };

    const handleViewDetails = (request) => {
        const facility = facilities.find(f => f.id === request.facilityId);
        setSelectedFacility(facility);
        setFormData({
            ...request,
            bookedPeriodStart: new Date(request.bookedPeriodStart),
            bookedPeriodEnd: new Date(request.bookedPeriodEnd)
        });
        setSelectedRequest(request);
        setViewMode(true);
        setOpenDialog(true);
        setActiveStep(2);
    };

    const handleSubmit = async () => {
        try {
            if (bookingConflict) {
                showSnackbar('Selected period conflicts with existing bookings', 'error');
                return;
            }

            setLoading(true);
            const rentalData = {
                ...formData,
                facilityName: selectedFacility.name,
                facilityType: selectedFacility.type,
                status: 'Pending',
                totalPrice: calculateTotalPrice(),
                squareFootage: selectedFacility.squareFootage,
                createdAt: serverTimestamp(),
                bookedPeriodStart: formData.bookedPeriodStart.toISOString(),
                bookedPeriodEnd: formData.bookedPeriodEnd.toISOString()
            };

            await addDoc(collection(db, 'facility_rentals'), rentalData);
            showSnackbar('Rental request submitted successfully', 'success');
            handleCloseDialog();
            await fetchRentalRequests();
        } catch (error) {
            console.error('Error submitting rental request:', error);
            showSnackbar('Error submitting rental request', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelRequest = async (request) => {
        try {
            setLoading(true);
            await deleteDoc(doc(db, 'facility_rentals', request.id));
            showSnackbar('Request cancelled successfully', 'success');
            await fetchRentalRequests();
        } catch (error) {
            console.error('Error cancelling request:', error);
            showSnackbar('Error cancelling request', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedFacility(null);
        setActiveStep(0);
        setFormData({
            facilityId: '',
            bookedPeriodStart: null,
            bookedPeriodEnd: null,
            purpose: '',
            specialRequirements: ''
        });
        setViewMode(false);
        setSelectedRequest(null);
        setBookingConflict(false);
    };

    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Grid container spacing={3}>
                        {facilities.map((facility) => (
                            <Grid item xs={12} md={4} key={facility.id}>
                                <Card 
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            transform: 'scale(1.02)',
                                            transition: 'transform 0.2s ease-in-out'
                                        }
                                    }}
                                    onClick={() => handleFacilitySelect(facility)}
                                >
                                    <CardContent>
                                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                                            <Warehouse sx={{ fontSize: 40 }} />
                                        </Box>
                                        <Typography variant="h6" gutterBottom>
                                            {facility.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" paragraph>
                                            {facility.type} - {facility.squareFootage} sq ft
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" paragraph>
                                            Location: {facility.location}
                                        </Typography>
                                        <Typography variant="h6" color="primary">
                                            ${facility.pricePerDay}/day
                                        </Typography>
                                        {facility.features && (
                                            <Typography variant="body2" color="text.secondary">
                                                Features: {facility.features}
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                );

            case 1:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Alert severity={bookingConflict ? 'error' : 'info'}>
                                {bookingConflict 
                                    ? 'Selected period conflicts with existing bookings'
                                    : 'Please select your desired booking period'}
                            </Alert>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DateTimePicker
                                    label="Booking Start"
                                    value={formData.bookedPeriodStart}
                                    onChange={(date) => handleDateChange('bookedPeriodStart', date)}
                                    renderInput={(params) => <TextField {...params} fullWidth />}
                                    minDate={new Date()}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DateTimePicker
                                    label="Booking End"
                                    value={formData.bookedPeriodEnd}
                                    onChange={(date) => handleDateChange('bookedPeriodEnd', date)}
                                    renderInput={(params) => <TextField {...params} fullWidth />}
                                    minDate={formData.bookedPeriodStart || new Date()}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Purpose of Rental"
                                value={formData.purpose}
                                onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                                multiline
                                rows={3}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Special Requirements"
                                value={formData.specialRequirements}
                                onChange={(e) => setFormData(prev => ({ ...prev, specialRequirements: e.target.value }))}
                                multiline
                                rows={3}
                            />
                        </Grid>
                    </Grid>
                );

            case 2:
                return (
                    <Box>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="subtitle1" gutterBottom>Selected Facility</Typography>
                                    <Typography variant="body1" color="primary">
                                        {selectedFacility?.name} - {selectedFacility?.squareFootage} sq ft
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Type: {selectedFacility?.type}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Location: {selectedFacility?.location}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="subtitle1" gutterBottom>Booking Period</Typography>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                        <Event color="primary" />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Start: {formData.bookedPeriodStart?.toLocaleString()}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                End: {formData.bookedPeriodEnd?.toLocaleString()}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Paper>
                            </Grid>
                            <Grid item xs={12}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="subtitle1" gutterBottom>Total Price</Typography>
                                    <Typography variant="h4" color="primary">
                                        ${calculateTotalPrice().toLocaleString()}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Based on ${selectedFacility?.pricePerDay} per day
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12}>
                                <Paper sx={{ p: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>Purpose & Requirements</Typography>
                                    <Typography variant="body2" paragraph>
                                        <strong>Purpose:</strong> {formData.purpose}
                                    </Typography>
                                    {formData.specialRequirements && (
                                        <Typography variant="body2">
                                            <strong>Special Requirements:</strong> {formData.specialRequirements}
                                        </Typography>
                                    )}
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>
                );
            default:
                return 'Unknown step';
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h4">Facility Rental</Typography>
                    <Button
                        variant="contained"
                        onClick={() => setOpenDialog(true)}
                        startIcon={<Warehouse />}
                    >
                        Rent Facility
                    </Button>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Facility Name</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Square Footage</TableCell>
                                <TableCell>Booking Period</TableCell>
                                <TableCell>Total Price</TableCell>
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
                            ) : rentalRequests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <Typography>No rental requests found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rentalRequests.map((request) => (
                                    <TableRow key={request.id}>
                                        <TableCell>{request.facilityName}</TableCell>
                                        <TableCell>{request.facilityType}</TableCell>
                                        <TableCell>{request.squareFootage}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {new Date(request.bookedPeriodStart).toLocaleDateString()} -
                                            </Typography>
                                            <Typography variant="body2">
                                                {new Date(request.bookedPeriodEnd).toLocaleDateString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>${request.totalPrice?.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={request.status}
                                                color={request.status === 'Approved' ? 'success' :
                                                      request.status === 'Rejected' ? 'error' : 'warning'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title="View Details">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleViewDetails(request)}
                                                >
                                                    <Visibility />
                                                </IconButton>
                                            </Tooltip>
                                            {request.status === 'Pending' && (
                                                <Tooltip title="Cancel Request">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleCancelRequest(request)}
                                                    >
                                                        <Cancel />
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
            </Paper>

            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">
                            {viewMode ? 'Rental Request Details' : 'New Facility Rental'}
                        </Typography>
                        <IconButton
                            onClick={handleCloseDialog}
                            size="small"
                        >
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent>
                    {!viewMode && (
                        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                            {steps.map((label) => (
                                <Step key={label}>
                                    <StepLabel>{label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                    )}
                    {getStepContent(activeStep)}
                </DialogContent>

                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={handleCloseDialog}>
                        {viewMode ? 'Close' : 'Cancel'}
                    </Button>
                    {!viewMode && (
                        <>
                            <Box sx={{ flex: '1 1 auto' }} />
                            {activeStep > 0 && (
                                <Button
                                    onClick={handleBack}
                                    startIcon={<ArrowBack />}
                                >
                                    Back
                                </Button>
                            )}
                            <Button
                                variant="contained"
                                onClick={handleNext}
                                endIcon={activeStep === steps.length - 1 ? undefined : <ArrowForward />}
                                disabled={loading || (activeStep === 1 && bookingConflict)}
                            >
                                {loading ? (
                                    <CircularProgress size={24} />
                                ) : activeStep === steps.length - 1 ? (
                                    'Submit Request'
                                ) : (
                                    'Next'
                                )}
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>

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