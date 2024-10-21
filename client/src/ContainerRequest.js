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
    Snackbar,
    IconButton
} from "@mui/material";
import MuiAlert from '@mui/material/Alert';
import {
    doc,
    addDoc,
    getDocs,
    collection,
    query,
    where,
    Timestamp,
    getDoc
} from "firebase/firestore";
import { LocalizationProvider, DateTimePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { db } from "./firebaseConfig";
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const ContainerRequest = () => {
    const [containerRequests, setContainerRequests] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [carriers, setCarriers] = useState([]);
    const initialFormData = {
        carrierName: "",
        voyageNumber: "",
        eta: null,
        etd: null,
        loadingPort: "",
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
        Weight: '',
        SizeTypeCode: '',
        operator: '',
    };

    const [goods, setGoods] = useState([{
        id: 1,
        name: '',
        description: '',
        quantity: '',
        weightPerUnit: '',
        cargoType: '',
    }]);

    const cargoTypes = [
        "General Cargo",
        "Hazardous Materials",
        "Perishable Goods",
        "Electronics",
        "Textiles",
        "Machinery",
        "Automotive Parts",
        "Chemical Products",
        "Food Products",
        "Raw Materials"
    ];


    const [formData, setFormData] = useState(initialFormData);
    const [containers, setContainers] = useState([]);



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
                // Use document ID as the carrier name
                uniqueCompanies.add(doc.id);
            });

            return Array.from(uniqueCompanies);
        } catch (error) {
            console.error('Error getting documents:', error);
            return [];
        }
    }

    async function getSizesWithPrices(carrierName) {
        try {
            const docRef = doc(db, 'carrier_container_prices', carrierName);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                const containerData = data.containers || [];

                const uniqueContainers = [];
                const seen = new Set();

                containerData.forEach(container => {
                    const key = `${container.size}-${container.price}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        uniqueContainers.push(container);
                    }
                });

                // Set the containers state with the fetched data
                setContainers(uniqueContainers);
                console.log(uniqueContainers, "WHYYYY");
            } else {
                console.log("No such document!");
                setContainers([]);
            }
        } catch (error) {
            console.error('Error getting document:', error);
            setContainers([]);
        }
    }
    const handleOpenDialog = () => {
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setFormData(initialFormData);
        setContainers([]);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCarrierNameChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value, containerSize: "" }));
        getSizesWithPrices(value);
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
            const totalWeight = calculateTotalWeight();
            const dataToSubmit = {
                ...formData,
                eta: formData.eta ? Timestamp.fromDate(formData.eta) : null,
                etd: formData.etd ? Timestamp.fromDate(formData.etd) : null,
                SizeTypeCode: formData.containerSize.split(' ')[0],
                goods: goods,
                Weight: totalWeight.toString()
            };

            const docRef = await addDoc(collection(db, "container_requests"), dataToSubmit);
            setContainerRequests(prev => [...prev, { id: docRef.id, ...formData, goods, totalWeight }]);
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

    const calculateTotalWeight = () => {
        return goods.reduce((total, item) => {
            const itemWeight = parseFloat(item.weightPerUnit) * parseFloat(item.quantity) || 0;
            return total + itemWeight;
        }, 0);
    };

    // Add new good
    const handleAddGood = () => {
        setGoods(prevGoods => [...prevGoods, {
            id: Date.now(), // Use timestamp instead of length+1 to ensure unique IDs
            name: '',
            description: '',
            quantity: '',
            weightPerUnit: '',
            cargoType: '',
        }]);
    };

    // Remove good
    const handleRemoveGood = (id) => {
        if (goods.length > 1) {
            setGoods(goods.filter(good => good.id !== id));
        }
    };

    // Update good
    const handleGoodChange = (id, field, value) => {
        setGoods(prevGoods => prevGoods.map(good => {
            if (good.id === id) {
                return { ...good, [field]: value };
            }
            return good;
        }));
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
                                    value={formData.voyageNumber}
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
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Port Of Loading"
                                    name="loadingPort"
                                    value={formData.loadingPort}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Port of Destination"
                                    name="destinationPort"
                                    value={formData.destinationPort}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Operator"
                                    name="operator"
                                    value={formData.operator}
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
                                                {containers.length > 0 ? (
                                                    containers.map((container) => (
                                                        <MenuItem key={`${container.size}-${container.price}`} value={`${container.size}FT ($${container.price})`}>
                                                            {container.size}FT (${container.price})
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

                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                    Goods Details
                                </Typography>
                            </Grid>

                            {goods.map((good, index) => (
                                <Grid item xs={12} key={good.id}>
                                    <Paper sx={{ p: 2, position: 'relative' }}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12}>
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="subtitle1">
                                                        Item {index + 1}
                                                    </Typography>
                                                    {goods.length > 1 && (
                                                        <IconButton
                                                            onClick={() => handleRemoveGood(good.id)}
                                                            size="small"
                                                            color="error"
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    )}
                                                </Box>
                                            </Grid>

                                            <Grid item xs={12} sm={12}>
                                                <TextField
                                                    fullWidth
                                                    label="Good Name"
                                                    value={good.name}
                                                    onChange={(e) => handleGoodChange(good.id, 'name', e.target.value)}
                                                    required
                                                />
                                            </Grid>

                                            <Grid item xs={12}>
                                                <TextField
                                                    fullWidth
                                                    label="Description"
                                                    multiline
                                                    rows={4}
                                                    value={good.description}
                                                    onChange={(e) => handleGoodChange(good.id, 'description', e.target.value)}
                                                    required
                                                />
                                            </Grid>

                                            <Grid item xs={12} sm={4}>
                                                <TextField
                                                    fullWidth
                                                    label="Quantity"
                                                    type="number"
                                                    value={good.quantity}
                                                    onChange={(e) => handleGoodChange(good.id, 'quantity', e.target.value)}
                                                    required
                                                />
                                            </Grid>

                                            <Grid item xs={12} sm={4}>
                                                <TextField
                                                    fullWidth
                                                    label="Weight per Unit (kg)"
                                                    type="number"
                                                    value={good.weightPerUnit}
                                                    onChange={(e) => handleGoodChange(good.id, 'weightPerUnit', e.target.value)}
                                                    required
                                                />
                                            </Grid>

                                            <Grid item xs={12} sm={4}>
                                                <FormControl fullWidth>
                                                    <InputLabel>Cargo Type</InputLabel>
                                                    <Select
                                                        value={good.cargoType}
                                                        onChange={(e) => handleGoodChange(good.id, 'cargoType', e.target.value)}
                                                        label="Cargo Type"
                                                        required
                                                    >
                                                        {cargoTypes.map((type) => (
                                                            <MenuItem key={type} value={type}>
                                                                {type}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                </Grid>
                            ))}

                            <Grid item xs={12}>
                                <Button
                                    startIcon={<AddCircleOutlineIcon />}
                                    onClick={handleAddGood}
                                    variant="outlined"
                                    fullWidth
                                >
                                    Add Another Item
                                </Button>
                            </Grid>

                            <Grid item xs={12}>
                                <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                                    <Typography variant="h6">
                                        Total Weight: {calculateTotalWeight().toFixed(2)} kg
                                    </Typography>
                                </Paper>
                            </Grid>

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

            <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
                    Container request submitted successfully!
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ContainerRequest;