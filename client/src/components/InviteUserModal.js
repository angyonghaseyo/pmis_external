import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Snackbar,
  Alert
} from '@mui/material';
import { inviteUser } from '../services/api';

const teams = [
  'Assets and Facilities',
  'Manpower',
  'Vessel Visits',
  'Port Operations and Resources',
  'Cargos',
  'Financial',
  'Customs and Trade Documents'
];

const InviteUserModal = ({ open, onClose, onUserInvited }) => {
  const [userData, setUserData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    team: '',
    company: 'Oceania Port',
    userType: 'Normal',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    try {
      await inviteUser({
        ...userData,
        name: `${userData.firstName} ${userData.lastName}`.trim()
      });
      setSuccess(true);
      onUserInvited();
      setTimeout(() => {
        onClose();
        setUserData({
          email: '',
          firstName: '',
          lastName: '',
          team: '',
          company: 'Oceania Port',
          userType: 'Normal',
        });
      }, 2000);
    } catch (error) {
      console.error('Error inviting user:', error);
      setError('Failed to invite user. Please try again.');
    }
  };

  const handleClose = () => {
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Invite User</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <TextField
              name="email"
              label="Email Address"
              type="email"
              fullWidth
              margin="normal"
              value={userData.email}
              onChange={handleChange}
              required
            />
            <TextField
              name="firstName"
              label="First Name"
              fullWidth
              margin="normal"
              value={userData.firstName}
              onChange={handleChange}
              required
            />
            <TextField
              name="lastName"
              label="Last Name"
              fullWidth
              margin="normal"
              value={userData.lastName}
              onChange={handleChange}
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Team</InputLabel>
              <Select
                name="team"
                value={userData.team}
                onChange={handleChange}
                required
              >
                {teams.map((team) => (
                  <MenuItem key={team} value={team}>{team}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              name="company"
              label="Company"
              fullWidth
              margin="normal"
              value={userData.company}
              onChange={handleChange}
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>User Type</InputLabel>
              <Select
                name="userType"
                value={userData.userType}
                onChange={handleChange}
                required
              >
                <MenuItem value="Normal">Normal</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            Invite
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={error !== '' || success} 
        autoHideDuration={6000} 
        onClose={() => { setError(''); setSuccess(false); }}
      >
        <Alert 
          onClose={() => { setError(''); setSuccess(false); }} 
          severity={error ? "error" : "success"} 
          sx={{ width: '100%' }}
        >
          {error || "User invited successfully!"}
        </Alert>
      </Snackbar>
    </>
  );
};

export default InviteUserModal;