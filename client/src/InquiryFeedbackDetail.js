import React, { useState, useEffect } from 'react';
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
  CircularProgress
} from '@mui/material';
import { AttachFile } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore'; 
import { db } from './firebaseConfig'; 
import Sidebar from './Sidebar';  
import Header from './Header';    

const InquiryFeedbackDetail = () => {
  const { id } = useParams();
  const [inquiryDetails, setInquiryDetails] = useState(null); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [file, setFile] = useState(null);

  // Fetch inquiry/feedback details from Firebase
  useEffect(() => {
    const fetchInquiryDetails = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'inquiries', id); // Need to update as per firebase
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setInquiryDetails(docSnap.data()); 
        } else {
          throw new Error('Inquiry not found');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInquiryDetails();
  }, [id]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages([...messages, { text: newMessage, type: 'user' }]);
      setNewMessage('');
    }
  };

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setMessages([...messages, { text: `File uploaded: ${uploadedFile.name}`, type: 'user' }]);
      //Need to implement sending file to backend...
    }
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
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Header />
        
        {/* Inquiry/Feedback Details */}
        <Typography variant="h4" gutterBottom>Inquiry/Feedback Details - ID: {id}</Typography>
        <Box my={4}>
          <Typography variant="h6">Subject: {inquiryDetails.subject}</Typography>
          <Typography variant="body1" color="textSecondary">Status: {inquiryDetails.status}</Typography>
          <Typography variant="body1" color="textSecondary">Filed on: {inquiryDetails.dateFiled}</Typography>
        </Box>

        {/* Chat Section */}
        <Paper elevation={3} sx={{ mb: 4, p: 2 }}>
          <Typography variant="h6">Conversation</Typography>
          <Divider sx={{ my: 2 }} />
          <List sx={{ maxHeight: '300px', overflowY: 'auto' }}>
            {messages.map((message, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={message.text}
                  sx={{ textAlign: message.type === 'user' ? 'right' : 'left' }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Message Input and File Upload */}
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
              size="medium"
              fullWidth
              onClick={handleSendMessage}
            >
              Send
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default InquiryFeedbackDetail;
