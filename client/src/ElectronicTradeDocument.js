// ElectronicTradeModule.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Divider,
  Snackbar,
  Stack
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import ArrowForward from '@mui/icons-material/ArrowForward';
import {
  Upload,
  FileText,
  Send,
  Download,
  Archive,
  AlertTriangle,
  Check,
  X,
  Clock,
  AlertCircle,
  Printer,
  Edit,
  ExternalLink,
  Save
} from 'lucide-react';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';

// Document Types and Status Constants
const DOCUMENT_TYPES = {
  PRE_ARRIVAL: 'Pre-Arrival Notification',
  CUSTOMS_DECLARATION: 'Customs Declaration',
  BILL_OF_LADING: 'Bill of Lading',
  NOTICE_OF_READINESS: 'Notice of Readiness',
  ARRIVAL_NOTICE: 'Arrival Notice'
};

const DOCUMENT_STATUS = {
  DRAFT: 'Draft',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled'
};

// Form Templates
const formTemplates = {
  [DOCUMENT_TYPES.PRE_ARRIVAL]: {
    title: "Pre-Arrival Notification",
    fields: [
      { name: "vesselName", label: "Vessel Name", type: "text", required: true },
      { name: "imoNumber", label: "IMO Number", type: "text", required: true },
      { name: "eta", label: "Expected Time of Arrival", type: "datetime", required: true },
      { name: "lastPort", label: "Last Port of Call", type: "text", required: true },
      { name: "nextPort", label: "Next Port of Call", type: "text", required: true },
      { name: "cargoDescription", label: "Cargo Description", type: "text", multiline: true },
      { name: "dangerousCargo", label: "Dangerous Cargo", type: "checkbox" }
    ]
  },
  [DOCUMENT_TYPES.BILL_OF_LADING]: {
    title: "Bill of Lading",
    fields: [
      { name: "blNumber", label: "B/L Number", type: "text", required: true },
      { name: "shipper", label: "Shipper", type: "text", required: true },
      { name: "consignee", label: "Consignee", type: "text", required: true },
      { name: "notifyParty", label: "Notify Party", type: "text" },
      { name: "vesselName", label: "Vessel Name", type: "text", required: true },
      { name: "voyageNumber", label: "Voyage Number", type: "text", required: true },
      { name: "portOfLoading", label: "Port of Loading", type: "text", required: true },
      { name: "portOfDischarge", label: "Port of Discharge", type: "text", required: true },
      { name: "cargoDescription", label: "Cargo Description", type: "text", multiline: true, required: true },
      { name: "numberOfPackages", label: "Number of Packages", type: "number", required: true },
      { name: "grossWeight", label: "Gross Weight (kg)", type: "number", required: true },
      { name: "measurement", label: "Measurement (m³)", type: "number" },
      { name: "freightTerms", label: "Freight Terms", type: "select", options: ["Prepaid", "Collect"], required: true }
    ]
  },
  [DOCUMENT_TYPES.NOTICE_OF_READINESS]: {
    title: "Notice of Readiness",
    fields: [
      { name: "vesselName", label: "Vessel Name", type: "text", required: true },
      { name: "imoNumber", label: "IMO Number", type: "text", required: true },
      { name: "portOfCall", label: "Port of Call", type: "text", required: true },
      { name: "anchorageTime", label: "Time of Anchoring", type: "datetime", required: true },
      { name: "norTenderTime", label: "NOR Tender Time", type: "datetime", required: true },
      { name: "masterName", label: "Master's Name", type: "text", required: true },
      { name: "agentName", label: "Agent's Name", type: "text", required: true },
      { name: "remarks", label: "Remarks", type: "text", multiline: true }
    ]
  },
  [DOCUMENT_TYPES.ARRIVAL_NOTICE]: {
    title: "Arrival Notice",
    fields: [
      { name: "vesselName", label: "Vessel Name", type: "text", required: true },
      { name: "voyageNumber", label: "Voyage Number", type: "text", required: true },
      { name: "arrivalDate", label: "Actual Arrival Date", type: "datetime", required: true },
      { name: "consignee", label: "Consignee", type: "text", required: true },
      { name: "blNumber", label: "B/L Number", type: "text", required: true },
      { name: "containerNumbers", label: "Container Numbers", type: "text", multiline: true },
      { name: "cargoDescription", label: "Cargo Description", type: "text", multiline: true, required: true },
      { name: "storageLocation", label: "Storage Location", type: "text" },
      { name: "customsStatus", label: "Customs Status", type: "select", options: ["Pending", "Cleared", "Held"], required: true }
    ]
  },
  [DOCUMENT_TYPES.CUSTOMS_DECLARATION]: {
    title: "Customs Declaration",
    fields: [
      { name: "declarationType", label: "Declaration Type", type: "select", options: ["Import", "Export", "Transit"], required: true },
      { name: "declarationNumber", label: "Declaration Number", type: "text", required: true },
      { name: "declarant", label: "Declarant", type: "text", required: true },
      { name: "declarantReference", label: "Declarant Reference", type: "text" },
      { name: "importerExporter", label: "Importer/Exporter", type: "text", required: true },
      { name: "vesselName", label: "Vessel Name", type: "text", required: true },
      { name: "voyageNumber", label: "Voyage Number", type: "text", required: true },
      { name: "blNumber", label: "B/L Number", type: "text", required: true },
      { name: "cargoDescription", label: "Cargo Description", type: "text", multiline: true, required: true },
      { name: "hsCode", label: "HS Code", type: "text", required: true },
      { name: "goodsValue", label: "Goods Value", type: "number", required: true },
      { name: "currency", label: "Currency", type: "select", options: ["USD", "EUR", "GBP", "SGD"], required: true },
      { name: "dutyPayable", label: "Duty Payable", type: "number" },
      { name: "gstPayable", label: "GST Payable", type: "number" }
    ]
  }
};

