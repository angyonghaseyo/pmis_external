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
  LocalFlorist,
  Medication,
  InfoOutlined,
  LocalHospital,
  Security,
  Assessment,
  LocalShipping,
  UploadFile,
} from "@mui/icons-material";
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  getBookings,
  getBookingById,
  uploadBookingDocument,
  retrieveBookingDocument,
} from "./services/api";
import { validateDocumentWithOCR, DocumentKeywords } from "./OCRValidation.js";
import { HSCodeCategories, ProcessStatus } from "./HSCodeCategories.js";
 

// const CategoryIcon = ({ category }) => {
//   switch (category) {
//     case "EXPLOSIVES_AND_PYROTECHNICS":
//       return <Warning />;
//     case "FRESH_FRUITS":
//       return <LocalFlorist />;
//     case "PHARMACEUTICALS":
//       return <Medication />;
//     default:
//       return null;
//   }
// };

// const StatusChip = ({ status }) => {
//   const getStatusColor = () => {
//     switch (status) {
//       case ProcessStatus.COMPLETED:
//         return "success";
//       case ProcessStatus.IN_PROGRESS:
//         return "primary";
//       case ProcessStatus.REJECTED:
//         return "error";
//       default:
//         return "default";
//     }
//   };

//   const displayStatus = status ? status.replace(/_/g, " ") : "NOT STARTED";

//   return <Chip label={displayStatus} color={getStatusColor()} size="small" />;
// };
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


 

const DocumentListItem = ({ doc, status, onUploadClick,  onViewDocument, category }) => {
  const isExporterDoc = category.documents.exporter.some(d => d.name === doc.name);
  const isAgencyDoc = category.documents.agency.some(d => d.name === doc.name);
  const docDetails = isExporterDoc
    ? category.documents.exporter.find(d => d.name === doc.name)
    : category.documents.agency.find(d => d.name === doc.name);

  const currentStatus = status?.status || "NOT_STARTED";
  const isClickable = isExporterDoc && currentStatus === "PENDING";
  const isViewable = status?.status === "COMPLETED" || status?.status === "IN_PROGRESS";



  const getChipColor = (status) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "REJECTED":
        return "error";
      case "IN_PROGRESS":
        return "primary";
      case "PENDING":
        return "secondary";
      default:
        return "default";
    }
  };

  const getIcon = () => {
    if (isAgencyDoc) {
      switch (currentStatus) {
        case "COMPLETED":
          return <CheckCircle />;
        case "REJECTED":
          return <Warning />;
        case "IN_PROGRESS":
          return <PendingActions />;
        default:
          return <PendingActions />;
      }
    } else {
      switch (currentStatus) {
        case "COMPLETED":
          return <CheckCircle />;
        case "REJECTED":
          return <Warning />;
        case "IN_PROGRESS":
          return <Assessment />;
        case "PENDING":
          return <PendingActions />;
        default:
          return <UploadFile />;
      }
    }
  };

  const getSecondaryText = () => {
    if (isAgencyDoc) {
      const prerequisites = docDetails.requiresDocuments;
      if (prerequisites?.length > 0) {
        return `Requires: ${prerequisites.join(", ")}`;
      }
      return `To be issued by: ${docDetails.issuedBy}`;
    } else {
      return `To be reviewed by: ${docDetails.reviewedBy}`;
    }
  };

  const handleClick = () => {
    if (isClickable) {
      onUploadClick(doc.name);
    }
  };

  

  return (
    <ListItem
    sx={{
      width: '100%',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      pr: 20 // Add right padding to make room for the chip
    }}
      secondaryAction={
        <>
        <Chip
          label={currentStatus.replace(/_/g, " ")}
          color={getChipColor(currentStatus)}
          onClick={handleClick}
          sx={{
            cursor: isClickable ? "pointer" : "default",
            "&:hover": {
              backgroundColor: isClickable ? "rgba(0, 0, 0, 0.08)" : undefined,
            },
          }}
        />
         {isViewable && (
            <Button 
            size="small"
            onClick={() => onViewDocument(doc.name)}
            startIcon={<VisibilityIcon />}
            >
              View
            </Button>
          )}
          </>
      }
    >
      <ListItemIcon>{getIcon()}</ListItemIcon>
      <ListItemText
        primary={doc.name}
        secondary={getSecondaryText()}
        primaryTypographyProps={{
          style: {
            fontWeight: isAgencyDoc ? 500 : 400,
          },
        }}
      />
    </ListItem>
  );
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

