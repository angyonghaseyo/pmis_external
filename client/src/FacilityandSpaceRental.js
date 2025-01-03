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
    Snackbar,
    Stack,
    Tooltip
} from '@mui/material';
import {
    Warehouse,
    Cancel,
    Visibility,
    Close,
    ArrowForward,
    ArrowBack,
    Event,
    AccessTime
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { isBefore, isAfter, format } from 'date-fns';
import { useAuth } from "./AuthContext";
import { 
    getWarehouses, 
    getFacilityRentals, 
    createFacilityRental, 
    updateFacilityRental,
    deleteFacilityRental,
    getWarehouseById 
} from './services/api';

// Steps for the rental process
const steps = ['Select Warehouse', 'Specify Booking Hours', 'Review & Submit'];

// Utility function to check for booking conflicts
const checkBookingConflict = (bookedPeriods, newStart, newEnd) => {
    if (!bookedPeriods || !newStart || !newEnd) return false;

    const requestStart = new Date(newStart).getTime();
    const requestEnd = new Date(newEnd).getTime();

    // Check for invalid time range
    if (requestEnd <= requestStart) {
        return true;
    }

    return bookedPeriods.some(period => {
        if (period.status !== 'Approved') return false;
        const periodStart = new Date(period.start).getTime();
        const periodEnd = new Date(period.end).getTime();

        return (
            (requestStart >= periodStart && requestStart < periodEnd) ||
            (requestEnd > periodStart && requestEnd <= periodEnd) ||
            (requestStart <= periodStart && requestEnd >= periodEnd)
        );
    });
};

const FacilityandSpaceRental = () => {
    // State management
    const { user } = useAuth();
    const [activeStep, setActiveStep] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [facilities, setFacilities] = useState([]);
    const [formData, setFormData] = useState({
        company: user?.company,
        facilityId: '',
        startTime: null,
        endTime: null,
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
    // Effects
    useEffect(() => {
        fetchFacilities();
        fetchRentalRequests();
    }, []);

    useEffect(() => {
        if (formData.startTime && formData.endTime && selectedFacility) {
            const hasConflict = checkBookingConflict(
                selectedFacility.bookedPeriods || [],
                formData.startTime,
                formData.endTime
            );
            setBookingConflict(hasConflict);
        }
    }, [formData.startTime, formData.endTime, selectedFacility]);

    // Fetch functions
    const fetchFacilities = async () => {
        try {
            setLoading(true);
            const response = await getWarehouses();
            setFacilities(response);
        } catch (error) {
            console.error('Error fetching facilities:', error);
            showSnackbar('Error fetching facilities', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchRentalRequests = async () => {
        try {
            const requests = await getFacilityRentals();
            setRentalRequests(requests.filter(request => request.company === user.company));
        } catch (error) {
            console.error('Error fetching rental requests:', error);
            showSnackbar('Error fetching rental requests', 'error');
        }
    };

    // Handler functions
    const handleViewDetails = async (request) => {
        try {
            setLoading(true);
            const facilityData = await getWarehouseById(request.facilityId);
            
            if (facilityData) {
                setSelectedFacility(facilityData);
            }
            
            setSelectedRequest(request);
            setViewMode(true);
            setFormData({
                facilityId: request.facilityId,
                startTime: new Date(request.startTime),
                endTime: new Date(request.endTime),
                purpose: request.purpose,
                specialRequirements: request.specialRequirements || ''
            });
            setOpenDialog(true);
        } catch (error) {
            console.error('Error loading request details:', error);
            showSnackbar('Error loading request details', 'error');
        } finally {
            setLoading(false);
        }
    };

    const calculateTotalPrice = () => {
        if (!selectedFacility || !formData.startTime || !formData.endTime) return 0;
        
        const start = new Date(formData.startTime).getTime();
        const end = new Date(formData.endTime).getTime();
        
        // Calculate hours, rounding up to nearest hour
        const hours = Math.ceil((end - start) / (1000 * 60 * 60));
        
        // Convert daily rate to hourly
        const hourlyRate = selectedFacility.pricePerDay / 24;
        
        return hours * hourlyRate;
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

    const validateBookingForm = () => {
        if (!formData.startTime || !formData.endTime) {
            showSnackbar('Please select both start and end times', 'error');
            return false;
        }

        const start = new Date(formData.startTime);
        const end = new Date(formData.endTime);
        const now = new Date();

        if (isBefore(start, now)) {
            showSnackbar('Cannot book time slots in the past', 'error');
            return false;
        }

        if (!isAfter(end, start)) {
            showSnackbar('End time must be after start time', 'error');
            return false;
        }

        const hours = Math.ceil((end - start) / (1000 * 60 * 60));
        if (hours < 1) {
            showSnackbar('Minimum booking duration is 1 hour', 'error');
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateBookingForm()) return;

        try {
            setLoading(true);
            if (bookingConflict) {
                showSnackbar('Selected time slot is not available', 'error');
                return;
            }

            const rentalData = {
                company: user.company,
                facilityId: selectedFacility.id,
                facilityName: selectedFacility.name,
                warehouseId: selectedFacility.warehouseId,
                startTime: formData.startTime.toISOString(),
                endTime: formData.endTime.toISOString(),
                purpose: formData.purpose,
                specialRequirements: formData.specialRequirements,
                totalPrice: calculateTotalPrice(),
                status: 'Pending',
                squareFootage: selectedFacility.squareFootage,
                createdAt: new Date().toISOString()
            };

            await createFacilityRental(rentalData);
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

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedFacility(null);
        setActiveStep(0);
        setFormData({
            facilityId: '',
            startTime: null,
            endTime: null,
            purpose: '',
            specialRequirements: ''
        });
        setViewMode(false);
        setBookingConflict(false);
        setSelectedRequest(null);
    };

    const handleCancelRequest = async (requestId) => {
        try {
            setLoading(true);
            await deleteFacilityRental(requestId);
            showSnackbar('Request cancelled successfully', 'success');
            await fetchRentalRequests();
        } catch (error) {
            console.error('Error cancelling request:', error);
            showSnackbar('Error cancelling request', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getApprovedBookingsDisplay = (facility) => {
        if (!facility.bookedPeriods || facility.bookedPeriods.length === 0) {
            return 'No current bookings';
        }

        return facility.bookedPeriods
            .filter(period => period.status === 'Approved')
            .map((period, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                    <Typography variant="body2">
                        {format(new Date(period.start), 'MMM dd, yyyy HH:mm')} - 
                        {format(new Date(period.end), 'HH:mm')}
                    </Typography>
                </Box>
            ));
    };
    // Step content rendering
    const getStepContent = (step) => {
        if (viewMode) {
            return (
                <Box>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Warehouse Details
                                </Typography>
                                <Typography variant="h6" color="primary">
                                    {selectedRequest?.facilityName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Square Footage: {selectedRequest?.squareFootage} sq ft
                                </Typography>
                            </Paper>
                        </Grid>

                        <Grid item xs={12}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Booking Details
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="body2">
                                            <Event sx={{ mr: 1, verticalAlign: 'middle' }} />
                                            Start: {new Date(selectedRequest?.startTime).toLocaleString()}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="body2">
                                            <Event sx={{ mr: 1, verticalAlign: 'middle' }} />
                                            End: {new Date(selectedRequest?.endTime).toLocaleString()}
                                        </Typography>
                                    </Grid>
                                </Grid>
                                <Box sx={{ mt: 2 }}>
                                    <Chip 
                                        label={selectedRequest?.status}
                                        color={
                                            selectedRequest?.status === 'Approved' ? 'success' :
                                            selectedRequest?.status === 'Rejected' ? 'error' : 'warning'
                                        }
                                    />
                                </Box>
                                {selectedRequest?.status === 'Rejected' && selectedRequest?.rejectionReason && (
                                    <Alert severity="error" sx={{ mt: 2 }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Rejection Reason:
                                        </Typography>
                                        <Typography variant="body2">
                                            {selectedRequest.rejectionReason}
                                        </Typography>
                                    </Alert>
                                )}
                            </Paper>
                        </Grid>

                        <Grid item xs={12}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Purpose & Requirements
                                </Typography>
                                <Typography variant="body2" paragraph>
                                    <strong>Purpose:</strong><br />
                                    {selectedRequest?.purpose}
                                </Typography>
                                {selectedRequest?.specialRequirements && (
                                    <Typography variant="body2">
                                        <strong>Special Requirements:</strong><br />
                                        {selectedRequest?.specialRequirements}
                                    </Typography>
                                )}
                            </Paper>
                        </Grid>

                        <Grid item xs={12}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Pricing
                                </Typography>
                                <Typography variant="h4" color="primary">
                                    ${selectedRequest?.totalPrice.toFixed(2)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Created: {new Date(selectedRequest?.createdAt).toLocaleString()}
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            );
        }

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
                                        }}}
                                        onClick={() => handleFacilitySelect(facility)}
                                    >
                                    <CardContent>
                                        <Stack spacing={2}>
                                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                                <Warehouse sx={{ fontSize: 40 }} />
                                            </Box>
                                            <Typography variant="h6">
                                                {facility.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Warehouse - {facility.squareFootage} sq ft
                                            </Typography>
                                            <Typography variant="h6" color="primary">
                                                ${(facility.pricePerDay / 24).toFixed(2)}/hour
                                            </Typography>
                                            {facility.features && (
                                                <Typography variant="body2" color="text.secondary">
                                                    Features: {facility.features}
                                                </Typography>
                                            )}
                                            <Divider />
                                            <Box>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    Current Bookings:
                                                </Typography>
                                                {getApprovedBookingsDisplay(facility)}
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                );
            case 1:
                return (
                    <Box>
                        <Alert
                            severity={bookingConflict ? 'error' : 'info'}
                            sx={{ mb: 3 }}
                        >
                            {bookingConflict
                                ? 'Selected time slot conflicts with existing bookings'
                                : 'Please select your desired booking hours'}
                        </Alert>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    <DateTimePicker
                                        label="Start Time"
                                        value={formData.startTime}
                                        onChange={(date) => setFormData(prev => ({
                                            ...prev,
                                            startTime: date
                                        }))}
                                        renderInput={(params) => <TextField {...params} fullWidth />}
                                        minDate={new Date()}
                                        minutesStep={60}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    <DateTimePicker
                                        label="End Time"
                                        value={formData.endTime}
                                        onChange={(date) => setFormData(prev => ({
                                            ...prev,
                                            endTime: date
                                        }))}
                                        renderInput={(params) => <TextField {...params} fullWidth />}
                                        minDate={formData.startTime || new Date()}
                                        minutesStep={60}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Purpose of Rental"
                                    value={formData.purpose}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        purpose: e.target.value
                                    }))}
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
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        specialRequirements: e.target.value
                                    }))}
                                    multiline
                                    rows={3}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                );

            case 2:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Review Booking Details
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Selected Warehouse
                                    </Typography>
                                    <Typography variant="body1" color="primary">
                                        {selectedFacility?.name} - {selectedFacility?.squareFootage} sq ft
                                    </Typography>
                                    {selectedFacility?.features && (
                                        <Typography variant="body2" color="text.secondary">
                                            Features: {selectedFacility.features}
                                        </Typography>
                                    )}
                                </Paper>
                            </Grid>

                            <Grid item xs={12}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Booking Period
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                        <AccessTime color="primary" />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Start: {formData.startTime?.toLocaleString()}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                End: {formData.endTime?.toLocaleString()}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Duration: {Math.ceil(
                                                    (new Date(formData.endTime) - new Date(formData.startTime)) / 
                                                    (1000 * 60 * 60)
                                                )} hours
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Paper>
                            </Grid>

                            <Grid item xs={12}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Total Price
                                    </Typography>
                                    <Typography variant="h4" color="primary">
                                        ${calculateTotalPrice().toFixed(2)}
                                    </Typography>
                                </Paper>
                            </Grid>

                            <Grid item xs={12}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Purpose & Requirements
                                    </Typography>
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
                    <Typography variant="h4">Warehouse Rental</Typography>
                    <Button
                        variant="contained"
                        onClick={() => setOpenDialog(true)}
                        startIcon={<Warehouse />}
                    >
                        Rent Warehouse
                    </Button>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Warehouse</TableCell>
                                <TableCell>Booking Period</TableCell>
                                <TableCell>Duration</TableCell>
                                <TableCell>Total Price</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : rentalRequests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        <Typography>No rental requests found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rentalRequests.map((request) => (
                                    <TableRow key={request.id}>
                                        <TableCell>{request.facilityName}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {new Date(request.startTime).toLocaleString()}
                                            </Typography>
                                            <Typography variant="body2">
                                                {new Date(request.endTime).toLocaleString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {Math.ceil(
                                                (new Date(request.endTime) - new Date(request.startTime)) / 
                                                (1000 * 60 * 60)
                                            )} hours
                                        </TableCell>
                                        <TableCell>${request.totalPrice.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Tooltip 
                                                title={
                                                    request.status === 'Rejected' && request.rejectionReason 
                                                        ? request.rejectionReason 
                                                        : ''
                                                }
                                                arrow
                                            >
                                                <Chip
                                                    label={request.status}
                                                    color={
                                                        request.status === 'Approved' ? 'success' :
                                                        request.status === 'Rejected' ? 'error' : 'warning'
                                                    }
                                                    size="small"
                                                />
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => handleViewDetails(request)}
                                            >
                                                <Visibility />
                                            </IconButton>
                                            {request.status === 'Pending' && (
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleCancelRequest(request.id)}
                                                >
                                                    <Cancel />
                                                </IconButton>
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
                            {viewMode ? 'Rental Request Details' : 'New Warehouse Rental'}
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
                            <Button
                                onClick={handleBack}
                                disabled={activeStep === 0}
                                startIcon={<ArrowBack />}
                            >
                                Back
                            </Button>
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

export default FacilityandSpaceRental;