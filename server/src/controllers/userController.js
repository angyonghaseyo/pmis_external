class UserController {
    constructor(userService) {
        this.userService = userService;
    }

    async register(req, res) {
        try {
            const { formData, photoFile } = req.body;
            await this.userService.registerUser(formData, photoFile);
            res.status(201).send('User registered successfully');
        } catch (error) {
            console.error("Error during sign up:", error);
            res.status(500).send(`Error during sign up: ${error.message}`);
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
            const token = await this.userService.loginUser(email, password);
            res.send({ token });
        } catch (error) {
            res.status(401).send('Invalid credentials');
        }
    }

    async getUserProfile(req, res) {
        const { uid } = req.params;
        try {
            const userProfile = await this.userService.fetchUserProfile(uid);
            if (!userProfile) {
                return res.status(404).send('User not found');
            }
            res.status(200).json(userProfile);
        } catch (error) {
            console.error('Error fetching user profile:', error);
            res.status(500).send('Error fetching user profile.');
        }
    }
    async updateUserProfile(req, res) {
        const { email, salutation, firstName, lastName, company, userType } = req.body;
        const photoFile = req.file;

        if (!email) {
            return res.status(400).send('Email is required');
        }

        try {
            await this.userService.updateUserProfile(email, salutation, firstName, lastName, company, userType, photoFile);
            res.status(200).send('Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            res.status(500).send('Failed to update profile: ' + error.message);
        }
    }

    async getUsers(req, res) {
        try {
            const { email } = req.query;
            if (!email) {
                return res.status(400).send('email is required');
            }
            const users = await this.userService.fetchUsers(email);
            res.status(200).json(users);
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).send('Error fetching users');
        }
    }

    async getAllUsersInCompany(req, res) {
        try {
            const { email } = req.query;
            if (!email) {
                return res.status(400).send('email is required');
            }
            const users = await this.userService.fetchAllUsersInCompany(email);
            res.status(200).json(users);
        } catch (error) {
            console.error('Error fetching users in company:', error);
            res.status(500).send('Error fetching users in company');
        }
    }

    async deleteUser(req, res) {
        try {
            const { email } = req.query;
            if (!email) {
                return res.status(400).send('Email is required');
            }
            await this.userService.deleteUser(email);
            res.status(200).send('User deleted successfully');
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).send('Error deleting user');
        }
    }

    async deleteUserAccount(req, res) {
        try {
            const email = req.headers['x-user-email'];
            if (!email) {
                return res.status(401).send('No authenticated user');
            }
            await this.userService.deleteUserAccount(email);
            res.status(200).send('User account deleted successfully');
        } catch (error) {
            console.error('Error deleting user account:', error);
            res.status(500).send('Error deleting user account');
        }
    }

    async inviteUser(req, res) {
        try {
            const userData = req.body;
            const invitationId = await this.userService.inviteUser(userData);
            res.status(201).json({ id: invitationId });
        } catch (error) {
            console.error('Error inviting user:', error);
            res.status(500).send('Error inviting user');
        }
    }

    async cancelInvitation(req, res) {
        try {
            const { invitationId } = req.params;
            await this.userService.cancelInvitation(invitationId);
            res.status(200).send('Invitation canceled successfully');
        } catch (error) {
            console.error('Error canceling invitation:', error);
            res.status(500).send('Error canceling invitation');
        }
    }

}

module.exports = UserController;
