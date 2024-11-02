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
    ArrowBack,
    Factory,
    Warehouse,
    LocalShipping
} from '@mui/icons-material';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const steps = ['Select Facility Type', 'Specify Requirements', 'Review & Submit'];

const facilityTypes = [
    {
        id: 'processing',
        name: 'Processing Facility',
        description: 'Equipped spaces for goods processing, packaging, and value addition',
        pricePerDay: 500,
        icon: <Factory sx={{ fontSize: 40 }} />,
        availableAreas: [100, 200, 300], // square meters
        features: ['Temperature control', 'Loading bays', 'Processing equipment', 'Sorting areas']
    },
    {
        id: 'storage',
        name: 'Storage Facility',
        description: 'Temperature-controlled storage spaces for goods awaiting processing',
        pricePerDay: 300,
        icon: <Warehouse sx={{ fontSize: 40 }} />,
        availableAreas: [50, 100, 150], // square meters
        features: ['Climate control', 'Security systems', '24/7 access', 'Inventory management']
    },
    {
        id: 'distribution',
        name: 'Distribution Center',
        description: 'Facilities for efficient goods distribution after processing',
        pricePerDay: 400,
        icon: <LocalShipping sx={{ fontSize: 40 }} />,
        availableAreas: [150, 250, 350], // square meters
        features: ['Loading docks', 'Staging areas', 'Cross-docking', 'Fleet management']
    }
];

const FacilityRental = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [formData, setFormData] = useState({
        facilityType: '',
        area: '',
        startDate: null,
        endDate: null,
        purpose: '',
        goodsType: '',
        processingRequirements: '',
        estimatedVolume: '',
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
        fetchRentalRequests();
    }, []);

    const fetchRentalRequests = async () => {
        try {
            setLoading(true);
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
        } finally {
            setLoading(false);
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
        setFormData(prev => ({ ...prev, facilityType: facility.id }));
        handleNext();
    };

    const calculateTotalPrice = () => {
        if (!selectedFacility || !formData.startDate || !formData.endDate || !formData.area) return 0;
        const days = Math.ceil((formData.endDate - formData.startDate) / (1000 * 60 * 60 * 24));
        const areaFactor = formData.area / 100; // Price adjustment based on area
        return days * selectedFacility.pricePerDay * areaFactor;
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const rentalData = {
                ...formData,
                status: 'Pending',
                totalPrice: calculateTotalPrice(),
                facilityName: selectedFacility.name,
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
            facilityType: '',
            area: '',
            startDate: null,
            endDate: null,
            purpose: '',
            goodsType: '',
            processingRequirements: '',
            estimatedVolume: '',
            specialRequirements: ''
        });
        setViewMode(false);
    };

    const handleDateChange = (field, date) => {
        setFormData(prev => ({ ...prev, [field]: date }));
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const getStatusChip = (status) => {
        const colors = {
            Pending: 'warning',
            Approved: 'success',
            Rejected: 'error',
            Completed: 'default'
        };

        return (
            <Chip
                label={status}
                color={colors[status] || 'default'}
                size="small"
            />
        );
    };

    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Grid container spacing={3}>
                        {facilityTypes.map((facility) => (
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
                                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                                        {facility.icon}
                                    </Box>
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Typography variant="h6" gutterBottom>
                                            {facility.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" paragraph>
                                            {facility.description}
                                        </Typography>
                                        <Typography variant="subtitle1" color="primary">
                                            ${facility.pricePerDay}/day
                                        </Typography>
                                        <Box sx={{ mt: 2 }}>
                                            {facility.features.map((feature, index) => (
                                                <Chip
                                                    key={index}
                                                    label={feature}
                                                    size="small"
                                                    sx={{ m: 0.5 }}
                                                />
                                            ))}
                                        </Box>
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
                            <FormControl fullWidth>
                                <InputLabel>Area Required (m²)</InputLabel>
                                <Select
                                    value={formData.area}
                                    onChange={(e) => handleInputChange('area', e.target.value)}
                                    label="Area Required (m²)"
                                >
                                    {selectedFacility?.availableAreas.map((area) => (
                                        <MenuItem key={area} value={area}>
                                            {area} m²
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DateTimePicker
                                    label="Start Date & Time"
                                    value={formData.startDate}
                                    onChange={(date) => handleDateChange('startDate', date)}
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
                                    onChange={(date) => handleDateChange('endDate', date)}
                                    renderInput={(params) => <TextField {...params} fullWidth />}
                                    minDate={formData.startDate || new Date()}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Type of Goods"
                                value={formData.goodsType}
                                onChange={(e) => handleInputChange('goodsType', e.target.value)}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Processing Requirements"
                                value={formData.processingRequirements}
                                onChange={(e) => handleInputChange('processingRequirements', e.target.value)}
                                multiline
                                rows={3}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Estimated Volume"
                                value={formData.estimatedVolume}
                                onChange={(e) => handleInputChange('estimatedVolume', e.target.value)}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Special Requirements"
                                value={formData.specialRequirements}
                                onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
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
                                        {selectedFacility?.name} - {formData.area} m²
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
                                    <Typography variant="subtitle1" gutterBottom>Estimated Total Price</Typography>
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
                    <Typography variant="h4">Distripark Facility Rental</Typography>
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
                                <TableCell>Facility Type</TableCell>
                                <TableCell>Area (m²)</TableCell>
                                <TableCell>Start Date</TableCell>
                                <TableCell>End Date</TableCell>
                                <TableCell>Goods Type</TableCell>
                                <TableCell>Total Price</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">
                                        <CircularProgress size={24} />
                                    </TableCell>
                                </TableRow>
                            ) : rentalRequests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">
                                        <Typography variant="body1">No rental requests found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rentalRequests.map((request) => (
                                    <TableRow key={request.id}>
                                        <TableCell>{request.facilityName}</TableCell>
                                        <TableCell>{request.area}</TableCell>
                                        <TableCell>
                                            {new Date(request.startDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(request.endDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>{request.goodsType}</TableCell>
                                        <TableCell>${request.totalPrice?.toLocaleString()}</TableCell>
                                        <TableCell>
                                            {getStatusChip(request.status)}
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
                            {viewMode ? 'Rental Request Details' : 'New Facility Rental Request'}
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