import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  TextField,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { getInquiryFeedbackDetail, addInquiryFeedbackReply } from '../services/api';

const InquiryFeedbackDetail = () => {
  const { id } = useParams();
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reply, setReply] = useState('');

  useEffect(() => {
    fetchInquiryDetail();
  }, [id]);

  const fetchInquiryDetail = async () => {
    try {
      setLoading(true);
      const data = await getInquiryFeedbackDetail(id);
      setInquiry(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching inquiry/feedback detail:', err);
      setError('Failed to fetch inquiry/feedback detail. Please try again later.');
      setLoading(false);
    }
  };

  const handleReplySubmit = async () => {
    try {
      await addInquiryFeedbackReply(id, reply);
      setReply('');
      fetchInquiryDetail();
    } catch (err) {
      console.error('Error submitting reply:', err);
      setError('Failed to submit reply. Please try again.');
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!inquiry) return <Typography>No inquiry/feedback found</Typography>;

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>{inquiry.subject}</Typography>
        <Typography variant="subtitle1" gutterBottom>Type: {inquiry.type}</Typography>
        <Typography variant="subtitle1" gutterBottom>Status: {inquiry.status}</Typography>
        <Typography variant="body1" paragraph>{inquiry.description}</Typography>
      </Paper>

      <Typography variant="h6" gutterBottom>Replies</Typography>
      <List>
        {inquiry.replies && inquiry.replies.map((reply, index) => (
          <React.Fragment key={index}>
            <ListItem alignItems="flex-start">
              <ListItemText
                primary={reply.author}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.primary">
                      {new Date(reply.timestamp).toLocaleString()}
                    </Typography>
                    {" — " + reply.content}
                  </>
                }
              />
            </ListItem>
            {index < inquiry.replies.length - 1 && <Divider variant="inset" component="li" />}
          </React.Fragment>
        ))}
      </List>

      <Box component="form" noValidate autoComplete="off" sx={{ mt: 3 }}>
        <TextField
          fullWidth
          label="Your Reply"
          multiline
          rows={4}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Button variant="contained" color="primary" onClick={handleReplySubmit}>
          Submit Reply
        </Button>
      </Box>
    </Box>
  );
};

export default InquiryFeedbackDetail;