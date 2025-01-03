import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Grid,
    Typography,
    Stepper,
    Step,
    StepLabel,
    FormControl,
    InputLabel,
    Select,
    Paper,
    OutlinedInput,
    FormHelperText,
    Alert,
    IconButton,
    Snackbar
} from '@mui/material';
import { Close as CloseIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { styled } from '@mui/material/styles';
import { useAuth } from "./AuthContext";
import {
    submitTransloadingRequest,
    updateTransloadingRequest,
    getTransloadingRequestById
} from './services/api';
import { API_URL } from './config/apiConfig';

const VisuallyHiddenInput = styled('input')`
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
  width: 1px;
`;


const destination = [
    'Intermodal Transfer Area A',
    'Intermodal Transfer Area B',
    'Intermodal Transfer Area C',
    'Container Yard T',
    'Container Yard U',
    'Container Yard W',
    'Container Yard X',
    'Container Yard Y',
    'Container Yard 1',
    'Container Yard 2'
];


const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    '& ul': {
        paddingLeft: theme.spacing(2),
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1),
    }
}));

const steps = ['Overview', 'Cargo Details', 'Transloading Requirements', 'Schedule & Documents'];

const CargoTransloadingRequest = ({ open, handleClose, editingId = null, onSubmitSuccess }) => {
    const [formData, setFormData] = useState({
        cargoDetails: {
            cargoNumber: '',
            cargoType: '',
            quantity: '',
            unit: 'CBM',
        },
        destinationArea: '',
        transloadingTimeWindow: {
            startDate: null,
            endDate: null
        },
        documents: {
            transloadingSheet: []
        },
        specialInstructions: '',
        status: 'Pending'
    });

    const initialFormState = {
        cargoDetails: {
            cargoNumber: '',
            cargoType: '',
            quantity: '',
            unit: 'CBM',
        },
        destinationArea: '',
        transloadingTimeWindow: {
            startDate: null,
            endDate: null
        },
        documents: {
            transloadingSheet: []
        },
        specialInstructions: '',
        status: 'Pending'
    };

    const { user } = useAuth();
    const [activeStep, setActiveStep] = useState(0);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [cargoNumbers, setCargoNumbers] = useState([]);
    const [selectedCargo, setSelectedCargo] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar({ ...snackbar, open: false });
    };

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const response = await fetch(`${API_URL}/bookings`);
                if (!response.ok) {
                    throw new Error('Error fetching bookings');
                }
                const bookingsData = await response.json();

                // Process cargo numbers from bookings
                const allCargoNumbers = bookingsData.reduce((acc, booking) => {
                    if (booking.cargo) {
                        Object.entries(booking.cargo).forEach(([cargoNumber, cargoDetails]) => {
                            acc.push({
                                cargoNumber,
                                cargoName: cargoDetails.name,
                                bookingId: booking.bookingId,
                                cargoType: cargoDetails.cargoType,
                                quantity: cargoDetails.quantity,
                                unit: cargoDetails.unit
                            });
                        });
                    }
                    return acc;
                }, []);

                setCargoNumbers(allCargoNumbers);
            } catch (error) {
                console.error('Error fetching bookings:', error);
                setSnackbar({
                    open: true,
                    message: 'Error fetching bookings data',
                    severity: 'error'
                });
            }
        };

        fetchBookings();
    }, []);

    useEffect(() => {
        if (editingId) {
            fetchRequestData();
        }
    }, [editingId]);

    const fetchRequestData = async () => {
        try {
            setLoading(true);
            const data = await getTransloadingRequestById(editingId);

            // Format dates from the API response
            const formattedData = {
                ...data,
                transloadingTimeWindow: {
                    startDate: data.transloadingTimeWindow?.startDate?._seconds ?
                        new Date(data.transloadingTimeWindow.startDate._seconds * 1000) : null,
                    endDate: data.transloadingTimeWindow?.endDate?._seconds ?
                        new Date(data.transloadingTimeWindow.endDate._seconds * 1000) : null
                }
            };

            setFormData(formattedData);
        } catch (error) {
            console.error('Error fetching request:', error);
            setSubmitError('Error loading request data');
            setSnackbar({
                open: true,
                message: 'Error loading request data',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const resetDialog = () => {
        setFormData(initialFormState);
        setActiveStep(0);
        setErrors({});
        setSubmitError(null);
        setSelectedCargo('');
    };

    const handleDialogClose = () => {
        resetDialog();
        handleClose();
    };

    const handleInputChange = (section, field, value) => {
        if (section === 'specialInstructions') {
            // Handle special instructions directly since it's not nested
            setFormData(prev => ({
                ...prev,
                specialInstructions: value
            }));
            return;
        }

        if (section === 'destinationArea') {
            // Handle special instructions directly since it's not nested
            setFormData(prev => ({
                ...prev,
                destinationArea: value
            }));
            return;
        }


        setFormData(prev => {
            if (section in prev) {
                return {
                    ...prev,
                    [section]: {
                        ...prev[section],
                        [field]: value
                    }
                };
            } else {
                // Handle direct field updates
                return {
                    ...prev,
                    [field]: value
                };
            }
        });

        // Clear related errors when field is updated
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    const handleCargoChange = (event) => {
        const selectedCargoNumber = event.target.value;
        setSelectedCargo(selectedCargoNumber);

        // Find the cargo details from cargoNumbers array directly
        const selectedCargoDetails = cargoNumbers.find(
            cargo => cargo.cargoNumber === selectedCargoNumber
        );

        if (selectedCargoDetails) {
            setFormData(prev => ({
                ...prev,
                cargoDetails: {
                    ...prev.cargoDetails,
                    cargoNumber: selectedCargoNumber,
                    cargoType: selectedCargoDetails.cargoType || '',
                    quantity: selectedCargoDetails.quantity || '',
                    unit: selectedCargoDetails.unit || '',
                    cargoName: selectedCargoDetails.cargoName
                }
            }));
        }
    };


    const renderOverviewStep = () => (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                    Cargo Transloading Service Request
                </Typography>

                <StyledPaper>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                        Before You Begin
                    </Typography>
                    <Typography variant="body2" paragraph>
                        Please ensure you have the following information ready:
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2">Required Information:</Typography>
                            <ul>
                                <li>Valid cargo number</li>
                                <li>Current packaging details</li>
                                <li>Desired packaging specifications</li>
                                <li>Estimated transloading duration</li>
                            </ul>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2">Required Documents:</Typography>
                            <ul>
                                <li>Current packaging documentation</li>
                                <li>Special handling requirements</li>
                            </ul>
                        </Grid>
                    </Grid>
                </StyledPaper>

                <StyledPaper>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                        Transloading Destination Areas
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2">Areas Available:</Typography>
                            <ul>
                                {destination.map((type) => (
                                    <li key={type}>{type}</li>
                                ))}
                            </ul>
                        </Grid>

                    </Grid>
                </StyledPaper>

                <StyledPaper>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                        Important Notes
                    </Typography>
                    <ul>
                        <li>Requests must be submitted at least 24 hours in advance</li>
                        <li>Maximum file size: 5MB per document</li>
                    </ul>
                </StyledPaper>
            </Grid>
        </Grid>
    );

    const renderCargoDetails = () => (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                    Cargo Information
                </Typography>
                <StyledPaper>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <FormControl fullWidth required>
                                <InputLabel>Cargo Number</InputLabel>
                                <Select
                                    value={selectedCargo}
                                    onChange={handleCargoChange}
                                    label="Cargo Number"
                                >
                                    {cargoNumbers.map((cargo) => (
                                        <MenuItem key={cargo.cargoNumber} value={cargo.cargoNumber}>
                                            {cargo.cargoNumber} - {cargo.cargoName} (Booking: {cargo.bookingId})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Cargo Type"
                                value={formData.cargoDetails.cargoType}
                                InputProps={{
                                    readOnly: true,
                                    style: { color: 'rgba(0, 0, 0, 0.87)' }
                                }}
                                sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}
                            />
                        </Grid>
                        <Grid item xs={8}>
                            <TextField
                                fullWidth
                                label="Quantity"
                                value={formData.cargoDetails.quantity}
                                InputProps={{
                                    readOnly: true,
                                    style: { color: 'rgba(0, 0, 0, 0.87)' }
                                }}
                                sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                fullWidth
                                label="Unit"
                                value={formData.cargoDetails.unit}
                                InputProps={{
                                    readOnly: true,
                                    style: { color: 'rgba(0, 0, 0, 0.87)' }
                                }}
                                sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}
                            />
                        </Grid>
                    </Grid>
                </StyledPaper>
            </Grid>
        </Grid>
    );

    const renderSamplingRequirements = () => (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                    Transloading Requirements
                </Typography>
                <StyledPaper>

                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel>Destination Area</InputLabel>
                        <Select
                            required
                            value={formData.destinationArea}
                            onChange={(e) => handleInputChange('destinationArea', '', e.target.value)}
                            input={<OutlinedInput label="Current Packaging" />}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>

                                    <Typography> {selected} </Typography>

                                </Box>
                            )}
                        >
                            {destination.map((type) => (
                                <MenuItem key={type} value={type}>
                                    {type}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                </StyledPaper>
            </Grid>
        </Grid>
    );

    const renderScheduleAndDocuments = () => (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                    Transloading Time Window & Documentation
                </Typography>
                <StyledPaper>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <Grid container spacing={3}>

                            <Grid item xs={6}>
                                <DateTimePicker
                                    label="Start Date & Time"
                                    value={formData.transloadingTimeWindow.startDate}
                                    onChange={(newValue) => handleInputChange('transloadingTimeWindow', 'startDate', newValue)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            required
                                            error={!!errors.startDate}
                                            helperText={errors.startDate}
                                        />
                                    )}
                                    minDate={new Date()}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <DateTimePicker
                                    label="End Date & Time"
                                    value={formData.transloadingTimeWindow.endDate}
                                    onChange={(newValue) => handleInputChange('transloadingTimeWindow', 'endDate', newValue)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            required
                                            error={!!errors.endDate}
                                            helperText={errors.endDate}
                                        />
                                    )}
                                    minDate={new Date()}
                                />
                            </Grid>
                        </Grid>
                    </LocalizationProvider>
                </StyledPaper>

                <StyledPaper>
                    <Typography variant="subtitle2" gutterBottom>Required Documents</Typography>
                    <Grid container spacing={2}>

                        <Grid item xs={12}>
                            <Button
                                component="label"
                                variant="contained"
                                startIcon={<CloudUploadIcon />}
                                fullWidth
                                sx={{ mb: 1 }}
                            >
                                Upload Additional Transloading Sheet
                                <VisuallyHiddenInput
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => handleInputChange('documents', 'transloadingSheet', e.target.files[0])}
                                />
                            </Button>
                            {formData.documents.transloadingSheet && (
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Selected: {formData.documents.transloadingSheet.name}
                                </Typography>
                            )}
                            <FormHelperText error={!!errors.transloadingSheet}>
                                {errors.transloadingSheet || 'PDF, JPEG, or PNG (max 5MB)'}
                            </FormHelperText>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                label="Special Instructions (Optional)"
                                value={formData.specialInstructions}
                                onChange={(e) => handleInputChange('specialInstructions', '', e.target.value)}
                                placeholder="Enter any special requirements or handling instructions"
                            />
                        </Grid>
                    </Grid>
                </StyledPaper>
            </Grid>
        </Grid>
    );
    // Your existing renderStepContent function here...
    // (Keep the cargo details, sampling requirements, and schedule & documents steps as they were)

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return renderOverviewStep();
            case 1:
                return renderCargoDetails();
            case 2:
                return renderSamplingRequirements();
            case 3:
                return renderScheduleAndDocuments();
            default:
                return null;
        }
    };

    const validateForm = () => {
        const errors = {};

        // Cargo Details Validation
        if (!formData.cargoDetails.cargoNumber) {
            errors.cargoNumber = 'Cargo number is required';
        }

        if (!formData.cargoDetails.cargoType) {
            errors.cargoType = 'Cargo type is required';
        }

        if (!formData.cargoDetails.quantity || formData.cargoDetails.quantity <= 0) {
            errors.quantity = 'Valid quantity is required';
        }

        // Destination Area Validation
        if (!formData.destinationArea) {
            errors.destinationArea = 'Destination area is required';
        }

        // Schedule Validation
        if (!formData.transloadingTimeWindow.startDate) {
            errors.startDate = 'Start date is required';
        }

        if (!formData.transloadingTimeWindow.endDate) {
            errors.endDate = 'End date is required';
        }

        if (formData.transloadingTimeWindow.startDate && formData.transloadingTimeWindow.endDate) {
            if (formData.transloadingTimeWindow.endDate < formData.transloadingTimeWindow.startDate) {
                errors.endDate = 'End date must be after start date';
            }
        }

        setErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            setSubmitError('Please fill in all required fields correctly');
            return;
        }

        try {
            setLoading(true);
            setSubmitError(null);

            const requestData = {
                ...formData,
                company: user.company,
                status: 'Pending',
            };

            if (editingId) {
                await updateTransloadingRequest(editingId, requestData);
            } else {
                await submitTransloadingRequest(requestData);
            }

            onSubmitSuccess?.();
            handleDialogClose();
            setSnackbar({
                open: true,
                message: `Transloading Request ${editingId ? 'updated' : 'created'} successfully`,
                severity: 'success'
            });
        } catch (error) {
            console.error('Error submitting request:', error);
            setSnackbar({
                open: true,
                message: 'Failed to submit request. Please try again.',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };


    return (
        <>
            <Dialog
                open={open}
                onClose={handleDialogClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { minHeight: '80vh' }
                }}
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6">
                            {editingId ? 'Edit Transloading Request' : 'New Transloading Request'}
                        </Typography>
                        <IconButton onClick={handleDialogClose} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent dividers>
                    {submitError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {submitError}
                        </Alert>
                    )}

                    <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {renderStepContent(activeStep)}
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleDialogClose}>Cancel</Button>
                    <Box sx={{ flex: '1 1 auto' }} />
                    <Button
                        disabled={activeStep === 0}
                        onClick={() => setActiveStep((prev) => prev - 1)}
                        sx={{ mr: 1 }}
                    >
                        Back
                    </Button>
                    {activeStep === steps.length - 1 ? (
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            onClick={() => setActiveStep((prev) => prev + 1)}
                        >
                            {activeStep === 0 ? 'Start Request' : 'Next'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default CargoTransloadingRequest;