import React, { useState, useEffect } from 'react';
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
  ListItemText,
  Tabs,
  Tab
} from '@mui/material';
import { Edit2, Trash2 } from 'lucide-react';
import { getUsers, updateUser, deleteUser, inviteUser, getCurrentUser, cancelInvitation, getAllUsersInCompany } from '../services/api';
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
  const [selectedTab, setSelectedTab] = useState(0);

  const [formErrors, setFormErrors] = useState({
    email: false,
    firstName: false,
    lastName: false,
    teams: false
  });

  const [allCompanyUsers, setAllCompanyUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchCurrentUserCompany();
    fetchUsersInCompany();
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

  const fetchUsersInCompany = async () => {
    try {
      setLoading(true);
      const companyUsers = await getAllUsersInCompany(); 
      
      setAllCompanyUsers(companyUsers); 
      setFilteredUsers(companyUsers);   
  
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
      dataToUpdate.userType = 'Normal';
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
  
      const updatedUsers = users.filter(user => user.id !== userId);
      const updatedAllCompanyUsers = allCompanyUsers.filter(user => user.id !== userId);
  
      setUsers(updatedUsers); 
      setFilteredUsers(updatedAllCompanyUsers); 
      setAllCompanyUsers(updatedAllCompanyUsers); 
  
      setDeleteConfirmation(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    }
  };

  const handleInviteUser = async () => {
    const errors = {
      email: newUser.email.trim() === '',
      firstName: newUser.firstName.trim() === '',
      lastName: newUser.lastName.trim() === '',
      teams: newUser.teams.length === 0 
    };
  
    setFormErrors(errors);
  
    if (!Object.values(errors).some((error) => error)) {
      try {
        await inviteUser({ ...newUser, company: currentUserCompany });
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
    }
  };

  const handleInputChange = (field, value) => {
    setNewUser({ ...newUser, [field]: value });
  
    if (field === 'teams') {
      setFormErrors({ ...formErrors, [field]: value.length === 0 });
    } else {
      setFormErrors({ ...formErrors, [field]: value.trim() === '' });
    }
  };

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const filteredByStatus = currentUsers.filter((user) => {
    if (selectedTab === 0) {
      return user.status === 'Pending';
    } else if (selectedTab === 1) {
      return user.status === 'Approved';
    } else {
      return user.status === 'Rejected';
    }
  });

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" height="100vh"><CircularProgress /></Box>;
  if (error) return <Typography color="error" align="center">{error}</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      {/* All Users Table */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" gutterBottom>All Users</Typography>
      </Box>

      <TextField
        label="Search all users"
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
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allCompanyUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.teams ? user.teams.join(', ') : 'N/A'}</TableCell>
                <TableCell>{user.userType || 'Normal'}</TableCell>
                <TableCell>
                  <Button startIcon={<Edit2 />} onClick={() => setEditingUser(user)} size="small" style={{ marginRight: '8px' }}>
                    View 
                  </Button>
                  <Button startIcon={<Trash2 />} onClick={() => setDeleteConfirmation(user)} color="error" size="small">
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

      <Box display="flex" justifyContent="space-between" alignItems="center" mt={4} mb={2}>
        <Typography variant="h4" gutterBottom>Invite Users</Typography>
        <Button variant="contained" onClick={() => setInviteDialogOpen(true)}>
          Invite User
        </Button>
      </Box>

      {/* Tabs and Pending, Approved, Rejected tables */}
      <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} aria-label="user status tabs" sx={{ mt: 4 }}>
        <Tab label="Pending Requests" />
        <Tab label="Approved Requests" />
        <Tab label="Rejected Requests" />
      </Tabs>

      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Teams</TableCell>
              <TableCell>User Type</TableCell>
              <TableCell>Status</TableCell>
              {selectedTab === 2 && <TableCell>Rejection Reason</TableCell>}
              {selectedTab === 0 && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredByStatus.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.teams ? user.teams.join(', ') : 'N/A'}</TableCell>
                <TableCell>{user.userType || 'Normal'}</TableCell>
                <TableCell>{user.status}</TableCell>
                {selectedTab === 2 && <TableCell>{user.rejectionReason || 'N/A'}</TableCell>}
                {selectedTab === 0 && (
                  <TableCell>
                    <Button startIcon={<Edit2 />} onClick={() => setEditingUser(user)} size="small" style={{ marginRight: '8px' }}>
                      Edit
                    </Button>
                    <Button startIcon={<Trash2 />} onClick={() => setDeleteConfirmation(user)} color="error" size="small">
                      {user.status === 'Pending' ? 'Cancel' : 'Delete'}
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        {Array.from({ length: Math.ceil(filteredByStatus.length / usersPerPage) }, (_, i) => (
          <Button key={i} onClick={() => paginate(i + 1)} variant={currentPage === i + 1 ? 'contained' : 'outlined'} sx={{ mx: 0.5 }}>
            {i + 1}
          </Button>
        ))}
      </Box>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onClose={() => setEditingUser(null)}>
        <DialogTitle>View User</DialogTitle> {/* Change the title to 'View User' */}
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="First Name"
            fullWidth
            variant="outlined"
            value={editingUser?.firstName || ''}
            disabled 
          />
          <TextField
            margin="dense"
            label="Last Name"
            fullWidth
            variant="outlined"
            value={editingUser?.lastName || ''}
            disabled 
          />
          <TextField
            margin="dense"
            label="Email"
            fullWidth
            variant="outlined"
            value={editingUser?.email || ''}
            disabled 
          />
          <FormControl fullWidth margin="dense" disabled>
            {/* Disable the Teams selection */}
            <InputLabel>Teams</InputLabel>
            <Select
              multiple
              value={editingUser?.teams || []}
              renderValue={(selected) => selected.join(', ')}
              label="Teams"
              disabled 
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
          <Button onClick={() => setEditingUser(null)}>Close</Button> 
        </DialogActions>
      </Dialog>


      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmation} onClose={() => setDeleteConfirmation(null)}>
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
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={formErrors.email}
            helperText={formErrors.email ? 'Email is required' : ''}
          />
          <TextField
            margin="dense"
            label="First Name"
            fullWidth
            variant="outlined"
            value={newUser.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            error={formErrors.firstName}
            helperText={formErrors.firstName ? 'First name is required' : ''}
          />
          <TextField
            margin="dense"
            label="Last Name"
            fullWidth
            variant="outlined"
            value={newUser.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            error={formErrors.lastName}
            helperText={formErrors.lastName ? 'Last name is required' : ''}
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
              onChange={(e) => handleInputChange('teams', e.target.value)}
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
            {formErrors.teams && <Typography color="error" variant="caption">At least one team must be selected</Typography>}
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
