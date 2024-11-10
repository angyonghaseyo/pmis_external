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
import { getBookings, getBookingById } from "./services/api";
import DocumentStatusTracker from "./DocumentStatusTracker";

// HS Code Categories constants
const HSCodeCategories = {
  LIVE_ANIMALS: {
    chapter: '01',
    description: 'Live Animals',
    processingOrder: [
      'VETERINARY_INSPECTION',
      'HEALTH_CERTIFICATION',
      'CITES_CHECK',
      'QUARANTINE_CLEARANCE',
      'TRANSPORT_APPROVAL',
      'CUSTOMS_DECLARATION',
      'FINAL_VETERINARY_CHECK'
    ],
    requiredDocuments: [
      'Veterinary Health Certificate',
      'Animal Welfare Certification',
      'CITES Permit (if applicable)',
      'Quarantine Clearance Certificate',
      'Live Animal Transport Declaration',
      'Export License',
      'Commercial Invoice',
      'Packing List'
    ],
    validations: {
      transportConditions: true,
      healthStatus: true,
      speciesRestrictions: true,
      quarantinePeriod: true
    }
  },
  FRESH_FRUITS: {
    chapter: '08',
    description: 'Fresh Fruits',
    processingOrder: [
      'PHYTOSANITARY_INSPECTION',
      'PESTICIDE_TESTING',
      'COLD_CHAIN_VERIFICATION',
      'PACKAGING_INSPECTION',
      'CUSTOMS_DECLARATION',
      'FINAL_QUALITY_CHECK'
    ],
    requiredDocuments: [
      'Phytosanitary Certificate',
      'Pesticide Residue Test Report',
      'Cold Chain Compliance Certificate',
      'Packaging Declaration',
      'Export License',
      'Certificate of Origin',
      'Commercial Invoice',
      'Packing List'
    ],
    validations: {
      pesticideLevel: true,
      coldChainMaintenance: true,
      packagingStandards: true,
      shelfLife: true
    }
  },
  PHARMACEUTICALS: {
    chapter: '30',
    description: 'Pharmaceutical Products',
    processingOrder: [
      'GMP_VERIFICATION',
      'DRUG_REGISTRATION_CHECK',
      'CONTROLLED_SUBSTANCE_CHECK',
      'STABILITY_VERIFICATION',
      'CUSTOMS_DECLARATION',
      'FINAL_QUALITY_ASSURANCE'
    ],
    requiredDocuments: [
      'GMP Certificate',
      'Drug Registration Certificate',
      'Export License for Pharmaceuticals',
      'Certificate of Pharmaceutical Product (CPP)',
      'Batch Analysis Certificate',
      'Stability Study Report',
      'Commercial Invoice',
      'Packing List'
    ],
    validations: {
      controlledSubstance: true,
      storageConditions: true,
      expiryDates: true,
      batchTracking: true
    }
  }
};

const ProcessStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED'
};

const CategoryIcon = ({ category }) => {
  switch (category) {
    case "LIVE_ANIMALS":
      return <Pets />;
    case "FRESH_FRUITS":
      return <LocalFlorist />;
    case "PHARMACEUTICALS":
      return <Medication />;
    default:
      return null;
  }
};

const getAgencyIcon = (agencyType) => {
  switch (agencyType) {
    case 'VETERINARY':
      return <LocalHospital />;
    case 'WELFARE':
      return <Pets />;
    case 'SECURITY':
      return <Security />;
    case 'CUSTOMS':
      return <Assessment />;
    case 'TRANSPORT':
      return <LocalShipping />;
    default:
      return <InfoOutlined />;
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

  return (
    <Chip
      label={status.replace("_", " ")}
      color={getStatusColor()}
      size="small"
    />
  );
};

const CustomsPreview = () => {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState("");
  const [selectedCargo, setSelectedCargo] = useState("");
  const [cargoDetails, setCargoDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch bookings on component mount
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const bookingsData = await getBookings();
        setBookings(bookingsData);
      } catch (error) {
        setError("Error fetching bookings: " + error.message);
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
        const booking = bookings.find(b => b.bookingId === bookingId);
        if (booking) {
          booking.cargo = bookingData.cargo;
        }
      } catch (error) {
        setError("Error fetching booking details: " + error.message);
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

    if (chapter === "01") return "LIVE_ANIMALS";
    if (chapter === "08") return "FRESH_FRUITS";
    if (chapter === "30") return "PHARMACEUTICALS";
    return null;
  };

  const category = cargoDetails?.hsCode
    ? HSCodeCategories[determineCategory(cargoDetails.hsCode)]
    : null;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 1200, margin: "auto", padding: 4 }}>
        <Alert severity="error">{error}</Alert>
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
                  bookings.find((b) => b.bookingId === selectedBooking)?.cargo &&
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
              <Alert severity="info">
                Please select a booking and cargo to view export process
                details.
              </Alert>
            </Grid>
          )}

          {cargoDetails && !category && (
            <Grid item xs={12}>
              <Alert severity="warning">
                The selected cargo's HS code ({cargoDetails.hsCode}) does not
                match any supported categories. Supported categories are: Live
                Animals (01), Fresh Fruits (08), and Pharmaceuticals (30).
              </Alert>
            </Grid>
          )}

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

              <Grid item xs={12}>
                <DocumentStatusTracker cargo={cargoDetails} />
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Required Documents
                    </Typography>
                    <List>
                      {category.requiredDocuments.map((doc, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <PendingActions />
                          </ListItemIcon>
                          <ListItemText primary={doc} />
                          <StatusChip
                            status={
                              cargoDetails.isCustomsCleared
                                ? ProcessStatus.COMPLETED
                                : ProcessStatus.NOT_STARTED
                            }
                          />
                        </ListItem>
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
    </Box>
  );
};

export default CustomsPreview;