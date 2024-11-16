import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
} from '@mui/material';
import { getBillingRequestsByMonth1 } from './services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { PDFDocument } from 'pdf-lib';
import { format, parseISO, addMonths } from 'date-fns';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from './firebaseConfig';
import { doc, setDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import ClearIcon from '@mui/icons-material/Clear';
import logo from './logo.jpg';
import { useAuth } from "./AuthContext";

const storage = getStorage();

const Invoice = ({ companyId }) => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState('');
  const [billingRequests, setBillingRequests] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState('');
  const [openSignDialog, setOpenSignDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [openConfirmationDialog, setOpenConfirmationDialog] = useState(false);
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const invoicesSnapshot = await getDocs(collection(db, 'invoices'));
      const invoicesData = invoicesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setInvoices(invoicesData);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setError("Failed to load invoices. Please try again.");
    }
  };

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
    setBillingRequests([]);
    setError(null);
  };

  const handleSignatureConfirmation = () => {
    setOpenConfirmationDialog(false);
    handleSaveSignatureImplementation();
  };

  const handleSaveSignature = () => {
    setOpenConfirmationDialog(true);
  };

  const handleSaveSignatureImplementation = async () => {
    if (!canvasRef.current || !selectedInvoice) return;
  
    try {
      setLoading(true);
      const signatureDataUrl = canvasRef.current.toDataURL("image/png");
  
      const response = await fetch(selectedInvoice.pdfUrl);
      const existingPdfBytes = await response.arrayBuffer();
      
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];
  
      const signatureImage = await pdfDoc.embedPng(signatureDataUrl);
      
      const { width, height } = lastPage.getSize();
      
      const signatureWidth = 150;  
      const signatureHeight = 60;  
  
      const signatureY = 50;  
      lastPage.drawImage(signatureImage, {
        x: 30,  
        y: signatureY,
        width: signatureWidth,
        height: signatureHeight,
      });
  
      const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unknown';
  
      lastPage.drawText(`Signed by: ${fullName}`, {
        x: 30,
        y: signatureY - 15,
        size: 10,
      });
  
      lastPage.drawText(`${user?.company || 'Unknown Company'}`, {
        x: 30,
        y: signatureY - 30,
        size: 10,
      });
  
      lastPage.drawText(`Date: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, {
        x: 30,
        y: signatureY - 45,
        size: 10,
      });
  
      const modifiedPdfBytes = await pdfDoc.save();
      const modifiedPdfBlob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
  
      const fileName = `invoice_${selectedInvoice.id}_signed.pdf`;
      const pdfRef = ref(storage, `invoices/${fileName}`);
      await uploadBytes(pdfRef, modifiedPdfBlob);
      const signedPdfUrl = await getDownloadURL(pdfRef);
  
      await setDoc(doc(db, 'invoices', selectedInvoice.id), {
        ...selectedInvoice,
        pdfUrl: signedPdfUrl,
        signedAt: serverTimestamp(),
        status: 'Pending Payment Verification',
        signedBy: {
          name: fullName,
          company: user?.company,
          timestamp: new Date().toISOString()
        }
      });
  
      setSelectedPdfUrl(signedPdfUrl);
      setOpenSignDialog(false);
      setSnackbar({
        open: true,
        message: 'Invoice signed successfully',
        severity: 'success'
      });
      fetchInvoices();
  
    } catch (error) {
      console.error('Error saving signature:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save signature. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingRequests = async (monthRange) => {
    try {
      const data = await getBillingRequestsByMonth1(companyId, monthRange);
      setBillingRequests(data);
    } catch (error) {
      console.error("Error fetching billing requests:", error);
      setError("Failed to load billing requests. Please try again.");
    }
  };

  const handleGenerateInvoice = async () => {
    if (!selectedMonth) {
      setError("Please select a month to generate the invoice.");
      return;
    }

    const [year, month] = selectedMonth.split('-');
    const startOfSelectedMonth = new Date(Date.UTC(year, month - 1, 1));
    const endOfSelectedMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    const startISO = startOfSelectedMonth.toISOString();
    const endISO = endOfSelectedMonth.toISOString();

    await fetchBillingRequests({
      start: startISO,
      end: endISO,
    });

    if (billingRequests.length > 0) {
      generateAndUploadInvoice(startOfSelectedMonth);
    }
  };

  const generateAndUploadInvoice = async (startOfSelectedMonth) => {
    setLoading(true);
    const pdfDoc = new jsPDF();
  
    const groupedRequests = billingRequests.reduce((acc, request) => {
      const groupKey = request.requestType === 'facilityrental' 
        ? 'facility_rental'
        : request.requestType === 'valueaddedservice'
          ? 'value_added_service'
          : request.vesselVisit || 'no-vessel';
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(request);
      return acc;
    }, {});
  
    const sortedGroups = Object.entries(groupedRequests).sort((a, b) => {
      if (a[0] === 'facility_rental') return 1;
      if (b[0] === 'facility_rental') return -1;
      if (a[0] === 'value_added_service') return 1;
      if (b[0] === 'value_added_service') return -1;
      const aHasVesselVisit = a[1].some(r => r.requestType === 'vesselvisit');
      const bHasVesselVisit = b[1].some(r => r.requestType === 'vesselvisit');
      if (aHasVesselVisit !== bHasVesselVisit) {
        return bHasVesselVisit ? 1 : -1;
      }
      return new Date(a[1][0].dateCompleted) - new Date(b[1][0].dateCompleted);
    });
  
    const totalAmount = billingRequests.reduce((acc, request) => acc + (request.totalAmount || 0), 0);
  
    // Add logo and company information
    pdfDoc.addImage(logo, 'JPEG', 160, 10, 30, 30);
    pdfDoc.setFontSize(10);
    pdfDoc.text("Oceania Port PMIS", 14, 20);
    pdfDoc.text("123 Ocean Drive", 14, 25);
    pdfDoc.text("Singapore 098765", 14, 30);
    pdfDoc.text("Phone: +65 1234 5678", 14, 35);
    pdfDoc.text("Email: contact@oceaniapmis.com", 14, 40);
  
    // Invoice Header
    pdfDoc.setFontSize(18);
    pdfDoc.text("Invoice", pdfDoc.internal.pageSize.width / 2, 50, { align: "center" });
    pdfDoc.setFontSize(10);
    pdfDoc.text(`Company ID: ${companyId}`, 14, 60);
    pdfDoc.text(`Month: ${format(startOfSelectedMonth, 'MMMM yyyy')}`, 14, 65);
    pdfDoc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy')}`, 14, 70);
  
    const commonTableStyles = {
      fontSize: 9,
      cellPadding: 1.5,
      lineWidth: 0.1,
    };

    const commonHeadStyles = {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontSize: 9
    };

    const commonAlternateRowStyles = {
      fillColor: [245, 245, 245]
    };

    pdfDoc.setFontSize(14);
    pdfDoc.text("Vessel Visit Billing Details", 14, 85);

    const vesselTableColumn = [
      "Vessel Visit",
      "Service Type",
      "Quantity",
      "Rate",
      "Amount",
      "Date Completed"
    ];

    const vesselTableRows = [];
    sortedGroups.forEach(([groupKey, requests]) => {
      if (groupKey !== 'facility_rental' && groupKey !== 'value_added_service') {
        requests.sort((a, b) => new Date(a.dateCompleted) - new Date(b.dateCompleted));
        requests.forEach((request) => {
          if (request.requestType === 'vesselvisit' && request.services) {
            request.services.forEach((service) => {
              vesselTableRows.push([
                `${request.vesselVisit} ${request.visitType ? `[${request.visitType}]` : ''}`,
                service.service,
                service.quantity,
                `$${parseFloat(service.rate).toFixed(2)}`,
                `$${parseFloat(service.amount || service.quantity * service.rate).toFixed(2)}`,
                format(parseISO(request.dateCompleted), 'dd/MM/yy')
              ]);
            });
          } else {
            vesselTableRows.push([
              request.vesselVisit || request.id,
              request.resourceType || request.operatorSkill,
              request.quantity || '-',
              `$${parseFloat(request.rate || 0).toFixed(2)}`,
              `$${parseFloat(request.totalAmount || 0).toFixed(2)}`,
              format(parseISO(request.dateCompleted), 'dd/MM/yy')
            ]);
          }
        });
      }
    });

    const vesselColumnWidths = {
      0: { cellWidth: 40 },  // Vessel Visit
      1: { cellWidth: 40 },  // Service Type
      2: { cellWidth: 20 },  // Quantity
      3: { cellWidth: 20 },  // Rate
      4: { cellWidth: 20 },  // Amount
      5: { cellWidth: 30 }   // Date Completed
    };

    pdfDoc.autoTable({
      head: [vesselTableColumn],
      body: vesselTableRows,
      startY: 90,
      styles: commonTableStyles,
      columnStyles: vesselColumnWidths,
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          pdfDoc.setFontSize(8);
          pdfDoc.text(
            `Page ${data.pageNumber}`,
            data.settings.margin.left,
            pdfDoc.internal.pageSize.height - 10
          );
        }
      },
      headStyles: commonHeadStyles,
      alternateRowStyles: commonAlternateRowStyles
    });

    pdfDoc.setFontSize(14);
    pdfDoc.text("Value Added Services Billing Details", 14, pdfDoc.lastAutoTable.finalY + 8);

    const valueAddedRequests = groupedRequests['value_added_service'];
    if (valueAddedRequests) {
      const valueAddedRows = valueAddedRequests.map((request) => [
        request.cargoNumber || '-',
        request.serviceType || '-',
        request.quantity || '-',
        `$${request.rate.toFixed(2)}`,
        `$${request.totalAmount.toFixed(2)}`,
        format(parseISO(request.dateCompleted), 'dd/MM/yy')
      ]);

      const valueAddedColumnWidths = {
        0: { cellWidth: 40 },     // Cargo Number 
        1: { cellWidth: 40 },     // Service Type 
        2: { cellWidth: 20 },     // Quantity 
        3: { cellWidth: 20 },     // Rate 
        4: { cellWidth: 20 },     // Total Amount 
        5: { cellWidth: 30 }      // Date Completed
      }

      pdfDoc.autoTable({
        head: [["Cargo Number", "Service Type", "Quantity", "Rate", "Amount", "Date Completed"]],
        body: valueAddedRows,
        startY: pdfDoc.lastAutoTable.finalY + 12,
        styles: commonTableStyles,
        columnStyles: valueAddedColumnWidths,
        margin: { left: 14, right: 14 },
        headStyles: commonHeadStyles,
        alternateRowStyles: commonAlternateRowStyles
      });
    }

    pdfDoc.setFontSize(14);
    pdfDoc.text("Facility Rental Billing Details", 14, pdfDoc.lastAutoTable.finalY + 8);

    const facilityRentalRequests = groupedRequests['facility_rental'];
    if (facilityRentalRequests) {
      const facilityRentalRows = facilityRentalRequests.map((request) => [
        request.facilityName || '-',
        request.quantity || '-',
        `$${request.rate.toFixed(2)}`,
        `$${request.totalAmount.toFixed(2)}`,
        format(parseISO(request.dateCompleted), 'dd/MM/yy')
      ]);

      const facilityColumnWidths = {
        0: { cellWidth: 35 },     // Facility Name
        1: { cellWidth: 35 },     // Qty
        2: { cellWidth: 35 },     // Rate
        3: { cellWidth: 35 },     // Total Amount
        4: { cellWidth: 30 }      // Date Completed
      };

      pdfDoc.autoTable({
        head: [["Facility Name", "Quantity", "Rate", "Amount", "Date Completed"]],
        body: facilityRentalRows,
        startY: pdfDoc.lastAutoTable.finalY + 12,
        styles: commonTableStyles,
        columnStyles: facilityColumnWidths,
        margin: { left: 14, right: 14 },
        headStyles: commonHeadStyles,
        alternateRowStyles: commonAlternateRowStyles
      });
    }

    pdfDoc.setFontSize(12);
    pdfDoc.setFont(undefined, 'bold');
    pdfDoc.text(`Total Amount: $${totalAmount.toFixed(2)}`, 14, pdfDoc.lastAutoTable.finalY + 10);

    const pdfBlob = pdfDoc.output('blob');
    const fileName = `invoice_${companyId}_${format(startOfSelectedMonth, 'MMMM_yyyy')}.pdf`;

    try {
      const pdfRef = ref(storage, `invoices/${fileName}`);
      await uploadBytes(pdfRef, pdfBlob);
      const downloadUrl = await getDownloadURL(pdfRef);

      const dueDate = format(addMonths(new Date(), 1), 'dd/MM/yyyy');
      await setDoc(doc(db, 'invoices', `${companyId}_${format(startOfSelectedMonth, 'MMMM_yyyy')}`), {
        companyId,
        month: format(startOfSelectedMonth, 'MMMM yyyy'),
        totalAmount,
        pdfUrl: downloadUrl,
        dueDate,
        generatedAt: serverTimestamp(),
        status: 'Unpaid',
      });

      setError(null);
      fetchInvoices();
    } catch (error) {
      console.error("Error uploading invoice to Firebase:", error);
      setError("Failed to upload the invoice. Please try again.");
    } finally {
      setLoading(false);
    }
};

  const handleDownload = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = "invoice.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openSignDialogForInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setOpenSignDialog(true);
  };
  const startDrawing = (e) => {
    isDrawing.current = true;
    const ctx = canvasRef.current.getContext("2d");
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
  };
  
  const draw = (e) => {
    if (!isDrawing.current) return;
    const ctx = canvasRef.current.getContext("2d");
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    canvasRef.current.getContext("2d").beginPath(); 
  };
  
  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();  
  };    

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info', 
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Billing Invoice</Typography>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Select Month</InputLabel>
        <Select value={selectedMonth} onChange={handleMonthChange} label="Select Month">
          {[...Array(12).keys()].map((month) => {
            const date = new Date();
            date.setMonth(month);
            return (
              <MenuItem key={month} value={date.toISOString().substring(0, 7)}>
                {format(date, 'MMMM yyyy')}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      <Button variant="contained" color="primary" onClick={handleGenerateInvoice} disabled={loading}>
        {loading ? <CircularProgress size={24} /> : "Generate Invoice"}
      </Button>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      <Typography variant="h5" sx={{ mt: 4 }}>Generated Invoices</Typography>
      <TableContainer sx={{ mt: 2 }}>
        <Table>
        <TableHead>
          <TableRow>
            <TableCell>Invoice Month</TableCell>
            <TableCell>Total Amount</TableCell>
            <TableCell>Due Date for Payment</TableCell>
            <TableCell>Status</TableCell> 
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>{invoice.month}</TableCell>
              <TableCell>${parseFloat(invoice.totalAmount).toFixed(2)}</TableCell>
              <TableCell>{invoice.dueDate}</TableCell>
              <TableCell>{invoice.status}</TableCell> 
              <TableCell>
                <IconButton onClick={() => setSelectedPdfUrl(invoice.pdfUrl)}>
                  <VisibilityIcon />
                </IconButton>
                <IconButton onClick={() => handleDownload(invoice.pdfUrl)}>
                  <DownloadIcon />
                </IconButton>
                {invoice.status === 'Unpaid' && (
                  <IconButton onClick={() => openSignDialogForInvoice(invoice)}>
                    <EditIcon />
                  </IconButton>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        </Table>
      </TableContainer>

      {selectedPdfUrl && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6">Invoice Preview:</Typography>
          <iframe
            src={selectedPdfUrl}
            title="Invoice Preview"
            width="80%"
            height="1000px"
            style={{ border: 'none' }}
          />
        </Box>
      )}

      <Dialog 
        open={openSignDialog} 
        onClose={() => setOpenSignDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Sign Invoice</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please sign in the box below:
          </Typography>
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2
            }}
          >
            <canvas
              ref={canvasRef}
              width={400}
              height={200}
              style={{ 
                border: "1px solid #ccc",
                borderRadius: "4px",
                backgroundColor: "#fff",
                cursor: "crosshair"
              }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
            <Button 
              onClick={handleClearCanvas}
              variant="outlined"
              startIcon={<ClearIcon />}
            >
              Clear Signature
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSignDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveSignature} 
            color="primary" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Save Signature"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={openConfirmationDialog}
        onClose={() => setOpenConfirmationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          Important: Payment Confirmation
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Please confirm the following:
          </Alert>
          <Typography variant="body1" gutterBottom>
            • I understand that signing this invoice indicates that payment has been made
          </Typography>
          <Typography variant="body1" gutterBottom>
            • This action cannot be undone
          </Typography>
          <Typography variant="body1" sx={{ mt: 2, fontWeight: 'bold', color: 'primary.main' }}>
            Total Amount: ${selectedInvoice?.totalAmount.toFixed(2)}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setOpenConfirmationDialog(false)}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSignatureConfirmation}
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={20} /> : null}
            disabled={loading}
          >
            Confirm and Sign
          </Button>
        </DialogActions>
      </Dialog>
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
    </Box>
  );
};

export default Invoice;