class TrainingController {
    constructor(trainingService) {
        this.trainingService = trainingService;
    }

    async getTrainingPrograms(req, res) {
        try {
            const programs = await this.trainingService.fetchTrainingPrograms();
            res.status(200).json(programs);
        } catch (error) {
            console.error('Error fetching training programs:', error);
            res.status(500).json({ 
                error: 'Error fetching training programs',
                details: error.message 
            });
        }
    }

    async registerForProgram(req, res) {
        try {
            const { programId } = req.params;
            const { userEmail } = req.body;

            if (!userEmail) {
                return res.status(400).json({ error: 'User email is required' });
            }

            const result = await this.trainingService.registerForProgram(programId, userEmail);
            res.status(200).json(result);
        } catch (error) {
            console.error('Error registering for program:', error);
            res.status(500).json({ 
                error: 'Error registering for training program',
                details: error.message 
            });
        }
    }

    async withdrawFromProgram(req, res) {
        try {
            const { programId } = req.params;
            const { userEmail } = req.body;

            if (!userEmail) {
                return res.status(400).json({ error: 'User email is required' });
            }

            const result = await this.trainingService.withdrawFromProgram(programId, userEmail);
            res.status(200).json(result);
        } catch (error) {
            console.error('Error withdrawing from program:', error);
            res.status(500).json({ 
                error: 'Error withdrawing from training program',
                details: error.message 
            });
        }
    }

    async updateProgramCompletionStatus(req, res) {
        try {
            const result = await this.trainingService.updateProgramCompletionStatus();
            res.status(200).json(result);
        } catch (error) {
            console.error('Error updating program completion status:', error);
            res.status(500).json({ 
                error: 'Error updating program completion status',
                details: error.message 
            });
        }
    }
}

module.exports = TrainingController;