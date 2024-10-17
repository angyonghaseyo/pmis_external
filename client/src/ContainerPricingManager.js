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
} from '@mui/material';
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
    onSnapshot
} from "firebase/firestore";
import { Add, GridView, ViewList, Delete } from '@mui/icons-material';
import { db, auth } from "./firebaseConfig";

const ContainerPricingManager = (user) => {
    const [containerImageURL, setContainerImageURL] = useState([
        { id: 1, imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pmis-47493.appspot.com/o/container_images%2F20ft.webp?alt=media' },
        { id: 2, imageUrl: 'https://firebasestorage.googleapis.com/v0/b/pmis-47493.appspot.com/o/container_images%2F5-Portable-Space-40FT.STD-final.webp?alt=media' },
    ]);
    const [containers, setContainers] = useState([]);
    const [newSize, setNewSize] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [company, setCompany] = useState('');
    const [view, setView] = useState('grid');

    // Simulated Firebase functions
    const addContainer = async () => {
        try {
            const newContainer = {
                size: newSize,
                price: parseFloat(newPrice),
                company: company
            };

            const docRef = await addDoc(collection(db, "carrier_container_prices"), newContainer);
            console.log("Container added with ID: ", docRef.id);

            // Clear input fields
            setNewSize('');
            setNewPrice('');
        } catch (error) {
            console.error("Error adding container: ", error);
        }
    };

    const getCompany = async () => {
        try {
            const userDocRef = doc(db, "users", auth.currentUser.uid); // Use `doc()` to reference a single document
            const userDoc = await getDoc(userDocRef); // Get the document

            if (userDoc.exists()) {
                const userData = userDoc.data(); // Access document data
                setCompany(userData.company); // Set the company state
                console.log(userData.company); // Log the company
                return userData.company; // Return the company
            } else {
                console.log("No such document!");
                return null;
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            return null;
        }
    };

    const deleteContainer = async (containerId) => {
        try {
            if (typeof containerId !== 'string') {
                console.error("Invalid containerId:", containerId);
                return;
            }

            await deleteDoc(doc(db, "carrier_container_prices", containerId));
            console.log("Container deleted with ID: ", containerId);
        } catch (error) {
            console.error("Error deleting container: ", error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userCompany = await getCompany();
                if (userCompany) {
                    const q = query(collection(db, "carrier_container_prices"), where("company", "==", userCompany));
                    const unsubscribe = onSnapshot(q, (querySnapshot) => {
                        const containerData = querySnapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));
                        setContainers(containerData);
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



    const handleViewChange = (event, newView) => {
        if (newView !== null) {
            setView(newView);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
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
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={addContainer}
                        disabled={!newSize || !newPrice}
                    >
                        Add Container
                    </Button>
                </Box>

                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Container Listings</Typography>
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
                        {containers.map((container) => (
                            <Grid item xs={12} sm={6} md={4} key={container.id}>
                                <Card>
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={parseInt(container.size) < 30 ? containerImageURL[0].imageUrl : containerImageURL[1].imageUrl}
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
                                            <Button
                                                color="error"
                                                startIcon={<Delete />}
                                                onClick={() => deleteContainer(container.id)}
                                            >
                                                Delete
                                            </Button>
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
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {containers.map((container) => (
                                    <TableRow key={container.id}>
                                        <TableCell>{container.size}ft</TableCell>
                                        <TableCell>${container.price.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Button
                                                color="error"
                                                startIcon={<Delete />}
                                                onClick={() => deleteContainer(container.id)}
                                            >
                                                Delete
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
        </Container>
    );
};

export default ContainerPricingManager;