import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Snackbar,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  getTrainingPrograms,
  registerForProgram,
  withdrawFromProgram,
  getUserData
} from '../services/api';

function TrainingProgram() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolledPrograms, setEnrolledPrograms] = useState([]);
  const [availablePrograms, setAvailablePrograms] = useState([]);
  const [completedPrograms, setCompletedPrograms] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [user, setUser] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userData = await getUserData();
      setUser(userData);
      if (userData) {
        fetchTrainingPrograms(userData);
      } else {
        setLoading(false);
        setError('Please log in to view training programs.');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to fetch user data. Please try again.');
      setLoading(false);
    }
  };

  const fetchTrainingPrograms = async (userData) => {
    try {
      setLoading(true);
      const allPrograms = await getTrainingPrograms();

      const now = new Date();
      const enrolled = [];
      const available = [];
      const completed = [];

      allPrograms.forEach((program) => {
        const startDate = new Date(program.startDate);
        const endDate = new Date(program.endDate);
        const userEnrollment = userData.enrolledPrograms?.find(ep => ep.programId === program.id);

        if (userEnrollment) {
          if (now <= endDate) {
            enrolled.push({ ...program, enrollmentDate: userEnrollment.enrollmentDate });
          } else {
            completed.push({ ...program, enrollmentDate: userEnrollment.enrollmentDate });
          }
        } else if (now < startDate && program.numberOfCurrentRegistrations < program.participantCapacity) {
          available.push(program);
        }
      });

      setEnrolledPrograms(enrolled);
      setAvailablePrograms(available);
      setCompletedPrograms(completed);
    } catch (err) {
      console.error('Error fetching training programs:', err);
      setError('Failed to fetch training programs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = async (programId) => {
    try {
      await registerForProgram(programId);
      setSnackbar({ open: true, message: 'Successfully registered for the program', severity: 'success' });
      fetchTrainingPrograms(user);
    } catch (error) {
      console.error('Error registering for program:', error);
      setSnackbar({ open: true, message: 'Failed to register for the program', severity: 'error' });
    }
  };

  const handleWithdrawClick = async (programId) => {
    try {
      await withdrawFromProgram(programId);
      setSnackbar({ open: true, message: 'Successfully withdrawn from the program', severity: 'success' });
      fetchTrainingPrograms(user);
    } catch (error) {
      console.error('Error withdrawing from program:', error);
      setSnackbar({ open: true, message: 'Failed to withdraw from the program', severity: 'error' });
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" height="100vh"><CircularProgress /></Box>;
  }

  if (error) {
    return <Typography color="error" align="center">{error}</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Training Programs
      </Typography>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Enrolled Programs" />
        <Tab label="Available Programs" />
        <Tab label="Completed Programs" />
      </Tabs>

      {tabValue === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Mode</TableCell>
                <TableCell>Enrollment Date</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {enrolledPrograms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">No enrolled programs</TableCell>
                </TableRow>
              ) : (
                enrolledPrograms.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell>{program.name}</TableCell>
                    <TableCell>{program.description}</TableCell>
                    <TableCell>{new Date(program.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(program.endDate).toLocaleDateString()}</TableCell>
                    <TableCell>{program.mode}</TableCell>
                    <TableCell>{new Date(program.enrollmentDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => handleWithdrawClick(program.id)}
                      >
                        Withdraw
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tabValue === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Mode</TableCell>
                <TableCell>Available Slots</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {availablePrograms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">No available programs</TableCell>
                </TableRow>
              ) : (
                availablePrograms.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell>{program.name}</TableCell>
                    <TableCell>{program.description}</TableCell>
                    <TableCell>{new Date(program.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(program.endDate).toLocaleDateString()}</TableCell>
                    <TableCell>{program.mode}</TableCell>
                    <TableCell>{program.participantCapacity - program.numberOfCurrentRegistrations}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleRegisterClick(program.id)}
                      >
                        Register
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tabValue === 2 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Mode</TableCell>
                <TableCell>Enrollment Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {completedPrograms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">No completed programs</TableCell>
                </TableRow>
              ) : (
                completedPrograms.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell>{program.name}</TableCell>
                    <TableCell>{program.description}</TableCell>
                    <TableCell>{new Date(program.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(program.endDate).toLocaleDateString()}</TableCell>
                    <TableCell>{program.mode}</TableCell>
                    <TableCell>{new Date(program.enrollmentDate).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default TrainingProgram;