class InquiryController {
    constructor(inquiryService) {
        this.inquiryService = inquiryService;
    }

    async getInquiriesFeedback(req, res) {
        const { userId } = req.params;
        try {
            const results = await this.inquiryService.fetchInquiriesFeedback(userId);
            res.status(200).json(results);
        } catch (error) {
            console.error('Error fetching inquiries and feedback:', error);
            res.status(500).json({
                error: 'Error fetching inquiries and feedback',
                details: error.message
            });
        }
    }

    async updateInquiryFeedback(req, res) {
        const { id } = req.params;
        const data = req.body;
        try {
            await this.inquiryService.updateInquiryFeedback(id, data, req.file);
            res.status(200).send('Inquiry/feedback updated successfully');
        } catch (error) {
            console.error('Error updating inquiry/feedback:', error);
            res.status(500).send('Error updating inquiry/feedback');
        }
    }

    async createInquiryFeedback(req, res) {
        const data = req.body;
        const { email } = data;

        if (!email) {
            return res.status(400).send('Email is required');
        }

        try {
            const docRef = await this.inquiryService.createInquiryFeedback(data, req.file);
            res.status(201).json({ id: docRef.id });
        } catch (error) {
            console.error('Error in createInquiryFeedback:', error);
            res.status(500).send('Error creating inquiry/feedback');
        }
    }

    async deleteInquiryFeedback(req, res) {
        const { id } = req.params;
        try {
            await this.inquiryService.deleteInquiryFeedback(id);
            res.status(200).json({ message: 'Inquiry/feedback deleted successfully' });
        } catch (error) {
            console.error('Error deleting inquiry/feedback:', error);
            res.status(500).json({ error: 'Error deleting inquiry/feedback' });
        }
    }
}

module.exports = InquiryController;