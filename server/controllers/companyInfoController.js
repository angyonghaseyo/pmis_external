const firebaseUtils = require('../utils/firebaseUtils');

const companyInfoController = {
  // Get company information
  async getCompanyInfo(req, res) {
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
  },

  // Update company information
  async updateCompanyInfo(req, res) {
    try {
      const userId = req.user.uid;
      const user = await firebaseUtils.getUser(userId);
      
      if (!user.company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      const updatedInfo = req.body;
      
      // Validate the updated information
      if (!updatedInfo.name || !updatedInfo.address) {
        return res.status(400).json({ error: 'Company name and address are required' });
      }

      await firebaseUtils.updateDocument('companies', user.company, updatedInfo);

      res.json({ message: 'Company information updated successfully' });
    } catch (error) {
      console.error('Error updating company info:', error);
      res.status(500).json({ error: 'Failed to update company information' });
    }
  },

  // Upload company logo
  async uploadCompanyLogo(req, res) {
    try {
      const userId = req.user.uid;
      const user = await firebaseUtils.getUser(userId);

      if (!user.company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const bucket = 'your-firebase-storage-bucket-name';
      const filePath = `company_logos/${user.company}_${Date.now()}_${req.file.originalname}`;
      const fileUrl = await firebaseUtils.uploadFile(bucket, filePath, req.file.buffer);

      await firebaseUtils.updateDocument('companies', user.company, { logoUrl: fileUrl });

      res.json({ message: 'Company logo uploaded successfully', logoUrl: fileUrl });
    } catch (error) {
      console.error('Error uploading company logo:', error);
      res.status(500).json({ error: 'Failed to upload company logo' });
    }
  }
};

module.exports = companyInfoController;