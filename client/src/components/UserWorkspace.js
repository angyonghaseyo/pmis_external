import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress
} from '@mui/material';
import { getUserDashboardData } from '../services/api';

const UserWorkspace = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await getUserDashboardData();
      setDashboardData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to fetch dashboard data. Please try again later.');
      setLoading(false);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>User Workspace</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Upcoming Tasks</Typography>
            {dashboardData?.upcomingTasks.map((task, index) => (
              <Typography key={index}>{task}</Typography>
            ))}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Recent Activities</Typography>
            {dashboardData?.recentActivities.map((activity, index) => (
              <Typography key={index}>{activity}</Typography>
            ))}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Notifications</Typography>
            {dashboardData?.notifications.map((notification, index) => (
              <Typography key={index}>{notification}</Typography>
            ))}
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Quick Stats</Typography>
            <Grid container spacing={2}>
              {Object.entries(dashboardData?.quickStats || {}).map(([key, value]) => (
                <Grid item xs={6} sm={3} key={key}>
                  <Typography variant="subtitle1">{key}</Typography>
                  <Typography variant="h5">{value}</Typography>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserWorkspace;