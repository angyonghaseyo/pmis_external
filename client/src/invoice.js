import React, { useState, useEffect } from 'react';
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
import logo from './logo.jpg';

const storage = getStorage();

const Invoice = ({ companyId }) => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [billingRequests, setBillingRequests] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState('');

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
  
    // Group billing requests by vessel visit and separate facility rentals
    const groupedRequests = billingRequests.reduce((acc, request) => {
      const groupKey = request.requestType === 'facilityrental' ? 'facility_rental' : request.vesselVisit || 'no-vessel';
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(request);
      return acc;
    }, {});
  
    const sortedGroups = Object.entries(groupedRequests).sort((a, b) => {
      if (a[0] === 'facility_rental') return 1;
      if (b[0] === 'facility_rental') return -1;
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
    pdfDoc.setFontSize(12);
    pdfDoc.text(`Company ID: ${companyId}`, 14, 60);
    pdfDoc.text(`Month: ${format(startOfSelectedMonth, 'MMMM yyyy')}`, 14, 65);
    pdfDoc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy')}`, 14, 70);
  
    // Vessel Visit Billing Details Title
    pdfDoc.setFontSize(14);
    pdfDoc.text("Vessel Visit Billing Details", 14, 85);

    // Common table styles
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

    // Vessel Visits Table
    const vesselTableColumn = [
      "Vessel Visit",
      "Service Type",
      "Qty",
      "Rate",
      "Details",
      "Amount",
      "Date"
    ];

    const vesselTableRows = [];
    sortedGroups.forEach(([groupKey, requests]) => {
      if (groupKey !== 'facility_rental') {
        requests.sort((a, b) => new Date(a.dateCompleted) - new Date(b.dateCompleted));
        requests.forEach((request) => {
          if (request.requestType === 'vesselvisit' && request.services) {
            request.services.forEach((service) => {
              vesselTableRows.push([
                `${request.vesselVisit} ${request.visitType ? `[${request.visitType}]` : ''}`,
                service.service,
                service.quantity,
                `$${parseFloat(service.rate).toFixed(2)}`,
                service.details || '-',
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
              '-',
              `$${parseFloat(request.totalAmount || 0).toFixed(2)}`,
              format(parseISO(request.dateCompleted), 'dd/MM/yy')
            ]);
          }
        });
      }
    });

    const vesselColumnWidths = {
      0: { cellWidth: 25 },  // Vessel Visit
      1: { cellWidth: 30 },  // Service Type
      2: { cellWidth: 15 },  // Qty
      3: { cellWidth: 20 },  // Rate
      4: { cellWidth: 35 },  // Details
      5: { cellWidth: 20 },  // Amount
      6: { cellWidth: 20 }   // Date
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

    // Calculate total width of vessel visits table
    const totalTableWidth = Object.values(vesselColumnWidths).reduce((sum, col) => sum + col.cellWidth, 0);

    // Facility Rentals Table Title
    pdfDoc.setFontSize(14);
    pdfDoc.text("Facility Rental Billing Details", 14, pdfDoc.lastAutoTable.finalY + 8);

    // Facility Rentals Table
    const facilityRentalRequests = groupedRequests['facility_rental'];
    if (facilityRentalRequests) {
      const facilityRentalRows = facilityRentalRequests.map((request) => [
        request.facilityName || '-',
        request.quantity || '-',
        `$${request.rate.toFixed(2)}`,
        `$${request.totalAmount.toFixed(2)}`,
        format(parseISO(request.dateCompleted), 'dd/MM/yy')
      ]);

      // Adjust facility rental table column widths to match total width of vessel visits table
      const facilityColumnWidths = {
        0: { cellWidth: 50 },     // Facility Name
        1: { cellWidth: 25 },     // Qty
        2: { cellWidth: 35 },     // Rate
        3: { cellWidth: 35 },     // Total Amount
        4: { cellWidth: 20 }      // Date Completed
      };

      pdfDoc.autoTable({
        head: [["Facility Name", "Qty", "Rate", "Total Amount", "Date Completed"]],
        body: facilityRentalRows,
        startY: pdfDoc.lastAutoTable.finalY + 12,
        styles: commonTableStyles,
        columnStyles: facilityColumnWidths,
        margin: { left: 14, right: 14 },
        headStyles: commonHeadStyles,
        alternateRowStyles: commonAlternateRowStyles
      });
    }

    // Total Amount
    pdfDoc.setFontSize(11);
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
    </Box>
  );
};

export default Invoice;