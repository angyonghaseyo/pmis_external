import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, getFirestore, getDocs, collection, where, query } from "firebase/firestore";
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
    Stack
} from '@mui/material';
import {
    Edit as EditIcon,
    Download as DownloadIcon,
    Close as CloseIcon
} from '@mui/icons-material';

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

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch requests
            const requestsSnapshot = await getDocs(collection(db, "container_requests"));
            const requestsData = requestsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                eta: doc.data().eta,
                etd: doc.data().etd,
            }));
            setRequests(requestsData);
        } catch (error) {
            console.error("Failed fetching requests", error);
            showAlert("Error loading requests", "error");
        } finally {
            setIsLoading(false);
        }
    };



    const showAlert = (message, severity = 'success') => {
        setAlert({ message, severity });
    };

    const handleRequestClick = async (request) => {
        try {
            console.log('Processing request:', request);
            let allContainers = new Map(); // Use Map to ensure uniqueness by EquipmentID
            let allImages = {};

            const carrierSnapshot = await getDocs(collection(db, "carrier_container_prices"));
            console.log('Found carriers:', carrierSnapshot.size);

            for (const carrierDoc of carrierSnapshot.docs) {
                const carrierData = carrierDoc.data();
                const carrierName = carrierDoc.id;

                console.log(`Processing carrier ${carrierName}:`, carrierData);

                if (carrierData.containers) {
                    carrierData.containers.forEach(container => {
                        // Only add if not already in the Map
                        if (!allContainers.has(container.EquipmentID)) {
                            allContainers.set(container.EquipmentID, {
                                ...container,
                                carrierName,
                            });
                        }
                    });
                }

                // Fetch container types for this carrier to get images
                const menuDoc = await getDoc(doc(db, "container_menu", carrierName));
                if (menuDoc.exists()) {
                    const containerTypes = menuDoc.data()?.container_types || [];
                    containerTypes.forEach(type => {
                        allImages[type.name] = type.imageUrl;
                    });
                }
            }

            // Convert Map to Array
            const containersArray = Array.from(allContainers.values());
            console.log('All unique containers before filtering:', containersArray);

            // Filter containers based on request type and availability
            const availableContainers = containersArray.filter(container => {
                // Parse numeric values
                const spaceUsed = parseFloat(container.spaceUsed || 0);
                const totalSpace = parseFloat(container.size || 0);
                const requiredSpace = request.consolidationService
                    ? parseFloat(request.consolidationSpace || 0)
                    : totalSpace;

                // For consolidation service
                if (request.consolidationService) {
                    const hasEnoughSpace = (totalSpace - spaceUsed) >= requiredSpace;
                    const isValidStatus = ['available', 'consolidation'].includes(container.bookingStatus);
                    console.log(`Container ${container.EquipmentID} - Space Check:`, {
                        totalSpace,
                        spaceUsed,
                        requiredSpace,
                        hasEnoughSpace,
                        status: container.bookingStatus,
                        isValidStatus
                    });
                    return hasEnoughSpace && isValidStatus;
                }

                // For full container service
                return spaceUsed === 0 && container.bookingStatus === 'available';
            });

            console.log('Filtered available containers:', availableContainers);

            if (availableContainers.length === 0) {
                showAlert("No available containers found matching the requirements", "warning");
            }

            setAvailableContainers(availableContainers);
            setContainerImages(allImages);
            setSelectedRequest(request);
            setIsDialogOpen(true);
        } catch (error) {
            console.error("Error fetching container data:", error);
            showAlert("Error loading container data: " + error.message, "error");
        }
    };

    const handleAssignContainer = async (container) => {
        if (!selectedRequest || !container) return;

        const requiredSpace = selectedRequest.consolidationService
            ? parseFloat(selectedRequest.consolidationSpace)
            : parseFloat(container.size);

        try {
            // Get current container state
            const carrierDoc = await getDoc(doc(db, "carrier_container_prices", container.carrierName));
            const currentContainers = carrierDoc.data()?.containers || [];
            const currentContainer = currentContainers.find(c => c.EquipmentID === container.EquipmentID);

            if (!currentContainer) {
                throw new Error("Container not found in database");
            }

            const currentSpaceUsed = parseFloat(currentContainer.spaceUsed || 0);
            const totalSpace = parseFloat(currentContainer.size);

            if ((currentSpaceUsed + requiredSpace) > totalSpace) {
                throw new Error("Container space has changed and no longer has enough capacity");
            }

            const updatedContainer = {
                ...currentContainer,
                spaceUsed: (currentSpaceUsed + requiredSpace).toString(),
                bookingStatus: selectedRequest.consolidationService ? "consolidation" : "booked",
                containerConsolidationsID: selectedRequest.consolidationService
                    ? [...(currentContainer.containerConsolidationsID || []), selectedRequest.id]
                    : currentContainer.containerConsolidationsID,
                updatedAt: new Date().toISOString()
            };

            // Update carrier_container_prices document
            await updateDoc(doc(db, "carrier_container_prices", container.carrierName), {
                containers: currentContainers.map(c =>
                    c.EquipmentID === container.EquipmentID ? updatedContainer : c
                )
            });

            // Update container_requests document
            await updateDoc(doc(db, "container_requests", selectedRequest.id), {
                status: "Assigned",
                assignedContainerId: container.EquipmentID,
                carrierName: container.carrierName,
                updatedAt: new Date().toISOString()
            });

            // Update booking
            const bookingQuery = query(
                collection(db, "bookings"),
                where(`cargo.${selectedRequest.cargoId}`, '!=', null)
            );
            const bookingSnapshot = await getDocs(bookingQuery);

            if (!bookingSnapshot.empty) {
                const bookingDoc = bookingSnapshot.docs[0];
                await updateDoc(doc(db, "bookings", bookingDoc.id), {
                    [`cargo.${selectedRequest.cargoId}.isContainerRented`]: true,
                    [`cargo.${selectedRequest.cargoId}.assignedContainerId`]: container.EquipmentID,
                    [`cargo.${selectedRequest.cargoId}.carrierName`]: container.carrierName
                });
            }

            showAlert("Container assigned successfully");
            await fetchData(); // Refresh the list
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Error assigning container:", error);
            showAlert(error.message || "Error assigning container", "error");
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
        const spaceUsed = parseFloat(container.spaceUsed || 0);
        const totalSpace = parseFloat(container.size || 0);
        const spacePercentage = (spaceUsed / totalSpace) * 100;
        const spaceLeft = totalSpace - spaceUsed;

        console.log('Rendering container card:', container);

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
                    <Stack spacing={2}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6">{container.EquipmentID}</Typography>
                            <Stack direction="row" spacing={1}>
                                <Chip
                                    label={container.carrierName}
                                    color="primary"
                                    size="small"
                                />
                                <Chip
                                    label={container.bookingStatus}
                                    color={container.bookingStatus === 'available' ? 'success' : 'default'}
                                    size="small"
                                />
                            </Stack>
                        </Box>
                        <Typography color="text.secondary">
                            {container.name} - {container.size}ft
                        </Typography>
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">Space Available</Typography>
                                <Typography variant="body2">
                                    {spaceLeft.toFixed(2)} / {totalSpace}ft³
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={100 - spacePercentage}
                                sx={{ height: 8, borderRadius: 1 }}
                            />
                        </Box>
                        <Typography variant="h6" color="primary">
                            ${parseFloat(container.price).toLocaleString()}
                        </Typography>
                    </Stack>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={() => handleAssignContainer(container)}
                        disabled={
                            container.bookingStatus === 'booked' ||
                            spaceLeft < (selectedRequest?.consolidationSpace || 0)
                        }
                    >
                        Assign Container
                    </Button>
                </CardActions>
            </Card>
        );
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Container Requests
            </Typography>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Cargo ID</TableCell>
                            <TableCell>Cargo Name</TableCell>
                            <TableCell>Voyage Number</TableCell>
                            <TableCell>ETA</TableCell>
                            <TableCell>Assigned Container ID</TableCell>
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
                                {/* <TableCell>{request.carrierName ? (
                                    <Box>
                                        <Typography variant="body2">
                                            {request.carrierName}
                                        </Typography>

                                    </Box>
                                ) : (
                                    <Box>
                                        <Typography variant="body2">
                                            -
                                        </Typography>

                                    </Box>
                                )}</TableCell> */}
                                <TableCell>{request.voyageNumber}</TableCell>
                                <TableCell>{request.eta?.toLocaleString()}</TableCell>

                                {request.assignedContainerId && (
                                    <TableCell>{request.assignedContainerId}</TableCell>
                                )}
                                {!request.assignedContainerId && (
                                    <TableCell>No assigned containers yet</TableCell>
                                )}
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
                            {isRejecting ? 'Reject Request' : 'Assign Container'}
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
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" color="text.secondary">
                            {selectedRequest?.voyageNumber} - {selectedRequest?.carrierName}
                        </Typography>
                        {selectedRequest?.consolidationService && (
                            <Typography variant="body2" color="text.secondary">
                                Required Space: {selectedRequest?.consolidationSpace}ft³
                            </Typography>
                        )}
                    </Box>

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
                        <Grid container spacing={2}>
                            {availableContainers.map((container) => (
                                <Grid item xs={12} sm={6} md={4} key={container.EquipmentID}>
                                    <ContainerCard container={container} />
                                </Grid>
                            ))}
                        </Grid>
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
        </Box>
    );
};

export default ContainerRequestsList;