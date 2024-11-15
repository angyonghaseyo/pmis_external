import React, { useState, useEffect } from "react";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Input,
  DialogActions,
  Button,
  Snackbar,
} from "@mui/material";
import {
  CheckCircle,
  Warning,
  PendingActions,
  Pets,
  LocalFlorist,
  Medication,
  InfoOutlined,
  LocalHospital,
  Security,
  Assessment,
  LocalShipping,
} from "@mui/icons-material";
import {
  getBookings,
  getBookingById,
  uploadBookingDocument,
} from "./services/api";
import { validateDocumentWithOCR, DocumentKeywords } from "./OCRValidation.js";

// HS Code Categories constants
const HSCodeCategories = {
  EXPLOSIVES_AND_PYROTECHNICS: {
    chapter: "36",
    description: "Explosives and Pyrotechnics",
    processingOrder: [
      "DANGEROUS_GOODS_CLASSIFICATION",
      "SAFETY_DATA_VERIFICATION",
      "EXPLOSIVE_LICENSE_CHECK",
      "PACKAGING_CERTIFICATION",
      "TRANSPORT_SAFETY_APPROVAL",
      "CUSTOMS_DECLARATION",
      "FINAL_SAFETY_INSPECTION",
    ],
    requiredDocuments: [
      "Dangerous Goods Declaration",
      "Safety Data Sheet",
      "Explosives License",
      "UN Classification Certificate",
      "Packaging Certification",
      "Transport Safety Permit",
      "Export License",
      "Commercial Invoice",
      "Packing List",
    ],
    validations: {
      hazardClassification: true,
      packagingCompliance: true,
      handlingInstructions: true,
      emergencyProcedures: true,
    },
  },
  FRESH_FRUITS: {
    chapter: "08",
    description: "Fresh Fruits",
    processingOrder: [
      "PHYTOSANITARY_INSPECTION",
      "PESTICIDE_TESTING",
      "COLD_CHAIN_VERIFICATION",
      "PACKAGING_INSPECTION",
      "CUSTOMS_DECLARATION",
      "FINAL_QUALITY_CHECK",
    ],
    requiredDocuments: [
      "Phytosanitary Certificate",
      "Pesticide Residue Test Report",
      "Cold Chain Compliance Certificate",
      "Packaging Declaration",
      "Export License",
      "Certificate of Origin",
      "Commercial Invoice",
      "Packing List",
    ],
    validations: {
      pesticideLevel: true,
      coldChainMaintenance: true,
      packagingStandards: true,
      shelfLife: true,
    },
  },
  PHARMACEUTICALS: {
    chapter: "30",
    description: "Pharmaceutical Products",
    processingOrder: [
      "GMP_VERIFICATION",
      "DRUG_REGISTRATION_CHECK",
      "CONTROLLED_SUBSTANCE_CHECK",
      "STABILITY_VERIFICATION",
      "CUSTOMS_DECLARATION",
      "FINAL_QUALITY_ASSURANCE",
    ],
    requiredDocuments: [
      "GMP Certificate",
      "Drug Registration Certificate",
      "Export License for Pharmaceuticals",
      "Certificate of Pharmaceutical Product (CPP)",
      "Batch Analysis Certificate",
      "Stability Study Report",
      "Commercial Invoice",
      "Packing List",
    ],
    validations: {
      controlledSubstance: true,
      storageConditions: true,
      expiryDates: true,
      batchTracking: true,
    },
  },
};

const ProcessStatus = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  REJECTED: "REJECTED",
};

const CategoryIcon = ({ category }) => {
  switch (category) {
    case 'EXPLOSIVES_AND_PYROTECHNICS':
      return <Warning />; 
    case "FRESH_FRUITS":
      return <LocalFlorist />;
    case "PHARMACEUTICALS":
      return <Medication />;
    default:
      return null;
  }
};

const StatusChip = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case ProcessStatus.COMPLETED:
        return "success";
      case ProcessStatus.IN_PROGRESS:
        return "primary";
      case ProcessStatus.REJECTED:
        return "error";
      default:
        return "default";
    }
  };

  const displayStatus = status ? status.replace(/_/g, " ") : "NOT STARTED";

  return <Chip label={displayStatus} color={getStatusColor()} size="small" />;
};
const UploadDialog = ({ open, onClose, onUpload, documentType }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Upload {documentType}</DialogTitle>
    <DialogContent>
      <Input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            onUpload(file);
          }
        }}
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
    </DialogActions>
  </Dialog>
);

