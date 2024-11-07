import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Snackbar, Alert, Tabs, Tab } from '@mui/material';
import { getTrainingPrograms, registerForProgram, withdrawFromProgram, getUserUpdatedData } from './services/api';
import { useAuth } from './AuthContext';

function TrainingProgram() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolledPrograms, setEnrolledPrograms] = useState([]);
  const [availablePrograms, setAvailablePrograms] = useState([]);
  const [completedPrograms, setCompletedPrograms] = useState([]);
  const [programsData, setProgramsData] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await fetchTrainingPrograms();
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load training programs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchTrainingPrograms = async () => {
    try {
      setLoading(true);
      if (!user) {
        setError('No authenticated user found');
        setLoading(false);
        return;
      }

      // Fetch both training programs and updated user data
      const [allPrograms, userData] = await Promise.all([
        getTrainingPrograms(),
        getUserUpdatedData(user.email)
      ]);

      console.log('User Data:', userData);
      console.log('All Programs:', allPrograms);

      const now = new Date();
      const enrolled = [];
      const available = [];
      const completed = [];

      allPrograms.forEach((program) => {
        const startDate = new Date(program.startDate);
        const endDate = new Date(program.endDate);
        const userEnrollment = userData.enrolledPrograms?.find(ep => ep.programId === program.id);

        console.log('Program:', program.name, 'User Enrollment:', userEnrollment);

        // Store program data for access to current registration numbers
        setProgramsData(prev => ({
          ...prev,
          [program.id]: {
            numberOfCurrentRegistrations: program.numberOfCurrentRegistrations,
            participantCapacity: program.participantCapacity
          }
        }));

        if (userEnrollment) {
          // Convert Firestore timestamp to Date object if it exists
          const enrollmentDate = userEnrollment.enrollmentDate?.toDate?.() || 
                               new Date(userEnrollment.enrollmentDate);

          console.log('Enrollment Date:', enrollmentDate);

          if (now <= endDate) {
            enrolled.push({ 
              ...program, 
              enrollmentDate: enrollmentDate
            });
          } else {
            completed.push({ 
              ...program, 
              enrollmentDate: enrollmentDate
            });
          }
        } else if (now < startDate && program.numberOfCurrentRegistrations < program.participantCapacity) {
          available.push(program);
        }
      });

      console.log('Enrolled Programs:', enrolled);
      console.log('Available Programs:', available);
      console.log('Completed Programs:', completed);

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
      if (!user) {
        setSnackbar({ open: true, message: 'You must be logged in to register', severity: 'error' });
        return;
      }
      
      await registerForProgram(programId, user.email);
      setSnackbar({ open: true, message: 'Successfully registered for the program', severity: 'success' });
      
      // Update local state immediately for better UX
      setProgramsData(prev => ({
        ...prev,
        [programId]: {
          ...prev[programId],
          numberOfCurrentRegistrations: prev[programId].numberOfCurrentRegistrations + 1
        }
      }));
      
      // Fetch updated data
      await fetchTrainingPrograms();
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Failed to register for the program', severity: 'error' });
    }
  };

  const handleWithdrawClick = async (programId) => {
    try {
      if (!user) {
        setSnackbar({ open: true, message: 'You must be logged in to withdraw', severity: 'error' });
        return;
      }
      
      await withdrawFromProgram(programId, user.email);
      setSnackbar({ open: true, message: 'Successfully withdrawn from the program', severity: 'success' });
      
      // Update local state immediately for better UX
      setProgramsData(prev => ({
        ...prev,
        [programId]: {
          ...prev[programId],
          numberOfCurrentRegistrations: prev[programId].numberOfCurrentRegistrations - 1
        }
      }));
      
      // Fetch updated data
      await fetchTrainingPrograms();
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Failed to withdraw from the program', severity: 'error' });
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

  const formatDate = (date) => {
    if (!date) return '';
    
    // If date is a Firestore Timestamp
    if (date.toDate) {
      date = date.toDate();
    }
    
    // If date is a string, convert to Date object
    if (typeof date === 'string') {
      date = new Date(date);
    }

    // Check if the date is valid before formatting
    if (!(date instanceof Date) || isNaN(date)) {
      return 'Invalid date';
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                    <TableCell>{formatDate(program.startDate)}</TableCell>
                    <TableCell>{formatDate(program.endDate)}</TableCell>
                    <TableCell>{program.mode}</TableCell>
                    <TableCell>{formatDate(program.enrollmentDate)}</TableCell>
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
                    <TableCell>{formatDate(program.startDate)}</TableCell>
                    <TableCell>{formatDate(program.endDate)}</TableCell>
                    <TableCell>{program.mode}</TableCell>
                    <TableCell>
                      {program.participantCapacity - (programsData[program.id]?.numberOfCurrentRegistrations || program.numberOfCurrentRegistrations)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleRegisterClick(program.id)}
                        disabled={programsData[program.id]?.numberOfCurrentRegistrations >= program.participantCapacity}
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
                    <TableCell>{formatDate(program.startDate)}</TableCell>
                    <TableCell>{formatDate(program.endDate)}</TableCell>
                    <TableCell>{program.mode}</TableCell>
                    <TableCell>{formatDate(program.enrollmentDate)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default TrainingProgram;