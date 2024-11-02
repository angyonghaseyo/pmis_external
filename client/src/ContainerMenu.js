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
    IconButton,
    CircularProgress
} from '@mui/material';
import {
    Add,
    GridView,
    ViewList,
    CloudUpload,
    Delete,
    Close
} from '@mui/icons-material';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebaseConfig";
import { useAuth } from './AuthContext';

const ContainerMenu = () => {
    const { user } = useAuth();
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
    const [loading, setLoading] = useState(true);

    const fetchUserCompany = async () => {
        if (!user?.email) {
            setSnackbar({
                open: true,
                message: "User email not found",
                severity: 'error'
            });
            return;
        }

        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', user.email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setSnackbar({
                    open: true,
                    message: "User not found in database",
                    severity: 'error'
                });
                return;
            }

            const userData = querySnapshot.docs[0].data();
            console.log("HI", userData.company)
            if (userData.company) {
                setCompany(userData.company);
                return userData.company;
            } else {
                setSnackbar({
                    open: true,
                    message: "No company information found for user",
                    severity: 'error'
                });
                return null;
            }
        } catch (error) {
            console.error("Error fetching user company:", error);
            setSnackbar({
                open: true,
                message: "Error fetching company information",
                severity: 'error'
            });
            return null;
        }
    };

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setSnackbar({
                    open: true,
                    message: "Please upload an image file",
                    severity: 'error'
                });
                return;
            }

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
            if (!company) {
                setSnackbar({
                    open: true,
                    message: "Company information not available",
                    severity: 'error'
                });
                return;
            }

            const menuCollectionRef = collection(db, "container_menu");
            const companyDocRef = doc(menuCollectionRef, company);
            const companyDoc = await getDoc(companyDocRef);

            let existingContainers = companyDoc.exists() ? companyDoc.data().container_types : [];

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

            setNewSize('');
            setNewPrice('');
            setNewName('');
            setImageFile(null);
            setImagePreview(null);
            
            fetchContainers();
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

    const fetchContainers = async (company) => {
        try {
            if (!company) {
                console.log("No company information available");
                return;
            }

            const menuCollectionRef = collection(db, "container_menu");
            const companyDocRef = doc(menuCollectionRef, company);
            const companyDoc = await getDoc(companyDocRef);

            if (companyDoc.exists()) {
                setContainers(companyDoc.data().container_types || []);
            } else {
                setContainers([]);
            }
        } catch (error) {
            console.error("Error fetching containers:", error);
            setSnackbar({
                open: true,
                message: "Error fetching containers. Please try again.",
                severity: 'error'
            });
        }
    };

    useEffect(() => {
        const initializeData = async () => {
            setLoading(true);
            try {
                const userCompany = await fetchUserCompany();
                console.log("HIIIII,", userCompany)
                if (userCompany) {
                    await fetchContainers(userCompany);
                }
            } catch (error) {
                console.error("Error initializing data:", error);
                setSnackbar({
                    open: true,
                    message: "Error loading data",
                    severity: 'error'
                });
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            initializeData();
        }
    }, [user]);

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar({ ...snackbar, open: false });
    };

    const handleViewChange = (event, newView) => {
        if (newView !== null) {
            setView(newView);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress />
            </Box>
        );
    }

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
                                        alt={container.name}
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

export default ContainerMenu;