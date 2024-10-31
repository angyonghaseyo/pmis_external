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
            res.status(500).send('Error fetching training programs.');
        }
    }
}

module.exports = TrainingController;