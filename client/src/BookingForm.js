import React, { useState, useEffect, useCallback } from "react";
import debounce from "lodash/debounce";
import {
  Box,
  Button,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Grid,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stack,
  Chip,
  LinearProgress,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import BookingSteps from "./BookingSteps";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CancelIcon from "@mui/icons-material/Cancel";
import { 
  getBookings, 
  createBooking, 
  updateBooking, 
  deleteBooking, 
  uploadBookingDocument, 
  getVesselVisits 
} from './services/api';

const HSCodeLookup = ({ value, onChange, error, helperText }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedCode, setSelectedCode] = useState(value);

  const fetchHSCodes = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) return;

    try {
      setLoading(true);
      const url = `https://hs-code-harmonized-system.p.rapidapi.com/code?term=${searchTerm}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "x-rapidapi-key":
            "a0c2bcb05emsh98328b2714cec53p1fb0e5jsn2cbc002f4ab3",
          "x-rapidapi-host": "hs-code-harmonized-system.p.rapidapi.com",
        },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();

      if (data.status === "success" && data.result) {
        const formattedOption = {
          code: data.result.code,
          description: data.result.description,
          digits: data.result.digits,
        };

        setOptions([formattedOption]);
      } else {
        setOptions([]);
      }
    } catch (error) {
      console.error("Error fetching HS codes:", error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetch = useCallback(
    debounce((searchTerm) => fetchHSCodes(searchTerm), 300),
    []
  );

  const handleInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);
    debouncedFetch(newInputValue);
  };

  const handleSelect = (event, newValue) => {
    setSelectedCode(newValue);
    if (newValue) {
      onChange({
        code: newValue.code,
        description: newValue.description,
      });
    }
  };

  const handleOpenDialog = () => setOpen(true);
  const handleCloseDialog = () => setOpen(false);

  return (
    <Box>
      <TextField
        fullWidth
        label="HS Code"
        value={value ? `${value.code} - ${value.description}` : ""}
        onClick={handleOpenDialog}
        error={error}
        helperText={helperText}
        InputProps={{
          readOnly: true,
        }}
        sx={{
          "& .MuiInputBase-input": {
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            paddingRight: "8px",
          },
        }}
      />
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Search HS Code</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Enter product description or HS code to search
          </Typography>

          <Autocomplete
            fullWidth
            options={options}
            loading={loading}
            value={selectedCode}
            onChange={handleSelect}
            inputValue={inputValue}
            onInputChange={handleInputChange}
            getOptionLabel={(option) =>
              `${option.code} - ${option.description}`
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search HS Codes"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box>
                  <Typography variant="subtitle2">{option.code}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {option.description}
                  </Typography>
                </Box>
              </li>
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleCloseDialog}
            variant="contained"
            disabled={!selectedCode}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const BookingForm = ({ user }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    cargo: {},
    pickupDate: "",
    portLoading: "",
    portDestination: "",
    cutoffDeadline: "",
    eta: "",
    etd: "",
    freeTime: 0,
    bookingId: "",
  });
  const [bookingData, setBookingData] = useState([]);
  const [uploadStatus, setUploadStatus] = useState({});
  const [vesselVisits, setVesselVisits] = useState([]);
  const [selectedVessel, setSelectedVessel] = useState("");
  const [availableVoyages, setAvailableVoyages] = useState([]);

  const cargoTypes = [
    "General Cargo",
    "Hazardous Materials",
    "Perishable Goods",
    "Electronics",
    "Textiles",
    "Machinery",
    "Automotive Parts",
    "Chemical Products",
    "Food Products",
    "Raw Materials",
  ];

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const bookings = await getBookings();
        setBookingData(bookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };
    fetchBookings();
  }, []);

  useEffect(() => {
    const fetchVesselVisits = async () => {
      try {
        const visits = await getVesselVisits();
        setVesselVisits(visits);
      } catch (error) {
        console.error('Error fetching vessel visits:', error);
      }
    };
    fetchVesselVisits();
  }, []);

  const handleVesselChange = (event) => {
    const selectedVesselName = event.target.value;
    setSelectedVessel(selectedVesselName);

    const selectedVesselData = vesselVisits.find(
      (visit) => visit.vesselName === selectedVesselName
    );
    setAvailableVoyages(selectedVesselData?.voyages || []);

    setFormData((prev) => ({
      ...prev,
      vesselName: selectedVesselName,
      voyageNumber: "",
      portLoading: "",
      portDestination: "",
    }));
  };

  const handleVoyageChange = (event) => {
    const selectedVoyageNumber = event.target.value;
    const selectedVoyage = availableVoyages.find(
      (v) => v.voyageNumber === selectedVoyageNumber
    );

    setFormData((prev) => ({
      ...prev,
      voyageNumber: selectedVoyageNumber,
      portLoading: selectedVoyage?.departurePort || "",
      portDestination: selectedVoyage?.arrivalPort || "",
    }));
  };

  const handleOpenDialog = (booking = null) => {
    if (booking) {
      setFormData({
        ...booking,
        cargo: booking.cargo || {},
      });
      setEditingId(booking.bookingId);
    } else {
      setFormData({
        cargo: {},
        pickupDate: "",
        portLoading: "",
        portDestination: "",
        cutoffDeadline: "",
        eta: "",
        etd: "",
        freeTime: 0,
        bookingId: "",
      });
      setEditingId(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const newBooking = {
      ...formData,
      userEmail: user.email,
    };

    try {
      if (editingId) {
        const updatedBooking = await updateBooking(editingId, newBooking);
        setBookingData(prevBookings =>
          prevBookings.map(booking =>
            booking.bookingId === editingId ? updatedBooking : booking
          )
        );
      } else {
        const createdBooking = await createBooking(newBooking);
        setBookingData(prev => [...prev, createdBooking]);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving booking:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteBooking(id);
      setBookingData(prev => prev.filter(booking => booking.bookingId !== id));
    } catch (error) {
      console.error('Error deleting booking:', error);
    }
  };

  const handleAddCargo = () => {
    const cargoId = Date.now().toString();
    setFormData((prev) => ({
      ...prev,
      cargo: {
        ...prev.cargo,
        [cargoId]: {
          name: "",
          description: "",
          unit: "",
          quantity: "",
          weightPerUnit: "",
          cargoType: "",
          isContainerRented: false,
          isTruckBooked: false,
          isCustomsCleared: false,
          isDocumentsChecked: false,
          documents: {
            vgm: null,
            advancedDeclaration: null,
            exportDocument: null,
          },
          documentStatus: {
            veterinaryHealthCertificate: {
              name: "Veterinary Health Certificate",
              status: "PENDING",
              agencyType: "VETERINARY",
              agencyName: "National Veterinary Authority",
              lastUpdated: null,
              comments: null,
              documentUrl: null,
            },
            animalWelfareCertification: {
              name: "Animal Welfare Certification",
              status: "PENDING",
              agencyType: "WELFARE",
              agencyName: "Animal Welfare Board",
              lastUpdated: null,
              comments: null,
              documentUrl: null,
            },
            citesPermit: {
              name: "CITES Permit",
              status: "PENDING",
              agencyType: "SECURITY",
              agencyName: "CITES Authority",
              lastUpdated: null,
              comments: null,
              documentUrl: null,
            },
            quarantineClearance: {
              name: "Quarantine Clearance Certificate",
              status: "PENDING",
              agencyType: "VETERINARY",
              agencyName: "Quarantine Department",
              lastUpdated: null,
              comments: null,
              documentUrl: null,
            },
            transportDeclaration: {
              name: "Live Animal Transport Declaration",
              status: "PENDING",
              agencyType: "TRANSPORT",
              agencyName: "Transport Authority",
              lastUpdated: null,
              comments: null,
              documentUrl: null,
            },
            exportLicense: {
              name: "Export License",
              status: "PENDING",
              agencyType: "CUSTOMS",
              agencyName: "Customs Department",
              lastUpdated: null,
              comments: null,
              documentUrl: null,
            },
            commercialInvoice: {
              name: "Commercial Invoice",
              status: "PENDING",
              agencyType: "CUSTOMS",
              agencyName: "Customs Department",
              lastUpdated: null,
              comments: null,
              documentUrl: null,
            },
          },
        },
      },
    }));
  };

  const handleRemoveCargo = (cargoId) => {
    const updatedCargo = { ...formData.cargo };
    delete updatedCargo[cargoId];
    setFormData((prev) => ({ ...prev, cargo: updatedCargo }));
  };

  const validateHsCode = (hsCode) => {
    const hsCodeRegex = /^\d{6,10}$/;
    return hsCodeRegex.test(hsCode);
  };

  const handleCargoChange = (cargoId, field, value) => {
    if (field === "hsCode") {
      setFormData((prev) => ({
        ...prev,
        cargo: {
          ...prev.cargo,
          [cargoId]: {
            ...prev.cargo[cargoId],
            hsCode: value.code,
            hsCodeDescription: value.description,
            hsCodeValid: validateHsCode(value),
          },
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        cargo: {
          ...prev.cargo,
          [cargoId]: { ...prev.cargo[cargoId], [field]: value },
        },
      }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "success";
      case "uploading":
        return "primary";
      case "error":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
        case "success":
            return <CheckCircleIcon fontSize="small" />;
        case "error":
            return <ErrorIcon fontSize="small" />;
        default:
            return <UploadFileIcon fontSize="small" />;
    }
};

const handleDocumentUpload = async (cargoId, documentType, file) => {
    if (!file) return;

    try {
        setUploadStatus((prev) => ({
            ...prev,
            [cargoId]: { ...prev[cargoId], [documentType]: "uploading" },
        }));

        const result = await uploadBookingDocument(editingId, cargoId, documentType, file);

        const updatedFormData = {
            ...formData,
            cargo: {
                ...formData.cargo,
                [cargoId]: {
                    ...formData.cargo[cargoId],
                    documents: {
                        ...formData.cargo[cargoId].documents,
                        [documentType]: result.url
                    }
                }
            }
        };

        const allDocsUploaded =
            updatedFormData.cargo[cargoId].documents.vgm &&
            updatedFormData.cargo[cargoId].documents.advancedDeclaration &&
            updatedFormData.cargo[cargoId].documents.exportDocument;

        updatedFormData.cargo[cargoId].isDocumentsChecked = allDocsUploaded;

        setFormData(updatedFormData);
        setUploadStatus((prev) => ({
            ...prev,
            [cargoId]: { ...prev[cargoId], [documentType]: "success" },
        }));
    } catch (error) {
        console.error("Error uploading document:", error);
        setUploadStatus((prev) => ({
            ...prev,
            [cargoId]: { ...prev[cargoId], [documentType]: "error" },
        }));
    }
};

const renderDocumentUpload = (cargoId) => {
    const documents = [
        { type: "vgm", label: "Verified Gross Mass (VGM)" },
        { type: "advancedDeclaration", label: "Advanced Declaration" },
        { type: "exportDocument", label: "Export Document" },
    ];

    return (
        <Grid item xs={12}>
            <Paper sx={{ p: 2, mt: 2, bgcolor: "background.default" }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                    Required Documents
                </Typography>
                {!formData.cargo[cargoId].isDocumentsChecked && (
                    <Alert
                        severity="error"
                        sx={{ mt: 2, mb: 2, borderRadius: "8px" }}
                        icon={<CancelIcon fontSize="small" />}
                    >
                        Please Submit All Documents
                    </Alert>
                )}
                {formData.cargo[cargoId].isDocumentsChecked && (
                    <Alert
                        severity="success"
                        sx={{ mt: 2, mb: 2, borderRadius: "8px" }}
                        icon={<CheckCircleIcon fontSize="small" />}
                    >
                        All required documents have been uploaded and verified
                    </Alert>
                )}
                <Stack spacing={2}>
                    {documents.map(({ type, label }) => (
                        <Box key={type}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        {label}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <input
                                            accept="application/pdf"
                                            style={{ display: "none" }}
                                            id={`${type}-upload-${cargoId}`}
                                            type="file"
                                            onChange={(e) =>
                                                handleDocumentUpload(cargoId, type, e.target.files[0])
                                            }
                                        />
                                        <label
                                            htmlFor={`${type}-upload-${cargoId}`}
                                            style={{ width: "100%" }}
                                        >
                                            <Button
                                                variant="outlined"
                                                component="span"
                                                startIcon={
                                                    formData.cargo[cargoId]?.documents?.[type] ? (
                                                        <CheckCircleIcon fontSize="small" />
                                                    ) : (
                                                        <UploadFileIcon fontSize="small" />
                                                    )
                                                }
                                                fullWidth
                                                color={
                                                    formData.cargo[cargoId]?.documents?.[type]
                                                        ? "success"
                                                        : "primary"
                                                }
                                                size="small"
                                                sx={{
                                                    borderRadius: "8px",
                                                    textTransform: "none",
                                                    minHeight: "36px",
                                                }}
                                            >
                                                {formData.cargo[cargoId]?.documents?.[type]
                                                    ? "Replace Document"
                                                    : "Upload Document"}
                                            </Button>
                                        </label>
                                        {uploadStatus[cargoId]?.[type] && (
                                            <Chip
                                                size="small"
                                                label={uploadStatus[cargoId]?.[type]}
                                                color={getStatusColor(uploadStatus[cargoId][type])}
                                                icon={getStatusIcon(uploadStatus[cargoId][type])}
                                            />
                                        )}
                                    </Stack>
                                    {uploadStatus[cargoId]?.[type] === "uploading" && (
                                        <LinearProgress sx={{ mt: 1 }} />
                                    )}
                                </Grid>
                            </Grid>
                        </Box>
                    ))}
                </Stack>
            </Paper>
        </Grid>
    );
};

return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
        >
            <Typography variant="h4">Bookings</Typography>
            <Button
                variant="contained"
                color="primary"
                onClick={() => handleOpenDialog()}
            >
                Create Booking
            </Button>
        </Box>

        <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Booking ID</TableCell>
                        <TableCell>Port of Loading</TableCell>
                        <TableCell>Port of Destination</TableCell>
                        <TableCell>Cut-off Deadline</TableCell>
                        <TableCell>ETA</TableCell>
                        <TableCell>ETD</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {bookingData.map((booking) => (
                        <React.Fragment key={booking.bookingId}>
                            <TableRow>
                                <TableCell style={{ width: "100px", borderBottom: "none" }}>
                                    {booking.bookingId}
                                </TableCell>
                                <TableCell style={{ borderBottom: "none" }}>
                                    {booking.portLoading}
                                </TableCell>
                                <TableCell style={{ borderBottom: "none" }}>
                                    {booking.portDestination}
                                </TableCell>
                                <TableCell style={{ borderBottom: "none" }}>
                                    {booking.cutoffDeadline}
                                </TableCell>
                                <TableCell style={{ borderBottom: "none" }}>
                                    {booking.eta}
                                </TableCell>
                                <TableCell style={{ borderBottom: "none" }}>
                                    {booking.etd}
                                </TableCell>
                                <TableCell style={{ borderBottom: "none" }}>
                                    <IconButton
                                        onClick={() => handleOpenDialog(booking)}
                                        color="primary"
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => handleDelete(booking.bookingId)}
                                        color="secondary"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>

                            <TableRow>
                                <TableCell colSpan={7} style={{ paddingBottom: 0, paddingTop: 0 }}>
                                    <Accordion>
                                        <AccordionSummary expandIcon={<ExpandMore />}>
                                            <Typography>
                                                Additional information for{" "}
                                                <span style={{ color: "purple" }}>
                                                    {booking.bookingId}
                                                </span>
                                            </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <Grid container spacing={2}>
                                                <Grid item xs={6}>
                                                    <Typography>
                                                        <strong>Pickup Date:</strong> {booking.pickupDate}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography>
                                                        <strong>Free Time (days):</strong>{" "}
                                                        {booking.freeTime}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography>
                                                        <strong>Port of Loading:</strong>{" "}
                                                        {booking.portLoading}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography>
                                                        <strong>Port of Destination:</strong>{" "}
                                                        {booking.portDestination}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography>
                                                        <strong>ETA:</strong> {booking.eta}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography>
                                                        <strong>ETD:</strong> {booking.etd}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography>
                                                        <strong>Cut-off Deadline:</strong>{" "}
                                                        {booking.cutoffDeadline}
                                                    </Typography>
                                                </Grid>

                                                <Grid item xs={12}>
                                                    <Typography variant="h6" gutterBottom>
                                                        Cargo Details
                                                    </Typography>
                                                    {booking.cargo &&
                                                        Object.entries(booking.cargo).map(
                                                            ([key, cargoItem]) => (
                                                                <Paper key={key} sx={{ p: 2, mb: 2 }}>
                                                                    <Typography>
                                                                        <strong>Cargo Item {key}:</strong>
                                                                    </Typography>
                                                                    <Typography>
                                                                        Name: {cargoItem.name}
                                                                    </Typography>
                                                                    <Typography>
                                                                        Quantity: {cargoItem.quantity}{" "}
                                                                        {cargoItem.unit || "pieces"}
                                                                    </Typography>
                                                                    <Typography>
                                                                        Description: {cargoItem.description}
                                                                    </Typography>
                                                                    <Typography>
                                                                        Weight per Unit: {cargoItem.weightPerUnit}{" "}
                                                                        kg
                                                                    </Typography>
                                                                    <Typography>
                                                                        Cargo Type: {cargoItem.cargoType}
                                                                    </Typography>
                                                                    <Typography>
                                                                        <strong>HS Code:</strong>{" "}
                                                                        {cargoItem.hsCode}
                                                                    </Typography>
                                                                    <BookingSteps
                                                                        isContainerRented={
                                                                            cargoItem.isContainerRented
                                                                        }
                                                                        isTruckBooked={cargoItem.isTruckBooked}
                                                                        isCustomsCleared={
                                                                            cargoItem.isCustomsCleared
                                                                        }
                                                                        isDocumentsChecked={
                                                                            cargoItem.isDocumentsChecked
                                                                        }
                                                                    />
                                                                </Paper>
                                                            )
                                                        )}
                                                </Grid>
                                            </Grid>
                                        </AccordionDetails>
                                    </Accordion>
                                    <br />
                                </TableCell>
                            </TableRow>
                        </React.Fragment>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
            <DialogTitle>
                {editingId ? `Edit Booking ID: ${editingId}` : "Create Booking"}
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <FormControl fullWidth required>
                            <InputLabel>Vessel Name</InputLabel>
                            <Select
                                value={selectedVessel}
                                onChange={handleVesselChange}
                                label="Vessel Name"
                            >
                                {vesselVisits.map((visit) => (
                                    <MenuItem key={visit.vesselName} value={visit.vesselName}>
                                        {visit.vesselName}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                        <FormControl fullWidth required disabled={!selectedVessel}>
                            <InputLabel>Voyage Number</InputLabel>
                            <Select
                                value={formData.voyageNumber || ""}
                                onChange={handleVoyageChange}
                                label="Voyage Number"
                            >
                                {availableVoyages.map((voyage) => (
                                    <MenuItem
                                        key={voyage.voyageNumber}
                                        value={voyage.voyageNumber}
                                    >
                                        {voyage.voyageNumber} ({voyage.departurePort} →{" "}
                                        {voyage.arrivalPort})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={6}>
                        <TextField
                            label="Port of Loading"
                            name="portLoading"
                            value={formData.portLoading}
                            onChange={handleChange}
                            fullWidth
                            required
                            disabled
                        />
                    </Grid>
                    <Grid item xs={6}>
                            <TextField
                                label="Port of Destination"
                                name="portDestination"
                                value={formData.portDestination}
                                onChange={handleChange}
                                fullWidth
                                required
                                disabled
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Pickup Date"
                                name="pickupDate"
                                type="date"
                                value={formData.pickupDate}
                                onChange={handleChange}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                required
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Free Time (days)"
                                name="freeTime"
                                type="number"
                                value={formData.freeTime}
                                onChange={handleChange}
                                fullWidth
                                required
                            />
                        </Grid>

                        <Grid item xs={6}>
                            <TextField
                                label="ETA"
                                name="eta"
                                type="datetime-local"
                                value={formData.eta}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                required
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="ETD"
                                name="etd"
                                type="datetime-local"
                                value={formData.etd}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                required
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Cut-off Deadline"
                                name="cutoffDeadline"
                                type="datetime-local"
                                value={formData.cutoffDeadline}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                required
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Cargo Details
                            </Typography>
                        </Grid>
                        {Object.entries(formData.cargo).map(([cargoId, cargoItem]) => (
                            <Grid item xs={12} key={cargoId}>
                                <Paper sx={{ p: 2, position: "relative" }}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <Box
                                                display="flex"
                                                justifyContent="space-between"
                                                alignItems="center"
                                            >
                                                <Typography variant="subtitle1">
                                                    Cargo ID: {cargoId}
                                                </Typography>
                                                {Object.keys(formData.cargo).length > 1 && (
                                                    <IconButton
                                                        onClick={() => handleRemoveCargo(cargoId)}
                                                        size="small"
                                                        color="error"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Name"
                                                value={cargoItem.name}
                                                onChange={(e) =>
                                                    handleCargoChange(cargoId, "name", e.target.value)
                                                }
                                                required
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <HSCodeLookup
                                                value={
                                                    cargoItem.hsCode
                                                        ? {
                                                            code: cargoItem.hsCode,
                                                            description: cargoItem.hsCodeDescription,
                                                        }
                                                        : null
                                                }
                                                onChange={(value) =>
                                                    handleCargoChange(cargoId, "hsCode", value)
                                                }
                                                editMode={!!editingId}
                                                helperText="Search by product description or code"
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Description"
                                                value={cargoItem.description}
                                                onChange={(e) =>
                                                    handleCargoChange(cargoId, "description", e.target.value)
                                                }
                                                multiline
                                                rows={4}
                                                required
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <TextField
                                                fullWidth
                                                label="Quantity"
                                                type="number"
                                                value={cargoItem.quantity}
                                                onChange={(e) =>
                                                    handleCargoChange(cargoId, "quantity", e.target.value)
                                                }
                                                required
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <FormControl fullWidth>
                                                <InputLabel>Unit</InputLabel>
                                                <Select
                                                    value={cargoItem.unit || "pieces"}
                                                    onChange={(e) =>
                                                        handleCargoChange(cargoId, "unit", e.target.value)
                                                    }
                                                    label="Unit"
                                                    required
                                                >
                                                    <MenuItem value="pieces">Pieces</MenuItem>
                                                    <MenuItem value="boxes">Boxes</MenuItem>
                                                    <MenuItem value="bottles">Bottles</MenuItem>
                                                    <MenuItem value="ampoules">Ampoules</MenuItem>
                                                    <MenuItem value="kg">Kilograms (kg)</MenuItem>
                                                    <MenuItem value="g">Grams (g)</MenuItem>
                                                    <MenuItem value="liters">Liters</MenuItem>
                                                    <MenuItem value="milliliters">Milliliters</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <TextField
                                                fullWidth
                                                label="Weight per Unit (kg)"
                                                type="number"
                                                value={cargoItem.weightPerUnit}
                                                onChange={(e) =>
                                                    handleCargoChange(cargoId, "weightPerUnit", e.target.value)
                                                }
                                                required
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <FormControl fullWidth>
                                                <InputLabel>Cargo Type</InputLabel>
                                                <Select
                                                    value={cargoItem.cargoType}
                                                    onChange={(e) =>
                                                        handleCargoChange(cargoId, "cargoType", e.target.value)
                                                    }
                                                    label="Cargo Type"
                                                    required
                                                >
                                                    {cargoTypes.map((type) => (
                                                        <MenuItem key={type} value={type}>
                                                            {type}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                    </Grid>
                                    {editingId && renderDocumentUpload(cargoId)}
                                </Paper>
                            </Grid>
                        ))}

                        <Grid item xs={12}>
                            <Button
                                startIcon={<AddCircleOutlineIcon />}
                                onClick={handleAddCargo}
                                variant="outlined"
                                fullWidth
                            >
                                Add Cargo Item
                            </Button>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="secondary">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} color="primary" variant="contained">
                        Submit
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default BookingForm;