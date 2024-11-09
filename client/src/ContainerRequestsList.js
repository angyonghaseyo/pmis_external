import React, { useState, useEffect } from 'react';
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
import { 
    getContainerRequests, 
    getCarrierContainerPrices,
    getContainerTypesForCompany,
    assignContainerToRequest,
    rejectContainerRequest
} from './services/api';

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
            const requestsData = await getContainerRequests();
            setRequests(requestsData);
        } catch (error) {
            console.error("Failed fetching requests", error);
            showAlert("Error loading requests", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRequestClick = async (request) => {
        try {
            let allContainers = [];
            let allImages = {};

            if (request.carrierName) {
                const containers = await getCarrierContainerPrices(request.carrierName);
                allContainers = containers;

                const containerTypes = await getContainerTypesForCompany(request.carrierName);
                containerTypes.forEach(type => {
                    allImages[type.name] = type.imageUrl;
                });
            } else {
                // If carrier name is not specified, fetch all carriers' data
                const carrierTypes = await getContainerTypesForCompany();
                Object.entries(carrierTypes).forEach(([carrier, types]) => {
                    types.forEach(type => {
                        allImages[type.name] = type.imageUrl;
                    });
                });

                // Fetch container prices for all carriers
                const carrierPrices = await getCarrierContainerPrices();
                carrierPrices.forEach(carrier => {
                    if (carrier.containers) {
                        const containersWithCarrier = carrier.containers.map(container => ({
                            ...container,
                            carrierName: carrier.name
                        }));
                        allContainers = [...allContainers, ...containersWithCarrier];
                    }
                });
            }

            const availableContainers = allContainers.filter(container => {
                const spaceUsed = parseFloat(container.spaceUsed || 0);
                const totalSpace = parseFloat(container.size || 0);
                const requiredSpace = request.consolidationService
                    ? parseFloat(request.consolidationSpace || 0)
                    : totalSpace;

                return (totalSpace - spaceUsed) >= requiredSpace;
            });

            setAvailableContainers(availableContainers);
            setContainerImages(allImages);
            setSelectedRequest(request);
            setIsDialogOpen(true);
        } catch (error) {
            console.error("Error fetching container data:", error);
            showAlert("Error loading container data", "error");
        }
    };

    const handleAssignContainer = async (container) => {
        if (!selectedRequest || !container) return;

        const requiredSpace = selectedRequest.consolidationService
            ? parseFloat(selectedRequest.consolidationSpace)
            : parseFloat(container.size);

        if (requiredSpace > (parseFloat(container.size) - parseFloat(container.spaceUsed))) {
            showAlert("Not enough space in the selected container", "error");
            return;
        }

        try {
            await assignContainerToRequest(selectedRequest.id, {
                container,
                cargoId: selectedRequest.cargoId
            });

            showAlert("Container assigned successfully");
            await fetchData();
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Error assigning container:", error);
            showAlert("Error assigning container", "error");
        }
    };

    const handleReject = async () => {
        if (!selectedRequest || !rejectionReason) return;

        try {
            await rejectContainerRequest(selectedRequest.id, rejectionReason);
            showAlert("Request rejected successfully");
            setIsDialogOpen(false);
            setRejectionReason('');
            setIsRejecting(false);
            await fetchData();
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

    const showAlert = (message, severity = 'success') => {
        setAlert({ message, severity });
    };

    const ContainerCard = ({ container }) => {
        const spaceUsed = parseFloat(container.spaceUsed);
        const totalSpace = parseFloat(container.size);
        const spacePercentage = (spaceUsed / totalSpace) * 100;
        const spaceLeft = totalSpace - spaceUsed;

        return (
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {containerImages[container.name] && (
                    <CardMedia
                        component="img"
                        height="140"
                        image={containerImages[container.name]}
                        alt={container.name}
                        sx={{ objectFit: 'contain', bgcolor: 'grey.100' }}
                    />
                )}
                <CardContent>
                    <Stack spacing={2}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6">{container.EquipmentID}</Typography>
                            <Chip
                                label={container.bookingStatus}
                                color={container.bookingStatus === 'available' ? 'success' : 'default'}
                                size="small"
                            />
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
                            ${container.price}
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
                            <TableCell>Carrier</TableCell>
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
                                <TableCell>{request.carrierName ? (
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
                                )}</TableCell>
                                <TableCell>{request.voyageNumber}</TableCell>
                                <TableCell>{request.eta?.toLocaleString()}</TableCell>
                                <TableCell>{request.assignedContainerId || "No assigned containers yet"}</TableCell>
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