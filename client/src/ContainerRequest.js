import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Container,
    Typography,
    TextField,
    FormControlLabel,
    Checkbox,
    Grid,
    Select,
    MenuItem,
    InputLabel,
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
    IconButton,
    Snackbar,
} from "@mui/material";
import MuiAlert from '@mui/material/Alert';
import PrintIcon from '@mui/icons-material/Print';
import {
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    collection,
    query,
    where,
    Timestamp
} from "firebase/firestore";
import { LocalizationProvider, DateTimePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { db } from "./firebaseConfig";

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const ContainerRequest = () => {
    const [containerRequests, setContainerRequests] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [carriers, setCarriers] = useState([]);
    const [sizes, setSizes] = useState([]);
    const initialFormData = {
        carrierName: "",
        voyageNumber: "",
        eta: null,
        etd: null,
        destinationPort: "",
        containerSize: "",
        containerCount: 0,
        consolidationService: false,
        consolidationSpace: "",
        companyName: "",
        contactPerson: "",
        contactEmail: "",
        contactPhone: "",
        agreeToTerms: false,
    };

    const [formData, setFormData] = useState(initialFormData);



    useEffect(() => {
        const fetchData = async () => {
            const querySnapshot = await getDocs(collection(db, "container_requests"));
            const data = querySnapshot.docs.map(doc => {
                const docData = doc.data();
                return {
                    id: doc.id,
                    ...docData,
                    eta: docData.eta ? docData.eta.toDate() : null,
                    etd: docData.etd ? docData.etd.toDate() : null,
                };
            });
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
                const data = doc.data();
                if (data.company) {
                    uniqueCompanies.add(data.company);
                }
            });

            // Convert the Set to an array
            return Array.from(uniqueCompanies);
        } catch (error) {
            console.error('Error getting documents:', error);
            return [];
        }
    }

    async function getSizes(carrierName) {
        const uniqueSizes = new Set();

        try {
            const querySnapshot = await getDocs(collection(db, 'carrier_container_prices'));
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.company == carrierName) {
                    uniqueSizes.add(data.size);
                }
            });

            // Convert the Set to an array
            setSizes(Array.from(uniqueSizes));
        } catch (error) {
            console.error('Error getting documents:', error);
            return [];
        }
    }

    const handleOpenDialog = () => {
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setFormData(initialFormData);
        setSizes([]);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCarrierNameChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        getSizes(value);
    };

    const handleDateChange = (name, newDate) => {
        setFormData(prev => ({ ...prev, [name]: newDate }));
    };

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: checked,
            ...(name === 'consolidationService' && {
                containerSize: "",
                containerCount: 0,
                consolidationSpace: ""
            })
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.agreeToTerms) {
            alert("You must agree to the terms of service before submitting.");
            return;
        }

        try {
            const dataToSubmit = {
                ...formData,
                eta: formData.eta ? Timestamp.fromDate(formData.eta) : null,
                etd: formData.etd ? Timestamp.fromDate(formData.etd) : null,
            };

            const docRef = await addDoc(collection(db, "container_requests"), dataToSubmit);
            setContainerRequests(prev => [...prev, { id: docRef.id, ...formData }]);
            handleCloseDialog();
            setOpenSnackbar(true);
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpenSnackbar(false);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
            >
                <Typography variant="h4" gutterBottom>
                    Container Requests
                </Typography>
                <Box mt={3}>
                    <Button variant="contained" color="primary" onClick={handleOpenDialog}>
                        New Container Request
                    </Button>
                </Box>
            </Box>


            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Company Name</TableCell>
                            <TableCell>Carrier Name</TableCell>
                            <TableCell>Voyage Number</TableCell>
                            <TableCell>ETA</TableCell>
                            <TableCell>Destination Port</TableCell>
                            <TableCell>Service Type</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {containerRequests.map((request) => (
                            <TableRow key={request.id}>
                                <TableCell>{request.companyName}</TableCell>
                                <TableCell>{request.carrierName}</TableCell>
                                <TableCell>{request.voyageNumber}</TableCell>
                                <TableCell>
                                    {request.eta ? request.eta.toLocaleString() : 'N/A'}
                                </TableCell>
                                <TableCell>{request.destinationPort}</TableCell>

                                <TableCell>{request.destinationPort}</TableCell>

                                <TableCell>{request.destinationPort}</TableCell>
                                <TableCell>
                                    {request.consolidationService ? 'Consolidation' : 'Full Container'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>New Container Request</DialogTitle>
                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Carrier Name"
                                    name="carrierName"
                                    value={formData.carrierName}
                                    onChange={handleCarrierNameChange}
                                    required
                                >
                                    {carriers.length > 0 ? (
                                        carriers.map((company) => (
                                            <MenuItem key={company} value={company}>
                                                {company}
                                            </MenuItem>
                                        ))
                                    ) : (
                                        <MenuItem value="" disabled>
                                            No carriers available
                                        </MenuItem>
                                    )}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Voyage Number"
                                    name="voyageNumber"
                                    value={formData.imoNumber}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    <DateTimePicker
                                        label="ETA"
                                        value={formData.eta}
                                        onChange={(date) => handleDateChange("eta", date)}
                                        renderInput={(params) => <TextField {...params} fullWidth required />}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    <DateTimePicker
                                        label="ETD"
                                        value={formData.etd}
                                        onChange={(date) => handleDateChange("etd", date)}
                                        renderInput={(params) => <TextField {...params} fullWidth required />}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Destination Port"
                                    name="destinationPort"
                                    value={formData.destinationPort}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={formData.consolidationService}
                                            onChange={handleCheckboxChange}
                                            name="consolidationService"
                                        />
                                    }
                                    label="Consolidation Service"
                                />
                            </Grid>

                            {formData.consolidationService ? (
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Required Space (cubic meters)"
                                        name="consolidationSpace"
                                        type="number"
                                        value={formData.consolidationSpace}
                                        onChange={handleChange}
                                        required
                                    />
                                </Grid>
                            ) : (
                                <>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Container Size</InputLabel>
                                            <Select
                                                name="containerSize"
                                                value={formData.containerSize}
                                                onChange={handleChange}
                                                required
                                            >
                                                {sizes.length > 0 ? (
                                                    sizes.map((size) => (
                                                        <MenuItem key={size} value={size}>
                                                            {size}
                                                        </MenuItem>
                                                    ))
                                                ) : (
                                                    <MenuItem value="" disabled>
                                                        No sizes available
                                                    </MenuItem>
                                                )}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Number of Containers"
                                            name="containerCount"
                                            type="number"
                                            value={formData.containerCount}
                                            onChange={handleChange}
                                            required
                                        />
                                    </Grid>
                                </>
                            )}

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Company Name"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Contact Person"
                                    name="contactPerson"
                                    value={formData.contactPerson}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Contact Email"
                                    name="contactEmail"
                                    type="email"
                                    value={formData.contactEmail}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Contact Phone"
                                    name="contactPhone"
                                    value={formData.contactPhone}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={formData.agreeToTerms}
                                            onChange={handleCheckboxChange}
                                            name="agreeToTerms"
                                            required
                                        />
                                    }
                                    label="I agree to the terms and conditions"
                                />
                            </Grid>
                        </Grid>
                    </form>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} color="primary" variant="contained">
                        Submit
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
                    Container request submitted successfully!
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ContainerRequest;