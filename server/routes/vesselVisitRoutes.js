const express = require('express');
const router = express.Router();
const firebaseUtils = require('../utils/firebaseUtils');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Get all vessel visits
router.get('/', authMiddleware, async (req, res) => {
  try {
    const visits = await firebaseUtils.getDocuments('vessel_visits');
    res.json(visits);
  } catch (error) {
    console.error('Error fetching vessel visits:', error);
    res.status(500).json({ error: 'Failed to fetch vessel visits' });
  }
});

// Get a specific vessel visit
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const visitId = req.params.id;
    const visit = await firebaseUtils.getDocument('vessel_visits', visitId);
    
    if (!visit) {
      return res.status(404).json({ error: 'Vessel visit not found' });
    }

    res.json(visit);
  } catch (error) {
    console.error('Error fetching vessel visit:', error);
    res.status(500).json({ error: 'Failed to fetch vessel visit' });
  }
});

// Create a new vessel visit
router.post('/', authMiddleware, async (req, res) => {
  try {
    const visitData = req.body;
    visitData.createdBy = req.user.uid;
    visitData.createdAt = new Date().toISOString();
    visitData.status = 'Pending';

    const visitId = await firebaseUtils.addDocument('vessel_visits', visitData);
    res.status(201).json({ message: 'Vessel visit created successfully', id: visitId });
  } catch (error) {
    console.error('Error creating vessel visit:', error);
    res.status(500).json({ error: 'Failed to create vessel visit' });
  }
});

// Update a vessel visit
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const visitId = req.params.id;
    const updatedData = req.body;
    
    const visit = await firebaseUtils.getDocument('vessel_visits', visitId);
    
    if (!visit) {
      return res.status(404).json({ error: 'Vessel visit not found' });
    }

    await firebaseUtils.updateDocument('vessel_visits', visitId, updatedData);
    res.json({ message: 'Vessel visit updated successfully' });
  } catch (error) {
    console.error('Error updating vessel visit:', error);
    res.status(500).json({ error: 'Failed to update vessel visit' });
  }
});

// Delete a vessel visit
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const visitId = req.params.id;
    
    const visit = await firebaseUtils.getDocument('vessel_visits', visitId);
    
    if (!visit) {
      return res.status(404).json({ error: 'Vessel visit not found' });
    }

    await firebaseUtils.deleteDocument('vessel_visits', visitId);
    res.json({ message: 'Vessel visit deleted successfully' });
  } catch (error) {
    console.error('Error deleting vessel visit:', error);
    res.status(500).json({ error: 'Failed to delete vessel visit' });
  }
});

// Upload stowage plan
router.post('/:id/stowage-plan', authMiddleware, upload.single('stowagePlan'), async (req, res) => {
  try {
    const visitId = req.params.id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const visit = await firebaseUtils.getDocument('vessel_visits', visitId);
    
    if (!visit) {
      return res.status(404).json({ error: 'Vessel visit not found' });
    }

    const bucket = 'your-firebase-storage-bucket-name';
    const filePath = `stowage_plans/${visitId}_${Date.now()}_${req.file.originalname}`;
    const fileUrl = await firebaseUtils.uploadFile(bucket, filePath, req.file.buffer);

    await firebaseUtils.updateDocument('vessel_visits', visitId, { stowagePlanUrl: fileUrl });

    res.json({ message: 'Stowage plan uploaded successfully', fileUrl });
  } catch (error) {
    console.error('Error uploading stowage plan:', error);
    res.status(500).json({ error: 'Failed to upload stowage plan' });
  }
});

// Get stowage plan
router.get('/:id/stowage-plan', authMiddleware, async (req, res) => {
  try {
    const visitId = req.params.id;
    
    const visit = await firebaseUtils.getDocument('vessel_visits', visitId);
    
    if (!visit) {
      return res.status(404).json({ error: 'Vessel visit not found' });
    }

    if (!visit.stowagePlanUrl) {
      return res.status(404).json({ error: 'Stowage plan not found for this visit' });
    }

    res.json({ stowagePlanUrl: visit.stowagePlanUrl });
  } catch (error) {
    console.error('Error fetching stowage plan:', error);
    res.status(500).json({ error: 'Failed to fetch stowage plan' });
  }
});

module.exports = router;