import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Typography,
    TextField,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Snackbar,
    InputLabel,
    Stepper,
    Step,
    StepLabel,
    Alert,
    Chip,
    Card,
    CardContent,
    CardMedia,
    CardActions,
    FormControl,
    Select,
    MenuItem,
    Radio,
    RadioGroup,
    FormControlLabel
} from "@mui/material";

import { 
    getContainerRequests, 
    createContainerRequest, 
    getBookings, 
    getContainerTypes,
    getBookingById 
} from './services/api';

const ContainerRequest = ({ user }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [containerRequests, setContainerRequests] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [bookingData, setBookingData] = useState(null);
    const [availableContainers, setAvailableContainers] = useState({});
    const [cargos, setCargos] = useState([]);
    const [isBookingValid, setIsBookingValid] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentCargoId, setCurrentCargoId] = useState(null);
    const [selectedContainers, setSelectedContainers] = useState({});
    const [bookings, setBookings] = useState([]);
    const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [voyage, setVoyage] = useState("");

    const steps = [
        'Enter Booking Details',
        'Select Service Type',
        'Choose Container'
    ];

    const initialFormData = {
        bookingId: "",
        voyageNumber: ""
    };

    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch container requests
                const requestsData = await getContainerRequests();
                setContainerRequests(requestsData);

                // Fetch available containers from all carriers
                await fetchAllContainers();

                // Fetch bookings
                const bookingsData = await getBookings();
                setBookings(bookingsData.filter(booking => booking.userEmail === user.email));
            } catch (error) {
                console.error('Error fetching data:', error);
                setOpenSnackbar({
                    open: true,
                    message: "Error fetching data",
                    severity: "error"
                });
            }
        };
        fetchData();
    }, [user.email]);

    const fetchAllContainers = async () => {
        try {
            const containerData = await getContainerTypes();
            setAvailableContainers(containerData);
        } catch (error) {
            console.error("Error fetching containers:", error);
            setOpenSnackbar({
                open: true,
                message: "Error fetching container data",
                severity: "error"
            });
        }
    };

    const handleBookingSelect = async (selectedBookingId) => {
        setIsLoading(true);
        try {
            const bookingDetails = await getBookingById(selectedBookingId);
            if (bookingDetails) {
                setBookingData(bookingDetails);
                setIsBookingValid(true);
                setVoyage(bookingDetails.voyageNumber);
                setFormData(prev => ({
                    ...prev,
                    bookingId: selectedBookingId,
                    voyageNumber: bookingDetails.voyageNumber
                }));
            } else {
                setOpenSnackbar({
                    open: true,
                    message: "Booking not found!",
                    severity: "error"
                });
            }
        } catch (error) {
            console.error("Error fetching booking:", error);
            setOpenSnackbar({
                open: true,
                message: "Error fetching booking data",
                severity: "error"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleServiceTypeChange = (cargoId, serviceType) => {
        setCargos(prevCargos => prevCargos.map(cargo =>
            cargo.id === cargoId ? { ...cargo, serviceType } : cargo
        ));
    };

    const handleContainerSelection = (cargoId, containerDetails, serviceType, carrierName) => {
        if (serviceType === 'fullContainer') {
            setSelectedContainers(prev => ({
                ...prev,
                [cargoId]: {
                    ...containerDetails,
                    carrierName
                }
            }));
        } else if (serviceType === 'consolidation') {
            setCargos(prevCargos =>
                prevCargos.map(cargo =>
                    cargo.id === cargoId
                        ? {
                            ...cargo,
                            selectedContainer: {
                                ...containerDetails,
                                carrierName
                            }
                        }
                        : cargo
                )
            );
        }
    };

    const handleSubmit = async () => {
        try {
            // Validate selections
            const invalidCargos = cargos.filter(cargo => {
                if (cargo.serviceType === 'fullContainer' && !selectedContainers[cargo.id]) {
                    return true;
                }
                return false;
            });

            if (invalidCargos.length > 0) {
                setOpenSnackbar({
                    open: true,
                    message: "Please complete all cargo selections",
                    severity: "error"
                });
                return;
            }

            // Submit individual requests for each cargo
            for (const cargo of cargos) {
                const dataToSubmit = {
                    bookingId: formData.bookingId,
                    voyageNumber: formData.voyageNumber,
                    status: 'Pending',
                    cargoId: cargo.id,
                    cargoDetails: {
                        name: cargo.name,
                        quantity: cargo.quantity,
                        weightPerUnit: cargo.weightPerUnit
                    },
                    eta: bookingData?.eta || null,
                    etd: bookingData?.etd || null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                if (cargo.serviceType === 'fullContainer') {
                    const containerDetails = selectedContainers[cargo.id];
                    dataToSubmit.containerDetails = containerDetails;
                    dataToSubmit.carrierName = containerDetails.carrierName;
                } else {
                    dataToSubmit.consolidationSpace = cargo.consolidationSpace;
                    dataToSubmit.consolidationService = true;
                    dataToSubmit.containerDetails = cargo.selectedContainer;
                }

                await createContainerRequest(dataToSubmit);
            }

            setOpenSnackbar({
                open: true,
                message: "Successfully submitted container requests!",
                severity: "success"
            });
            handleCloseDialog();

            // Refresh the container requests list
            const updatedRequests = await getContainerRequests();
            setContainerRequests(updatedRequests);

        } catch (error) {
            console.error("Error submitting container request: ", error);
            setOpenSnackbar({
                open: true,
                message: `Error submitting request: ${error.message}`,
                severity: "error"
            });
        }
    };

    async function fetchBookingData(bookingId) {
        setIsLoading(true);
        try {
            const bookingDetails = await getBookingById(bookingId);
            if (bookingDetails) {
                setBookingData(bookingDetails);
                setIsBookingValid(true);
                setVoyage(bookingDetails.voyageNumber);

                const cargoMap = bookingDetails.cargo || {};
                const cargoArray = Object.entries(cargoMap).map(([id, cargoData]) => ({
                    id,
                    ...cargoData,
                    serviceType: null,
                    selectedContainer: null
                }));

                setCargos(cargoArray);
                return true;
            } else {
                setOpenSnackbar({
                    open: true,
                    message: "Booking not found!",
                    severity: "error"
                });
                return false;
            }
        } catch (error) {
            console.error("Error fetching booking:", error);
            setOpenSnackbar({
                open: true,
                message: "Error fetching booking data",
                severity: "error"
            });
            return false;
        } finally {
            setIsLoading(false);
        }
    }

    const generateSteps = () => {
        const baseSteps = ['Enter Booking Details', 'Select Service Type'];
        if (cargos.length > 0) {
            cargos.forEach((cargo, index) => {
                baseSteps.push(`Container Selection - ${cargo.name}`);
            });
        }
        return baseSteps;
    };

    const ContainerCard = ({ container, cargoId, onSelect, isSelected, serviceType, carrierName }) => (
        <Card
            sx={{
                maxWidth: 345,
                border: isSelected ? '3px solid #1976d2' : '1px solid #e0e0e0',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
                '&:hover': {
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    transform: isSelected ? 'scale(1.02)' : 'scale(1.01)'
                },
                position: 'relative'
            }}
            onClick={() => onSelect(cargoId, container, serviceType, carrierName)}
        >
            {isSelected && (
                <Chip
                    label="Selected"
                    color="primary"
                    sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        zIndex: 1
                    }}
                />
            )}
            <CardMedia
                component="img"
                height="140"
                image={container.imageUrl || "/api/placeholder/345/140"}
                alt={container.name}
            />
            <CardContent>
                <Typography gutterBottom variant="h6" component="div">
                    {container.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Size: {container.size}ft
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Type: {container.type}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Carrier: {carrierName}
                </Typography>
                <Typography variant="h6" color="primary">
                    ${container.price}
                </Typography>
            </CardContent>
        </Card>
    );

    const getStepContent = (step) => {
        const currentStepIndex = step;

        switch (true) {
            case currentStepIndex === 0:
                return (
                    <Box sx={{ p: 2 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Booking Number</InputLabel>
                                    <Select
                                        name="bookingId"
                                        value={formData.bookingId}
                                        onChange={(e) => handleBookingSelect(e.target.value)}
                                        required
                                    >
                                        {bookings.map((booking) => (
                                            <MenuItem key={booking.bookingId} value={booking.bookingId}>
                                                {booking.bookingId}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Voyage Number"
                                    name="voyageNumber"
                                    value={voyage}
                                    disabled
                                />
                            </Grid>
                        </Grid>
                    </Box>
                );

            case currentStepIndex === 1:
                return (
                    <Box sx={{ p: 2 }}>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Cargo Name</TableCell>
                                        <TableCell>Quantity</TableCell>
                                        <TableCell>Weight/Unit(kg)</TableCell>
                                        <TableCell>Service Type</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {cargos.map((cargo) => (
                                        <TableRow key={cargo.id}>
                                            <TableCell>{cargo.name}</TableCell>
                                            <TableCell>{cargo.quantity}</TableCell>
                                            <TableCell>{cargo.weightPerUnit}</TableCell>
                                            <TableCell>
                                                <RadioGroup
                                                    value={cargo.serviceType || ''}
                                                    onChange={(e) => handleServiceTypeChange(cargo.id, e.target.value)}
                                                >
                                                    <FormControlLabel
                                                        value="fullContainer"
                                                        control={<Radio />}
                                                        label="Full Container"
                                                    />
                                                    <FormControlLabel
                                                        value="consolidation"
                                                        control={<Radio />}
                                                        label="Consolidation"
                                                    />
                                                </RadioGroup>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                );

            default:
                const cargoIndex = currentStepIndex - 2;
                const currentCargo = cargos[cargoIndex];

                if (!currentCargo) return 'Unknown step';

                return (
                    <Box sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Container Selection for: {currentCargo.name}
                        </Typography>
                        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                            Service Type: {currentCargo.serviceType === 'fullContainer' ? 'Full Container' : 'Consolidation'}
                        </Typography>

                        {currentCargo.serviceType === 'consolidation' && (
                            <Box sx={{ mb: 3 }}>
                                <TextField
                                    label="Required Space (ft³)"
                                    type="number"
                                    value={currentCargo.consolidationSpace || ''}
                                    onChange={(e) => {
                                        setCargos(prevCargos => prevCargos.map(c =>
                                            c.id === currentCargo.id
                                                ? { ...c, consolidationSpace: e.target.value }
                                                : c
                                        ));
                                    }}
                                    fullWidth
                                    sx={{ mb: 2 }}
                                />
                            </Box>
                        )}
                        {currentCargo.serviceType === 'fullContainer' && (
                            <Grid container spacing={3}>
                                {Object.entries(availableContainers).map(([carrierName, containers]) => (
                                    <React.Fragment key={carrierName}>
                                        <Grid item xs={12}>
                                            <Typography variant="h6" color="primary">
                                                {carrierName}
                                            </Typography>
                                        </Grid>
                                        {containers.map((container, index) => (
                                            <Grid item xs={12} sm={6} md={4} key={index}>
                                                <ContainerCard
                                                    container={container}
                                                    cargoId={currentCargo.id}
                                                    onSelect={handleContainerSelection}
                                                    isSelected={
                                                        selectedContainers[currentCargo.id]?.name === container.name
                                                    }
                                                    serviceType={currentCargo.serviceType}
                                                    carrierName={carrierName}
                                                />
                                            </Grid>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </Grid>
                        )}
                    </Box>
                );
        }
    };

    const handleNext = async () => {
        if (activeStep === 0) {
            const isValid = await fetchBookingData(formData.bookingId);
            if (!isValid) return;
        }

        if (activeStep === 1) {
            const hasServiceType = cargos.every(cargo => cargo.serviceType);
            if (!hasServiceType) {
                setOpenSnackbar({
                    open: true,
                    message: "Please select service type for all cargos",
                    severity: "error"
                });
                return;
            }
        }

        if (activeStep > 1) {
            const currentCargoIndex = activeStep - 2;
            const currentCargo = cargos[currentCargoIndex];

            if (currentCargo.serviceType === 'fullContainer' && !selectedContainers[currentCargo.id]) {
                setOpenSnackbar({
                    open: true,
                    message: "Please select a container",
                    severity: "error"
                });
                return;
            }

            if (currentCargo.serviceType === 'consolidation' && !currentCargo.consolidationSpace) {
                setOpenSnackbar({
                    open: true,
                    message: "Please enter space requirements",
                    severity: "error"
                });
                return;
            }
        }

        setActiveStep((prevStep) => prevStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setFormData(initialFormData);
        setCargos([]);
        setBookingData(null);
        setSelectedContainers({});
        setActiveStep(0);
        setIsBookingValid(false);
    };

    const handleOpenDialog = () => {
        setOpenDialog(true);
    };

    const handleOpenDetails = (request) => {
        setSelectedRequest(request);
        setOpenDetailsDialog(true);
    };

    const handleCloseDetails = () => {
        setSelectedRequest(null);
        setOpenDetailsDialog(false);
    };

    const formatStatus = (status) => {
        switch (status) {
            case 'Pending':
                return <Chip label="Pending" color="warning" size="small" />;
            case 'Assigned':
                return <Chip label="Assigned" color="success" size="small" />;
            case 'Rejected':
                return <Chip label="Rejected" color="error" size="small" />;
            default:
                return <Chip label={status} size="small" />;
        }
    };

    const RequestDetailsDialog = ({ open, onClose, request }) => {
        if (!request) return null;

        return (
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Typography variant="h6">
                        Container Request Details
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        {/* Basic Information */}
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ mb: 2 }}>Basic Information</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Booking ID"
                                value={request.bookingId || ''}
                                disabled
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Voyage Number"
                                value={request.voyageNumber || ''}
                                disabled
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Status"
                                disabled
                                variant="outlined"
                                size="small"
                                InputProps={{
                                    startAdornment: (
                                        <Box sx={{ mr: 1 }}>
                                            {formatStatus(request.status)}
                                        </Box>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Service Type"
                                value={request.consolidationService ? 'Consolidation' : 'Full Container'}
                                disabled
                                variant="outlined"
                                size="small"
                            />
                        </Grid>

                        {/* Cargo Details */}
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>Cargo Details</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Cargo Name"
                                value={request.cargoDetails?.name || ''}
                                disabled
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Quantity"
                                value={request.cargoDetails?.quantity || ''}
                                disabled
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Weight per Unit"
                                value={`${request.cargoDetails?.weightPerUnit || ''} kg`}
                                disabled
                                variant="outlined"
                                size="small"
                            />
                        </Grid>

                        {/* Service Specific Details */}
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
                                {request.consolidationService ? 'Consolidation Details' : 'Container Details'}
                            </Typography>
                        </Grid>

                        {request.consolidationService ? (
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Space Required"
                                    value={`${request.consolidationSpace || ''} ft³`}
                                    disabled
                                    variant="outlined"
                                    size="small"
                                />
                            </Grid>
                        ) : (
                            <>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Container Type"
                                        value={request.containerDetails?.name || ''}
                                        disabled
                                        variant="outlined"
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Size"
                                        value={`${request.containerDetails?.size || ''} ft`}
                                        disabled
                                        variant="outlined"
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Price"
                                        value={request.containerDetails?.price ? `$${request.containerDetails.price}` : 'TBD'}
                                        disabled
                                        variant="outlined"
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Carrier"
                                        value={request.carrierName || 'Not assigned'}
                                        disabled
                                        variant="outlined"
                                        size="small"
                                    />
                                </Grid>
                            </>
                        )}

                        {request.status === 'Rejected' && (
                            <>
                                <Grid item xs={12}>
                                    <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>Rejection Details</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Rejection Reason"
                                        value={request.rejectionReason || ''}
                                        disabled
                                        variant="outlined"
                                        size="small"
                                        multiline
                                        rows={2}
                                    />
                                </Grid>
                            </>
                        )}

                        {/* Timestamps */}
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>Timestamps</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Created At"
                                value={new Date(request.createdAt).toLocaleDateString()}
                                disabled
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Last Updated"
                                value={new Date(request.updatedAt).toLocaleDateString()}
                                disabled
                                variant="outlined"
                                size="small"
                            />
                        </Grid>

                        {/* Delivery Schedule */}
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>Delivery Schedule</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="ETD"
                                value={request.etd ? new Date(request.etd).toLocaleDateString() : 'Not specified'}
                                disabled
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="ETA"
                                value={request.eta ? new Date(request.eta).toLocaleDateString() : 'Not specified'}
                                disabled
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} variant="contained" color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Header Section */}
            <Paper
                elevation={2}
                sx={{
                    p: 3,
                    mb: 3,
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    color: 'white'
                }}
            >
                <Grid container justifyContent="space-between" alignItems="center">
                    <Grid item>
                        <Typography variant="h4" component="h1" gutterBottom>
                            Container Marketplace
                        </Typography>
                        <Typography variant="subtitle1">
                            Manage your container bookings and requests
                        </Typography>
                    </Grid>
                    <Grid item>
                        <Button
                            variant="contained"
                            onClick={handleOpenDialog}
                            sx={{
                                backgroundColor: 'white',
                                color: '#2196F3',
                                '&:hover': {
                                    backgroundColor: '#e3f2fd',
                                }
                            }}
                        >
                            New Container Request
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Main Content - Request List */}
            <Paper elevation={1} sx={{ mb: 3 }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Booking ID</TableCell>
                                <TableCell>Voyage Number</TableCell>
                                <TableCell>Container/Space</TableCell>
                                <TableCell>Price</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Rejection Reason</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {containerRequests.map((request) => (
                                <TableRow key={request.id} hover>
                                    <TableCell>{request.bookingId}</TableCell>
                                    <TableCell>{request.voyageNumber}</TableCell>
                                    <TableCell>
                                        {request.containerDetails ? (
                                            <Box>
                                                <Typography variant="body2">
                                                    {request.containerDetails.name}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {request.containerDetails.size}ft
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2">
                                                {request.consolidationSpace}ft³ (Consolidation)
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {request.containerDetails?.price ?
                                            `$${request.containerDetails.price}` :
                                            'TBD'
                                        }
                                    </TableCell>
                                    <TableCell>
                                        {formatStatus(request.status)}
                                    </TableCell>
                                    <TableCell>
                                        {request.rejectionReason ? (
                                            <Typography variant="body2">
                                                {request.rejectionReason}
                                            </Typography>
                                        ) : (<Typography variant="body2">-</Typography>)
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => handleOpenDetails(request)}
                                        >
                                            View Details
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* New Request Dialog */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        minHeight: '80vh'
                    }
                }}
            >
                <DialogTitle>
                    <Typography variant="h5" component="div">
                        New Container Request
                    </Typography>
                    <Typography variant="subtitle2" color="textSecondary">
                        Complete the following steps to submit your container request
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Stepper
                        activeStep={activeStep}
                        sx={{
                            my: 3,
                            '& .MuiStepLabel-root .Mui-completed': {
                                color: '#2196F3'
                            },
                            '& .MuiStepLabel-root .Mui-active': {
                                color: '#2196F3'
                            }
                        }}
                    >
                        {generateSteps().map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                    <Box sx={{ mt: 2 }}>
                        {getStepContent(activeStep)}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        onClick={handleBack}
                        disabled={activeStep === 0}
                    >
                        Back
                    </Button>
                    {activeStep === generateSteps().length - 1 ? (
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            disabled={!isBookingValid}
                            sx={{
                                backgroundColor: '#2196F3',
                                '&:hover': {
                                    backgroundColor: '#1976D2'
                                }
                            }}
                        >
                            Submit Request
                        </Button>
                    ) : (
                        <Button
                            onClick={handleNext}
                            variant="contained"
                            sx={{
                                backgroundColor: '#2196F3',
                                '&:hover': {
                                    backgroundColor: '#1976D2'
                                }
                            }}
                        >
                            Next
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={openSnackbar.open}
                autoHideDuration={6000}
                onClose={() => setOpenSnackbar({ ...openSnackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    severity={openSnackbar.severity}
                    variant="filled"
                    onClose={() => setOpenSnackbar({ ...openSnackbar, open: false })}
                >
                    {openSnackbar.message}
                </Alert>
            </Snackbar>

            {/* Details Dialog */}
            <RequestDetailsDialog
                open={openDetailsDialog}
                onClose={handleCloseDetails}
                request={selectedRequest}
            />
        </Box>
    );
};

export default ContainerRequest;