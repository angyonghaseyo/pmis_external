import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
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

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const ResetPassword = () => {
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetSuccessful, setResetSuccessful] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const oobCode = new URLSearchParams(location.search).get('oobCode');
        if (oobCode) {
            verifyResetCode(oobCode);
        } else {
            setError('No reset code found. Please try resetting your password again.');
        }
    }, [location]);

    const verifyResetCode = async (oobCode) => {
        try {
            const response = await axios.post(`${API_URL}/auth/verify-reset-code`, { oobCode });
            setEmail(response.data.email);
        } catch (error) {
            console.error('Error verifying reset code:', error);
            setError('Invalid or expired reset link. Please try again.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        setIsLoading(true);
        const oobCode = new URLSearchParams(location.search).get('oobCode');

        try {
            await axios.post(`${API_URL}/auth/reset-password`, {
                oobCode,
                newPassword
            });
            setResetSuccessful(true);
        } catch (error) {
            console.error('Error resetting password:', error);
            setError('Failed to reset password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (resetSuccessful) {
        return (
            <Container component="main" maxWidth="xs">
                <Paper elevation={3} sx={{ padding: 4, marginTop: 8 }}>
                    <Box mb={3}>
                        <Typography variant="h5" align="center" gutterBottom>🚢 Oceania PMIS</Typography>
                        <Typography variant="h6" align="center" gutterBottom>Password Reset Successful!</Typography>
                    </Box>
                    <Button variant="contained" fullWidth onClick={() => navigate('/login')}>
                        Proceed to Login
                    </Button>
                </Paper>
            </Container>
        );
    }

    return (
        <Container component="main" maxWidth="xs">
            <Paper elevation={3} sx={{ padding: 4, marginTop: 8 }}>
                <Box mb={3}>
                    <Typography variant="h5" align="center" gutterBottom>🚢 Oceania PMIS</Typography>
                    <Typography variant="h6" align="center" gutterBottom>Reset Password</Typography>
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
                        disabled
                    />
                    <TextField
                        label="New Password"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                    <TextField
                        label="Confirm New Password"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                        {isLoading ? <CircularProgress size={24} /> : 'Reset Password'}
                    </Button>
                </form>
            </Paper>
        </Container>
    );
};

export default ResetPassword;