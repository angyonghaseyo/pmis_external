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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Box,
    ToggleButton,
    ToggleButtonGroup,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert
} from '@mui/material';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    arrayRemove,
    onSnapshot,
    query,
    getDocs,
    collection
} from "firebase/firestore";
import { Add, GridView, ViewList, Delete } from '@mui/icons-material';
import { db, auth } from "./firebaseConfig";

const ContainerPricingManager = () => {
    const [containerImageURL, setContainerImageURL] = useState([
        { id: 1, imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pmis-47493.appspot.com/o/container_images%2F20ft.webp?alt=media' },
        { id: 2, imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pmis-47493.appspot.com/o/container_images%2F5-Portable-Space-40FT.STD-final.webp?alt=media' },
    ]);
    const [containers, setContainers] = useState([]);
    const [newSize, setNewSize] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [company, setCompany] = useState('');
    const [view, setView] = useState('grid');
    const [numberOfContainers, setNumberOfContainers] = useState(1);
    const [equipmentIds, setEquipmentIds] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [currentEquipmentId, setCurrentEquipmentId] = useState('');
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info'
    });

    const getCompany = async () => {
        try {
            const userDocRef = doc(db, "users", auth.currentUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                setCompany(userData.company);
                console.log(userData.company);
                return userData.company;
            } else {
                console.log("No such document!");
                return null;
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            return null;
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

        try {
            const companyDocRef = doc(db, "carrier_container_prices", company);
            const companyDoc = await getDoc(companyDocRef);

            let existingContainers = companyDoc.exists() ? companyDoc.data().containers : [];

            // Check if the size already exists
            const sizeExists = existingContainers.some(container => container.size === parseInt(newSize));
            if (sizeExists) {
                setSnackbar({
                    open: true,
                    message: `Container size ${newSize}ft already exists. Please choose a different size.`,
                    severity: 'error'
                });
                setNewSize('');
                setNewPrice('');
                setNumberOfContainers(1);
                setEquipmentIds([]);
                return;
            }

            // Check for unique Equipment IDs across all companies
            const allContainersQuery = query(collection(db, "carrier_container_prices"));
            const allContainersSnapshot = await getDocs(allContainersQuery);
            const allContainers = allContainersSnapshot.docs.flatMap(doc => doc.data().containers || []);

            for (let equipmentId of equipmentIds) {
                if (allContainers.some(container => container.equipmentId === equipmentId)) {
                    setSnackbar({
                        open: true,
                        message: `Equipment ID ${equipmentId} already exists. Please use unique IDs.`,
                        severity: 'error'
                    });
                    setNewSize('');
                    setNewPrice('');
                    setNumberOfContainers(1);
                    setEquipmentIds([]);
                    return;
                }
            }

            let updatedContainers = [...existingContainers];

            for (let i = 0; i < numberOfContainers; i++) {
                const newContainer = {
                    size: parseInt(newSize),
                    price: parseFloat(newPrice),
                    equipmentId: equipmentIds[i]
                };
                updatedContainers.push(newContainer);
            }

            await setDoc(companyDocRef, { containers: updatedContainers }, { merge: true });

            setSnackbar({
                open: true,
                message: `${numberOfContainers} containers added successfully.`,
                severity: 'success'
            });

            // Clear input fields
            setNewSize('');
            setNewPrice('');
            setNumberOfContainers(1);
            setEquipmentIds([]);
        } catch (error) {
            console.error("Error adding containers: ", error);
            setSnackbar({
                open: true,
                message: "Error adding containers. Please try again.",
                severity: 'error'
            });
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userCompany = await getCompany();
                if (userCompany) {
                    const companyDocRef = doc(db, "carrier_container_prices", userCompany);
                    const unsubscribe = onSnapshot(companyDocRef, (docSnapshot) => {
                        if (docSnapshot.exists()) {
                            setContainers(docSnapshot.data().containers || []);
                        } else {
                            setContainers([]);
                        }
                    });

                    // Cleanup function to unsubscribe from the listener when the component unmounts
                    return () => unsubscribe();
                }
            } catch (error) {
                console.error("Error setting up real-time listener:", error);
            }
        };

        fetchData();
    }, []);

    const handleOpenDialog = () => {
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar({ ...snackbar, open: false });
    };

    const handleAddEquipmentId = () => {
        if (currentEquipmentId.trim() !== '') {
            setEquipmentIds([...equipmentIds, currentEquipmentId.trim()]);
            setCurrentEquipmentId('');
            if (equipmentIds.length + 1 === numberOfContainers) {
                handleCloseDialog();
            }
        }
    };

    const handleViewChange = (event, newView) => {
        if (newView !== null) {
            setView(newView);
        }
    };

    // Function to get unique container sizes and prices
    const getUniqueContainers = () => {
        const uniqueContainers = [];
        const seen = new Set();

        containers.forEach(container => {
            const key = `${container.size}-${container.price}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueContainers.push(container);
            }
        });

        return uniqueContainers;
    };

    const uniqueContainers = getUniqueContainers();

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
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
                <Typography variant="h4" gutterBottom>
                    Container Pricing Management
                </Typography>

                <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                    <TextField
                        label="Container Size (ft)"
                        type="number"
                        value={newSize}
                        onChange={(e) => setNewSize(e.target.value)}
                        size="small"
                    />
                    <TextField
                        label="Price (USD)"
                        type="number"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        size="small"
                    />
                    <TextField
                        label="Number of Containers"
                        type="number"
                        value={numberOfContainers}
                        onChange={(e) => setNumberOfContainers(parseInt(e.target.value) || 1)}
                        size="small"
                    />
                    <Button
                        variant="contained"
                        onClick={handleOpenDialog}
                        disabled={!newSize || !newPrice || numberOfContainers < 1}
                    >
                        Enter Equipment IDs
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleAddContainers}
                        disabled={!newSize || !newPrice || numberOfContainers < 1 || equipmentIds.length !== numberOfContainers}
                    >
                        Add Containers
                    </Button>
                </Box>

                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Unique Container Sizes and Prices</Typography>
                    <ToggleButtonGroup
                        value={view}
                        exclusive
                        onChange={handleViewChange}
                        size="small"
                    >
                        <ToggleButton value="grid" aria-label="grid view">
                            <GridView />
                        </ToggleButton>
                        <ToggleButton value="table" aria-label="list view">
                            <ViewList />
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                {view === 'grid' ? (
                    <Grid container spacing={3}>
                        {uniqueContainers.map((container, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <Card>
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={container.size < 30 ? containerImageURL[0].imageUrl : containerImageURL[1].imageUrl}
                                        alt={`${container.size}ft Container`}
                                        sx={{
                                            objectFit: 'cover',
                                            bgcolor: '#f5f5f5',
                                            '&:hover': {
                                                transform: 'scale(1.02)',
                                                transition: 'transform 0.3s ease-in-out'
                                            }
                                        }}
                                    />
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            {container.size}ft Container
                                        </Typography>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography variant="h5" color="primary">
                                                ${container.price.toLocaleString()}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Container Size (ft)</TableCell>
                                    <TableCell>Price (USD)</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {uniqueContainers.map((container, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{container.size}ft</TableCell>
                                        <TableCell>${container.price.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                <Dialog
                    open={openDialog}
                    onClose={handleCloseDialog}
                    fullWidth      // Added to ensure dialog takes full width of maxWidth
                >
                    <DialogTitle>Enter Equipment IDs</DialogTitle>
                    <DialogContent sx={{ minWidth: '400px' }}> {/* Added minimum width */}
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Equipment ID"
                            fullWidth
                            value={currentEquipmentId}
                            onChange={(e) => setCurrentEquipmentId(e.target.value)}
                        />
                        <Typography variant="body2" sx={{ mt: 2 }}>
                            Equipment IDs entered: {equipmentIds.length} / {numberOfContainers}
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button onClick={handleAddEquipmentId}>Add</Button>
                    </DialogActions>
                </Dialog>
            </Paper>
        </Container>
    );
};

export default ContainerPricingManager;