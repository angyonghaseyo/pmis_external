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
} from "@mui/material";
import {
  CheckCircle,
  Warning,
  PendingActions,
  Pets,
  LocalFlorist,
  Medication,
} from "@mui/icons-material";
import { HSCodeCategories, ProcessStatus } from "./CustomsTradeManager";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig";
import DocumentStatusTracker from "./DocumentStatusTracker";

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

const CustomsPreview = ({ processStatus }) => {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState("");
  const [selectedCargo, setSelectedCargo] = useState("");
  const [cargoDetails, setCargoDetails] = useState(null);

  // Fetch bookings from Firebase
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "bookings"));
        const bookingsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBookings(bookingsData);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    };

    fetchBookings();
  }, []);

  // Handle booking selection
  const handleBookingChange = (event) => {
    const bookingId = event.target.value;
    setSelectedBooking(bookingId);
    setSelectedCargo(""); // Reset cargo selection
    setCargoDetails(null); // Reset cargo details
  };

  // Handle cargo selection
  const handleCargoChange = (event) => {
    const cargoId = event.target.value;
    setSelectedCargo(cargoId);

    // Find selected booking and cargo
    const booking = bookings.find((b) => b.id === selectedBooking);
    if (booking && booking.cargo && booking.cargo[cargoId]) {
      setCargoDetails(booking.cargo[cargoId]);
    }
  };

  // Get cargo category and determine export process stage
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
                  <MenuItem key={booking.id} value={booking.id}>
                    Booking ID: {booking.id} - {booking.portDestination}
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
                  bookings.find((b) => b.id === selectedBooking)?.cargo &&
                  Object.entries(
                    bookings.find((b) => b.id === selectedBooking).cargo
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
