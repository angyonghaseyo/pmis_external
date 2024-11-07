import React, { useState } from 'react';
import CustomsTradeManager from './CustomsTradeManager';
import {
  Button,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Box
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab';
import {
  LocalShipping,
  Description,
  Inventory,
  CheckCircle
} from '@mui/icons-material';

// Import shipment status constants
const shipmentStatus = {
  DOCUMENTS_PREPARATION: 'DOCUMENTS_PREPARATION',
  CUSTOMS_CLEARANCE: 'CUSTOMS_CLEARANCE',
  PORT_HANDLING: 'PORT_HANDLING',
  DELIVERY: 'DELIVERY',
  COMPLETED: 'COMPLETED'
};

const CustomsPreview = () => {
  const [shipmentId, setShipmentId] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const manager = new CustomsTradeManager();

  // Helper function to update timeline
  const updateTimelineState = async (id) => {
    const updatedTimeline = await manager.getShipmentTimeline(id);
    console.log('Updated timeline:', updatedTimeline);
    setTimeline(updatedTimeline);
    return updatedTimeline;
  };

  const simulateImport = async () => {
    setLoading(true);
    try {
      console.log('Starting import process...');
      
      // Create shipment
      const newShipmentId = await manager.createShipment({
        importer: 'LuxeFurnish SG',
        goods: 'Designer Sofas',
        quantity: 5,
        origin: 'Italy',
        containerNumber: 'MSKU1234567',
        vessel: 'Maersk Victoria'
      });
      console.log('Shipment created with ID:', newShipmentId);
      
      setShipmentId(newShipmentId);
      
      // Upload documents
      console.log('Uploading documents...');
      await manager.uploadDocument(newShipmentId, 'COMMERCIAL_INVOICE', {
        invoiceNumber: 'INV-2024-001',
        supplier: 'Italian Luxury Furniture',
        value: 50000
      });

      await manager.uploadDocument(newShipmentId, 'CERTIFICATE_OF_ORIGIN', {
        certificateNumber: 'CO-IT-2024-001',
        issuingAuthority: 'Italian Chamber of Commerce'
      });

      // Update timeline at the end
      await updateTimelineState(newShipmentId);
      
    } catch (error) {
      console.error('Error in simulation:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitCustomsDeclaration = async () => {
    if (!shipmentId) return;
    setLoading(true);
    try {
      console.log('Submitting customs declaration...');
      await manager.submitCustomsDeclaration(shipmentId, {
        hsCode: '9401.61',
        value: 50000,
        description: 'Upholstered wooden frame sofas',
        quantity: 5
      });
      await updateTimelineState(shipmentId);
    } catch (error) {
      console.error('Error submitting customs declaration:', error);
    } finally {
      setLoading(false);
    }
  };

  const processArrival = async () => {
    if (!shipmentId) return;
    setLoading(true);
    try {
      console.log('Processing arrival...');
      await manager.processContainerArrival(shipmentId, {
        arrivalTime: new Date(),
        location: 'CFS Station A',
        condition: 'Good'
      });
      await updateTimelineState(shipmentId);
    } catch (error) {
      console.error('Error processing arrival:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeDelivery = async () => {
    if (!shipmentId) return;
    setLoading(true);
    try {
      console.log('Completing delivery...');
      await manager.completeDelivery(shipmentId, {
        driver: 'John Doe',
        vehicle: 'GA1234B',
        timestamp: new Date(),
        receivedBy: 'LuxeFurnish Warehouse Manager'
      });
      await updateTimelineState(shipmentId);
    } catch (error) {
      console.error('Error completing delivery:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimelineDotColor = (status) => {
    switch (status) {
      case shipmentStatus.DOCUMENTS_PREPARATION:
        return 'info';
      case shipmentStatus.CUSTOMS_CLEARANCE:
        return 'warning';
      case shipmentStatus.PORT_HANDLING:
        return 'secondary';
      case shipmentStatus.COMPLETED:
        return 'success';
      default:
        return 'grey';
    }
  };

  // Log current state whenever it changes
  React.useEffect(() => {
    console.log('State updated:', {
      shipmentId,
      timeline: timeline,
      timelineLength: timeline.length,
      loading,
      buttonStates: {
        customsDeclaration: loading || !shipmentId || timeline.length < 2,
        processArrival: loading || !shipmentId || timeline.length < 3,
        completeDelivery: loading || !shipmentId || timeline.length < 4
      }
    });
  }, [shipmentId, timeline, loading]);

  return (
    <Box sx={{ maxWidth: '1200px', margin: 'auto', padding: 4 }}>
      <Paper elevation={3} sx={{ padding: 3, marginBottom: 4 }}>
        <Typography variant="h4" gutterBottom>
          Customs & Trade Documents Management
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, marginBottom: 4, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<Description />}
            onClick={simulateImport}
            disabled={Boolean(loading || shipmentId)}
          >
            Start Import Process
          </Button>
          
          <Button
            variant="contained"
            startIcon={<Inventory />}
            onClick={submitCustomsDeclaration}
            disabled={Boolean(loading || !shipmentId || timeline.length < 2)}
            sx={{ backgroundColor: loading || !shipmentId || timeline.length < 2 ? 'grey.400' : 'primary.main' }}
          >
            Submit Customs Declaration
            {loading || !shipmentId || timeline.length < 2 ? 
              ` (Needs ${2 - timeline.length} more events)` : ''}
          </Button>
          
          <Button
            variant="contained"
            startIcon={<LocalShipping />}
            onClick={processArrival}
            disabled={Boolean(loading || !shipmentId || timeline.length < 3)}
            sx={{ backgroundColor: loading || !shipmentId || timeline.length < 3 ? 'grey.400' : 'primary.main' }}
          >
            Process Arrival
            {loading || !shipmentId || timeline.length < 3 ? 
              ` (Needs ${3 - timeline.length} more events)` : ''}
          </Button>
          
          <Button
            variant="contained"
            startIcon={<CheckCircle />}
            onClick={completeDelivery}
            disabled={Boolean(loading || !shipmentId || timeline.length < 4)}
            sx={{ backgroundColor: loading || !shipmentId || timeline.length < 4 ? 'grey.400' : 'primary.main' }}
          >
            Complete Delivery
            {loading || !shipmentId || timeline.length < 4 ? 
              ` (Needs ${4 - timeline.length} more events)` : ''}
          </Button>
        </Box>

        {/* Debug information */}
        <Box sx={{ marginBottom: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Debug Info:
          </Typography>
          <Typography variant="body2">
            ShipmentId: {shipmentId || 'None'}<br />
            Timeline Length: {timeline.length}<br />
            Loading: {loading.toString()}
          </Typography>
        </Box>

        {shipmentId && (
          <Card>
            <CardHeader title="Shipment Timeline" />
            <CardContent>
              <Timeline>
                {timeline.map((event, index) => (
                  <TimelineItem key={index}>
                    <TimelineSeparator>
                      <TimelineDot color={getTimelineDotColor(event.status)} />
                      {index < timeline.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="h6" component="span">
                        {event.status}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {event.timestamp instanceof Date 
                          ? event.timestamp.toLocaleString()
                          : new Date(event.timestamp.seconds * 1000).toLocaleString()}
                      </Typography>
                      {event.note && (
                        <Typography variant="body2">
                          {event.note}
                        </Typography>
                      )}
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </CardContent>
          </Card>
        )}
      </Paper>
    </Box>
  );
};

export default CustomsPreview;