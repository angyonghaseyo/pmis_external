const { db } = require('../config/firebase');

class TrainingService {
    constructor(db) {
        this.db = db;
    }

    async fetchTrainingPrograms() {
        try {
            const programsRef = this.db.collection('training_programs');
            const programsSnapshot = await programsRef.get();
            return programsSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    startDate: data.startDate ? data.startDate.toDate() : null,
                    endDate: data.endDate ? data.endDate.toDate() : null
                };
            });
        } catch (error) {
            console.error('Error in fetchTrainingPrograms:', error);
            throw error;
        }
    }

    async registerForProgram(programId, userEmail) {
        try {
            // Get user document
            const usersRef = this.db.collection('users');
            const userSnapshot = await usersRef.where('email', '==', userEmail).get();

            if (userSnapshot.empty) {
                throw new Error('User not found');
            }

            const userDoc = userSnapshot.docs[0];
            const userData = userDoc.data();

            // Get program document
            const programRef = this.db.collection('training_programs').doc(programId);
            const programDoc = await programRef.get();

            if (!programDoc.exists) {
                throw new Error('Program not found');
            }

            const programData = programDoc.data();

            // Check capacity
            if (programData.numberOfCurrentRegistrations >= programData.participantCapacity) {
                throw new Error('Program is full');
            }

            // Check if already enrolled
            if (userData.enrolledPrograms?.some(program => program.programId === programId)) {
                throw new Error('Already enrolled in this program');
            }

            // Use transaction to ensure atomicity
            await this.db.runTransaction(async (transaction) => {
                // Update program registrations
                transaction.update(programRef, {
                    numberOfCurrentRegistrations: programData.numberOfCurrentRegistrations + 1
                });

                // Update user enrollments
                transaction.update(userDoc.ref, {
                    enrolledPrograms: [
                        ...(userData.enrolledPrograms || []),
                        {
                            programId: programId,
                            enrollmentDate: new Date(),
                            status: 'Enrolled'
                        }
                    ]
                });
            });

            return { success: true, message: 'Successfully registered for program' };
        } catch (error) {
            console.error('Error in registerForProgram:', error);
            throw error;
        }
    }

    async withdrawFromProgram(programId, userEmail) {
        try {
            // Get user document
            const usersRef = this.db.collection('users');
            const userSnapshot = await usersRef.where('email', '==', userEmail).get();

            if (userSnapshot.empty) {
                throw new Error('User not found');
            }

            const userDoc = userSnapshot.docs[0];
            const userData = userDoc.data();

            // Get program document
            const programRef = this.db.collection('training_programs').doc(programId);
            const programDoc = await programRef.get();

            if (!programDoc.exists) {
                throw new Error('Program not found');
            }

            const programData = programDoc.data();

            // Check if enrolled
            const enrollmentIndex = userData.enrolledPrograms?.findIndex(
                program => program.programId === programId
            );

            if (enrollmentIndex === -1) {
                throw new Error('Not enrolled in this program');
            }

            // Use transaction to ensure atomicity
            await this.db.runTransaction(async (transaction) => {
                // Update program registrations
                transaction.update(programRef, {
                    numberOfCurrentRegistrations: Math.max(0, programData.numberOfCurrentRegistrations - 1)
                });

                // Remove program from user's enrollments
                const updatedEnrollments = [...userData.enrolledPrograms];
                updatedEnrollments.splice(enrollmentIndex, 1);
                
                transaction.update(userDoc.ref, {
                    enrolledPrograms: updatedEnrollments
                });
            });

            return { success: true, message: 'Successfully withdrawn from program' };
        } catch (error) {
            console.error('Error in withdrawFromProgram:', error);
            throw error;
        }
    }

    async updateProgramCompletionStatus() {
        try {
            const now = new Date();
            
            // Get all users
            const usersSnapshot = await this.db.collection('users').get();
            
            // Process each user
            for (const userDoc of usersSnapshot.docs) {
                const userData = userDoc.data();
                if (!userData.enrolledPrograms?.length) continue;

                const updatedEnrollments = [];
                let needsUpdate = false;

                // Check each enrollment
                for (const enrollment of userData.enrolledPrograms) {
                    if (enrollment.status !== 'Enrolled') {
                        updatedEnrollments.push(enrollment);
                        continue;
                    }

                    // Get program details
                    const programDoc = await this.db.collection('training_programs')
                        .doc(enrollment.programId)
                        .get();

                    if (!programDoc.exists) {
                        updatedEnrollments.push(enrollment);
                        continue;
                    }

                    const programData = programDoc.data();
                    const endDate = programData.endDate.toDate();

                    if (endDate <= now) {
                        needsUpdate = true;
                        updatedEnrollments.push({
                            ...enrollment,
                            status: 'Completed',
                            completionDate: new Date()
                        });
                    } else {
                        updatedEnrollments.push(enrollment);
                    }
                }

                // Update user document if needed
                if (needsUpdate) {
                    await userDoc.ref.update({
                        enrolledPrograms: updatedEnrollments
                    });
                }
            }

            return { success: true, message: 'Successfully updated program completion status' };
        } catch (error) {
            console.error('Error in updateProgramCompletionStatus:', error);
            throw error;
        }
    }
}

module.exports = TrainingService;