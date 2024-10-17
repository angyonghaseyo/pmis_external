const express = require('express');
const router = express.Router();
const firebaseUtils = require('../utils/firebaseUtils');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Get current user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const user = await firebaseUtils.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove sensitive information
    delete user.password;
    delete user.email; // If you want to keep email private

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.put('/profile', authMiddleware, upload.single('profilePhoto'), async (req, res) => {
  try {
    const userId = req.user.uid;
    const { firstName, lastName, company } = req.body;

    let photoURL = null;
    if (req.file) {
      const bucket = 'your-firebase-storage-bucket-name';
      const filePath = `profile_photos/${userId}_${Date.now()}_${req.file.originalname}`;
      photoURL = await firebaseUtils.uploadFile(bucket, filePath, req.file.buffer);
    }

    const updateData = {
      firstName,
      lastName,
      company,
      ...(photoURL && { photoURL })
    };

    await firebaseUtils.updateUser(userId, updateData);

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Get user settings
router.get('/settings', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const userSettings = await firebaseUtils.getDocument('user_settings', userId);
    
    if (!userSettings) {
      return res.status(404).json({ error: 'User settings not found' });
    }

    res.json(userSettings);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ error: 'Failed to fetch user settings' });
  }
});

// Update user settings
router.put('/settings', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const updatedSettings = req.body;

    await firebaseUtils.updateDocument('user_settings', userId, updatedSettings);

    res.json({ message: 'User settings updated successfully' });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ error: 'Failed to update user settings' });
  }
});

// Change password
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { currentPassword, newPassword } = req.body;

    // Verify current password (this would typically be done by re-authenticating the user)
    // For security reasons, Firebase doesn't provide a way to verify the current password server-side
    // You might want to handle this on the client-side instead

    await firebaseUtils.updateUserPassword(userId, newPassword);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;