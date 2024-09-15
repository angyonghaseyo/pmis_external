import React, { useState } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';  
import Header from './Header';    

const TrainingProgram = () => {
  const navigate = useNavigate();
  const [selectedPrograms, setSelectedPrograms] = useState([]);

  // Hardcode
  const enrolledPrograms = [
    { id: 1, title: 'Basic Safety Training', status: 'Completed', startDate: '2023-08-01', endDate: '2023-08-15' },
    { id: 2, title: 'Advanced Docking Techniques', status: 'Ongoing', startDate: '2023-09-01', endDate: '2023-09-10' },
  ];

  const availablePrograms = [
    { id: 3, title: 'Hazardous Material Handling', status: 'Available', startDate: '2023-10-01', endDate: '2023-10-15' },
    { id: 4, title: 'Fire Safety Protocols', status: 'Available', startDate: '2023-10-20', endDate: '2023-10-30' },
    { id: 5, title: 'Advanced Cargo Management', status: 'Available', startDate: '2023-11-01', endDate: '2023-11-10' },
  ];

  const handleCheckboxChange = (id) => {
    setSelectedPrograms((prevSelected) => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter((programId) => programId !== id);
      } else {
        return [...prevSelected, id];
      }
    });
  };

  const handleRegisterPrograms = () => {

  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Header />

        <Typography variant="h4" gutterBottom>
          Training Programs
        </Typography>

        {/* Enrolled Training Programs Table */}
        <Typography variant="h6" gutterBottom>
          Enrolled Training Programs
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
              </TableRow>
            </TableHead>
            <TableBody>
              {enrolledPrograms.map((program) => (
                <TableRow key={program.id}>
                  <TableCell>{program.id}</TableCell>
                  <TableCell>{program.title}</TableCell>
                  <TableCell>{program.status}</TableCell>
                  <TableCell>{program.startDate}</TableCell>
                  <TableCell>{program.endDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Available Training Programs Table */}
        <Typography variant="h6" gutterBottom>
          Available Training Programs
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell></TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {availablePrograms.map((program) => (
                <TableRow key={program.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedPrograms.includes(program.id)}
                      onChange={() => handleCheckboxChange(program.id)}
                    />
                  </TableCell>
                  <TableCell>{program.id}</TableCell>
                  <TableCell>{program.title}</TableCell>
                  <TableCell>{program.status}</TableCell>
                  <TableCell>{program.startDate}</TableCell>
                  <TableCell>{program.endDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Grid container justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleRegisterPrograms}
          >
            Register for Training Programs
          </Button>
        </Grid>
      </Box>
    </Box>
  );
};

export default TrainingProgram;
