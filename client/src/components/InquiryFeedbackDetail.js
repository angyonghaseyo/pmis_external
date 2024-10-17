import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Grid,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { AttachFile } from '@mui/icons-material';
import { useParams } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const InquiryFeedbackDetail = () => {
  const { id } = useParams();
  const [inquiryDetails, setInquiryDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [file, setFile] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchInquiryDetails();
  }, [id]);

  const fetchInquiryDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/inquiries/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setInquiryDetails(response.data);
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error('Error fetching inquiry details:', err);
      setError('Failed to load inquiry details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      try {
        const formData = new FormData();
        formData.append('message', newMessage);
        if (file) {
          formData.append('file', file);
        }
        
        const response = await axios.post(`${API_URL}/inquiries/${id}/messages`, formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        setMessages([...messages, response.data]);
        setNewMessage('');
        setFile(null);
        setSnackbar({ open: true, message: 'Message sent successfully', severity: 'success' });
      } catch (err) {
        console.error('Error sending message:', err);
        setSnackbar({ open: true, message: 'Failed to send message', severity: 'error' });
      }
    }
  };

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setSnackbar({ open: true, message: `File selected: ${uploadedFile.name}`, severity: 'info' });
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="h6" color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>Inquiry/Feedback Details - ID: {id}</Typography>
      <Box my={4}>
        <Typography variant="h6">Subject: {inquiryDetails.subject}</Typography>
        <Typography variant="body1" color="textSecondary">Status: {inquiryDetails.status}</Typography>
        <Typography variant="body1" color="textSecondary">Filed on: {new Date(inquiryDetails.createdAt).toLocaleString()}</Typography>
      </Box>

      <Paper elevation={3} sx={{ mb: 4, p: 2 }}>
        <Typography variant="h6">Conversation</Typography>
        <Divider sx={{ my: 2 }} />
        <List sx={{ maxHeight: '300px', overflowY: 'auto' }}>
          {messages.map((message, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={message.text}
                secondary={new Date(message.createdAt).toLocaleString()}
                sx={{ textAlign: message.isUser ? 'right' : 'left' }}
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Grid container spacing={2} alignItems="center">
        <Grid item xs={9}>
          <TextField
            fullWidth
            variant="outlined"
            label="Enter your message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
        </Grid>

        <Grid item xs={1}>
          <input
            accept="*"
            style={{ display: 'none' }}
            id="file-upload"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="file-upload">
            <IconButton component="span" color="primary">
              <AttachFile />
            </IconButton>
          </label>
        </Grid>

        <Grid item xs={2}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleSendMessage}
          >
            Send
          </Button>
        </Grid>
      </Grid>

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
};

export default InquiryFeedbackDetail;