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
  Stack,
  LinearProgress,
} from "@mui/material";
import JSZip from "jszip";
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
import VisibilityIcon from "@mui/icons-material/Visibility";
import ErrorIcon from "@mui/icons-material/Error";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ArchiveIcon from "@mui/icons-material/Archive";
import {
  getBookings,
  getBookingById,
  uploadBookingDocument,
  retrieveBookingDocument,
  updateBooking,
} from "./services/api";
import { validateDocumentWithOCR, DocumentKeywords } from "./OCRValidation.js";
import { HSCodeCategories, ProcessStatus } from "./HSCodeCategories.js";

const UploadDialog = ({
  open,
  onClose,
  onUpload,
  documentType,
  uploadStatus,
}) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Upload {documentType}</DialogTitle>
    <DialogContent>
      <Box sx={{ width: "100%", my: 2 }}>
        <input
          accept="image/*"
          style={{ display: "none" }}
          id="upload-file-input"
          type="file"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              onUpload(file);
            }
          }}
        />
        <label htmlFor="upload-file-input">
          <Button
            variant="contained"
            component="span"
            fullWidth
            disabled={uploadStatus === "uploading"}
            startIcon={<UploadFile />}
          >
            Select File
          </Button>
        </label>
      </Box>

      {uploadStatus === "uploading" && (
        <Box sx={{ width: "100%", mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Uploading...
          </Typography>
          <LinearProgress />
        </Box>
      )}

      {uploadStatus === "success" && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Upload completed successfully
        </Alert>
      )}

      {uploadStatus === "error" && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Upload failed. Please try again.
        </Alert>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={uploadStatus === "uploading"}>
        {uploadStatus === "success" ? "Close" : "Cancel"}
      </Button>
    </DialogActions>
  </Dialog>
);

const DocumentListItem = ({
  doc,
  status,
  onUploadClick,
  onViewDocument,
  category,
  cargoDetails,
  uploadStatus,
}) => {
  const isExporterDoc = category.documents.exporter.some(
    (d) => d.name === doc.name
  );
  const isAgencyDoc = category.documents.agency.some(
    (d) => d.name === doc.name
  );
  const docDetails = isExporterDoc
    ? category.documents.exporter.find((d) => d.name === doc.name)
    : category.documents.agency.find((d) => d.name === doc.name);

  const currentStatus = status?.status || "NOT_STARTED";
  const hasDocument = cargoDetails?.documents?.[doc.name];
  console.log(hasDocument);
  const isClickable = isExporterDoc;

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
        return <CheckCircle fontSize="small" />;
      case "error":
        return <ErrorIcon fontSize="small" />;
      default:
        return <UploadFile fontSize="small" />;
    }
  };

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
      if (hasDocument) {
        return <CheckCircle sx={{ color: "green" }} />;
      }
      return <UploadFile />;
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

  return (
    <ListItem
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        pr: 20,
      }}
      secondaryAction={
        <Stack direction="row" spacing={1}>
          {isExporterDoc ? (
            <>
              <Button
                size="small"
                variant="outlined"
                onClick={() => onUploadClick(doc.name)}
                startIcon={
                  hasDocument ? <UploadFile /> : <AddCircleOutlineIcon />
                }
              >
                {hasDocument ? "Replace" : "Upload"}
              </Button>
              {hasDocument && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onViewDocument(doc.name)}
                  startIcon={<VisibilityIcon />}
                >
                  View
                </Button>
              )}
              {/* Add upload status chip */}
              {uploadStatus && (
                <Chip
                  size="small"
                  label={uploadStatus}
                  color={getStatusColor(uploadStatus)}
                  icon={getStatusIcon(uploadStatus)}
                />
              )}
            </>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip
                label={currentStatus.replace(/_/g, " ")}
                color={getChipColor(currentStatus)}
                sx={{ minWidth: "100px" }}
              />
              {hasDocument && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onViewDocument(doc.name)}
                  startIcon={<VisibilityIcon />}
                >
                  View
                </Button>
              )}
            </Box>
          )}
        </Stack>
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
  const [uploadStatus, setUploadStatus] = useState({}); // Add this

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
          setTimeout(() => reject(new Error("Request timeout")), 10000)
        );

        const bookingsPromise = getBookings();
        const bookingsData = await Promise.race([
          bookingsPromise,
          timeoutPromise,
        ]);

        console.log("Bookings received:", bookingsData); // Debug log

        if (!Array.isArray(bookingsData)) {
          throw new Error("Invalid data format received");
        }

        setBookings(bookingsData);
      } catch (error) {
        console.error("Detailed fetch error:", error);
        setSnackbar({
          open: true,
          message: `Error fetching bookings: ${
            error.message || "Unknown error"
          }`,
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
      const document = await retrieveBookingDocument(
        selectedBooking,
        selectedCargo,
        documentType
      );
      // Open document in new tab
      window.open(document.url, "_blank");
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to retrieve document: ${error.message}`,
        severity: "error",
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
      if (!selectedBooking || !selectedCargo || !selectedDocument) return;

      // Set uploading status
      setUploadStatus((prev) => ({
        ...prev,
        [selectedDocument]: "uploading",
      }));

      // Validate document using OCR
      const validationResult = await validateDocumentWithOCR(
        file,
        DocumentKeywords[selectedDocument]
      );

      if (!validationResult.isValid) {
        setUploadStatus((prev) => ({
          ...prev,
          [selectedDocument]: "error",
        }));
        setSnackbar({
          open: true,
          message: `Invalid document: Missing keywords: ${validationResult.missingKeywords.join(
            ", "
          )}`,
          severity: "error",
        });
        return;
      }

      // Upload the document
      const uploadResult = await uploadBookingDocument(
        selectedBooking,
        selectedCargo,
        selectedDocument,
        file
      );

      // Update local state to reflect the upload
      const updatedCargoDetails = {
        ...cargoDetails,
        documents: {
          ...cargoDetails.documents,
          [selectedDocument]: uploadResult.url, // Store the document URL
        },
        documentStatus: {
          ...cargoDetails.documentStatus,
          [selectedDocument]: {
            ...cargoDetails.documentStatus[selectedDocument],
            status: "IN_PROGRESS",
          },
        },
      };

      setCargoDetails(updatedCargoDetails);

      if (selectedDocument === "Safety_Data_Sheet") {
        const updatedStatus = {
          ...cargoDetails.documentStatus,
          UN_Classification_Sheet: {
            name: "UN_Classification_Sheet", // Keep existing fields
            status: "IN_PROGRESS",
            lastUpdated: new Date(),
            comments: "Prerequisites met, waiting for agency review",
            issuedBy:
              cargoDetails.documentStatus["UN_Classification_Sheet"].issuedBy, // Preserve existing issuedBy
            requiresDocuments:
              cargoDetails.documentStatus["UN_Classification_Sheet"]
                .requiresDocuments, // Preserve existing requiresDocuments
          },
        };

        const updatedCargoDetails = {
          ...cargoDetails,
          documents: {
            ...cargoDetails.documents,
            [selectedDocument]: uploadResult.url,
          },
          documentStatus: updatedStatus  // Include the updated status with UN_Classification_Sheet
        };

       
        setCargoDetails(updatedCargoDetails);


        const bookingData = bookings.find(
          (b) => b.bookingId === selectedBooking
        );
        await updateBooking(selectedBooking, {
          ...bookingData,
          cargo: {
            ...bookingData.cargo,
            [selectedCargo]: updatedCargoDetails
          },
        });
      }

      // Set success status after successful upload
      setUploadStatus((prev) => ({
        ...prev,
        [selectedDocument]: "success",
      }));

      setSnackbar({
        open: true,
        message: "Document uploaded successfully",
        severity: "success",
      });

      setUploadDialogOpen(false);

      // Clear upload status after a delay
      setTimeout(() => {
        setUploadStatus((prev) => {
          const newStatus = { ...prev };
          delete newStatus[selectedDocument];
          return newStatus;
        });
      }, 3000);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus((prev) => ({
        ...prev,
        [selectedDocument]: "error",
      }));
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

  const handleDownloadAllDocuments = async (cargoId) => {
    try {
      setSnackbar({
        open: true,
        message: "Preparing documents for download...",
        severity: "info",
      });

      const cargo = cargoDetails;
      if (!cargo?.documents || Object.keys(cargo.documents).length === 0) {
        setSnackbar({
          open: true,
          message: "No documents available for download",
          severity: "warning",
        });
        return;
      }

      // Create a new zip file
      const zip = new JSZip();

      // Download all documents
      const documentPromises = Object.keys(cargo.documents).map(
        async (documentType) => {
          try {
            const document = await retrieveBookingDocument(
              selectedBooking,
              cargoId,
              documentType
            );

            // Fetch the actual file
            const response = await fetch(document.url);
            const blob = await response.blob();

            // Add to zip with a meaningful filename
            zip.file(`${documentType}.pdf`, blob);

            return true;
          } catch (error) {
            console.error(`Error downloading ${documentType}:`, error);
            return false;
          }
        }
      );

      // Wait for all downloads to complete
      await Promise.all(documentPromises);

      // Generate and download zip file
      const zipContent = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(zipContent);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cargo_${cargoId}_documents.zip`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: "Documents downloaded successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Download error:", error);
      setSnackbar({
        open: true,
        message: `Failed to download documents: ${error.message}`,
        severity: "error",
      });
    }
  };

  // Add this button where you want to show the download option
  const DownloadAllButton = ({ cargoId }) => {
    const hasDocuments =
      cargoDetails?.documents && Object.keys(cargoDetails.documents).length > 0;

    return (
      <Button
        variant="outlined"
        startIcon={<ArchiveIcon />}
        onClick={() => handleDownloadAllDocuments(cargoId)}
        disabled={!hasDocuments}
        sx={{ borderRadius: "8px" }}
      >
        Download All Documents
      </Button>
    );
  };

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
              <Grid item xs={12} md={12}>
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
                          cargoDetails={cargoDetails}
                          uploadStatus={uploadStatus[doc.name]}
                        />
                      ))}
                    </List>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 2 }}
                    >
                      <DownloadAllButton cargoId={selectedCargo} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={12}>
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
                          cargoDetails={cargoDetails}
                          uploadStatus={uploadStatus[doc.name]}
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
        uploadStatus={uploadStatus[selectedDocument]} // Pass the existing uploadStatus
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
