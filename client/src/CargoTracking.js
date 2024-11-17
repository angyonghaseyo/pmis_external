import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    TextField,
    Button,
    Chip,
    CircularProgress,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Stack
} from '@mui/material';
import {
    Science,
    Inventory,
    Warehouse,
    LocalShipping,
    Check,
    Close,
    Edit,
    Download,
    Add,
    Delete,
    Assignment,
    Person,
    Search,
    Save
} from '@mui/icons-material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import ReactFlow, {
    Background,
    useNodesState,
    useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { collection, query, getDocs, doc, updateDoc, where } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { format } from 'date-fns';

const CargoTracking = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [cargoData, setCargoData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [containerHistory, setContainerHistory] = useState([]);
    const [nodes, setNodes] = useNodesState([]);
    const [edges, setEdges] = useEdgesState([]);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info'
    });
    const [valueAddedServices, setValueAddedServices] = useState([]);
    const [openStatusDialog, setOpenStatusDialog] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [scanning, setScanning] = useState(false);
    const [location, setLocation] = useState('');
    const [action, setAction] = useState('');

    useEffect(() => {
        let scanner;
        if (scanning) {
            scanner = new Html5QrcodeScanner("qr-reader", {
                qrbox: {
                    width: 250,
                    height: 250,
                },
                fps: 5,

            });

            scanner.render((data) => {
                setSearchQuery(data);
                setScanning(false);
                scanner.clear();
                handleSearch(data);
            }, (error) => {
                console.warn(error);
            });
        }

        return () => {
            if (scanner) {
                scanner.clear().catch(console.error);
            }
        };
    }, [scanning]);

    const handleSearch = async (query = searchQuery) => {
        if (!query) return;

        try {
            setLoading(true);

            // Search in bookings collection for the cargo
            const bookingsRef = collection(db, 'bookings');
            const bookingsSnapshot = await getDocs(bookingsRef);
            let foundCargo = null;
            let bookingId = null;

            for (const doc of bookingsSnapshot.docs) {
                const booking = doc.data();
                if (booking.cargo && booking.cargo[query]) {
                    foundCargo = booking.cargo[query];
                    bookingId = doc.id;
                    break;
                }
            }

            if (!foundCargo) {
                throw new Error('Cargo not found');
            }

            // Get container history if container is assigned
            if (foundCargo.assignedContainerId) {
                const containerHistory = await getContainerHistory(foundCargo.assignedContainerId);
                setContainerHistory(containerHistory);
                updateFlowDiagram(query, [...containerHistory, ...(foundCargo.actions || [])]);
            } else {
                updateFlowDiagram(query, foundCargo.actions || []);
            }

            // Get all value-added services for this cargo
            const services = await getValueAddedServices(query);
            setValueAddedServices(services);

            setCargoData({ ...foundCargo, bookingId });
        } catch (error) {
            console.error('Error searching cargo:', error);
            setSnackbar({
                open: true,
                message: error.message || 'Error searching cargo',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const getContainerHistory = async (containerId) => {
        try {
            const containerQuery = query(collection(db, "carrier_container_prices"));
            const querySnapshot = await getDocs(containerQuery);
            let containerActions = [];

            for (const docSnapshot of querySnapshot.docs) {
                const company = docSnapshot.data();
                const container = company.containers?.find(
                    container => container.EquipmentID === containerId
                );

                if (container && container.actions) {
                    containerActions = container.actions;
                    break;
                }
            }

            return containerActions;
        } catch (error) {
            console.error('Error fetching container history:', error);
            return [];
        }
    };

    const getValueAddedServices = async (cargoNumber) => {
        const services = [];
        const collections = ['samplingRequests', 'repackingRequests', 'storageRequests', 'transloadingRequests'];

        for (const collectionName of collections) {
            try {
                const q = query(
                    collection(db, collectionName),
                    where('cargoDetails.cargoNumber', '==', cargoNumber)
                );

                const querySnapshot = await getDocs(q);
                querySnapshot.docs.forEach(doc => {
                    services.push({
                        id: doc.id,
                        type: collectionName,
                        ...doc.data()
                    });
                });
            } catch (error) {
                console.error(`Error fetching ${collectionName}:`, error);
            }
        }

        return services.sort((a, b) => {
            const dateA = a.createdAt?.toDate() || new Date(0);
            const dateB = b.createdAt?.toDate() || new Date(0);
            return dateB - dateA;
        });
    };

    const handleUpdateServiceStatus = async () => {
        if (!selectedService || !newStatus || !cargoData) return;

        try {
            const serviceRef = doc(db, selectedService.type, selectedService.id);
            const timestamp = new Date();

            // Update service status
            await updateDoc(serviceRef, {
                status: newStatus,
                updatedAt: timestamp
            });

            // Add action to cargo history
            const bookingRef = doc(db, 'bookings', cargoData.bookingId);
            const serviceTypeMap = {
                'samplingRequests': 'Sampling',
                'repackingRequests': 'Repacking',
                'storageRequests': 'Storage',
                'transloadingRequests': 'Transloading'
            };

            const newAction = {
                action: `${serviceTypeMap[selectedService.type]} - ${newStatus}`,
                location: selectedService.location || 'Warehouse',
                timestamp: timestamp.toISOString(),
                color: getStatusColor(newStatus)
            };

            // Update the cargo's actions array
            const cargoActions = cargoData.actions || [];
            cargoActions.push(newAction);

            await updateDoc(bookingRef, {
                [`cargo.${searchQuery}.actions`]: cargoActions
            });

            // Refresh data
            await handleSearch();

            setSnackbar({
                open: true,
                message: 'Service status updated successfully',
                severity: 'success'
            });
        } catch (error) {
            console.error('Error updating service status:', error);
            setSnackbar({
                open: true,
                message: 'Error updating service status',
                severity: 'error'
            });
        } finally {
            setOpenStatusDialog(false);
            setSelectedService(null);
            setNewStatus('');
        }
    };

    const updateFlowDiagram = (cargoId, actions = []) => {
        const newNodes = [];
        const newEdges = [];

        const nodeWidth = 200;
        const horizontalSpacing = 250;
        const startX = 50;
        const startY = 150;

        // Cargo node
        newNodes.push({
            id: cargoId,
            data: { label: `Cargo: ${cargoId}` },
            position: { x: startX, y: startY },
            draggable: false,
            style: {
                background: '#424242',
                color: 'white',
                padding: 10,
                border: '1px solid #212121',
                borderRadius: '5px',
                width: nodeWidth,
                fontSize: '14px',
                fontWeight: 'bold'
            }
        });

        // Sort actions by timestamp
        const sortedActions = [...actions].sort((a, b) =>
            new Date(a.timestamp) - new Date(b.timestamp)
        );

        // Action nodes
        sortedActions.forEach((action, index) => {
            const actionId = `${cargoId}-action-${index}`;
            const actionLabel = `${action.action}\nat ${action.location}\n${format(new Date(action.timestamp), 'dd/MM/yyyy HH:mm')}`;

            newNodes.push({
                id: actionId,
                data: { label: actionLabel },
                position: { x: startX + horizontalSpacing * (index + 1), y: startY },
                draggable: false,
                style: {
                    background: action.color || '#1976d2',
                    color: 'white',
                    padding: 10,
                    border: '1px solid #616161',
                    borderRadius: '5px',
                    width: nodeWidth,
                    fontSize: '12px',
                    textAlign: 'center',
                    whiteSpace: 'pre-wrap'
                }
            });

            const sourceId = index === 0 ? cargoId : `${cargoId}-action-${index - 1}`;
            newEdges.push({
                id: `${sourceId}-${actionId}`,
                source: sourceId,
                target: actionId,
                type: 'smoothstep',
                style: { stroke: '#616161', strokeWidth: 2 },
                animated: true
            });
        });

        setNodes(newNodes);
        setEdges(newEdges);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'In Progress':
                return '#1976d2'; // blue
            case 'Completed':
                return '#2e7d32'; // green
            case 'Cancelled':
                return '#d32f2f'; // red
            default:
                return '#757575'; // grey
        }
    };


    const getStatusChipColor = (status) => {
        switch (status) {
            case 'In Progress':
                return 'primary';
            case 'Completed':
                return 'success';
            case 'Cancelled':
                return 'error';
            default:
                return 'default';
        }
    };

    const serviceTypes = {
        'samplingRequests': { label: 'Sampling', icon: <Science /> },
        'repackingRequests': { label: 'Repacking', icon: <Inventory /> },
        'storageRequests': { label: 'Storage', icon: <Warehouse /> },
        'transloadingRequests': { label: 'Transloading', icon: <LocalShipping /> }
    };

    const handleSaveAction = async () => {
        if (!action || !location) return;

        try {
            const timestamp = new Date();

            // Add action to cargo history
            const bookingRef = doc(db, 'bookings', cargoData.bookingId);
            const newAction = {
                action,
                location,
                timestamp: timestamp.toISOString(),
                color: getStatusColor(newStatus)
            };

            // Update the cargo's actions array
            const cargoActions = cargoData.actions || [];
            cargoActions.push(newAction);

            // Update the cargo data in the state
            setCargoData(prevData => ({
                ...prevData,
                actions: cargoActions
            }));

            // Update the cargo data in Firestore
            await updateDoc(bookingRef, {
                [`cargo.${searchQuery}.actions`]: cargoActions
            });

            // Refresh data
            await handleSearch();

            setSnackbar({
                open: true,
                message: 'Action saved successfully',
                severity: 'success'
            });

            // Reset form fields
            setLocation('');
            setAction('');
            setNewStatus('');
        } catch (error) {
            console.error('Error saving action:', error);
            setSnackbar({
                open: true,
                message: 'Error saving action',
                severity: 'error'
            });
        }
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>
                Cargo Tracking
            </Typography>

            <Paper sx={{ p: 3, mb: 4 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={8}>
                        <TextField
                            fullWidth
                            label="Enter Cargo Number"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            variant="outlined"
                            InputProps={{
                                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                        />
                    </Grid>
                    <Grid item xs={2}>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={() => handleSearch()}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Track'}
                        </Button>
                    </Grid>
                    <Grid item xs={2}>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => setScanning(true)}
                            startIcon={<QrCodeScannerIcon />}
                        >
                            Scan QR
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {scanning && (
                <Paper sx={{ p: 2, mb: 4, position: 'relative' }}>
                    <Button
                        sx={{ position: 'absolute', right: 8, top: 8, zIndex: 1 }}
                        onClick={() => setScanning(false)}
                    >
                        <Close />
                    </Button>
                    <div id="qr-reader" style={{ width: '100%' }} />
                </Paper>
            )}

            {cargoData && (
                <>
                    <Paper sx={{ p: 3, mb: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            Cargo Information
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={3}>
                                <Typography color="textSecondary">Cargo Number</Typography>
                                <Typography variant="body1">{searchQuery}</Typography>
                            </Grid>
                            <Grid item xs={3}>
                                <Typography color="textSecondary">Name</Typography>
                                <Typography variant="body1">{cargoData.name}</Typography>
                            </Grid>
                            <Grid item xs={3}>
                                <Typography color="textSecondary">Type</Typography>
                                <Typography variant="body1">{cargoData.cargoType}</Typography>
                            </Grid>
                            <Grid item xs={3}>
                                <Typography color="textSecondary">Quantity</Typography>
                                <Typography variant="body1">
                                    {cargoData.quantity} {cargoData.unit}
                                </Typography>
                            </Grid>
                            {cargoData.assignedContainerId && (
                                <Grid item xs={12}>
                                    <Typography color="textSecondary">Container ID</Typography>
                                    <Typography variant="body1">{cargoData.assignedContainerId}</Typography>
                                </Grid>
                            )}
                            {cargoData.assignedContainerId && (
                                <Grid item xs={12}>
                                    <Typography color="textSecondary">Container ID</Typography>
                                    <Typography variant="body1">{cargoData.assignedContainerId}</Typography>
                                </Grid>
                            )}
                            <Typography variant="h6" gutterBottom sx={{ p: 2 }}>
                                Value Added Services
                            </Typography>
                            <Grid container spacing={3}>
                                {valueAddedServices.map((service) => (
                                    <Grid item xs={12} key={service.id}>
                                        <Paper
                                            elevation={4}
                                            sx={{
                                                p: 3,
                                                borderLeft: 6,
                                                borderColor: getStatusColor(service.status),
                                                borderRadius: 1,
                                                backgroundColor: '#f9fbff',
                                                transition: 'transform 0.2s',
                                                '&:hover': {
                                                    transform: 'translateY(-4px)',
                                                },
                                            }}
                                        >
                                            <Grid container alignItems="center" spacing={2}>
                                                <Grid item xs={12} sm={3}>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        {serviceTypes[service.type].icon}
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                                            {serviceTypes[service.type].label}
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12} sm={3}>
                                                    <Typography color="textSecondary" variant="body2">
                                                        Request Date
                                                    </Typography>
                                                    <Typography variant="body1" sx={{ fontWeight: 400 }}>
                                                        {format(service.createdAt.toDate(), 'dd/MM/yyyy HH:mm')}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={12} sm={3}>
                                                    <Typography color="textSecondary" variant="body2">
                                                        Current Status
                                                    </Typography>
                                                    <Chip
                                                        label={service.status}
                                                        color={getStatusChipColor(service.status)}
                                                        size="small"
                                                        sx={{ fontWeight: 500, borderRadius: '8px' }}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        </Grid>

                    </Paper>

                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Movement History
                        </Typography>
                        <Box sx={{ height: 400 }}>
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                fitView
                                fitViewOptions={{
                                    padding: 0.2,
                                    includeHiddenNodes: true,
                                }}
                                nodesDraggable={false}
                                nodesConnectable={false}
                                elementsSelectable={false}
                            >
                                <Background />
                            </ReactFlow>
                        </Box>
                    </Paper>
                </>
            )
            }

            <Dialog
                open={openStatusDialog}
                onClose={() => setOpenStatusDialog(false)}
            >
                <DialogTitle>Update Service Status</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>New Status</InputLabel>
                        <Select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            label="New Status"
                        >
                            <MenuItem value="In Progress">In Progress</MenuItem>
                            <MenuItem value="Completed">Completed</MenuItem>
                            <MenuItem value="Cancelled">Cancelled</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenStatusDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleUpdateServiceStatus}
                        variant="contained"
                        color="primary"
                    >
                        Update
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                    elevation={6}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container >
    );
};

export default CargoTracking;