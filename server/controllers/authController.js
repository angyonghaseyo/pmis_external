const firebaseUtils = require('../utils/firebaseUtils');
const { validateEmail, validatePassword } = require('../utils/validators');

const authController = {
  // User Registration
  async register(req, res) {
    try {
      const { email, password, firstName, lastName, company } = req.body;

      if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      if (!validatePassword(password)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long and contain at least one number, one uppercase and one lowercase letter' });
      }

      const existingUser = await firebaseUtils.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }

      const userData = {
        email,
        password,
        displayName: `${firstName} ${lastName}`,
        firstName,
        lastName,
        company,
      };
      
      const userRecord = await firebaseUtils.createUser(userData);
      res.status(201).json({ message: 'User registered successfully', uid: userRecord.uid });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  },

  // User Login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const userCredential = await firebaseUtils.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      const customToken = await firebaseUtils.createCustomToken(user.uid);

      res.json({ 
        message: 'Login successful', 
        token: customToken,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({ error: 'Invalid email or password' });
    }
  },

  // User Logout
  async logout(req, res) {
    try {
      // Since Firebase handles token invalidation on the client-side,
      // we'll just send a success response here.
      // The client should handle clearing the token from storage.
      res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Failed to logout' });
    }
  },

  // Password Reset Request
  async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;
      await firebaseUtils.sendPasswordResetEmail(email);
      res.json({ message: 'Password reset email sent' });
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({ error: 'Failed to send password reset email' });
    }
  },

  // Confirm Password Reset
  async confirmPasswordReset(req, res) {
    try {
      const { oobCode, newPassword } = req.body;
      await firebaseUtils.confirmPasswordReset(oobCode, newPassword);
      res.json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Password reset confirmation error:', error);
      res.status(400).json({ error: 'Invalid or expired password reset code' });
    }
  }
};

module.exports = authController;