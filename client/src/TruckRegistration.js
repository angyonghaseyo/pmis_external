import React, { useState } from 'react';
import { collection, getDocs, getFirestore, setDoc, doc } from 'firebase/firestore';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    CircularProgress,
    Grid,
    Card,
    CardContent,
    Divider,
    IconButton,
    Snackbar
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';

const TruckRegistration = () => {
    const [cargoId, setCargoId] = useState('');
    const [truckLicense, setTruckLicense] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const db = getFirestore();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            // Get all booking documents
            const bookingsRef = collection(db, "bookings");
            const bookingSnapshot = await getDocs(bookingsRef);

            let foundBookingId = null;
            let foundBookingDoc = null;
            let cargoFound = false;

            // Search through all bookings
            for (const bookingDoc of bookingSnapshot.docs) {
                const bookingData = bookingDoc.data();

                // Check if booking has cargo map and the specific cargo ID
                if (bookingData.cargo && bookingData.cargo[cargoId]) {
                    if (bookingData.cargo[cargoId].isTruckBooked) {
                        throw new Error('This cargo already has a truck assigned');
                    }
                    foundBookingId = bookingDoc.id;
                    foundBookingDoc = bookingData;
                    cargoFound = true;
                    break;
                }
            }

            if (!cargoFound) {
                throw new Error('Cargo ID not found in any booking');
            }

            // Update just the specific cargo entry
            const updatedCargo = {
                ...foundBookingDoc.cargo,
                [cargoId]: {
                    ...foundBookingDoc.cargo[cargoId],
                    isTruckBooked: true,
                    truckLicense: truckLicense
                }
            };

            // Update the document using setDoc with merge option
            const bookingRef = doc(db, "bookings", foundBookingId);
            await setDoc(bookingRef, {
                cargo: updatedCargo
            }, { merge: true });  // Use merge: true to update only the specified fields

            setSuccess(true);
            setCargoId('');
            setTruckLicense('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseSuccess = () => {
        setSuccess(false);
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Card elevation={4}>
                <CardContent>
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <LocalShippingIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h4" component="h1" gutterBottom>
                            Truck Registration
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            Assign a truck to cargo shipment
                        </Typography>
                    </Box>

                    <Divider sx={{ mb: 4 }} />

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                                    <InventoryIcon sx={{ color: 'action.active', mr: 1, mb: 0.5 }} />
                                    <TextField
                                        label="Cargo ID"
                                        variant="outlined"
                                        fullWidth
                                        value={cargoId}
                                        onChange={(e) => setCargoId(e.target.value)}
                                        required
                                        disabled={loading}
                                        sx={{ mb: 2 }}
                                    />
                                </Box>
                            </Grid>
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                                    <LocalShippingIcon sx={{ color: 'action.active', mr: 1, mb: 0.5 }} />
                                    <TextField
                                        label="Truck License Plate"
                                        variant="outlined"
                                        fullWidth
                                        value={truckLicense}
                                        onChange={(e) => setTruckLicense(e.target.value)}
                                        required
                                        disabled={loading}
                                        sx={{ mb: 3 }}
                                    />
                                </Box>
                            </Grid>
                        </Grid>

                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            fullWidth
                            disabled={loading}
                            sx={{
                                mt: 2,
                                py: 1.5,
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                textTransform: 'none'
                            }}
                        >
                            {loading ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                'Register Truck'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Snackbar
                open={success}
                autoHideDuration={6000}
                onClose={handleCloseSuccess}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
                    Truck successfully registered to cargo!
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default TruckRegistration;