import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

import {
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    Box,
    Container,
    Paper
} from '@mui/material';

function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:5001/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const data = await response.json();
            const token = data.token;

            login(token);

        } catch (error) {
            console.log(error)
            console.error('Login error:', error);
            setLoading(false);
            setError('Failed to log in. Please try again.');
        }
    };

    return (
        <Box>
            <Container maxWidth="xs">
                <Paper elevation={3} sx={{ padding: 4, width: '100%', mt: 8 }}>
                    <Typography component="h1" variant="h4" gutterBottom>
                        🚢  Oceania PMIS
                    </Typography>
                    <Typography component="h2" variant="h6" gutterBottom>
                        Sign in to your account
                    </Typography>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Link to="/forgot-password" style={{ color: 'inherit' }}>Forgot Password?</Link>
                        </Box>
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            disabled={loading}
                            sx={{ mt: 3, mb: 2 }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Login'}
                        </Button>
                        <Box sx={{ mt: 2 }}>
                            Don't have an account?{' '}
                            <Link to="/signup" style={{ color: 'inherit' }}>Sign up</Link>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}

export default LoginForm;