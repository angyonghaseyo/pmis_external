import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Chip,
  Snackbar,
  Alert,
} from '@mui/material';
import { Edit as EditIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { getAdHocResourceRequests, submitAdHocResourceRequest, updateAdHocResourceRequest, getVesselVisitRequestsAdHocRequest } from './services/api';

// Helper function to format date as dd/MM/yyyy, HH:mm:ss
const formatDate = (dateString) => {
  const { _seconds, _nanoseconds } = dateString;
  const milliseconds = _seconds * 1000 + Math.floor(_nanoseconds / 1_000_000);
  const date = new Date(milliseconds);
  return date.toLocaleDateString('en-GB') + ', ' + date.toLocaleTimeString('en-GB');
};

const AdHocResourceRequest = () => {
  const [open, setOpen] = useState(false);
  const [vesselVisits, setVesselVisits] = useState([]);
  const [formData, setFormData] = useState({
    vesselVisit: '',
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
  const [tabValue, setTabValue] = useState(0);
  const [requests, setRequests] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editRequestId, setEditRequestId] = useState(null);
  const [alert, setAlert] = useState(null);

  const fetchRequests = useCallback(async () => {
    try {
      const data = await getAdHocResourceRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setAlert({
        message: 'Error fetching requests',
        severity: 'error'
      });
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchRequests(),
          fetchVesselVisits()
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
        setAlert({
          message: 'Error fetching data',
          severity: 'error'
        });
      }
    };
    fetchData();
  }, [fetchRequests]);

  const fetchVesselVisits = async () => {
    try {
      const fetchedVesselVisits = await getVesselVisitRequestsAdHocRequest();
      setVesselVisits(fetchedVesselVisits);
    } catch (error) {
      console.error('Error fetching vessel visits:', error);
      setAlert({
        message: 'Error fetching vessel visits',
        severity: 'error'
      });
    }
  };

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      vesselVisit: '',
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
    setViewMode(false);
    setEditRequestId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: false }));
  };

  const handleDateChange = (name, newValue) => {
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editMode && editRequestId) {
        await updateAdHocResourceRequest(editRequestId, formData);
        setAlert({
          message: 'Request updated successfully',
          severity: 'success'
        });
      } else {
        await submitAdHocResourceRequest(formData);
        setAlert({
          message: 'Request submitted successfully',
          severity: 'success'
        });
      }
      handleClose();
      await fetchRequests();
    } catch (error) {
      console.error('Error submitting request:', error);
      setAlert({
        message: 'Error submitting request',
        severity: 'error'
      });
    }
  };

  const validateForm = () => {
    const errors = {
      resourceType: !formData.resourceType,
      vesselVisit: !formData.vesselVisit
    };

    switch (formData.resourceType) {
      case 'Water Supply Trucks':
        errors.waterLiters = !formData.waterLiters;
        break;
      case 'Fuel (Bunkering)':
        errors.fuelAmount = !formData.fuelAmount;
        errors.fuelType = !formData.fuelType;
        break;
      case 'Power Supply (Shore Power)':
        errors.powerKw = !formData.powerKw;
        break;
      case 'Waste Removal':
        errors.wasteType = !formData.wasteType;
        errors.wasteVolume = !formData.wasteVolume;
        break;
      default:
        break;
    }

    setFormErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  const handleEdit = (request) => {
    setFormData({
      ...request,
      preferredTime: request.preferredTime,
      startTime: request.startTime || new Date(),
      endTime: request.endTime || new Date(),
    });
    setEditMode(true);
    setEditRequestId(request.id);
    setOpen(true);
  };

  const handleView = (request) => {
    setFormData({
      ...request,
      preferredTime: request.preferredTime,
      startTime: request.startTime || new Date(),
      endTime: request.endTime || new Date(),
    });
    setViewMode(true);
    setOpen(true);
  };

  const filteredRequests = requests.filter((request) => {
    switch (tabValue) {
      case 0: return request.status === 'Pending';
      case 1: return request.status === 'Approved';
      case 2: return request.status === 'Completed';
      case 3: return request.status === 'Rejected';
      default: return true;
    }
  });

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Title and New Request Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">Ad Hoc Resource Requests</Typography>
          <Button variant="contained" onClick={handleClickOpen}>
            Create New Request
          </Button>
        </Box>

        {/* Tabs and Table */}
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
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.resourceType}</TableCell>
                  <TableCell>{request.description}</TableCell>
                  <TableCell>
                    {formatDate(request.preferredTime)}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={request.status}
                      color={
                        request.status === 'Approved' ? 'success' :
                        request.status === 'Rejected' ? 'error' :
                        request.status === 'Completed' ? 'info' : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {request.status === 'Pending' ? (
                      <IconButton onClick={() => handleEdit(request)}>
                        <EditIcon />
                      </IconButton>
                    ) : (
                      <IconButton onClick={() => handleView(request)}>
                        <VisibilityIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Request Dialog */}
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>
            {viewMode ? 'View Request Details' : editMode ? 'Edit Request' : 'Create New Request'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Vessel Visit</InputLabel>
                  <Select
                    name="vesselVisit"
                    value={formData.vesselVisit}
                    onChange={handleInputChange}
                    disabled={viewMode}
                    error={formErrors.vesselVisit}
                  >
                    {vesselVisits.map((visit) => (
                      <MenuItem key={visit.id} value={visit.id}>
                        {`${visit.vesselName} - ${visit.status}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Resource Type</InputLabel>
                  <Select
                    name="resourceType"
                    value={formData.resourceType}
                    onChange={handleInputChange}
                    disabled={viewMode}
                    error={formErrors.resourceType}
                  >
                    <MenuItem value="Water Supply Trucks">Water Supply Trucks</MenuItem>
                    <MenuItem value="Fuel (Bunkering)">Fuel (Bunkering)</MenuItem>
                    <MenuItem value="Power Supply (Shore Power)">Power Supply (Shore Power)</MenuItem>
                    <MenuItem value="Waste Removal">Waste Removal</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Conditional Form Fields based on Resource Type */}
              {formData.resourceType === 'Water Supply Trucks' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Water Quantity (Liters)"
                    name="waterLiters"
                    type="number"
                    value={formData.waterLiters}
                    onChange={handleInputChange}
                    disabled={viewMode}
                    error={formErrors.waterLiters}
                  />
                </Grid>
              )}

              {formData.resourceType === 'Fuel (Bunkering)' && (
                <>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Fuel Amount (Liters)"
                      name="fuelAmount"
                      type="number"
                      value={formData.fuelAmount}
                      onChange={handleInputChange}
                      disabled={viewMode}
                      error={formErrors.fuelAmount}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Fuel Type</InputLabel>
                      <Select
                        name="fuelType"
                        value={formData.fuelType}
                        onChange={handleInputChange}
                        disabled={viewMode}
                        error={formErrors.fuelType}
                      >
                        <MenuItem value="Marine Diesel">Marine Diesel</MenuItem>
                        <MenuItem value="Heavy Fuel Oil">Heavy Fuel Oil</MenuItem>
                        <MenuItem value="LNG">LNG</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}

              {formData.resourceType === 'Power Supply (Shore Power)' && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Power Requirement (kW)"
                      name="powerKw"
                      type="number"
                      value={formData.powerKw}
                      onChange={handleInputChange}
                      disabled={viewMode}
                      error={formErrors.powerKw}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <DateTimePicker
                      label="Start Time"
                      value={formData.startTime}
                      onChange={(newValue) => handleDateChange('startTime', newValue)}
                      disabled={viewMode}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <DateTimePicker
                      label="End Time"
                      value={formData.endTime}
                      onChange={(newValue) => handleDateChange('endTime', newValue)}
                      disabled={viewMode}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>
                </>
              )}

              {formData.resourceType === 'Waste Removal' && (
                <>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Waste Type</InputLabel>
                      <Select
                        name="wasteType"
                        value={formData.wasteType}
                        onChange={handleInputChange}
                        disabled={viewMode}
                        error={formErrors.wasteType}
                      >
                        <MenuItem value="Hazardous">Hazardous</MenuItem>
                        <MenuItem value="Non-Hazardous">Non-Hazardous</MenuItem>
                        <MenuItem value="Organic">Organic</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Waste Volume (m³)"
                      name="wasteVolume"
                      type="number"
                      value={formData.wasteVolume}
                      onChange={handleInputChange}
                      disabled={viewMode}
                      error={formErrors.wasteVolume}
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <DateTimePicker
                  label="Preferred Time"
                  value={formData.preferredTime}
                  onChange={(newValue) => handleDateChange('preferredTime', newValue)}
                  disabled={viewMode}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={viewMode}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>
              {viewMode ? 'Close' : 'Cancel'}
            </Button>
            {!viewMode && (
              <Button 
                onClick={handleSubmit} 
                variant="contained" 
                color="primary"
              >
                {editMode ? 'Update' : 'Submit'}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Alert Snackbar */}
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
    </LocalizationProvider>
  );
};

export default AdHocResourceRequest;