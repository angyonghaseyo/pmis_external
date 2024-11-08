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
import { db, storage } from "./firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  doc,
  addDoc,
  setDoc,
  getDocs,
  deleteDoc,
  collection,
} from "firebase/firestore";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import BookingSteps from "./BookingSteps"; // Adjust the path based on where BookingSteps is located
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CancelIcon from "@mui/icons-material/Cancel";
import CustomsTradeManager from "./CustomsTradeManager";

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

      // Check if the response is successful and has result
      if (data.status === "success" && data.result) {
        // Since we get a single result object instead of an array
        const formattedOption = {
          code: data.result.code,
          description: data.result.description,
          digits: data.result.digits, // Optional: if you want to store this info
        };

        setOptions([formattedOption]); // Wrap in array since Autocomplete expects an array
      } else {
        setOptions([]); // No results
      }
    } catch (error) {
      console.error("Error fetching HS codes:", error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce the fetch function to prevent too many API calls
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
            paddingRight: "8px", // Add some padding to ensure ellipsis is visible
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
    cargo: {}, // Store cargo as a map
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

  // Fetch booking data from Firebase
  useEffect(() => {
    const fetchBookings = async () => {
      const querySnapshot = await getDocs(collection(db, "bookings"));
      const bookingsArray = querySnapshot.docs.map((doc) => ({
        bookingId: doc.id,
        ...doc.data(),
      }));
      setBookingData(bookingsArray);
    };
    fetchBookings();
  }, []);

  useEffect(() => {
    const fetchVesselVisits = async () => {
      const querySnapshot = await getDocs(
        collection(db, "vesselVisitRequests")
      );
      const visits = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVesselVisits(visits);
    };
    fetchVesselVisits();
  }, []);

  const handleVesselChange = (event) => {
    const selectedVesselName = event.target.value;
    setSelectedVessel(selectedVesselName);

    // Find the selected vessel's voyages
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
        cargo: booking.cargo || {}, // Ensure existing cargo data is loaded
      });
      setEditingId(booking.bookingId);
    } else {
      setFormData({
        cargo: {}, // Reset cargo as an empty map
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

  // Handle form submission
  const handleSubmit = async () => {
    console.log("Submitting formData: ", formData); //debugging
    const newBooking = {
      ...formData, // Contains cargo as a map
      userEmail: user.email,
    };

    try {
      if (editingId) {
        const docRef = doc(db, "bookings", editingId);
        await setDoc(docRef, newBooking);
      } else {
        const docRef = await addDoc(collection(db, "bookings"), newBooking);
        await setDoc(docRef, { bookingId: docRef.id }, { merge: true });
        setBookingData((prev) => [
          ...prev,
          { ...newBooking, bookingId: docRef.id },
        ]);
      }
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving booking:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const docRef = doc(db, "bookings", id);
      await deleteDoc(docRef);
      setBookingData((prev) =>
        prev.filter((booking) => booking.bookingId !== id)
      );
    } catch (error) {
      console.error("Error deleting booking:", error);
    }
  };

  // CARGO HANDLING
  // Add new cargo item
  const handleAddCargo = () => {
    const cargoId = Date.now().toString(); // Generate a unique ID based on timestamp
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
          isContainerRented: false, // New field for step 1
          isTruckBooked: false, // New field for step 2
          isCustomsCleared: false, // New field for step 3
          isDocumentsChecked: false, // New field for step 4
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

  // Remove cargo item
  const handleRemoveCargo = (cargoId) => {
    const updatedCargo = { ...formData.cargo };
    delete updatedCargo[cargoId]; // Remove cargo by key
    setFormData((prev) => ({ ...prev, cargo: updatedCargo }));
  };

  const validateHsCode = (hsCode) => {
    // HS Code format is typically 6-10 digits
    const hsCodeRegex = /^\d{6,10}$/;
    return hsCodeRegex.test(hsCode);
  };

  // Update cargo item
  const handleCargoChange = (cargoId, field, value) => {
    if (field === "hsCode") {
      setFormData((prev) => ({
        ...prev,
        cargo: {
          ...prev.cargo,
          [cargoId]: {
            ...prev.cargo[cargoId],
            hsCode: value.code, //denzel
            hsCodeDescription: value.description,
            hsCodeValid: validateHsCode(value), //denzel it could be just code
          },
        },
      }));
    } else {
      // Original implementation for other fields
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
                          label={
                            uploadStatus[cargoId]?.[type] ||
                            (formData.cargo[cargoId]?.documents?.[type]
                              ? "success"
                              : null)
                          }
                          color={
                            uploadStatus[cargoId]?.[type]
                              ? getStatusColor(uploadStatus[cargoId][type])
                              : "success"
                          }
                          icon={
                            uploadStatus[cargoId]?.[type] ? (
                              getStatusIcon(uploadStatus[cargoId][type])
                            ) : (
                              <CheckCircleIcon fontSize="small" />
                            )
                          }
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

  const handleDocumentUpload = async (cargoId, documentType, file) => {
    if (!file) return;

    try {
      setUploadStatus((prev) => ({
        ...prev,
        [cargoId]: { ...prev[cargoId], [documentType]: "uploading" },
      }));

      const storageRef = ref(
        storage,
        `documents/${cargoId}/${documentType}_${file.name}`
      );
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const updatedFormData = {
        ...formData,
        cargo: {
          ...formData.cargo,
          [cargoId]: {
            ...formData.cargo[cargoId],
            documents: {
              ...formData.cargo[cargoId].documents,
              [documentType]: downloadURL,
            },
          },
        },
      };

      const allDocsUploaded =
        updatedFormData.cargo[cargoId].documents.vgm &&
        updatedFormData.cargo[cargoId].documents.advancedDeclaration &&
        updatedFormData.cargo[cargoId].documents.exportDocument;

      updatedFormData.cargo[cargoId].isDocumentsChecked = allDocsUploaded
        ? true
        : false;

      setFormData(updatedFormData);

      if (editingId) {
        setBookingData((prevBookingData) =>
          prevBookingData.map((booking) =>
            booking.bookingId === editingId
              ? { ...booking, cargo: updatedFormData.cargo }
              : booking
          )
        );
      }

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
      {/* Table to display bookings */}
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

                {/* Accordion Row */}
                <TableRow>
                  <TableCell
                    colSpan={7}
                    style={{ paddingBottom: 0, paddingTop: 0 }}
                  >
                    <Accordion>
                      <AccordionSummary
                        expandIcon={<ExpandMore />}
                        style={{
                          border: "none",
                          boxShadow: "none",
                          padding: 0,
                        }}
                      >
                        <Typography
                          style={{ border: "none", boxShadow: "none" }}
                        >
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
                    <br></br>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
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

            {/* Cargo Details */}
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
                          handleCargoChange(
                            cargoId,
                            "description",
                            e.target.value
                          )
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
                          handleCargoChange(
                            cargoId,
                            "weightPerUnit",
                            e.target.value
                          )
                        }
                        required
                      />
                    </Grid>

                    {/* <Grid item xs={12}>
                      <Button
                        variant="contained"
                        color={
                          cargoItem.isCustomsCleared ? "success" : "primary"
                        }
                        onClick={() =>
                          handleCustomsClearance(cargoId, cargoItem)
                        }
                        disabled={
                          !cargoItem.hsCode || cargoItem.isCustomsCleared
                        }
                        fullWidth
                      >
                        {cargoItem.isCustomsCleared
                          ? "Customs Cleared"
                          : "Process Customs Clearance"}
                      </Button>
                    </Grid> */}
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth>
                        <InputLabel>Cargo Type</InputLabel>
                        <Select
                          value={cargoItem.cargoType}
                          onChange={(e) =>
                            handleCargoChange(
                              cargoId,
                              "cargoType",
                              e.target.value
                            )
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
