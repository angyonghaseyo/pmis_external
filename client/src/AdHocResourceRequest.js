import React, { useState, useEffect } from 'react';
import { TextField, MenuItem, Button, Typography, Container, Box, Dialog, DialogActions, DialogContent, DialogTitle, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tabs, Tab, IconButton } from '@mui/material';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { db } from './firebaseConfig'; // Import your Firebase configuration
import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore'; // Firestore functions
import EditIcon from '@mui/icons-material/Edit'; // Pencil icon for editing

const AdHocResourceRequest = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    resourceType: '',
    description: '',
    waterLiters: '',
    fuelAmount: '',
    fuelType: '',
    powerKw: '',
    wasteVolume: '',
    wasteType: '',
    preferredTime: new Date(),
    startTime: new Date(),
    endTime: new Date(),
  });
  const [formErrors, setFormErrors] = useState({});
  const [tabValue, setTabValue] = useState(0); // For tabs
  const [requests, setRequests] = useState([]);
  const [editMode, setEditMode] = useState(false); // Control whether we're editing an existing request
  const [editRequestId, setEditRequestId] = useState(null); // Store the ID of the request being edited

  // Open and close dialog
  const handleClickOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setFormData({
      resourceType: '',
      description: '',
      waterLiters: '',
      fuelAmount: '',
      fuelType: '',
      powerKw: '',
      wasteVolume: '',
      wasteType: '',
      preferredTime: new Date(),
      startTime: new Date(),
      endTime: new Date(),
    });
    setFormErrors({});
    setEditMode(false);
    setEditRequestId(null);
  };

  const handleEditClick = (request) => {
    setFormData({
      resourceType: request.resourceType,
      description: request.description,
      waterLiters: request.waterLiters || '',
      fuelAmount: request.fuelAmount || '',
      fuelType: request.fuelType || '',
      powerKw: request.powerKw || '',
      wasteVolume: request.wasteVolume || '',
      wasteType: request.wasteType || '',
      preferredTime: new Date(request.preferredTime.seconds * 1000),
      startTime: request.startTime ? new Date(request.startTime.seconds * 1000) : new Date(),
      endTime: request.endTime ? new Date(request.endTime.seconds * 1000) : new Date(),
    });
    setEditMode(true);
    setEditRequestId(request.id);
    setOpen(true);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleDateChange = (name, newValue) => {
    setFormData(prevData => ({ ...prevData, [name]: newValue }));
  };

  // Fetch requests from Firestore
  const fetchRequests = async () => {
    const querySnapshot = await getDocs(collection(db, 'AdHocResourceRequest'));
    const fetchedRequests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setRequests(fetchedRequests);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Filter requests based on tab value
  const filteredRequests = requests.filter((request) => {
    if (tabValue === 0) return request.status === 'Pending';
    if (tabValue === 1) return request.status === 'Approved';
    if (tabValue === 2) return request.status === 'Completed';
    if (tabValue === 3) return request.status === 'Rejected';
    return true;
  });

  // Validate fields
  const validateFields = () => {
    let errors = {};
    const now = new Date();

    if (!formData.resourceType) {
      errors.resourceType = 'Resource Type is required';
    }

    if (formData.resourceType === 'Water Supply Trucks' && !formData.waterLiters) {
      errors.waterLiters = 'Liters of Water Needed is required';
    }

    if (formData.resourceType === 'Fuel (Bunkering)') {
      if (!formData.fuelAmount) {
        errors.fuelAmount = 'Amount of Fuel Needed is required';
      }
      if (!formData.fuelType) {
        errors.fuelType = 'Fuel Type is required';
      }
    }

    if (formData.resourceType === 'Power Supply (Shore Power)') {
      if (!formData.powerKw) {
        errors.powerKw = 'Power Requirement (kW) is required';
      }
      if (formData.startTime < now) {
        errors.startTime = 'Start Date and Time cannot be in the past';
      }
      if (formData.endTime < formData.startTime) {
        errors.endTime = 'End Date and Time cannot be before Start Date and Time';
      }
    }

    if (formData.resourceType === 'Waste Removal') {
      if (!formData.wasteType) {
        errors.wasteType = 'Waste Type is required';
      }
      if (!formData.wasteVolume) {
        errors.wasteVolume = 'Volume of Waste is required';
      }
    }

    if (formData.preferredTime < now) {
      errors.preferredTime = 'Preferred Date and Time cannot be in the past';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Function to submit the form data to Firestore
  const handleSubmit = async () => {
    if (!validateFields()) {
      return;
    }

    try {
      let requestData = {
        resourceType: formData.resourceType,
        description: formData.description || null,
        preferredTime: formData.preferredTime,
        status: 'Pending',
        createdAt: new Date(),
      };

      if (formData.resourceType === 'Water Supply Trucks') {
        requestData.waterLiters = formData.waterLiters;
      }

      if (formData.resourceType === 'Fuel (Bunkering)') {
        requestData.fuelAmount = formData.fuelAmount;
        requestData.fuelType = formData.fuelType;
      }

      if (formData.resourceType === 'Power Supply (Shore Power)') {
        requestData.powerKw = formData.powerKw;
        requestData.startTime = formData.startTime;
        requestData.endTime = formData.endTime;
      }

      if (formData.resourceType === 'Waste Removal') {
        requestData.wasteType = formData.wasteType;
        requestData.wasteVolume = formData.wasteVolume;
      }

      if (editMode && editRequestId) {
        const requestRef = doc(db, 'AdHocResourceRequest', editRequestId);
        await updateDoc(requestRef, requestData);
      } else {
        await addDoc(collection(db, 'AdHocResourceRequest'), requestData);
      }

      handleClose();
      fetchRequests();
    } catch (error) {
      console.error('Error submitting request: ', error);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom>
            Ad Hoc Resource Requests
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" color="primary" onClick={handleClickOpen}>
              Create New Request
            </Button>
          </Box>

          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
            <Tab label="Pending Requests" />
            <Tab label="Approved Requests" />
            <Tab label="Completed Requests" />
            <Tab label="Rejected Requests" />
          </Tabs>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Resource Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Preferred Time</TableCell>
                  {tabValue === 2 && <TableCell>Completed At</TableCell>}
                  {tabValue === 3 && <TableCell>Rejected At</TableCell>}
                  {tabValue === 3 && <TableCell>Rejection Reason</TableCell>}
                  {tabValue !== 2 && tabValue !== 3 && <TableCell>Status</TableCell>}
                  {tabValue === 0 && <TableCell>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.resourceType}</TableCell>
                      <TableCell>{request.description || '-'}</TableCell>
                      <TableCell>{new Date(request.preferredTime.seconds * 1000).toLocaleString()}</TableCell>
                      {tabValue === 2 && <TableCell>{new Date(request.completedAt.seconds * 1000).toLocaleString()}</TableCell>}
                      {tabValue === 3 && <TableCell>{new Date(request.rejectedAt.seconds * 1000).toLocaleString()}</TableCell>}
                      {tabValue === 3 && <TableCell>{request.rejectionReason}</TableCell>}
                      {tabValue !== 2 && tabValue !== 3 && <TableCell>{request.status}</TableCell>}
                      {tabValue === 0 && (
                        <TableCell>
                          <IconButton color="primary" onClick={() => handleEditClick(request)}>
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={tabValue === 2 || tabValue === 3 ? 5 : 6} align="center">
                      No requests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>{editMode ? 'Edit Ad Hoc Resource Request' : 'Create New Ad Hoc Resource Request'}</DialogTitle>
            <DialogContent>
              <TextField
                select
                label="Resource Type"
                name="resourceType"
                value={formData.resourceType}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                margin="normal"
                error={!!formErrors.resourceType}
                helperText={formErrors.resourceType}
                required
              >
                <MenuItem value="Water Supply Trucks">Water Supply Trucks</MenuItem>
                <MenuItem value="Fuel (Bunkering)">Fuel (Bunkering)</MenuItem>
                <MenuItem value="Power Supply (Shore Power)">Power Supply (Shore Power)</MenuItem>
                <MenuItem value="Waste Removal">Waste Removal</MenuItem>
              </TextField>

              {/* Conditionally render the rest of the fields based on Resource Type */}
              {formData.resourceType === 'Water Supply Trucks' && (
                <>
                  <TextField
                    label="Liters of Water Needed"
                    name="waterLiters"
                    value={formData.waterLiters}
                    onChange={handleInputChange}
                    fullWidth
                    variant="outlined"
                    margin="normal"
                    type="number"
                    error={!!formErrors.waterLiters}
                    helperText={formErrors.waterLiters}
                    required
                  />
                  <DateTimePicker
                    label="Preferred Delivery Time"
                    value={formData.preferredTime}
                    onChange={(newValue) => handleDateChange('preferredTime', newValue)}
                    renderInput={(params) => <TextField {...params} sx={{ mt: 3 }} margin="normal" fullWidth />}
                    required
                    error={!!formErrors.preferredTime}
                    helperText={formErrors.preferredTime}
                  />
                </>
              )}

              {formData.resourceType === 'Fuel (Bunkering)' && (
                <>
                  <TextField
                    select
                    label="Fuel Type"
                    name="fuelType"
                    value={formData.fuelType}
                    onChange={handleInputChange}
                    fullWidth
                    variant="outlined"
                    margin="normal"
                    required
                    error={!!formErrors.fuelType}
                    helperText={formErrors.fuelType}
                  >
                    <MenuItem value="Marine Diesel">Marine Diesel</MenuItem>
                    <MenuItem value="Heavy Fuel Oil">Heavy Fuel Oil</MenuItem>
                    <MenuItem value="LNG">LNG</MenuItem>
                  </TextField>

                  <TextField
                    label="Amount of Fuel Needed (Liters)"
                    name="fuelAmount"
                    value={formData.fuelAmount}
                    onChange={handleInputChange}
                    fullWidth
                    variant="outlined"
                    margin="normal"
                    type="number"
                    required
                    error={!!formErrors.fuelAmount}
                    helperText={formErrors.fuelAmount}
                  />

                  <DateTimePicker
                    label="Preferred Delivery Time"
                    value={formData.preferredTime}
                    onChange={(newValue) => handleDateChange('preferredTime', newValue)}
                    renderInput={(params) => <TextField {...params} sx={{ mt: 3 }} margin="normal" fullWidth />}
                    required
                    error={!!formErrors.preferredTime}
                    helperText={formErrors.preferredTime}
                  />
                </>
              )}

              {formData.resourceType === 'Power Supply (Shore Power)' && (
                <>
                  <TextField
                    label="Power Requirement (kW)"
                    name="powerKw"
                    value={formData.powerKw}
                    onChange={handleInputChange}
                    fullWidth
                    variant="outlined"
                    margin="normal"
                    type="number"
                    required
                    error={!!formErrors.powerKw}
                    helperText={formErrors.powerKw}
                  />
                  <Box display="flex" gap={2}>
                    <DateTimePicker
                      label="Start Date and Time"
                      value={formData.startTime}
                      onChange={(newValue) => handleDateChange('startTime', newValue)}
                      renderInput={(params) => <TextField {...params} sx={{ mt: 3 }} margin="normal" fullWidth />}
                      required
                      error={!!formErrors.startTime}
                      helperText={formErrors.startTime}
                    />
                    <DateTimePicker
                      label="End Date and Time"
                      value={formData.endTime}
                      onChange={(newValue) => handleDateChange('endTime', newValue)}
                      renderInput={(params) => <TextField {...params} sx={{ mt: 3 }} margin="normal" fullWidth />}
                      required
                      error={!!formErrors.endTime}
                      helperText={formErrors.endTime}
                    />
                  </Box>
                </>
              )}

              {formData.resourceType === 'Waste Removal' && (
                <>
                  <TextField
                    select
                    label="Waste Type"
                    name="wasteType"
                    value={formData.wasteType}
                    onChange={handleInputChange}
                    fullWidth
                    variant="outlined"
                    margin="normal"
                    required
                    error={!!formErrors.wasteType}
                    helperText={formErrors.wasteType}
                  >
                    <MenuItem value="Hazardous">Hazardous</MenuItem>
                    <MenuItem value="Non-Hazardous">Non-Hazardous</MenuItem>
                    <MenuItem value="Organic">Organic</MenuItem>
                  </TextField>
                  <TextField
                    label="Volume of Waste (Cubic Meters)"
                    name="wasteVolume"
                    value={formData.wasteVolume}
                    onChange={handleInputChange}
                    fullWidth
                    variant="outlined"
                    margin="normal"
                    type="number"
                    required
                    error={!!formErrors.wasteVolume}
                    helperText={formErrors.wasteVolume}
                  />
                  <DateTimePicker
                    label="Preferred Pickup Time"
                    value={formData.preferredTime}
                    onChange={(newValue) => handleDateChange('preferredTime', newValue)}
                    renderInput={(params) => <TextField {...params} sx={{ mt: 3 }} margin="normal" fullWidth />}
                    required
                    error={!!formErrors.preferredTime}
                    helperText={formErrors.preferredTime}
                  />
                </>
              )}

              <TextField
                label="Additional Instructions"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                margin="normal"
                multiline
                rows={4}
                placeholder="Please provide additional details or instructions."
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} color="secondary">Cancel</Button>
              <Button onClick={handleSubmit} color="primary" variant="contained">
                {editMode ? 'Update Request' : 'Submit Request'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default AdHocResourceRequest;