const DocumentListItem = ({ doc, status, onUploadClick }) => {
  const uploadableDocuments = [
    "Export License",
    "Certificate of Origin",
    "Commercial Invoice",
    "Packing List",
  ];

  const isUploadable = uploadableDocuments.includes(doc);
  const currentStatus = status?.status || "NOT_STARTED";
  const isClickable = isUploadable && currentStatus === "NOT_STARTED";

  return (
    <ListItem>
      <ListItemIcon>
        <PendingActions />
      </ListItemIcon>
      <ListItemText primary={doc} />
      <Chip
        label={currentStatus.replace(/_/g, " ")}
        color={getStatusColor(currentStatus)}
        onClick={() => isClickable && onUploadClick(doc)}
        sx={{
          cursor: isClickable ? "pointer" : "default",
          "&:hover": {
            backgroundColor: isClickable ? "rgba(0, 0, 0, 0.08)" : undefined,
          },
        }}
      />
    </ListItem>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case ProcessStatus.COMPLETED:
      return "success";
    case ProcessStatus.IN_PROGRESS:
      return "primary";
    case ProcessStatus.REJECTED:
      return "error";
    default:
      return "default";
  }
};

const CustomsPreview = () => {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState("");
  const [selectedCargo, setSelectedCargo] = useState("");
  const [cargoDetails, setCargoDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "error",
  });

  // Handle Snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Fetch bookings on component mount
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const bookingsData = await getBookings();
        setBookings(bookingsData);
      } catch (error) {
        setSnackbar({
          open: true,
          message: "Error fetching bookings: " + error.message,
          severity: "error", // or "success", "info", "warning"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Handle booking selection
  const handleBookingChange = async (event) => {
    const bookingId = event.target.value;
    setSelectedBooking(bookingId);
    setSelectedCargo(""); // Reset cargo selection
    setCargoDetails(null); // Reset cargo details

    if (bookingId) {
      try {
        const bookingData = await getBookingById(bookingId);
        const booking = bookings.find((b) => b.bookingId === bookingId);
        if (booking) {
          booking.cargo = bookingData.cargo;
        }
      } catch (error) {
        setSnackbar({
          open: true,
          message: "Error fetching booking details: " + error.message,
          severity: "error",
        });
      }
    }
  };

  // Handle cargo selection
  const handleCargoChange = (event) => {
    const cargoId = event.target.value;
    setSelectedCargo(cargoId);

    // Find selected booking and cargo
    const booking = bookings.find((b) => b.bookingId === selectedBooking);
    if (booking && booking.cargo && booking.cargo[cargoId]) {
      setCargoDetails(booking.cargo[cargoId]);
    }
  };

  // Get cargo category based on HS code
  const determineCategory = (hsCode) => {
    if (!hsCode) return null;
    const chapter = hsCode.substring(0, 2);

    if (chapter === '36') return 'EXPLOSIVES_AND_PYROTECHNICS';
    if (chapter === "08") return "FRESH_FRUITS";
    if (chapter === "30") return "PHARMACEUTICALS";
    return null;
  };

  const category = cargoDetails?.hsCode //check if cargoDetails exists and has an hsCode property
    ? HSCodeCategories[determineCategory(cargoDetails.hsCode)]
    : null;

  const handleUploadClick = (documentType) => {
    setSelectedDocument(documentType);
    setUploadDialogOpen(true);
  };

  const handleUpload = async (file) => {
    try {
      if (!selectedBooking || !selectedCargo) return;

      // Validate document using OCR
      const validationResult = await validateDocumentWithOCR(
        file,
        DocumentKeywords[selectedDocument]
      );

      if (!validationResult.isValid) {
        // Show error in Snackbar instead of setting error state
        setSnackbar({
          open: true,
          message: (
            <Box sx={{ textAlign: "center" }}>
              <Typography>
                Invalid document: Expected {selectedDocument}
              </Typography>
              <Typography sx={{ mt: 1 }}>
                Your document is missing the following keywords:
                {validationResult.missingKeywords.join(", ")}
              </Typography>
            </Box>
          ),
          severity: "error",
        });
        return;
      }

      await uploadBookingDocument(
        selectedBooking,
        selectedCargo,
        selectedDocument,
        file
      );

      // Update local state to show pending status
      const updatedCargoDetails = {
        ...cargoDetails,
        documentStatus: {
          ...cargoDetails.documentStatus,
          [selectedDocument]: { status: ProcessStatus.IN_PROGRESS },
        },
      };
      setCargoDetails(updatedCargoDetails);

      // Show success message
      setSnackbar({
        open: true,
        message: "Document uploaded successfully",
        severity: "success",
      });

      setUploadDialogOpen(false);
    } catch (error) {
      console.error("Upload error:", error);
      setSnackbar({
        open: true,
        message: `Failed to upload document: ${error.message}`,
        severity: "error",
      });
    }
  };

  useEffect(() => {
    if (cargoDetails && !category) {
      setSnackbar({
        open: true,
        message: (
          <Box sx={{ textAlign: "center" }}>
            <Typography>
              The selected cargo's HS code ({cargoDetails.hsCode}) does not
              match any supported categories.
            </Typography>
            <Typography sx={{ mt: 1 }}>Supported categories are:</Typography>
            <Typography sx={{ mt: 0.5 }}>
              Explosives and Pyrotechnics (36), Fresh Fruits (08), and Pharmaceuticals (30)
            </Typography>
          </Box>
        ),
        severity: "warning",
      });
    }
  }, [cargoDetails, category]); // Dependencies array

  // For the no cargo details warning
  useEffect(() => {
    if (selectedBooking && selectedCargo && !cargoDetails) {
      setSnackbar({
        open: true,
        message:
          "Please select a booking and cargo to view export process details.",
        severity: "info",
      });
    }
  }, [selectedBooking, selectedCargo, cargoDetails]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: "auto", padding: 4 }}>
      <Paper elevation={3} sx={{ padding: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Select Booking</InputLabel>
              <Select
                value={selectedBooking}
                onChange={handleBookingChange}
                label="Select Booking"
              >
                {bookings.map((booking) => (
                  <MenuItem key={booking.bookingId} value={booking.bookingId}>
                    Booking ID: {booking.bookingId} - {booking.portDestination}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={!selectedBooking}>
              <InputLabel>Select Cargo</InputLabel>
              <Select
                value={selectedCargo}
                onChange={handleCargoChange}
                label="Select Cargo"
              >
                {selectedBooking &&
                  bookings.find((b) => b.bookingId === selectedBooking)
                    ?.cargo &&
                  Object.entries(
                    bookings.find((b) => b.bookingId === selectedBooking).cargo
                  ).map(([cargoId, cargo]) => (
                    <MenuItem key={cargoId} value={cargoId}>
                      {cargo.name} - HS Code: {cargo.hsCode}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          {!cargoDetails && (
            <Grid item xs={12}>
              <Alert severity="warning">
                Please select a booking and cargo to view export process
                details.
              </Alert>
            </Grid>
          )}

          {/* {cargoDetails && !category && (
            <Grid item xs={12}>
              <Alert severity="warning">
                The selected cargo's HS code ({cargoDetails.hsCode}) does not
                match any supported categories. Supported categories are: Live
                Animals (01), Fresh Fruits (08), and Pharmaceuticals (30).
              </Alert>
            </Grid>
          )} */}

          {cargoDetails && category && (
            <>
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <CategoryIcon
                    category={determineCategory(cargoDetails.hsCode)}
                  />
                  <Typography variant="h5">
                    {category.description} Export Process
                  </Typography>
                  <Chip
                    label={`HS Code: ${cargoDetails.hsCode}`}
                    variant="outlined"
                  />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Stepper
                  activeStep={
                    cargoDetails.isCustomsCleared
                      ? category.processingOrder.length
                      : 0
                  }
                >
                  {category.processingOrder.map((step, index) => (
                    <Step key={step} completed={cargoDetails.isCustomsCleared}>
                      <StepLabel>
                        {step
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0) + word.slice(1).toLowerCase()
                          )
                          .join(" ")}
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Required Documents
                    </Typography>
                    <List>
                      {category.requiredDocuments.map((doc, index) => (
                        <DocumentListItem
                          key={index}
                          doc={doc}
                          status={cargoDetails.documentStatus?.[doc]}
                          onUploadClick={handleUploadClick}
                        />
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Required Validations
                    </Typography>
                    <List>
                      {Object.entries(category.validations).map(
                        ([key, required]) => (
                          <ListItem key={key}>
                            <ListItemIcon>
                              {required ? (
                                <CheckCircle color="success" />
                              ) : (
                                <Warning color="error" />
                              )}
                            </ListItemIcon>
                            <ListItemText
                              primary={key.split(/(?=[A-Z])/).join(" ")}
                              secondary={required ? "Required" : "Optional"}
                            />
                          </ListItem>
                        )
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>
      <UploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUpload={handleUpload}
        documentType={selectedDocument}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CustomsPreview;
