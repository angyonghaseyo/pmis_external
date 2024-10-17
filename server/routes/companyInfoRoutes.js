const express = require('express');
const router = express.Router();
const firebaseUtils = require('../utils/firebaseUtils');
const authMiddleware = require('../middleware/authMiddleware');

// Get company information
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const user = await firebaseUtils.getUser(userId);
    
    if (!user.company) {
      return res.status(404).json({ error: 'Company information not found' });
    }

    const companyInfo = await firebaseUtils.getDocument('companies', user.company);
    
    if (!companyInfo) {
      return res.status(404).json({ error: 'Company information not found' });
    }

    res.json(companyInfo);
  } catch (error) {
    console.error('Error fetching company info:', error);
    res.status(500).json({ error: 'Failed to fetch company information' });
  }
});

// Update company information
router.put('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const user = await firebaseUtils.getUser(userId);
    
    if (!user.company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const updatedInfo = req.body;
    await firebaseUtils.updateDocument('companies', user.company, updatedInfo);

    res.json({ message: 'Company information updated successfully' });
  } catch (error) {
    console.error('Error updating company info:', error);
    res.status(500).json({ error: 'Failed to update company information' });
  }
});

module.exports = router;