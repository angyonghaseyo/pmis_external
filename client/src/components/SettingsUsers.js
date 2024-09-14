import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, UserPlus } from 'lucide-react';
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
import { getUsers, updateUser, deleteUser, inviteUser, getCurrentUser } from '../services/api';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
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

const userTypes = ['Normal', 'Admin'];

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
      const currentUser = await getCurrentUser();
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const company = userDoc.data().company;

      // Fetch active users
      const usersQuery = query(collection(db, 'users'), where('company', '==', company));
      const usersSnapshot = await getDocs(usersQuery);
      const activeUsers = usersSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(), 
        status: 'Active',
        name: `${doc.data().firstName} ${doc.data().lastName}`
      }));

      // Fetch pending invitations
      const invitationsQuery = query(collection(db, 'invitations'), where('company', '==', company), where('status', '==', 'pending'));
      const invitationsSnapshot = await getDocs(invitationsQuery);
      const pendingUsers = invitationsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(), 
        status: 'Pending',
        name: `${doc.data().firstName} ${doc.data().lastName}`
      }));

      const allUsers = [...activeUsers, ...pendingUsers];
      setUsers(allUsers);
      setFilteredUsers(allUsers);
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
      const { email, ...dataToUpdate } = updatedData;
      await updateUser(userId, dataToUpdate);
      setUsers(users.map(user => user.id === userId ? { ...user, ...dataToUpdate } : user));
      setEditingUser(null);
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user. Please try again.');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId);
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
  };

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" height="100vh"><CircularProgress /></Box>;
  if (error) return <Typography color="error" align="center">{error}</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Users</Typography>
        <Button
          variant="contained"
          startIcon={<UserPlus />}
          onClick={() => setInviteDialogOpen(true)}
        >
          Invite User
        </Button>
      </Box>
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
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Teams</TableCell>
              <TableCell>User Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.teams ? user.teams.join(', ') : 'N/A'}</TableCell>
                <TableCell>{user.userType || 'N/A'}</TableCell>
                <TableCell>{user.status}</TableCell>
                <TableCell>
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
                    Delete
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
          <FormControl fullWidth margin="dense">
            <InputLabel>User Type</InputLabel>
            <Select
              value={editingUser?.userType || ''}
              onChange={(e) => setEditingUser({ ...editingUser, userType: e.target.value })}
              label="User Type"
            >
              {userTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
            Are you sure you want to delete the user {deleteConfirmation?.name}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmation(null)}>Cancel</Button>
          <Button onClick={() => handleDeleteUser(deleteConfirmation.id)} color="error">
            Delete
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
          <TextField
            margin="dense"
            label="User Type"
            fullWidth
            variant="outlined"
            value="Normal"
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