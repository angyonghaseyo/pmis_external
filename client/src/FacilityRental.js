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
    Snackbar,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {
    Warehouse,
    Cancel,
    Visibility,
    Close,
    ArrowForward,
    ArrowBack
} from '@mui/icons-material';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const steps = ['Select Facility', 'Specify Requirements', 'Review & Submit'];

const FacilityRental = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [facilities, setFacilities] = useState([]);
    const [formData, setFormData] = useState({
        facilityId: '',
        startDate: null,
        endDate: null,
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
                ...doc.data()
            })).filter(facility => facility.status === 'Available');
            setFacilities(facilitiesData);
        } catch (error) {
            console.error('Error fetching facilities:', error);
            setSnackbar({
                open: true,
                message: 'Error fetching facilities',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchRentalRequests = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'facility_rentals'));
            const requests = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRentalRequests(requests);
        } catch (error) {
            console.error('Error fetching rental requests:', error);
            setSnackbar({
                open: true,
                message: 'Error fetching rental requests',
                severity: 'error'
            });
        }
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

    const calculateTotalPrice = () => {
        if (!selectedFacility || !formData.startDate || !formData.endDate) return 0;
        const days = Math.ceil((formData.endDate - formData.startDate) / (1000 * 60 * 60 * 24));
        return days * selectedFacility.pricePerDay;
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const rentalData = {
                ...formData,
                facilityName: selectedFacility.name,
                facilityType: selectedFacility.type,
                status: 'Pending',
                totalPrice: calculateTotalPrice(),
                squareFootage: selectedFacility.squareFootage,
                createdAt: serverTimestamp(),
                startDate: formData.startDate.toISOString(),
                endDate: formData.endDate.toISOString()
            };

            await addDoc(collection(db, 'facility_rentals'), rentalData);
            setSnackbar({
                open: true,
                message: 'Rental request submitted successfully',
                severity: 'success'
            });
            handleCloseDialog();
            fetchRentalRequests();
        } catch (error) {
            console.error('Error submitting rental request:', error);
            setSnackbar({
                open: true,
                message: 'Error submitting rental request',
                severity: 'error'
            });
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
            startDate: null,
            endDate: null,
            purpose: '',
            specialRequirements: ''
        });
        setViewMode(false);
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
                                    <CardContent sx={{ flexGrow: 1 }}>
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
                                        <Typography variant="subtitle1" color="primary">
                                            ${facility.pricePerDay}/day
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Features: {facility.features}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                );

            case 1:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DateTimePicker
                                    label="Start Date & Time"
                                    value={formData.startDate}
                                    onChange={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                                    renderInput={(params) => <TextField {...params} fullWidth />}
                                    minDate={new Date()}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DateTimePicker
                                    label="End Date & Time"
                                    value={formData.endDate}
                                    onChange={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                                    renderInput={(params) => <TextField {...params} fullWidth />}
                                    minDate={formData.startDate || new Date()}
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
                        <Typography variant="h6" gutterBottom>Review Rental Details</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="subtitle1" gutterBottom>Selected Facility</Typography>
                                    <Typography variant="body1" color="primary">
                                        {selectedFacility?.name} - {selectedFacility?.squareFootage} sq ft
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="subtitle1" gutterBottom>Start Time</Typography>
                                    <Typography variant="body1">
                                        {formData.startDate?.toLocaleString()}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="subtitle1" gutterBottom>End Time</Typography>
                                    <Typography variant="body1">
                                        {formData.endDate?.toLocaleString()}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="subtitle1" gutterBottom>Total Price</Typography>
                                    <Typography variant="h4" color="primary">
                                        ${calculateTotalPrice().toLocaleString()}
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

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Facility Name</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Square Footage</TableCell>
                                <TableCell>Start Date</TableCell>
                                <TableCell>End Date</TableCell>
                                <TableCell>Total Price</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : rentalRequests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">
                                        <Typography>No rental requests found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rentalRequests.map((request) => (
                                    <TableRow key={request.id}>
                                        <TableCell>{request.facilityName}</TableCell>
                                        <TableCell>{request.facilityType}</TableCell>
                                        <TableCell>{request.squareFootage}</TableCell>
                                        <TableCell>{new Date(request.startDate).toLocaleString()}</TableCell>
                                        <TableCell>{new Date(request.endDate).toLocaleString()}</TableCell>
                                        <TableCell>${request.totalPrice}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={request.status}
                                                color={
                                                    request.status === 'Approved' ? 'success' :
                                                    request.status === 'Rejected' ? 'error' :
                                                    'warning'
                                                }
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title="View Details">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        setSelectedRequest(request);
                                                        setViewMode(true);
                                                        setOpenDialog(true);
                                                        setActiveStep(2);
                                                    }}
                                                >
                                                    <Visibility />
                                                </IconButton>
                                            </Tooltip>
                                            {request.status === 'Pending' && (
                                                <Tooltip title="Cancel Request">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={async () => {
                                                            try {
                                                                await deleteDoc(doc(db, 'facility_rentals', request.id));
                                                                setSnackbar({
                                                                    open: true,
                                                                    message: 'Request cancelled successfully',
                                                                    severity: 'success'
                                                                });
                                                                fetchRentalRequests();
                                                            } catch (error) {
                                                                console.error('Error cancelling request:', error);
                                                                setSnackbar({
                                                                    open: true,
                                                                    message: 'Error cancelling request',
                                                                    severity: 'error'
                                                                });
                                                            }
                                                        }}
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

            {/* New Rental Dialog */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        minHeight: viewMode ? 'auto' : '80vh'
                    }
                }}
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
                                disabled={loading}
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