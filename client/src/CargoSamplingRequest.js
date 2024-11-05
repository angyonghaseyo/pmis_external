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
    Chip,
    Paper,
    OutlinedInput,
    Divider,
    FormHelperText,
    Alert,
    IconButton,
} from '@mui/material';
import { Close as CloseIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { styled } from '@mui/material/styles';
import { doc, getDoc, setDoc, addDoc, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebaseConfig';

const VisuallyHiddenInput = styled('input')`
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
  width: 1px;
`;

const sampleTypes = [
    'Quality Control',
    'Regulatory Compliance',
    'Chemical Analysis',
    'Physical Testing',
    'Contamination Check'
];

const testingRequirements = [
    'Composition Analysis',
    'Moisture Content',
    'Purity Testing',
    'Contamination Testing',
    'Physical Properties',
    'Chemical Properties'
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

const steps = ['Overview', 'Cargo Details', 'Sampling Requirements', 'Schedule & Documents'];

const CargoSamplingRequest = ({ open, handleClose, editingId = null, onSubmitSuccess }) => {
    const [formData, setFormData] = useState({
        cargoDetails: {
            cargoNumber: '',
            cargoType: '',
            quantity: '',
            unit: 'CBM'
        },
        samplingDetails: {
            sampleType: [],
            testingRequirements: [],
            sampleQuantity: '',
            sampleUnit: 'grams'
        },
        schedule: {
            startDate: null,
            endDate: null
        },
        documents: {
            safetyDataSheet: null,
            additionalDocs: []
        },
        specialInstructions: '',
        status: 'Pending'
    });

    const [activeStep, setActiveStep] = useState(0);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [cargoNumbers, setCargoNumbers] = useState([]);
    const [selectedCargo, setSelectedCargo] = useState('');

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "bookings"));
                const bookingsArray = querySnapshot.docs.map((doc) => ({
                    bookingId: doc.id,
                    ...doc.data(),
                }));

                // Process cargo numbers from all bookings
                const allCargoNumbers = bookingsArray.reduce((acc, booking) => {
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
                // Handle error appropriately
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
            const docRef = doc(db, 'samplingRequests', editingId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setFormData(data);
            }
        } catch (error) {
            console.error('Error fetching request:', error);
            setSubmitError('Error loading request data');
        } finally {
            setLoading(false);
        }
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

        setFormData(prev => {
            if (section in prev) {
                // Handle nested objects (cargoDetails, samplingDetails, etc.)
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
                    Cargo Sampling Service Request
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
                                <li>Cargo details and quantity</li>
                                <li>Preferred sampling date and time</li>
                            </ul>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2">Required Documents:</Typography>
                            <ul>
                                <li>Cargo manifest (PDF/JPEG/PNG)</li>
                                <li>Safety data sheet</li>
                                <li>Any additional relevant documentation</li>
                            </ul>
                        </Grid>
                    </Grid>
                </StyledPaper>

                <StyledPaper>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                        Available Services
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2">Sample Types:</Typography>
                            <ul>
                                {sampleTypes.map((type) => (
                                    <li key={type}>{type}</li>
                                ))}
                            </ul>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2">Testing Requirements:</Typography>
                            <ul>
                                {testingRequirements.map((req) => (
                                    <li key={req}>{req}</li>
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
                        <li>You may select up to 3 sample types</li>
                        <li>Processing time varies based on testing requirements</li>
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
                    Sampling Requirements
                </Typography>
                <StyledPaper>
                    <FormControl fullWidth error={!!errors.sampleType} sx={{ mb: 3 }}>
                        <InputLabel required>Sample Types (Max 3)</InputLabel>
                        <Select
                            multiple
                            value={formData.samplingDetails.sampleType}
                            onChange={(e) => handleInputChange('samplingDetails', 'sampleType', e.target.value)}
                            input={<OutlinedInput label="Sample Types (Max 3)" />}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => (
                                        <Chip key={value} label={value} />
                                    ))}
                                </Box>
                            )}
                        >
                            {sampleTypes.map((type) => (
                                <MenuItem
                                    key={type}
                                    value={type}
                                    disabled={formData.samplingDetails.sampleType.length >= 3 &&
                                        !formData.samplingDetails.sampleType.includes(type)}
                                >
                                    {type}
                                </MenuItem>
                            ))}
                        </Select>
                        <FormHelperText>{errors.sampleType}</FormHelperText>
                    </FormControl>

                    <FormControl fullWidth error={!!errors.testingRequirements} sx={{ mb: 3 }}>
                        <InputLabel required>Testing Requirements (Max 5)</InputLabel>
                        <Select
                            multiple
                            value={formData.samplingDetails.testingRequirements}
                            onChange={(e) => handleInputChange('samplingDetails', 'testingRequirements', e.target.value)}
                            input={<OutlinedInput label="Testing Requirements (Max 5)" />}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => (
                                        <Chip key={value} label={value} />
                                    ))}
                                </Box>
                            )}
                        >
                            {testingRequirements.map((req) => (
                                <MenuItem
                                    key={req}
                                    value={req}
                                    disabled={formData.samplingDetails.testingRequirements.length >= 5 &&
                                        !formData.samplingDetails.testingRequirements.includes(req)}
                                >
                                    {req}
                                </MenuItem>
                            ))}
                        </Select>
                        <FormHelperText>{errors.testingRequirements}</FormHelperText>
                    </FormControl>

                    <Grid container spacing={2}>
                        <Grid item xs={8}>
                            <TextField
                                fullWidth
                                required
                                type="number"
                                label="Sample Quantity"
                                value={formData.samplingDetails.sampleQuantity}
                                onChange={(e) => handleInputChange('samplingDetails', 'sampleQuantity', e.target.value)}
                                error={!!errors.sampleQuantity}
                                helperText={errors.sampleQuantity}
                                InputProps={{ inputProps: { min: 1 } }}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                select
                                fullWidth
                                required
                                label="Unit"
                                value={formData.samplingDetails.sampleUnit}
                                onChange={(e) => handleInputChange('samplingDetails', 'sampleUnit', e.target.value)}
                            >
                                {['grams', 'kg', 'ml', 'L'].map(unit => (
                                    <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    </Grid>
                </StyledPaper>
            </Grid>
        </Grid>
    );

    const renderScheduleAndDocuments = () => (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                    Schedule & Documentation
                </Typography>
                <StyledPaper>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <DateTimePicker
                                    label="Start Date & Time"
                                    value={formData.schedule.startDate}
                                    onChange={(newValue) => handleInputChange('schedule', 'startDate', newValue)}
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
                            <Grid item xs={12}>
                                <DateTimePicker
                                    label="End Date & Time"
                                    value={formData.schedule.endDate}
                                    onChange={(newValue) => handleInputChange('schedule', 'endDate', newValue)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
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
                                Upload Safety Data Sheet*
                                <VisuallyHiddenInput
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => handleInputChange('documents', 'safetyDataSheet', e.target.files[0])}
                                />
                            </Button>
                            {formData.documents.safetyDataSheet && (
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Selected: {formData.documents.safetyDataSheet.name}
                                </Typography>
                            )}
                            <FormHelperText error={!!errors.safetyDataSheet}>
                                {errors.safetyDataSheet || 'PDF, JPEG, or PNG (max 5MB)'}
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

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setSubmitError(null);

            const fileUrls = await uploadFiles();

            const requestData = {
                ...formData,
                documents: fileUrls,
                status: 'Pending',
                updatedAt: new Date(),
                createdAt: editingId ? formData.createdAt : new Date()
            };

            if (editingId) {
                await setDoc(doc(db, 'samplingRequests', editingId), requestData);
            } else {
                const docRef = await addDoc(collection(db, 'samplingRequests'), requestData);
                await setDoc(docRef, { id: docRef.id }, { merge: true });
            }

            onSubmitSuccess?.();
            handleClose();
        } catch (error) {
            console.error('Error submitting request:', error);
            setSubmitError('Failed to submit request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const uploadFiles = async () => {
        const uploads = {};

        if (formData.documents.safetyDataSheet) {
            uploads.safetyDataSheet = await uploadFile(
                formData.documents.safetyDataSheet,
                'safety-sheets'
            );
        }

        if (formData.documents.additionalDocs?.length > 0) {
            uploads.additionalDocs = await Promise.all(
                formData.documents.additionalDocs.map(
                    file => uploadFile(file, 'additional')
                )
            );
        }

        return uploads;
    };

    const uploadFile = async (file, path) => {
        if (!file) return null;
        const storageRef = ref(storage, `sampling-requests/${path}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    };

    // Rest of your component remains the same...

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { minHeight: '80vh' }
            }}
        >
            <DialogTitle>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6">
                        {editingId ? 'Edit Sampling Request' : 'New Sampling Request'}
                    </Typography>
                    <IconButton onClick={handleClose} size="small">
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
                <Button onClick={handleClose}>Cancel</Button>
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
    );
};

export default CargoSamplingRequest;