const firebaseUtils = require('../utils/firebaseUtils');

const userController = {
  // Get current user profile
  async getProfile(req, res) {
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
  },

  // Update user profile
  async updateProfile(req, res) {
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
  },

  // Get user settings
  async getSettings(req, res) {
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
  },

  // Update user settings
  async updateSettings(req, res) {
    try {
      const userId = req.user.uid;
      const updatedSettings = req.body;

      await firebaseUtils.updateDocument('user_settings', userId, updatedSettings);

      res.json({ message: 'User settings updated successfully' });
    } catch (error) {
      console.error('Error updating user settings:', error);
      res.status(500).json({ error: 'Failed to update user settings' });
    }
  },

  // Change password
  async changePassword(req, res) {
    try {
      const userId = req.user.uid;
      const { currentPassword, newPassword } = req.body;

      // Note: Verifying the current password should typically be done on the client-side
      // Firebase doesn't provide a server-side way to verify the current password

      await firebaseUtils.updateUserPassword(userId, newPassword);

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
};

module.exports = userController;