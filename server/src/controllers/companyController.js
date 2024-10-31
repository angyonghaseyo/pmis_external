class CompanyController {
    constructor(companyService) {
        this.companyService = companyService;
    }

    async getCompanyData(req, res) {
        const { companyName } = req.query; // Assuming companyName is passed as a query parameter
        if (!companyName) {
            return res.status(400).send('Company name is required');
        }

        try {
            const companyData = await this.companyService.fetchCompanyData(companyName);
            if (!companyData) {
                return res.status(404).send('Company not found');
            }
            res.status(200).json({ ...companyData, name: companyName });
        } catch (error) {
            console.error('Error fetching company data:', error);
            res.status(500).send('Error fetching company data');
        }
    }

    async updateCompanyData(req, res) {
        const { companyName } = req.params;
        const data = req.body;

        if (!companyName) {
            return res.status(400).send('Company name is required');
        }

        try {
            await this.companyService.updateCompanyData(companyName, data);
            res.status(200).send('Company information updated successfully');
        } catch (error) {
            console.error('Error updating company info:', error);
            res.status(500).send(`Failed to update company information: ${error.message}`);
        }
    }
}

module.exports = CompanyController;