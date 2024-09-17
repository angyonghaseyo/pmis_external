import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Snackbar, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { getTrainingPrograms, registerForProgram, withdrawFromProgram, getUserData } from './services/api';
import { auth } from './firebaseConfig';

const TrainingProgram = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolledPrograms, setEnrolledPrograms] = useState([]);
  const [availablePrograms, setAvailablePrograms] = useState([]);
  const [completedPrograms, setCompletedPrograms] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchTrainingPrograms();
      } else {
        setLoading(false);
        setError('Please log in to view training programs.');
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchTrainingPrograms = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        setError('No authenticated user found');
        setLoading(false);
        return;
      }

      const userData = await getUserData(user.uid);
      const allPrograms = await getTrainingPrograms();

      const now = new Date();
      const enrolled = [];
      const available = [];
      const completed = [];

      allPrograms.forEach((program) => {
        const startDate = program.startDate.toDate();
        const endDate = program.endDate.toDate();
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
      const user = auth.currentUser;
      if (!user) {
        setSnackbar({ open: true, message: 'You must be logged in to register', severity: 'error' });
        return;
      }
      await registerForProgram(programId, user.uid);
      setSnackbar({ open: true, message: 'Successfully registered for the program', severity: 'success' });
      fetchTrainingPrograms(); // Refresh the programs list
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to register for the program', severity: 'error' });
    }
  };

  const handleWithdrawClick = async (programId) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setSnackbar({ open: true, message: 'You must be logged in to withdraw', severity: 'error' });
        return;
      }
      await withdrawFromProgram(programId, user.uid);
      setSnackbar({ open: true, message: 'Successfully withdrawn from the program', severity: 'success' });
      fetchTrainingPrograms(); // Refresh the programs list
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to withdraw from the program', severity: 'error' });
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" height="100vh"><CircularProgress /></Box>;
  }

  if (error) {
    return <Typography color="error" align="center">{error}</Typography>;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Header user={user} />

        <Typography variant="h4" gutterBottom>
          Training Programs
        </Typography>

        {/* Enrolled Training Programs */}
        <Typography variant="h6" gutterBottom>
          Enrolled Training Programs
        </Typography>
        <TableContainer component={Paper} sx={{ mb: 4 }}>
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
                    <TableCell>{program.startDate.toDate().toLocaleDateString()}</TableCell>
                    <TableCell>{program.endDate.toDate().toLocaleDateString()}</TableCell>
                    <TableCell>{program.mode}</TableCell>
                    <TableCell>{program.enrollmentDate.toDate().toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button 
                        variant="contained" 
                        sx={{ backgroundColor: '#d32f2f', '&:hover': { backgroundColor: '#b71c1c' } }} 
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

        {/* Available Training Programs */}
        <Typography variant="h6" gutterBottom>
          Available Training Programs
        </Typography>
        <TableContainer component={Paper} sx={{ mb: 4 }}>
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
                    <TableCell>{program.startDate.toDate().toLocaleDateString()}</TableCell>
                    <TableCell>{program.endDate.toDate().toLocaleDateString()}</TableCell>
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

        {/* Completed Training Programs */}
        <Typography variant="h6" gutterBottom>
          Completed Training Programs
        </Typography>
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
                    <TableCell>{program.startDate.toDate().toLocaleDateString()}</TableCell>
                    <TableCell>{program.endDate.toDate().toLocaleDateString()}</TableCell>
                    <TableCell>{program.mode}</TableCell>
                    <TableCell>{program.enrollmentDate.toDate().toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default TrainingProgram;