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
    Snackbar,
    Alert,
    MenuItem,
    IconButton,
    CircularProgress
} from '@mui/material';
import {
    doc,
    setDoc,
    getDoc,
    onSnapshot
} from "firebase/firestore";
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "firebase/storage";
import { Add, GridView, ViewList, CloudUpload, Delete } from '@mui/icons-material';
import { db, auth, storage } from "./firebaseConfig";

const ContainerMenuManager = () => {
    const [containers, setContainers] = useState([]);
    const [newSize, setNewSize] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [newName, setNewName] = useState('');
    const [company, setCompany] = useState('');
    const [view, setView] = useState('grid');
    const [uploading, setUploading] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
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
                return userData.company;
            }
            return null;
        } catch (error) {
            console.error("Error fetching user data:", error);
            return null;
        }
    };

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setSnackbar({
                    open: true,
                    message: "Please upload an image file",
                    severity: 'error'
                });
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setSnackbar({
                    open: true,
                    message: "Image size should be less than 5MB",
                    severity: 'error'
                });
                return;
            }

            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadImage = async () => {
        if (!imageFile) return null;

        const fileExtension = imageFile.name.split('.').pop();
        const fileName = `${company}_${Date.now()}.${fileExtension}`;
        const storageRef = ref(storage, `container_images/${fileName}`);

        try {
            setUploading(true);
            const snapshot = await uploadBytes(storageRef, imageFile);
            const downloadURL = await getDownloadURL(snapshot.ref);
            return downloadURL;
        } catch (error) {
            console.error("Error uploading image:", error);
            throw error;
        } finally {
            setUploading(false);
        }
    };

    const handleAddContainer = async () => {
        try {
            const companyDocRef = doc(db, "container_menu", company);
            const companyDoc = await getDoc(companyDocRef);

            let existingContainers = companyDoc.exists() ? companyDoc.data().container_types : [];

            // Check for duplicate size and price combination
            const isDuplicate = existingContainers.some(
                container => container.size === parseInt(newSize) &&
                    container.price === parseFloat(newPrice)
            );

            if (isDuplicate) {
                setSnackbar({
                    open: true,
                    message: "A container with this size and price combination already exists.",
                    severity: 'error'
                });
                return;
            }

            let imageUrl = null;
            if (imageFile) {
                imageUrl = await uploadImage();
            }

            const newContainer = {
                size: parseInt(newSize),
                price: parseFloat(newPrice),
                name: newName,
                imageUrl: imageUrl
            };

            await setDoc(companyDocRef, {
                container_types: [...existingContainers, newContainer]
            }, { merge: true });

            setSnackbar({
                open: true,
                message: 'Container type added successfully.',
                severity: 'success'
            });

            // Clear input fields
            setNewSize('');
            setNewPrice('');
            setNewName('');
            setImageFile(null);
            setImagePreview(null);
        } catch (error) {
            console.error("Error adding container:", error);
            setSnackbar({
                open: true,
                message: "Error adding container. Please try again.",
                severity: 'error'
            });
        }
    };

    const handleDeleteImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userCompany = await getCompany();
                if (userCompany) {
                    const companyDocRef = doc(db, "container_menu", userCompany);
                    const unsubscribe = onSnapshot(companyDocRef, (docSnapshot) => {
                        if (docSnapshot.exists()) {
                            setContainers(docSnapshot.data().container_types || []);
                        } else {
                            setContainers([]);
                        }
                    });
                    return () => unsubscribe();
                }
            } catch (error) {
                console.error("Error setting up real-time listener:", error);
            }
        };

        fetchData();
    }, []);

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar({ ...snackbar, open: false });
    };

    const handleViewChange = (event, newView) => {
        if (newView !== null) {
            setView(newView);
        }
    };

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
                    Container Menu Management
                </Typography>

                <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                        <TextField
                            label="Container Name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            size="small"
                        />
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

                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Button
                            component="label"
                            variant="outlined"
                            startIcon={<CloudUpload />}
                            sx={{ mt: 1 }}
                        >
                            Upload Image
                            <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </Button>
                        {imagePreview && (
                            <Box sx={{ position: 'relative', width: 100, height: 100 }}>
                                <img
                                    src={imagePreview}
                                    alt="Container preview"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        borderRadius: '4px'
                                    }}
                                />
                                <IconButton
                                    sx={{
                                        position: 'absolute',
                                        top: -8,
                                        right: -8,
                                        bgcolor: 'background.paper'
                                    }}
                                    size="small"
                                    onClick={handleDeleteImage}
                                >
                                    <Delete />
                                </IconButton>
                            </Box>
                        )}
                        <Button
                            variant="contained"
                            startIcon={uploading ? <CircularProgress size={20} /> : <Add />}
                            onClick={handleAddContainer}
                            disabled={!newSize || !newPrice || !newName || uploading}
                        >
                            Add Container Type
                        </Button>
                    </Box>
                </Box>

                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Available Container Types</Typography>
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
                        {containers.map((container, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <Card>
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={container.imageUrl || '/api/placeholder/400/320'}
                                        alt={`${container.name}`}
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
                                            Name: {container.name}
                                        </Typography>
                                        <Typography variant="h6" gutterBottom>
                                            Size: {container.size}ft
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
                                    <TableCell>Image</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Size (ft)</TableCell>
                                    <TableCell>Price (USD)</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {containers.map((container, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <img
                                                src={container.imageUrl || '/api/placeholder/400/320'}
                                                alt={container.name}
                                                style={{
                                                    width: 50,
                                                    height: 50,
                                                    objectFit: 'cover',
                                                    borderRadius: '4px'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>{container.name}</TableCell>
                                        <TableCell>{container.size}ft</TableCell>
                                        <TableCell>${container.price.toLocaleString()}</TableCell>
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

export default ContainerMenuManager;