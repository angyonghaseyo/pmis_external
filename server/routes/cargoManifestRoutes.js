const express = require('express');
const router = express.Router();
const firebaseUtils = require('../utils/firebaseUtils');
const authMiddleware = require('../middleware/authMiddleware');

// Get all cargo manifests
router.get('/', authMiddleware, async (req, res) => {
  try {
    const manifests = await firebaseUtils.getDocuments('cargo_manifests');
    res.json(manifests);
  } catch (error) {
    console.error('Error fetching cargo manifests:', error);
    res.status(500).json({ error: 'Failed to fetch cargo manifests' });
  }
});

// Get a specific cargo manifest
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const manifest = await firebaseUtils.getDocument('cargo_manifests', req.params.id);
    if (!manifest) {
      return res.status(404).json({ error: 'Cargo manifest not found' });
    }
    res.json(manifest);
  } catch (error) {
    console.error('Error fetching cargo manifest:', error);
    res.status(500).json({ error: 'Failed to fetch cargo manifest' });
  }
});

// Create a new cargo manifest
router.post('/', authMiddleware, async (req, res) => {
  try {
    const manifestData = req.body;
    const manifestId = await firebaseUtils.addDocument('cargo_manifests', manifestData);
    res.status(201).json({ message: 'Cargo manifest created successfully', id: manifestId });
  } catch (error) {
    console.error('Error creating cargo manifest:', error);
    res.status(500).json({ error: 'Failed to create cargo manifest' });
  }
});

// Update a cargo manifest
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const manifestId = req.params.id;
    const manifestData = req.body;
    await firebaseUtils.updateDocument('cargo_manifests', manifestId, manifestData);
    res.json({ message: 'Cargo manifest updated successfully' });
  } catch (error) {
    console.error('Error updating cargo manifest:', error);
    res.status(500).json({ error: 'Failed to update cargo manifest' });
  }
});

// Delete a cargo manifest
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const manifestId = req.params.id;
    await firebaseUtils.deleteDocument('cargo_manifests', manifestId);
    res.json({ message: 'Cargo manifest deleted successfully' });
  } catch (error) {
    console.error('Error deleting cargo manifest:', error);
    res.status(500).json({ error: 'Failed to delete cargo manifest' });
  }
});

module.exports = router;