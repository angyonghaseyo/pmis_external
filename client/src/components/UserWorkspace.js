import React, { useState, useEffect } from 'react';
import { Bell, Globe } from 'lucide-react';
import { Grid, Card, CardContent, Typography, Box, Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { getLeaveStatistics, getTimeLog, getServiceOperations } from '../services/api';

const UserWorkspace = ({ user }) => {
  const [leaveStats, setLeaveStats] = useState([]);
  const [timeLog, setTimeLog] = useState({});
  const [serviceOperations, setServiceOperations] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const leaveStatsData = await getLeaveStatistics();
        setLeaveStats(leaveStatsData || []);

        const timeLogData = await getTimeLog();
        setTimeLog(timeLogData || {});

        const serviceOpsData = await getServiceOperations();
        setServiceOperations(serviceOpsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h2">Dashboard</Typography>
      </Box>

      {/* Welcome message */}
      <Typography variant="h5" gutterBottom>Good to see you, {user.displayName} 👋</Typography>

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
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: 'grey.100', p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Today</Typography>
                {timeLog.today ? (
                  Object.entries(timeLog.today).map(([key, value], index) => (
                    <Typography key={index} variant="body2">{value || 'N/A'} {key}</Typography>
                  ))
                ) : (
                  <Typography variant="body2">N/A</Typography>
                )}
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: 'grey.100', p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>This Month</Typography>
                {timeLog.month ? (
                  Object.entries(timeLog.month).map(([key, value], index) => (
                    <Typography key={index} variant="body2">{key}: {value || 'N/A'}</Typography>
                  ))
                ) : (
                  <Typography variant="body2">N/A</Typography>
                )}
              </Card>
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
