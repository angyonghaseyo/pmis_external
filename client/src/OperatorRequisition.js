import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Paper,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Close } from '@mui/icons-material';

// Mock data
const equipmentTypes = ['Crane', 'Forklift', 'Container Handler'];
const operatorSkills = ['Crane Operator', 'Forklift Operator', 'Equipment Technician'];

const OperatorRequisition = () => {
  const [requests, setRequests] = useState([
    {
      operatorSkill: 'Crane Operator',
      date: '2023-09-12',
      time: '08:00',
      duration: '4',
      equipmentType: 'Crane',
    },
    {
      operatorSkill: 'Forklift Operator',
      date: '2023-09-13',
      time: '10:00',
      duration: '6',
      equipmentType: 'Forklift',
    }
  ]);
  const [completedRequests, setCompletedRequests] = useState([
    {
      operatorSkill: 'Equipment Technician',
      date: '2023-09-10',
      time: '09:00',
      duration: '3',
      equipmentType: 'Container Handler',
      status: 'Completed'
    },
    {
      operatorSkill: 'Crane Operator',
      date: '2023-09-11',
      time: '11:00',
      duration: '2',
      equipmentType: 'Crane',
      status: 'Cancelled'
    }
  ]);

  const [formData, setFormData] = useState({
    operatorSkill: '',
    date: '',
    time: '',
    duration: '',
    equipmentType: '',
  });

  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(null);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenDialog = () => {
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setFormData({
      operatorSkill: '',
      date: '',
      time: '',
      duration: '',
      equipmentType: '',
    });
    setIsEditing(null);
  };

  const handleSubmit = () => {
    if (isEditing !== null) {
      const updatedRequests = requests.map((request, index) =>
        index === isEditing ? formData : request
      );
      setRequests(updatedRequests);
      setIsEditing(null);
    } else {
      setRequests([...requests, formData]);
    }
    handleCloseDialog();
  };

  const handleDelete = (index) => {
    const updatedRequests = requests.filter((_, i) => i !== index);
    setRequests(updatedRequests);
  };

  const handleEdit = (index) => {
    setFormData(requests[index]);
    setIsEditing(index);
    handleOpenDialog();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Operator Requisition
      </Typography>

      {/* Button to open the form dialog - Aligned to the right */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button variant="contained" color="primary" onClick={handleOpenDialog}>
          Create New Request
        </Button>
      </Box>

      {/* Dialog for form */}
      <Dialog open={open} onClose={handleCloseDialog}>
        <DialogTitle>
          {isEditing !== null ? 'Update Operator Request' : 'Create Operator Request'}
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Operator Skill"
            name="operatorSkill"
            value={formData.operatorSkill}
            onChange={handleInputChange}
            fullWidth
            sx={{ mb: 2 }}
          >
            {operatorSkills.map((skill, idx) => (
              <MenuItem key={idx} value={skill}>
                {skill}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Date"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            fullWidth
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Time"
            type="time"
            name="time"
            value={formData.time}
            onChange={handleInputChange}
            fullWidth
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Duration (hours)"
            name="duration"
            value={formData.duration}
            onChange={handleInputChange}
            fullWidth
            sx={{ mb: 2 }}
          />

          <TextField
            select
            label="Equipment Type"
            name="equipmentType"
            value={formData.equipmentType}
            onChange={handleInputChange}
            fullWidth
            sx={{ mb: 2 }}
          >
            {equipmentTypes.map((type, idx) => (
              <MenuItem key={idx} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary">
            {isEditing !== null ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Active Requests Table */}
      <Typography variant="h6" gutterBottom>
        Active Requests
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Operator Skill</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Equipment Type</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No active requests
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request, index) => (
                <TableRow key={index}>
                  <TableCell>{request.operatorSkill}</TableCell>
                  <TableCell>{request.date}</TableCell>
                  <TableCell>{request.time}</TableCell>
                  <TableCell>{request.duration}</TableCell>
                  <TableCell>{request.equipmentType}</TableCell>
                  <TableCell>
                    <IconButton color="primary" onClick={() => handleEdit(index)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton sx={{ color: 'red' }} onClick={() => handleDelete(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Completed/Cancelled Requests Table */}
      <Typography variant="h6" gutterBottom>
        Completed/Cancelled Requests
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Operator Skill</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Equipment Type</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {completedRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No completed or cancelled requests
                </TableCell>
              </TableRow>
            ) : (
              completedRequests.map((request, index) => (
                <TableRow key={index}>
                  <TableCell>{request.operatorSkill}</TableCell>
                  <TableCell>{request.date}</TableCell>
                  <TableCell>{request.time}</TableCell>
                  <TableCell>{request.duration}</TableCell>
                  <TableCell>{request.equipmentType}</TableCell>
                  <TableCell>{request.status}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default OperatorRequisition;
