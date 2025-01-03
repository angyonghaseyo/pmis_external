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
  Tab,
  Snackbar,
  Alert,
  Chip,
  Grid,
  Container
} from '@mui/material';
import { Edit2, Trash2 } from 'lucide-react';
import { getUsers, updateUser, deleteUser, inviteUser, getCurrentUser, cancelInvitation, getAllUsersInCompany } from '../services/api';
import Pagination from '@mui/material/Pagination';
import { useAuth } from '../AuthContext'


const RECORDS_PER_PAGE = 10;

const SettingsUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [allCompanyUsers, setAllCompanyUsers] = useState([]);
  const [filteredAllUsers, setFilteredAllUsers] = useState([]);
  const [filteredStatusUsers, setFilteredStatusUsers] = useState([]);
  const [searchAllUsers, setSearchAllUsers] = useState(''); // Search for "All Users"
  const [searchStatusUsers, setSearchStatusUsers] = useState(''); // Search for status tables
  const [allUsersPage, setAllUsersPage] = useState(1);
  const [statusUsersPage, setStatusUsersPage] = useState(1);
  const [allUsersTotalPages, setAllUsersTotalPages] = useState(1);
  const [statusUsersTotalPages, setStatusUsersTotalPages] = useState(1);
  const [filteredByStatus, setFilteredByStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [currentUserCompany, setCurrentUserCompany] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    company: '',
    status: 'Pending',
    accessRights: []
  });
  const [selectedTab, setSelectedTab] = useState(0);
  const [formErrors, setFormErrors] = useState({
    email: false,
    firstName: false,
    lastName: false,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const accessRights = [
    "View Assets",
    "Manage Assets",
    "View Inquiries and Feedbacks",
    "Create Inquiries and Feedback",
    "Enrol Training Program",
    "View Operator Requisitions",
    "Create Operator Requisition",
    "View Vessel Visit Requests",
    "Create Vessel Visit Request",
    "Edit Vessel Visit Requests",
    "Delete Vessel Visit Requests",
    "View Ad Hoc Resource Requests",
    "Create Ad Hoc Resource Request",
    "View Port Operations",
    "Manage Port Operations",
    "Create Cargo Booking",
    "Create Facility Rental",
    "View Cargo Manifests",
    "Submit Cargo Manifest",
    "Update Cargo Manifest",
    "Delete Cargo Manifest",
    "Create Container Request",
    "View Container Request",
    "Register Truck",
    "View Truck Registrations",
    "Create Container Pricings",
    "View Container Pricings",
    "Create Container Menu",
    "View Container Menu",
    "View Container Requests",
    "Approve Container Requests",
    "Create Sampling Request",
    "Create Repacking Request",
    "Create Storage Request",
    "Create Transloading Request",
    "View Documents",
    "Manage Documents",
    "View Billing Requests",
    "View Users List",
    "Delete User",
    "Invite User",
    "Delete User Invitations",
    "View Invitations List",
    "View Company Information",
    "Edit Company Information"
  ];




  useEffect(() => {
    const fetchData = async () => {
      setCurrentUserCompany(user.company)
      try {
        setIsLoading(true);
        await Promise.all([
          fetchUsers(),
          fetchUsersInCompany(),
        ])
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Filter for All Users search bar
    const filtered = allCompanyUsers.filter(user =>
      user.firstName.toLowerCase().includes(searchAllUsers.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchAllUsers.toLowerCase()) ||
      user.email.toLowerCase().includes(searchAllUsers.toLowerCase())
    );
    setFilteredAllUsers(filtered);
    setAllUsersPage(1); // Reset to first page when filtering
  }, [searchAllUsers, allCompanyUsers]);

  useEffect(() => {
    // Filter for Status search bar
    const filtered = users.filter(user =>
      user.firstName.toLowerCase().includes(searchStatusUsers.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchStatusUsers.toLowerCase()) ||
      user.email.toLowerCase().includes(searchStatusUsers.toLowerCase())
    );
    setFilteredStatusUsers(filtered);
    setStatusUsersPage(1); // Reset to first page when filtering
  }, [searchStatusUsers, users]);

  useEffect(() => {
    const filteredStatus = filteredStatusUsers.filter((user) => {
      if (selectedTab === 0) return user.status === 'Pending';
      if (selectedTab === 1) return user.status === 'Approved';
      return user.status === 'Rejected';
    });
    setFilteredByStatus(filteredStatus);
  }, [filteredStatusUsers, selectedTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await getUsers(user.email);
      setUsers(fetchedUsers);
      setFilteredStatusUsers(fetchedUsers);
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
      const companyUsers = await getAllUsersInCompany(user.email);

      setAllCompanyUsers(companyUsers);
      setFilteredAllUsers(companyUsers);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users. Please try again later.');
      setLoading(false);
    }
  };


  const handleUpdateUser = async (userId, updatedData) => {
    try {
      const { email, status, ...dataToUpdate } = updatedData;
      if (status === 'Pending') {
        await updateUser(userId, dataToUpdate, true);
      } else {
        await updateUser(userId, dataToUpdate);
      }

      setUsers(users.map(user => user.id === userId ? { ...user, ...dataToUpdate } : user));
      setEditingUser(null);
      setSnackbar({
        open: true,
        message: 'User updated successfully',
        severity: 'success',
      });
    } catch (err) {
      console.error('Error updating user:', err);
      setSnackbar({
        open: true,
        message: 'Failed to update user. Please try again.',
        severity: 'error',
      });
    }
  };

  const handleDeleteUser = async (userId, status) => {

    try {
      if (status === 'Pending') {
        await cancelInvitation(userId);
      } else {
        await deleteUser(userId);
      }

      const updatedUsers = users.filter(user => user.email !== userId);
      const updatedAllCompanyUsers = allCompanyUsers.filter(user => user.email !== userId);

      setUsers(updatedUsers);
      setFilteredAllUsers(updatedAllCompanyUsers);
      setAllCompanyUsers(updatedAllCompanyUsers);

      setDeleteConfirmation(null);
      setSnackbar({
        open: true,
        message: 'User deleted successfully',
        severity: 'success',
      });
    } catch (err) {
      console.error('Error deleting user:', err);
      setSnackbar({
        open: true,
        message: 'Failed to delete user. Please try again.',
        severity: 'error',
      });
    }
  };

  const handleInviteUser = async () => {
    const errors = {
      email: newUser.email.trim() === '',
      firstName: newUser.firstName.trim() === '',
      lastName: newUser.lastName.trim() === '',
    };

    setFormErrors(errors);


    try {
      await inviteUser({ ...newUser, company: currentUserCompany });
      setUsers([...users, { ...newUser, id: Date.now().toString(), company: currentUserCompany, status: 'Pending' }]);
      setInviteDialogOpen(false);
      setNewUser({
        email: '',
        firstName: '',
        lastName: '',
        company: '',
        status: 'Pending',
        accessRights: []
      });
      setSnackbar({
        open: true,
        message: 'User invited successfully',
        severity: 'success',
      });
    } catch (err) {
      console.error('Error inviting user:', err);
      setSnackbar({
        open: true,
        message: 'Failed to invite user. Please try again.',
        severity: 'error',
      });
    }

  };

  const handleInputChange = (field, value) => {
    setNewUser({ ...newUser, [field]: value });

    if (field === 'teams') {
      setFormErrors({ ...formErrors, [field]: value.length === 0 });
    } else if (field === 'accessRights') {
      // No validation needed for accessRights, it can be empty
    } else {
      setFormErrors({ ...formErrors, [field]: value.trim() === '' });
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  useEffect(() => {
    setAllUsersTotalPages(Math.ceil(filteredAllUsers.length / RECORDS_PER_PAGE));
  }, [filteredAllUsers]);

  useEffect(() => {
    setStatusUsersTotalPages(Math.ceil(filteredByStatus.length / RECORDS_PER_PAGE));
  }, [filteredByStatus]);

  const handleAllUsersPageChange = (event, value) => {
    setAllUsersPage(value);
  };

  const handleStatusUsersPageChange = (event, value) => {
    setStatusUsersPage(value);
  };

  // Update the slicing of currentAllUsers
  const indexOfLastAllUser = allUsersPage * RECORDS_PER_PAGE;
  const indexOfFirstAllUser = indexOfLastAllUser - RECORDS_PER_PAGE;
  const currentAllUsers = filteredAllUsers.slice(indexOfFirstAllUser, indexOfLastAllUser);

  // Update the slicing of currentStatusUsers
  const indexOfLastStatusUser = statusUsersPage * RECORDS_PER_PAGE;
  const indexOfFirstStatusUser = indexOfLastStatusUser - RECORDS_PER_PAGE;
  const currentStatusUsers = filteredByStatus.slice(indexOfFirstStatusUser, indexOfLastStatusUser);

  const hasRole = (requiredRoles) => {
    if (!user || !Array.isArray(user.accessRights)) return false;

    // Check if the user has any of the required roles
    const hasRequiredRole = requiredRoles.some(role => user.accessRights.includes(role));

    // Return true if the user has a required role or is an Admin
    return hasRequiredRole || user.role === 'Admin';
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" height="100vh"><CircularProgress /></Box>;
  if (error) return <Typography color="error" align="center">{error}</Typography>;
  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* All Users Table */}
      {hasRole(['View Users List', 'Delete User']) && (
        <>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h4" gutterBottom>All Users</Typography>
          </Box>


          {/* Search bar for All Users */}

          <TextField
            label="Search all users"
            variant="outlined"
            fullWidth
            margin="normal"
            value={searchAllUsers}
            onChange={(e) => setSearchAllUsers(e.target.value)}
          />



          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentAllUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Button startIcon={<Edit2 />} onClick={() => setEditingUser(user)} size="small" style={{ marginRight: '8px' }}>
                        View
                      </Button>
                      {hasRole(['Delete User']) && (
                        <Button startIcon={<Trash2 />} onClick={() => setDeleteConfirmation(user)} color="error" size="small">
                          Delete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>


          <Box mt={3} display="flex" justifyContent="center">
            <Pagination
              count={allUsersTotalPages}
              page={allUsersPage}
              onChange={handleAllUsersPageChange}
              variant="outlined"
              shape="rounded"
            />
          </Box>
        </>
      )}

      {hasRole(['Delete User Invitations', 'View Invitations List', 'Invite User']) && (
        <>
          <Box display="flex" justifyContent="space-between" alignItems="center" mt={4} mb={2}>
            <Typography variant="h4" gutterBottom>Invite Users</Typography>
            {hasRole(['Invite User']) && (
              <Button variant="contained" onClick={() => setInviteDialogOpen(true)}>
                Invite User
              </Button>
            )}
          </Box>

          {/* Tabs and Pending, Approved, Rejected tables */}
          <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} aria-label="user status tabs" sx={{ mt: 4 }}>
            <Tab label="Pending Requests" />
            <Tab label="Approved Requests" />
            <Tab label="Rejected Requests" />
          </Tabs>

          {/* Search bar for Status-based Users */}

          <TextField
            label={`Search ${selectedTab === 0 ? 'Pending' : selectedTab === 1 ? 'Approved' : 'Rejected'} users`}
            variant="outlined"
            fullWidth
            margin="normal"
            value={searchStatusUsers}
            onChange={(e) => setSearchStatusUsers(e.target.value)}
          />



          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
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
                    <TableCell>{user.status}</TableCell>
                    {selectedTab === 2 && <TableCell>{user.rejectionReason || 'N/A'}</TableCell>}
                    {selectedTab === 0 && (
                      <TableCell>
                        <Button startIcon={<Edit2 />} onClick={() => setEditingUser(user)} size="small" style={{ marginRight: '8px' }}>
                          Edit
                        </Button>
                        {hasRole(['Delete User Invitations']) && (
                          <Button startIcon={<Trash2 />} onClick={() => setDeleteConfirmation(user)} color="error" size="small">
                            {user.status === 'Pending' ? 'Cancel' : 'Delete'}
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>


          <Box mt={3} display="flex" justifyContent="center">
            <Pagination
              count={statusUsersTotalPages}
              page={statusUsersPage}
              onChange={handleStatusUsersPageChange}
              variant="outlined"
              shape="rounded"
            />
          </Box>
        </>
      )}

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
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Access Rights</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {editingUser?.accessRights && editingUser.accessRights.length > 0 ? (
                editingUser.accessRights.map((right, index) => (
                  <Chip key={index} label={right} color="secondary" />
                ))
              ) : (
                <Typography color="textSecondary">No specific access rights assigned</Typography>
              )}
            </Box>
          </Grid>

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
          <Button onClick={() => handleDeleteUser(deleteConfirmation.email, deleteConfirmation.status)} color="error">
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
            <InputLabel>Access Rights</InputLabel>
            <Select
              multiple
              value={newUser.accessRights}
              onChange={(e) => handleInputChange('accessRights', e.target.value)}
              renderValue={(selected) => selected.join(', ')}
              label="Access Rights"
            >
              {accessRights.map((right) => (
                <MenuItem key={right} value={right}>
                  <Checkbox checked={newUser.accessRights.indexOf(right) > -1} />
                  <ListItemText primary={right} />
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

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsUsers;
