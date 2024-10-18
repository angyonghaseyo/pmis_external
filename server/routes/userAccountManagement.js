const express = require('express');
const router = express.Router();
const admin = require('../config/firebase-admin');

// Helper function to check if user is an admin
const isAdmin = async (uid) => {
  const userDoc = await admin.firestore().collection('users').doc(uid).get();
  return userDoc.exists && userDoc.data().userType === 'Admin';
};

// Middleware to check if the user is an admin
const adminCheck = async (req, res, next) => {
  try {
    const isUserAdmin = await isAdmin(req.user.uid);
    if (isUserAdmin) {
      next();
    } else {
      res.status(403).json({ error: 'Unauthorized access' });
    }
  } catch (error) {
    console.error('Error checking user permissions:', error);
    res.status(500).json({ error: 'Error checking user permissions' });
  }
};

// Get all users and invitations (admin only)
router.get('/users', adminCheck, async (req, res) => {
  try {
    const usersSnapshot = await admin.firestore().collection('users')
      .where('company', '==', req.user.company)
      .get();
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), status: 'Active' }));

    const invitationsSnapshot = await admin.firestore().collection('invitations')
      .where('company', '==', req.user.company)
      .where('status', '==', 'Pending')
      .get();
    const invitations = invitationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), status: 'Pending' }));

    res.json([...users, ...invitations]);
  } catch (error) {
    console.error('Error fetching users and invitations:', error);
    res.status(500).json({ error: 'Error fetching users and invitations' });
  }
});

// Create a new user (admin only)
router.post('/users', adminCheck, async (req, res) => {
  try {
    const { email, password, firstName, lastName, teams, userType } = req.body;
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email,
      firstName,
      lastName,
      company: req.user.company,
      userType: userType || 'Normal',
      teams
    });
    res.status(201).json({ message: 'User created successfully', userId: userRecord.uid });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Update a user or invitation (admin only)
router.put('/users/:userId', adminCheck, async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, teams, userType, status } = req.body;
    
    if (status === 'Pending') {
      await admin.firestore().collection('invitations').doc(userId).update({ 
        firstName, 
        lastName, 
        teams,
        userType
      });
    } else {
      await admin.firestore().collection('users').doc(userId).update({ 
        firstName, 
        lastName, 
        teams,
        userType
      });
    }
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Error updating user' });
  }
});

// Delete a user or cancel an invitation (admin only)
router.delete('/users/:userId', adminCheck, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    if (status === 'Pending') {
      await admin.firestore().collection('invitations').doc(userId).delete();
      res.json({ message: 'Invitation cancelled successfully' });
    } else {
      await admin.auth().deleteUser(userId);
      await admin.firestore().collection('users').doc(userId).delete();
      res.json({ message: 'User deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting user or cancelling invitation:', error);
    res.status(500).json({ error: 'Error deleting user or cancelling invitation' });
  }
});

// Invite a new user (admin only)
router.post('/invite', adminCheck, async (req, res) => {
  try {
    const { email, firstName, lastName, teams, userType } = req.body;
    
    // Check if the user already exists
    const existingUserSnapshot = await admin.firestore().collection('users')
      .where('email', '==', email)
      .where('company', '==', req.user.company)
      .get();
    
    if (!existingUserSnapshot.empty) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Check if there's already a pending invitation
    const existingInvitationSnapshot = await admin.firestore().collection('invitations')
      .where('email', '==', email)
      .where('company', '==', req.user.company)
      .where('status', '==', 'Pending')
      .get();
    
    if (!existingInvitationSnapshot.empty) {
      return res.status(400).json({ error: 'An invitation for this email is already pending' });
    }

    // Create a new invitation document
    const invitationRef = await admin.firestore().collection('invitations').add({
      email,
      firstName,
      lastName,
      company: req.user.company,
      userType: userType || 'Normal',
      teams,
      status: 'Pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      invitedBy: req.user.uid
    });

    // Here you would typically send an email invitation
    // For this example, we'll just log it
    console.log(`Invitation sent to ${email}`);

    res.status(201).json({ message: 'Invitation sent successfully', invitationId: invitationRef.id });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ error: 'Error sending invitation' });
  }
});

// Get all invitations (admin only)
router.get('/invitations', adminCheck, async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('invitations')
      .where('company', '==', req.user.company)
      .get();
    const invitations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ error: 'Error fetching invitations' });
  }
});

// Cancel an invitation (admin only)
router.delete('/invitations/:invitationId', adminCheck, async (req, res) => {
  try {
    const { invitationId } = req.params;
    await admin.firestore().collection('invitations').doc(invitationId).delete();
    res.json({ message: 'Invitation cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    res.status(500).json({ error: 'Error cancelling invitation' });
  }
});

// Accept an invitation (for invited users)
router.post('/accept-invitation', async (req, res) => {
  try {
    const { invitationId, password } = req.body;
    
    // Get the invitation
    const invitationDoc = await admin.firestore().collection('invitations').doc(invitationId).get();
    
    if (!invitationDoc.exists) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    const invitationData = invitationDoc.data();

    if (invitationData.status !== 'Pending') {
      return res.status(400).json({ error: 'Invitation is no longer valid' });
    }

    // Create the user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: invitationData.email,
      password: password,
      displayName: `${invitationData.firstName} ${invitationData.lastName}`,
    });

    // Create the user document in Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email: invitationData.email,
      firstName: invitationData.firstName,
      lastName: invitationData.lastName,
      company: invitationData.company,
      userType: invitationData.userType,
      teams: invitationData.teams
    });

    // Delete the invitation
    await admin.firestore().collection('invitations').doc(invitationId).delete();

    res.status(201).json({ message: 'Account created successfully' });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: 'Error accepting invitation' });
  }
});

module.exports = router;