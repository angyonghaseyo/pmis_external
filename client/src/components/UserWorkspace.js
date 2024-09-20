import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, LinearProgress } from '@mui/material';

const UserWorkspace = ({ user }) => {
  const [leaveStats, setLeaveStats] = useState([]);
  const [timeLog, setTimeLog] = useState({});
  const [serviceOperations, setServiceOperations] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Simulate data fetching
    const simulateData = () => {
      // Hardcoded Data
      const leaveStatsData = [
        { title: 'Total leave allowance', value: 34, paid: 11, unpaid: 4 },
        { title: 'Total leave taken', value: 20, paid: 10, unpaid: 10 },
        { title: 'Total leave available', value: 87, paid: 50, unpaid: 37 },
        { title: 'Leave request pending', value: 5, paid: 3, unpaid: 2 },
      ];

      // Hardcoded Data
      const timeLogData = {
        today: { Scheduled: '08:00', Balance: '12:00', Worked: '05:00' },
        month: { Total: 216, Shortage: 23, WorkedTime: 189, Overtime: 56 },
      };

      // Hardcoded Data
      const serviceOpsData = [
        { title: 'Unload cargo', status: 'Ready', latestUpdate: 'Dec 7, 2023 23:26', description: 'Cargo unloading in progress.' },
        { title: 'Load cargo', status: 'In Progress', latestUpdate: 'Dec 7, 2023 18:40', description: 'Cargo loading ongoing.' },
        { title: 'Inspect containers', status: 'Completed', latestUpdate: 'Dec 6, 2023 15:22', description: 'Inspection completed.' },
      ];

      // Simulate setting data after fetching
      setLeaveStats(leaveStatsData);
      setTimeLog(timeLogData);
      setServiceOperations(serviceOpsData);
    };

    simulateData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h2">Dashboard</Typography>
        {/* Display live time - Larger and more prominent */}
        <Typography variant="h3" color="textPrimary" sx={{ fontWeight: 'bold' }}>
          {formatTime(currentTime)}
        </Typography>
      </Box>

      {/* Welcome message */}
      <Typography variant="h5" gutterBottom>Good to see you, {user.email} 👋</Typography>

      {/* Leave statistics */}
      <Grid container spacing={3} mb={3}>
        {leaveStats.length > 0 ? leaveStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary">{stat.title || 'N/A'}</Typography>
                <Typography variant="h4" component="p" color="primary">{stat.value || 'N/A'}</Typography>
                <Box display="flex" justifyContent="space-between" mt={1}>
                  <Typography variant="body2" color="green">Paid: {stat.paid || 'N/A'}</Typography>
                  <Typography variant="body2" color="red">Unpaid: {stat.unpaid || 'N/A'}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )) : (
          <Typography variant="body1">No leave statistics available.</Typography>
        )}
      </Grid>

      {/* Time Log */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Time Log</Typography>
          <Grid container spacing={3}>
            {/* Today Section */}
            <Grid item xs={12} md={6}>
              <Box display="flex" justifyContent="space-around" alignItems="center" sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 2 }}>
                <Box textAlign="center">
                  <Typography variant="h5">{timeLog.today?.Scheduled || 'N/A'}</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Scheduled
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h5">{timeLog.today?.Balance || 'N/A'}</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Balance
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h5">{timeLog.today?.Worked || 'N/A'}</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Worked
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* This Month Section */}
            <Grid item xs={12} md={6}>
              <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  This Month
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">Total</Typography>
                  <Typography variant="body2">{timeLog.month?.Total || 'N/A'} hour</Typography>
                </Box>
                <LinearProgress variant="determinate" value={75} sx={{ mb: 1, height: 10 }} />

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">Shortage time</Typography>
                  <Typography variant="body2">{timeLog.month?.Shortage || 'N/A'} hour</Typography>
                </Box>
                <LinearProgress variant="determinate" value={30} sx={{ mb: 1, height: 10 }} />

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">Worked time</Typography>
                  <Typography variant="body2">{timeLog.month?.WorkedTime || 'N/A'} hour</Typography>
                </Box>
                <LinearProgress variant="determinate" value={85} sx={{ mb: 1, height: 10 }} />

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Overtime</Typography>
                  <Typography variant="body2">{timeLog.month?.Overtime || 'N/A'} hour</Typography>
                </Box>
                <LinearProgress variant="determinate" value={40} sx={{ height: 10 }} />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Latest Service Operations */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Latest Service Operations</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Latest Update</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {serviceOperations.length > 0 ? serviceOperations.map((operation, index) => (
                  <TableRow key={index}>
                    <TableCell>{operation.title || 'N/A'}</TableCell>
                    <TableCell>{operation.status || 'N/A'}</TableCell>
                    <TableCell>{operation.latestUpdate || 'N/A'}</TableCell>
                    <TableCell>{operation.description || 'N/A'}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">No service operations available.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserWorkspace;
