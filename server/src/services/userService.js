const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const path = require('path');

const storage = new Storage({
    projectId: 'your-project-id',
    keyFilename: path.join(__dirname, '../../config/serviceAccountKey.json')
});

const bucket = storage.bucket('pmis-47493.appspot.com');
const JWT_SECRET = 'your_jwt_secret'; // Replace with a strong secret key

class UserService {
    constructor(db) {
        this.db = db;
    }

    async fetchUserProfile(email) {
        const userQuery = await this.db.collection('users').where('email', '==', email).get();
        if (userQuery.empty) {
            return null;
        }
        const userDoc = userQuery.docs[0];
        return userDoc.data();
    }

    async registerUser(formData, photoFile) {
        let photoURL = '';
        if (photoFile) {
            const fileExtension = photoFile.originalname.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
            const fileRef = bucket.file(`profile_photos/${fileName}`);
            await fileRef.save(photoFile.buffer, {
                metadata: { contentType: photoFile.mimetype },
            });
            photoURL = `https://storage.googleapis.com/${bucket.name}/profile_photos/${fileName}`;
        }

        const companyRef = this.db.collection('companies').doc(formData.company);
        const companyDoc = await companyRef.get();

        if (companyDoc.exists) {
            await companyRef.update({
                userCount: admin.firestore.FieldValue.increment(1)
            });
        } else {
            await companyRef.set({
                name: formData.company,
                userCount: 1
            });
        }

        await this.db.collection('users').add({
            email: formData.email,
            firstName: formData.firstName,
            password: formData.password,
            lastName: formData.lastName,
            salutation: formData.salutation,
            photoURL: photoURL,
            company: formData.company,
            teams: JSON.parse(formData.teams),
            userType: 'Normal',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }

    async loginUser(email, password) {
        const userQuery = await this.db.collection('users').where('email', '==', email).get();
        if (userQuery.empty) {
            throw new Error('Invalid credentials');
        }

        const userDoc = userQuery.docs[0];
        const userData = userDoc.data();
        const isPasswordValid = await userData.password == password;
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        const token = jwt.sign({ email, accessRights: userData.accessRights, enrolledPrograms: userData?.enrolledPrograms, company: userData.company, firstName: userData?.firstName, photo: userData?.photoURL }, JWT_SECRET, { expiresIn: '24h' });
        return token;
    }

    async updateUserProfile(email, salutation, firstName, lastName, company, userType, photoFile) {
        let photoURL = '';

        const userQuery = await this.db.collection('users').where('email', '==', email).get();
        if (userQuery.empty) {
            throw new Error('User not found');
        }

        const userDoc = userQuery.docs[0];
        const userId = userDoc.id;

        if (photoFile) {
            const fileExtension = photoFile.originalname.split('.').pop();
            const currentDateTime = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `${currentDateTime}.${fileExtension}`;

            const fileRef = bucket.file(`profile_photos/${fileName}`);
            await fileRef.save(photoFile.buffer, {
                metadata: { contentType: photoFile.mimetype },
            });
            photoURL = `https://storage.googleapis.com/${bucket.name}/profile_photos/${fileName}`;
            await fileRef.makePublic();
        } else {
            photoURL = userDoc.data().photoURL;
        }

        const fullName = `${salutation} ${firstName} ${lastName}`.trim();
        const updatedProfile = {
            displayName: fullName,
            photoURL: photoURL,
        };

        const userDocRef = this.db.collection('users').doc(userId);
        await userDocRef.update({
            salutation: salutation,
            firstName: firstName,
            lastName: lastName,
            displayName: fullName,
            photoURL: photoURL,
            company: company,
            userType: userType,
        });
    }

    async fetchUsers(email) {
        const userQuery = await this.db.collection('users').where('email', '==', email).get();
        if (userQuery.empty) {
            throw new Error('not found');
        }

        const userDoc = userQuery.docs[0];
        const currentUserData = userDoc.data();

        if (!currentUserData || !currentUserData.company) {
            throw new Error('User company information not found');
        }

        const usersQuery = this.db.collection('users').where('company', '==', currentUserData.company);
        const usersSnapshot = await usersQuery.get();
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), status: 'Active' }));

        const invitationsQuery = this.db.collection('invitations')
            .where('company', '==', currentUserData.company)
            .where('status', 'in', ['Pending', 'Approved', 'Rejected']);
        const invitationsSnapshot = await invitationsQuery.get();
        const invitationUsers = invitationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            status: doc.data().status === 'Rejected' ? 'Rejected' : doc.data().status === 'Approved' ? 'Approved' : 'Pending',
        }));

        return [...users, ...invitationUsers];
    }

    async fetchAllUsersInCompany(email) {
        const userQuery = await this.db.collection('users').where('email', '==', email).get();
        if (userQuery.empty) {
            throw new Error('not found');
        }

        const userDoc = userQuery.docs[0];
        const currentUserData = userDoc.data();

        if (!currentUserData || !currentUserData.company) {
            throw new Error('User company information not found');
        }

        const usersQuery = this.db.collection('users').where('company', '==', currentUserData.company);
        const usersSnapshot = await usersQuery.get();
        return usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async deleteUser(email) {
        const usersRef = this.db.collection('users');
        const querySnapshot = await usersRef.where('email', '==', email).get();

        if (querySnapshot.empty) {
            throw new Error('User not found');
        }

        const userDoc = querySnapshot.docs[0];
        await userDoc.ref.delete();
    }

    async deleteUserAccount(email) {
        const usersRef = this.db.collection('users');
        const querySnapshot = await usersRef.where('email', '==', email).get();
        const userDoc = querySnapshot.docs[0];
        await userDoc.ref.delete();
    }

    async inviteUser(userData) {
        const invitationRef = await this.db.collection('invitations').add({
            ...userData,
            userType: 'Normal',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'Pending'
        });
        return invitationRef.id;
    }

    async cancelInvitation(invitationId) {
        await this.db.collection('invitations').doc(invitationId).delete();
    }
}

module.exports = UserService;