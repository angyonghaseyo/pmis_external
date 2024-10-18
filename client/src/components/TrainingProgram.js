import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { getTrainingPrograms, enrollInTrainingProgram } from '../services/api';

const TrainingProgram = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchTrainingPrograms();
  }, []);

  const fetchTrainingPrograms = async () => {
    try {
      setLoading(true);
      const data = await getTrainingPrograms();
      setPrograms(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching training programs:', err);
      setError('Failed to fetch training programs. Please try again later.');
      setLoading(false);
    }
  };

  const handleEnroll = async (programId) => {
    try {
      await enrollInTrainingProgram(programId);
      setSnackbar({ open: true, message: 'Successfully enrolled in the program', severity: 'success' });
      fetchTrainingPrograms(); // Refresh the list to show updated enrollment status
    } catch (err) {
      console.error('Error enrolling in program:', err);
      setSnackbar({ open: true, message: 'Failed to enroll in the program', severity: 'error' });
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Training Programs</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Program Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Available Slots</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {programs.map((program) => (
              <TableRow key={program.id}>
                <TableCell>{program.name}</TableCell>
                <TableCell>{program.description}</TableCell>
                <TableCell>{new Date(program.startDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(program.endDate).toLocaleDateString()}</TableCell>
                <TableCell>{program.availableSlots}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleEnroll(program.id)}
                    disabled={program.availableSlots === 0 || program.isEnrolled}
                  >
                    {program.isEnrolled ? 'Enrolled' : 'Enroll'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TrainingProgram;