const ElectronicTradeModule = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [formData, setFormData] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [customsStatus, setCustomsStatus] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);

  // Simulated data fetch
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Sample data
        const sampleDocuments = [
          {
            id: 1,
            type: DOCUMENT_TYPES.PRE_ARRIVAL,
            vesselName: 'Ocean Star',
            imoNumber: 'IMO9123456',
            eta: new Date().toISOString(),
            status: DOCUMENT_STATUS.APPROVED,
            submittedAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 2,
            type: DOCUMENT_TYPES.CUSTOMS_DECLARATION,
            declarationNumber: 'CD-2024-001',
            vesselName: 'Pacific Voyager',
            status: DOCUMENT_STATUS.PENDING,
            submittedAt: new Date().toISOString()
          },
          {
            id: 3,
            type: DOCUMENT_TYPES.BILL_OF_LADING,
            blNumber: 'BL-2024-003',
            vesselName: 'Global Express',
            status: DOCUMENT_STATUS.PENDING,
            submittedAt: new Date().toISOString()
          }
        ];
        
        setDocuments(sampleDocuments);
        
        // Sample customs status
        setCustomsStatus({
          status: 'IN_PROGRESS',
          lastUpdated: new Date().toISOString(),
          message: 'Documentation under review by customs authority'
        });
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setSnackbar({
          open: true,
          message: 'Error loading data',
          severity: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const validateForm = (type) => {
    const template = formTemplates[type];
    const errors = {};
    let isValid = true;

    template.fields.forEach(field => {
      if (field.required && !formData[field.name]) {
        errors[field.name] = 'This field is required';
        isValid = false;
      }
    });

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm(dialogType)) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }

    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newDocument = {
        id: Date.now(),
        type: dialogType,
        ...formData,
        status: DOCUMENT_STATUS.PENDING,
        submittedAt: new Date().toISOString()
      };

      setDocuments(prev => [...prev, newDocument]);
      
      setSnackbar({
        open: true,
        message: 'Document submitted successfully',
        severity: 'success'
      });
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error submitting document:', error);
      setSnackbar({
        open: true,
        message: 'Error submitting document',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (type, document = null) => {
    setDialogType(type);
    setSelectedDocument(document);
    setFormData(document || {});
    setCurrentStep(0);
    setPreviewMode(!!document);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDocument(null);
    setFormData({});
    setDialogType('');
    setCurrentStep(0);
    setPreviewMode(false);
    setFormErrors({});
  };

  const renderFormField = (field) => {
    switch (field.type) {
      case 'datetime':
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label={field.label}
              value={formData[field.name] || null}
              onChange={(value) => handleFieldChange(field.name, value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  required={field.required}
                  error={!!formErrors[field.name]}
                  helperText={formErrors[field.name]}
                  disabled={previewMode}
                />
              )}
            />
          </LocalizationProvider>
        );

      case 'select':
        return (
          <FormControl fullWidth required={field.required} error={!!formErrors[field.name]}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={formData[field.name] || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              label={field.label}
              disabled={previewMode}
            >
              {field.options.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'checkbox':
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={formData[field.name] || false}
                onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                disabled={previewMode}
              />
            }
            label={field.label}
          />
        );

      default:
        return (
          <TextField
            label={field.label}
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            fullWidth
            required={field.required}
            multiline={field.multiline}
            rows={field.multiline ? 4 : 1}
            error={!!formErrors[field.name]}
            helperText={formErrors[field.name]}
            disabled={previewMode}
            type={field.type}
          />
        );
    }
  };

  const handleFieldChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const renderForm = () => {
    const template = formTemplates[dialogType];
    if (!template) return null;

    // Split fields into sections for stepped form
    const fieldsPerStep = 5;
    const steps = [];
    for (let i = 0; i < template.fields.length; i += fieldsPerStep) {
      steps.push(template.fields.slice(i, i + fieldsPerStep));
    }

    return (
      <Box>
        {!previewMode && steps.length > 1 && (
          <Stepper activeStep={currentStep} sx={{ mb: 3 }}>
            {steps.map((_, index) => (
              <Step key={index}>
                <StepLabel>Section {index + 1}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}

        <Grid container spacing={3}>
          {steps[currentStep]?.map((field) => (
            <Grid item xs={12} md={field.type === 'checkbox' ? 12 : 6} key={field.name}>
              {renderFormField(field)}
            </Grid>
          ))}
        </Grid>

        {!previewMode && steps.length > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={currentStep === 0}
              startIcon={<ArrowBack />}
            >
              Back
            </Button>
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={currentStep === steps.length - 1}
              endIcon={<ArrowForward />}
              variant="contained"
            >
              Next
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  const renderDocumentList = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Document Type</TableCell>
            <TableCell>Reference</TableCell>
            <TableCell>Vessel Name</TableCell>
            <TableCell>Submitted Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {documents
            .filter(doc => {
              switch (activeTab) {
                case 0: // Current
                  return [DOCUMENT_STATUS.PENDING, DOCUMENT_STATUS.APPROVED].includes(doc.status);
                case 1: // Past
                  return doc.status === DOCUMENT_STATUS.APPROVED;
                case 2: // Cancelled
                  return doc.status === DOCUMENT_STATUS.CANCELLED;
                case 3: // Rejected
                  return doc.status === DOCUMENT_STATUS.REJECTED;
                default:
                  return false;
              }
            })
            .map((doc) => (
              <TableRow key={doc.id} hover>
                <TableCell>{doc.type}</TableCell>
                <TableCell>
                  {doc.blNumber || doc.declarationNumber || `REF-${doc.id}`}
                </TableCell>
                <TableCell>{doc.vesselName}</TableCell>
                <TableCell>
                  {format(new Date(doc.submittedAt), 'dd MMM yyyy HH:mm')}
                </TableCell>
                <TableCell>
                  <Chip
                    label={doc.status}
                    color={
                      doc.status === DOCUMENT_STATUS.APPROVED ? 'success' :
                      doc.status === DOCUMENT_STATUS.REJECTED ? 'error' :
                      doc.status === DOCUMENT_STATUS.PENDING ? 'warning' : 
                      'default'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenDialog(doc.type, doc)}
                      title="View"
                    >
                      <FileText size={18} />
                    </IconButton>
                    <IconButton 
                      size="small"
                      onClick={() => handlePrintDocument(doc)}
                      title="Print"
                    >
                      <Printer size={18} />
                    </IconButton>
                    {doc.status === DOCUMENT_STATUS.PENDING && (
                      <IconButton 
                        size="small"
                        onClick={() => handleEditDocument(doc)}
                        title="Edit"
                      >
                        <Edit size={18} />
                      </IconButton>
                    )}
                    <IconButton 
                      size="small"
                      onClick={() => handleDownloadDocument(doc)}
                      title="Download"
                    >
                      <Download size={18} />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderCustomsStatus = () => (
    <Card sx={{ mb: 3, bgcolor: 'background.default' }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            {customsStatus?.status === 'IN_PROGRESS' ? (
              <Clock size={24} className="text-warning" />
            ) : customsStatus?.status === 'APPROVED' ? (
              <Check size={24} className="text-success" />
            ) : (
              <AlertCircle size={24} className="text-error" />
            )}
          </Grid>
          <Grid item xs>
            <Typography variant="h6" gutterBottom>
              Customs Clearance Status
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {customsStatus?.message}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Last updated: {customsStatus?.lastUpdated ? 
                format(new Date(customsStatus.lastUpdated), 'dd MMM yyyy HH:mm') : 
                'N/A'}
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ExternalLink size={16} />}
              onClick={() => {/* Implement customs portal redirect */}}
            >
              View in Customs Portal
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  // Document action handlers
  const handlePrintDocument = (document) => {
    // Implement print functionality
    window.print();
  };

  const handleEditDocument = (document) => {
    handleOpenDialog(document.type, document);
    setPreviewMode(false);
  };

  const handleDownloadDocument = (document) => {
    // Implement download functionality
    console.log('Downloading document:', document);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Main Header */}
      <Typography variant="h4" gutterBottom>
        Electronic Trade Documentation
      </Typography>

      {/* Customs Status Card */}
      {renderCustomsStatus()}

      {/* Action Buttons */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<Upload />}
              onClick={() => handleOpenDialog('upload')}
            >
              Convert to EDI
            </Button>
          </Grid>
          {Object.values(DOCUMENT_TYPES).map((type) => (
            <Grid item key={type}>
              <Button
                variant="contained"
                startIcon={<FileText />}
                onClick={() => handleOpenDialog(type)}
              >
                New {type}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Document Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab label="Current Documents" />
        <Tab label="Past Documents" />
        <Tab label="Cancelled Documents" />
        <Tab label="Rejected Documents" />
      </Tabs>

      {/* Document List */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : (
        renderDocumentList()
      )}

      {/* Document Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogType === 'upload' ? 'Convert Documents to EDI' :
           previewMode ? `View ${dialogType}` : `New ${dialogType}`}
        </DialogTitle>
        <DialogContent dividers>
          {dialogType === 'upload' ? (
            <Box sx={{ p: 2 }}>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                style={{ display: 'none' }}
                id="document-upload"
              />
              <label htmlFor="document-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<Upload />}
                  fullWidth
                  sx={{ height: 100 }}
                >
                  Click to upload or drag and drop files here
                </Button>
              </label>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Supported formats: PDF, DOC, DOCX, XLS, XLSX
              </Typography>
            </Box>
          ) : (
            renderForm()
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {previewMode ? 'Close' : 'Cancel'}
          </Button>
          {!previewMode && (
            <Button
              variant="contained"
              onClick={handleSubmit}
              startIcon={<Save />}
              disabled={isLoading}
            >
              Submit
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ElectronicTradeModule;