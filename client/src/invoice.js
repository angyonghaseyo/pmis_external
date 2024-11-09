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
} from '@mui/material';
import { getBillingRequestsByMonth1 } from './services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format, parseISO, addMonths } from 'date-fns';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from './firebaseConfig';
import { doc, setDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import logo from './logo.jpg';

const storage = getStorage();

const Invoice = ({ companyId }) => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [billingRequests, setBillingRequests] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState('');
  const [openSignDialog, setOpenSignDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
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

  const fetchBillingRequests = async (monthRange) => {
    try {
      const data = await getBillingRequestsByMonth1(companyId, monthRange);
      setBillingRequests(data);
    } catch (error) {
      console.error("Error fetching billing requests by month:", error);
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
    const totalAmount = billingRequests.reduce((acc, request) => acc + (request.totalAmount || 0), 0);

    // Add logo with a 1:1 aspect ratio
    pdfDoc.addImage(logo, 'JPEG', 160, 10, 30, 30);

    // Company Information
    pdfDoc.setFontSize(10);
    pdfDoc.text("Oceania Port PMIS", 14, 20);
    pdfDoc.text("123 Ocean Drive", 14, 25);
    pdfDoc.text("Singapore 098765", 14, 30);
    pdfDoc.text("Phone: +65 1234 5678", 14, 35);
    pdfDoc.text("Email: contact@oceaniapmis.com", 14, 40);

    // Invoice Header
    pdfDoc.setFontSize(18);
    pdfDoc.text("Invoice", pdfDoc.internal.pageSize.width / 2, 50, { align: "center" });
    pdfDoc.setFontSize(12);
    pdfDoc.text(`Company ID: ${companyId}`, 14, 60);
    pdfDoc.text(`Month: ${format(startOfSelectedMonth, 'MMMM yyyy')}`, 14, 65);
    pdfDoc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy')}`, 14, 70);

    const tableColumn = ["Vessel Visit", "Type", "Date Completed", "Rate", "Quantity", "Total Amount"];
    const tableRows = billingRequests.map((request) => [
      request.vesselVisit || request.id,
      request.resourceType || request.operatorSkill,
      format(parseISO(request.dateCompleted), 'dd/MM/yyyy'),
      `$${(request.rate || 0).toLocaleString()}`,
      request.quantity || 0,
      `$${(request.totalAmount || 0).toLocaleString()}`,
    ]);

    pdfDoc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 80,
      styles: { fontSize: 10 },
    });

    pdfDoc.text(`Total Amount: $${totalAmount.toLocaleString()}`, 14, pdfDoc.lastAutoTable.finalY + 10);

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

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSaveSignature = async () => {
    if (!canvasRef.current) return;
  
    // Convert the drawn signature to a data URL
    const signatureDataUrl = canvasRef.current.toDataURL("image/png");
  
    // Retrieve the original invoice details to keep the table data
    const pdfDoc = new jsPDF();
    const totalAmount = billingRequests.reduce((acc, request) => acc + (request.totalAmount || 0), 0);
  
    // Add logo and company information
    pdfDoc.addImage(logo, 'JPEG', 160, 10, 30, 30);
    pdfDoc.setFontSize(10);
    pdfDoc.text("Oceania Port PMIS", 14, 20);
    pdfDoc.text("123 Ocean Drive", 14, 25);
    pdfDoc.text("Singapore 098765", 14, 30);
    pdfDoc.text("Phone: +65 1234 5678", 14, 35);
    pdfDoc.text("Email: contact@oceaniapm.com", 14, 40);
  
    // Invoice details
    pdfDoc.setFontSize(18);
    pdfDoc.text("Invoice", pdfDoc.internal.pageSize.width / 2, 50, { align: "center" });
    pdfDoc.setFontSize(12);
    pdfDoc.text(`Company ID: ${companyId}`, 14, 60);
    pdfDoc.text(`Month: ${selectedInvoice.month}`, 14, 65);
    pdfDoc.text(`Generated on: ${format(new Date(selectedInvoice.generatedAt.seconds * 1000), 'dd/MM/yyyy')}`, 14, 70);
  
    const tableColumn = ["Vessel Visit", "Type", "Date Completed", "Rate", "Quantity", "Total Amount"];
    const tableRows = billingRequests.map((request) => [
      request.vesselVisit || request.id,
      request.resourceType || request.operatorSkill,
      format(parseISO(request.dateCompleted), 'dd/MM/yyyy'),
      `$${(request.rate || 0).toLocaleString()}`,
      request.quantity || 0,
      `$${(request.totalAmount || 0).toLocaleString()}`,
    ]);
  
    pdfDoc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 80,
      styles: { fontSize: 10 },
    });
  
    pdfDoc.text(`Total Amount: $${totalAmount.toLocaleString()}`, 14, pdfDoc.lastAutoTable.finalY + 10);
  
    // Add signature image and signing details below the table
    pdfDoc.addImage(signatureDataUrl, 'PNG', 14, pdfDoc.lastAutoTable.finalY + 20, 50, 20);
    pdfDoc.text(`Signed by: ${companyId}`, 14, pdfDoc.lastAutoTable.finalY + 45);
    pdfDoc.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, 14, pdfDoc.lastAutoTable.finalY + 50);
  
    // Convert PDF to blob for Firebase upload
    const pdfBlob = pdfDoc.output('blob');
    const fileName = `invoice_${companyId}_${format(new Date(), 'MMMM_yyyy')}.pdf`;
  
    try {
      // Upload the signed PDF to replace the original file in Firebase
      const pdfRef = ref(storage, `invoices/${fileName}`);
      await uploadBytes(pdfRef, pdfBlob);
  
      // Retrieve the download URL for the new signed PDF
      const signedDownloadUrl = await getDownloadURL(pdfRef);
  
      // Update the Firestore document with the new signed PDF URL
      await setDoc(doc(db, 'invoices', selectedInvoice.id), {
        ...selectedInvoice, // Preserve existing document data
        pdfUrl: signedDownloadUrl,
        signedAt: serverTimestamp(), // Record the signature timestamp
      });
  
      setSelectedPdfUrl(signedDownloadUrl); // Set this URL to display the signed PDF in the iframe or for download
      setOpenSignDialog(false);
      setSelectedInvoice(null);
      fetchInvoices(); // Refresh the invoice list with the signed invoice
  
    } catch (error) {
      console.error("Error uploading or retrieving signed invoice:", error);
      setError("Failed to upload the signed invoice. Please try again.");
    }
  };

  const startDrawing = (e) => {
    isDrawing.current = true;
    const ctx = canvasRef.current.getContext("2d");
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Generate Invoice</Typography>
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
              <TableCell>Due Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>{invoice.month}</TableCell>
                <TableCell>${invoice.totalAmount}</TableCell>
                <TableCell>{invoice.dueDate}</TableCell>
                <TableCell>
                  <IconButton onClick={() => setSelectedPdfUrl(invoice.pdfUrl)}>
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDownload(invoice.pdfUrl)}>
                    <DownloadIcon />
                  </IconButton>
                  <IconButton onClick={() => openSignDialogForInvoice(invoice)}>
                    <EditIcon />
                  </IconButton>
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
            width="100%"
            height="600px"
            style={{ border: 'none' }}
          />
        </Box>
      )}

      <Dialog open={openSignDialog} onClose={() => setOpenSignDialog(false)}>
        <DialogTitle>Sign Invoice</DialogTitle>
        <DialogContent>
          <canvas
            ref={canvasRef}
            width={400}
            height={200}
            style={{ border: "1px solid black" }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
          <Button onClick={handleClearCanvas}>Clear</Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSignDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveSignature} color="primary">Save Signature</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Invoice;
