import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, LinearProgress } from '@mui/material';
import { getLeaveStatistics, getTimeLog, getServiceOperations } from '../services/api';

const UserWorkspace = ({ user }) => {
  const [leaveStats, setLeaveStats] = useState([]);
  const [timeLog, setTimeLog] = useState({});
  const [serviceOperations, setServiceOperations] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [leaveStatsData, timeLogData, serviceOperationsData] = await Promise.all([
          getLeaveStatistics(),
          getTimeLog(),
          getServiceOperations()
        ]);
        setLeaveStats(leaveStatsData);
        setTimeLog(timeLogData);
        setServiceOperations(serviceOperationsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load workspace data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" height="100vh"><LinearProgress /></Box>;
  }

  if (error) {
    return <Typography color="error" align="center">{error}</Typography>;
  }

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
      <Typography variant="h5" gutterBottom>Good to see you, {user.firstName} 👋</Typography>

      {/* Leave statistics */}
      <Grid container spacing={3} mb={3}>
        {leaveStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary">{stat.title}</Typography>
                <Typography variant="h4" component="p" color="primary">{stat.value}</Typography>
                <Box display="flex" justifyContent="space-between" mt={1}>
                  <Typography variant="body2" color="green">Paid: {stat.paid}</Typography>
                  <Typography variant="body2" color="red">Unpaid: {stat.unpaid}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
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
                  <Typography variant="h5">{timeLog.today?.Scheduled}</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Scheduled
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h5">{timeLog.today?.Balance}</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Balance
                  </Typography>
                </Box>
                <Box textAlign="center">
                  <Typography variant="h5">{timeLog.today?.Worked}</Typography>
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
                  <Typography variant="body2">{timeLog.month?.Total} hour</Typography>
                </Box>
                <LinearProgress variant="determinate" value={75} sx={{ mb: 1, height: 10 }} />

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">Shortage time</Typography>
                  <Typography variant="body2">{timeLog.month?.Shortage} hour</Typography>
                </Box>
                <LinearProgress variant="determinate" value={30} sx={{ mb: 1, height: 10 }} />

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">Worked time</Typography>
                  <Typography variant="body2">{timeLog.month?.WorkedTime} hour</Typography>
                </Box>
                <LinearProgress variant="determinate" value={85} sx={{ mb: 1, height: 10 }} />

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Overtime</Typography>
                  <Typography variant="body2">{timeLog.month?.Overtime} hour</Typography>
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
                {serviceOperations.map((operation, index) => (
                  <TableRow key={index}>
                    <TableCell>{operation.title}</TableCell>
                    <TableCell>{operation.status}</TableCell>
                    <TableCell>{operation.latestUpdate}</TableCell>
                    <TableCell>{operation.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserWorkspace;