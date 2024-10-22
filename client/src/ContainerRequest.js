import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Typography,
    TextField,
    FormControlLabel,
    Checkbox,
    Grid,
    Select,
    MenuItem,
    FormControl,
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
    Alert
} from "@mui/material";
import MuiAlert from '@mui/material/Alert';
import {
    doc,
    addDoc,
    getDocs,
    collection,
    getDoc,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

const ContainerRequest = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [containerRequests, setContainerRequests] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [carriers, setCarriers] = useState([]);
    const [bookingData, setBookingData] = useState(null);
    const [containers, setContainers] = useState([]);
    const [cargos, setCargos] = useState([]);
    const [isBookingValid, setIsBookingValid] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const steps = ['Enter Booking ID', 'Select Carrier & Container', 'Select Cargo'];

    const initialFormData = {
        carrierName: "",
        voyageNumber: "",
        bookingId: "",
        containerSize: "",
    };

    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        const fetchData = async () => {
            const querySnapshot = await getDocs(collection(db, "container_requests"));
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setContainerRequests(data);
            const companies = await getUniqueCompaniesArray();
            setCarriers(companies);
        };
        fetchData();
    }, []);

    async function getUniqueCompaniesArray() {
        const uniqueCompanies = new Set();
        try {
            const querySnapshot = await getDocs(collection(db, 'carrier_container_prices'));
            querySnapshot.forEach((doc) => {
                uniqueCompanies.add(doc.id);
            });
            return Array.from(uniqueCompanies);
        } catch (error) {
            console.error('Error getting documents:', error);
            return [];
        }
    }

    async function fetchBookingData(bookingId) {
        setIsLoading(true);
        try {
            const bookingRef = doc(db, 'bookings', bookingId);
            const bookingDoc = await getDoc(bookingRef);
            if (bookingDoc.exists()) {
                const bookingData = bookingDoc.data();
                setBookingData(bookingData);
                setIsBookingValid(true);

                const cargoMap = bookingData.cargo || {};
                const cargoArray = Object.entries(cargoMap).map(([id, cargoData]) => ({
                    id,
                    ...cargoData,
                    isSelected: false,
                    isConsolidated: false
                }));

                setCargos(cargoArray);
                return true;
            } else {
                setOpenSnackbar({ open: true, message: "Booking not found!", severity: "error" });
                setCargos([]);
                setBookingData(null);
                setIsBookingValid(false);
                return false;
            }
        } catch (error) {
            console.error("Error fetching booking:", error);
            setOpenSnackbar({ open: true, message: "Error fetching booking data", severity: "error" });
            setIsBookingValid(false);
            return false;
        } finally {
            setIsLoading(false);
        }
    }

    async function getSizesWithPrices(carrierName) {
        try {
            const docRef = doc(db, 'carrier_container_prices', carrierName);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setContainers(data.containers || []);
            } else {
                setContainers([]);
            }
        } catch (error) {
            console.error('Error getting document:', error);
            setContainers([]);
        }
    }

    const handleNext = async () => {
        if (activeStep === 0) {
            const isValid = await fetchBookingData(formData.bookingId);
            if (!isValid) return;
        }
        setActiveStep((prevStep) => prevStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'carrierName') {
            getSizesWithPrices(value);
        }
    };

    const handleCargoSelectionChange = (cargoId, field) => {
        setCargos(prevCargos => prevCargos.map(cargo => {
            if (cargo.id === cargoId) {
                if (field === 'isConsolidated') {
                    return { ...cargo, isConsolidated: !cargo.isConsolidated, isSelected: false };
                } else {
                    return { ...cargo, isSelected: !cargo.isSelected, isConsolidated: false };
                }
            }
            return cargo;
        }));
    };

    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Box sx={{ p: 2 }}>
                        <TextField
                            fullWidth
                            label="Booking ID"
                            name="bookingId"
                            value={formData.bookingId}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                        />
                    </Box>
                );
            case 1:
                return (
                    <Box sx={{ p: 2 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Carrier Name</InputLabel>
                                    <Select
                                        name="carrierName"
                                        value={formData.carrierName}
                                        onChange={handleChange}
                                        required
                                    >
                                        {carriers.map((carrier) => (
                                            <MenuItem key={carrier} value={carrier}>
                                                {carrier}
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
                                    value={formData.voyageNumber}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>


                        </Grid>
                    </Box>
                );
            case 2:
                return (
                    <Box sx={{ p: 2 }}>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Quantity</TableCell>
                                        <TableCell>Weight/Unit(kg)</TableCell>
                                        <TableCell>Full Container</TableCell>
                                        <TableCell>Consolidate</TableCell>
                                        <TableCell>Request Details</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {cargos.map((cargo) => (
                                        <TableRow key={cargo.id}>
                                            <TableCell>{cargo.name}</TableCell>
                                            <TableCell>{cargo.quantity}</TableCell>
                                            <TableCell>{cargo.weightPerUnit}</TableCell>
                                            <TableCell>
                                                <Checkbox
                                                    checked={cargo.isSelected}
                                                    onChange={() => handleCargoSelectionChange(cargo.id, 'isSelected')}
                                                    disabled={cargo.isConsolidated}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Checkbox
                                                    checked={cargo.isConsolidated}
                                                    onChange={() => handleCargoSelectionChange(cargo.id, 'isConsolidated')}
                                                    disabled={cargo.isSelected}
                                                />
                                            </TableCell>
                                            {cargo.isSelected && (
                                                <TableCell>
                                                    <FormControl fullWidth>
                                                        <InputLabel>Container Size</InputLabel>
                                                        <Select
                                                            name="containerSize"
                                                            value={formData.containerSize}
                                                            onChange={handleChange}
                                                            required
                                                        >
                                                            {containers.map((container) => (
                                                                <MenuItem key={`${container.size}-${container.price}`} value={`${container.size}FT ($${container.price})`}>
                                                                    {container.size}FT (${container.price})
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                </TableCell>
                                            )}
                                            {cargo.isConsolidated && (
                                                <TableCell>
                                                    <TextField
                                                        fullWidth
                                                        name="consolidationSpace"
                                                        value={formData.consolidationSpace}
                                                        onChange={handleChange}
                                                        required
                                                        label="Consolidation Space"
                                                    />
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                );
            default:
                return 'Unknown step';
        }
    };

    const handleSubmit = async () => {
        try {
            const selectedCargos = cargos.filter(cargo => cargo.isSelected || cargo.isConsolidated);

            if (selectedCargos.length === 0) {
                setOpenSnackbar({
                    open: true,
                    message: "Please select at least one cargo",
                    severity: "error"
                });
                return;
            }

            const dataToSubmit = {
                ...formData,
                selectedCargos: selectedCargos.map(cargo => ({
                    id: cargo.id,
                    name: cargo.name,
                    cargoType: cargo.cargoType,
                    quantity: cargo.quantity,
                    weightPerUnit: cargo.weightPerUnit,
                    consolidationType: cargo.isConsolidated ? 'consolidated' : 'full-container'
                }))
            };

            await addDoc(collection(db, "container_requests"), dataToSubmit);
            setContainerRequests(prev => [...prev, dataToSubmit]);
            handleCloseDialog();
            setOpenSnackbar({
                open: true,
                message: "Container request submitted successfully!",
                severity: "success"
            });
        } catch (error) {
            console.error("Error adding document: ", error);
            setOpenSnackbar({
                open: true,
                message: "Error submitting request",
                severity: "error"
            });
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setFormData(initialFormData);
        setCargos([]);
        setBookingData(null);
        setContainers([]);
        setActiveStep(0);
        setIsBookingValid(false);
    };

    const handleOpenDialog = () => {
        setOpenDialog(true);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" gutterBottom>
                    Container Requests
                </Typography>
                <Button variant="contained" onClick={handleOpenDialog}>
                    New Container Request
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Booking ID</TableCell>
                            <TableCell>Carrier Name</TableCell>
                            <TableCell>Voyage Number</TableCell>
                            <TableCell>Container Size</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {containerRequests.map((request) => (
                            <TableRow key={request.id}>
                                <TableCell>{request.bookingId}</TableCell>
                                <TableCell>{request.carrierName}</TableCell>
                                <TableCell>{request.voyageNumber}</TableCell>
                                <TableCell>{request.containerSize}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
                <DialogTitle>New Container Request</DialogTitle>
                <DialogContent>
                    <Stepper activeStep={activeStep} sx={{ my: 3 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                    {getStepContent(activeStep)}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        onClick={handleBack}
                        disabled={activeStep === 0}
                    >
                        Back
                    </Button>
                    {activeStep === steps.length - 1 ? (
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            disabled={!isBookingValid}
                        >
                            Submit Request
                        </Button>
                    ) : (
                        <Button
                            onClick={handleNext}
                            variant="contained"
                            disabled={
                                (activeStep === 0 && !formData.bookingId) ||
                                (activeStep === 1 && (!formData.carrierName || !formData.voyageNumber))
                            }
                        >
                            Next
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            <Snackbar
                open={openSnackbar.open}
                autoHideDuration={6000}
                onClose={() => setOpenSnackbar({ ...openSnackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity={openSnackbar.severity}>
                    {openSnackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ContainerRequest;