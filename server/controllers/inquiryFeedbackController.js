const firebaseUtils = require('../utils/firebaseUtils');

const inquiryFeedbackController = {
  // Get all inquiries and feedback for the user
  async getAllInquiriesFeedback(req, res) {
    try {
      const userId = req.user.uid;
      const inquiries = await firebaseUtils.getDocuments('inquiries_feedback', [
        { field: 'userId', operator: '==', value: userId }
      ]);
      res.json(inquiries);
    } catch (error) {
      console.error('Error fetching inquiries and feedback:', error);
      res.status(500).json({ error: 'Failed to fetch inquiries and feedback' });
    }
  },

  // Get a specific inquiry or feedback
  async getInquiryFeedback(req, res) {
    try {
      const inquiryId = req.params.id;
      const inquiry = await firebaseUtils.getDocument('inquiries_feedback', inquiryId);
      
      if (!inquiry) {
        return res.status(404).json({ error: 'Inquiry or feedback not found' });
      }

      if (inquiry.userId !== req.user.uid) {
        return res.status(403).json({ error: 'Unauthorized access' });
      }

      res.json(inquiry);
    } catch (error) {
      console.error('Error fetching inquiry or feedback:', error);
      res.status(500).json({ error: 'Failed to fetch inquiry or feedback' });
    }
  },

  // Create a new inquiry or feedback
  async createInquiryFeedback(req, res) {
    try {
      const { type, subject, description, urgency } = req.body;
      const userId = req.user.uid;

      let fileUrl = null;
      if (req.file) {
        const bucket = 'your-firebase-storage-bucket-name';
        const filePath = `inquiries_feedback/${Date.now()}_${req.file.originalname}`;
        fileUrl = await firebaseUtils.uploadFile(bucket, filePath, req.file.buffer);
      }

      const inquiryData = {
        type,
        subject,
        description,
        urgency,
        userId,
        fileUrl,
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      const inquiryId = await firebaseUtils.addDocument('inquiries_feedback', inquiryData);
      res.status(201).json({ message: 'Inquiry or feedback created successfully', id: inquiryId });
    } catch (error) {
      console.error('Error creating inquiry or feedback:', error);
      res.status(500).json({ error: 'Failed to create inquiry or feedback' });
    }
  },

  // Update an inquiry or feedback
  async updateInquiryFeedback(req, res) {
    try {
      const inquiryId = req.params.id;
      const updatedData = req.body;
      
      const inquiry = await firebaseUtils.getDocument('inquiries_feedback', inquiryId);
      
      if (!inquiry) {
        return res.status(404).json({ error: 'Inquiry or feedback not found' });
      }

      if (inquiry.userId !== req.user.uid) {
        return res.status(403).json({ error: 'Unauthorized access' });
      }

      await firebaseUtils.updateDocument('inquiries_feedback', inquiryId, updatedData);
      res.json({ message: 'Inquiry or feedback updated successfully' });
    } catch (error) {
      console.error('Error updating inquiry or feedback:', error);
      res.status(500).json({ error: 'Failed to update inquiry or feedback' });
    }
  },

  // Delete an inquiry or feedback
  async deleteInquiryFeedback(req, res) {
    try {
      const inquiryId = req.params.id;
      
      const inquiry = await firebaseUtils.getDocument('inquiries_feedback', inquiryId);
      
      if (!inquiry) {
        return res.status(404).json({ error: 'Inquiry or feedback not found' });
      }

      if (inquiry.userId !== req.user.uid) {
        return res.status(403).json({ error: 'Unauthorized access' });
      }

      await firebaseUtils.deleteDocument('inquiries_feedback', inquiryId);

      if (inquiry.fileUrl) {
        const bucket = 'your-firebase-storage-bucket-name';
        const filePath = inquiry.fileUrl.split('/').pop();
        await firebaseUtils.deleteFile(bucket, `inquiries_feedback/${filePath}`);
      }

      res.json({ message: 'Inquiry or feedback deleted successfully' });
    } catch (error) {
      console.error('Error deleting inquiry or feedback:', error);
      res.status(500).json({ error: 'Failed to delete inquiry or feedback' });
    }
  },

  // Add a reply to an inquiry or feedback
  async addReply(req, res) {
    try {
      const inquiryId = req.params.id;
      const { reply } = req.body;
      const userId = req.user.uid;

      const inquiry = await firebaseUtils.getDocument('inquiries_feedback', inquiryId);

      if (!inquiry) {
        return res.status(404).json({ error: 'Inquiry or feedback not found' });
      }

      if (inquiry.userId !== userId) {
        return res.status(403).json({ error: 'Unauthorized access' });
      }

      const updatedData = {
        replies: [...(inquiry.replies || []), { userId, reply, createdAt: new Date().toISOString() }]
      };

      await firebaseUtils.updateDocument('inquiries_feedback', inquiryId, updatedData);
      res.json({ message: 'Reply added successfully' });
    } catch (error) {
      console.error('Error adding reply:', error);
      res.status(500).json({ error: 'Failed to add reply' });
    }
  }
};

module.exports = inquiryFeedbackController;