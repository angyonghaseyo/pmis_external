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
    CircularProgress,
    FormControl,
    InputLabel,
    OutlinedInput,
    InputAdornment
} from '@mui/material';
import {
    Add,
    GridView,
    ViewList,
    CloudUpload,
    Delete
} from '@mui/icons-material';
import { useAuth } from './AuthContext';
import { getContainerTypesForCompany, addContainerType } from './services/api';

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
    const [newConsolidationPrice, setNewConsolidationPrice] = useState('');

    useEffect(() => {
        const initializeData = async () => {
            if (!user?.company) {
                setSnackbar({
                    open: true,
                    message: "Company information not available",
                    severity: 'error'
                });
                return;
            }

            setLoading(true);
            try {
                setCompany(user.company);
                const containerTypes = await getContainerTypesForCompany(user.company);
                setContainers(containerTypes);
            } catch (error) {
                console.error("Error loading container types:", error);
                setSnackbar({
                    open: true,
                    message: "Error loading container types",
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

    const handleAddContainer = async () => {
        if (!newName || !newSize || !newPrice || !newConsolidationPrice) {
            setSnackbar({
                open: true,
                message: "Please fill in all required fields",
                severity: 'warning'
            });
            return;
        }

        try {
            setUploading(true);

            const containerData = {
                company,
                size: newSize,
                price: newPrice,
                name: newName,
                consolidationPrice: newConsolidationPrice,
                imageFile: imageFile,
            };

            await addContainerType(company, containerData);

            setSnackbar({
                open: true,
                message: 'Container type added successfully.',
                severity: 'success'
            });

            // Reset form
            setNewSize('');
            setNewPrice('');
            setNewName('');
            setImageFile(null);
            setImagePreview(null);
            setNewConsolidationPrice('');

            // Refresh container list
            const updatedContainers = await getContainerTypesForCompany(company);
            setContainers(updatedContainers);
        } catch (error) {
            console.error("Error adding container:", error);
            setSnackbar({
                open: true,
                message: error.message || "Error adding container. Please try again.",
                severity: 'error'
            });
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

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
                            required
                        />
                        <TextField
                            label="Container Size (ft)"
                            type="number"
                            value={newSize}
                            onChange={(e) => setNewSize(e.target.value)}
                            size="small"
                            required
                        />
                        <TextField
                            label="Price (USD)"
                            type="number"
                            value={newPrice}
                            onChange={(e) => setNewPrice(e.target.value)}
                            size="small"
                            required
                        />
                        <FormControl size="small" required>
                            <InputLabel>Consolidation Price per ft³</InputLabel>
                            <OutlinedInput
                                type="number"
                                value={newConsolidationPrice}
                                onChange={(e) => setNewConsolidationPrice(e.target.value)}
                                startAdornment={<InputAdornment position="start">$</InputAdornment>}
                                label="Consolidation Price per ft³"
                            />
                        </FormControl>
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
                            disabled={!newSize || !newPrice || !newName || uploading || !newConsolidationPrice}
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
                                        <Typography variant="subtitle1" color="text.secondary">
                                            Consolidation: ${container.consolidationPrice}/ft³
                                        </Typography>
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
                                    <TableCell>Consolidation Price (USD/ft³)</TableCell>
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
                                        <TableCell>${container.consolidationPrice}/ft³</TableCell>
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