import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth, sendPasswordResetEmail } from './firebaseConfig';
import {
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    Box,
    Paper,
    Container
} from '@mui/material';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await sendPasswordResetEmail(auth, email);
            setIsSubmitted(true);
        } catch (error) {
            console.error('Error sending reset email:', error);
            switch (error.code) {
                case 'auth/user-not-found':
                    setError('No user found with this email address.');
                    break;
                case 'auth/invalid-email':
                    setError('Invalid email address. Please check and try again.');
                    break;
                case 'auth/too-many-requests':
                    setError('Too many requests. Please try again later.');
                    break;
                default:
                    setError('Failed to send reset email. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleTryAgain = () => {
        setIsSubmitted(false);
        setEmail('');
    };

    if (isSubmitted) {
        return (
            <Container component="main" maxWidth="xs">
                <Paper elevation={3} sx={{ padding: 4, marginTop: 8 }}>
                    <Box mb={3}>
                        <Typography variant="h5" align="center" gutterBottom>🚢 Oceania PMIS</Typography>
                        <Typography variant="h6" align="center" gutterBottom>Reset password instructions have been sent to your inbox!</Typography>
                    </Box>
                    <Button variant="contained" fullWidth onClick={handleTryAgain}>
                        Send Again
                    </Button>
                    <Box mt={3} textAlign="center">
                        <Link to="/login">Back to Login</Link>
                    </Box>
                </Paper>
            </Container>
        );
    }

    return (
        <Container component="main" maxWidth="xs">
            <Paper elevation={3} sx={{ padding: 4, marginTop: 8 }}>
                <Box mb={3}>
                    <Typography variant="h5" align="center" gutterBottom sx={{ mb: 2 }}>🚢 Oceania PMIS</Typography>
                    <Typography variant="h6" align="center" gutterBottom sx={{ mb: 2 }}>Forgot Password?</Typography>
                    <Typography align="center" sx={{ mb: 3 }}>
                        Enter your email address and we will send you instructions to reset your password.
                    </Typography>
                </Box>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <form onSubmit={handleSubmit}>
                    <TextField
                        label="Email Address"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        disabled={isLoading}
                        sx={{ mt: 2 }}
                    >
                        {isLoading ? <CircularProgress size={24} /> : 'Send Reset Link'}
                    </Button>
                </form>
                <Box mt={3} textAlign="center">
                    Remember your password? <Link to="/login">Back to Login</Link>
                </Box>
            </Paper>
        </Container>
    );
}

export default ForgotPassword;
