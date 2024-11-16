import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, getFirestore, getDocs, collection, where, query, runTransaction } from "firebase/firestore";
import QRCode from 'qrcode';
import {
    Box,
    Card,
    CardContent,
    CardMedia,
    CardActions,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Snackbar,
    Grid,
    Chip,
    TextField,
    LinearProgress,
    IconButton,
    Alert,
    Stack,
    Tooltip
} from '@mui/material';
import {
    Edit as EditIcon,
    Download as DownloadIcon,
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Warning as WarningIcon,
    Visibility as ViewIcon,
} from '@mui/icons-material';
import { useAuth } from './AuthContext';

const db = getFirestore();

const ContainerRequestsList = () => {
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [availableContainers, setAvailableContainers] = useState([]);
    const [containerImages, setContainerImages] = useState({});
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [alert, setAlert] = useState(null);
    const [isRejecting, setIsRejecting] = useState(false);
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [company, setCompany] = useState('');
    const { user } = useAuth();
    const [companyContainerTypes, setCompanyContainerTypes] = useState([]);
    const [containerAvailability, setContainerAvailability] = useState({});
    const [containerSpaceUsage, setContainerSpaceUsage] = useState({});
    const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info'
    });

    useEffect(() => {
        if (user?.company) {
            fetchData();
            fetchContainerMenuImages();
        }
    }, [user]);

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

            setIsLoading(true);
            try {
                setCompany(user.company);
            } catch (error) {
                console.error("Error loading container types:", error);
                setSnackbar({
                    open: true,
                    message: "Error loading container types",
                    severity: 'error'
                });
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            initializeData();
        }
    }, [user]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const requestsSnapshot = await getDocs(collection(db, "container_requests"));
            const requestsData = requestsSnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    eta: doc.data().eta,
                    etd: doc.data().etd,
                }))
                .filter(request => request.carrierName === user.company);

            setRequests(requestsData);
        } catch (error) {
            console.error("Failed fetching requests", error);
            showAlert("Error loading requests", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCompanyContainerTypes = async () => {
        try {
            const menuDoc = await getDoc(doc(db, "container_menu", user.company));
            if (menuDoc.exists()) {
                setCompanyContainerTypes(menuDoc.data().container_types || []);
            }
        } catch (error) {
            console.error("Error fetching company container types:", error);
            showAlert("Error loading container types", "error");
        }
    };

    const fetchContainerMenuImages = async () => {
        try {
            const menuDoc = await getDoc(doc(db, "container_menu", user.company));
            if (menuDoc.exists()) {
                const containerTypes = menuDoc.data().container_types || [];
                const images = {};
                containerTypes.forEach(type => {
                    images[type.name] = type.imageUrl || '/api/placeholder/400/320';
                });
                setContainerImages(images);
                return images;
            }
            return {};
        } catch (error) {
            console.error("Error fetching container menu images:", error);
            return {};
        }
    };


    const showAlert = (message, severity = 'success') => {
        setAlert({ message, severity });
    };

    const handleRequestClick = async (request) => {
        try {
            setSelectedRequest(request);

            // Get container images from menu
            await fetchContainerMenuImages();

            // Get and filter containers from carrier_container_prices
            const carrierDoc = await getDoc(doc(db, "carrier_container_prices", user.company));
            if (carrierDoc.exists()) {
                const allContainers = carrierDoc.data().containers || [];

                // Filter containers based on the requested container type (name)
                const filteredContainers = allContainers.filter(container =>
                    container.name === request.containerDetails?.name
                );

                console.log('Requested container type:', request.containerDetails?.name);
                console.log('Available containers:', filteredContainers);

                setAvailableContainers(filteredContainers);

                // Calculate availability for filtered containers
                const availability = {};
                const spaceUsage = {};

                filteredContainers.forEach(container => {
                    const currentSpaceUsed = parseFloat(container.spaceUsed || 0);
                    const totalSpace = parseFloat(container.size);
                    const requestedSpace = request.consolidationService ?
                        parseFloat(request.consolidationSpace) : totalSpace;

                    const isAvailable = container.bookingStatus === 'available';
                    const hasSpace = container.bookingStatus === 'consolidation' &&
                        (totalSpace - currentSpaceUsed) >= requestedSpace;

                    availability[container.EquipmentID] = isAvailable || hasSpace;
                    spaceUsage[container.EquipmentID] = {
                        used: currentSpaceUsed,
                        total: totalSpace,
                        percentage: (currentSpaceUsed / totalSpace) * 100
                    };
                });

                setContainerAvailability(availability);
                setContainerSpaceUsage(spaceUsage);

                setIsDialogOpen(true);

                if (filteredContainers.length === 0) {
                    showAlert(`No available containers of type ${request.containerDetails?.name}`, "warning");
                }
            } else {
                showAlert("No container pricing data found", "error");
            }
        } catch (error) {
            console.error("Error preparing container data:", error);
            showAlert("Error loading container data: " + error.message, "error");
        }
    };


    const handleAssignContainer = async (container) => {
        if (!selectedRequest || !container) return;

        try {
            // Check availability again before assigning
            if (!containerAvailability[container.EquipmentID]) {
                throw new Error("Container is no longer available");
            }

            await runTransaction(db, async (transaction) => {
                // Get the latest container data
                const carrierContainerRef = doc(db, "carrier_container_prices", user.company);
                const carrierDoc = await transaction.get(carrierContainerRef);

                if (!carrierDoc.exists()) {
                    throw new Error("Carrier container prices not found");
                }

                const containers = carrierDoc.data().containers || [];
                const containerIndex = containers.findIndex(c => c.EquipmentID === container.EquipmentID);

                if (containerIndex === -1) {
                    throw new Error("Container not found");
                }

                // Calculate new space used for consolidation service
                let newSpaceUsed = parseFloat(containers[containerIndex].spaceUsed || 0);
                let newStatus = containers[containerIndex].bookingStatus;

                if (selectedRequest.consolidationService) {
                    newSpaceUsed += parseFloat(selectedRequest.consolidationSpace);
                    newStatus = 'consolidation';

                    if (newSpaceUsed > parseFloat(container.size)) {
                        throw new Error("Not enough space available in container");
                    }
                } else {
                    newStatus = 'unavailable';
                    newSpaceUsed = parseFloat(container.size);
                }

                // Update container data
                containers[containerIndex] = {
                    ...containers[containerIndex],
                    spaceUsed: newSpaceUsed,
                    bookingStatus: newStatus,
                    updatedAt: new Date().toISOString()
                };

                // Update carrier_container_prices document
                transaction.update(carrierContainerRef, {
                    containers: containers,
                    lastUpdated: new Date().toISOString()
                });

                // Update container request status
                transaction.update(doc(db, "container_requests", selectedRequest.id), {
                    status: "Assigned",
                    assignedContainerId: container.EquipmentID,
                    containerDetails: {
                        EquipmentID: container.EquipmentID,
                        size: container.size,
                        price: container.price,
                        serviceType: selectedRequest.consolidationService ? 'consolidation' : 'fullContainer'
                    },
                    updatedAt: new Date().toISOString()
                });

                // Update booking if exists
                const bookingQuery = query(
                    collection(db, "bookings"),
                    where(`cargo.${selectedRequest.cargoId}`, '!=', null)
                );
                const bookingSnapshot = await getDocs(bookingQuery);

                if (!bookingSnapshot.empty) {
                    const bookingDoc = bookingSnapshot.docs[0];
                    transaction.update(doc(db, "bookings", bookingDoc.id), {
                        [`cargo.${selectedRequest.cargoId}.isContainerRented`]: true,
                        [`cargo.${selectedRequest.cargoId}.assignedContainerId`]: container.EquipmentID,
                        [`cargo.${selectedRequest.cargoId}.carrierName`]: user.company
                    });
                }
            });

            showAlert("Container assigned successfully");
            await fetchData();
            await fetchContainerAvailability();
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Error assigning container:", error);
            showAlert(error.message || "Error assigning container", "error");
        }
    };


    const fetchContainerAvailability = async () => {
        try {
            const carrierDoc = await getDoc(doc(db, "carrier_container_prices", user.company));
            if (carrierDoc.exists()) {
                const containers = carrierDoc.data().containers || [];
                const availability = {};
                const spaceUsage = {};

                containers.forEach(container => {
                    const currentSpaceUsed = parseFloat(container.spaceUsed || 0);
                    const totalSpace = parseFloat(container.size);
                    const requestedSpace = selectedRequest?.consolidationService ?
                        parseFloat(selectedRequest.consolidationSpace) : totalSpace;

                    const isAvailable = container.bookingStatus === 'available';
                    const hasSpace = container.bookingStatus === 'consolidation' &&
                        (totalSpace - currentSpaceUsed) >= requestedSpace;

                    availability[container.EquipmentID] = isAvailable || hasSpace;
                    spaceUsage[container.EquipmentID] = {
                        used: currentSpaceUsed,
                        total: totalSpace,
                        percentage: (currentSpaceUsed / totalSpace) * 100
                    };
                });

                setContainerAvailability(availability);
                setContainerSpaceUsage(spaceUsage);
                return containers;
            }
            return [];
        } catch (error) {
            console.error("Error fetching container availability:", error);
            showAlert("Error checking container availability", "error");
            return [];
        }
    };


    const handleReject = async () => {
        if (!selectedRequest || !rejectionReason) return;

        try {
            await updateDoc(doc(db, "container_requests", selectedRequest.id), {
                status: "Rejected",
                rejectionReason: rejectionReason
            });

            showAlert("Request rejected successfully");
            setIsDialogOpen(false);
            setRejectionReason('');
            setIsRejecting(false);
        } catch (error) {
            console.error("Error rejecting request:", error);
            showAlert("Error rejecting request", "error");
        }
    };

    const handleDownloadQRCode = async (requestId) => {
        try {
            const qrCodeDataUrl = await QRCode.toDataURL(requestId);
            const link = document.createElement('a');
            link.href = qrCodeDataUrl;
            link.download = `qr-code-${requestId}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error generating QR code:', error);
            showAlert("Error generating QR code", "error");
        }
    };

    const ContainerCard = ({ container }) => {
        const isAvailable = containerAvailability[container.EquipmentID];
        const spaceInfo = containerSpaceUsage[container.EquipmentID] || {
            used: 0,
            total: parseFloat(container.size),
            percentage: 0
        };

        const spaceLeft = spaceInfo.total - spaceInfo.used;
        const requestedSpace = selectedRequest?.consolidationService ?
            parseFloat(selectedRequest.consolidationSpace) : spaceInfo.total;

        const willFitContainer = requestedSpace <= spaceLeft;
        const percentageAfterRequest = ((spaceInfo.used + requestedSpace) / spaceInfo.total) * 100;

        return (
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                    component="img"
                    height="140"
                    image={containerImages[container.name] || '/api/placeholder/400/320'}
                    alt={container.name}
                    sx={{ objectFit: 'contain', bgcolor: 'grey.100' }}
                />
                <CardContent>
                    <Stack spacing={1}>
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                {container.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                ID: {container.EquipmentID}
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Space Utilization
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={spaceInfo.percentage}
                                sx={{ mt: 1, mb: 1, height: 8, borderRadius: 2 }}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">
                                    Used: {spaceInfo.used.toFixed(1)}ft³
                                </Typography>
                                <Typography variant="body2">
                                    Total: {spaceInfo.total}ft³
                                </Typography>
                            </Box>
                        </Box>

                        {selectedRequest?.consolidationService && (
                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    After Request ({requestedSpace}ft³)
                                </Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={percentageAfterRequest}
                                    color={willFitContainer ? "success" : "error"}
                                    sx={{ mt: 1, mb: 1, height: 8, borderRadius: 2 }}
                                />
                                <Typography variant="body2" color={willFitContainer ? "success.main" : "error.main"}>
                                    Space Left: {(spaceLeft - requestedSpace).toFixed(1)}ft³
                                </Typography>
                            </Box>
                        )}

                        <Typography variant="body1" color="primary">
                            {selectedRequest?.consolidationService
                                ? `$${parseFloat(container.consolidationPrice).toFixed(2)}/ft³`
                                : `$${parseFloat(container.price).toFixed(2)}`
                            }
                        </Typography>
                    </Stack>
                </CardContent>
                <CardActions sx={{ mt: 'auto', p: 2 }}>
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={() => handleAssignContainer(container)}
                        disabled={!isAvailable || (selectedRequest?.consolidationService && !willFitContainer)}
                    >
                        {!isAvailable ? 'Not Available' :
                            (selectedRequest?.consolidationService && !willFitContainer) ? 'Insufficient Space' :
                                'Assign Container'}
                    </Button>
                </CardActions>
            </Card>
        );
    };

    const handleOpenDetails = (request) => {
        setSelectedRequest(request);
        setOpenDetailsDialog(true);
    };

    const handleCloseDetails = () => {
        setSelectedRequest(null);
        setOpenDetailsDialog(false);
    };

    const formatStatus = (status) => {
        switch (status) {
            case 'Pending':
                return <Chip label="Pending" color="warning" size="small" />;
            case 'Assigned':
                return <Chip label="Assigned" color="success" size="small" />;
            case 'Rejected':
                return <Chip label="Rejected" color="error" size="small" />;
            default:
                return <Chip label={status} size="small" />;
        }
    };

    const RequestDetailsDialog = ({ open, onClose, request }) => {
        if (!request) return null;

        return (
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Typography variant="h6">
                        Container Request Details
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        {/* Basic Information */}
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ mb: 2 }}>Basic Information</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Booking ID"
                                value={request.bookingId || ''}
                                disabled
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Voyage Number"
                                value={request.voyageNumber || ''}
                                disabled
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Status"
                                disabled
                                variant="outlined"
                                size="small"
                                InputProps={{
                                    startAdornment: (
                                        <Box sx={{ mr: 1 }}>
                                            {formatStatus(request.status)}
                                        </Box>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Service Type"
                                value={request.consolidationService ? 'Consolidation' : 'Full Container'}
                                disabled
                                variant="outlined"
                                size="small"
                            />
                        </Grid>

                        {/* Cargo Details */}
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>Cargo Details</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Cargo Name"
                                value={request.cargoDetails?.name || ''}
                                disabled
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Quantity"
                                value={request.cargoDetails?.quantity || ''}
                                disabled
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Weight per Unit"
                                value={`${request.cargoDetails?.weightPerUnit || ''} kg`}
                                disabled
                                variant="outlined"
                                size="small"
                            />
                        </Grid>

                        {/* Service Specific Details */}
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
                                {request.consolidationService ? 'Consolidation Details' : 'Container Details'}
                            </Typography>
                        </Grid>

                        {request.consolidationService ? (
                            <>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Space Required"
                                        value={`${request.consolidationSpace || ''} ft³`}
                                        disabled
                                        variant="outlined"
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Container Type"
                                        value={request.containerDetails?.name || ''}
                                        disabled
                                        variant="outlined"
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Size"
                                        value={`${request.containerDetails?.size || ''} ft`}
                                        disabled
                                        variant="outlined"
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Price"
                                        value={request.containerDetails?.price ? `$${request.containerDetails.price}` : 'TBD'}
                                        disabled
                                        variant="outlined"
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Carrier"
                                        value={request.carrierName || 'Not assigned'}
                                        disabled
                                        variant="outlined"
                                        size="small"
                                    />
                                </Grid>
                            </>
                        ) : (
                            <>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Container Type"
                                        value={request.containerDetails?.name || ''}
                                        disabled
                                        variant="outlined"
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Size"
                                        value={`${request.containerDetails?.size || ''} ft`}
                                        disabled
                                        variant="outlined"
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Price"
                                        value={request.containerDetails?.price ? `$${request.containerDetails.price}` : 'TBD'}
                                        disabled
                                        variant="outlined"
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Carrier"
                                        value={request.carrierName || 'Not assigned'}
                                        disabled
                                        variant="outlined"
                                        size="small"
                                    />
                                </Grid>
                            </>
                        )}

                        {request.status === 'Rejected' && (
                            <>
                                <Grid item xs={12}>
                                    <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>Rejection Details</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Rejection Reason"
                                        value={request.rejectionReason || ''}
                                        disabled
                                        variant="outlined"
                                        size="small"
                                        multiline
                                        rows={2}
                                    />
                                </Grid>
                            </>
                        )}

                        {/* Timestamps */}
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>Timestamps</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Created At"
                                value={new Date(request.createdAt).toLocaleDateString()}
                                disabled
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Last Updated"
                                value={new Date(request.updatedAt).toLocaleDateString()}
                                disabled
                                variant="outlined"
                                size="small"
                            />
                        </Grid>

                        {/* Delivery Schedule */}
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>Delivery Schedule</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="ETD"
                                value={request.etd ? new Date(request.etd).toLocaleDateString() : 'Not specified'}
                                disabled
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="ETA"
                                value={request.eta ? new Date(request.eta).toLocaleDateString() : 'Not specified'}
                                disabled
                                variant="outlined"
                                size="small"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} variant="contained" color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        );
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Container Requests for {user?.company}
            </Typography>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Cargo ID</TableCell>
                            <TableCell>Cargo Name</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>ETA</TableCell>
                            <TableCell>Assigned Container</TableCell>
                            <TableCell>Service Type</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {requests.map((request) => (
                            <TableRow key={request.id}>
                                <TableCell>{request.cargoId}</TableCell>
                                <TableCell>{request.cargoDetails.name}</TableCell>
                                <TableCell>
                                    {request.consolidationService ? (
                                        request.estimatedCost ? `$${request.estimatedCost.toFixed(2)}` : 'TBD'
                                    ) : (
                                        request.containerDetails?.price ? `$${request.containerDetails.price}` : 'TBD'
                                    )}
                                </TableCell>
                                <TableCell>{request.eta?.toLocaleString()}</TableCell>
                                <TableCell>
                                    {request.assignedContainerId || 'Not assigned'}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={request.consolidationService ? 'Consolidation' : 'Full Container'}
                                        color={request.consolidationService ? "primary" : "secondary"}
                                        variant="outlined"
                                        size="medium"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={request.status || 'Pending'}
                                        color={
                                            request.status === 'Assigned' ? 'success' :
                                                request.status === 'Rejected' ? 'error' : 'default'
                                        }
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleRequestClick(request)}
                                        disabled={request.status === 'Assigned' || request.status === 'Rejected'}
                                    >
                                        <EditIcon />
                                    </IconButton>

                                    <Button
                                        size="small"

                                        onClick={() => handleOpenDetails(request)}

                                    >
                                        <ViewIcon />
                                    </Button>
                                    {request.status === 'Assigned' && (
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDownloadQRCode(request.assignedContainerId)}
                                        >
                                            <DownloadIcon />
                                        </IconButton>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog
                open={isDialogOpen}
                onClose={() => {
                    setIsDialogOpen(false);
                    setIsRejecting(false);
                    setRejectionReason('');
                }}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">
                            {isRejecting ? 'Reject Request' : (
                                <>
                                    Assign Container - {selectedRequest?.containerDetails?.name}
                                    {selectedRequest?.consolidationService &&
                                        ` (${selectedRequest.consolidationSpace}ft³ needed)`
                                    }
                                </>
                            )}
                        </Typography>
                        <IconButton
                            onClick={() => setIsDialogOpen(false)}
                            size="small"
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {isRejecting ? (
                        <TextField
                            fullWidth
                            label="Rejection Reason"
                            multiline
                            rows={4}
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            variant="outlined"
                        />
                    ) : (
                        <>
                            {availableContainers.length === 0 ? (
                                <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                                    No available containers of type {selectedRequest?.containerDetails?.name}
                                </Typography>
                            ) : (
                                <Grid container spacing={2}>
                                    {availableContainers.map((container, index) => (
                                        <Grid item xs={12} sm={6} md={4} key={container.EquipmentID}>
                                            <ContainerCard container={container} />
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    {isRejecting ? (
                        <>
                            <Button onClick={() => setIsRejecting(false)}>
                                Back
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                onClick={handleReject}
                                disabled={!rejectionReason}
                            >
                                Reject Request
                            </Button>
                        </>
                    ) : (
                        <Button
                            color="error"
                            onClick={() => setIsRejecting(true)}
                        >
                            Reject Request
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
            <Snackbar
                open={!!alert}
                autoHideDuration={6000}
                onClose={() => setAlert(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                {alert && (
                    <Alert
                        onClose={() => setAlert(null)}
                        severity={alert.severity}
                        sx={{ width: '100%' }}
                    >
                        {alert.message}
                    </Alert>
                )}
            </Snackbar>
            {/* Details Dialog */}
            <RequestDetailsDialog
                open={openDetailsDialog}
                onClose={handleCloseDetails}
                request={selectedRequest}
            />
        </Box>
    );
};

export default ContainerRequestsList;