//   const handleViewDocument = async (cargoId, documentType) => {
//     try {
//         const document = await retrieveBookingDocument(selectedBooking, cargoId, documentType);
//         // document now has {url: "https://storage...", fileName: "filename.pdf"}
        
//         // Simply open in new tab
//         window.open(document.url, '_blank');

//         // Or if you want to force download:
//         // const link = document.createElement('a');
//         // link.href = document.url;
//         // link.download = document.fileName;
//         // document.body.appendChild(link);
//         // link.click();
//         // document.body.removeChild(link);
//     } catch (error) {
//         console.error('Error viewing document:', error);
//         // Handle error - maybe show an alert or notification
//     }
// };

  // Handle Snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Fetch bookings on component mount
 // In CustomsPreview.js
 useEffect(() => {
  const fetchBookings = async () => {
    try {
      setLoading(true);
      console.log("Fetching bookings..."); // Debug log
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const bookingsPromise = getBookings();
      const bookingsData = await Promise.race([bookingsPromise, timeoutPromise]);
      
      console.log("Bookings received:", bookingsData); // Debug log
      
      if (!Array.isArray(bookingsData)) {
        throw new Error('Invalid data format received');
      }
      
      setBookings(bookingsData);
    } catch (error) {
      console.error("Detailed fetch error:", error);
      setSnackbar({
        open: true,
        message: `Error fetching bookings: ${error.message || 'Unknown error'}`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  fetchBookings();
}, []);

// Add a timeout effect to ensure loading state is cleared
useEffect(() => {
  const timer = setTimeout(() => {
    if (loading) {
      setLoading(false);
      setSnackbar({
        open: true,
        message: "Loading timed out. Please refresh the page.",
        severity: "error",
      });
    }
  }, 1000); // 15 seconds timeout

  return () => clearTimeout(timer);
}, [loading]);

  const handleViewDocument = async (documentType) => {
    try {
      const document = await retrieveBookingDocument(selectedBooking, selectedCargo, documentType);
      // Open document in new tab
      window.open(document.url, '_blank');
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to retrieve document: ${error.message}`,
        severity: "error"
      });
    }
  };

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

    if (chapter === "36") return "EXPLOSIVES_AND_PYROTECHNICS";
    if (chapter === "08") return "FRESH_FRUITS";
    if (chapter === "30") return "PHARMACEUTICALS";
    return null;
  };

  const category = cargoDetails?.hsCode //check if cargoDetails exists and has an hsCode property
    ? HSCodeCategories[determineCategory(cargoDetails.hsCode)]
    : null;

  // const handleUploadClick = (documentType) => {
  //   console.log("click");
  //   setSelectedDocument(documentType);
  //   setUploadDialogOpen(true);
  // };

  //Denzel
  const handleUploadClick = (documentType) => {
    console.log("handleUploadClick called with:", documentType);
    setSelectedDocument(documentType);
    setUploadDialogOpen(true);
  };

  const handleUpload = async (file) => {
    try {
      console.log(selectedDocument);
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
              Explosives and Pyrotechnics (36), Fresh Fruits (08), and
              Pharmaceuticals (30)
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
               <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Required Exporter Documents
                  </Typography>
                  <List>
                    {category.documents.exporter.map((doc) => (
                      <DocumentListItem
                        key={doc.name}
                        doc={doc}
                        status={cargoDetails.documentStatus[doc.name]}
                        onUploadClick={handleUploadClick}
                      onViewDocument={handleViewDocument}
                        category={category}
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
                    Agency Issued Documents
                  </Typography>
                  <List>
                    {category.documents.agency.map((doc) => (
                      <DocumentListItem
                        key={doc.name}
                        doc={doc}
                        status={cargoDetails.documentStatus[doc.name]}
                        onViewDocument={handleViewDocument}
                        category={category}
                      />
                    ))}
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
