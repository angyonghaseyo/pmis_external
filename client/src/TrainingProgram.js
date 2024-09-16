import React, { useState } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const TrainingProgram = () => {
  const navigate = useNavigate();

  // Hardcoded data 
  const [enrolledPrograms, setEnrolledPrograms] = useState([
    { id: 1, title: 'Basic Safety Training', status: 'Completed', startDate: '2023-08-01', endDate: '2023-08-15' },
    { id: 2, title: 'Advanced Docking Techniques', status: 'Ongoing', startDate: '2023-09-01', endDate: '2023-09-10' },
  ]);

  const availablePrograms = [
    { id: 3, title: 'Hazardous Material Handling', status: 'Available', startDate: '2023-10-01', endDate: '2023-10-15' },
    { id: 4, title: 'Fire Safety Protocols', status: 'Available', startDate: '2023-10-20', endDate: '2023-10-30' },
    { id: 5, title: 'Advanced Cargo Management', status: 'Available', startDate: '2023-11-01', endDate: '2023-11-10' },
  ];

  const [myPrograms, setMyPrograms] = useState([
    { id: 1, title: 'Basic Safety Training', status: 'Completed', completionDate: '2023-08-15' },
  ]);

  const handleRegisterClick = (programId) => {
    console.log(`Registering for program ID: ${programId}`);
    //Need to implement logic
  };

  const handleWithdrawClick = (programId) => {
    console.log(`Withdrawing from program ID: ${programId}`);
    //Need to implement logic
  };

  // Filter only ongoing enrolled programs
  const ongoingEnrolledPrograms = enrolledPrograms.filter(program => program.status === 'Ongoing');

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Header />

        <Typography variant="h4" gutterBottom>
          Training Programs
        </Typography>

        {/* Ongoing Enrolled Training Programs */}
        <Typography variant="h6" gutterBottom>
          Ongoing Enrolled Training Programs
        </Typography>
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Action</TableCell> 
              </TableRow>
            </TableHead>
            <TableBody>
              {ongoingEnrolledPrograms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">No ongoing enrolled programs</TableCell>
                </TableRow>
              ) : (
                ongoingEnrolledPrograms.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell>{program.id}</TableCell>
                    <TableCell>{program.title}</TableCell>
                    <TableCell>{program.status}</TableCell>
                    <TableCell>{program.startDate}</TableCell>
                    <TableCell>{program.endDate}</TableCell>
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

        {/* Available Training Programs Table */}
        <Typography variant="h6" gutterBottom>
          Available Training Programs
        </Typography>
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Action</TableCell> 
              </TableRow>
            </TableHead>
            <TableBody>
              {availablePrograms.map((program) => (
                <TableRow key={program.id}>
                  <TableCell>{program.id}</TableCell>
                  <TableCell>{program.title}</TableCell>
                  <TableCell>{program.status}</TableCell>
                  <TableCell>{program.startDate}</TableCell>
                  <TableCell>{program.endDate}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* My Training Programs */}
        <Typography variant="h6" gutterBottom>
          My Training Programs (Completed or Withdrawn)
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Completion / Withdrawal Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {myPrograms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">No completed or withdrawn programs</TableCell>
                </TableRow>
              ) : (
                myPrograms.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell>{program.id}</TableCell>
                    <TableCell>{program.title}</TableCell>
                    <TableCell>{program.status}</TableCell>
                    <TableCell>{program.completionDate}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default TrainingProgram;
