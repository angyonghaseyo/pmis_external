onst express = require('express');
const router = express.Router();
const admin = require('../config/firebaseAdmin');

// Get user workspace data
router.get('/workspace', async (req, res) => {
  try {
    const userId = req.user.uid;
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    console.log("hi")
    // Construct and return the workspace data
    const workspaceData = {
      user: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        company: userData.company,
      },
      // Add more relevant data as needed
    };

    res.json(workspaceData);
  } catch (error) {
    console.error('Error fetching workspace data:', error);
    res.status(500).json({ error: 'Error fetching workspace data' });
  }
});

module.exports = router;