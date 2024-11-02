import React, { useState, useEffect } from 'react';
import {
    Container,
    Card,
    CardContent,
    CardMedia,
    Typography,
    TextField,
    Button,
    Grid,
    Paper,
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
    CardActionArea,
    Stepper,
    Step,
    StepLabel,
    IconButton,
    Divider,
    Chip,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    LinearProgress
} from '@mui/material';
import { Add, Close, ArrowBack, ArrowForward, List } from '@mui/icons-material';
import { doc, getDoc, collection, query, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { useAuth } from './AuthContext';

const ContainerPricingManager = () => {
    const [menuContainers, setMenuContainers] = useState([]);
    const [selectedContainer, setSelectedContainer] = useState(null);
    const [company, setCompany] = useState('');
    const [numberOfContainers, setNumberOfContainers] = useState(1);
    const [equipmentIds, setEquipmentIds] = useState([]);
    const [currentEquipmentId, setCurrentEquipmentId] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info'
    });
    const [openList, setOpenList] = useState(false);
    const [containers, setContainers] = useState([]);
    const steps = ['Select Number of Containers', 'Enter Equipment IDs'];
    const { user } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!user?.company) {
                    setSnackbar({
                        open: true,
                        message: "Company information not available",
                        severity: 'error'
                    });
                    return;
                }
                setCompany(user.company);
                const menuDocRef = doc(db, "container_menu", user.company);
                const menuDoc = await getDoc(menuDocRef);
                if (menuDoc.exists()) {
                    setMenuContainers(menuDoc.data().container_types || []);
                }
            } catch (error) {
                console.error("Error setting up real-time listener:", error);
                setSnackbar({
                    open: true,
                    message: "Error loading container menu",
                    severity: 'error'
                });
            }
        };

        if (user) {
            fetchData();
        }
    }, [user]);

    useEffect(() => {
        if (openList && company) {
            const unsubscribe = fetchContainers();
            return () => unsubscribe;
        }
    }, [openList, company]);

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedContainer(null);
        setNumberOfContainers(1);
        setEquipmentIds([]);
        setCurrentEquipmentId('');
        setActiveStep(0);
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar({ ...snackbar, open: false });
    };

    const fetchContainers = async () => {
        try {
            const carrierDocRef = doc(db, "carrier_container_prices", company);
            const docSnapshot = await getDoc(carrierDocRef);
            if (docSnapshot.exists()) {
                setContainers(docSnapshot.data().containers || []);
            } else {
                setContainers([]);
            }
        } catch (error) {
            console.error("Error fetching containers:", error);
            setSnackbar({
                open: true,
                message: "Error loading containers",
                severity: 'error'
            });
        }
    };

    const handleAddContainers = async () => {
        if (equipmentIds.length !== numberOfContainers) {
            setSnackbar({
                open: true,
                message: "Please enter all Equipment IDs before adding containers.",
                severity: 'warning'
            });
            return;
        }

        for (let i = 0; i < equipmentIds.length; i++) {
            for (let j = i + 1; j < equipmentIds.length; j++) {
                if (equipmentIds[i] === equipmentIds[j]) {
                    setSnackbar({
                        open: true,
                        message: "Please enter unique equipment ids.",
                        severity: 'error'
                    });
                    return;
                }
            }
        }

        try {
            const allContainersQuery = query(collection(db, "carrier_container_prices"));
            const allContainersSnapshot = await getDocs(allContainersQuery);
            const allContainers = allContainersSnapshot.docs.flatMap(doc => doc.data().containers || []);

            for (let equipmentId of equipmentIds) {
                if (allContainers.some(container => container.EquipmentID === equipmentId)) {
                    setSnackbar({
                        open: true,
                        message: `Equipment ID ${equipmentId} already exists. Please use unique IDs.`,
                        severity: 'error'
                    });
                    return;
                }
            }

            const companyDocRef = doc(db, "carrier_container_prices", company);
            const companyDoc = await getDoc(companyDocRef);
            let existingContainers = companyDoc.exists() ? companyDoc.data().containers : [];
            let updatedContainers = [...existingContainers];

            for (let i = 0; i < numberOfContainers; i++) {
                const newContainer = {
                    size: selectedContainer.size,
                    price: selectedContainer.price,
                    name: selectedContainer.name,
                    EquipmentID: equipmentIds[i],
                    bookingStatus: "available",
                    spaceUsed: 0,
                    containerConsolidationsID: [],
                };
                updatedContainers.push(newContainer);
            }

            await companyDocRef.set({ containers: updatedContainers }, { merge: true });
            setSnackbar({
                open: true,
                message: `${numberOfContainers} containers added successfully.`,
                severity: 'success'
            });

            handleCloseDialog();
            await fetchContainers();
        } catch (error) {
            console.error("Error adding containers: ", error);
            setSnackbar({
                open: true,
                message: "Error adding containers. Please try again.",
                severity: 'error'
            });
        }
    };

    const handleAddEquipmentId = (e) => {
        e.preventDefault();
        if (currentEquipmentId.trim() !== '') {
            setEquipmentIds([...equipmentIds, currentEquipmentId.trim()]);
            setCurrentEquipmentId('');
        }
    };

    const handleRemoveEquipmentId = (indexToRemove) => {
        setEquipmentIds(equipmentIds.filter((_, index) => index !== indexToRemove));
    };

    const handleContainerSelect = (container) => {
        setSelectedContainer(container);
        setOpenDialog(true);
    };

    const handleNext = () => {
        setActiveStep(prevStep => prevStep + 1);
    };

    const handleBack = () => {
        setActiveStep(prevStep => prevStep - 1);
    };

    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Box sx={{ p: 2 }}>
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Selected Container:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <img
                                    src={selectedContainer?.imageUrl || '/api/placeholder/400/320'}
                                    alt={selectedContainer?.name}
                                    style={{
                                        width: 100,
                                        height: 100,
                                        objectFit: 'cover',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Box>
                                    <Typography variant="h6">{selectedContainer?.name}</Typography>
                                    <Typography>Size: {selectedContainer?.size}ft</Typography>
                                    <Typography>Price: ${selectedContainer?.price.toLocaleString()}</Typography>
                                </Box>
                            </Box>
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        <TextField
                            label="Number of Containers"
                            type="number"
                            fullWidth
                            value={numberOfContainers}
                            onChange={(e) => setNumberOfContainers(parseInt(e.target.value))}
                            sx={{ mt: 2 }}
                        />
                    </Box>
                );
            case 1:
                return (
                    <Box sx={{ p: 2 }}>
                        <form onSubmit={handleAddEquipmentId}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    label="Equipment ID"
                                    fullWidth
                                    value={currentEquipmentId}
                                    onChange={(e) => setCurrentEquipmentId(e.target.value)}
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleAddEquipmentId}
                                    disabled={!currentEquipmentId.trim()}
                                >
                                    Add
                                </Button>
                            </Box>
                        </form>
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Equipment IDs ({equipmentIds.length} / {numberOfContainers})
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {equipmentIds.map((id, index) => (
                                    <Chip
                                        key={index}
                                        label={id}
                                        onDelete={() => handleRemoveEquipmentId(index)}
                                        color="primary"
                                        variant="outlined"
                                    />
                                ))}
                            </Box>
                        </Box>
                    </Box>
                );
            default:
                return 'Unknown step';
        }
    };

    const handleOpenList = () => setOpenList(true);
    const handleCloseList = () => setOpenList(false);

    return (
        <>
            <Dialog
                open={openList}
                onClose={handleCloseList}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="h5">Container List</Typography>
                        <IconButton onClick={handleCloseList} size="small">
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <TableContainer component={Paper} sx={{ mt: 2 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Equipment ID</TableCell>
                                    <TableCell>Size</TableCell>
                                    <TableCell>Price</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Space Used</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {containers.map((container, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{container.EquipmentID}</TableCell>
                                        <TableCell>{container.size}ft</TableCell>
                                        <TableCell>${container.price.toLocaleString()}</TableCell>
                                        <TableCell>{container.bookingStatus}</TableCell>
                                        <TableCell>{container.spaceUsed}%</TableCell>
                                    </TableRow>
                                ))}
                                {containers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            No containers found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseList}>Close</Button>
                </DialogActions>
            </Dialog>

            <Container maxWidth="lg" sx={{ p: 3 }}>
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

                <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                    <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={3}
                    >
                        <Typography variant="h4" component="h1">
                            Container Marketplace
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<List />}
                            onClick={handleOpenList}
                        >
                            View Container List
                        </Button>
                    </Box>

                    <Typography variant="h6" sx={{ mb: 3 }}>
                        Select Container Type
                    </Typography>

                    <Grid container spacing={3}>
                        {menuContainers.map((container, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        transition: 'transform 0.2s ease-in-out',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                        }
                                    }}
                                >
                                    <CardActionArea
                                        onClick={() => handleContainerSelect(container)}
                                        sx={{ flexGrow: 1 }}
                                    >
                                        <CardMedia
                                            component="img"
                                            height="200"
                                            image={container.imageUrl || '/api/placeholder/400/320'}
                                            alt={container.name}
                                            sx={{
                                                objectFit: 'cover',
                                                bgcolor: '#f5f5f5'
                                            }}
                                        />
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                {container.name}
                                            </Typography>
                                            <Typography variant="subtitle1">
                                                Size: {container.size}ft
                                            </Typography>
                                            <Typography variant="h6" color="primary">
                                                ${container.price.toLocaleString()}
                                            </Typography>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>

                <Dialog
                    open={openDialog}
                    onClose={handleCloseDialog}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle sx={{ pb: 1 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Typography variant="h6">Add Containers</Typography>
                            <IconButton onClick={handleCloseDialog} size="small">
                                <Close />
                            </IconButton>
                        </Box>
                    </DialogTitle>
                    <DialogContent sx={{ pt: 2 }}>
                        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                            {steps.map((label) => (
                                <Step key={label}>
                                    <StepLabel>{label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                        {getStepContent(activeStep)}
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Box sx={{ flex: '1 1 auto' }} />
                        <Button
                            disabled={activeStep === 0}
                            onClick={handleBack}
                            startIcon={<ArrowBack />}
                        >
                            Back
                        </Button>
                        {activeStep === steps.length - 1 ? (
                            <Button
                                variant="contained"
                                onClick={handleAddContainers}
                                disabled={equipmentIds.length !== numberOfContainers}
                                startIcon={<Add />}
                            >
                                Create Containers
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                onClick={handleNext}
                                disabled={numberOfContainers < 1}
                                endIcon={<ArrowForward />}
                            >
                                Next
                            </Button>
                        )}
                    </DialogActions>
                </Dialog>
            </Container>
        </>
    );
};

export default ContainerPricingManager;