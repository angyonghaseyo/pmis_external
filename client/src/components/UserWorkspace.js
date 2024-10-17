import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Button,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function UserWorkspace() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/resources`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setResources(response.data);
    } catch (err) {
      console.error("Error fetching resources:", err);
      setError('Failed to fetch resources. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to Your Workspace
      </Typography>
      <Grid container spacing={3}>
        {resources.map((resource) => (
          <Grid item xs={12} sm={6} md={4} key={resource.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div">
                  {resource.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {resource.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" href={resource.link} target="_blank" rel="noopener noreferrer">
                  Learn More
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default UserWorkspace;