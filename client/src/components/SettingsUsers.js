import React, { useState, useEffect, useCallback } from 'react';
import { getUsers, updateUser, deleteUser, inviteUser } from '../services/api';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Button, TextField, Select, MenuItem, Pagination, Box, Typography, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';

const SettingsUsers = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', team: '', company: 'Oceania Port', userType: 'Normal' });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUsers(page, rowsPerPage, searchTerm);
      setUsers(response.users);
      setTotalUsers(response.total);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleUpdateUser = async (userId, updatedData) => {
    try {
      await updateUser(userId, updatedData);
      fetchUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user. Please try again.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId);
        fetchUsers();
      } catch (err) {
        console.error('Error deleting user:', err);
        setError('Failed to delete user. Please try again.');
      }
    }
  };

  const handleInviteUser = async () => {
    try {
      await inviteUser(newUser);
      setInviteDialogOpen(false);
      setNewUser({ name: '', email: '', team: '', company: 'Oceania Port', userType: 'Normal' });
      fetchUsers();
    } catch (err) {
      console.error('Error inviting user:', err);
      setError('Failed to invite user. Please try again.');
    }
  };

  const handleNewUserChange = (event) => {
    setNewUser({ ...newUser, [event.target.name]: event.target.value });
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Users</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => setInviteDialogOpen(true)}
        >
          Invite User
        </Button>
      </Box>

      <TextField
        label="Search users"
        variant="outlined"
        value={searchTerm}
        onChange={handleSearch}
        fullWidth
        margin="normal"
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User Name</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>User Type</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <img
                      src={user.photoURL || "/api/placeholder/40/40"}
                      alt={user.name}
                      style={{ width: 40, height: 40, borderRadius: '50%', marginRight: '10px' }}
                    />
                    {user.name}
                  </Box>
                </TableCell>
                <TableCell>{user.team}</TableCell>
                <TableCell>{user.company}</TableCell>
                <TableCell>
                  <Select
                    value={user.status}
                    onChange={(e) => handleUpdateUser(user.id, { status: e.target.value })}
                    size="small"
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                    <MenuItem value="Pending">Pending</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>{user.userType}</TableCell>
                <TableCell>
                  <IconButton onClick={() => {/* Implement edit functionality */}}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteUser(user.id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
        <Typography>
          Showing {(page - 1) * rowsPerPage + 1} to {Math.min(page * rowsPerPage, totalUsers)} of {totalUsers} users
        </Typography>
        <Pagination
          count={Math.ceil(totalUsers / rowsPerPage)}
          page={page}
          onChange={handleChangePage}
        />
      </Box>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)}>
        <DialogTitle>Invite New User</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Name"
            type="text"
            fullWidth
            value={newUser.name}
            onChange={handleNewUserChange}
          />
          <TextField
            margin="dense"
            name="email"
            label="Email Address"
            type="email"
            fullWidth
            value={newUser.email}
            onChange={handleNewUserChange}
          />
          <TextField
            margin="dense"
            name="team"
            label="Team"
            type="text"
            fullWidth
            value={newUser.team}
            onChange={handleNewUserChange}
          />
          <TextField
            margin="dense"
            name="company"
            label="Company"
            type="text"
            fullWidth
            value={newUser.company}
            onChange={handleNewUserChange}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>User Type</InputLabel>
            <Select
              name="userType"
              value={newUser.userType}
              onChange={handleNewUserChange}
            >
              <MenuItem value="Normal">Normal</MenuItem>
              <MenuItem value="Admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleInviteUser} color="primary">Invite</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsUsers;