import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getPricingRates } from '../services/api';

const PricingRates = () => {
  const [rates, setRates] = useState({
    operatorRequest: {
      tugboat: '',
      pilot: ''
    },
    adHocResourceRequest: {
      water: '',
      fuel: { 
        marineDiesel: '', 
        heavyFuelOil: '', 
        LNG: '' 
      },
      power: '',
      wasteRemoval: { 
        hazardous: '', 
        nonHazardous: '', 
        organic: '' 
      }
    },
    vesselVisit: {
      berths: {
        B1: '', 
        B2: '', 
        B3: '', 
        B4: '', 
        B5: '', 
        B6: '', 
        B7: '', 
        B8: '', 
      },
      containerRate: '',
      pilotageRate: '',
      tugRate: '',
    },
    cargoServices: {
      sampling: '',    
      repacking: '',   
      transloading: '',
      cargoStorage: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const fetchedRates = await getPricingRates();
      if (fetchedRates) {
        setRates(fetchedRates);
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
      setError('Failed to load pricing rates. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Service Pricing Rates
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
          Reference guide for all service rates and charges. All rates are in SGD.
        </Typography>
      </Box>

      {/* Vessel Visit Rates */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Vessel Visit Rates</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Service</TableCell>
                  <TableCell align="right">Rate (SGD)</TableCell>
                  <TableCell>Unit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(rates.vesselVisit.berths).map(([berth, rate]) => (
                  <TableRow key={berth}>
                    <TableCell>Berth {berth}</TableCell>
                    <TableCell align="right">{parseFloat(rate).toFixed(2)}</TableCell>
                    <TableCell>Per Hour</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell>Container Handling</TableCell>
                  <TableCell align="right">{parseFloat(rates.vesselVisit.containerRate).toFixed(2)}</TableCell>
                  <TableCell>Per Container</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>

      {/* Value Added Services Rates */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Value Added Services</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Service</TableCell>
                  <TableCell align="right">Rate (SGD)</TableCell>
                  <TableCell>Unit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Sampling</TableCell>
                  <TableCell align="right">{parseFloat(rates.cargoServices.sampling).toFixed(2)}</TableCell>
                  <TableCell>Per Sample</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Repacking</TableCell>
                  <TableCell align="right">{parseFloat(rates.cargoServices.repacking).toFixed(2)}</TableCell>
                  <TableCell>Per Item</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Transloading</TableCell>
                  <TableCell align="right">{parseFloat(rates.cargoServices.transloading).toFixed(2)}</TableCell>
                  <TableCell>Per Operation</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Storage</TableCell>
                  <TableCell align="right">{parseFloat(rates.cargoServices.cargoStorage).toFixed(2)}</TableCell>
                  <TableCell>Per Hour</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>

      {/* Ad Hoc Resource Rates */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Ad Hoc Resources</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Resource</TableCell>
                  <TableCell align="right">Rate (SGD)</TableCell>
                  <TableCell>Unit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Water Supply</TableCell>
                  <TableCell align="right">{parseFloat(rates.adHocResourceRequest.water).toFixed(2)}</TableCell>
                  <TableCell>Per Liter</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Power Supply</TableCell>
                  <TableCell align="right">{parseFloat(rates.adHocResourceRequest.power).toFixed(2)}</TableCell>
                  <TableCell>Per kW/h</TableCell>
                </TableRow>
                {/* Fuel Types */}
                {Object.entries(rates.adHocResourceRequest.fuel).map(([type, rate]) => (
                  <TableRow key={type}>
                    <TableCell>
                      {type === 'marineDiesel' ? 'Marine Diesel' :
                       type === 'heavyFuelOil' ? 'Heavy Fuel Oil' :
                       'LNG'}
                    </TableCell>
                    <TableCell align="right">{parseFloat(rate).toFixed(2)}</TableCell>
                    <TableCell>Per Liter</TableCell>
                  </TableRow>
                ))}
                {/* Waste Removal */}
                {Object.entries(rates.adHocResourceRequest.wasteRemoval).map(([type, rate]) => (
                  <TableRow key={type}>
                    <TableCell>
                      Waste Removal - {type.charAt(0).toUpperCase() + type.slice(1)}
                    </TableCell>
                    <TableCell align="right">{parseFloat(rate).toFixed(2)}</TableCell>
                    <TableCell>Per m³</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>

      {/* Operator Rates */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Operator Services</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Service</TableCell>
                  <TableCell align="right">Rate (SGD)</TableCell>
                  <TableCell>Unit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Pilot Operator</TableCell>
                  <TableCell align="right">{parseFloat(rates.operatorRequest.pilot).toFixed(2)}</TableCell>
                  <TableCell>Per Hour</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Tugboat Operator</TableCell>
                  <TableCell align="right">{parseFloat(rates.operatorRequest.tugboat).toFixed(2)}</TableCell>
                  <TableCell>Per Hour</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>

      <Box sx={{ mt: 4 }}>
        <Typography variant="body2" color="textSecondary">
          * All rates are subject to change. Please contact us for any inquiries about the rates.
        </Typography>
        <Typography variant="body2" color="textSecondary">
          * Additional charges may apply for special requirements or after-hour services.
        </Typography>
      </Box>
    </Box>
  );
};

export default PricingRates;