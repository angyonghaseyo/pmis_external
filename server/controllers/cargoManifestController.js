const firebaseUtils = require('../utils/firebaseUtils');

const cargoManifestController = {
  // Get all cargo manifests
  async getAllManifests(req, res) {
    try {
      const manifests = await firebaseUtils.getDocuments('cargo_manifests');
      res.json(manifests);
    } catch (error) {
      console.error('Error fetching cargo manifests:', error);
      res.status(500).json({ error: 'Failed to fetch cargo manifests' });
    }
  },

  // Get a specific cargo manifest
  async getManifest(req, res) {
    try {
      const manifestId = req.params.id;
      const manifest = await firebaseUtils.getDocument('cargo_manifests', manifestId);
      
      if (!manifest) {
        return res.status(404).json({ error: 'Cargo manifest not found' });
      }

      res.json(manifest);
    } catch (error) {
      console.error('Error fetching cargo manifest:', error);
      res.status(500).json({ error: 'Failed to fetch cargo manifest' });
    }
  },

  // Create a new cargo manifest
  async createManifest(req, res) {
    try {
      const manifestData = req.body;
      
      // Basic validation
      if (!manifestData.vesselName || !manifestData.voyageNumber || !manifestData.cargoDetails) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      manifestData.createdBy = req.user.uid;
      manifestData.createdAt = new Date().toISOString();
      manifestData.status = 'Pending';

      const manifestId = await firebaseUtils.addDocument('cargo_manifests', manifestData);
      res.status(201).json({ message: 'Cargo manifest created successfully', id: manifestId });
    } catch (error) {
      console.error('Error creating cargo manifest:', error);
      res.status(500).json({ error: 'Failed to create cargo manifest' });
    }
  },

  // Update a cargo manifest
  async updateManifest(req, res) {
    try {
      const manifestId = req.params.id;
      const updatedData = req.body;
      
      const manifest = await firebaseUtils.getDocument('cargo_manifests', manifestId);
      
      if (!manifest) {
        return res.status(404).json({ error: 'Cargo manifest not found' });
      }

      // Check if the user has permission to update this manifest
      if (manifest.createdBy !== req.user.uid) {
        return res.status(403).json({ error: 'Unauthorized to update this manifest' });
      }

      updatedData.updatedAt = new Date().toISOString();

      await firebaseUtils.updateDocument('cargo_manifests', manifestId, updatedData);
      res.json({ message: 'Cargo manifest updated successfully' });
    } catch (error) {
      console.error('Error updating cargo manifest:', error);
      res.status(500).json({ error: 'Failed to update cargo manifest' });
    }
  },

  // Delete a cargo manifest
  async deleteManifest(req, res) {
    try {
      const manifestId = req.params.id;
      
      const manifest = await firebaseUtils.getDocument('cargo_manifests', manifestId);
      
      if (!manifest) {
        return res.status(404).json({ error: 'Cargo manifest not found' });
      }

      // Check if the user has permission to delete this manifest
      if (manifest.createdBy !== req.user.uid) {
        return res.status(403).json({ error: 'Unauthorized to delete this manifest' });
      }

      await firebaseUtils.deleteDocument('cargo_manifests', manifestId);
      res.json({ message: 'Cargo manifest deleted successfully' });
    } catch (error) {
      console.error('Error deleting cargo manifest:', error);
      res.status(500).json({ error: 'Failed to delete cargo manifest' });
    }
  },

  // Submit a cargo manifest for approval
  async submitManifest(req, res) {
    try {
      const manifestId = req.params.id;
      
      const manifest = await firebaseUtils.getDocument('cargo_manifests', manifestId);
      
      if (!manifest) {
        return res.status(404).json({ error: 'Cargo manifest not found' });
      }

      // Check if the user has permission to submit this manifest
      if (manifest.createdBy !== req.user.uid) {
        return res.status(403).json({ error: 'Unauthorized to submit this manifest' });
      }

      if (manifest.status !== 'Pending') {
        return res.status(400).json({ error: 'Manifest has already been submitted or approved' });
      }

      await firebaseUtils.updateDocument('cargo_manifests', manifestId, { 
        status: 'Submitted',
        submittedAt: new Date().toISOString()
      });

      res.json({ message: 'Cargo manifest submitted successfully' });
    } catch (error) {
      console.error('Error submitting cargo manifest:', error);
      res.status(500).json({ error: 'Failed to submit cargo manifest' });
    }
  }
};

module.exports = cargoManifestController;