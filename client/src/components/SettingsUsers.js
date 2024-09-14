import React, { useState, useEffect } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Box, 
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  ListItemText
} from '@mui/material';
import { getUsers, updateUser, deleteUser, inviteUser, getCurrentUser, cancelInvitation } from '../services/api';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const teams = [
  'Assets and Facilities',
  'Manpower',
  'Vessel Visits',
  'Port Operations and Resources',
  'Cargos',
  'Financial',
  'Customs and Trade Documents'
];

const SettingsUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [currentUserCompany, setCurrentUserCompany] = useState('');
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    company: '',
    userType: 'Normal',
    teams: [],
    status: 'Pending'
  });

  useEffect(() => {
    fetchUsers();
    fetchCurrentUserCompany();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.teams && user.teams.some(team => team.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      (user.userType && user.userType.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
      setFilteredUsers(fetchedUsers);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users. Please try again later.');
      setLoading(false);
    }
  };

  const fetchCurrentUserCompany = async () => {
    try {
      const user = await getCurrentUser();
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      setCurrentUserCompany(userDoc.data().company);
    } catch (err) {
      console.error('Error fetching current user company:', err);
    }
  };

  const handleUpdateUser = async (userId, updatedData) => {
    try {
      const { email, status, ...dataToUpdate } = updatedData;
      dataToUpdate.userType = 'Normal'; // Ensure userType is always 'Normal'
      if (status === 'Pending') {
        await updateUser(userId, dataToUpdate, true);
      } else {
        await updateUser(userId, dataToUpdate);
      }
      
      setUsers(users.map(user => user.id === userId ? { ...user, ...dataToUpdate } : user));
      setEditingUser(null);
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user. Please try again.');
    }
  };

  const handleDeleteUser = async (userId, status) => {
    try {
      if (status === 'Pending') {
        await cancelInvitation(userId);
      } else {
        await deleteUser(userId);
      }
  
      setUsers(users.filter(user => user.id !== userId));
      setDeleteConfirmation(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    }
  };

  const handleInviteUser = async () => {
    try {
      await inviteUser({...newUser, company: currentUserCompany});
      setUsers([...users, { ...newUser, id: Date.now().toString(), company: currentUserCompany, status: 'Pending' }]);
      setInviteDialogOpen(false);
      setNewUser({
        email: '',
        firstName: '',
        lastName: '',
        company: '',
        userType: 'Normal',
        teams: [],
        status: 'Pending'
      });
    } catch (err) {
      console.error('Error inviting user:', err);
      setError('Failed to invite user. Please try again.');
    }
  }; // Missing closing brace added here

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" height="100vh"><CircularProgress /></Box>;
  if (error) return <Typography color="error" align="center">{error}</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Users</Typography>
      <TextField
        label="Search users"
        variant="outlined"
        fullWidth
        margin="normal"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="20%">Name</TableCell>
              <TableCell width="25%">Email</TableCell>
              <TableCell width="25%">Teams</TableCell>
              <TableCell width="15%">User Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell width="15%">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell width="20%">{`${user.firstName} ${user.lastName}`}</TableCell>
                <TableCell width="25%">{user.email}</TableCell>
                <TableCell width="25%">{user.teams ? user.teams.join(', ') : 'N/A'}</TableCell>
                <TableCell width="15%">{user.userType || 'Normal'}</TableCell>
                <TableCell>{user.status}</TableCell>
                <TableCell width="15%">
                  <Button
                    startIcon={<Edit2 />}
                    onClick={() => setEditingUser(user)}
                    size="small"
                  >
                    Edit
                  </Button>
                  <Button
                    startIcon={<Trash2 />}
                    onClick={() => setDeleteConfirmation(user)}
                    color="error"
                    size="small"
                  >
                    {user.status === 'Pending' ? 'Cancel' : 'Delete'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        {Array.from({ length: Math.ceil(filteredUsers.length / usersPerPage) }, (_, i) => (
          <Button key={i} onClick={() => paginate(i + 1)} variant={currentPage === i + 1 ? 'contained' : 'outlined'} sx={{ mx: 0.5 }}>
            {i + 1}
          </Button>
        ))}
      </Box>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onClose={() => setEditingUser(null)}>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="First Name"
            fullWidth
            variant="outlined"
            value={editingUser?.firstName || ''}
            onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Last Name"
            fullWidth
            variant="outlined"
            value={editingUser?.lastName || ''}
            onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Email"
            fullWidth
            variant="outlined"
            value={editingUser?.email || ''}
            disabled
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Teams</InputLabel>
            <Select
              multiple
              value={editingUser?.teams || []}
              onChange={(e) => setEditingUser({ ...editingUser, teams: e.target.value })}
              renderValue={(selected) => selected.join(', ')}
              label="Teams"
            >
              {teams.map((team) => (
                <MenuItem key={team} value={team}>
                  <Checkbox checked={(editingUser?.teams || []).indexOf(team) > -1} />
                  <ListItemText primary={team} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="User Type"
            fullWidth
            variant="outlined"
            value="Normal"
            disabled
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingUser(null)}>Cancel</Button>
          <Button onClick={() => handleUpdateUser(editingUser.id, editingUser)}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirmation}
        onClose={() => setDeleteConfirmation(null)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to {deleteConfirmation?.status === 'Pending' ? 'cancel the invitation for' : 'delete the user'} {deleteConfirmation?.firstName} {deleteConfirmation?.lastName}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmation(null)}>Cancel</Button>
          <Button onClick={() => handleDeleteUser(deleteConfirmation.id, deleteConfirmation.status)} color="error">
            {deleteConfirmation?.status === 'Pending' ? 'Cancel Invitation' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)}>
        <DialogTitle>Invite User</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          />
          <TextField
            margin="dense"
            label="First Name"
            fullWidth
            variant="outlined"
            value={newUser.firstName}
            onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Last Name"
            fullWidth
            variant="outlined"
            value={newUser.lastName}
            onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Company"
            fullWidth
            variant="outlined"
            value={currentUserCompany}
            disabled
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Teams</InputLabel>
            <Select
              multiple
              value={newUser.teams}
              onChange={(e) => setNewUser({ ...newUser, teams: e.target.value })}
              renderValue={(selected) => selected.join(', ')}
              label="Teams"
            >
              {teams.map((team) => (
                <MenuItem key={team} value={team}>
                  <Checkbox checked={newUser.teams.indexOf(team) > -1} />
                  <ListItemText primary={team} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="User Type"
            fullWidth
            variant="outlined"
            value="Normal"
            disabled
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleInviteUser} variant="contained" color="primary">
            Invite User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsUsers;
